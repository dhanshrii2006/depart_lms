import { query } from '../db/pool.js';

export const createMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, linkUrl } = req.validatedData;

    // Verify course ownership
    const course = await query('SELECT teacher_id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0 || course.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const result = await query(
      `INSERT INTO materials (course_id, created_by, title, description, link_url, file_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [courseId, req.user.id, title, description || '', linkUrl || null, fileUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
};

export const getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await query(
      `SELECT m.*, u.first_name, u.last_name
       FROM materials m
       JOIN users u ON m.created_by = u.id
       WHERE m.course_id = $1
       ORDER BY m.created_at DESC`,
      [courseId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    // Verify ownership
    const material = await query('SELECT created_by FROM materials WHERE id = $1', [materialId]);
    if (material.rows.length === 0 || material.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await query('DELETE FROM materials WHERE id = $1', [materialId]);

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
};
