import { db, DbPatient } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { CheckDuplicateInput, UpdateNotificationPreferencesInput } from './patient.dto';

export class PatientService {
  async getAllPatients() {
    return db.patients.map(p => {
      const user = db.users.find(u => u.id === p.userId);
      return {
        ...p,
        phone: user?.phone,
        email: user?.email
      };
    });
  }

  async getPatientById(id: string) {
    const patient = db.patients.find(p => p.id === id);
    if (!patient) {
      throw AppError.notFound('Patient record not found');
    }
    const user = db.users.find(u => u.id === patient.userId);
    return {
      ...patient,
      phone: user?.phone,
      email: user?.email
    };
  }

  /**
   * DUPLICATE DETECTION ROUTINE (Part 7):
   * cnic = :cnic OR phone = :phone OR (email IS NOT NULL AND email = :email)
   * Masked contact details returned on collision
   */
  async checkDuplicate(input: CheckDuplicateInput) {
    const { cnic, phone, email } = input;

    for (const patient of db.patients) {
      const user = db.users.find(u => u.id === patient.userId);
      const isCnicMatch = cnic && patient.cnic.trim().toLowerCase() === cnic.trim().toLowerCase();
      const isPhoneMatch = phone && user?.phone.trim() === phone.trim();
      const isEmailMatch = email && user?.email && user.email.trim().toLowerCase() === email.trim().toLowerCase();

      if (isCnicMatch || isPhoneMatch || isEmailMatch) {
        // Mask phone: +1555***0010, Mask CNIC: 35201-*****67-1
        const rawPhone = user?.phone || '';
        const maskedPhone = rawPhone.length > 6 
          ? rawPhone.slice(0, 4) + '***' + rawPhone.slice(-3) 
          : '***';

        const rawCnic = patient.cnic;
        const maskedCnic = rawCnic.length > 6 
          ? rawCnic.slice(0, 6) + '***' + rawCnic.slice(-2) 
          : '***';

        return {
          isDuplicate: true,
          matchType: isCnicMatch ? 'CNIC' : isPhoneMatch ? 'PHONE' : 'EMAIL',
          existingPatientId: patient.id,
          existingFullName: patient.fullName,
          maskedPhone,
          maskedCnic,
          message: `Duplicate detected (${isCnicMatch ? 'CNIC' : isPhoneMatch ? 'Phone' : 'Email'} matches an existing record). Record cannot be duplicated.`
        };
      }
    }

    return {
      isDuplicate: false,
      message: 'No duplicate records found.'
    };
  }

  async updatePreferences(patientId: string, input: UpdateNotificationPreferencesInput) {
    const patient = db.patients.find(p => p.id === patientId);
    if (!patient) {
      throw AppError.notFound('Patient record not found');
    }

    if (input.hasWhatsApp !== undefined) {
      patient.hasWhatsApp = input.hasWhatsApp;
    }
    patient.primaryNotificationChannel = input.primaryNotificationChannel;
    if (input.backupNotificationChannel) {
      patient.backupNotificationChannel = input.backupNotificationChannel;
    }

    return patient;
  }
}

export const patientService = new PatientService();
