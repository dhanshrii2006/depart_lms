import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: 'password123',
  host: 'localhost',
  port: 5432,
  database: 'acadify'
});

(async () => {
  try {
    console.log('Fixing assignments table schema...\n');
    
    // Drop the old assignments table if it exists to recreate it fresh
    console.log('Dropping old assignments table...');
    await pool.query('DROP TABLE IF EXISTS assignment_submissions CASCADE');
    await pool.query('DROP TABLE IF EXISTS assignment_templates CASCADE');
    await pool.query('DROP TABLE IF EXISTS assignments CASCADE');
    console.log('✓ Old tables dropped\n');
    
    // Create the correct assignments table
    console.log('Creating new assignments table with correct schema...');
    await pool.query(`
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
    console.log('✓ assignments table created\n');
    
    // Create assignment_submissions table
    console.log('Creating assignment_submissions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        submission_link TEXT,
        points_given INT,
        teacher_feedback TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        submitted_at TIMESTAMP,
        graded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ assignment_submissions table created\n');
    
    // Create assignment_templates table
    console.log('Creating assignment_templates table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        total_points INT DEFAULT 100,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ assignment_templates table created\n');
    
    // Verify all tables exist
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'assignment%'
      ORDER BY table_name
    `);
    
    console.log('✅ All assignment tables created successfully:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Verify columns in assignments table
    console.log('\nColumns in assignments table:');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='assignments'
      ORDER BY ordinal_position
    `);
    
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    await pool.end();
    console.log('\n✅ Schema fix complete!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
})();
