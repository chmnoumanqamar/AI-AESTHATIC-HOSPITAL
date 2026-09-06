import { Request, Response, NextFunction } from 'express';
import { patientService } from './patient.service';
import { checkDuplicateDto, updateNotificationPreferencesDto } from './patient.dto';
import { AppError } from '../../common/errors/AppError';

export class PatientController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const patients = await patientService.getAllPatients();
      res.json({
        success: true,
        data: patients
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.getPatientById(req.params.id);
      res.json({
        success: true,
        data: patient
      });
    } catch (err) {
      next(err);
    }
  }

  async checkDuplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = checkDuplicateDto.parse(req.body);
      const result = await patientService.checkDuplicate(validated);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = req.user?.profileId || req.params.id;
      if (!patientId) {
        throw AppError.badRequest('Patient ID required');
      }
      const validated = updateNotificationPreferencesDto.parse(req.body);
      const result = await patientService.updatePreferences(patientId, validated);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
