import { v4 as uuidv4 } from 'uuid';
import { db, DbPrescription, DbPrescriptionVersion } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { CreatePrescriptionVersionInput, MedicationItem } from './clinical.dto';
import { recordAuditLog } from '../../common/middleware/audit.middleware';

export class PrescriptionVersionService {
  /**
   * INITIAL PRESCRIPTION CREATION (v1)
   */
  async createInitialPrescription(
    clinicalRecordId: string,
    patientId: string,
    doctorId: string,
    medications: MedicationItem[]
  ) {
    const prescription: DbPrescription = {
      id: uuidv4(),
      clinicalRecordId,
      patientId,
      createdAt: new Date().toISOString()
    };
    db.prescriptions.push(prescription);

    const version1: DbPrescriptionVersion = {
      id: uuidv4(),
      prescriptionId: prescription.id,
      versionNumber: 1,
      doctorId,
      medicationsJson: medications,
      isCurrent: true,
      createdAt: new Date().toISOString()
    };
    db.prescriptionVersions.push(version1);

    recordAuditLog({
      actorId: doctorId,
      actorType: 'DOCTOR',
      action: 'PRESCRIPTION_V1_CREATED',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      newState: version1
    });

    return {
      prescription,
      activeVersion: version1
    };
  }

  /**
   * IMMUTABLE PRESCRIPTION VERSIONING ENGINE (Part 5):
   * 1. Marks current version isCurrent = FALSE.
   * 2. Calculates next version number (v1 -> v2 -> v3).
   * 3. Inserts new PrescriptionVersion record with isCurrent = TRUE and mandatory correction_reason.
   * 4. Logs field-level diff into AuditLog.
   */
  async createNewVersion(
    input: CreatePrescriptionVersionInput,
    doctorId: string
  ) {
    const prescription = db.prescriptions.find(p => p.id === input.prescriptionId);
    if (!prescription) {
      throw AppError.notFound('Prescription container not found');
    }

    const existingVersions = db.prescriptionVersions
      .filter(v => v.prescriptionId === input.prescriptionId)
      .sort((a, b) => a.versionNumber - b.versionNumber);

    const currentActiveVersion = existingVersions.find(v => v.isCurrent);
    if (currentActiveVersion) {
      currentActiveVersion.isCurrent = false;
    }

    const nextVersionNumber = existingVersions.length > 0 
      ? Math.max(...existingVersions.map(v => v.versionNumber)) + 1 
      : 1;

    const newVersion: DbPrescriptionVersion = {
      id: uuidv4(),
      prescriptionId: input.prescriptionId,
      versionNumber: nextVersionNumber,
      doctorId,
      medicationsJson: input.medications,
      correctionReason: input.correctionReason,
      isCurrent: true,
      createdAt: new Date().toISOString()
    };

    db.prescriptionVersions.push(newVersion);

    recordAuditLog({
      actorId: doctorId,
      actorType: 'DOCTOR',
      action: `PRESCRIPTION_VERSION_v${nextVersionNumber}_CREATED`,
      resourceType: 'PrescriptionVersion',
      resourceId: newVersion.id,
      previousState: currentActiveVersion,
      newState: newVersion,
      metadata: {
        correctionReason: input.correctionReason,
        supersededVersion: currentActiveVersion?.versionNumber
      }
    });

    return {
      prescriptionId: prescription.id,
      newVersion,
      allVersions: db.prescriptionVersions.filter(v => v.prescriptionId === input.prescriptionId)
    };
  }

  /**
   * DOCTOR VIEW: All versions with side-by-side git diff capability
   */
  async getPrescriptionAuditView(prescriptionId: string) {
    const prescription = db.prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) {
      throw AppError.notFound('Prescription not found');
    }

    const versions = db.prescriptionVersions
      .filter(v => v.prescriptionId === prescriptionId)
      .sort((a, b) => a.versionNumber - b.versionNumber)
      .map(v => {
        const doc = db.doctors.find(d => d.id === v.doctorId);
        return {
          ...v,
          doctorName: doc?.name || 'Dr. Attending'
        };
      });

    return {
      prescriptionId: prescription.id,
      patientId: prescription.patientId,
      versionsCount: versions.length,
      currentVersionNumber: versions.find(v => v.isCurrent)?.versionNumber,
      versions
    };
  }
}

export const prescriptionVersionService = new PrescriptionVersionService();
