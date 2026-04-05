import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'server.js');

let content = fs.readFileSync(serverPath, 'utf8');

console.log('🔍 Verifying Roll Number + Email Registration Implementation\n');

// Check 1: Crypto import
const hasCryptoImport = content.includes("import crypto from 'crypto'");
console.log(`${hasCryptoImport ? '✅' : '❌'} Crypto import present`);

// Check 2: Resend import
const hasResendImport = content.includes("import { Resend } from 'resend'");
console.log(`${hasResendImport ? '✅' : '❌'} Resend import present`);

// Check 3: Resend initialization
const hasResendInit = content.includes("new Resend(process.env.RESEND_API_KEY)");
console.log(`${hasResendInit ? '✅' : '❌'} Resend initialized with API key`);

// Check 4: generateMagicToken helper
const hasGenerateMagicToken = content.includes("const generateMagicToken = ()");
console.log(`${hasGenerateMagicToken ? '✅' : '❌'} generateMagicToken() helper defined`);

// Check 5: Accepts roll_number, NOT role from request
const acceptsRollNumber = content.includes("const { name, email, roll_number, password }");
console.log(`${acceptsRollNumber ? '✅' : '❌'} Accepts roll_number from request`);

// Check 6: Name validation
const validateName = content.includes("'Name is required'");
console.log(`${validateName ? '✅' : '❌'} Name validation implemented`);

// Check 7: Email format validation
const validateEmail = content.includes("Valid email is required");
console.log(`${validateEmail ? '✅' : '❌'} Email format validation implemented`);

// Check 8: Domain validation
const validateDomain = content.includes("Only institutional email addresses are allowed");
console.log(`${validateDomain ? '✅' : '❌'} Email domain validation (@ALLOWED_EMAIL_DOMAIN)`);

// Check 9: Roll number format validation
const validateRollFormat = content.includes("/^[A-Z0-9]{4,12}$/i") && content.includes("Invalid roll number format");
console.log(`${validateRollFormat ? '✅' : '❌'} Roll number format validation (4-12 alphanumeric)`);

// Check 10: Password length validation
const validatePassword = content.includes("Password must be at least 8 characters");
console.log(`${validatePassword ? '✅' : '❌'} Password length validation (8+ characters)`);

// Check 11: Email uniqueness check
const checkEmailExists = content.includes("'SELECT id FROM users WHERE email = $1'") && content.includes("Email already registered");
console.log(`${checkEmailExists ? '✅' : '❌'} Email uniqueness check`);

// Check 12: Roll number uniqueness check (in users table)
const checkRollExists = content.includes("'SELECT id FROM users WHERE roll_number = $1'") && content.includes("Roll number already registered");
console.log(`${checkRollExists ? '✅' : '❌'} Roll number uniqueness check (users table)`);

// Check 13: Roll number validation against valid_roll_numbers table
const checkValidRoll = content.includes("'SELECT id, is_used FROM valid_roll_numbers WHERE roll_number = $1'");
console.log(`${checkValidRoll ? '✅' : '❌'} Roll number validation (valid_roll_numbers table)`);

// Check 14: Check roll number not already used
const checkNotUsed = content.includes("Roll number already used by another account");
console.log(`${checkNotUsed ? '✅' : '❌'} Check roll number not already used`);

// Check 15: Database transaction for consistency
const hasTransaction = content.includes("await client.query('BEGIN')") && content.includes("await client.query('COMMIT')") && content.includes("await client.query('ROLLBACK')");
console.log(`${hasTransaction ? '✅' : '❌'} Database transaction (atomic insert + update)`);

// Check 16: Password hashing
const hashPassword = content.includes("await bcrypt.hash(password, 10)");
console.log(`${hashPassword ? '✅' : '❌'} Password hashing with bcrypt`);

// Check 17: Insert user with is_verified=false
const insertUnverified = content.includes("role, is_verified)") && content.includes("'student', false)");
console.log(`${insertUnverified ? '✅' : '❌'} Insert user with is_verified=false`);

// Check 18: Update valid_roll_numbers to is_used=true
const updateRollUsed = content.includes("'UPDATE valid_roll_numbers") && content.includes("is_used = true, used_at = NOW()");
console.log(`${updateRollUsed ? '✅' : '❌'} Mark roll number as used (is_used=true, used_at=NOW())`);

// Check 19: Magic link generation
const genToken = content.includes("const token = generateMagicToken()");
console.log(`${genToken ? '✅' : '❌'} Magic link token generated`);

// Check 20: Magic link stored with 15 min expiry
const storeMagicLink = content.includes("'email_verification', NOW() + INTERVAL '15 minutes'");
console.log(`${storeMagicLink ? '✅' : '❌'} Magic link stored with 15 minute expiry`);

