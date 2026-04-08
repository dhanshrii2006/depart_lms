# 🧪 Manual Authentication Testing Guide

## 🚀 Quick Start

The backend server is running on `http://localhost:8080`

---

## 📝 Test 1: Student Registration with NON-College Email ❌

**Expected Result:** Registration BLOCKED with error message

### cURL Command:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@gmail.com",
    "password": "TestPassword123"
  }'
```

### PowerShell Command:
```powershell
$body = @{
    name = "John Doe"
    email = "john@gmail.com"
    password = "TestPassword123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

### Expected Response:
```json
{
  "error": "Only college email addresses are allowed",
  "details": "Please use email domain: @stvincentngp.edu.in"
}
```

---

## ✅ Test 2: Student Registration with College Email (VALID)

**Expected Result:** Registration SUCCEEDS, user created with college email

### cURL Command:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Student",
    "email": "alice.student@stvincentngp.edu.in",
    "password": "SecurePassword123",
    "roll_number": "STU001"
  }'
```

### PowerShell Command:
```powershell
$body = @{
    name = "Alice Student"
    email = "alice.student@stvincentngp.edu.in"
    password = "SecurePassword123"
    roll_number = "STU001"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

### Expected Response:
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "UUID-STRING",
    "name": "Alice Student",
    "email": "alice.student@stvincentngp.edu.in",
    "roll_number": "STU001",
    "role": "student",
    "is_verified": false
  },
  "email_sent": true
}
```

---

## 📱 Test 3: Magic Login Request with NON-College Email ❌

**Expected Result:** Magic login BLOCKED

### cURL Command:
```bash
curl -X POST http://localhost:8080/api/auth/magic-login/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attacker@yahoo.com"
  }'
```

### PowerShell Command:
```powershell
$body = @{
    email = "attacker@yahoo.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/magic-login/request" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

### Expected Response:
```json
{
  "error": "Only college email addresses are allowed",
  "details": "Please use email domain: @stvincentngp.edu.in"
}
```

---

## 🔑 Test 4: Resend Verification Email with NON-College Email ❌

**Expected Result:** Resend BLOCKED

### cURL Command:
```bash
curl -X POST http://localhost:8080/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hacker@gmail.com"
  }'
```

### PowerShell Command:
```powershell
$body = @{
    email = "hacker@gmail.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/resend-verification" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

### Expected Response:
```json
{
  "error": "Only college email addresses are allowed",
  "details": "Please use email domain: @stvincentngp.edu.in"
}
```

---

## 🔄 Test 5: Forgot Password with NON-College Email

**Expected Result:** Generic response (for security - doesn't reveal if email exists)

### cURL Command:
```bash
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unknown@hotmail.com"
  }'
```

### PowerShell Command:
```powershell
$body = @{
    email = "unknown@hotmail.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/forgot-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

### Expected Response:
```json
{
  "message": "If that email exists, a reset link was sent."
}
```

---

## 👨‍🏫 Test 6: Teacher Login (No Domain Restriction)

**Expected Result:** Any email domain allowed (teachers not restricted)

### cURL Command:
```bash
curl -X POST http://localhost:8080/api/auth/teacher-login \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Teacher",
    "email": "bob.teacher@gmail.com",
    "password": "TeacherPass123"
  }'
```

### PowerShell Command:
```powershell
$body = @{
    name = "Bob Teacher"
    email = "bob.teacher@gmail.com"
    password = "TeacherPass123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/teacher-login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

### Expected Response:
```json
{
  "message": "Teacher login successful",
  "user": {
    "id": "UUID",
    "name": "Bob Teacher",
    "email": "bob.teacher@gmail.com",
    "role": "teacher"
  }
}
```

---

## 🧪 Test 7: Health Check (Always Works)

### cURL Command:
```bash
curl http://localhost:8080/api/health
```

### PowerShell Command:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing
```

### Expected Response:
```json
{
  "status": "ok",
  "message": "Acadify backend is running"
}
```

---

## 📊 Testing Summary

| Test # | Endpoint | Email Domain | Expected Result |
|--------|----------|--------------|-----------------|
| 1 | `/api/auth/register` | `@gmail.com` | ❌ BLOCKED |
| 2 | `/api/auth/register` | `@stvincentngp.edu.in` | ✅ SUCCESS |
| 3 | `/api/auth/magic-login/request` | `@yahoo.com` | ❌ BLOCKED |
| 4 | `/api/auth/resend-verification` | `@gmail.com` | ❌ BLOCKED |
| 5 | `/api/auth/forgot-password` | `@hotmail.com` | ✅ Generic response |
| 6 | `/api/auth/teacher-login` | `@gmail.com` | ✅ SUCCESS |
| 7 | `/api/health` | N/A | ✅ OK |

---

## 🛠️ Using Postman (Optional)

If you prefer Postman:

1. Open Postman
2. Create new request
3. Set method to `POST`
4. Set URL to one of the endpoints above
5. Go to "Body" tab
6. Select "raw" and "JSON"
7. Paste the JSON payload
8. Click "Send"

---

## 📋 Using Browser Console (Frontend Testing)

If testing from the frontend UI:

```javascript
// Test registration with non-college email via JavaScript
fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@gmail.com',
    password: 'TestPass123'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

---

## ✨ Key Points to Verify

- ✅ **Non-college emails are REJECTED** by `/api/auth/register`
- ✅ **College emails are ACCEPTED** by `/api/auth/register`
- ✅ **Non-college emails are REJECTED** by `/api/auth/magic-login/request`
- ✅ **Non-college emails are REJECTED** by `/api/auth/resend-verification`
- ✅ **Teachers can use ANY email** for `/api/auth/teacher-login`
- ✅ **Error messages are consistent** across all endpoints
- ✅ **Server doesn't crash** on invalid requests

---

## 🔍 Troubleshooting

### Problem: "Connection refused"
**Solution:** Make sure server is running: `cd backend && node server.js`

### Problem: "CORS error" in browser
**Solution:** Make sure you're hitting `http://localhost:8080` (same origin as frontend)

### Problem: "Rate limit exceeded"
**Solution:** Wait 15 minutes or restart server (auth endpoints limited to 5 requests/15 min)

### Problem: "Email already registered"
**Solution:** Use a different email address (each email can only register once)

---

## 📝 Notes

- Server must be running on port 8080
- Database must be connected and populated
- .env must have `ALLOWED_EMAIL_DOMAIN=stvincentngp.edu.in`
- All timestamps in UTC
