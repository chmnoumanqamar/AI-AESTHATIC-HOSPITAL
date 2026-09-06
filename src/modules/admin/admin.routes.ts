import { Router } from 'express';
import { adminController } from './admin.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Invariant: All Admin endpoints require valid authentication and strict ADMIN role authorization
router.use(authMiddleware);
router.use(requireRoles('ADMIN'));

router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:userId/access', (req, res, next) => adminController.updateUserAccess(req, res, next));
router.patch('/users/:userId/role', (req, res, next) => adminController.updateUserRole(req, res, next));
router.post('/users', (req, res, next) => adminController.createUser(req, res, next));

// Database Maintenance & Purge
router.get('/database/stats', (req, res, next) => adminController.getDatabaseStats(req, res, next));
router.post('/database/purge', (req, res, next) => adminController.purgeDatabase(req, res, next));

export default router;

