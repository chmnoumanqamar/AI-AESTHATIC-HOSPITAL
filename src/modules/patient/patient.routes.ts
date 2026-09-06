import { Router } from 'express';
import { patientController } from './patient.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Duplicate check can be called publicly during registration or by receptionist
router.post('/check-duplicate', (req, res, next) => patientController.checkDuplicate(req, res, next));

// Directory lookup (Admin, Doctor, Receptionist)
router.get('/', authMiddleware, requireRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), (req, res, next) =>
  patientController.getAll(req, res, next)
);

router.get('/:id', authMiddleware, (req, res, next) =>
  patientController.getById(req, res, next)
);

// Update notification preferences
router.patch('/preferences', authMiddleware, requireRoles('PATIENT', 'ADMIN'), (req, res, next) =>
  patientController.updatePreferences(req, res, next)
);

export default router;
