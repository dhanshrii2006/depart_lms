import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration...');

    // Create UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✓ UUID extension created');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✔ users table created');

    // Add roll_number and is_verified columns if they don't exist
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(20) UNIQUE
    `).catch(() => {
      // Column might already exist, ignore error
    });
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false
    `).catch(() => {
      // Column might already exist, ignore error
    });
    console.log('✔ users table columns updated');

    // Courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        invite_code VARCHAR(10) UNIQUE NOT NULL,
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ courses table created');

    // Enrollments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, course_id)
      )
    `);
    console.log('✓ enrollments table created');

    // Modules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        position INT NOT NULL
      )
    `);
    console.log('✓ modules table created');

    // Videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        embed_url TEXT,
        duration INT,
        position INT NOT NULL
      )
    `);
    console.log('✓ videos table created');

    // Video Progress table
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT false,
        watched_at TIMESTAMP,
        UNIQUE(student_id, video_id)
      )
    `);
    console.log('✓ video_progress table created');

    // Quizzes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL
      )
    `);
    console.log('✓ quizzes table created');

    // Questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        options JSONB,
        correct_index INT
      )
    `);
    console.log('✓ questions table created');

    // Quiz Attempts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        answers JSONB,
        score INT,
        total INT,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ quiz_attempts table created');

    // Posts table (for discussions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ posts table created');
    // Assignments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        total_points INT DEFAULT 100,
        due_date TIMESTAMP NOT NULL,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✔ assignments table created');

    // Assignment Submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        submission_link TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        points_given INT,
        teacher_feedback TEXT,
        status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('pending', 'submitted', 'graded')),
        graded_at TIMESTAMP,
        UNIQUE(assignment_id, student_id)
      )
    `);
    console.log('✔ assignment_submissions table created');

    // Assignment Templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignment_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_points INT DEFAULT 100,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✔ assignment_templates table created');
    // SECTION 1: Add roll_number index to users table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number)
    `);
    console.log('âœ" idx_users_roll_number index created');

    // SECTION 2: Valid Roll Numbers table for CSV whitelisting
    await client.query(`
      CREATE TABLE IF NOT EXISTS valid_roll_numbers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        roll_number VARCHAR(20) NOT NULL UNIQUE,
        is_used BOOLEAN DEFAULT false,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      )
    `);
    console.log('âœ" valid_roll_numbers table created');

    // Create index on roll_number for fast lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_valid_rolls ON valid_roll_numbers(roll_number)
    `);
    console.log('âœ" idx_valid_rolls index created');

    // SECTION 3: Magic Links table for email verification, passwordless login, and password reset
    await client.query(`
      CREATE TABLE IF NOT EXISTS magic_links (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(512) NOT NULL UNIQUE,
        type VARCHAR(30) NOT NULL CHECK (type IN ('email_verification', 'passwordless_login', 'password_reset')),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('âœ" magic_links table created');

    // Create indexes for magic_links table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token)
    `);
    console.log('âœ" idx_magic_links_token index created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_magic_links_user ON magic_links(user_id)
    `);
    console.log('âœ" idx_magic_links_user index created');    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
