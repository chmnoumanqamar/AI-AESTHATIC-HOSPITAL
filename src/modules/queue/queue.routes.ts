import { Router } from 'express';
import { queueController } from './queue.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Live queue status stream (Public or authenticated)
router.get('/', optionalAuthMiddleware, (req, res, next) => queueController.getLiveQueue(req, res, next));

// Receptionist Rapid Check-In
router.post('/check-in', authMiddleware, requireRoles('ADMIN', 'RECEPTIONIST'), (req, res, next) =>
  queueController.checkIn(req, res, next)
);

// Doctor Summon Next Patient
router.post('/call-next', authMiddleware, requireRoles('ADMIN', 'DOCTOR'), (req, res, next) =>
  queueController.callNext(req, res, next)
);

// Consultation Start / Complete
router.post('/:appointmentId/start', authMiddleware, requireRoles('ADMIN', 'DOCTOR'), (req, res, next) =>
  queueController.startConsultation(req, res, next)
);

router.post('/:appointmentId/complete', authMiddleware, requireRoles('ADMIN', 'DOCTOR'), (req, res, next) =>
  queueController.completeConsultation(req, res, next)
);

export default router;
