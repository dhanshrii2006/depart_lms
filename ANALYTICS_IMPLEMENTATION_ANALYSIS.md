# Acadify Analytics/Progress Implementation Analysis

**Date:** April 1, 2026  
**Project:** Acadify - Learning Management System (LMS)

---

## Executive Summary

The Acadify project has a foundation for analytics and progress tracking with a dedicated analytics/progress page and backend database schema. However, the current implementation is **partially complete** with hardcoded frontend data and missing API endpoints for submitting and retrieving detailed analytics.

---

## 1. ANALYTICS PAGE IMPLEMENTATION

### **File Location:** `frontend/progress.html`
- **Size:** 382 lines
- **URL:** http://localhost:5000/progress.html

### **Current Implementation:**

#### **Displayed Metrics:**
1. **Progress Statistics:**
   - Courses Completed: 12 (hardcoded)
   - Learning Hours: 256 (hardcoded)
   - Average Score: 87% (hardcoded)
   - Day Streak: 15 (hardcoded)

2. **Charts (using Chart.js):**
   - **Weekly Progress Chart:** Line chart showing hours learned per day (Mon-Sun)
     - Data: [3, 5, 2, 6, 4, 1, 7] (hardcoded)
   - **Quiz Scores by Course:** Bar chart showing scores for each course
     - Labels: React, Web Dev, JS Advanced, Database
     - Data: [82, 75, 92, 68] (hardcoded)

3. **Course Progress:**
   - React Fundamentals: 75% (6 of 8 modules)
   - Web Development Basics: 60% (3 of 5 modules)
   - JavaScript Advanced: 90% (9 of 10 modules)
   - Database Design: 45% (5 of 11 modules)

4. **Achievements Section:**
   - 4 achievement cards (locked/unlocked status)
   - Examples: "First Flight", "Week Warrior", "Quiz Master", "Master"

#### **Technologies Used:**
- Chart.js library for data visualization
- CSS animations and gradients for UI
- Embedded JavaScript with hardcoded chart data
- Authentication via `auth.js` for role verification

#### **User Information Display:**
- User name from `getUserName()` (from localStorage)
- User initials from `getUserInitials()` (derived from name)

---

## 2. BACKEND API ENDPOINTS FOR ANALYTICS

### **Current Endpoints Serving Analytics Data:**

#### **1. GET /api/enrollments/my-courses** (Student)
**Location:** `backend/server.js` (lines ~350-380)
```javascript
Query: Joins enrollments, courses, users, modules, and video_progress tables
Returns: 
- course.id
- course.title
- course.description
- teacher_name
- enrolled_at
- progress_pct (calculated as percentage of completed videos)
```

**Response Example:**
```json
[
  {
    "id": "uuid",
    "title": "React Fundamentals",
    "description": "Learn React basics",
    "teacher_name": "John Doe",
    "enrolled_at": "2026-04-01T10:00:00Z",
    "progress_pct": 75
  }
]
```

#### **2. GET /api/courses/:id/students** (Teacher)
**Location:** `backend/server.js` (lines ~300-330)
```javascript
Query: Gets enrolled students with their progress for specific course
Returns:
- user.id
- user.email
- progress (calculated as average quiz score)
```

#### **3. GET /api/teacher/grades** (Teacher)
**Location:** `backend/server.js` (lines ~330-350)
```javascript
Query: Gets all quiz attempts for teacher's students
Returns:
- student_name
- course_title
- quiz_attempts.score
- quiz_attempts.total
- Ordered by student name, course, and date
```

### **Missing Analytics Endpoints:**
- ❌ `POST /api/quiz-attempts` - Submit quiz results
- ❌ `POST /api/video-progress` - Mark videos as complete
- ❌ `GET /api/student/progress` - Get overall student progress
- ❌ `GET /api/student/analytics` - Get detailed analytics for a student
- ❌ `GET /api/course/:id/analytics` - Get course-level analytics

---

## 3. DATA CURRENTLY DISPLAYED ON ANALYTICS PAGE

### **Frontend Data Flow:**

```
progress.html
├── User Identity (from localStorage)
├── Hardcoded Stats
│   ├── Completed Courses: 12
│   ├── Learning Hours: 256
│   ├── Average Score: 87%
│   └── Day Streak: 15
├── Chart.js Visualizations (hardcoded data)
│   ├── Weekly Progress [3, 5, 2, 6, 4, 1, 7]
│   └── Quiz Scores [82, 75, 92, 68]
└── Course Progress Items (hardcoded)
    ├── React Fundamentals: 75%
    ├── Web Development: 60%
    ├── JavaScript Advanced: 90%
    └── Database Design: 45%
```