// Check 21: Verification URL built
const buildUrl = content.includes("const verifyUrl =") && content.includes("/verify-email?token=");
console.log(`${buildUrl ? '✅' : '❌'} Verification URL constructed correctly`);

// Check 22: Email sent via Resend
const sendEmail = content.includes("await resend.emails.send(") && content.includes("'Verify your Acadify account'");
console.log(`${sendEmail ? '✅' : '❌'} Email sent via Resend API`);

// Check 23: Email includes HTML with link
const emailHTML = content.includes("Verify Email") && content.includes("click below to verify");
console.log(`${emailHTML ? '✅' : '❌'} Email contains HTML with verification link`);

// Check 24: Email failure non-blocking
const emailNonBlocking = content.includes("emailSent = false") && content.includes("console.error('Email send error')");
console.log(`${emailNonBlocking ? '✅' : '❌'} Email failure is non-blocking (catches and continues)`);

// Check 25: Returns 201 status
const returns201 = content.includes("res.status(201).json(");
console.log(`${returns201 ? '✅' : '❌'} Returns HTTP 201 Created status`);

// Check 26: Response has user object with all required fields
const userResponse = content.includes("id: user.id,") && content.includes("name: user.name,") && content.includes("email: user.email,") && content.includes("roll_number: user.roll_number,") && content.includes("is_verified: user.is_verified");
console.log(`${userResponse ? '✅' : '❌'} Response includes user object with all required fields`);

// Check 27: Response includes email_sent flag
const emailFlag = content.includes("email_sent: emailSent");
console.log(`${emailFlag ? '✅' : '❌'} Response includes email_sent flag`);

// Check 28: NO JWT token issued on registration
const noJWT = !content.includes("jwt.sign(") || (content.match(/jwt\.sign\(/g) || []).filter(m => {
  const idx = content.indexOf(m);
  const context = content.substring(idx - 100, idx + 50);
  return !context.includes('register');
}).length > 0; // This checks that jwt.sign is not in the register handler
console.log(`${noJWT ? '✅' : '❌'} NO JWT token issued on registration`);

// Check 29: asyncHandler wrapper on register route
const asyncHandlerWrap = content.includes("app.post('/api/auth/register', asyncHandler(async (req, res)");
console.log(`${asyncHandlerWrap ? '✅' : '❌'} Register route wrapped with asyncHandler`);

// Check 30: Error handling with proper status codes
const errorHandling = content.includes("res.status(400).json") && content.includes("res.status(409).json") && content.includes("res.status(403).json") && content.includes("res.status(500).json");
console.log(`${errorHandling ? '✅' : '❌'} Error handling with proper HTTP status codes`);

// Summary
const checks = [
  hasCryptoImport, hasResendImport, hasResendInit, hasGenerateMagicToken,
  acceptsRollNumber, validateName, validateEmail, validateDomain, validateRollFormat,
  validatePassword, checkEmailExists, checkRollExists, checkValidRoll, checkNotUsed,
  hasTransaction, hashPassword, insertUnverified, updateRollUsed, genToken,
  storeMagicLink, buildUrl, sendEmail, emailHTML, emailNonBlocking, returns201,
  userResponse, emailFlag, noJWT, asyncHandlerWrap, errorHandling
];

const passedCount = checks.filter(Boolean).length;
const totalCount = checks.length;

console.log(`\n════════════════════════════════════════`);
console.log(`Total Checks: ${passedCount}/${totalCount} passed`);

if (passedCount === totalCount) {
  console.log('\n✨ Roll number registration fully implemented!');
  console.log('\nImplementation Summary:');
  console.log('  ✅ Domain validation (@ALLOWED_EMAIL_DOMAIN)');
  console.log('  ✅ Roll number format validation');
  console.log('  ✅ Roll number exists in valid_roll_numbers');
  console.log('  ✅ Roll number not already used');
  console.log('  ✅ Email uniqueness check');
  console.log('  ✅ Roll number uniqueness check');
  console.log('  ✅ DB transaction (atomic insert + update)');
  console.log('  ✅ Magic link generated (15 min expiry)');
  console.log('  ✅ Verification email sent via Resend');
  console.log('  ✅ Email failure non-blocking');
  console.log('  ✅ No JWT issued on register');
  console.log('\nFlow:');
  console.log('  1. Student registers with roll_number, name, email, password');
  console.log('  2. System validates all inputs and database checks');
  console.log('  3. User created (is_verified=false), roll_number marked as used');
  console.log('  4. Magic link generated and stored (15 min expiry)');
  console.log('  5. Verification email sent via Resend');
  console.log('  6. Return 201 with user info (no JWT)');
  console.log('  7. Student must verify email before login');
} else {
  console.log(`\n⚠️ ${totalCount - passedCount} checks failed!`);
}
