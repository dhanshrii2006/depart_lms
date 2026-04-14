import { query } from '../db/pool.js';
import bcrypt from 'bcryptjs';

export const getStats = async (req, res) => {
  try {
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    const coursesResult = await query('SELECT COUNT(*) as count FROM courses');
    const enrollmentsResult = await query('SELECT COUNT(*) as count FROM enrollments');

    res.json({
      totalUsers: parseInt(usersResult.rows[0].count),
      totalCourses: parseInt(coursesResult.rows[0].count),
      totalEnrollments: parseInt(enrollmentsResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const role = req.query.role || null;

    let result;
    if (role) {
      result = await query(
        'SELECT id, email, first_name, last_name, role, is_banned, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
        [role]
      );
    } else {
      result = await query(
        'SELECT id, email, first_name, last_name, role, is_banned, created_at FROM users ORDER BY created_at DESC'
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { banned } = req.body;

    const result = await query(
      'UPDATE users SET is_banned = $1 WHERE id = $2 RETURNING id, email, is_banned',
      [banned, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const createTeacher = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.validatedData;

    // Check if email exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role`,
      [email, passwordHash, firstName, lastName, 'teacher']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
};

export const uploadRollNumbers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fs = await import('fs/promises');
    const content = await fs.readFile(req.file.path, 'utf-8');
    const rollNumbers = content.split('\n').map(line => line.trim()).filter(line => line);

    for (const rollNumber of rollNumbers) {
      await query(
        'INSERT INTO valid_roll_numbers (roll_number) VALUES ($1) ON CONFLICT DO NOTHING',
        [rollNumber]
      );
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({ 
      message: 'Roll numbers uploaded successfully',
      count: rollNumbers.length
    });
  } catch (error) {
    console.error('Upload roll numbers error:', error);
    res.status(500).json({ error: 'Failed to upload roll numbers' });
  }
};

export const getValidRollNumbers = async (req, res) => {
  try {
    const result = await query(
      'SELECT roll_number, is_used FROM valid_roll_numbers ORDER BY roll_number ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get roll numbers error:', error);
    res.status(500).json({ error: 'Failed to fetch roll numbers' });
  }
};
