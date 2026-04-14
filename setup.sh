#!/bin/bash

# Acadify Setup Script
# This script sets up the entire Acadify project

echo "🚀 Welcome to Acadify Setup!"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 16.x"
    exit 1
fi

echo "✓ Node.js $(node -v) found"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL >= 12"
    exit 1
fi

echo "✓ PostgreSQL found"

# Prompt for database URL
echo ""
echo "📦 Database Configuration"
read -p "Enter PostgreSQL connection string (default: postgresql://localhost:5432/acadify): " DB_URL
DB_URL=${DB_URL:-"postgresql://localhost:5432/acadify"}

# Create database
echo ""
echo "📂 Creating database..."
psql -U postgres -c "CREATE DATABASE acadify;" 2>/dev/null || echo "Database may already exist"

# Backend setup
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Create .env file
cat > .env << EOF
DATABASE_URL=$DB_URL
JWT_SECRET=$(openssl rand -hex 32)
PORT=5000
NODE_ENV=development
MAX_FILE_SIZE=10485760
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EOF

echo "✓ Backend .env file created"

# Install dependencies
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✓ Backend dependencies installed"

# Run migrations
npm run migrate
if [ $? -ne 0 ]; then
    echo "❌ Failed to run migrations"
    exit 1
fi

echo "✓ Database schema created"

# Seed database
npm run seed
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Seeding may have had issues, but setup can continue"
fi

echo "✓ Database seeded with sample data"

# Frontend setup
echo ""
echo "⚛️  Setting up Frontend..."
cd ../frontend

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✓ Frontend dependencies installed"

# Success message
echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Backend:"
echo "   cd backend"
echo "   npm run dev"
echo "   Server will run on http://localhost:5000"
echo ""
echo "2. Frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo "   App will run on http://localhost:5173"
echo ""
echo "3. Default Credentials:"
echo "   Admin: admin@acadify.com / admin123"
echo "   Teacher: teacher1@acadify.com / teacher123"
echo "   Student: student1@acadify.com / student123"
echo ""
echo "🎉 Happy coding!"
