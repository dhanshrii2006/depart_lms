# Acadify - Learning Management System

A modern, polished full-stack Learning Management System built with React + Vite (frontend), Node.js + Express (backend), and PostgreSQL (database). Inspired by Google Classroom with enhanced features and a professional UI.

## Features

### 🎓 User Roles
- **Admin**: System management, user management, roll number management
- **Teacher**: Create and manage classes, post announcements, create assignments, grade submissions
- **Student**: Join classes, view announcements, submit assignments, track grades

### 📚 Core Features
- **Course Management**: Create, join, and manage courses with invite codes
- **Announcements**: Post announcements, comment, engage with the class
- **Assignments**: Create assignments, upload files, view submissions, grade student work
- **Materials**: Share course materials, links, and resources
- **Notifications**: Real-time notifications for new announcements, assignments, and grades
- **User Profiles**: Customize profile information
- **Role-Based Access Control**: Different dashboards and features for each role

### 🎨 Design
- Clean, professional UI inspired by Google Classroom
- Responsive design (mobile + desktop)
- Color-coded courses with customizable cover colors
- Smooth transitions and animations
- Toast notifications for all actions
- Loading skeletons and states

## Project Structure

```
Acadify/
├── backend/                    # Node.js + Express server
│   ├── src/
│   │   ├── server.js          # Main application entry
│   │   ├── routes/            # API route definitions
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Custom middleware
│   │   ├── db/                # Database setup, migrations, seeding
│   │   └── utils/             # Helper utilities
│   ├── uploads/               # File storage
│   ├── package.json
│   └── .env.example
│
└── frontend/                   # React + Vite SPA
    ├── src/
    │   ├── App.jsx            # Main app component with routing
    │   ├── main.jsx           # Entry point
    │   ├── index.css          # Global styles
    │   ├── api/               # Axios instance and API calls
    │   ├── components/        # Reusable UI components
    │   ├── hooks/             # Custom React Query hooks
    │   ├── pages/             # Page components
    │   │   ├── Admin/
    │   │   ├── Teacher/
    │   │   ├── Student/
    │   │   └── Auth/
    │   ├── store/             # Zustand store (auth, notifications)
    │   └── router/            # Routes and protected route component
    ├── public/                # Static assets
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with raw node-postgres
- **Authentication**: JWT with httpOnly cookies
- **File Uploads**: Multer
- **Validation**: Zod
- **Security**: bcryptjs for password hashing

### Frontend
- **Library**: React 18
- **Build Tool**: Vite
- **CSS**: Tailwind CSS
- **State Management**: Zustand (auth), React Query (server state)
- **Form Management**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Notifications**: Sonner

## Prerequisites

- Node.js >= 16.x
- npm or yarn
- PostgreSQL >= 12

## Getting Started

### 1. Database Setup

First, create a PostgreSQL database:

```bash
createdb acadify
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Run migrations
npm run migrate

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

The server will run on `http://localhost:5001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/acadify
JWT_SECRET=your_jwt_secret_key_change_in_production
PORT=5001
NODE_ENV=development
MAX_FILE_SIZE=10485760
```

## Default Credentials

After seeding:

### Admin
- Email: `admin@acadify.com`
- Password: `admin123`

### Teachers
- Email: `teacher1@acadify.com` to `teacher3@acadify.com`
- Password: `teacher123`

### Students
- Email: `student1@acadify.com` to `student10@acadify.com`
- Password: `student123`
- Roll Numbers: `2023001` to `2023010`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Courses
- `GET /api/courses` - List user's courses
- `POST /api/courses` - Create course (teacher)
- `GET /api/courses/:courseId` - Get course details
- `POST /api/courses/enroll/code` - Enroll by code

### Assignments
- `GET /api/assignments/:courseId/assignments` - List assignments
- `POST /api/assignments/:courseId/assignments` - Create assignment (teacher)
- `POST /api/assignments/:assignmentId/submit` - Submit assignment
- `PUT /api/assignments/:submissionId/grade` - Grade submission (teacher)

### Announcements
- `GET /api/announcements/:courseId/announcements` - List announcements
- `POST /api/announcements/:courseId/announcements` - Post announcement (teacher)
- `POST /api/announcements/:announcementId/comments` - Comment on announcement

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:notificationId/read` - Mark notification as read

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List users
- `POST /api/admin/teachers` - Create teacher
- `PUT /api/admin/users/:userId/ban` - Ban/unban user

## File Upload

Files are uploaded to the `backend/uploads` folder and served as static files through `/uploads` route. Maximum file size is 10MB by default (configurable via `MAX_FILE_SIZE`).

## Authentication

The application uses JWT tokens stored in httpOnly cookies for secure authentication. Cookies are automatically sent with credentials on all API requests.

## Database Schema

Key tables:
- `users` - User accounts with roles
- `courses` - Course/class information
- `enrollments` - Student enrollments in courses
- `assignments` - Course assignments
- `submissions` - Student submissions and grades
- `announcements` - Course announcements
- `comments` - Comments on announcements
- `materials` - Course materials and resources
- `notifications` - User notifications

See `backend/src/db/migrate.js` for complete schema.

## Building for Production

### Backend
```bash
cd backend
npm install
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm run preview
```

## Contributing

This is a learning project. Feel free to extend and customize it!

## License

MIT

## Next Steps

To extend the application:

1. **Complete Course Detail Pages**: Add full Stream, Classwork, People, and Grades tabs
2. **Quiz System**: Complete quiz creation and attempt functionality
3. **Calendar View**: Add calendar view of assignments and grades
4. **Email Notifications**: Integrate email notifications for important events
5. **File Compression**: Add file compression for large uploads
6. **Real-time Updates**: Add WebSocket support for real-time notifications
7. **Analytics**: Add analytics dashboards for teachers
8. **Bulk Operations**: Support bulk student enrollment
9. **API Documentation**: Generate OpenAPI/Swagger docs
10. **Test Suite**: Add unit and integration tests
