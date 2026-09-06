import { Router } from 'express';
import { doctorController } from './doctor.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Public doctor discovery for booking & AI tools
router.get('/', (req, res, next) => doctorController.getAll(req, res, next));
router.get('/:id', (req, res, next) => doctorController.getById(req, res, next));

// Verify doctor-patient access boundary
router.get('/:patientId/verify-access', authMiddleware, requireRoles('DOCTOR', 'ADMIN'), (req, res, next) =>
  doctorController.verifyAccess(req, res, next)
);

// Doctor profile update
router.patch('/profile', authMiddleware, requireRoles('DOCTOR', 'ADMIN'), (req, res, next) =>
  doctorController.updateProfile(req, res, next)
);

// Doctor daily patient limit update (dynamic/flexible capacity)
router.patch('/daily-limit', authMiddleware, requireRoles('DOCTOR', 'ADMIN'), (req, res, next) =>
  doctorController.updateDailyLimit(req, res, next)
);

export default router;
