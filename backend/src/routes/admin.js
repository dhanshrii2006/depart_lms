import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

const createTeacherSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required')
});

// All admin routes require admin role
router.use(authenticateToken, requireRole('admin'));

// Get stats
router.get('/stats', adminController.getStats);

// Get all users
router.get('/users', adminController.getUsers);

// Ban/unban user
router.put('/users/:userId/ban', adminController.banUser);

// Delete user
router.delete('/users/:userId', adminController.deleteUser);

// Create teacher
router.post('/teachers', validate(createTeacherSchema), adminController.createTeacher);

// Upload roll numbers
router.post('/roll-numbers/upload', upload.single('file'), adminController.uploadRollNumbers);

// Get valid roll numbers
router.get('/roll-numbers', adminController.getValidRollNumbers);

export default router;
