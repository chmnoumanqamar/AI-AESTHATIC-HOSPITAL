import { v4 as uuidv4 } from 'uuid';
import { db, DbClinicalRecord } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { CreateClinicalRecordInput, UpdateClinicalRecordInput } from './clinical.dto';
import { prescriptionVersionService } from './prescription-version.service';
import { doctorService } from '../doctor/doctor.service';
import { recordAuditLog } from '../../common/middleware/audit.middleware';
import { sanitizeClinicalResponse } from '../../common/middleware/rbac.middleware';

export class ClinicalService {
  /**
   * CREATE CLINICAL RECORD + OPTIONAL PRESCRIPTION
   */
  async createRecord(input: CreateClinicalRecordInput, doctorId: string) {
    // 1. Verify doctor has permitted access
    const isPermitted = await doctorService.verifyDoctorPatientAccess(doctorId, input.patientId);
    if (!isPermitted) {
      throw AppError.forbidden(
        'Doctor does not have permitted clinical access boundary for this patient.'
      );
    }

    const record: DbClinicalRecord = {
      id: uuidv4(),
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      doctorId,
      chiefComplaint: input.chiefComplaint,
      examinationNotes: input.examinationNotes,
      diagnosis: input.diagnosis,
      treatmentPlan: input.treatmentPlan,
      privateNotes: input.privateNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.clinicalRecords.push(record);

    // Update or establish doctor-patient relationship
    let relationship = db.doctorPatientRelationships.find(
      r => r.doctorId === doctorId && r.patientId === input.patientId
    );
    if (!relationship) {
      db.doctorPatientRelationships.push({
        id: uuidv4(),
        doctorId,
        patientId: input.patientId,
        firstVisitDate: new Date().toISOString(),
        lastVisitDate: new Date().toISOString(),
        totalVisits: 1
      });
    } else {
      relationship.lastVisitDate = new Date().toISOString();
      relationship.totalVisits += 1;
    }

    // Create prescription if medications included
    let prescriptionResult = null;
    if (input.medications && input.medications.length > 0) {
      prescriptionResult = await prescriptionVersionService.createInitialPrescription(
        record.id,
        input.patientId,
        doctorId,
        input.medications
      );
    }

    recordAuditLog({
      actorId: doctorId,
      actorType: 'DOCTOR',
      action: 'CLINICAL_RECORD_CREATED',
      resourceType: 'ClinicalRecord',
      resourceId: record.id,
      newState: record
    });

    return {
      record,
      prescription: prescriptionResult
    };
  }

  /**
   * EDIT CLINICAL RECORD (Part 5):
   * Direct updates accompanied by atomic, append-only audit logging with editReason.
   */
  async updateRecord(recordId: string, input: UpdateClinicalRecordInput, doctorId: string) {
    const record = db.clinicalRecords.find(r => r.id === recordId);
    if (!record) {
      throw AppError.notFound('Clinical record not found');
    }

    // Only attending doctor or assigned doctor can edit
    if (record.doctorId !== doctorId) {
      throw AppError.forbidden('Only the authoring doctor can edit this clinical record');
    }

    const previousState = { ...record };

    if (input.chiefComplaint !== undefined) record.chiefComplaint = input.chiefComplaint;
    if (input.examinationNotes !== undefined) record.examinationNotes = input.examinationNotes;
    if (input.diagnosis !== undefined) record.diagnosis = input.diagnosis;
    if (input.treatmentPlan !== undefined) record.treatmentPlan = input.treatmentPlan;
    if (input.privateNotes !== undefined) record.privateNotes = input.privateNotes;

    record.updatedAt = new Date().toISOString();

    recordAuditLog({
      actorId: doctorId,
      actorType: 'DOCTOR',
      action: 'CLINICAL_RECORD_EDIT',
      resourceType: 'ClinicalRecord',
      resourceId: record.id,
      previousState,
      newState: record,
      metadata: {
        editReason: input.editReason,
        timestamp: new Date().toISOString()
      }
    });

    return record;
  }

  /**
   * RETRIEVE PATIENT CLINICAL HISTORY:
   * Enforces privacy wall and doctor-patient relationship constraints.
   */
  async getPatientHistory(patientId: string, requestingRole: any, requestingProfileId?: string) {
    // If Doctor, verify relationship
    if (requestingRole === 'DOCTOR' && requestingProfileId) {
      const isPermitted = await doctorService.verifyDoctorPatientAccess(requestingProfileId, patientId);
      if (!isPermitted) {
        throw AppError.forbidden(
          'Clinical access boundary violation: Patient is not currently assigned or previously treated by you.'
        );
      }
    }

    const patient = db.patients.find(p => p.id === patientId);
    if (!patient) {
      throw AppError.notFound('Patient not found');
    }

    const records = db.clinicalRecords
      .filter(r => r.patientId === patientId)
      .map(r => {
        const doctor = db.doctors.find(d => d.id === r.doctorId);
        const prescriptions = db.prescriptions
          .filter(p => p.clinicalRecordId === r.id)
          .map(p => {
            const versions = db.prescriptionVersions.filter(v => v.prescriptionId === p.id);
            return {
              ...p,
              versions
            };
          });

        return {
          ...r,
          doctorName: doctor?.name || 'Dr. Attending',
          doctorSpecialization: doctor?.specialization,
          prescriptions
        };
      });

    // Apply API-level redaction
    const sanitized = sanitizeClinicalResponse(requestingRole, records);

    return {
      patientId,
      patientName: patient.fullName,
      totalRecords: records.length,
      records: sanitized
    };
  }
}

export const clinicalService = new ClinicalService();
