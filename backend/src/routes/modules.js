import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import * as modulesController from '../controllers/modulesController.js';

const router = Router();

const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  orderIndex: z.coerce.number().int().min(0).optional().default(0),
});

router.post(
  '/:moduleId/lessons',
  authenticateToken,
  requireRole('teacher'),
  validate(createLessonSchema),
  modulesController.createLesson
);

export default router;
