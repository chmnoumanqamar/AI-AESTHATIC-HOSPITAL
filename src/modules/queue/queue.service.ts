import { db, DbQueueEntry, isDemoUser } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { normalizeDateString } from '../../common/utils/date-helper';
import { recordAuditLog } from '../../common/middleware/audit.middleware';

export class QueueService {
  /**
   * LIVE QUEUE STREAM / MATRIX QUERY
   */
  async getLiveQueue(doctorId?: string, dateInput?: string, requestingUser?: any) {
    db.ensureTodaySchedule();
    db.ensureTokensForAppointments();
    const targetDate = dateInput ? normalizeDateString(dateInput) : normalizeDateString(new Date());

    let appointments = db.appointments.filter(
      a => a.appointmentDate === targetDate && ['CONFIRMED', 'PENDING'].includes(a.status)
    );

    // Production Handover Standard: Any newly added person/staff must NEVER see factory mock/dummy records.
    // Their department starts 100% clean and empty until real live patients are registered.
    if (!isDemoUser(requestingUser)) {
      appointments = appointments.filter(a => !a.isDemo);
    }

    if (doctorId) {
      appointments = appointments.filter(a => a.doctorId === doctorId);
    }

    const queueList = appointments.map((a, idx) => {
      let token = a.tokenId ? db.dailyTokens.find(t => t.id === a.tokenId) : null;
      let tokenNumber = token?.tokenNumber || 0;

      // Self-healing guarantee: never return 0 or unassigned tokens in live queue
      if (tokenNumber <= 0) {
        const tokensForDoctorDay = db.dailyTokens.filter(
          t => t.doctorId === a.doctorId && t.date === a.appointmentDate
        );
        const maxSeq = tokensForDoctorDay.reduce((max, t) => Math.max(max, t.tokenNumber || 0), 0);
        tokenNumber = maxSeq + 1;
        if (token) {
          token.tokenNumber = tokenNumber;
        } else {
          token = {
            id: `tok-auto-${a.id.slice(0, 12)}`,
            doctorId: a.doctorId,
            date: a.appointmentDate,
            tokenNumber,
            status: a.status === 'CONFIRMED' ? 'ACTIVE' : 'RESERVED',
            isDemo: a.isDemo,
            createdAt: a.createdAt || new Date().toISOString()
          };
          db.dailyTokens.push(token);
          a.tokenId = token.id;
        }
      }

      const patient = db.patients.find(p => p.id === a.patientId);
      const doctor = db.doctors.find(d => d.id === a.doctorId);
      const service = a.serviceId ? db.services.find(s => s.id === a.serviceId) : null;
      const queue = db.queueEntries.find(q => q.appointmentId === a.id);

      return {
        appointmentId: a.id,
        queueEntryId: queue?.id,
        tokenNumber,
        tokenStatus: token?.status || 'RESERVED',
        patientId: a.patientId,
        patientName: patient?.fullName || 'N/A',
        patientPhone: patient ? db.users.find(u => u.id === patient.userId)?.phone : undefined,
        doctorId: a.doctorId,
        doctorName: doctor?.name || 'N/A',
        serviceName: service?.name || 'General Consultation',
        appointmentStatus: a.status,
        queueStatus: queue?.queueStatus || 'NOT_CHECKED_IN',
        checkInTime: queue?.checkInTime,
        calledTime: queue?.calledTime,
        consultationStartTime: queue?.consultationStartTime,
        consultationEndTime: queue?.consultationEndTime
      };
    });

    // Intelligent Sorting:
    // Active clinical consultations & called patients first, then waiting queue in sequence, then others
    const statusPriority: Record<string, number> = {
      IN_CONSULTATION: 1,
      CALLED: 2,
      WAITING: 3,
      NOT_CHECKED_IN: 4,
      COMPLETED: 5,
      NO_SHOW: 6
    };

    return queueList.sort((a, b) => {
      const pDiff = (statusPriority[a.queueStatus] || 99) - (statusPriority[b.queueStatus] || 99);
      if (pDiff !== 0) return pDiff;
      return a.tokenNumber - b.tokenNumber;
    });
  }

