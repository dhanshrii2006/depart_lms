import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upload } from '../middleware/upload.js';
import * as materialsController from '../controllers/materialsController.js';

const router = Router();

const materialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  linkUrl: z.string().optional()
});

// Create material (teacher only)
router.post('/:courseId/materials', authenticateToken, requireRole('teacher'), upload.single('file'), validate(materialSchema), materialsController.createMaterial);

// Get materials for course
router.get('/:courseId/materials', authenticateToken, materialsController.getMaterials);

// Delete material (teacher only)
router.delete('/:materialId', authenticateToken, requireRole('teacher'), materialsController.deleteMaterial);

export default router;
