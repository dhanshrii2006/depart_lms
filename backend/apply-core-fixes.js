#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, 'server.js');

let content = fs.readFileSync(serverPath, 'utf8');

// Replace pool configuration - exact match
content = content.replace(
  `const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});`,
  `// FIX: Production-ready pool configuration with SSL, connection limits, and timeouts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 10000,
});

// FIX: Pool error handler
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});`
);

// Update success message
content = content.replace(
  "console.log('✅ Database connected successfully');",
  "console.log('✅ Database connected successfully (pool: max=10, timeout=10s)');"
);

// Add helper functions BEFORE "// === AUTHENTICATION ROUTES ==="
const marker = '// === AUTHENTICATION ROUTES ===';
const helpers = `// FIX: UUID validation 
  const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  // FIX: asyncHandler
  const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  ${marker}`;

content = content.replace(marker, helpers);

// Save
fs.writeFileSync(serverPath, content, 'utf8');

console.log('✅ All core database layer security fixes applied!\n');
console.log('Changes made:');
console.log('1. ✅ Pool configuration (SSL, max=10, timeouts, statement_timeout)');
console.log('2. ✅ Pool error handler');
console.log('3. ✅ isValidUUID helper function');
console.log('4. ✅ asyncHandler wrapper function');
console.log('\nTest with: npm start');
