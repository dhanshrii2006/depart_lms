import { query } from './pool.js';
import bcrypt from 'bcryptjs';

const hashPassword = (password) => bcrypt.hashSync(password, 10);

export async function seed() {
  try {
    console.log('Seeding database...');

    // Create admin
    const adminPassword = hashPassword('admin123');
    const adminResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['admin@acadify.com', adminPassword, 'Admin', 'User', 'admin']
    );
    console.log('✓ Admin created');

    // Create teachers
    const teacherPassword = hashPassword('teacher123');
    const teachers = [];
    for (let i = 1; i <= 3; i++) {
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [`teacher${i}@acadify.com`, teacherPassword, `Teacher`, `User${i}`, 'teacher']
      );
      teachers.push(result.rows[0].id);
    }
    console.log('✓ Teachers created');

    // Create valid roll numbers
    const rollNumbers = [
      '2023001', '2023002', '2023003', '2023004', '2023005',
      '2023006', '2023007', '2023008', '2023009', '2023010'
    ];
    for (const rollNum of rollNumbers) {
      await query(
        `INSERT INTO valid_roll_numbers (roll_number) VALUES ($1)`,
        [rollNum]
      );
    }
    console.log('✓ Valid roll numbers created');

    // Create students
    const studentPassword = hashPassword('student123');
    const students = [];
    for (let i = 0; i < 10; i++) {
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, roll_number) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          `student${i + 1}@stvincentngp.edu.in`,
          studentPassword,
          `Student`,
          `User${i + 1}`,
          'student',
          rollNumbers[i]
        ]
      );
      students.push(result.rows[0].id);

      // Mark roll number as used
      await query(
        `UPDATE valid_roll_numbers SET is_used = true WHERE roll_number = $1`,
        [rollNumbers[i]]
      );
    }
    console.log('✓ Students created with @stvincentngp.edu.in domain');

    // Create courses
    const courses = [];
    const courseData = [
      { teacher_id: teachers[0], title: 'Web Development', subject: 'CS', color: '#4F46E5' },
      { teacher_id: teachers[0], title: 'Data Structures', subject: 'CS', color: '#06B6D4' },
      { teacher_id: teachers[1], title: 'Database Systems', subject: 'CS', color: '#EC4899' },
      { teacher_id: teachers[1], title: 'Operating Systems', subject: 'CS', color: '#F59E0B' },
      { teacher_id: teachers[2], title: 'Computer Networks', subject: 'CS', color: '#10B981' }
    ];

    for (const course of courseData) {
      const result = await query(
        `INSERT INTO courses (teacher_id, title, section, subject, cover_color) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [course.teacher_id, course.title, 'A', course.subject, course.color]
      );
      courses.push(result.rows[0].id);
    }
    console.log('✓ Courses created');

    // Enroll students in courses
    for (let i = 0; i < students.length; i++) {
      const courseIds = [
        courses[0], courses[1],
        courses[2], courses[3],
        courses[4]
      ];
      for (const courseId of courseIds) {
        await query(
          `INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)`,
          [students[i], courseId]
        ).catch(() => {}); // Ignore duplicates
      }
    }
    console.log('✓ Students enrolled in courses');

    // Create announcements
    for (let i = 0; i < courses.length; i++) {
      const result = await query(
        `INSERT INTO announcements (course_id, user_id, title, content) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          courses[i],
          courseData[i].teacher_id,
          `Welcome to ${courseData[i].title}`,
          `This is the first announcement. Welcome to the class! Please review the syllabus and materials.`
        ]
      );

      // Add comments
      for (let j = 0; j < 2; j++) {
        await query(
          `INSERT INTO comments (announcement_id, user_id, content) VALUES ($1, $2, $3)`,
          [result.rows[0].id, students[j], `Great class! Looking forward to learning more.`]
        );
      }
    }
    console.log('✓ Announcements and comments created');

    // Create assignments
    const assignments = [];
    for (let i = 0; i < courses.length; i++) {
      for (let j = 0; j < 3; j++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (j + 1) * 3);

        const result = await query(
          `INSERT INTO assignments (course_id, created_by, title, instructions, due_date, points) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            courses[i],
            courseData[i].teacher_id,
            `Assignment ${j + 1}: ${courseData[i].title}`,
            `Please complete this assignment and submit your work.`,
            dueDate.toISOString(),
            100
          ]
        );
        assignments.push(result.rows[0].id);
      }
    }
    console.log('✓ Assignments created');

    // Create submissions and grades
    for (const assignmentId of assignments) {
      for (let i = 0; i < 5; i++) {
        const submittedAt = new Date();
        submittedAt.setDate(submittedAt.getDate() - Math.floor(Math.random() * 3));

        await query(
          `INSERT INTO submissions (assignment_id, user_id, submission_text, submitted_at, grade, feedback, graded_at, graded_by) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            assignmentId,
            students[i],
            'This is my submission for the assignment.',
            submittedAt.toISOString(),
            Math.floor(Math.random() * 40) + 60,
            'Good work! Keep improving.',
            new Date().toISOString(),
            teachers[0]
          ]
        ).catch(() => {});
      }
    }
    console.log('✓ Submissions created');

    // Create course invite codes
    for (const courseId of courses) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await query(
        `INSERT INTO course_invite_codes (course_id, code, created_by) VALUES ($1, $2, $3)`,
        [courseId, code, teachers[0]]
      );
    }
    console.log('✓ Invite codes created');

    // Create materials
    for (const courseId of courses) {
      await query(
        `INSERT INTO materials (course_id, created_by, title, description, link_url) 
         VALUES ($1, $2, $3, $4, $5)`,
        [courseId, teachers[0], 'Course Syllabus', 'Full course syllabus and requirements', 'https://example.com/syllabus']
      );
    }
    console.log('✓ Materials created');

    // Create discussions (forum posts)
    const discussions = [];
    const discussionData = [
      {
        title: 'How to approach problem solving in algorithms?',
        description: 'I\'m struggling with complex algorithmic problems. Any tips on how to break them down systematically?',
        author_id: students[0]
      },
      {
        title: 'Best resources for learning React Hooks',
        description: 'What are the best tutorials or resources you\'ve found for mastering React Hooks?',
        author_id: students[1]
      },
      {
        title: 'Understanding database normalization',
        description: 'Can someone explain the difference between 1NF, 2NF, and 3NF in simple terms?',
        author_id: students[2]
      }
    ];

    for (const discussion of discussionData) {
      const result = await query(
        `INSERT INTO discussions (title, description, author_id) 
         VALUES ($1, $2, $3) RETURNING id`,
        [discussion.title, discussion.description, discussion.author_id]
      );
      discussions.push(result.rows[0].id);
    }
    console.log('✓ Discussions created');

    // Create replies to discussions
    const replies = [
      {
        discussion_id: discussions[0],
        author_id: teachers[0],
        content: 'Start with understanding the problem first, then break it down into smaller subproblems. Practice with simple examples before jumping to complex ones.'
      },
      {
        discussion_id: discussions[0],
        author_id: students[3],
        content: 'I found LeetCode really helpful for practicing. Start with Easy problems and gradually move to Medium.'
      },
      {
        discussion_id: discussions[1],
        author_id: students[4],
        content: 'The official React documentation is really good! Also check out egghead.io courses.'
      },
      {
        discussion_id: discussions[2],
        author_id: teachers[1],
        content: '1NF eliminates duplicate columns, 2NF removes partial dependencies, and 3NF removes transitive dependencies. Here\'s a good reference: https://example.com'
      }
    ];

    for (const reply of replies) {
      await query(
        `INSERT INTO discussion_replies (discussion_id, author_id, content) 
         VALUES ($1, $2, $3)`,
        [reply.discussion_id, reply.author_id, reply.content]
      );
    }
    console.log('✓ Discussion replies created');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