### **Note:** 
The progress page currently displays **hardcoded data only**. It imports `auth.js` and `api.js` but doesn't make any API calls to fetch real analytics data. The page primarily demonstrates the UI/UX design.

---

## 4. STUDENT IDENTIFICATION HANDLING

### **Authentication & User Identification:**

#### **Location:** `frontend/auth.js` (46 lines)

#### **User Data Storage (localStorage):**
```javascript
// Keys used:
localStorage.getItem('userRole')      // 'student', 'teacher', or 'admin'
localStorage.getItem('userName')      // e.g., 'Student User'
localStorage.getItem('userInitials')  // e.g., 'SU'
localStorage.getItem('authToken')     // JWT token
localStorage.getItem('userId')        // User UUID (used in quiz.js)
```

#### **Authentication Flow:**
1. **Login:** User logs in at `index.html`
   - Credentials sent to `POST /api/auth/login`
   - Server validates credentials against `users` table
   - Returns JWT token (stored in cookie + localStorage)

2. **Role Verification:**
   - `checkAuth(requiredRole)` called on each page
   - Validates user has required role, else redirects to index.html

3. **API Requests:**
   - Token passed via Authorization header: `Bearer <token>`
   - Backend verifies token in `verifyToken` middleware
   - Role checked via `checkRole(required)` middleware

#### **JWT Token Content:**
```javascript
{
  id: user.id,
  email: user.email,
  role: user.role,
  name: user.name,
  expiresIn: '7d'
}
```

---

## 5. DATABASE SCHEMA FOR ANALYTICS/PROGRESS

### **Location:** `backend/migrate.js`

#### **Core Analytics Tables:**

##### **1. quiz_attempts**
```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  quiz_id UUID NOT NULL REFERENCES quizzes(id),
  answers JSONB,                    -- Student's answers
  score INT,                        -- Score points
  total INT,                        -- Total possible points
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Stores all quiz submissions with scores

##### **2. video_progress**
```sql
CREATE TABLE video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  video_id UUID NOT NULL REFERENCES videos(id),
  completed BOOLEAN DEFAULT false,  -- Whether video was watched
  watched_at TIMESTAMP,
  UNIQUE(student_id, video_id)
);
```
**Purpose:** Tracks video completion status per student

##### **3. enrollments**
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)    -- One enrollment per student per course
);
```
**Purpose:** Links students to courses they're enrolled in

##### **4. users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Stores all user profiles

#### **Supporting Tables for Analytics:**

##### **5. quizzes**
```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules(id),
  title VARCHAR(255)
);
```

##### **6. modules**
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(255),
  position INT
);
```

##### **7. videos**
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES videos(id),
  title VARCHAR(255),
  embed_url TEXT,
  duration INT,
  position INT
);
```

##### **8. courses**
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  teacher_id UUID NOT NULL,
  invite_code VARCHAR(10) UNIQUE,
  is_published BOOLEAN,
  created_at TIMESTAMP
);
```

### **Progress Calculation Query (current implementation):**
```sql
SELECT
  c.id, c.title, c.description,
  COALESCE(
    ROUND(100.0 * COUNT(CASE WHEN vp.completed THEN 1 END) / 
    NULLIF(COUNT(vp.id), 0), 0), 0
  )::INT as progress_pct
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.id
LEFT JOIN modules m ON c.id = m.course_id
LEFT JOIN videos v ON m.id = v.module_id
LEFT JOIN video_progress vp ON v.id = vp.video_id 
  AND vp.student_id = $1
WHERE e.student_id = $1
GROUP BY c.id, c.title, c.description
```
**Calculation:** Percentage of videos marked as completed in a course

---

## 6. CURRENT ARCHITECTURE OVERVIEW

### **Data Flow Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND                                 │
├─────────────────────────────────────────────────────────────┤
│ progress.html (hardcoded data display)                      │
│   ├── User Info (from localStorage)                         │
│   ├── Stats (hardcoded: 12, 256, 87%, 15)                  │
│   ├── Charts (Chart.js with hardcoded data)                │
│   └── Course Progress (hardcoded items)                    │
│                                                              │
│ api.js & auth.js (API client)                              │
│   ├── authAPI.login/logout                                 │
│   ├── coursesAPI.list/get                                  │
│   └── enrollmentsAPI.myCourses                             │
└───────────────────────────────────────────────────────────────
                           ↓ HTTP/REST API
┌────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)               │
├────────────────────────────────────────────────────────────┤
│ server.js                                                   │
│   ├── POST /api/auth/login      → JWT Token                │
│   ├── GET /api/enrollments/my-courses  → Courses + Progress│
│   ├── GET /api/courses/:id/students    → Student Progress  │
│   └── GET /api/teacher/grades         → Quiz Attempts     │
│                                                              │
│ Middleware:                                                 │
│   ├── verifyToken (JWT validation)                        │
│   └── checkRole (RBAC)                                     │
└────────────────────────────────────────────────────────────┐
                           ↓ PostgreSQL Driver
┌────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                      │
├────────────────────────────────────────────────────────────┤
│ Tables:                                                      │
│   ├── users (id, name, email, role, created_at)           │
│   ├── enrollments (student_id, course_id, enrolled_at)    │
│   ├── courses (id, title, teacher_id, invite_code)        │
│   ├── modules (id, course_id, title, position)            │
│   ├── videos (id, module_id, title, duration)             │
│   ├── video_progress (student_id, video_id, completed)    │
│   ├── quizzes (id, module_id, title)                      │
│   ├── questions (id, quiz_id, body, options)              │
│   └── quiz_attempts (student_id, quiz_id, score, total)   │
└────────────────────────────────────────────────────────────┘
```

