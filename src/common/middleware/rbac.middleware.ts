import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'AI_AGENT';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Role [${req.user.role}] is not authorized to access this resource. Required: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
};

/**
 * Clinical privacy wall for Receptionist & Patient:
 * Strips private diagnosis, internal notes, and doctor private notes from responses
 */
export const sanitizeClinicalResponse = (role: UserRole, clinicalData: any): any => {
  if (!clinicalData) return clinicalData;

  if (Array.isArray(clinicalData)) {
    return clinicalData.map(item => sanitizeClinicalResponse(role, item));
  }

  const sanitized = { ...clinicalData };

  // Receptionist Clinical Privacy Wall: Absolute zero access to Diagnosis, Exam, Notes, Prescriptions
  if (role === 'RECEPTIONIST') {
    delete sanitized.diagnosis;
    delete sanitized.examinationNotes;
    delete sanitized.chiefComplaint;
    delete sanitized.treatmentPlan;
    delete sanitized.privateNotes;
    delete sanitized.prescriptions;
    delete sanitized.prescriptionVersions;
  }

  // Patient Clinical Access: Can see diagnosis, prescription v_current, but NEVER Doctor Private Notes
  if (role === 'PATIENT') {
    delete sanitized.privateNotes;
    if (sanitized.prescriptions && Array.isArray(sanitized.prescriptions)) {
      sanitized.prescriptions = sanitized.prescriptions.map((rx: any) => {
        const activeVersion = rx.versions?.find((v: any) => v.isCurrent);
        return {
          ...rx,
          versions: activeVersion ? [activeVersion] : rx.versions
        };
      });
    }
  }

  return sanitized;
};
