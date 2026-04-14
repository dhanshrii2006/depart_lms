import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.js';
import coursesRoutes from './src/routes/courses.js';
import assignmentsRoutes from './src/routes/assignments.js';
import announcementsRoutes from './src/routes/announcements.js';
import materialsRoutes from './src/routes/materials.js';
import notificationsRoutes from './src/routes/notifications.js';
import adminRoutes from './src/routes/admin.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ status: 'ok' });
});

app.listen(5002, () => {
  console.log('Server running on port 5002 with all routes');
});
