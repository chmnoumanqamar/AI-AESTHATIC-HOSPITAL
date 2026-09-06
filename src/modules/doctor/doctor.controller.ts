import { Request, Response, NextFunction } from 'express';
import { doctorService } from './doctor.service';
import { updateDoctorProfileDto, updateDailyLimitDto } from './doctor.dto';
import { AppError } from '../../common/errors/AppError';

export class DoctorController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const doctors = await doctorService.getAllDoctors();
      res.json({
        success: true,
        data: doctors
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);
      res.json({
        success: true,
        data: doctor
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user?.profileId || req.params.id;
      if (!doctorId) {
        throw AppError.badRequest('Doctor ID required');
      }
      const validated = updateDoctorProfileDto.parse(req.body);
      const updated = await doctorService.updateProfile(doctorId, validated);
      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user?.profileId || (req.query.doctorId as string);
      const patientId = req.params.patientId;
      if (!doctorId || !patientId) {
        throw AppError.badRequest('doctorId and patientId required');
      }
      const hasAccess = await doctorService.verifyDoctorPatientAccess(doctorId, patientId);
      res.json({
        success: true,
        data: {
          hasAccess,
          doctorId,
          patientId
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDailyLimit(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user?.profileId || req.body?.doctorId || 'doc-01';
      const validated = updateDailyLimitDto.parse(req.body);
      const actorId = req.user?.userId || doctorId;
      const actorRole = req.user?.role || 'DOCTOR';

      const result = await doctorService.updateDailyLimit(
        doctorId,
        validated.dailyPatientLimit,
        actorId,
        actorRole
      );

      res.json({
        success: true,
        message: `Daily patient limit successfully updated to ${validated.dailyPatientLimit}`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const doctorController = new DoctorController();
