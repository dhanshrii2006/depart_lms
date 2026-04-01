import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

import express from 'express';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { nanoid } from 'nanoid';

const { Pool } = pkg;
const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Serve static files from public directory (frontend)
app.use(express.static('public'));

// === MIDDLEWARE ===

// Verify JWT from cookie or Authorization header
const verifyToken = (req, res, next) => {
  // Check cookie first
  let token = req.cookies?.token;
  
  // Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check role
const checkRole = (required) => (req, res, next) => {
  if (req.user.role !== required) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// === AUTHENTICATION ROUTES ===

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});

// ===COURSES ROUTES ===

// GET /api/courses/public - No auth required
app.get('/api/courses/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.invite_code, c.created_at, 
              u.name as teacher_name
       FROM courses c
       INNER JOIN users u ON c.teacher_id = u.id
       WHERE c.is_published = true
       ORDER BY c.created_at DESC`
    );
    res.json({ courses: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/courses
app.get('/api/courses', verifyToken, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'teacher') {
      query = 'SELECT * FROM courses WHERE teacher_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    } else if (req.user.role === 'admin') {
      query = 'SELECT * FROM courses ORDER BY created_at DESC';
    } else if (req.user.role === 'student') {
      query = `
        SELECT c.* FROM courses c
        INNER JOIN enrollments e ON c.id = e.course_id
        WHERE e.student_id = $1
        ORDER BY c.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/courses
app.post('/api/courses', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const inviteCode = nanoid(6).toUpperCase();

    const result = await pool.query(
      `INSERT INTO courses (title, description, invite_code, teacher_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description || '', inviteCode, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/courses/:id
app.get('/api/courses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get course
    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    // Get modules
    const modulesResult = await pool.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY position ASC',
      [id]
    );

    const modules = modulesResult.rows;

    res.json({
      ...course,
      modules
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

  // GET /api/courses/:id/students - Get enrolled students for a course
  app.get('/api/courses/:id/students', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      // Verify teacher owns this course
      const courseResult = await pool.query(
        'SELECT * FROM courses WHERE id = $1 AND teacher_id = $2',
        [id, req.user.id]
      );

      if (courseResult.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found or access denied' });
      }

      // Get enrolled students with progress
      const studentsResult = await pool.query(
        `SELECT DISTINCT 
          users.id, 
          users.name, 
          users.email,
          COALESCE(
            (
              SELECT AVG(CAST((qa.score::float / qa.total::float) * 100 AS INTEGER))
              FROM quiz_attempts qa
              JOIN quizzes q ON qa.quiz_id = q.id
              JOIN modules m ON q.module_id = m.id
              WHERE m.course_id = $1 AND qa.student_id = users.id
            ),
            0
          ) as progress
        FROM enrollments
        JOIN users ON enrollments.student_id = users.id
        WHERE enrollments.course_id = $1
        ORDER BY users.name ASC`,
        [id]
      );

      res.json({
        students: studentsResult.rows
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/teacher/grades - Get all grade data for teacher's students
  app.get('/api/teacher/grades', verifyToken, async (req, res) => {
    try {
      // Get all quiz attempts for students in teacher's courses
      const gradesResult = await pool.query(
        `SELECT 
          users.name as student_name,
          courses.title as course_title,
          quiz_attempts.score,
          quiz_attempts.total
        FROM quiz_attempts
        JOIN users ON quiz_attempts.student_id = users.id
        JOIN quizzes ON quiz_attempts.quiz_id = quizzes.id
        JOIN modules ON quizzes.module_id = modules.id
        JOIN courses ON modules.course_id = courses.id
        WHERE courses.teacher_id = $1
        ORDER BY users.name ASC, courses.title ASC, quiz_attempts.id DESC`,
        [req.user.id]
      );

      res.json(gradesResult.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// POST /api/enrollments/join
app.post('/api/enrollments/join', verifyToken, checkRole('student'), async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code required' });
    }

    // Find course by invite code
    const courseResult = await pool.query(
      'SELECT id FROM courses WHERE invite_code = $1',
      [invite_code.toUpperCase()]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const courseId = courseResult.rows[0].id;

    // Create enrollment
    const result = await pool.query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, course_id) DO NOTHING
       RETURNING *`,
      [req.user.id, courseId]
    );

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/enrollments/my-courses
app.get('/api/enrollments/my-courses', verifyToken, checkRole('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.description,
        c.invite_code,
        c.created_at,
        u.name as teacher_name,
        e.enrolled_at,
        COALESCE(ROUND(100.0 * COUNT(CASE WHEN vp.completed THEN 1 END) / 
          NULLIF(COUNT(vp.id), 0), 0), 0)::INT as progress_pct
      FROM enrollments e
      INNER JOIN courses c ON e.course_id = c.id
      INNER JOIN users u ON c.teacher_id = u.id
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN videos v ON m.id = v.module_id
      LEFT JOIN video_progress vp ON v.id = vp.video_id AND vp.student_id = $1
      WHERE e.student_id = $1
      GROUP BY c.id, c.title, c.description, c.invite_code, c.created_at, u.name, e.enrolled_at
      ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === HEALTH CHECK ===

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// === ERROR HANDLING ===

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// === START SERVER ===

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Acadify server running on http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
});
