import { Request, Response, NextFunction } from 'express';
import { tokenService } from './token.service';
import { normalizeDateString } from '../../common/utils/date-helper';
import { AppError } from '../../common/errors/AppError';
import { db } from '../../common/data/mock-db';

export class TokenController {
  async getMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = (req.query.doctorId as string) || req.user?.profileId;
      const date = (req.query.date as string) || normalizeDateString(new Date());

      if (!doctorId) {
        throw AppError.badRequest('doctorId query parameter is required');
      }

      const matrix = await tokenService.getDoctorTokensMatrix(doctorId, date);
      res.json({
        success: true,
        data: matrix
      });
    } catch (err) {
      next(err);
    }
  }

  async allocate(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role === 'DOCTOR') {
        const perms = db.getPermissionsForRole('DOCTOR');
        const rule = perms.find(p => p.moduleId === 'doctor_tokens');
        if (rule && !rule.write) {
          throw AppError.forbidden('Access Denied: Token allocation write permission is disabled by Administrator.');
        }
      } else if (req.user?.role === 'RECEPTIONIST') {
        const perms = db.getPermissionsForRole('RECEPTIONIST');
        const rule = perms.find(p => p.moduleId === 'recep_desk');
        if (rule && !rule.write) {
          throw AppError.forbidden('Access Denied: Token allocation write permission is disabled by Administrator.');
        }
      }

      const { doctorId, date } = req.body;
      if (!doctorId || !date) {
        throw AppError.badRequest('doctorId and date are required');
      }
      const token = await tokenService.allocateToken(doctorId, date);
      res.status(201).json({
        success: true,
        data: token
      });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role === 'DOCTOR') {
        const perms = db.getPermissionsForRole('DOCTOR');
        const rule = perms.find(p => p.moduleId === 'doctor_tokens');
        if (rule && !rule.delete) {
          throw AppError.forbidden('Access Denied: Token cancellation delete permission is disabled by Administrator.');
        }
      } else if (req.user?.role === 'RECEPTIONIST') {
        const perms = db.getPermissionsForRole('RECEPTIONIST');
        const rule = perms.find(p => p.moduleId === 'recep_desk');
        if (rule && !rule.delete) {
          throw AppError.forbidden('Access Denied: Token cancellation delete permission is disabled by Administrator.');
        }
      }

      const { id } = req.params;
      const token = await tokenService.cancelToken(id);
      res.json({
        success: true,
        data: token
      });
    } catch (err) {
      next(err);
    }
  }
}

export const tokenController = new TokenController();
