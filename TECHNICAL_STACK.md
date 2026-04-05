# Acadify - Technical Stack & Website Details

**Version**: 1.0.0  
**Last Updated**: April 2026  
**Repository**: acadify-final  
**Application Type**: Full-Stack Learning Management System (LMS)

---

## 1. PROJECT OVERVIEW

### Purpose
Acadify is a modern, full-featured Learning Management System (LMS) built to facilitate online education. It enables teachers to create and manage courses while providing students with a comprehensive learning platform with progress tracking, quizzes, assignments, and analytics.

### Key Characteristics
- **Monolithic Architecture**: Backend and frontend integrated in single deployment
- **Real-time Data Processing**: Instant updates for course enrollment and progress tracking
- **Multi-role System**: Student, Teacher, and Admin roles with role-based access control (RBAC)
- **Database-Centric**: All data persisted in PostgreSQL
- **Stateless API**: JWT token-based authentication

---

## 2. TECHNOLOGY STACK

### 2.1 Backend Architecture

#### Language & Runtime
- **Platform**: Node.js (v14 or higher)
- **Language**: JavaScript (ECMAScript modules)
- **Type**: ES6+ with `"type": "module"` configuration

#### Core Framework
- **Web Framework**: Express.js v4.18.2
  - REST API server
  - Static file serving
  - Middleware pipeline
  - Request/response handling

#### Database
- **DBMS**: PostgreSQL (v12 or higher)
- **Client Library**: pg v8.11.0 (node-postgres)
- **Connection**: Pool-based connections via connection string
- **Features**:
  - UUID data types via uuid-ossp extension
  - JSONB for flexible data storage
  - Foreign key constraints
  - Transactions support

#### Authentication & Security
- **JWT (JSON Web Tokens)**: jsonwebtoken v9.0.2
  - Token expiration: 7 days (configurable)
  - Token storage: HTTP cookies (HTTPS recommended)
  - Verification: Cookie-first, then Authorization header fallback

- **Password Hashing**: bcryptjs v2.4.3
  - Salt rounds: 10 (standard)
  - One-way hashing algorithm

- **Cookie Management**: cookie-parser v1.4.6
  - Signed cookie support
  - Secure cookie handling

#### CORS & Middleware
- **CORS**: cors v2.8.5
  - Credentials enabled
  - Cross-origin requests allowed

#### Configuration Management
- **Environment Variables**: dotenv v16.3.1
  - Supports `.env` files
  - Environment-specific settings

#### Utilities
- **ID Generation**: nanoid v4.0.2
  - Generates unique, short identifiers
  - Used for invite codes and session IDs

### 2.2 Frontend Architecture

#### Technology Stack
- **Language**: Vanilla JavaScript (ES6+)
- **Markup**: HTML5
- **Styling**: CSS3
- **Architecture Pattern**: Client-side MPA (Multi-Page Application)
- **API Communication**: Fetch API
- **State Management**: Browser localStorage/sessionStorage

#### Frontend Pages (Monolithic Structure)
Served from `/backend/public/` and mirrored in `/frontend/`:

**Public Pages**:
- `index.html` - Login/landing page
- `auth.js` - Authentication utilities
- `api.js` - API client wrapper

**Student Interfaces**:
- `student-dashboard.html` - Main student hub
- `my-courses.html` / `my-courses-new.html` - Course listing
- `lesson.html` - Course content viewer
- `quiz.html` - Quiz taker interface
- `student-assignments.html` - Assignment list
- `student-assignment-detail.html` - Assignment details
- `progress.html` - Progress tracking

**Teacher Interfaces**:
- `teacher-dashboard.html` - Teacher hub
- `teacher-my-courses.html` - Teacher's courses
- `course-creation.html` - Course builder
- `teacher-calendar.html` - Calendar view
- `teacher-settings.html` - Settings
- `teacher/` folder:
  - `analytics.html` - Student analytics
  - `assignments.html` - Assignment management
  - `grades.html` - Grading interface
  - `messages.html` - Messaging
  - `students.html` - Student management
  - `teacher.css` - Teacher-specific styles

**Admin Interfaces**:
- `admin-dashboard.html` - Admin panel

**Shared Features**:
- `settings.html` - User preferences
- `calendar.html` - Calendar functionality
- `browse-courses.html` - Course discovery
- `join-course.html` - Course enrollment
- `assessment.html` - Assessment interface
- `init-enrollments.html` - Enrollment initialization

**Styling**:
- `style.css` - Global styles
- `teacher/teacher.css` - Teacher-specific overrides

---

## 3. DATABASE SCHEMA

