import { Router } from 'express';
import { notificationService } from './notification.service';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Test dispatch notification
router.post('/dispatch', authMiddleware, requireRoles('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { recipientId, eventType, message, subject } = req.body;
    const log = await notificationService.dispatchNotification(recipientId, eventType, message, subject);
    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// View notification logs
router.get('/logs', authMiddleware, requireRoles('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const logs = await notificationService.getLogs(req.query.recipientId as string);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
