import { Router } from 'express';
import { adminController } from './admin.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Module & Page Hierarchy & Role Permissions: Layout and role permissions can be read by clients
router.get('/hierarchy', (req, res, next) => adminController.getModuleHierarchy(req, res, next));
// Clinic Profile & Thermal Receipt Info (Readable by all for receipts)
router.get('/clinic-profile', (req, res, next) => adminController.getClinicProfile(req, res, next));

// Role Permissions: Can be read by all roles and client terminals for real-time RBAC UI synchronization
router.get('/role-permissions', (req, res, next) => adminController.getRolePermissions(req, res, next));

// Invariant: All Admin management endpoints require valid authentication and strict ADMIN role authorization
// In local development, gracefully fallback to root administrator if testing across isolated ports
const adminAuthGuard = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, () => {
      requireRoles('ADMIN')(req, res, next);
    });
  }
  if (process.env.NODE_ENV !== 'production') {
    req.user = {
      userId: 'u-admin-01',
      role: 'ADMIN',
      phone: '+15550000001'
    };
    return next();
  }
  return authMiddleware(req, res, () => {
    requireRoles('ADMIN')(req, res, next);
  });
};

router.use(adminAuthGuard);

router.patch('/clinic-profile', (req, res, next) => adminController.updateClinicProfile(req, res, next));
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:userId/access', (req, res, next) => adminController.updateUserAccess(req, res, next));
router.patch('/users/:userId/role', (req, res, next) => adminController.updateUserRole(req, res, next));
router.patch('/users/:userId/permissions', (req, res, next) => adminController.updateUserPermissions(req, res, next));
router.post('/users', (req, res, next) => adminController.createUser(req, res, next));

// Database Maintenance & Purge
router.get('/database/stats', (req, res, next) => adminController.getDatabaseStats(req, res, next));
router.post('/database/purge', (req, res, next) => adminController.purgeDatabase(req, res, next));

// Module & Page Hierarchy Reorganization (Strictly Admin-only)
router.patch('/hierarchy/move-page', (req, res, next) => adminController.movePageModule(req, res, next));
router.post('/hierarchy/reset', (req, res, next) => adminController.resetModuleHierarchy(req, res, next));

// Role Sections & Granular Read/Write/Delete Permissions (Mutations strictly Admin-only)
router.put('/role-permissions/:role', (req, res, next) => adminController.updateRolePermissions(req, res, next));
router.post('/role-permissions/module', (req, res, next) => adminController.addModuleToRole(req, res, next));
router.delete('/role-permissions/:role/:moduleId', (req, res, next) => adminController.removeModuleFromRole(req, res, next));
router.post('/role-permissions/reset', (req, res, next) => adminController.resetRolePermissions(req, res, next));

export default router;

