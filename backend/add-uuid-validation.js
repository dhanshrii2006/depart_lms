#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, 'server.js');

console.log('🔧 Adding UUID validation to all 11 routes with :id parameters...\n');

let content = fs.readFileSync(serverPath, 'utf8');
let appliedCount = 0;

// Define all replacements for UUID validation
const replacements = [
  {
    name: 'GET /api/courses/:id',
    old: /const { id } = req\.params;\s+\/\/ Get course/,
    new: 'const { id } = req.params;\n      if (!isValidUUID(id)) return res.status(400).json({ error: \'Invalid ID format\' });\n\n      // Get course'
  },
  {
    name: 'PATCH /api/courses/:id',
    old: /app\.patch\('\/api\/courses\/:id'.*?const { id } = req\.params;\s+const { is_published }/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+const { is_published }/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });
      const { is_published }`
    )
  },
  {
    name: 'GET /api/courses/:id/students',
    old: /app\.get\('\/api\/courses\/:id\/students'.*?const { id } = req\.params;\s+\/\/ Verify teacher/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+\/\/ Verify teacher/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });

      // Verify teacher`
    )
  },
  {
    name: 'GET /api/assignments/:id',
    old: /app\.get\('\/api\/assignments\/:id'.*?const { id } = req\.params;\s+const result = await pool\.query/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+const result = await pool\.query/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });

      const result = await pool.query`
    )
  },
  {
    name: 'PATCH /api/assignments/:id',
    old: /app\.patch\('\/api\/assignments\/:id'.*?const { id } = req\.params;\s+const { title, description/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+const { title, description/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });
      const { title, description`
    )
  },
  {
    name: 'DELETE /api/assignments/:id',
    old: /app\.delete\('\/api\/assignments\/:id'.*?const { id } = req\.params;\s+const result = await pool\.query\(\s+'DELETE FROM assignments/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+const result = await pool\.query/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });

      const result = await pool.query`
    )
  },
  {
    name: 'GET /api/assignments/:id/submissions',
    old: /app\.get\('\/api\/assignments\/:id\/submissions'.*?const { id } = req\.params;\s+\/\/ Verify teacher/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+\/\/ Verify teacher/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });

      // Verify teacher`
    )
  },
  {
    name: 'PATCH submissions/:submissionId',
    old: /const { id, submissionId } = req\.params;\s+const { points_given/,
    new: 'const { id, submissionId } = req.params;\n      if (!isValidUUID(id) || !isValidUUID(submissionId)) return res.status(400).json({ error: \'Invalid ID format\' });\n      const { points_given'
  },
  {
    name: 'DELETE /api/templates/:id',
    old: /app\.delete\('\/api\/templates\/:id'.*?const { id } = req\.params;\s+const result = await pool\.query/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+const result = await pool\.query/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });

      const result = await pool.query`
    )
  },
  {
    name: 'GET /api/student/assignments/:id',
    old: /app\.get\('\/api\/student\/assignments\/:id'.*?const { id } = req\.params;\s+\/\/ Get assignment/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+\/\/ Get assignment/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });

      // Get assignment`
    )
  },
  {
    name: 'POST /api/assignments/:id/submit',
    old: /app\.post\('\/api\/assignments\/:id\/submit'.*?const { id } = req\.params;\s+const { submission_link }/s,
    replacement: (match) => match.replace(
      /const { id } = req\.params;\s+const { submission_link }/,
      `const { id } = req.params;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid ID format' });
      const { submission_link }`
    )
  }
];

// Apply replacements
replacements.forEach(({ name, old, replacement, new: newVal }) => {
  if (replacement) {
    if (old.test(content)) {
      content = content.replace(old, replacement);
      console.log(`✅ ${name}`);
      appliedCount++;
    }
  } else if (old instanceof RegExp) {
    if (old.test(content) && !content.match(new RegExp(newVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))) {
      content = content.replace(old, newVal);
      console.log(`✅ ${name}`);
      appliedCount++;
    }
  }
});

// Save the file
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\n✅ UUID validation applied to ${appliedCount}/11 routes\n`);
console.log('🚀 Start server: npm start');
