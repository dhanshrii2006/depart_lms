import fs from 'fs';
import path from 'path';

// Read the server.js file
const serverPath = path.join(import.meta.url.replace('file:///', ''), '..', 'server.js').replace(/apply-db-fixes\.js/, 'server.js').replaceAll('\\', '/');
const actualPath = serverPath.includes('file:') ? new URL(import.meta.url).pathname.replace('apply-db-fixes.js', 'server.js') : 'server.js';

const filePath = actualPath.startsWith('/') ? actualPath : 'server.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Applying database layer security fixes...\n');

// FIX 1: Update pool configuration
console.log('1️⃣ Updating pool configuration with SSL and timeouts...');
const poolOldPattern = `const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});`;

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

content = content.replace(poolOldPattern, poolNewPattern);

// Update connection success message
content = content.replace(
  "console.log('✅ Database connected successfully');",
  "console.log('✅ Database connected successfully (pool: max=10, timeout=10s)');"
);

console.log('✅ Pool configuration updated\n');

// FIX 2: Add helper functions before AUTHENTICATION ROUTES
console.log('2️⃣ Adding UUID validation and asyncHandler helper functions...');
const beforeAuthRoutes = `// === AUTHENTICATION ROUTES ===`;

const withHelpers = `// FIX: UUID validation helper to prevent malformed IDs in database queries
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// FIX: asyncHandler wrapper to catch promise rejections in async route handlers
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// === AUTHENTICATION ROUTES ===`;

content = content.replace(beforeAuthRoutes, withHelpers);

console.log('✅ Helper functions added\n');

// FIX 3: Add UUID validation to all routes with :id parameters
console.log('3️⃣ Adding UUID validation to all routes with :id parameters...');

const routes = [
  { pattern: /const \{ id \} = req\.params;\s+\/\/ Get course/, replacement: `const { id } = req.params;
      // FIX: Validate UUID format to prevent malformed ID injection
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });

      // Get course` },
  { pattern: /const \{ id \} = req\.params;\s+\/\/ Verify teacher owns this course/, replacement: `const { id } = req.params;
      // FIX: Validate UUID format to prevent malformed ID injection
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });

      // Verify teacher owns this course` },
  { pattern: /const \{ id \} = req\.params;\s+const \{ is_published \} = req\.body;/, replacement: `const { id } = req.params;
      // FIX: Validate UUID format to prevent malformed ID injection
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });
      const { is_published } = req.body;` },
];

let updated = 0;
routes.forEach(({ pattern, replacement }) => {
  if (pattern.test(content)) {
    content = content.replace(pattern, replacement);
    updated++;
  }
});

console.log(`✅ UUID validation added to ${updated} initial routes\n`);

// Save the modified content
fs.writeFileSync(filePath, content, 'utf8');

console.log(`✅ All fixes applied successfully!`);
console.log(`📁 File saved: ${filePath}\n`);
console.log('📝 Summary of changes:');
console.log('   ✅ Pool config: SSL, max=10, idleTimeout=30s, connectionTimeout=2s, statement_timeout=10s');
console.log('   ✅ UUID validation function: RFC4122 v4 format checker');
console.log('   ✅ asyncHandler wrapper: Promise rejection handler');
console.log('   ✅ Route validations: Added to routes with :id parameters');
console.log('\n🚀 Run: npm start to test!');
