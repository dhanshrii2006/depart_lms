import { query, getClient } from '../db/pool.js';

export const createAssignment = async (req, res) => {
  const client = await getClient();
  try {
    const { courseId } = req.params;
    const { title, instructions, dueDate, points } = req.validatedData;

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
    }

    await client.query('BEGIN');

    // Verify course ownership
    const course = await client.query('SELECT teacher_id, title FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const courseTitle = course.rows[0].title;

    const result = await client.query(
      `INSERT INTO assignments (course_id, created_by, title, instructions, attachment_url, due_date, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [courseId, req.user.id, title, instructions, attachmentUrl, dueDate || null, points || 100]
    );

    const assignment = result.rows[0];

    const notificationTitle = `New assignment: ${assignment.title}`;
    const notificationMessage = `A new assignment was posted in ${courseTitle}.`;

    // Notify all enrolled students
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       SELECT e.user_id, $1, $2, $3, $4, $5
       FROM enrollments e
       WHERE e.course_id = $6`,
      ['assignment', notificationTitle, notificationMessage, assignment.id, 'assignment', courseId]
    );

    await client.query('COMMIT');
    res.status(201).json(assignment);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  } finally {
    client.release();
  }
};

export const getAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await query(
      `SELECT a.*, u.first_name, u.last_name
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       WHERE a.course_id = $1
       ORDER BY a.due_date ASC`,
      [courseId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

export const getAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await query(
      `SELECT a.*, u.first_name, u.last_name
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, instructions, dueDate, points } = req.validatedData;

    // Verify ownership
    const assign = await query(
      `SELECT a.id, c.teacher_id
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [assignmentId]
    );
    if (assign.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (assign.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `UPDATE assignments 
       SET title = $1, instructions = $2, due_date = $3, points = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, instructions, dueDate, points, assignmentId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Verify ownership
    const assign = await query(
      `SELECT a.id, c.teacher_id
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [assignmentId]
    );
    if (assign.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (assign.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await query('DELETE FROM assignments WHERE id = $1', [assignmentId]);

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const driveLinkRaw = (req.body?.drive_link || req.body?.driveLink || req.body?.linkUrl || '').trim();
    const textCommentRaw = (req.body?.text_comment || req.body?.textComment || req.body?.submissionText || '').trim();
    const file = req.file;

    if (!file && !driveLinkRaw) {
      return res.status(400).json({ message: 'Please attach a file or add a Google Drive link' });
    }

    if (driveLinkRaw) {
      let url;
      try {
        url = new URL(driveLinkRaw);
      } catch {
        return res.status(400).json({ message: 'Invalid Google Drive link' });
      }
      const host = (url.hostname || '').toLowerCase();
      if (!(host === 'drive.google.com' || host.endsWith('.drive.google.com'))) {
        return res.status(400).json({ message: 'Invalid Google Drive link' });
      }
    }

    // Check assignment exists
    const assignmentRes = await query('SELECT id, course_id FROM assignments WHERE id = $1', [assignmentId]);
    if (assignmentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    const courseId = assignmentRes.rows[0].course_id;

    // Check enrollment
    const enrollmentRes = await query(
      `SELECT 1 FROM enrollments e
       WHERE e.user_id = $1 AND e.course_id = $2`,
      [studentId, courseId]
    );
    if (enrollmentRes.rows.length === 0) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // Check existing submission
    const existingRes = await query(
      `SELECT id, grade FROM submissions
       WHERE assignment_id = $1 AND user_id = $2`,
      [assignmentId, studentId]
    );
    if (existingRes.rows.length && existingRes.rows[0].grade !== null) {
      return res.status(400).json({ message: 'Cannot resubmit a graded assignment' });
    }

    const fileUrl = file ? `/uploads/submissions/${file.filename}` : null;
    const fileName = file ? file.originalname : null;
    const fileType = file ? file.mimetype : null;
    const driveLink = driveLinkRaw || null;
    const textComment = textCommentRaw || '';

    const result = await query(
      `INSERT INTO submissions (
         assignment_id, user_id,
         submission_text,
         file_url, file_name, file_type,
         drive_link, text_comment,
         status,
         submitted_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted', CURRENT_TIMESTAMP)
       ON CONFLICT (assignment_id, user_id)
       DO UPDATE SET
         submission_text = EXCLUDED.submission_text,
         file_url = COALESCE(EXCLUDED.file_url, submissions.file_url),
         file_name = COALESCE(EXCLUDED.file_name, submissions.file_name),
         file_type = COALESCE(EXCLUDED.file_type, submissions.file_type),
         drive_link = COALESCE(EXCLUDED.drive_link, submissions.drive_link),
         text_comment = COALESCE(NULLIF(EXCLUDED.text_comment, ''), submissions.text_comment),
         status = 'submitted',
         submitted_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        assignmentId,
        studentId,
        textComment,
        fileUrl,
        fileName,
        fileType,
        driveLink,
        textComment,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Failed to submit assignment' });
  }
};

export const unsubmitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    const existingRes = await query(
      `SELECT id, grade FROM submissions
       WHERE assignment_id = $1 AND user_id = $2`,
      [assignmentId, studentId]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: 'No submission found' });
    }

    if (existingRes.rows[0].grade !== null) {
      return res.status(400).json({ message: 'Cannot unsubmit a graded assignment' });
    }

    const result = await query(
      `UPDATE submissions
       SET status = 'draft'
       WHERE assignment_id = $1 AND user_id = $2
       RETURNING *`,
      [assignmentId, studentId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Unsubmit assignment error:', error);
    res.status(500).json({ message: 'Failed to unsubmit assignment' });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Verify the teacher owns the course this assignment belongs to
    const assign = await query(
      `SELECT a.id, a.course_id, c.teacher_id
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [assignmentId]
    );
    if (assign.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assign.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT s.*, (u.first_name || ' ' || u.last_name) AS student_name, u.email AS student_email
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

export const getStudentSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await query(
      `SELECT s.* FROM submissions s
       WHERE s.assignment_id = $1 AND s.user_id = $2`,
      [assignmentId, req.user.id]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.validatedData;

    // Verify the teacher can grade this submission
    const sub = await query(
      `SELECT s.assignment_id, c.teacher_id
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       WHERE s.id = $1`,
      [submissionId]
    );

    if (sub.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (sub.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `UPDATE submissions 
       SET grade = $1, feedback = $2, graded_by = $3, graded_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [grade, feedback || '', req.user.id, submissionId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};

// Get gradebook for a course (all assignments and grades)
export const getCourseGradebook = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get all enrolled students
    const students = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email
       FROM users u
       JOIN enrollments e ON u.id = e.user_id
       WHERE e.course_id = $1
       ORDER BY u.first_name ASC`,
      [courseId]
    );

    // Get all assignments
    const assignments = await query(
      `SELECT id, title, points, due_date, created_at
       FROM assignments
       WHERE course_id = $1
       ORDER BY created_at ASC`,
      [courseId]
    );

    // Get all submissions and grades
    const submissions = await query(
      `SELECT s.id, s.assignment_id, s.user_id, s.grade, s.feedback, s.submitted_at, s.graded_at
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE a.course_id = $1`,
      [courseId]
    );

    // Build gradebook data structure
    const gradebook = {
      students: students.rows,
      assignments: assignments.rows,
      submissions: submissions.rows,
    };

    res.json(gradebook);
  } catch (error) {
    console.error('Get gradebook error:', error);
    res.status(500).json({ error: 'Failed to fetch gradebook' });
  }
};

// Get student transcript (all grades across courses)
export const getStudentTranscript = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all courses the student is enrolled in
    const courses = await query(
      `SELECT c.id, c.title, c.subject, t.first_name, t.last_name, e.enrolled_at
       FROM courses c
       JOIN users t ON c.teacher_id = t.id
       JOIN enrollments e ON c.id = e.course_id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    // Get all assignments and grades for this student
    const transcriptData = await query(
      `SELECT 
         c.id as course_id,
         c.title as course_title,
         c.subject,
         a.id as assignment_id,
         a.title as assignment_title,
         a.points,
         a.due_date,
         s.grade,
         s.feedback,
         s.submitted_at,
         s.graded_at
       FROM courses c
       JOIN assignments a ON c.id = a.course_id
       JOIN enrollments e ON c.id = e.course_id
       LEFT JOIN submissions s ON a.id = s.assignment_id AND s.user_id = e.user_id
       WHERE e.user_id = $1
       ORDER BY c.id DESC, a.due_date DESC`,
      [studentId]
    );

    res.json({ courses: courses.rows, transcript: transcriptData.rows });
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
};

// Get grade analytics for a course
export const getCourseGradeAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get assignment statistics
    const assignmentStats = await query(
      `SELECT 
         a.id,
         a.title,
         a.points,
         COUNT(s.id) as total_submissions,
         COUNT(CASE WHEN s.grade IS NOT NULL THEN 1 END) as graded_submissions,
         AVG(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as average_grade,
         MIN(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as min_grade,
         MAX(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as max_grade
       FROM assignments a
       LEFT JOIN submissions s ON a.id = s.assignment_id
       WHERE a.course_id = $1
       GROUP BY a.id, a.title, a.points
       ORDER BY a.id ASC`,
      [courseId]
    );

    // Get overall course statistics
    const studentCount = await query(
      `SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1`,
      [courseId]
    );

    // Get grade distribution
    const gradeDistribution = await query(
      `SELECT 
         COUNT(CASE WHEN s.grade >= (a.points * 0.9) THEN 1 END) as grade_a,
         COUNT(CASE WHEN s.grade >= (a.points * 0.8) AND s.grade < (a.points * 0.9) THEN 1 END) as grade_b,
         COUNT(CASE WHEN s.grade >= (a.points * 0.7) AND s.grade < (a.points * 0.8) THEN 1 END) as grade_c,
         COUNT(CASE WHEN s.grade < (a.points * 0.7) AND s.grade IS NOT NULL THEN 1 END) as grade_f,
         COUNT(CASE WHEN s.grade IS NULL THEN 1 END) as not_graded
       FROM assignments a
       LEFT JOIN submissions s ON a.id = s.assignment_id
       WHERE a.course_id = $1`,
      [courseId]
    );

    res.json({
      assignments: assignmentStats.rows,
      studentCount: studentCount.rows[0].count,
      gradeDistribution: gradeDistribution.rows[0],
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
