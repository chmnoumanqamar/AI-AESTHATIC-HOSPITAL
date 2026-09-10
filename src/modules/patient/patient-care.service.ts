import { db, DbPatientPackage, DbAssignedLabTest, DbAppointment, DbDailyToken } from '../../common/data/mock-db';
import { logger } from '../../common/utils/logger';
import { recordAuditLog } from '../../common/middleware/audit.middleware';

export interface PackageBookingResult {
  success: boolean;
  appointmentId?: string;
  tokenNumber?: number;
  remainingSessions: number;
  message: string;
}

export class PatientCareService {
  /**
   * Retrieve all treatment deals & aesthetic packages for a patient
   */
  getPatientPackages(patientId: string): DbPatientPackage[] {
    return db.patientPackages.filter(p => p.patientId === patientId);
  }

  /**
   * Schedule one of the patient's remaining package sessions with zero additional fee
   */
  async bookPackageSession(
    patientId: string,
    packageId: string,
    doctorId: string,
    date: string
  ): Promise<PackageBookingResult> {
    const pkg = db.patientPackages.find(p => p.id === packageId && p.patientId === patientId);
    if (!pkg) {
      return { success: false, remainingSessions: 0, message: 'Treatment package not found.' };
    }

    if (pkg.status !== 'ACTIVE' || pkg.remainingSessions <= 0) {
      return {
        success: false,
        remainingSessions: pkg.remainingSessions,
        message: `Package "${pkg.packageName}" has no remaining sessions (0 remaining).`
      };
    }

    // Allocate next daily token for the target doctor and date
    const existingTokens = db.dailyTokens.filter(t => t.doctorId === doctorId && t.date === date);
    const nextTokenNum = existingTokens.reduce((max, t) => Math.max(max, t.tokenNumber || 0), 0) + 1;

    const token: DbDailyToken = {
      id: `tok-pkg-${Date.now()}`,
      doctorId,
      date,
      tokenNumber: nextTokenNum,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    db.dailyTokens.push(token);

    // Create confirmed appointment linked to the package
    const appointment: DbAppointment = {
      id: `apt-pkg-${Date.now()}`,
      patientId,
      doctorId,
      appointmentDate: date,
      tokenId: token.id,
      status: 'CONFIRMED',
      bookingSource: 'AI_PACKAGE_DEAL',
      notes: `Package Session #${pkg.completedSessions + 1} of ${pkg.totalSessions} (${pkg.packageName})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.appointments.push(appointment);

    // Deduct session from package
    pkg.completedSessions += 1;
    pkg.remainingSessions = Math.max(0, pkg.totalSessions - pkg.completedSessions);
    pkg.lastSessionDate = date;
    if (pkg.remainingSessions === 0) {
      pkg.status = 'COMPLETED';
    }

    db.saveToDisk();

    recordAuditLog({
      actorId: patientId,
      actorType: 'PATIENT',
      action: 'BOOK_PACKAGE_SESSION',
      resourceType: 'PatientPackage',
      resourceId: pkg.id,
      metadata: {
        appointmentId: appointment.id,
        tokenNumber: nextTokenNum,
        remainingSessions: pkg.remainingSessions
      }
    });

    logger.info(`[PatientCareService] Scheduled session for package ${pkg.packageName} (Remaining: ${pkg.remainingSessions})`);

    return {
      success: true,
      appointmentId: appointment.id,
      tokenNumber: nextTokenNum,
      remainingSessions: pkg.remainingSessions,
      message: `Session #${pkg.completedSessions} successfully booked for ${date} (Token #${nextTokenNum}). You have ${pkg.remainingSessions} sessions remaining in your deal.`
    };
  }

  /**
   * Get pending or assigned lab tests for a patient
   */
  getPendingLabTests(patientId: string): DbAssignedLabTest[] {
    return db.assignedLabTests.filter(
      t => t.patientId === patientId && (t.status === 'ASSIGNED' || t.status === 'PENDING_SAMPLE')
    );
  }

  /**
   * Update lab test status when patient completes or uploads a report
   */
  updateLabTestStatus(
    testId: string,
    status: 'ASSIGNED' | 'PENDING_SAMPLE' | 'SAMPLE_COLLECTED' | 'COMPLETED' | 'CANCELLED',
    reportUrl?: string,
    reportSummary?: string
  ): DbAssignedLabTest | null {
    const test = db.assignedLabTests.find(t => t.id === testId);
    if (!test) return null;

    test.status = status;
    if (reportUrl) test.reportUrl = reportUrl;
    if (reportSummary) test.reportSummary = reportSummary;

    db.saveToDisk();

    logger.info(`[PatientCareService] Updated lab test ${testId} status to ${status}`);
    return test;
  }

  /**
   * Mark reminder sent for a lab test to avoid repeat nagging
   */
  recordLabTestReminder(testId: string) {
    const test = db.assignedLabTests.find(t => t.id === testId);
    if (test) {
      test.reminderSentCount = (test.reminderSentCount || 0) + 1;
      test.lastReminderSentAt = new Date().toISOString();
      db.saveToDisk();
    }
  }
}

export const patientCareService = new PatientCareService();
