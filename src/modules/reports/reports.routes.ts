import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Reports and executive analytics accessible to Admin and Receptionist
router.get(
  '/analytics',
  authMiddleware,
  requireRoles('ADMIN', 'RECEPTIONIST'),
  (req, res, next) => reportsController.getAnalytics(req, res, next)
);

export default router;
