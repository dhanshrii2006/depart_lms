const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:password123@localhost:5432/acadify'
});

(async () => {
  try {
    const plainPassword = 'admin';
    const hash = await bcrypt.hash(plainPassword, 10);
    console.log('Generated hash:', hash);
    
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 AND role = $3',
      [hash, 'admin@acadify.dev', 'admin']
    );
    
    const result = await pool.query(
      'SELECT email, password FROM users WHERE email = $1',
      ['admin@acadify.dev']
    );
    
    console.log('Admin updated:');
    console.log('  Email:', result.rows[0].email);
    console.log('  Password hash:', result.rows[0].password);
    console.log('\nTest credentials:');
    console.log('  Email: admin@acadify.dev');
    console.log('  Password: admin');
    console.log('  Secret Key: acadify_admin_secret_key_2026');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
})();
