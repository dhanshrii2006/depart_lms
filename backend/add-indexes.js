import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

// FIX: Create dedicated pool for index creation
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
// Run once with: node add-indexes.js

const createIndexes = async () => {
  try {
    console.log('🔄 Creating database indexes...');

    // Index 1: Students enrolling in courses (enrollments queries)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_enrollments_student_course 
      ON enrollments (student_id, course_id);
    `);
    console.log('✅ Index 1: enrollments (student_id, course_id)');

    // Index 2: Finding courses by teacher
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_teacher_published 
      ON courses (teacher_id, is_published);
    `);
    console.log('✅ Index 2: courses (teacher_id, is_published)');

    // Index 3: Finding assignments by teacher
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_assignments_teacher_course 
      ON assignments (teacher_id, course_id);
    `);
    console.log('✅ Index 3: assignments (teacher_id, course_id)');

    // Index 4: Finding submissions by assignment (grading page)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment 
      ON assignment_submissions (assignment_id, student_id);
    `);
    console.log('✅ Index 4: assignment_submissions (assignment_id, student_id)');

    // Index 5: Student progress tracking
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_video_progress_student 
      ON video_progress (student_id, video_id);
    `);
    console.log('✅ Index 5: video_progress (student_id, video_id)');

    // Index 6: Find templates by teacher
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_templates_teacher 
      ON assignment_templates (teacher_id);
    `);
    console.log('✅ Index 6: assignment_templates (teacher_id)');

    // Index 7: Enrollments by student (my-courses)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_enrollments_student 
      ON enrollments (student_id);
    `);
    console.log('✅ Index 7: enrollments (student_id)');

    // Index 8: Courses by date (listing courses)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_created_at 
      ON courses (created_at DESC);
    `);
    console.log('✅ Index 8: courses (created_at DESC)');

    // Index 9: Assignments by due date (student assignments view)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_assignments_due_date 
      ON assignments (due_date);
    `);
    console.log('✅ Index 9: assignments (due_date)');

    // Index 10: Submissions by date (grading history)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_created_at 
      ON assignment_submissions (created_at DESC);
    `);
    console.log('✅ Index 10: assignment_submissions (created_at DESC)');

    console.log('\n✅ All indexes created successfully!');
    console.log('📊 These indexes optimize the most frequently queried data patterns.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating indexes:', err.message);
    process.exit(1);
  }
};

createIndexes();
