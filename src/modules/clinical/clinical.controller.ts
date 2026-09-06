import { Request, Response, NextFunction } from 'express';
import { clinicalService } from './clinical.service';
import { prescriptionVersionService } from './prescription-version.service';
import { createClinicalRecordDto, updateClinicalRecordDto, createPrescriptionVersionDto } from './clinical.dto';
import { AppError } from '../../common/errors/AppError';

export class ClinicalController {
  async createRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user?.profileId;
      if (!doctorId) {
        throw AppError.forbidden('Only authenticated doctors can author clinical records');
      }
      const validated = createClinicalRecordDto.parse(req.body);
      const result = await clinicalService.createRecord(validated, doctorId);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user?.profileId;
      if (!doctorId) {
        throw AppError.forbidden('Only authenticated doctors can modify clinical records');
      }
      const validated = updateClinicalRecordDto.parse(req.body);
      const result = await clinicalService.updateRecord(req.params.id, validated, doctorId);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getPatientHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.user?.profileId;
      if (!patientId) {
        throw AppError.badRequest('Patient ID is required');
      }

      const role = req.user?.role || 'PATIENT';
      const requestingProfileId = req.user?.profileId;

      const history = await clinicalService.getPatientHistory(patientId, role, requestingProfileId);
      res.json({
        success: true,
        data: history
      });
    } catch (err) {
      next(err);
    }
  }

  async createPrescriptionVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user?.profileId;
      if (!doctorId) {
        throw AppError.forbidden('Only authenticated doctors can version prescriptions');
      }
      const validated = createPrescriptionVersionDto.parse(req.body);
      const result = await prescriptionVersionService.createNewVersion(validated, doctorId);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getPrescriptionAuditView(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await prescriptionVersionService.getPrescriptionAuditView(req.params.prescriptionId);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const clinicalController = new ClinicalController();
