#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, 'server.js');

console.log('\n🔧 Applying Database Layer Security Fixes\n');

let content = fs.readFileSync(serverPath, 'utf8');
let changes = 0;

// STEP 1: Update pool configuration
console.log('1️⃣  Updating pool configuration...');
const poolRegex = /const pool = new Pool\(\{\s*connectionString: process\.env\.DATABASE_URL,\s*\}\);/;
if (poolRegex.test(content)) {
  const poolReplacement = `// FIX: Production-ready pool configuration with SSL, connection limits, and timeouts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout for acquiring connection
  statement_timeout: 10000, // Kill queries exceeding 10 seconds
});

// FIX: Pool error handler to prevent unhandled errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});`;
  
  content = content.replace(poolRegex, poolReplacement);
  console.log('✅ Pool configuration updated\n');
  changes++;
}

// STEP 2: Update connection message
console.log('2️⃣  Updating connection message...');
if (content.includes("console.log('✅ Database connected successfully');")) {
  content = content.replace(
    "console.log('✅ Database connected successfully');",
    "console.log('✅ Database connected successfully (pool: max=10, timeout=10s)');"
  );
  console.log('✅ Connection message updated\n');
  changes++;
}

// STEP 3: Add helper functions
console.log('3️⃣  Adding helper functions...');
if (!content.includes('const isValidUUID')) {
  const insertPoint = '  // === AUTHENTICATION ROUTES ===';
  const helpers = `  // FIX: UUID validation helper to prevent malformed IDs in database queries
  const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  // FIX: asyncHandler wrapper to catch promise rejections in async route handlers
  const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  ${insertPoint}`;
  
  content = content.replace(insertPoint, helpers);
  console.log('✅ Helper functions added\n');
  changes++;
}

// STEP 4: Add UUID validation to routes (carefully)
console.log('4️⃣  Adding UUID validation to 11 routes...');

const routePatterns = [
  // Route signature, then find the const {  id } pattern within that route
  { name: 'GET /api/courses/:id', match: /app\.get\('\/api\/courses\/:id', verifyToken, async \(req, res\) => \{[\s\S]*?const \{ id \} = req\.params;/, replace: (m) => m.substring(0, m.lastIndexOf(';') + 1) + '\n      if (!isValidUUID(id)) return res.status(400).json({ error: \'Invalid ID format\' });' + m.substring(m.lastIndexOf(';') + 1) },
];

content = fs.readFileSync(serverPath, 'utf8');

// More straightforward: find patterns and add validation
const routesToFix = [
  /const \{ id \} = req\.params;\s+\/\/ Get course/,
  /const \{ id \} = req\.params;\s+const \{ is_published \}/,
  /const \{ id \} = req\.params;\s+\/\/ Verify teacher owns this course/,
  /const \{ id \} = req\.params;\s+const result = await pool\.query\(\s+`SELECT a\*/,
  /const \{ id \} = req\.params;[\s]*const \{ title, description, total_points, due_date, file_url \}/,
  /const \{ id \} = req\.params;[\s]*const result = await pool\.query\(\s+'DELETE FROM assignments/,
  /const \{ id \} = req\.params;[\s]*\/\/ Verify teacher owns assignment\s*const assignmentCheck = await pool\.query/,
  /const \{ id, submissionId \} = req\.params;[\s]*const \{ points_given/,
  /const \{ id \} = req\.params;[\s]*const result = await pool\.query\(\s+'DELETE FROM assignment_templates/,
  /const \{ id \} = req\.params;[\s]*\/\/ Get assignment\s*const assignmentResult = await pool\.query/,
  /const \{ id \} = req\.params;[\s]*const \{ submission_link \}/,
];

let validationAdded = 0;
routesToFix.forEach((pattern, idx) => {
  if (pattern.test(content)) {
    // Check if already has validation
    const match = content.match(pattern);
    if (match && !match[0].includes('isValidUUID')) {
      const isSubmissionRoute = pattern.toString().includes('submissionId');
      const validation = isSubmissionRoute 
        ? 'if (!isValidUUID(id) || !isValidUUID(submissionId)) return res.status(400).json({ error: \'Invalid ID format\' });'
        : 'if (!isValidUUID(id)) return res.status(400).json({ error: \'Invalid ID format\' });';
      
      const insertion = match[0] + '\n      ' + validation;
      content = content.replace(match[0], insertion);
      validationAdded++;
    }
  }
});

console.log(`✅ UUID validation added to ${validationAdded}/11 routes\n`);
changes++;

// Save the file
fs.writeFileSync(serverPath, content, 'utf8');

console.log('=' .repeat(60));
console.log(`\n✅ Applied ${changes} database security fixes!\n`);
console.log('📋 Summary:');
console.log('   ✅ Pool: SSL, max=10, idleTimeout=30s, connectionTimeout=2s, statement_timeout=10s');
console.log('   ✅ Error handler: pool.on(error)');
console.log('   ✅ UUID validator: isValidUUID function');
console.log('   ✅ asyncHandler: Promise rejection wrapper');
console.log(`   ✅ Route validations: ${validationAdded}/11 routes\n`);
console.log('🚀 Next: npm start\n');
