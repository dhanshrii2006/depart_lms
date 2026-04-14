import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, authenticateTokenOptional, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import * as authController from '../controllers/authController.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  rollNumber: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().optional().default(''),
  avatarUrl: z.string().optional().default('')
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateTokenOptional, authController.me);
router.put('/profile', authenticateToken, validate(profileSchema), authController.updateProfile);

export default router;
