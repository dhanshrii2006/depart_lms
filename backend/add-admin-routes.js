import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'server.js');

let content = fs.readFileSync(serverPath, 'utf8');

// 1. Add multer import
const importRegex = /import { nanoid } from 'nanoid';/;
if (!content.includes('import multer from')) {
  content = content.replace(importRegex, "import { nanoid } from 'nanoid';\nimport multer from 'multer';");
  console.log('✅ Added multer import');
}

// 2. Add authorize() wrapper after checkRole
const checkRoleRegex = /const checkRole = \(required\) => \(req, res, next\) => \{\s*if \(req\.user\.role !== required\) \{\s*return res\.status\(403\)\.json\(\{ error: 'Access denied' \}\);\s*\}\s*next\(\);\s*\};/;
const authWrapperCode = `const checkRole = (required) => (req, res, next) => {
  if (req.user.role !== required) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Alias for authorize — wraps checkRole for convenience
const authorize = checkRole;

// === MULTER FILE UPLOAD CONFIGURATION ===

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});`;

if (!content.includes('const authorize = checkRole')) {
  // Find checkRole definition and replace it with expanded version
  const simpleCheckRole = /const checkRole = \(required\) => \(req, res, next\) => \{\s+if \(req\.user\.role !== required\) \{\s+return res\.status\(403\)\.json\(\{ error: 'Access denied' \}\);\s+\}\s+next\(\);\s+\};/m;
  content = content.replace(simpleCheckRole, authWrapperCode);
  console.log('✅ Added authorize() wrapper and multer configuration');
}

// 3. Add admin routes before health check
const adminRoutesCode = `// === SECTION 2: Admin Roll Number Routes ===

// POST /api/admin/roll-numbers/upload - Upload CSV with roll numbers
app.post('/api/admin/roll-numbers/upload', verifyToken, authorize('admin'), upload.single('file'), asyncHandler(async (req, res) => {
  // Check file exists
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file required' });
  }

  try {
    // Parse CSV from buffer
    const csvContent = req.file.buffer.toString('utf8');
    let lines = csvContent.split('\\n').map(line => line.trim()).filter(line => line.length > 0);

    // Skip header row if detected (contains 'roll' or 'number' or 'uid')
    if (lines.length > 0) {
      const headerLower = lines[0].toLowerCase();
      if (headerLower.includes('roll') || headerLower.includes('number') || headerLower.includes('uid')) {
        lines = lines.slice(1);
      }
    }

    // Validate and collect valid roll numbers
    const rollNumberRegex = /^[A-Z0-9]{4,12}$/i;
    const validRollNumbers = [];
    const invalidEntries = [];

    lines.forEach(line => {
      const rollNumber = line.trim().toUpperCase();
      if (rollNumberRegex.test(rollNumber)) {
        validRollNumbers.push(rollNumber);
      } else {
        if (invalidEntries.length < 20) {
          invalidEntries.push(rollNumber);
        }
      }
    });

    // Batch insert valid roll numbers
    let inserted = 0;

    for (const rollNumber of validRollNumbers) {
      try {
        await pool.query(
          \`INSERT INTO valid_roll_numbers (roll_number) VALUES ($1) ON CONFLICT (roll_number) DO NOTHING\`,
          [rollNumber]
        );
        inserted++;
      } catch (err) {
        // Silently skip on duplicate
      }
    }

    const duplicates = validRollNumbers.length - inserted;

    res.status(200).json({
      message: 'Roll numbers uploaded successfully',
      total: lines.length,
      inserted,
      duplicates,
      skipped: invalidEntries.length,
      invalid_entries: invalidEntries
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}));

// GET /api/admin/roll-numbers - Get roll numbers with filters
app.get('/api/admin/roll-numbers', verifyToken, authorize('admin'), asyncHandler(async (req, res) => {
  const { status = 'all', page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * limitNum;

  let whereClause = '';
  if (status === 'used') {
    whereClause = 'WHERE is_used = true';
  } else if (status === 'unused') {
    whereClause = 'WHERE is_used = false';
  }

  // Get paginated results
  const result = await pool.query(
    \`SELECT id, roll_number, is_used, uploaded_at, used_at FROM valid_roll_numbers \${whereClause} ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2\`,
    [limitNum, offset]
  );

  // Get total count
  const countResult = await pool.query(
    \`SELECT COUNT(*) as count FROM valid_roll_numbers \${whereClause}\`
  );
  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limitNum);

  res.json({
    roll_numbers: result.rows,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      pages: totalPages
    }
  });
}));

// DELETE /api/admin/roll-numbers/:rollNumber - Delete an unused roll number
app.delete('/api/admin/roll-numbers/:rollNumber', verifyToken, authorize('admin'), asyncHandler(async (req, res) => {
  const { rollNumber } = req.params;

  // Check if roll number exists
  const checkResult = await pool.query(
    \`SELECT id, is_used FROM valid_roll_numbers WHERE roll_number = $1\`,
    [rollNumber.toUpperCase()]
  );

  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Roll number not found' });
  }

  const { is_used } = checkResult.rows[0];
  if (is_used) {
    return res.status(400).json({ error: 'Cannot delete roll number already used by a student' });
  }

  // Delete the unused roll number
  await pool.query(
    \`DELETE FROM valid_roll_numbers WHERE roll_number = $1\`,
    [rollNumber.toUpperCase()]
  );

  res.json({ message: 'Deleted successfully' });
}));

// GET /api/admin/roll-numbers/stats - Get roll number statistics
app.get('/api/admin/roll-numbers/stats', verifyToken, authorize('admin'), asyncHandler(async (req, res) => {
  // Get all counts
  const totalResult = await pool.query('SELECT COUNT(*) as count FROM valid_roll_numbers');
  const usedResult = await pool.query('SELECT COUNT(*) as count FROM valid_roll_numbers WHERE is_used = true');
  const unusedResult = await pool.query('SELECT COUNT(*) as count FROM valid_roll_numbers WHERE is_used = false');

  const totalUploaded = parseInt(totalResult.rows[0].count);
  const totalUsed = parseInt(usedResult.rows[0].count);
  const totalUnused = parseInt(unusedResult.rows[0].count);
  const usagePercentage = totalUploaded > 0 ? parseFloat(((totalUsed / totalUploaded) * 100).toFixed(2)) : 0;

  res.json({
    total_uploaded: totalUploaded,
    total_used: totalUsed,
    total_unused: totalUnused,
    usage_percentage: usagePercentage
  });
}));

`;

if (!content.includes('Admin Roll Number Routes')) {
  // Insert admin routes before health check
  const healthCheckRegex = /\/\/ === HEALTH CHECK ===/;
  content = content.replace(healthCheckRegex, adminRoutesCode + '// === HEALTH CHECK ===');
  console.log('✅ Added admin roll number routes (4 endpoints)');
}

// Write back to file
fs.writeFileSync(serverPath, content, 'utf8');

console.log('\n✨ Admin CSV upload system implemented!');
console.log('\nNew endpoints:');
console.log('  POST /api/admin/roll-numbers/upload');
console.log('  GET /api/admin/roll-numbers');
console.log('  DELETE /api/admin/roll-numbers/:rollNumber');
console.log('  GET /api/admin/roll-numbers/stats');
console.log('\nTest with: npm start');
