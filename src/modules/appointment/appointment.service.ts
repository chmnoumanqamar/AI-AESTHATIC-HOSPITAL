import { v4 as uuidv4 } from 'uuid';
import { db, DbAppointment, DbQueueEntry, isDemoUser } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { tokenService } from '../token/token.service';
import { normalizeDateString } from '../../common/utils/date-helper';
import { CreateBookingInput, UpdateAppointmentStatusInput, RescheduleAppointmentInput } from './appointment.dto';
import { recordAuditLog } from '../../common/middleware/audit.middleware';
import { notificationService } from '../notification/notification.service';

export class AppointmentService {
  async getAllAppointments(filters?: { doctorId?: string; patientId?: string; date?: string; status?: string }, requestingUser?: any) {
    let list = db.appointments;

    // Handover Clean Slate standard: Non-demo users should NEVER receive demo seed data
    if (!isDemoUser(requestingUser)) {
      list = list.filter(a => !a.isDemo);
    }

    if (filters?.doctorId) {
      list = list.filter(a => a.doctorId === filters.doctorId);
    }
    if (filters?.patientId) {
      list = list.filter(a => a.patientId === filters.patientId);
    }
    if (filters?.date) {
      const norm = normalizeDateString(filters.date);
      list = list.filter(a => a.appointmentDate === norm);
    }
    if (filters?.status) {
      list = list.filter(a => a.status === filters.status);
    }

    return list.map(a => this.hydrateAppointment(a));
  }

