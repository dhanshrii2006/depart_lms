import dotenv from 'dotenv';
dotenv.config();

// ✅ CRITICAL: Validate required environment variables on startup
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'COOKIE_SECRET', 'ALLOWED_EMAIL_DOMAIN', 'APP_URL'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

import crypto from 'crypto';
import express from 'express';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { nanoid } from 'nanoid';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';

const { Pool } = pkg;
const app = express();

// ✅ CRITICAL: Initialize Resend with optional support (may be null for dev)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ✅ CRITICAL: PostgreSQL pool with production settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Max connections in pool
  idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000,  // Fail fast if DB unreachable
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ✅ CRITICAL: Fail fast if database is unreachable at startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ FATAL: Database connection error:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully (pool: max=20, timeout=30s, ssl=' + (process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled') + ')');
    release();
  }
});

// ✅ SECURITY: Apply helmet before all routes
  // Whitelist trusted CDNs: Google Fonts, Font Awesome, Chart.js
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      },
    },
  }));
// ✅ CRITICAL: CORS with restricted origins (not all)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:8080',
  process.env.APP_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (same-origin requests, mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ HIGH: Rate limiter for auth endpoints (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// ✅ HIGH: General rate limiter (100 requests per minute)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  skip: (req) => req.path === '/api/health',  // Skip health check
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);  // Apply to all routes


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

// Alias for authorize — wraps checkRole for convenience
const authorize = checkRole;

  // Validate student domain middleware - enforces college email for students
  const validateStudentDomain = (req, res, next) => {
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || '@stvincentngp.edu.in';
    const email = req.body.email;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!email.endsWith(allowedDomain)) {
      return res.status(403).json({ error: `Only emails with ${allowedDomain} domain are allowed for students` });
    }
    
    next();
  };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Generate magic token for email verification
const generateMagicToken = () => crypto.randomBytes(48).toString('hex');

