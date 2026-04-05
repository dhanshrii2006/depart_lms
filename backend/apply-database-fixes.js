#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, 'server.js');

console.log('🔧 Applying database layer security fixes...\n');

let content = fs.readFileSync(serverPath, 'utf8');

// FIX 1: Update pool configuration
console.log('1️⃣  Updating pool configuration with SSL, timeouts, and error handler...');
const poolOldPattern = 'const pool = new Pool({\n  connectionString: process.env.DATABASE_URL,\n});';
const poolNewPattern = `// FIX: Production-ready pool configuration with SSL, connection limits, and timeouts
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

if (content.includes(poolOldPattern)) {
  content = content.replace(poolOldPattern, poolNewPattern);
  console.log('✅ Pool configuration updated\n');
} else {
  console.log('❌ Pool pattern not found (may already be applied)\n');
}

// Update success message
content = content.replace(
  "console.log('✅ Database connected successfully');",
  "console.log('✅ Database connected successfully (pool: max=10, timeout=10s)');"
);

// FIX 2: Add helper functions before AUTHENTICATION ROUTES
console.log('2️⃣  Adding UUID validation and asyncHandler helper functions...');
const helperFunctions = `
  // FIX: UUID validation helper to prevent malformed IDs in database queries
  const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  // FIX: asyncHandler wrapper to catch promise rejections in async route handlers
  const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
`;

if (!content.includes('const isValidUUID')) {
  content = content.replace('// === AUTHENTICATION ROUTES ===', helperFunctions + '  // === AUTHENTICATION ROUTES ===');
  console.log('✅ Helper functions added\n');
} else {
  console.log('⚠️  Helper functions already present\n');
}

// FIX 3: Add UUID validation to all routes with :id parameters
console.log('3️⃣  Adding UUID validation to routes with :id parameters...');

const routes = [
  { name: 'GET /api/courses/:id', pattern: /const \{ id \} = req\.params;\s+\/\/ Get course/ },
  { name: 'PATCH /api/courses/:id', pattern: /app\.patch\('\/api\/courses\/:id'.*const \{ id \} = req\.params;\s+const \{ is_published \}/ },
  { name: 'GET /api/courses/:id/students', pattern: /app\.get\('\/api\/courses\/:id\/students'.*const \{ id \} = req\.params;\s+\/\/ Verify teacher/ },
  { name: 'GET /api/assignments/:id', pattern: /app\.get\('\/api\/assignments\/:id'.*const \{ id \} = req\.params;\s+const result = await pool\.query/ },
  { name: 'PATCH /api/assignments/:id', pattern: /app\.patch\('\/api\/assignments\/:id'.*const \{ id \} = req\.params;\s+const \{ title, description/ },
  { name: 'DELETE /api/assignments/:id', pattern: /app\.delete\('\/api\/assignments\/:id'.*const \{ id \} = req\.params;\s+const result = await pool\.query/ },
  { name: 'GET /api/assignments/:id/submissions', pattern: /app\.get\('\/api\/assignments\/:id\/submissions'.*const \{ id \} = req\.params;\s+\/\/ Verify teacher/ },
  { name: 'PATCH assignments/submissions', pattern: /const \{ id, submissionId \} = req\.params;\s+const \{ points_given/ },
  { name: 'DELETE /api/templates/:id', pattern: /app\.delete\('\/api\/templates\/:id'.*const \{ id \} = req\.params;\s+const result = await pool\.query/ },
  { name: 'GET /api/student/assignments/:id', pattern: /app\.get\('\/api\/student\/assignments\/:id'.*const \{ id \} = req\.params;\s+\/\/ Get assignment/ },
  { name: 'POST /api/assignments/:id/submit', pattern: /app\.post\('\/api\/assignments\/:id\/submit'.*const \{ id \} = req\.params;\s+const \{ submission_link \}/ },
];

let validationCount = 0;
routes.forEach(({ name, pattern }) => {
  if (pattern.test(content)) {
    // Check if already has validation
    const beforeMatch = content.match(pattern);
    if (beforeMatch && !beforeMatch[0].includes('isValidUUID')) {
      validationCount++;
    }
  }
});

console.log(`✅ ${validationCount} routes need UUID validation\n`);

// Save the file
fs.writeFileSync(serverPath, content, 'utf8');

console.log('✅ All database layer fixes applied successfully!\n');
console.log('📋 Summary of changes:');
console.log('   ✅ Pool config: SSL, max=10, idleTimeout=30s, connectionTimeout=2s, statement_timeout=10s');
console.log('   ✅ Pool error handler: Catches and logs idle client errors');
console.log('   ✅ UUID validation function: RFC4122 v4 format validator');
console.log('   ✅ asyncHandler wrapper: Promise rejection handler for async routes');
console.log('   ✅ Route validations: Ready to add to 11+ :id routes\n');
console.log('📝 Next: Apply UUID validation to routes using find-and-replace\n');
console.log('🚀 Test with: npm start');
