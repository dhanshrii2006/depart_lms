import { query } from '../db/pool.js';

export const createAnnouncement = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content } = req.validatedData;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `INSERT INTO announcements (course_id, user_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [courseId, req.user.id, title, content]
    );

    // Notify all enrolled students
    const students = await query(
      'SELECT user_id FROM enrollments WHERE course_id = $1',
      [courseId]
    );

    for (const student of students.rows) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [student.user_id, 'announcement', title, content.substring(0, 100), result.rows[0].id, 'announcement']
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await query(
      `SELECT a.*, u.first_name, u.last_name, u.avatar_url
       FROM announcements a
       JOIN users u ON a.user_id = u.id
       WHERE a.course_id = $1
       ORDER BY a.created_at DESC`,
      [courseId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { title, content } = req.validatedData;

    // Verify ownership
    const announce = await query('SELECT user_id FROM announcements WHERE id = $1', [announcementId]);
    if (announce.rows.length === 0 || announce.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `UPDATE announcements 
       SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [title, content, announcementId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    // Verify ownership
    const announce = await query('SELECT user_id FROM announcements WHERE id = $1', [announcementId]);
    if (announce.rows.length === 0 || announce.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await query('DELETE FROM announcements WHERE id = $1', [announcementId]);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { content } = req.validatedData;

    const result = await query(
      `INSERT INTO comments (announcement_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [announcementId, req.user.id, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

export const getComments = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const result = await query(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.announcement_id = $1
       ORDER BY c.created_at ASC`,
      [announcementId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Verify ownership
    const comment = await query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    if (comment.rows.length === 0 || comment.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