  async getAppointmentById(id: string) {
    const appointment = db.appointments.find(a => a.id === id);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }
    return this.hydrateAppointment(appointment);
  }

  private hydrateAppointment(a: DbAppointment) {
    const patient = db.patients.find(p => p.id === a.patientId);
    const doctor = db.doctors.find(d => d.id === a.doctorId);
    const service = a.serviceId ? db.services.find(s => s.id === a.serviceId) : null;
    const token = a.tokenId ? db.dailyTokens.find(t => t.id === a.tokenId) : null;
    const queue = db.queueEntries.find(q => q.appointmentId === a.id);

    return {
      ...a,
      patientName: patient?.fullName || 'N/A',
      patientPhone: patient ? db.users.find(u => u.id === patient.userId)?.phone : undefined,
      patientCnic: patient?.cnic,
      doctorName: doctor?.name || 'N/A',
      doctorSpecialization: doctor?.specialization,
      serviceName: service?.name,
      serviceFee: service?.baseFee || doctor?.consultationFee,
      tokenNumber: token?.tokenNumber,
      tokenStatus: token?.status,
      queueStatus: queue?.queueStatus || 'NOT_CHECKED_IN',
      queueEntry: queue,
      chiefComplaint: a.chiefComplaint,
      notes: a.notes
    };
  }

  /**
   * CREATE BOOKING REQUEST:
   * Always sets status = 'PENDING'.
   * Allocates a concurrency-safe sequential token for the target date.
   */
  async createBooking(input: CreateBookingInput, actorUserId: string, actorRole: string) {
    const targetDate = normalizeDateString(input.appointmentDate);

    // 1. Allocate token
    const token = await tokenService.allocateToken(input.doctorId, targetDate);

    // 2. Create appointment with PENDING status
    const appointment: DbAppointment = {
      id: uuidv4(),
      patientId: input.patientId!,
      doctorId: input.doctorId,
      serviceId: input.serviceId,
      appointmentDate: targetDate,
      tokenId: token.id,
      status: 'PENDING',
      bookingSource: input.bookingSource,
      chiefComplaint: input.chiefComplaint,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.appointments.push(appointment);

    // 3. Create initial queue entry
    const queueEntry: DbQueueEntry = {
      id: uuidv4(),
      appointmentId: appointment.id,
      queueStatus: 'NOT_CHECKED_IN',
      createdAt: new Date().toISOString()
    };
    db.queueEntries.push(queueEntry);

    // 4. Audit Log
    recordAuditLog({
      actorId: actorUserId,
      actorType: actorRole,
      action: 'APPOINTMENT_REQUEST_CREATED',
      resourceType: 'Appointment',
      resourceId: appointment.id,
      newState: appointment
    });

    return this.hydrateAppointment(appointment);
  }

  /**
   * FRONT-DESK RECEPTIONIST APPROVAL / REJECTION / CANCELLATION
   */
  async updateStatus(
    appointmentId: string,
    input: UpdateAppointmentStatusInput,
    actorId: string,
    actorRole: string
  ) {
    const appointment = db.appointments.find(a => a.id === appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    const previousState = { ...appointment };

    if (input.status === 'CONFIRMED') {
      appointment.status = 'CONFIRMED';
      if (actorRole === 'RECEPTIONIST') {
        appointment.approvedByReceptionistId = actorId;
      }
      // Update token status to ACTIVE
      if (appointment.tokenId) {
        const token = db.dailyTokens.find(t => t.id === appointment.tokenId);
        if (token) token.status = 'ACTIVE';
      }

      // Automated WhatsApp Confirmation Dispatch to Patient
      try {
        const patient = db.patients.find(p => p.id === appointment.patientId);
        const user = patient ? db.users.find(u => u.id === patient.userId) : null;
        const doctor = db.doctors.find(d => d.id === appointment.doctorId);
        const token = appointment.tokenId ? db.dailyTokens.find(t => t.id === appointment.tokenId) : null;
        const phone = user?.phone;

        if (phone) {
          const confirmNotice =
            `✅ *Appointment Confirmed - Aesthetic Hospital*\n\n` +
            `Moazziz *${patient?.fullName || 'Patient'}*,\n` +
            `Front-desk receptionist ne aap ki appointment *${doctor?.name || 'Doctor'}* ke sath CONFIRM kar di hai!\n\n` +
            `📋 *Allocated Token:* *#${token?.tokenNumber || 'N/A'}*\n` +
            `📅 *Tareekh:* ${appointment.appointmentDate}\n` +
            `🩺 *Doctor:* ${doctor?.name || 'Consultant'}\n` +
            `🏥 *Location:* Reception OPD Counter, AI Aesthetic Hospital\n\n` +
            `Baraye meharbani apna Token Number counter par show karein. Shukriya!`;

          notificationService.dispatchNotification(
            appointment.patientId,
            'APPOINTMENT_CONFIRMED',
            confirmNotice,
            `Appointment Confirmed - Token #${token?.tokenNumber || ''}`
          ).catch(() => {});
        }
      } catch (err: any) {
        // Log silently
      }
    } else if (input.status === 'DECLINED' || input.status === 'CANCELLED') {
      appointment.status = input.status;
      // Invariant: Non-reusable cancelled token
      if (appointment.tokenId) {
        await tokenService.cancelToken(appointment.tokenId);
      }
      // Update queue
      const queue = db.queueEntries.find(q => q.appointmentId === appointment.id);
      if (queue) queue.queueStatus = 'NO_SHOW';

      // Automated WhatsApp Rejection/Decline Notice to Patient
      if (input.status === 'DECLINED') {
        try {
          const patient = db.patients.find(p => p.id === appointment.patientId);
          const user = patient ? db.users.find(u => u.id === patient.userId) : null;
          const doctor = db.doctors.find(d => d.id === appointment.doctorId);
          const phone = user?.phone;

          if (phone) {
            const declineNotice =
              `⚠️ *Appointment Update - Aesthetic Hospital*\n\n` +
              `Moazziz *${patient?.fullName || 'Patient'}*,\n` +
              `Schedule conflict ya doctor ki masroofiat ki waja se aap ki appointment request baraye *${doctor?.name || 'Doctor'}* (${appointment.appointmentDate}) manzoor nahi ho saki.\n\n` +
              `Waja: ${input.reason || 'Front-desk schedule conflict'}\n\n` +
              `Baraye meharbani kisi doosray din ya slot ke liye hamaray WhatsApp Bot par dobara rabta karein.`;

            notificationService.dispatchNotification(
              appointment.patientId,
              'APPOINTMENT_DECLINED',
              declineNotice,
              'Appointment Request Declined'
            ).catch(() => {});
          }
        } catch (err: any) {
          // Log silently
        }
      }
    }

    appointment.updatedAt = new Date().toISOString();

    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: `APPOINTMENT_STATUS_${input.status}`,
      resourceType: 'Appointment',
      resourceId: appointment.id,
      previousState,
      newState: appointment,
      metadata: { reason: input.reason }
    });

    return this.hydrateAppointment(appointment);
  }

  /**
   * RESCHEDULING COMPLETE WORKFLOW (Part 7):
   * Step 1: Transitions old appointment to 'CANCELLED'.
   * Step 2: Transitions old token to 'CANCELLED' (permanently locked).
   * Step 3: Generates new appointment with status = 'PENDING' on newDate.
   * Step 4: Allocates new token on newDate.
   */
  async rescheduleAppointment(
    input: RescheduleAppointmentInput,
    actorId: string,
    actorRole: string
  ) {
    const oldAppointment = db.appointments.find(a => a.id === input.appointmentId);
    if (!oldAppointment) {
      throw AppError.notFound('Original appointment not found');
    }

    // Step 1: Cancel old appointment
    const previousState = { ...oldAppointment };
    oldAppointment.status = 'RESCHEDULED';
    oldAppointment.updatedAt = new Date().toISOString();

    // Step 2: Permanently cancel old token
    if (oldAppointment.tokenId) {
      await tokenService.cancelToken(oldAppointment.tokenId);
    }

    // Step 3 & 4: Allocate new token & create new appointment
    const newDate = normalizeDateString(input.newDate);
    const newToken = await tokenService.allocateToken(oldAppointment.doctorId, newDate);

    const newAppointment: DbAppointment = {
      id: uuidv4(),
      patientId: oldAppointment.patientId,
      doctorId: oldAppointment.doctorId,
      serviceId: oldAppointment.serviceId,
      appointmentDate: newDate,
      tokenId: newToken.id,
      status: 'PENDING',
      bookingSource: 'RESCHEDULE_FLOW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.appointments.push(newAppointment);

    const newQueueEntry: DbQueueEntry = {
      id: uuidv4(),
      appointmentId: newAppointment.id,
      queueStatus: 'NOT_CHECKED_IN',
      createdAt: new Date().toISOString()
    };
    db.queueEntries.push(newQueueEntry);

    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: 'APPOINTMENT_RESCHEDULED',
      resourceType: 'Appointment',
      resourceId: newAppointment.id,
      previousState: { oldAppointmentId: oldAppointment.id, oldDate: oldAppointment.appointmentDate },
      newState: { newAppointmentId: newAppointment.id, newDate: newAppointment.appointmentDate },
      metadata: { reason: input.reason }
    });

    return {
      cancelledAppointment: this.hydrateAppointment(oldAppointment),
      newAppointment: this.hydrateAppointment(newAppointment)
    };
  }
}

export const appointmentService = new AppointmentService();
