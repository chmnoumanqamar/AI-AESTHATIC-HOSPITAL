import { db, DbDoctor } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { UpdateDoctorProfileInput } from './doctor.dto';
import { normalizeDateString } from '../../common/utils/date-helper';
import { recordAuditLog } from '../../common/middleware/audit.middleware';

export class DoctorService {
  async getAllDoctors() {
    return db.doctors.map(d => {
      const services = db.doctorServices
        .filter(ds => ds.doctorId === d.id)
        .map(ds => db.services.find(s => s.id === ds.serviceId))
        .filter(Boolean);

      return {
        ...d,
        services
      };
    });
  }

  async getDoctorById(id: string) {
    const doctor = db.doctors.find(d => d.id === id);
    if (!doctor) {
      throw AppError.notFound('Doctor profile not found');
    }
    const services = db.doctorServices
      .filter(ds => ds.doctorId === doctor.id)
      .map(ds => db.services.find(s => s.id === ds.serviceId))
      .filter(Boolean);

    return {
      ...doctor,
      services
    };
  }

  /**
   * CLINICAL ACCESS BOUNDARY (Part 2):
   * Validates if a doctor is allowed to access a given patient's medical history.
   * Allowed ONLY if:
   * 1. Patient is assigned to this doctor for today's date in an active appointment, OR
   * 2. DoctorPatientRelationship exists (previously treated).
   */
  async verifyDoctorPatientAccess(doctorId: string, patientId: string): Promise<boolean> {
    const today = normalizeDateString(new Date());

    // Check today's appointment
    const hasTodayAppointment = db.appointments.some(
      a =>
        a.doctorId === doctorId &&
        a.patientId === patientId &&
        a.appointmentDate === today &&
        ['CONFIRMED', 'PENDING'].includes(a.status)
    );

    if (hasTodayAppointment) {
      return true;
    }

    // Check past relationship
    const hasRelationship = db.doctorPatientRelationships.some(
      r => r.doctorId === doctorId && r.patientId === patientId
    );

    return hasRelationship;
  }

  async updateProfile(doctorId: string, input: UpdateDoctorProfileInput) {
    const doctor = db.doctors.find(d => d.id === doctorId);
    if (!doctor) {
      throw AppError.notFound('Doctor profile not found');
    }

    Object.assign(doctor, input);
    return doctor;
  }

  async updateDailyLimit(doctorId: string, newLimit: number, actorId: string = 'doc-01', actorRole: string = 'DOCTOR') {
    const doctor = db.doctors.find(d => d.id === doctorId);
    if (!doctor) {
      throw AppError.notFound('Doctor profile not found');
    }

    if (newLimit < 1) {
      throw AppError.badRequest('Daily patient limit must be at least 1.');
    }

    const previousLimit = doctor.dailyPatientLimit;
    doctor.dailyPatientLimit = newLimit;

    // Record Immutable Audit Log
    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: 'DOCTOR_DAILY_PATIENT_LIMIT_ADJUSTED',
      resourceType: 'DoctorCapacity',
      resourceId: doctor.id,
      previousState: { dailyPatientLimit: previousLimit },
      newState: { dailyPatientLimit: newLimit },
      metadata: {
        doctorName: doctor.name,
        previousLimit,
        newLimit,
        timestamp: new Date().toISOString()
      }
    });

    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      previousLimit,
      dailyPatientLimit: doctor.dailyPatientLimit
    };
  }
}

export const doctorService = new DoctorService();