---

## 7. KEY FILES & FILE LOCATIONS

### **Frontend Files:**
| File | Location | Purpose |
|------|----------|---------|
| progress.html | `frontend/progress.html` | Analytics page (382 lines) |
| my-courses.html | `frontend/my-courses.html` | Shows courses with progress_pct |
| quiz.html | `frontend/quiz.html` | Quiz interface (stores locally atm) |
| api.js | `frontend/api.js` | API client (fetchWithAuth, authAPI, coursesAPI) |
| auth.js | `frontend/auth.js` | Auth utilities (checkAuth, getUserName, getUserId) |
| lesson.html | `frontend/lesson.html` | Video lesson player |
| style.css | `frontend/style.css` | Global styles |

### **Backend Files:**
| File | Location | Purpose |
|------|----------|---------|
| server.js | `backend/server.js` | Main server (401 lines) |
| migrate.js | `backend/migrate.js` | Database schema creation |
| seed.js | `backend/seed.js` | Sample data initialization |
| package.json | `backend/package.json` | Dependencies configuration |
| .env | `backend/.env` | Environment variables (PORT, DATABASE_URL, JWT_SECRET) |

### **Configuration:**
- Backend serves on: `http://localhost:5000` (or configured PORT)
- Database: PostgreSQL connection string from `DATABASE_URL`
- JWT Secret: From `JWT_SECRET` environment variable

---

## 8. IDENTIFIED GAPS & LIMITATIONS

### **Frontend Issues:**
1. ❌ **Hardcoded Data:** All progress stats and charts use hardcoded values
2. ❌ **No API Integration:** progress.html doesn't call any analytics endpoints
3. ❌ **Quiz Data Storage:** Quiz attempts stored only in localStorage, not sent to backend

### **Backend Issues:**
1. ❌ **Missing Submission Endpoints:** No endpoints to submit quiz attempts or mark videos complete
2. ❌ **Limited Query Endpoints:** Only 2-3 endpoints for reading analytics data
3. ❌ **No Real-time Analytics:** No dashboard showing overall system analytics

### **Database Issues:**
1. ✓ Schema is well-designed and normalized
2. ✓ Supports the analytics use case
3. But: No sample data in seed.js for quiz_attempts or video_progress

---

## 9. NEXT STEPS FOR FULL IMPLEMENTATION

### **Priority 1: Backend API Endpoints**
```javascript
// Implement these endpoints:
POST /api/quiz-attempts
POST /api/video-progress  
GET /api/student/progress
GET /api/student/analytics
GET /api/course/:id/analytics
```

### **Priority 2: Frontend Integration**
```javascript
// Update progress.html to:
// 1. Fetch real data from /api/student/progress
// 2. Fetch quiz attempts from /api/quiz-attempts
// 3. Calculate and display real metrics
// 4. Update charts with live data
```

### **Priority 3: Data Collection**
```javascript
// Modify quiz.js to POST quiz attempts
// Modify lesson.js to POST video completion
// Track time spent on each course
```

---

## 10. SAMPLE TEST CREDENTIALS

From `backend/seed.js`:
```
Email: student@acadify.dev
Password: password123
Role: student

Email: teacher@acadify.dev
Password: password123
Role: teacher

Email: admin@acadify.dev
Password: password123
Role: admin
```

---

## CONCLUSION

The Acadify project has a **solid architectural foundation** for analytics with:
- ✅ Role-based authentication system
- ✅ Normalized database schema for analytics data
- ✅ Basic API endpoints for reading analytics
- ✅ Frontend page for displaying analytics

However, it needs:
- ❌ API endpoints for submitting analytics data
- ❌ Integration between frontend and backend APIs
- ❌ Real data instead of hardcoded values
- ❌ Complete data collection mechanisms

The system is ready for **Phase 2: Backend API Implementation** to enable full analytics functionality.
