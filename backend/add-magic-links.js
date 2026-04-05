import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'server.js');

let content = fs.readFileSync(serverPath, 'utf8');

console.log('🔗 Implementing Complete Magic Link System...\n');

// 1. Add rateLimit import
if (!content.includes("import rateLimit from 'express-rate-limit'")) {
  const importIndex = content.indexOf("import multer from 'multer';");
  if (importIndex !== -1) {
    const insertPoint = content.indexOf('\n', importIndex) + 1;
    content = content.slice(0, insertPoint) + "import rateLimit from 'express-rate-limit';\n" + content.slice(insertPoint);
    console.log('✅ Added rateLimit import');
  }
}

// 2. Add rate limiter initialization after app.use middleware
if (!content.includes('const authLimiter = rateLimit')) {
  const corsIndex = content.indexOf("app.use(cors({");
  if (corsIndex !== -1) {
    const endOfCorsBlock = content.indexOf('}))', corsIndex) + 3;
    const nextNewline = content.indexOf('\n', endOfCorsBlock);
    const insertPoint = nextNewline + 1;
    
    const limiterCode = `
// Rate limiter for auth endpoints (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
`;
    content = content.slice(0, insertPoint) + limiterCode + '\n' + content.slice(insertPoint);
    console.log('✅ Added rate limiter configuration');
  }
}

// 3. Add sendMagicLinkEmail helper after generateMagicToken
if (!content.includes('const sendMagicLinkEmail = async')) {
  const tokenGeneratorIndex = content.indexOf('const generateMagicToken = ()');
  if (tokenGeneratorIndex !== -1) {
    const nextSemicolon = content.indexOf(';', tokenGeneratorIndex) + 1;
    const nextNewline = content.indexOf('\n', nextSemicolon) + 1;
    
    const emailHelperCode = `
// Helper function to send magic link emails
const sendMagicLinkEmail = async (to, subject, heading, buttonText, url, footerNote) => {
  try {
    return await resend.emails.send({
      from: \`Acadify <noreply@\${process.env.ALLOWED_EMAIL_DOMAIN}>\`,
      to,
      subject,
      html: \`
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#4F46E5">Acadify</h2>
          <h3>\${heading}</h3>
          <a href="\${url}" 
             style="background:#4F46E5;color:white;padding:12px 24px;
                    border-radius:6px;text-decoration:none;
                    display:inline-block;margin:16px 0">
            \${buttonText}
          </a>
          <p style="color:#666;font-size:13px">\${footerNote}</p>
          <p style="color:#999;font-size:12px">
            If you did not request this, ignore this email.
          </p>
        </div>
      \`
    });
  } catch (error) {
    console.error('Email send error:', error.message);
    return null;
  }
};
`;
    content = content.slice(0, nextNewline) + emailHelperCode + content.slice(nextNewline);
    console.log('✅ Added sendMagicLinkEmail helper');
  }
}

// 4. Update registration email to use helper
if (!content.includes('await sendMagicLinkEmail(') && content.includes("await resend.emails.send({")) {
  const regEmailStart = content.indexOf('await resend.emails.send({', content.indexOf('/api/auth/register'));
  if (regEmailStart !== -1) {
    const regEmailEnd = content.indexOf('});', regEmailStart) + 3;
    const regEmailBlock = content.substring(regEmailStart, regEmailEnd);
    
    if (regEmailBlock.includes('Verify your Acadify account')) {
      const replacement = `await sendMagicLinkEmail(
        email,
        'Verify your Acadify account',
        \`Welcome to Acadify, \${name}!\`,
        'Verify Email',
        verifyUrl,
        \`Your roll number \${roll_number.toUpperCase()} has been registered. This link expires in 15 minutes.\`
      )`;
      content = content.slice(0, regEmailStart) + replacement + content.slice(regEmailEnd);
      console.log('✅ Updated registration email to use helper');
    }
  }
}

// 5. Add 5 new magic link routes before HEALTH CHECK section
if (!content.includes('GET /api/auth/verify-email')) {
  const healthCheckIndex = content.indexOf('// === HEALTH CHECK ===');
  if (healthCheckIndex !== -1) {
    const routesCode = `// === SECTION 3: Magic Link Routes ===

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
        \`SELECT ml.*, u.id as user_id, u.email, u.name, u.is_verified
           FROM magic_links ml
           JOIN users u ON ml.user_id = u.id
           WHERE ml.token = $1 AND ml.type = 'email_verification'\`,
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
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // Check if student exists and is verified
    const userResult = await pool.query(
      'SELECT id, name, email, role, is_verified FROM users WHERE email = $1 AND role = \\'student\\'',
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
      'UPDATE magic_links SET used = true WHERE user_id = $1 AND type = \\'passwordless_login\\' AND used = false',
      [user.id]
    );

    // Generate token
    const loginToken = generateMagicToken();

    // Store magic link
    await pool.query(
      \`INSERT INTO magic_links (user_id, token, type, expires_at)
       VALUES ($1, $2, 'passwordless_login', NOW() + INTERVAL '15 minutes')\`,
      [user.id, loginToken]
    );

    // Send email
    const loginUrl = \`\${process.env.APP_URL}/magic-login?token=\${loginToken}\`;
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
        \`SELECT ml.*, u.id as user_id, u.name, u.email, u.role
           FROM magic_links ml
           JOIN users u ON ml.user_id = u.id
           WHERE ml.token = $1 AND ml.type = 'passwordless_login'\`,
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
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
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
      'UPDATE magic_links SET used = true WHERE user_id = $1 AND type = \\'password_reset\\' AND used = false',
      [user.id]
    );

    // Generate token
    const resetToken = generateMagicToken();

    // Store magic link
    await pool.query(
      \`INSERT INTO magic_links (user_id, token, type, expires_at)
       VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '15 minutes')\`,
      [user.id, resetToken]
    );

    // Send email
    const resetUrl = \`\${process.env.APP_URL}/reset-password?token=\${resetToken}\`;
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
        \`SELECT ml.*, u.id as user_id, u.email
           FROM magic_links ml
           JOIN users u ON ml.user_id = u.id
           WHERE ml.token = $1 AND ml.type = 'password_reset'\`,
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

`;
    content = content.slice(0, healthCheckIndex) + routesCode + '\n// ' + content.slice(healthCheckIndex);
    console.log('✅ Added 5 magic link routes');
  }
}

// Write back
fs.writeFileSync(serverPath, content, 'utf8');

console.log('\n✨ Magic Link System implemented!');
console.log('\nNew endpoints:');
console.log('  GET /api/auth/verify-email (email verification)');
console.log('  POST /api/auth/magic-login/request (request login link)');
console.log('  GET /api/auth/magic-login/verify (verify & login)');
console.log('  POST /api/auth/forgot-password (request reset link)');
console.log('  POST /api/auth/reset-password (reset password)');
console.log('\nHelper:');
console.log('  sendMagicLinkEmail() - reusable email sender');
console.log('  authLimiter - rate limiting (5 req/15 min)');
console.log('\nTest with: npm start');
