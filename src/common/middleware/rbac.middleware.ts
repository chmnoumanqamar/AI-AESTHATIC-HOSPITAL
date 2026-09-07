import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'AI_AGENT';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    // Invariant: System Administrator has supreme universal access across all modules
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Direct role match
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Dynamic granular module-based permission bypass:
    // If user was granted specific modules that match the required role domain, allow access
    const userModules = req.user.allowedModules || [];
    const hasGrantedModule = allowedRoles.some(role => {
      if (role === 'DOCTOR' && userModules.some(m => m.startsWith('doctor_'))) return true;
      if (role === 'RECEPTIONIST' && userModules.some(m => m.startsWith('recep_'))) return true;
      if (role === 'PATIENT' && userModules.some(m => m.startsWith('patient_'))) return true;
      if (role === 'ADMIN' && userModules.some(m => m.startsWith('admin_'))) return true;
      return false;
    });

    if (hasGrantedModule) {
      return next();
    }

    throw AppError.forbidden(
      `Access Denied: Your account role [${req.user.role}] does not have authorization for this clinical module. Required: [${allowedRoles.join(', ')}]`
    );
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
