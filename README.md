# Acadify - Learning Management System (LMS)

A modern, full-featured Learning Management System built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

- **Student Dashboard** - View courses, track progress, and access lessons
- **Teacher Dashboard** - Create courses, manage students, grade assignments
- **Course Management** - Create, edit, and publish courses with lessons
- **Quiz System** - Create and administer quizzes with automatic grading
- **Progress Tracking** - Monitor student progress and performance
- **Analytics** - View detailed analytics and reports
- **User Authentication** - Secure login with JWT tokens
- **Role-Based Access Control** - Different interfaces for students, teachers, and admins

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd acadify-final
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

## Setup

### 1. Set Up PostgreSQL Database

1. Start PostgreSQL service on your system
2. Create a new database:
   ```sql
   CREATE DATABASE acadify;
   ```

### 2. Configure Environment Variables

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create a `.env` file (copy from `.env.example` if provided):
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your database credentials:
   ```
   PORT=5000
   DATABASE_URL=postgresql://postgres:password@localhost:5432/acadify
   JWT_SECRET=your_secret_key_here
   COOKIE_SECRET=your_cookie_secret_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

   **Important:** Replace `password` with your PostgreSQL password, and update the JWT and COOKIE secrets for production.

### 3. Initialize Database

Run the migration and seed scripts:

```bash
npm run migrate
npm run seed
```

These commands will:
- Create all necessary database tables
- Populate the database with initial data

## Running the Project

### Start the Backend Server

From the `backend` folder:

```bash
npm start
```

The server will start on **http://localhost:5000**

You should see:
```
✅ Acadify server running on http://localhost:5000
✅ Database connected successfully
📡 API Health: http://localhost:5000/api/health
```

### Access the Application

Open your browser and navigate to:
- **http://localhost:5000** - Main application

## Default Test Credentials

The seed script creates default accounts. Check the seed data or contact your administrator for login credentials.

## Project Structure

```
acadify-final/
├── backend/
│   ├── public/
│   │   ├── style.css              # Global styles
│   │   ├── auth.js                # Authentication logic
│   │   ├── api.js                 # API client
│   │   ├── index.html             # Login page
│   │   ├── student-dashboard.html
│   │   ├── teacher-dashboard.html
│   │   ├── admin-dashboard.html
│   │   ├── my-courses.html
│   │   ├── lesson.html
│   │   ├── quiz.html
│   │   ├── progress.html
│   │   ├── settings.html
│   │   └── teacher/               # Teacher-specific pages
│   │       ├── analytics.html
│   │       ├── assignments.html
│   │       ├── grades.html
│   │       ├── messages.html
│   │       └── students.html
│   ├── migrate.js                 # Database migration script
│   ├── seed.js                    # Database seed script
│   ├── server.js                  # Main server file
│   ├── package.json
│   ├── .env                       # Environment variables (not in git)
│   └── node_modules/              # Dependencies (not in git)
└── frontend/                      # Mirror of backend/public files
```

## Available npm Scripts

From the `backend` folder:

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start the development server |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Populate database with seed data |

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create new course (teacher only)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

*For a complete API documentation, see the server.js file*

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Verify credentials in `.env` file
- Check that the `acadify` database exists

### Port Already in Use
- Change the `PORT` in `.env` file to an available port
- Or kill the process using port 5000

### Dependencies Installation Error
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## Development Notes

- The frontend is served as static files from the backend server
- Authentication uses JWT tokens stored in cookies
- Database schema is managed through migration scripts
- All API endpoints require proper authentication

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please check the project documentation or contact the development team.

---

**Happy Learning with Acadify! 📚**
