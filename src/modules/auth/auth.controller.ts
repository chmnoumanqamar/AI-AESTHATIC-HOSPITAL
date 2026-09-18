import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { loginDto, registerPatientDto, resetPasswordDto, requestPasswordResetOtpDto } from './auth.dto';

import { AppError } from '../../common/errors/AppError';
import { db } from '../../common/data/mock-db';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginDto.parse(req.body);
      const result = await authService.login(validated);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async registerPatient(req: Request, res: Response, next: NextFunction) {
    try {
      // If caller is an authenticated receptionist, verify write permissions (both Desk and Pending Bookings)
      if (req.user?.role === 'RECEPTIONIST') {
        const perms = db.getPermissionsForRole('RECEPTIONIST');
        const deskRule = perms.find(p => p.moduleId === 'recep_desk');
        const approvalsRule = perms.find(p => p.moduleId === 'recep_approvals');

        if (deskRule && !deskRule.write) {
          throw AppError.forbidden('Access Denied: Write permission for Queue & Patient Check-In is disabled by Administrator. You cannot register new patients.');
        }
        if (approvalsRule && !approvalsRule.write) {
          throw AppError.forbidden('Access Denied: Pending Bookings is in Read-Only mode. Patient registration is disabled by Administrator.');
        }
      }

      const validated = registerPatientDto.parse(req.body);
      const result = await authService.registerPatient(validated);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  async requestPasswordResetOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = requestPasswordResetOtpDto.parse(req.body);
      const result = await authService.requestPasswordResetOtp(validated);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = resetPasswordDto.parse(req.body);
      const result = await authService.resetPassword(validated);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
