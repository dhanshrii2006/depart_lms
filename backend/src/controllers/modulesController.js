import { query } from '../db/pool.js';

export const createLesson = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, orderIndex } = req.validatedData;

    // Verify ownership via module -> course
    const moduleRes = await query(
      `SELECT m.id, m.course_id, c.teacher_id
       FROM course_modules m
       JOIN courses c ON c.id = m.course_id
       WHERE m.id = $1`,
      [moduleId]
    );

    if (moduleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (moduleRes.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `INSERT INTO course_lessons (module_id, title, order_index)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [moduleId, title, orderIndex ?? 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
};
