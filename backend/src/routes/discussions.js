import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as discussionsController from '../controllers/discussionsController.js';

const router = Router();

// Public endpoints
router.get('/', discussionsController.getAllDiscussions);
router.get('/:id', discussionsController.getDiscussionById);

// Protected endpoints
router.post('/', authenticateToken, discussionsController.createDiscussion);
router.post('/:id/replies', authenticateToken, discussionsController.createReply);
router.delete('/:id', authenticateToken, discussionsController.deleteDiscussion);

export default router;