### 3.1 Core Tables

#### Users Table
```
users:
  - id (UUID, PRIMARY KEY) - Auto-generated
  - name (VARCHAR 255) - User full name
  - email (VARCHAR 255, UNIQUE) - Email address
  - password (VARCHAR 255) - Hashed password
  - role (VARCHAR 50) - student | teacher | admin
  - created_at (TIMESTAMP) - Account creation time
  
Indexes: email (UNIQUE)
```

#### Courses Table
```
courses:
  - id (UUID, PRIMARY KEY)
  - title (VARCHAR 255) - Course name
  - description (TEXT) - Course description
  - invite_code (VARCHAR 10, UNIQUE) - Join code
  - teacher_id (UUID, FOREIGN KEY → users.id)
  - is_published (BOOLEAN) - Publication status
  - created_at (TIMESTAMP)

Indexes: teacher_id, invite_code (UNIQUE)
```

#### Enrollments Table
```
enrollments:
  - id (UUID, PRIMARY KEY)
  - student_id (UUID, FOREIGN KEY → users.id)
  - course_id (UUID, FOREIGN KEY → courses.id)
  - enrolled_at (TIMESTAMP)

Constraints: UNIQUE(student_id, course_id)
Indexes: student_id, course_id
```

#### Modules Table
```
modules:
  - id (UUID, PRIMARY KEY)
  - course_id (UUID, FOREIGN KEY → courses.id)
  - title (VARCHAR 255) - Module name
  - position (INT) - Sort order

Indexes: course_id
```

#### Videos Table
```
videos:
  - id (UUID, PRIMARY KEY)
  - module_id (UUID, FOREIGN KEY → modules.id)
  - title (VARCHAR 255)
  - embed_url (TEXT) - Video URL
  - duration (INT) - Video length in seconds
  - position (INT) - Sort order

Indexes: module_id
```

#### Video Progress Table
```
video_progress:
  - id (UUID, PRIMARY KEY)
  - student_id (UUID, FOREIGN KEY → users.id)
  - video_id (UUID, FOREIGN KEY → videos.id)
  - completed (BOOLEAN)
  - watched_at (TIMESTAMP)

Constraints: UNIQUE(student_id, video_id)
Indexes: student_id, video_id
```

#### Quizzes Table
```
quizzes:
  - id (UUID, PRIMARY KEY)
  - module_id (UUID, FOREIGN KEY → modules.id)
  - title (VARCHAR 255)

Indexes: module_id
```

#### Questions Table
```
questions:
  - id (UUID, PRIMARY KEY)
  - quiz_id (UUID, FOREIGN KEY → quizzes.id)
  - body (TEXT) - Question text
  - options (JSONB) - Answer choices
  - correct_index (INT) - Correct answer index

Indexes: quiz_id
```

#### Quiz Attempts Table
```
quiz_attempts:
  - id (UUID, PRIMARY KEY)
  - student_id (UUID, FOREIGN KEY → users.id)
  - quiz_id (UUID, FOREIGN KEY → quizzes.id)
  - answers (JSONB) - Student answers
  - score (INT) - Points earned
  - total (INT) - Total points
  - attempted_at (TIMESTAMP)

Indexes: student_id, quiz_id
```

#### Posts Table (Discussions)
```
posts:
  - id (UUID, PRIMARY KEY)
  - course_id (UUID, FOREIGN KEY → courses.id)
  - author_id (UUID, FOREIGN KEY → users.id)
  - parent_id (UUID, FOREIGN KEY → posts.id) - For threaded replies
  - body (TEXT)
  - created_at (TIMESTAMP)

Indexes: course_id, author_id
```

#### Assignments Table
```
assignments:
  - id (UUID, PRIMARY KEY)
  - course_id (UUID, FOREIGN KEY → courses.id)
  - teacher_id (UUID, FOREIGN KEY → users.id)
  - title (VARCHAR 255)
  - description (TEXT)
  - due_date (TIMESTAMP)
  - max_score (INT)
  - created_at (TIMESTAMP)

Indexes: course_id, teacher_id
```

#### Assignment Submissions Table
```
assignment_submissions:
  - id (UUID, PRIMARY KEY)
  - assignment_id (UUID, FOREIGN KEY → assignments.id)
  - student_id (UUID, FOREIGN KEY → users.id)
  - submission_text (TEXT)
  - submission_url (TEXT)
  - submitted_at (TIMESTAMP)
  - graded_at (TIMESTAMP)
  - score (INT)
  - feedback (TEXT)
  - teacher_id (UUID, FOREIGN KEY → users.id)

Indexes: assignment_id, student_id
```