// Helper function to send magic link emails
const sendMagicLinkEmail = async (to, subject, heading, buttonText, url, footerNote) => {
  try {
    return await resend.emails.send({
      from: `Acadify <noreply@${process.env.ALLOWED_EMAIL_DOMAIN}>`,
      to,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#4F46E5">Acadify</h2>
          <h3>${heading}</h3>
          <a href="${url}" 
             style="background:#4F46E5;color:white;padding:12px 24px;
                    border-radius:6px;text-decoration:none;
                    display:inline-block;margin:16px 0">
            ${buttonText}
          </a>
          <p style="color:#666;font-size:13px">${footerNote}</p>
          <p style="color:#999;font-size:12px">
            If you did not request this, ignore this email.
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Email send error:', error.message);
    return null;
  }
};

// FIX: UUID validation 
  const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  // FIX: asyncHandler
  const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  // === AUTHENTICATION ROUTES ===

// POST /api/auth/register
app.post('/api/auth/register', authLimiter, asyncHandler(async (req, res) => {
  // STEP 1 — Input validation
  const { name, email, roll_number, password } = req.body;

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  // Validate email domain
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (!email.endsWith(`@${allowedDomain}`)) {
    return res.status(400).json({ error: 'Only institutional email addresses are allowed' });
  }

  // Validate roll number format (if provided)
  const rollNumberRegex = /^[A-Z0-9]{4,12}$/i;
  if (roll_number && !rollNumberRegex.test(roll_number)) {
    return res.status(400).json({ error: 'Invalid roll number format' });
  }

  // Validate password
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // STEP 2 — Database checks
    
    // Check 1 — Email already registered
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check 2 — Roll number already registered (if provided)
    if (roll_number) {
      const rollCheck = await pool.query(
        'SELECT id FROM users WHERE roll_number = $1',
        [roll_number.toUpperCase()]
      );
      if (rollCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Roll number already registered' });
      }

      // Check 3 — Roll number valid and unused
      const validRollCheck = await pool.query(
        'SELECT id, is_used FROM valid_roll_numbers WHERE roll_number = $1',
        [roll_number.toUpperCase()]
      );
      if (validRollCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Roll number not found in system. Contact your administrator.' });
      }
      if (validRollCheck.rows[0].is_used) {
        return res.status(403).json({ error: 'Roll number already used by another account' });
      }
    }

    // STEP 3 — Create user in transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 3a — Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3b — Insert user with is_verified=false
      const userResult = await client.query(
        `INSERT INTO users (id, name, email, roll_number, password, role, is_verified)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'student', false)
         RETURNING id, name, email, roll_number, role, is_verified`,
        [name.trim(), email, roll_number ? roll_number.toUpperCase() : null, hashedPassword]
      );
      const user = userResult.rows[0];

      // 3c — Mark roll number as used (if provided)
      if (roll_number) {
        await client.query(
          `UPDATE valid_roll_numbers 
           SET is_used = true, used_at = NOW()
           WHERE roll_number = $1`,
          [roll_number.toUpperCase()]
        );
      }

      await client.query('COMMIT');

      // STEP 4 — Generate and store magic link token
      const token = generateMagicToken();

      // 4b — Store in magic_links table
      await pool.query(
        `INSERT INTO magic_links (user_id, token, type, expires_at)
         VALUES ($1, $2, 'email_verification', NOW() + INTERVAL '15 minutes')`,
        [user.id, token]
      );

      // 4c — Build verification URL
      const verifyUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

      // STEP 5 — Send verification email via Resend
      let emailSent = true;
      if (resend) {
        try {
          await resend.emails.send({
            from: `Acadify <noreply@${allowedDomain}>`,
            to: email,
            subject: 'Verify your Acadify account',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#4F46E5">Acadify</h2>
                <h3>Welcome to Acadify, ${name}!</h3>
                <a href="${verifyUrl}" 
                   style="background:#4F46E5;color:white;padding:12px 24px;
                          border-radius:6px;text-decoration:none;
                          display:inline-block;margin:16px 0">
                  Verify Email
                </a>
                <p style="color:#666;font-size:13px">Your email must be verified before you can log in. This link expires in 15 minutes.</p>
                <p style="color:#999;font-size:12px">
                  If you did not request this, ignore this email.
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Email send error:', emailError.message);
          emailSent = false;
        }
      } else {
        console.warn('⚠️ Email service not configured (RESEND_API_KEY missing) - verification email NOT sent');
        emailSent = false;
      }

      // STEP 6 — Return success response
      res.status(201).json({
        message: emailSent ? 'Registration successful. Please check your email to verify your account.' : 'Registration successful. Email verification unavailable - contact admin.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roll_number: user.roll_number,
          role: user.role,
          is_verified: user.is_verified
        },
        email_sent: emailSent
      });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// POST /api/auth/login
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, roll_number, password, role FROM users WHERE email = $1 OR UPPER(roll_number) = UPPER($1)',
      [identifier]
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
        roll_number: user.roll_number || null,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/'
  });
  res.json({ message: 'Logged out successfully' });
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

// ===== STUDENT AUTHENTICATION =====

// POST /api/auth/student-signup - Register new student
app.post('/api/auth/student-signup', authLimiter, validateStudentDomain, asyncHandler(async (req, res) => {
  const { name, email, uid, password } = req.body;

  // Validate inputs
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!uid || uid.trim().length === 0) {
    return res.status(400).json({ error: 'Username (UID) is required' });
  }
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if UID already exists
    const uidCheck = await pool.query(
      'SELECT id FROM users WHERE roll_number = $1',
      [uid]
    );
    if (uidCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert student
    const result = await pool.query(
      `INSERT INTO users (name, email, roll_number, password, role, is_verified, created_at)
       VALUES ($1, $2, $3, $4, 'student', true, NOW())
       RETURNING id, name, email, roll_number, role`,
      [name, email, uid, hashedPassword]
    );

    const student = result.rows[0];

    // Issue JWT
    const token = jwt.sign(
      { id: student.id, email: student.email, role: 'student', name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    console.log('✅ Student signup:', student.email);
    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      user: { id: student.id, name: student.name, email: student.email, uid: student.roll_number, role: 'student' },
      token
    });

  } catch (error) {
    console.error('Student signup error:', error.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
}));

// POST /api/auth/student-login - Student login
app.post('/api/auth/student-login', authLimiter, validateStudentDomain, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find student by email
    const result = await pool.query(
      'SELECT id, name, email, roll_number, password, role FROM users WHERE email = $1 AND role = $2',
      [email, 'student']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const student = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, student.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: student.id, email: student.email, role: 'student', name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    console.log('✅ Student login:', student.email);
    res.json({
      success: true,
      message: 'Logged in successfully',
      user: { id: student.id, name: student.name, email: student.email, uid: student.roll_number, role: 'student' },
      token
    });

  } catch (error) {
    console.error('Student login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
}));

// ===== TEACHER AUTHENTICATION =====

// POST /api/auth/teacher-login - Teacher login
app.post('/api/auth/teacher-login', authLimiter, asyncHandler(async (req, res) => {
  const { uid, password } = req.body;

  if (!uid || !password) {
    return res.status(400).json({ error: 'UID and password are required' });
  }

  try {
    // Find teacher by UID (roll_number)
    const result = await pool.query(
      'SELECT id, name, email, roll_number, password, role FROM users WHERE roll_number = $1 AND role = $2',
      [uid, 'teacher']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid UID or password' });
    }

    const teacher = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, teacher.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid UID or password' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: teacher.id, email: teacher.email, role: 'teacher', name: teacher.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    console.log('✅ Teacher login:', teacher.email);
    res.json({
      success: true,
      message: 'Logged in successfully',
      user: { id: teacher.id, name: teacher.name, email: teacher.email, uid: teacher.roll_number, role: 'teacher' },
      token
    });

  } catch (error) {
    console.error('Teacher login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
}));

// ===== ADMIN AUTHENTICATION =====

// POST /api/auth/admin-login - Admin login with secret key
app.post('/api/auth/admin-login', authLimiter, asyncHandler(async (req, res) => {
  const { admin_id, password, secret_key } = req.body;

  if (!admin_id || !password || !secret_key) {
    return res.status(400).json({ error: 'Admin ID, password, and secret key are required' });
  }

  try {
    // Verify secret key
    const expectedSecret = process.env.ADMIN_SECRET_KEY;
    if (!expectedSecret || secret_key !== expectedSecret) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    // Find admin by email
    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1 AND role = $2',
      [admin_id, 'admin']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const admin = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin', name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    console.log('✅ Admin login:', admin.email);
    res.json({
      success: true,
      message: 'Admin login successful',
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' },
      token
    });

  } catch (error) {
    console.error('Admin login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
}));

// ===== TEACHER MANAGEMENT (Admin Only) =====

// POST /api/teachers/create - Create new teacher (Admin only)
app.post('/api/teachers/create', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { uid, name, email, password } = req.body;

  // Validate inputs
  if (!uid || uid.trim().length === 0) {
    return res.status(400).json({ error: 'UID is required' });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(uid)) {
    return res.status(400).json({ error: 'UID must contain only letters, numbers, underscore, or dash' });
  }
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if UID already taken
    const uidCheck = await pool.query(
      'SELECT id FROM users WHERE roll_number = $1',
      [uid]
    );
    if (uidCheck.rows.length > 0) {
      return res.status(409).json({ error: 'UID already taken' });
    }

    // Check if email already registered
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert teacher
    const result = await pool.query(
      `INSERT INTO users (name, email, roll_number, password, role, is_verified, created_at)
       VALUES ($1, $2, $3, $4, 'teacher', true, NOW())
       RETURNING id, name, email, roll_number, role, created_at`,
      [name, email, uid, hashedPassword]
    );

    const teacher = result.rows[0];

    console.log('✅ Teacher created:', teacher.email);
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        uid: teacher.roll_number,
        role: teacher.role,
        created_at: teacher.created_at
      }
    });

  } catch (error) {
    console.error('Teacher creation error:', error.message);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
}));

// GET /api/teachers - List all teachers (Admin only)
app.get('/api/teachers', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, roll_number, role, created_at FROM users 
       WHERE role = 'teacher' 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      teachers: result.rows.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        uid: t.roll_number,
        role: t.role,
        created_at: t.created_at
      }))
    });

  } catch (error) {
    console.error('Get teachers error:', error.message);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
}));

