import { Router } from 'express';
import { clinicalController } from './clinical.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Create new clinical record (Doctor only)
router.post('/records', authMiddleware, requireRoles('DOCTOR'), (req, res, next) =>
  clinicalController.createRecord(req, res, next)
);

// Edit clinical record (Doctor only, generates mandatory audit log)
router.put('/records/:id', authMiddleware, requireRoles('DOCTOR'), (req, res, next) =>
  clinicalController.updateRecord(req, res, next)
);

// Get clinical history (Patient, Doctor with permitted boundary, Admin)
router.get('/patient/:patientId/history', authMiddleware, (req, res, next) =>
  clinicalController.getPatientHistory(req, res, next)
);

// Version a prescription: v1 -> v2 (Doctor only)
router.post('/prescriptions/version', authMiddleware, requireRoles('DOCTOR'), (req, res, next) =>
  clinicalController.createPrescriptionVersion(req, res, next)
);

// Git-style audit diff view for prescription (Doctor & Admin)
router.get('/prescriptions/:prescriptionId/audit', authMiddleware, requireRoles('DOCTOR', 'ADMIN'), (req, res, next) =>
  clinicalController.getPrescriptionAuditView(req, res, next)
);

export default router;
