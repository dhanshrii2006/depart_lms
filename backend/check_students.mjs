import { query } from './src/db/pool.js';

async function checkStudents() {
  try {
    const result = await query(`
      SELECT id, email, first_name, last_name, role 
      FROM users 
      WHERE role = 'student'
      LIMIT 5
    `);
    
    console.log('Students in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.email} (${row.first_name} ${row.last_name})`);
    });
    
    if (result.rows.length === 0) {
      console.log('⚠️ No students found in database!');
    }
  } catch (error) {
    console.error('Database error:', error.message);
  }
  process.exit(0);
}

checkStudents();
