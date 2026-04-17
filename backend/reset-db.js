import { query } from './src/db/pool.js';
import { seed } from './src/db/seed.js';

async function resetDatabase() {
  try {
    console.log('Clearing old data...');
    
    // Disable foreign key constraints temporarily
    await query('SET session_replication_role = REPLICA');
    
    // Clear all tables
    const tables = ['discussions', 'discussion_replies', 'discussion_participants', 'comments', 'announcements', 'submissions', 'assignments', 'materials', 'lessons', 'modules', 'enrollments', 'courses', 'valid_roll_numbers', 'users'];
    
    for (const table of tables) {
      try {
        await query(`DELETE FROM ${table}`);
        console.log(`✓ Cleared ${table}`);
      } catch (e) {
        // Table might not exist yet, skip
      }
    }
    
    // Re-enable foreign key constraints
    await query('SET session_replication_role = DEFAULT');
    
    console.log('✓ Database cleared');
    
    // Now run seed
    await seed();
    console.log('✓ Database seeded successfully');
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

resetDatabase();
