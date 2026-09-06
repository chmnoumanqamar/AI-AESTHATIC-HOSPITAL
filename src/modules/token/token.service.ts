import { v4 as uuidv4 } from 'uuid';
import { db, DbDailyToken } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { normalizeDateString } from '../../common/utils/date-helper';
import { UNRESOLVED_POLICIES } from '../../config/unresolved-policies.config';

export class TokenService {
  // Concurrency mutex lock dictionary per (doctorId_date)
  private locks: Map<string, Promise<any>> = new Map();

  private async acquireLock(key: string): Promise<() => void> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }
    let resolver: () => void;
    const promise = new Promise<void>(resolve => {
      resolver = resolve;
    });
    this.locks.set(key, promise);
    return () => {
      this.locks.delete(key);
      resolver!();
    };
  }

  /**
   * CONCURRENCY-SAFE TOKEN ALLOCATION (Part 3):
   * 1. Lock Doctor Daily Schedule record for target date.
   * 2. Count active patients (RESERVED, ACTIVE) -> A.
   * 3. Check A < L (doctor.daily_patient_limit).
   * 4. Next token number = MAX(token_number) + 1 (T_max = A + C + 1).
   * 5. Insert new DailyToken with status = 'RESERVED'.
   */
  async allocateToken(doctorId: string, dateInput: string | Date): Promise<DbDailyToken> {
    const targetDate = normalizeDateString(dateInput);
    const lockKey = `${doctorId}_${targetDate}`;
    const releaseLock = await this.acquireLock(lockKey);

    try {
      const doctor = db.doctors.find(d => d.id === doctorId);
      if (!doctor) {
        throw AppError.notFound(`Doctor with ID ${doctorId} not found`);
      }

      const dailyLimit = doctor.dailyPatientLimit || UNRESOLVED_POLICIES.DEFAULT_DAILY_PATIENT_LIMIT;

      // Existing tokens for this doctor and date
      const tokensForDay = db.dailyTokens.filter(
        t => t.doctorId === doctorId && t.date === targetDate
      );

      // Active tokens (RESERVED or ACTIVE)
      const activeTokens = tokensForDay.filter(t => t.status === 'RESERVED' || t.status === 'ACTIVE');
      const activeCount = activeTokens.length;

      // Mathematical Capacity Law: A < L
      if (activeCount >= dailyLimit) {
        throw AppError.conflict(
          `Doctor daily patient capacity limit (${dailyLimit}) has been reached for date ${targetDate}.`
        );
      }

      // Calculate maximum existing token sequence
      const maxSequence = tokensForDay.reduce((max, t) => Math.max(max, t.tokenNumber), 0);
      const nextTokenNumber = maxSequence + 1;

      const newToken: DbDailyToken = {
        id: uuidv4(),
        doctorId,
        date: targetDate,
        tokenNumber: nextTokenNumber,
        status: 'RESERVED',
        createdAt: new Date().toISOString()
      };

      db.dailyTokens.push(newToken);
      return newToken;
    } finally {
      releaseLock();
    }
  }

  /**
   * NON-REUSABILITY RULE (Part 3):
   * If a token is cancelled, it permanently transitions to CANCELLED and is never reassigned.
   */
  async cancelToken(tokenId: string): Promise<DbDailyToken> {
    const token = db.dailyTokens.find(t => t.id === tokenId);
    if (!token) {
      throw AppError.notFound('Token not found');
    }

    token.status = 'CANCELLED';
    token.cancelledAt = new Date().toISOString();
    return token;
  }

  /**
   * Inspection & Matrix calculation for Doctor / Receptionist UI
   */
  async getDoctorTokensMatrix(doctorId: string, dateInput: string | Date) {
    db.ensureTodaySchedule();
    const targetDate = normalizeDateString(dateInput);
    const doctor = db.doctors.find(d => d.id === doctorId);
    if (!doctor) {
      throw AppError.notFound('Doctor not found');
    }

    const tokens = db.dailyTokens
      .filter(t => t.doctorId === doctorId && t.date === targetDate)
      .sort((a, b) => a.tokenNumber - b.tokenNumber);

    const activeCount = tokens.filter(t => t.status === 'RESERVED' || t.status === 'ACTIVE').length;
    const cancelledCount = tokens.filter(t => t.status === 'CANCELLED').length;
    const dailyLimit = doctor.dailyPatientLimit;
    const maxSequenceIssued = tokens.reduce((max, t) => Math.max(max, t.tokenNumber), 0);
    const availableSlots = Math.max(0, dailyLimit - activeCount);

    return {
      doctorId,
      doctorName: doctor.name,
      date: targetDate,
      dailyLimit,
      activePatientsCount: activeCount, // A
      cancelledCount,                   // C
      maxSequenceIssued,                // T_max = A + C
      availableCapacity: availableSlots,
      tokens: tokens.map(t => {
        const appointment = db.appointments.find(a => a.tokenId === t.id);
        const patient = appointment ? db.patients.find(p => p.id === appointment.patientId) : null;
        const queueEntry = appointment ? db.queueEntries.find(q => q.appointmentId === appointment.id) : null;

        return {
          id: t.id,
          tokenNumber: t.tokenNumber,
          status: t.status,
          cancelledAt: t.cancelledAt,
          patientName: patient?.fullName || 'N/A',
          appointmentId: appointment?.id,
          appointmentStatus: appointment?.status,
          queueStatus: queueEntry?.queueStatus || 'NOT_CHECKED_IN'
        };
      })
    };
  }
}

export const tokenService = new TokenService();
