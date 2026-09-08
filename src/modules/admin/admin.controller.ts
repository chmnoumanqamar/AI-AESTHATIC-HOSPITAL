import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { UpdateUserAccessSchema, UpdateUserRoleSchema, CreateUserSchema, PurgeDatabaseSchema } from './admin.dto';

export class AdminController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, search, status } = req.query;
      const users = await adminService.getAllUsers({
        role: role as string,
        search: search as string,
        status: status as string
      });
      res.json({ status: 'SUCCESS', data: users });
    } catch (err) {
      next(err);
    }
  }

  async updateUserAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const parsed = UpdateUserAccessSchema.parse(req.body);
      const adminActorId = req.user?.userId || 'u-admin-01';

      const result = await adminService.updateUserAccess(
        userId,
        parsed.isBlocked,
        parsed.reason,
        adminActorId
      );

      res.json({
        status: 'SUCCESS',
        message: parsed.isBlocked ? 'User access successfully blocked' : 'User access successfully restored and granted',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const parsed = UpdateUserRoleSchema.parse(req.body);
      const adminActorId = req.user?.userId || 'u-admin-01';

      const result = await adminService.updateUserRole(userId, parsed.role, adminActorId);
      res.json({
        status: 'SUCCESS',
        message: `User role updated to ${parsed.role}`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const allowedModules = req.body.allowedModules;
      if (!Array.isArray(allowedModules)) {
        res.status(400).json({ status: 'ERROR', message: 'allowedModules must be an array of module strings.' });
        return;
      }
      const adminActorId = req.user?.userId || 'u-admin-01';

      const result = await adminService.updateUserPermissions(userId, allowedModules, adminActorId);
      res.json({
        status: 'SUCCESS',
        message: 'Granular module permissions updated successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateUserSchema.parse(req.body);
      const adminActorId = req.user?.userId || 'u-admin-01';

      const result = await adminService.createUser(parsed, adminActorId);
      res.status(201).json({
        status: 'SUCCESS',
        message: 'New user created and access granted successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getDatabaseStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDatabaseStats();
      res.json({
        status: 'SUCCESS',
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }

  async purgeDatabase(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = PurgeDatabaseSchema.parse(req.body);
      const adminActorId = req.user?.userId || 'u-admin-01';

      const result = await adminService.purgeDatabase(parsed.action, adminActorId);
      res.json({
        status: 'SUCCESS',
        message: result.message,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getModuleHierarchy(req: Request, res: Response, next: NextFunction) {
    try {
      const hierarchy = await adminService.getModuleHierarchy();
      res.json({
        status: 'SUCCESS',
        data: hierarchy
      });
    } catch (err) {
      next(err);
    }
  }

  async movePageModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { pageId, targetCategory } = req.body;
      if (!pageId || !targetCategory) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'pageId and targetCategory are required'
        });
      }
      const adminActorId = req.user?.userId || 'u-admin-01';
      const result = await adminService.movePageModule(pageId, targetCategory, adminActorId);
      res.json({
        status: 'SUCCESS',
        message: `Page successfully moved to ${targetCategory}`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async resetModuleHierarchy(req: Request, res: Response, next: NextFunction) {
    try {
      const adminActorId = req.user?.userId || 'u-admin-01';
      const hierarchy = await adminService.resetModuleHierarchy(adminActorId);
      res.json({
        status: 'SUCCESS',
        message: 'Module hierarchy reset to system defaults',
        data: hierarchy
      });
    } catch (err) {
      next(err);
    }
  }

  async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getRolePermissions();
      res.json({
        status: 'SUCCESS',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.params;
      const { permissions } = req.body;
      if (!role || !Array.isArray(permissions)) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'role parameter and permissions array are required'
        });
      }
      const adminActorId = req.user?.userId || 'u-admin-01';
      const result = await adminService.updateRolePermissions(role, permissions, adminActorId);
      res.json({
        status: 'SUCCESS',
        message: `Permissions updated for role ${role}`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async addModuleToRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, moduleId, read = true, write = false, delete: deletePerm = false, newModuleDef } = req.body;
      if (!role || !moduleId) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'role and moduleId are required'
        });
      }
      const adminActorId = req.user?.userId || 'u-admin-01';
      const result = await adminService.addModuleToRole(role, moduleId, read, write, deletePerm, newModuleDef, adminActorId);
      res.json({
        status: 'SUCCESS',
        message: `Module ${moduleId} added to role ${role}`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async removeModuleFromRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, moduleId } = req.params;
      if (!role || !moduleId) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'role and moduleId are required'
        });
      }
      const adminActorId = req.user?.userId || 'u-admin-01';
      const result = await adminService.removeModuleFromRole(role, moduleId, adminActorId);
      res.json({
        status: 'SUCCESS',
        message: `Module ${moduleId} removed from role ${role}`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async resetRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const adminActorId = req.user?.userId || 'u-admin-01';
      const result = await adminService.resetRolePermissions(adminActorId);
      res.json({
        status: 'SUCCESS',
        message: 'Role permissions reset to clinical standards',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();

