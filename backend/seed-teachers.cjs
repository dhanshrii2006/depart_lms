const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/acadify'
});

// Define teachers to seed
const teachers = [
  {
    name: 'John Teacher',
    email: 'john.teacher@acadify.dev',
    roll_number: 'john.teacher',
    password: 'Teacher@123'
  },
  {
    name: 'Sarah Smith',
    email: 'sarah.smith@acadify.dev',
    roll_number: 'sarah.smith',
    password: 'Teacher@123'
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@acadify.dev',
    roll_number: 'bob.johnson',
    password: 'Teacher@123'
  },
  {
    name: 'Emma Davis',
    email: 'emma.davis@acadify.dev',
    roll_number: 'emma.davis',
    password: 'Teacher@123'
  },
  {
    name: 'Michael Wilson',
    email: 'michael.wilson@acadify.dev',
    roll_number: 'michael.wilson',
    password: 'Teacher@123'
  }
];

async function seedTeachers() {
  try {
    console.log('🌱 Starting teacher seeding...\n');

    for (const teacher of teachers) {
      // Check if teacher already exists
      const existingTeacher = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [teacher.email]
      );

      if (existingTeacher.rows.length > 0) {
        console.log(`⏭️  Skipping ${teacher.email} (already exists)`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(teacher.password, 10);

      // Create teacher
      const result = await pool.query(
        `INSERT INTO users (name, email, roll_number, password, role, is_verified)
         VALUES ($1, $2, $3, $4, 'teacher', true)
         RETURNING id, email, roll_number`,
        [teacher.name, teacher.email, teacher.roll_number, hashedPassword]
      );

      console.log(`✅ Created teacher: ${teacher.email}`);
      console.log(`   UID: ${teacher.roll_number}`);
      console.log(`   Password: ${teacher.password}\n`);
    }

    console.log('✨ Teacher seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding teachers:', err);
    process.exit(1);
  }
}

seedTeachers();
