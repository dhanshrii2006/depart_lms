import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import * as announcementsController from '../controllers/announcementsController.js';

const router = Router();

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required')
});

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty')
});

// Create announcement (teacher only)
router.post('/:courseId/announcements', authenticateToken, requireRole('teacher'), validate(announcementSchema), announcementsController.createAnnouncement);

// Get announcements for course
router.get('/:courseId/announcements', authenticateToken, announcementsController.getAnnouncements);

// Update announcement (teacher only)
router.put('/:announcementId', authenticateToken, requireRole('teacher'), validate(announcementSchema), announcementsController.updateAnnouncement);

// Delete announcement (teacher only)
router.delete('/:announcementId', authenticateToken, requireRole('teacher'), announcementsController.deleteAnnouncement);

// Add comment
router.post('/:announcementId/comments', authenticateToken, validate(commentSchema), announcementsController.addComment);

// Get comments for announcement
router.get('/:announcementId/comments', authenticateToken, announcementsController.getComments);

// Delete comment
router.delete('/comment/:commentId', authenticateToken, announcementsController.deleteComment);

export default router;
