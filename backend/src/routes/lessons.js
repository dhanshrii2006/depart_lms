import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import * as lessonsController from '../controllers/lessonsController.js';

const router = Router();

const attachVideoSchema = z
  .object({
    original_url: z.string().url().optional(),
    originalUrl: z.string().url().optional(),
    title: z.string().optional().default(''),
    duration: z.string().optional().default(''),
  })
  .refine((d) => d.original_url || d.originalUrl, {
    message: 'original_url is required',
    path: ['original_url'],
  });

router.post(
  '/:lessonId/videos',
  authenticateToken,
  requireRole('teacher'),
  validate(attachVideoSchema),
  lessonsController.attachVideo
);

export default router;