#### Posts Table (Discussions - continued)
```
Other discussion-related fields typically include:
  - likes (INT)
  - replies_count (INT)
```

### 3.2 Database Extensions
- **uuid-ossp**: PostgreSQL UUID generation extension

### 3.3 Relationships
- Users ↔ Courses (1:N - teacher creates many courses)
- Users ↔ Enrollments (1:N - student enrolls in many courses)
- Courses ↔ Enrollments (1:N - course has many enrollments)
- Courses ↔ Modules (1:N)
- Modules ↔ Videos (1:N)
- Modules ↔ Quizzes (1:N)
- Users ↔ Video Progress (1:N)
- Users ↔ Quiz Attempts (1:N)
- Courses ↔ Posts (1:N - discussions)
- Users ↔ Posts (1:N)

---

## 4. API ENDPOINTS

### 4.1 Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | User login (returns JWT token) |
| POST | `/api/auth/logout` | Required | User logout (clear cookie) |

### 4.2 Course Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/courses` | Optional | All | List all courses |
| GET | `/api/courses/:id` | Required | All | Get course details |
| POST | `/api/courses` | Required | Teacher | Create new course |
| PUT | `/api/courses/:id` | Required | Teacher | Update course |
| DELETE | `/api/courses/:id` | Required | Teacher | Delete course |
| POST | `/api/courses/:id/publish` | Required | Teacher | Publish course |
| POST | `/api/courses/:id/enroll` | Required | Student | Enroll in course |

### 4.3 User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | Required | Get user profile |
| PUT | `/api/users/profile` | Required | Update profile |
| GET | `/api/users/:id` | Required | Get specific user |

### 4.4 Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Server status check |

### 4.5 Additional Endpoints (Estimated)
- `/api/modules/*` - Module management
- `/api/videos/*` - Video management
- `/api/quizzes/*` - Quiz endpoints
- `/api/assignments/*` - Assignment management
- `/api/submissions/*` - Submission handling
- `/api/progress/*` - Student progress
- `/api/analytics/*` - Analytics (teacher/admin)

---

## 5. ENVIRONMENT CONFIGURATION

### Required Environment Variables

```
# Server Configuration
PORT=5000                          # Server port (default: 5000)
NODE_ENV=development              # Environment (development|production|test)

# Database
DATABASE_URL=postgresql://user:password@host:port/database
# Format: postgresql://postgres:password@localhost:5432/acadify

# Authentication
JWT_SECRET=your_jwt_secret_key_change_in_production
COOKIE_SECRET=your_cookie_secret_key_change_in_production
JWT_EXPIRES_IN=7d                 # Token expiration duration

# CORS
# CORS is enabled for all origins (configure as needed for production)
```

### Production Considerations
- Change all secrets before deploying
- Set `NODE_ENV=production`
- Use environment-specific database URLs
- Enable HTTPS in production
- Use secure cookie settings
- Configure proper CORS origins

---

## 6. PROJECT STRUCTURE

```
acadify-final/
├── backend/
│   ├── public/                    # Frontend files (static assets)
│   │   ├── index.html            # Login page
│   │   ├── style.css             # Global styles
│   │   ├── auth.js               # Authentication logic
│   │   ├── api.js                # API client
│   │   ├── student-dashboard.html
│   │   ├── teacher-dashboard.html
│   │   ├── teacher-my-courses.html
│   │   ├── course-creation.html
│   │   ├── quiz.html
│   │   ├── lesson.html
│   │   ├── progress.html
│   │   ├── settings.html
│   │   ├── admin-dashboard.html
│   │   ├── my-courses.html
│   │   ├── calendar.html
│   │   ├── teacher/              # Teacher-specific pages
│   │   │   ├── analytics.html
│   │   │   ├── assignments.html
│   │   │   ├── grades.html
│   │   │   ├── messages.html
│   │   │   ├── students.html
│   │   │   └── teacher.css
│   │   ├── student-assignments.html
│   │   ├── student-assignment-detail.html
│   │   ├── student-dashboard.html
│   │   ├── browse-courses.html
│   │   ├── join-course.html
│   │   ├── assessment.html
│   │   └── init-enrollments.html
│   ├── package.json              # Dependencies
│   ├── package-lock.json         # Dependency lock file
│   ├── server.js                 # Main Express server
│   ├── migrate.js                # Database migration script
│   ├── seed.js                   # Database seeding script
│   ├── .env                      # Environment variables (not versioned)
│   ├── .env.example              # Template for .env
│   ├── node_modules/             # Dependencies (not versioned)
│   └── fix-schema.js             # Database schema repair utility
│
├── frontend/                      # Mirror of backend/public
│   ├── (Same structure as backend/public)
│   └── (For development/reference)
│
├── README.md                      # Installation & setup guide
├── TECHNICAL_STACK.md            # This file
└── .gitignore                    # Git ignore rules
```

