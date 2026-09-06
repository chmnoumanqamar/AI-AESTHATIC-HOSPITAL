import { Router } from 'express';
import { auditVaultService } from './audit.service';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Vault Statistics & Cryptographic Integrity status
router.get('/stats', authMiddleware, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const stats = await auditVaultService.getAuditStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// Immutable audit log viewer (Admin only)
router.get('/', authMiddleware, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const { resourceType, resourceId, actorId, search, limit } = req.query;
    const logs = await auditVaultService.getAuditLogs({
      resourceType: resourceType as string,
      resourceId: resourceId as string,
      actorId: actorId as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : undefined
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// Resource timeline (Admin & Doctor for clinical diff audits)
router.get('/timeline/:resourceType/:resourceId', authMiddleware, requireRoles('ADMIN', 'DOCTOR'), async (req, res, next) => {
  try {
    const timeline = await auditVaultService.getResourceTimeline(req.params.resourceType, req.params.resourceId);
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
});

export default router;