// DELETE /api/teachers/:id - Delete teacher (Admin only)
app.delete('/api/teachers/:id', verifyToken, checkRole('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id, email',
      [id, 'teacher']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    console.log('✅ Teacher deleted:', result.rows[0].email);
    res.json({ success: true, message: 'Teacher deleted successfully' });

  } catch (error) {
    console.error('Delete teacher error:', error.message);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
}));

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

  // PATCH /api/courses/:id - Update course (publish)
  app.patch('/api/courses/:id', verifyToken, checkRole('teacher'), async (req, res) => {
    try {
      const { id } = req.params;
      const { is_published } = req.body;

      // Verify teacher owns this course
      const courseResult = await pool.query(
        'SELECT * FROM courses WHERE id = $1 AND teacher_id = $2',
        [id, req.user.id]
      );

      if (courseResult.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found or access denied' });
      }

      // Update is_published status
      const updateResult = await pool.query(
        'UPDATE courses SET is_published = $1 WHERE id = $2 RETURNING *',
        [is_published, id]
      );

      res.json({
        message: 'Course updated successfully',
        course: updateResult.rows[0]
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

  // GET /api/courses/:courseId/enrolled-students - Get enrolled students for a course (minimal info)
app.get('/api/courses/:courseId/enrolled-students', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify teacher owns this course or user is admin
    const courseResult = await pool.query(
      'SELECT teacher_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check authorization (teacher of course or admin)
    const course = courseResult.rows[0];
    if (req.user.role === 'teacher' && req.user.id !== course.teacher_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get enrolled students with name and roll_number only
    const studentsResult = await pool.query(
      `SELECT 
        users.id as student_id,
        users.name,
        users.roll_number,
        enrollments.enrolled_at
      FROM enrollments
      JOIN users ON enrollments.student_id = users.id
      WHERE enrollments.course_id = $1
      ORDER BY enrollments.enrolled_at DESC`,
      [courseId]
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

  // GET /api/teacher/my-students - Get all students enrolled in teacher's courses
  app.get('/api/teacher/my-students', verifyToken, checkRole('teacher'), async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT DISTINCT
          users.id as student_id,
          users.name as student_name,
          users.email,
          courses.id as course_id,
          courses.title as course_title,
          enrollments.enrolled_at,
          enrollments.id as enrollment_id
        FROM enrollments
        JOIN users ON enrollments.student_id = users.id
        JOIN courses ON enrollments.course_id = courses.id
        WHERE courses.teacher_id = $1
        ORDER BY courses.title ASC, users.name ASC`,
        [req.user.id]
      );

      // Group by course for frontend
      const coursesMap = {};
      result.rows.forEach(row => {
        if (!coursesMap[row.course_id]) {
          coursesMap[row.course_id] = {
            course_id: row.course_id,
            course_title: row.course_title,
            student_count: 0,
            students: []
          };
        }
        coursesMap[row.course_id].students.push({
          student_id: row.student_id,
          student_name: row.student_name,
          email: row.email,
          enrolled_at: row.enrolled_at
        });
        coursesMap[row.course_id].student_count = coursesMap[row.course_id].students.length;
      });

      const courses = Object.values(coursesMap);
      const totalStudents = result.rows.length;

      res.json({
        total_enrolled: totalStudents,
        courses: courses
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// POST /api/enrollments/join
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

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const result = await pool.query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
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

// === ASSIGNMENTS ===

// POST /api/assignments - Create assignment (Teacher only)
app.post('/api/assignments', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { course_id, title, description, total_points, due_date, file_url } = req.body;

    if (!course_id || !title || !due_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify teacher owns the course
    const courseCheck = await pool.query(
      'SELECT id FROM courses WHERE id = $1 AND teacher_id = $2',
      [course_id, req.user.id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Course not found or access denied' });
    }

    const result = await pool.query(
      `INSERT INTO assignments (course_id, teacher_id, title, description, total_points, due_date, file_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, course_id, title, description, total_points, due_date, file_url, created_at`,
      [course_id, req.user.id, title, description || null, total_points || 100, due_date, file_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assignments - List all assignments for teacher's courses
app.get('/api/assignments', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { course_id, status, sort_by } = req.query;

    let query = `
      SELECT a.*, c.title as course_title, COUNT(DISTINCT e.student_id) as total_students,
             COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN 1 END) as submitted_count
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.status = 'submitted'
      WHERE a.teacher_id = $1
    `;
    const params = [req.user.id];

    if (course_id) {
      query += ` AND a.course_id = $${params.length + 1}`;
      params.push(course_id);
    }

    query += ` GROUP BY a.id, c.title ORDER BY a.due_date DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assignments/:id - Get assignment details
app.get('/api/assignments/:id', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*, c.title as course_title FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1 AND a.teacher_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/assignments/:id - Update assignment
app.patch('/api/assignments/:id', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, total_points, due_date, file_url } = req.body;

    const result = await pool.query(
      `UPDATE assignments SET title = COALESCE($1, title), description = COALESCE($2, description),
                              total_points = COALESCE($3, total_points), due_date = COALESCE($4, due_date),
                              file_url = COALESCE($5, file_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND teacher_id = $7
       RETURNING *`,
      [title || null, description || null, total_points || null, due_date || null, file_url || null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/assignments/:id - Delete assignment
app.delete('/api/assignments/:id', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM assignments WHERE id = $1 AND teacher_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assignments/:id/submissions - Get all submissions for assignment
app.get('/api/assignments/:id/submissions', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify teacher owns assignment
    const assignmentCheck = await pool.query(
      'SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Assignment not found or access denied' });
    }

    const result = await pool.query(
      `SELECT s.*, u.name as student_name, u.email as student_email
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/assignments/:id/submissions/:submissionId - Grade submission
app.patch('/api/assignments/:id/submissions/:submissionId', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { points_given, teacher_feedback } = req.body;

    // Verify teacher owns assignment
    const assignmentCheck = await pool.query(
      'SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Assignment not found or access denied' });
    }

    const result = await pool.query(
      `UPDATE assignment_submissions SET points_given = $1, teacher_feedback = $2, status = 'graded', graded_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND assignment_id = $4
       RETURNING *`,
      [points_given || null, teacher_feedback || null, submissionId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/templates - Get teacher's saved templates
app.get('/api/templates', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, total_points, file_url, created_at FROM assignment_templates WHERE teacher_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/templates - Save assignment as template
app.post('/api/templates', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { name, description, total_points, file_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Template name required' });
    }

    const result = await pool.query(
      `INSERT INTO assignment_templates (teacher_id, name, description, total_points, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, name, description || null, total_points || 100, file_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/templates/:id - Delete template
app.delete('/api/templates/:id', verifyToken, checkRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM assignment_templates WHERE id = $1 AND teacher_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === STUDENT ASSIGNMENT ENDPOINTS ===

// GET /api/student/assignments - Get all assignments for student's courses
app.get('/api/student/assignments', verifyToken, checkRole('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.title as course_title, c.id as course_id,
              s.id as submission_id, s.submission_link, s.submitted_at, s.status, s.points_given, s.teacher_feedback
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       JOIN enrollments e ON c.id = e.course_id
       LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = $1
       WHERE e.student_id = $1
       ORDER BY a.due_date DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/student/assignments/:id - Get assignment details + submission status
app.get('/api/student/assignments/:id', verifyToken, checkRole('student'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get assignment
    const assignmentResult = await pool.query(
      `SELECT a.*, c.title as course_title FROM assignments a
       JOIN courses c ON a.course_id = c.id
       JOIN enrollments e ON c.id = e.course_id
       WHERE a.id = $1 AND e.student_id = $2`,
      [id, req.user.id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Get submission if exists
    const submissionResult = await pool.query(
      'SELECT id, submission_link, submitted_at, status, points_given, teacher_feedback FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [id, req.user.id]
    );

    const response = {
      ...assignmentResult.rows[0],
      submission: submissionResult.rows[0] || null
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assignments/:id/submit - Submit assignment
app.post('/api/assignments/:id/submit', verifyToken, checkRole('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { submission_link } = req.body;

    if (!submission_link) {
      return res.status(400).json({ error: 'Submission link required' });
    }

    // Check if student is enrolled in the course
    const enrollmentCheck = await pool.query(
      `SELECT e.id FROM enrollments e
       JOIN assignments a ON a.course_id = e.course_id
       WHERE a.id = $1 AND e.student_id = $2`,
      [id, req.user.id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await pool.query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [id, req.user.id]
    );

    if (existingSubmission.rows.length > 0) {
      // Update existing submission
      const result = await pool.query(
        `UPDATE assignment_submissions SET submission_link = $1, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'
         WHERE assignment_id = $2 AND student_id = $3
         RETURNING *`,
        [submission_link, id, req.user.id]
      );

      return res.json({
        message: 'Assignment resubmitted successfully',
        submission: result.rows[0]
      });
    }

    // Create new submission
    const result = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, submission_link, status)
       VALUES ($1, $2, $3, 'submitted')
       RETURNING *`,
      [id, req.user.id, submission_link]
    );

    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === SECTION 2: Admin Roll Number Routes ===

// POST /api/admin/roll-numbers/upload - Upload CSV with roll numbers
app.post('/api/admin/roll-numbers/upload', verifyToken, authorize('admin'), upload.single('file'), asyncHandler(async (req, res) => {
  // Check file exists
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file required' });
  }

  try {
    // Parse CSV from buffer
    const csvContent = req.file.buffer.toString('utf8');
    let lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Skip header row if detected (contains 'roll' or 'number' or 'uid')
    if (lines.length > 0) {
      const headerLower = lines[0].toLowerCase();
      if (headerLower.includes('roll') || headerLower.includes('number') || headerLower.includes('uid')) {
        lines = lines.slice(1);
      }
    }

    // Validate and collect valid roll numbers
    const rollNumberRegex = /^[A-Z0-9]{4,12}$/i;
    const validRollNumbers = [];
    const invalidEntries = [];

    lines.forEach(line => {
      const rollNumber = line.trim().toUpperCase();
      if (rollNumberRegex.test(rollNumber)) {
        validRollNumbers.push(rollNumber);
      } else {
        if (invalidEntries.length < 20) {
          invalidEntries.push(rollNumber);
        }
      }
    });

    // Batch insert valid roll numbers
    let inserted = 0;

    for (const rollNumber of validRollNumbers) {
      try {
        await pool.query(
          `INSERT INTO valid_roll_numbers (roll_number) VALUES ($1) ON CONFLICT (roll_number) DO NOTHING`,
          [rollNumber]
        );
        inserted++;
      } catch (err) {
        // Silently skip on duplicate
      }
    }

    const duplicates = validRollNumbers.length - inserted;

    res.status(200).json({
      message: 'Roll numbers uploaded successfully',
      total: lines.length,
      inserted,
      duplicates,
      skipped: invalidEntries.length,
      invalid_entries: invalidEntries
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}));

// GET /api/admin/roll-numbers - Get roll numbers with filters
app.get('/api/admin/roll-numbers', verifyToken, authorize('admin'), asyncHandler(async (req, res) => {
  const { status = 'all', page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * limitNum;

  let whereClause = '';
  if (status === 'used') {
    whereClause = 'WHERE is_used = true';
  } else if (status === 'unused') {
    whereClause = 'WHERE is_used = false';
  }

  // Get paginated results
  const result = await pool.query(
    `SELECT id, roll_number, is_used, uploaded_at, used_at FROM valid_roll_numbers ${whereClause} ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2`,
    [limitNum, offset]
  );

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM valid_roll_numbers ${whereClause}`
  );
  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limitNum);

  res.json({
    roll_numbers: result.rows,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      pages: totalPages
    }
  });
}));

// DELETE /api/admin/roll-numbers/:rollNumber - Delete an unused roll number
app.delete('/api/admin/roll-numbers/:rollNumber', verifyToken, authorize('admin'), asyncHandler(async (req, res) => {
  const { rollNumber } = req.params;

  // Check if roll number exists
  const checkResult = await pool.query(
    `SELECT id, is_used FROM valid_roll_numbers WHERE roll_number = $1`,
    [rollNumber.toUpperCase()]
  );

  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Roll number not found' });
  }

  const { is_used } = checkResult.rows[0];
  if (is_used) {
    return res.status(400).json({ error: 'Cannot delete roll number already used by a student' });
  }

  // Delete the unused roll number
  await pool.query(
    `DELETE FROM valid_roll_numbers WHERE roll_number = $1`,
    [rollNumber.toUpperCase()]
  );

  res.json({ message: 'Deleted successfully' });
}));

// GET /api/admin/roll-numbers/stats - Get roll number statistics
app.get('/api/admin/roll-numbers/stats', verifyToken, authorize('admin'), asyncHandler(async (req, res) => {
  // Get all counts
  const totalResult = await pool.query('SELECT COUNT(*) as count FROM valid_roll_numbers');
  const usedResult = await pool.query('SELECT COUNT(*) as count FROM valid_roll_numbers WHERE is_used = true');
  const unusedResult = await pool.query('SELECT COUNT(*) as count FROM valid_roll_numbers WHERE is_used = false');

  const totalUploaded = parseInt(totalResult.rows[0].count);
  const totalUsed = parseInt(usedResult.rows[0].count);
  const totalUnused = parseInt(unusedResult.rows[0].count);
  const usagePercentage = totalUploaded > 0 ? parseFloat(((totalUsed / totalUploaded) * 100).toFixed(2)) : 0;

  res.json({
    total_uploaded: totalUploaded,
    total_used: totalUsed,
    total_unused: totalUnused,
    usage_percentage: usagePercentage
  });
}));

// === SECTION 3: Magic Link Routes ===

// GET /api/auth/verify-email - Verify email on registration
app.get('/api/auth/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Query magic link with user info
      const mlResult = await client.query(
        `SELECT ml.*, u.id as user_id, u.email, u.name, u.is_verified
           FROM magic_links ml
           JOIN users u ON ml.user_id = u.id
           WHERE ml.token = $1 AND ml.type = 'email_verification'`,
        [token]
      );

      if (mlResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Invalid or expired verification link' });
      }

      const ml = mlResult.rows[0];

      // Check if already used
      if (ml.used) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This verification link has already been used' });
      }

      // Check if expired
      if (new Date(ml.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
      }

      // Check if already verified
      if (ml.is_verified) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Email already verified. Please login.' });
      }

      // Update user to verified
      await client.query('UPDATE users SET is_verified = true WHERE id = $1', [ml.user_id]);

      // Mark magic link as used
      await client.query('UPDATE magic_links SET used = true WHERE token = $1', [token]);

      await client.query('COMMIT');

      // Issue JWT
      const jwtToken = jwt.sign(
        { id: ml.user_id, email: ml.email, role: 'student', name: ml.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.cookie('token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({
        message: 'Email verified successfully. Welcome to Acadify!',
        user: { id: ml.user_id, name: ml.name, email: ml.email, role: 'student', is_verified: true },
        redirect_url: '/student-dashboard'
      });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Email verification error:', error.message);
    res.status(500).json({ error: 'Error verifying email' });
  }
}));

// POST /api/auth/magic-login/request - Request passwordless login link
app.post('/api/auth/magic-login/request', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // Check if student exists and is verified
    const userResult = await pool.query(
      'SELECT id, name, email, role, is_verified FROM users WHERE email = $1 AND role = \'student\'',
      [email]
    );

    // Always return same response for security
    if (userResult.rows.length === 0 || !userResult.rows[0].is_verified) {
      if (userResult.rows.length > 0 && !userResult.rows[0].is_verified) {
        console.log('Passwordless login requested by unverified student:', email);
      }
      return res.json({ message: 'If that email exists, a login link was sent.' });
    }

    const user = userResult.rows[0];

    // Invalidate previous unused tokens
    await pool.query(
      'UPDATE magic_links SET used = true WHERE user_id = $1 AND type = \'passwordless_login\' AND used = false',
      [user.id]
    );

    // Generate token
    const loginToken = generateMagicToken();

    // Store magic link
    await pool.query(
      `INSERT INTO magic_links (user_id, token, type, expires_at)
       VALUES ($1, $2, 'passwordless_login', NOW() + INTERVAL '15 minutes')`,
      [user.id, loginToken]
    );

    // Send email
    const loginUrl = `${process.env.APP_URL}/magic-login?token=${loginToken}`;
    await sendMagicLinkEmail(
      email,
      'Your Acadify login link',
      'Sign in to Acadify',
      'Sign in',
      loginUrl,
      'This link expires in 15 minutes and can only be used once.'
    );

    console.log('Magic login link sent to:', email);
    res.json({ message: 'If that email exists, a login link was sent.' });
  } catch (error) {
    console.error('Magic login request error:', error.message);
    res.status(500).json({ error: 'Error processing request' });
  }
}));

// GET /api/auth/magic-login/verify - Verify passwordless login
app.get('/api/auth/magic-login/verify', asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Query magic link with user info
      const mlResult = await client.query(
        `SELECT ml.*, u.id as user_id, u.name, u.email, u.role
           FROM magic_links ml
           JOIN users u ON ml.user_id = u.id
           WHERE ml.token = $1 AND ml.type = 'passwordless_login'`,
        [token]
      );

      if (mlResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Invalid or expired login link' });
      }

      const ml = mlResult.rows[0];

      // Check if already used
      if (ml.used) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This login link has already been used' });
      }

      // Check if expired
      if (new Date(ml.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Login link has expired. Please request a new one.' });
      }

      // Mark magic link as used
      await client.query('UPDATE magic_links SET used = true WHERE token = $1', [token]);

      await client.query('COMMIT');

      // Issue JWT
      const jwtToken = jwt.sign(
        { id: ml.user_id, email: ml.email, role: ml.role, name: ml.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.cookie('token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({
        message: 'Logged in successfully!',
        user: { id: ml.user_id, name: ml.name, email: ml.email, role: ml.role, is_verified: true },
        redirect_url: '/student-dashboard'
      });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Magic login verification error:', error.message);
    res.status(500).json({ error: 'Error logging in' });
  }
}));

// POST /api/auth/forgot-password - Request password reset link
app.post('/api/auth/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // Check if user exists (any role, any verification status)
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    // Always return same response for security
    if (userResult.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link was sent.' });
    }

    const user = userResult.rows[0];

    // Invalidate previous unused reset tokens
    await pool.query(
      'UPDATE magic_links SET used = true WHERE user_id = $1 AND type = \'password_reset\' AND used = false',
      [user.id]
    );

    // Generate token
    const resetToken = generateMagicToken();

    // Store magic link
    await pool.query(
      `INSERT INTO magic_links (user_id, token, type, expires_at)
       VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '15 minutes')`,
      [user.id, resetToken]
    );

    // Send email
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    await sendMagicLinkEmail(
      email,
      'Reset your Acadify password',
      'Reset your password',
      'Reset password',
      resetUrl,
      'This link expires in 15 minutes. If you did not request this, ignore this email.'
    );

    console.log('Password reset link sent to:', email);
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ error: 'Error processing request' });
  }
}));

// POST /api/auth/reset-password - Reset password with token
app.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
  const { token, new_password } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Query magic link with user info
      const mlResult = await client.query(
        `SELECT ml.*, u.id as user_id, u.email
           FROM magic_links ml
           JOIN users u ON ml.user_id = u.id
           WHERE ml.token = $1 AND ml.type = 'password_reset'`,
        [token]
      );

      if (mlResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Invalid or expired reset link' });
      }

      const ml = mlResult.rows[0];

      // Check if already used
      if (ml.used) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This reset link has already been used' });
      }

      // Check if expired
      if (new Date(ml.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Reset link has expired. Please request a new password reset.' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, ml.user_id]);

      // Mark reset token as used
      await client.query('UPDATE magic_links SET used = true WHERE token = $1', [token]);

      // Invalidate ALL other unused magic links for this user (security)
      await client.query('UPDATE magic_links SET used = true WHERE user_id = $1 AND used = false', [ml.user_id]);

      await client.query('COMMIT');

      console.log('Password reset completed for user:', ml.user_id);

      // Do NOT issue JWT - force re-login
      res.json({ message: 'Password reset successfully. Please login.' });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Password reset error:', error.message);
    res.status(500).json({ error: 'Error resetting password' });
  }
}));


// // === HEALTH CHECK ===

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
