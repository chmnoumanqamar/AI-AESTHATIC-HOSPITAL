import { Router } from 'express';
import { tokenController } from './token.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Public or Authenticated Token matrix view
router.get('/matrix', (req, res, next) => tokenController.getMatrix(req, res, next));

// Staff & System Token allocation
router.post('/allocate', authMiddleware, requireRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), (req, res, next) =>
  tokenController.allocate(req, res, next)
);

// Cancel specific token (Admin, Receptionist, Doctor)
router.post('/:id/cancel', authMiddleware, requireRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), (req, res, next) =>
  tokenController.cancel(req, res, next)
);

export default router;