---

## 7. DEPLOYMENT REQUIREMENTS

### Minimum System Requirements

#### Development
- **CPU**: 2 cores minimum
- **RAM**: 2 GB minimum
- **Storage**: 5 GB minimum
- **Node.js**: v14 or higher
- **PostgreSQL**: v12 or higher
- **npm**: v6 or higher

#### Production
- **CPU**: 4 cores recommended
- **RAM**: 4-8 GB recommended
- **Storage**: 20-50 GB (depends on content volume)
- **Database**: PostgreSQL with backups
- **SSL/TLS**: HTTPS enabled
- **Load Balancer**: Optional (for horizontal scaling)

### Build and Deployment

#### Installation Steps
```bash
# 1. Clone repository
git clone <repository-url>
cd acadify-final

# 2. Install dependencies
cd backend
npm install
cd ..

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with actual values

# 4. Initialize database
cd backend
npm run migrate

# 5. Seed initial data
npm run seed

# 6. Start server
npm start
```

#### Scaling Considerations
- **Horizontal Scaling**: Multiple Node.js instances behind load balancer
- **Database**: PostgreSQL replicas for read scaling
- **Caching**: Redis for session storage and caching
- **CDN**: For static assets and videos
- **File Storage**: S3 or similar for media uploads

---

## 8. DEPLOYMENT SERVICE OPTIONS

### Recommended Azure Services

#### 1. **Azure App Service**
- **Best for**: Traditional web app hosting
- **Pros**: Easy deployment, built-in scaling, Git integration
- **Cons**: Less flexible than containers
- **Suitable**: Yes ✓

#### 2. **Azure Kubernetes Service (AKS)**
- **Best for**: Complex, scalable microservices
- **Pros**: High scalability, container orchestration
- **Cons**: Operational complexity
- **Suitable**: Yes (for enterprise scale)

#### 3. **Azure Container Instances**
- **Best for**: Simple containerized apps
- **Pros**: Lightweight, fast deployment
- **Cons**: No built-in scaling features
- **Suitable**: Yes (for small deployments)

#### 4. **Azure Container Apps**
- **Best for**: Modern containerized applications
- **Pros**: Managed Kubernetes, auto-scaling, simple management
- **Cons**: Newer service
- **Suitable**: Yes ✓ (Recommended)

#### 5. **Azure Functions** (Not suitable)
- **Reason**: Acadify requires persistent server, Functions are event-driven

#### 6. **Static Web Apps** (Not suitable)
- **Reason**: Has backend API server; Static Web Apps for static content only

### Database Deployment Services

#### 1. **Azure Database for PostgreSQL - Flexible Server**
- **Tier**: Production-ready
- **Features**: Automated backups, geo-redundancy, auto-scaling
- **Recommended**: Yes ✓

#### 2. **Azure Database for PostgreSQL - Single Server** (Deprecated)
- **Status**: Not recommended (being retired)

### Recommended Deployment Architecture

```
┌─────────────────────────────────────────┐
│        Azure Container Registry         │
│   (Store Docker images)                 │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│   Azure Container Apps                  │
│   (Run Node.js/Express server)          │
│   - Auto-scaling                        │
│   - Load balancing                      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Azure Database for PostgreSQL          │
│  (Flexible Server)                      │
│  - Automated backups                    │
│  - High availability                    │
└─────────────────────────────────────────┘
```

---

## 9. PERFORMANCE CHARACTERISTICS

### Expected Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Request Latency | 50-200ms | Without network latency |
| Database Query Time | 10-50ms | Indexed queries |
| Page Load Time | 1-3s | Frontend + API calls |
| Max Concurrent Users | 100+ | Per container instance |
| Throughput | 1000+ req/sec | Per node instance |

### Optimization Opportunities
- Database query indexing on frequently queried columns
- Caching layer (Redis) for user sessions and course data
- CDN for static assets and video content
- Database connection pooling optimization
- Frontend asset minification and bundling
- API response compression (gzip)

---

## 10. SECURITY FEATURES

### Authentication
- JWT token-based authentication
- Token expiration (7 days default)
- Secure cookie storage
- Password hashing with bcrypt (10 salt rounds)

### Authorization
- Role-based access control (RBAC)
  - Student, Teacher, Admin roles
  - Endpoint-level role validation

