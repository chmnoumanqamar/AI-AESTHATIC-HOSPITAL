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
}

export const adminController = new AdminController();

