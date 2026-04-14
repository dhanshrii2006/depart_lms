# Acadify Quick Start Guide

## Prerequisites
- Node.js >= 16.x
- PostgreSQL >= 12
- npm or yarn

## 5-Minute Setup

### 1️⃣ Automatic Setup (Recommended)

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

This will automatically:
- Check dependencies
- Create PostgreSQL database
- Install backend & frontend dependencies
- Run database migrations
- Seed sample data

### 2️⃣ Manual Setup (Alternative)

#### Backend
```bash
cd backend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Create database
createdb acadify

# Run migrations
npm run migrate

# Seed with sample data
npm run seed

# Start server
npm run dev
```
Backend runs on `http://localhost:5001`

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend runs on `http://localhost:5173`

## Login Credentials

After seeding, use these accounts:

### Admin Dashboard
- **Email**: `admin@acadify.com`
- **Password**: `admin123`
- **URL**: `http://localhost:5173/admin/login`

### Teacher Dashboard
- **Email**: `teacher1@acadify.com`
- **Password**: `teacher123`
- **URL**: `http://localhost:5173/teacher/login`

### Student Dashboard
- **Email**: `student1@acadify.com`
- **Roll Number**: `2023001`
- **Password**: `student123`
- **URL**: `http://localhost:5173/student/login`

## Key Features to Try

### For Students
1. Go to Dashboard → Join a class with invite code
   - Use any code from the invite codes table (generated during seeding)
2. View course announcements and materials
3. Submit assignments
4. Check grades on submitted assignments

### For Teachers
1. Create a new class
2. View invite code to share with students
3. Post announcements to the class
4. Create assignments with due dates
5. Grade student submissions

### For Admins
1. View system statistics
2. Manage users (ban/delete)
3. Upload roll numbers for student registration

## Project Structure

```
Acadify/
├── backend/           # Express server + PostgreSQL
├── frontend/          # React + Vite app
├── README.md         # Full documentation
├── setup.sh          # Automated setup script
└── QUICK_START.md    # This file
```

## Troubleshooting

### Cannot connect to database
```bash
# Check PostgreSQL is running
psql -U postgres

# Create database manually
createdb acadify

# Update DATABASE_URL in backend/.env
```

### npm install fails
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### Port already in use
- Backend (5001): Change PORT in `.env`
- Frontend (5173): Vite will use next available port automatically

### Migration fails
```bash
# Drop and recreate database
dropdb acadify
createdb acadify
npm run migrate
npm run seed
```

## Development Commands

### Backend
```bash
npm run dev      # Start dev server with auto-reload
npm run start    # Start production server
npm run migrate  # Run database migrations
npm run seed     # Seed sample data
```

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Next Steps

- Read [README.md](./README.md) for comprehensive documentation
- Explore the [backend API](backend/README.md) routes
- Customize colors in [tailwind.config.js](frontend/tailwind.config.js)
- Add more features to the seeded data
- Deploy to production (see README.md for guidelines)

## Need Help?

Check the full [README.md](./README.md) for:
- Detailed API documentation
- Architecture explanation
- Technologies used
- Database schema
- Production deployment
- Future enhancements

Happy coding! 🎓