  /**
   * RECEPTIONIST RAPID CHECK-IN:
   * Transitions queue_status from NOT_CHECKED_IN -> WAITING
   */
  async checkInPatient(appointmentId: string, actorId: string, actorRole: string) {
    const appointment = db.appointments.find(a => a.id === appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    if (appointment.status !== 'CONFIRMED') {
      throw AppError.badRequest(
        `Cannot check in appointment with status '${appointment.status}'. Must be 'CONFIRMED'.`
      );
    }

    let queue = db.queueEntries.find(q => q.appointmentId === appointmentId);
    if (!queue) {
      queue = {
        id: `qe-${Date.now()}`,
        appointmentId,
        queueStatus: 'NOT_CHECKED_IN',
        createdAt: new Date().toISOString()
      };
      db.queueEntries.push(queue);
    }

    const previousState = { ...queue };
    queue.queueStatus = 'WAITING';
    queue.checkInTime = new Date().toISOString();

    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: 'PATIENT_CHECKED_IN',
      resourceType: 'QueueEntry',
      resourceId: queue.id,
      previousState,
      newState: queue
    });

    return queue;
  }

  /**
   * "CALL NEXT PATIENT" SELECTION ALGORITHM WITH SKIP LOGIC (Part 4):
   * Criteria:
   * - appointment.doctor_id == current_doctor_id
   * - appointment.appointment_date == CURRENT_DATE
   * - appointment.status == 'CONFIRMED'
   * - queue_entry.queue_status == 'WAITING' (Must be physically checked in)
   * Order By:
   * - token.token_number ASC
   * Limit: 1
   * Skips un-checked-in or non-waiting tokens!
   */
  async callNextPatient(doctorId: string, actorId: string, actorRole: string) {
    const today = normalizeDateString(new Date());

    // 1. Find all eligible appointments for today
    const eligibleAppointments = db.appointments.filter(
      a => a.doctorId === doctorId && a.appointmentDate === today && a.status === 'CONFIRMED'
    );

    // 2. Pair with queue and token details
    const candidateEntries = eligibleAppointments
      .map(a => {
        const queue = db.queueEntries.find(q => q.appointmentId === a.id);
        const token = a.tokenId ? db.dailyTokens.find(t => t.id === a.tokenId) : null;
        return {
          appointment: a,
          queue,
          token
        };
      })
      .filter(entry => entry.queue && entry.queue.queueStatus === 'WAITING' && entry.token)
      .sort((a, b) => (a.token?.tokenNumber || 0) - (b.token?.tokenNumber || 0));

    if (candidateEntries.length === 0) {
      throw AppError.notFound('No waiting, checked-in patients in queue for this doctor today.');
    }

    // Pick top candidate (lowest token number among WAITING)
    const nextCandidate = candidateEntries[0];
    const queue = nextCandidate.queue!;
    const previousState = { ...queue };

    // Mutate queue status: WAITING -> CALLED
    queue.queueStatus = 'CALLED';
    queue.calledTime = new Date().toISOString();

    const patient = db.patients.find(p => p.id === nextCandidate.appointment.patientId);

    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: 'DOCTOR_CALLED_NEXT_PATIENT',
      resourceType: 'QueueEntry',
      resourceId: queue.id,
      previousState,
      newState: queue,
      metadata: {
        tokenNumber: nextCandidate.token?.tokenNumber,
        patientId: nextCandidate.appointment.patientId,
        patientName: patient?.fullName
      }
    });

    return {
      calledQueueEntry: queue,
      tokenNumber: nextCandidate.token?.tokenNumber,
      appointmentId: nextCandidate.appointment.id,
      patientId: nextCandidate.appointment.patientId,
      patientName: patient?.fullName,
      calledTime: queue.calledTime
    };
  }

  /**
   * START CONSULTATION: CALLED -> IN_CONSULTATION
   */
  async startConsultation(appointmentId: string, actorId: string, actorRole: string) {
    const queue = db.queueEntries.find(q => q.appointmentId === appointmentId);
    if (!queue) {
      throw AppError.notFound('Queue entry not found');
    }

    const previousState = { ...queue };
    queue.queueStatus = 'IN_CONSULTATION';
    queue.consultationStartTime = new Date().toISOString();

    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: 'CONSULTATION_STARTED',
      resourceType: 'QueueEntry',
      resourceId: queue.id,
      previousState,
      newState: queue
    });

    return queue;
  }

  /**
   * COMPLETE CONSULTATION: IN_CONSULTATION -> COMPLETED
   */
  async completeConsultation(appointmentId: string, actorId: string, actorRole: string) {
    const queue = db.queueEntries.find(q => q.appointmentId === appointmentId);
    if (!queue) {
      throw AppError.notFound('Queue entry not found');
    }

    const previousState = { ...queue };
    queue.queueStatus = 'COMPLETED';
    queue.consultationEndTime = new Date().toISOString();

    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: 'CONSULTATION_COMPLETED',
      resourceType: 'QueueEntry',
      resourceId: queue.id,
      previousState,
      newState: queue
    });

    return queue;
  }
}

export const queueService = new QueueService();
