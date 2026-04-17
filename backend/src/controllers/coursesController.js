import { query } from '../db/pool.js';
import { generateInviteCode } from '../utils/codes.js';

export const createCourse = async (req, res) => {
  try {
    const {
      title,
      academicYear,
      subject,
      description,
      coverColor,
      category,
      difficulty,
      duration,
      maxStudents,
      outcomes,
      status,
    } = req.validatedData;

    const subjectToStore = subject || category || '';

    const result = await query(
      `INSERT INTO courses (
         teacher_id,
         title,
         academic_year,
         subject,
         description,
         category,
         difficulty,
         duration_hours,
         max_students,
         outcomes,
         status,
         cover_color
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user.id,
        title,
        academicYear || '2024-2025',
        subjectToStore,
        description,
        category || '',
        difficulty || null,
        duration ?? null,
        maxStudents ?? null,
        outcomes?.length ? JSON.stringify(outcomes) : null,
        status || 'published',
        coverColor || '#4F46E5',
      ]
    );

    const course = result.rows[0];

    // Generate invite code
    const code = generateInviteCode();
    await query(
      'INSERT INTO course_invite_codes (course_id, code, created_by) VALUES ($1, $2, $3)',
      [course.id, code, req.user.id]
    );

    res.status(201).json({ ...course, inviteCode: code });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const createModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, orderIndex } = req.validatedData;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `INSERT INTO course_modules (course_id, title, description, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [courseId, title, description || '', orderIndex ?? 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
};

export const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await query(
      `SELECT c.*, u.first_name, u.last_name, u.email
       FROM courses c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = result.rows[0];

    // Check if user is enrolled or is teacher
    const enrollResult = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (course.teacher_id !== req.user.id && enrollResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

export const listCourses = async (req, res) => {
  try {
    const { academicYear } = req.query;
    let result;

    if (req.user.role === 'teacher') {
      // Teachers see their own courses
      const params = [req.user.id];
      let whereClause = 'teacher_id = $1';
      if (academicYear) {
        whereClause += ' AND academic_year = $2';
        params.push(academicYear);
      }
      result = await query(
        `SELECT id, title, academic_year, subject, description, cover_color, created_at
         FROM courses WHERE ${whereClause}
         ORDER BY created_at DESC`,
        params
      );
    } else if (req.user.role === 'student') {
      // Students see enrolled courses
      const params = [req.user.id];
      let whereClause = 'e.user_id = $1';
      if (academicYear) {
        whereClause += ' AND c.academic_year = $2';
        params.push(academicYear);
      }
      result = await query(
        `SELECT c.id, c.title, c.academic_year, c.subject, c.description, c.cover_color, c.created_at
         FROM courses c
         JOIN enrollments e ON c.id = e.course_id
         WHERE ${whereClause}
         ORDER BY c.created_at DESC`,
        params
      );
    } else if (req.user.role === 'admin') {
      // Admins can see all courses
      const params = [];
      let whereClause = '';
      if (academicYear) {
        whereClause = 'WHERE academic_year = $1';
        params.push(academicYear);
      }
      result = await query(
        `SELECT id, title, academic_year, subject, description, cover_color, created_at
         FROM courses ${whereClause}
         ORDER BY created_at DESC`,
        params
      );
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('List courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const enrollByCourt = async (req, res) => {
  try {
    const { code } = req.validatedData;

    // Find course by code
    const codeResult = await query(
      'SELECT course_id FROM course_invite_codes WHERE code = $1',
      [code.toUpperCase()]
    );

    if (codeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const courseId = codeResult.rows[0].course_id;

    // Check if already enrolled
    const enrollResult = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (enrollResult.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Enroll student
    await query(
      'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)',
      [req.user.id, courseId]
    );

    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Enrollment failed' });
  }
};

export const getEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.roll_number, e.enrolled_at
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       WHERE e.course_id = $1
       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      academicYear,
      subject,
      description,
      coverColor,
      category,
      difficulty,
      duration,
      maxStudents,
      outcomes,
      status,
    } = req.validatedData;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `UPDATE courses 
       SET title = $1,
           academic_year = $2,
           subject = $3,
           description = $4,
           category = $5,
           difficulty = $6,
           duration_hours = $7,
           max_students = $8,
           outcomes = $9,
           status = $10,
           cover_color = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        title,
        academicYear || '2024-2025',
        subject || category || '',
        description,
        category || '',
        difficulty || null,
        duration ?? null,
        maxStudents ?? null,
        outcomes?.length ? JSON.stringify(outcomes) : null,
        status || 'published',
        coverColor,
        courseId,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await query('DELETE FROM courses WHERE id = $1', [courseId]);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

export const getInviteCode = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT code FROM course_invite_codes WHERE course_id = $1 LIMIT 1',
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No invite code found' });
    }

    res.json({ code: result.rows[0].code });
  } catch (error) {
    console.error('Get invite code error:', error);
    res.status(500).json({ error: 'Failed to fetch invite code' });
  }
};
