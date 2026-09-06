import { Router } from 'express';
import { billingController } from './billing.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Caller's own billing summary (Patient)
router.get('/my-summary', authMiddleware, (req, res, next) => billingController.getMySummary(req, res, next));

// Staff looking up specific patient balance
router.get('/patient/:patientId', authMiddleware, requireRoles('ADMIN', 'RECEPTIONIST'), (req, res, next) =>
  billingController.getPatientSummary(req, res, next)
);

// POS Payment collection (Receptionist / Admin)
router.post('/pay', authMiddleware, requireRoles('ADMIN', 'RECEPTIONIST'), (req, res, next) =>
  billingController.recordPayment(req, res, next)
);

// Hospital-wide ledger (Admin only)
router.get('/ledger', authMiddleware, requireRoles('ADMIN'), (req, res, next) =>
  billingController.getHospitalLedger(req, res, next)
);

export default router;
