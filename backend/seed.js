import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting seed...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      { name: 'Admin User', email: 'admin@acadify.dev', role: 'admin' },
      { name: 'Teacher User', email: 'teacher@acadify.dev', role: 'teacher' },
      { name: 'Student User', email: 'student@acadify.dev', role: 'student' }
    ];

    for (const user of users) {
      await client.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, hashedPassword, user.role]
      );
      console.log(`✓ Created ${user.role}: ${user.email}`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\nDemo credentials:');
    console.log('  admin@acadify.dev / password123');
    console.log('  teacher@acadify.dev / password123');
    console.log('  student@acadify.dev / password123');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
