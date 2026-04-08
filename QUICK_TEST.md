# 📋 Quick Manual Testing Checklist

## 🎯 Quick Test Without Rate Limiting

If you've hit the rate limiter (5 requests/15 min), wait a bit. Then try these:

---

## ✅ Test 1: Non-College Email (Should FAIL)

**Copy-paste this in PowerShell:**

```powershell
$body = '{"name":"BadUser","email":"baduser@example.com","password":"BadPass123"}'
Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

**Expected Response:**
```
Status: 403
Body: {"error":"Only college email addresses are allowed","details":"Please use email domain: @stvincentngp.edu.in"}
```

---

## ✅ Test 2: College Email (Should SUCCEED)

**Copy-paste this in PowerShell:**

```powershell
$body = '{"name":"GoodStudent","email":"goodstudent2024@stvincentngp.edu.in","password":"GoodPass123"}'
Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

**Expected Response:**
```
Status: 201
Body: {"message":"Registration successful...","user":{...},"email_sent":true}
```

---

## ✅ Test 3: Health Check (Always Works)

**Copy-paste this in PowerShell:**

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing
```

**Expected Response:**
```
Status: 200
Body: {"status":"ok","message":"Acadify backend is running"}
```

---

## 🔗 All Endpoints to Test

| Test | Endpoint | Method | Should |
|------|----------|--------|--------|
| 1 | `/api/auth/register` | POST | Block @gmail.com |
| 2 | `/api/auth/register` | POST | Allow @stvincentngp.edu.in |
| 3 | `/api/auth/magic-login/request` | POST | Block @yahoo.com |
| 4 | `/api/auth/resend-verification` | POST | Block @hotmail.com |
| 5 | `/api/auth/student-login` | POST | Block @outlook.com |
| 6 | `/api/auth/teacher-login` | POST | Allow @gmail.com |
| 7 | `/api/health` | GET | Always return 200 |

---

## 📝 What Each Should Do

### Students (/api/auth/register, /api/auth/student-login, etc.)
- ✅ **Allow**: `user@stvincentngp.edu.in`
- ❌ **Block**: `user@gmail.com`, `user@yahoo.com`, `user@hotmail.com`
- ✅ **Error**: "Only college email addresses are allowed"

### Teachers (/api/auth/teacher-login)
- ✅ **Allow**: ANY email (`@gmail.com`, `@yahoo.com`, etc.)
- ✅ **No domain restriction**

### Public (/api/health)
- ✅ **Always** returns 200 OK

---

## 🧪 Using Browser DevTools

If you're testing from the UI:

1. Open Browser DevTools (F12)
2. Go to Console tab
3. Paste this:

```javascript
fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@gmail.com',
    password: 'TestPass123'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

Should see: `{"error":"Only college email addresses are allowed",...}`

---

## 🔑 Key Points to Verify

- ✅ Non-college emails get rejected with proper error
- ✅ College emails get accepted and user is created
- ✅ Error message is clear and consistent
- ✅ Teachers can use any email
- ✅ Server doesn't crash on invalid requests
- ✅ Health check always works

---

## 💡 Troubleshooting

### Problem: "429 Too Many Requests"
**Solution**: Rate limiter triggered. Wait 15 minutes or restart server.

### Problem: "409 Conflict" on valid registration
**Solution**: Email already exists. Use a different email address.

### Problem: "Connection refused"
**Solution**: Server not running. Run: `cd backend && node server.js`

### Problem: "CORS error" in browser
**Solution**: Make sure you're on same domain (localhost:8080)

---

## 📚 Additional Resources

- See `TESTING_GUIDE.md` for detailed endpoint documentation
- See `run-tests.ps1` for automated testing script
- See `server.js` around line 189 for `validateStudentDomain` middleware

Happy testing! 🚀
