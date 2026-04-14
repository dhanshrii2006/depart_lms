import { query } from '../db/pool.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, rollNumber } = req.validatedData;

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // For students, validate roll number
    if (rollNumber) {
      const validRoll = await query(
        'SELECT id, is_used FROM valid_roll_numbers WHERE roll_number = $1',
        [rollNumber]
      );

      if (validRoll.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid roll number' });
      }

      if (validRoll.rows[0].is_used) {
        return res.status(400).json({ error: 'Roll number already registered' });
      }

      // Mark roll number as used
      await query('UPDATE valid_roll_numbers SET is_used = true WHERE roll_number = $1', [rollNumber]);
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, roll_number, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role`,
      [email, passwordHash, firstName, lastName, rollNumber || null, 'student']
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    const result = await query(
      'SELECT id, email, password_hash, role, is_banned FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been banned' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
};

export const me = async (req, res) => {
  if (!req.user) {
    return res.status(200).json(null);
  }

  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, avatar_url, bio, roll_number
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, avatarUrl } = req.validatedData;

    const result = await query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, bio = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, role, avatar_url, bio`,
      [firstName, lastName, bio, avatarUrl, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
