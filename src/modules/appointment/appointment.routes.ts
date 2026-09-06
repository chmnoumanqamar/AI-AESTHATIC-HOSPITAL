import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

router.get('/', authMiddleware, (req, res, next) => appointmentController.getAll(req, res, next));
router.get('/:id', authMiddleware, (req, res, next) => appointmentController.getById(req, res, next));
router.post('/booking', authMiddleware, (req, res, next) => appointmentController.create(req, res, next));
router.patch('/:id/status', authMiddleware, requireRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), (req, res, next) =>
  appointmentController.updateStatus(req, res, next)
);
router.get('/reminders/patient/:patientId', authMiddleware, (req, res, next) =>
  appointmentController.getUpcomingReminders(req, res, next)
);
router.post('/reminders/trigger-check', authMiddleware, (req, res, next) =>
  appointmentController.triggerReminderCheck(req, res, next)
);
router.post('/reschedule', authMiddleware, (req, res, next) =>
  appointmentController.reschedule(req, res, next)
);

export default router;
