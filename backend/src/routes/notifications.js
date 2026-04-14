import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as notificationsController from '../controllers/notificationsController.js';

const router = Router();

// Get notifications
router.get('/', authenticateToken, notificationsController.getNotifications);

// Get unread count
router.get('/unread-count', authenticateToken, notificationsController.getUnreadCount);

// Mark as read
router.put('/:notificationId/read', authenticateToken, notificationsController.markAsRead);

// Mark all as read
router.put('/read-all', authenticateToken, notificationsController.markAllAsRead);

export default router;
