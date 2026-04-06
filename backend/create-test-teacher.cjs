const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:password123@localhost:5432/acadify'
});

(async () => {
  try {
    const password = 'Teacher@123';
    const hash = await bcrypt.hash(password, 10);
    
    await pool.query(
      `INSERT INTO users (id, name, email, roll_number, password, role, is_verified)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'teacher', true)
       ON CONFLICT (email) DO NOTHING`,
      ['John Teacher', 'john.teacher@acadify.dev', 'john.teacher', hash]
    );
    
    console.log('✅ Test teacher created:');
    console.log('  UID: john.teacher');
    console.log('  Email: john.teacher@acadify.dev');
    console.log('  Password: Teacher@123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
})();