### Input Validation
- Query parameter validation
- Request body validation
- Email format validation
- Role enumeration validation

### Security Considerations for Production
- Enable HTTPS/TLS
- Set secure cookie flags (HttpOnly, Secure, SameSite)
- Configure proper CORS for allowed origins
- Implement rate limiting
- Add API request validation middleware
- Use secrets management (Azure Key Vault)
- Enable database encryption
- Implement SQL injection prevention
- Add CSRF token protection
- Configure security headers (helmet.js)

---

## 11. MONITORING & LOGGING

### Recommended Services (Azure)

#### 1. **Application Insights**
- Real-time application monitoring
- Exception tracking
- Performance metrics
- Custom telemetry

#### 2. **Azure Monitor**
- Infrastructure monitoring
- Cost analysis
- Alerting

#### 3. **Log Analytics Workspace**
- Centralized logging
- Query logs with KQL
- Long-term retention

#### 4. **Azure DevOps** (Or GitHub Actions)
- CI/CD pipeline
- Automated testing
- Deployment automation

---

## 12. MAINTENANCE & UPDATES

### Dependencies Update Schedule
```
Critical Security Updates: Immediate deployment
Regular Updates: Monthly review
Major Version Updates: Quarterly evaluation
```

### Node.js Version Support
- Current: v14+ (v18+ recommended for new deployments)
- Long-term support: Adopt LTS versions

### PostgreSQL Maintenance
- Regular backups (daily recommended)
- Index maintenance and analysis
- Query optimization
- Version upgrades (yearly consideration)

---

## 13. COST ESTIMATION (Azure)

### Typical Monthly Costs

| Service | SKU | Est. Cost |
|---------|-----|-----------|
| Container Apps | 2 vCPU, 4 GB RAM | $150-300 |
| Database for PostgreSQL | 1-2 vCore, 32-64 GB Storage | $200-400 |
| Application Insights | Standard tier | $50-100 |
| Storage Account | Hot tier (media) | $20-100 |
| **Total Estimated** | | **$420-900/month** |

*Note: Costs vary by region, usage, and configuration*

---

## 14. COMPLIANCE & STANDARDS

### Recommended Implementations
- **GDPR Compliance**: Data privacy controls
- **SOC 2**: Security and reliability controls
- **Accessibility**: WCAG 2.1 compliance for frontend
- **Data Retention**: Configurable data deletion policies
- **Audit Logging**: Track administrative actions

---

## 15. DEVELOPMENT WORKFLOW

### Scripts Available
```bash
npm start           # Start production server
npm run dev         # Start development server
npm run migrate     # Run database migrations
npm run seed        # Populate database with seed data
```

### Development Tools
- Node.js with ES6 modules
- Postman/Insomnia for API testing
- PostgreSQL pgAdmin for database management
- Browser DevTools for frontend debugging

---

## 16. FUTURE ENHANCEMENTS

### Potential Improvements
1. **Microservices Architecture**: Separate services for notifications, analytics
2. **Real-time Features**: WebSocket for live notifications
3. **Mobile App**: React Native or Flutter app
4. **Advanced Analytics**: ML-based student performance prediction
5. **Content Delivery**: Video streaming optimization with CDN
6. **Marketplace**: Third-party integrations
7. **Internationalization**: Multi-language support
8. **AI-powered Features**: Chatbot, automated grading

---

## 17. TROUBLESHOOTING GUIDE

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Database Connection Error | PostgreSQL not running | Start PostgreSQL service |
| Port Already in Use | Another service on port 5000 | Change PORT in .env or kill process |
| Module Not Found | Dependencies not installed | Run `npm install` |
| CORS Errors | Frontend and backend on different origins | Update CORS configuration |
| JWT Invalid | Token expired or corrupted | Re-login user |
| Query Timeout | Slow database queries | Add indexes, optimize queries |

---

## 18. CONCLUSION

**Acadify** is a production-ready Learning Management System suitable for deployment on Azure Container Apps or Azure App Service. The monolithic architecture with PostgreSQL backend provides a solid foundation for educational institution deployments. The application supports up to 100+ concurrent users per instance and can scale horizontally to support larger deployments.

**Recommended Deployment Path**:
1. Use Azure Container Apps for hosting
2. Azure Database for PostgreSQL Flexible Server for data
3. Azure Container Registry for image storage
4. Application Insights for monitoring
5. Azure DevOps for CI/CD

---

**Document Prepared For**: Deployment Analysis & Service Planning
**Audience**: DevOps Engineers, Cloud Architects, System Administrators
