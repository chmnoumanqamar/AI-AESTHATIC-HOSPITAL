import { db, DbAppointment } from '../../common/data/mock-db';
import { notificationService } from '../notification/notification.service';
import { logger } from '../../common/utils/logger';
import { recordAuditLog } from '../../common/middleware/audit.middleware';

export interface UpcomingReminderItem {
  appointmentId: string;
  appointmentDate: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientId: string;
  patientName: string;
  tokenNumber?: number;
  daysRemaining: number;
  isUpcomingSoon: boolean; // <= 2 days (48 hours)
  isFollowUp: boolean;
  reminderSent: boolean;
  reminderSentAt?: string;
}

export class AppointmentReminderService {
  /**
   * Scan all confirmed appointments and dispatch 48-hour prior notifications
   * via the failover multi-channel pipeline (WhatsApp -> SMS -> Email).
   */
  async scanAndDispatchUpcomingReminders(maxDaysAhead: number = 2) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetWindowEnd = new Date(today);
    targetWindowEnd.setDate(targetWindowEnd.getDate() + maxDaysAhead);
    targetWindowEnd.setHours(23, 59, 59, 999);

    const confirmedAppointments = db.appointments.filter(
      a => a.status === 'CONFIRMED' && !a.reminderSentAt
    );

    const dispatched: UpcomingReminderItem[] = [];

    for (const app of confirmedAppointments) {
      const appDate = new Date(app.appointmentDate);
      appDate.setHours(0, 0, 0, 0);

      // Check if within window (today <= appDate <= targetWindowEnd)
      if (appDate >= today && appDate <= targetWindowEnd) {
        const patient = db.patients.find(p => p.id === app.patientId);
        const doctor = db.doctors.find(d => d.id === app.doctorId);
        const token = app.tokenId ? db.dailyTokens.find(t => t.id === app.tokenId) : null;

        const diffTime = appDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const reminderMsg = `🔔 Hospital Consultation Reminder: Hello ${patient?.fullName || 'Patient'}, your appointment with ${doctor?.name || 'Doctor'} (${doctor?.specialization || 'Clinical Specialist'}) is scheduled for ${app.appointmentDate} (Token #${token?.tokenNumber || 'Assigned'}). Please arrive 15 minutes before your slot. Reply CANCEL or RESCHEDULE if needed.`;

        // Dispatch via multi-channel notification engine
        await notificationService.dispatchNotification(
          app.patientId,
          'APPOINTMENT_REMINDER_48H',
          reminderMsg,
          'Upcoming Hospital Appointment Reminder'
        );

        app.reminderSentAt = new Date().toISOString();
        app.updatedAt = new Date().toISOString();

        recordAuditLog({
          actorId: 'SYSTEM_SCHEDULER',
          actorType: 'AI_AGENT',
          action: 'DISPATCH_48H_APPOINTMENT_REMINDER',
          resourceType: 'Appointment',
          resourceId: app.id,
          metadata: {
            daysRemaining,
            dispatchedTo: patient?.fullName,
            channelPrimary: patient?.primaryNotificationChannel
          }
        });

        logger.info(`[Reminder Engine] 48h reminder dispatched for appointment ${app.id} (Patient: ${patient?.fullName}, Doctor: ${doctor?.name})`);

        dispatched.push({
          appointmentId: app.id,
          appointmentDate: app.appointmentDate,
          doctorId: app.doctorId,
          doctorName: doctor?.name || 'N/A',
          doctorSpecialization: doctor?.specialization || 'General',
          patientId: app.patientId,
          patientName: patient?.fullName || 'N/A',
          tokenNumber: token?.tokenNumber,
          daysRemaining,
          isUpcomingSoon: true,
          isFollowUp: Boolean(app.followUpDate),
          reminderSent: true,
          reminderSentAt: app.reminderSentAt
        });
      }
    }

    return {
      scannedCount: confirmedAppointments.length,
      dispatchedCount: dispatched.length,
      reminders: dispatched
    };
  }

  /**
   * Get active and upcoming reminders for a specific patient
   * Useful for live Chatbot and Patient Dashboard
   */
  async getUpcomingRemindersForPatient(patientId: string): Promise<UpcomingReminderItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = db.appointments.filter(
      a => a.patientId === patientId && (a.status === 'CONFIRMED' || a.status === 'PENDING')
    );

    const items: UpcomingReminderItem[] = [];

    for (const app of appointments) {
      const appDate = new Date(app.appointmentDate);
      appDate.setHours(0, 0, 0, 0);

      const diffTime = appDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Include future appointments up to 21 days
      if (daysRemaining >= 0 && daysRemaining <= 21) {
        const patient = db.patients.find(p => p.id === app.patientId);
        const doctor = db.doctors.find(d => d.id === app.doctorId);
        const token = app.tokenId ? db.dailyTokens.find(t => t.id === app.tokenId) : null;

        items.push({
          appointmentId: app.id,
          appointmentDate: app.appointmentDate,
          doctorId: app.doctorId,
          doctorName: doctor?.name || 'Specialist Physician',
          doctorSpecialization: doctor?.specialization || 'Clinical Medicine',
          patientId: app.patientId,
          patientName: patient?.fullName || 'Patient',
          tokenNumber: token?.tokenNumber,
          daysRemaining,
          isUpcomingSoon: daysRemaining <= 2,
          isFollowUp: Boolean(app.followUpDate),
          reminderSent: Boolean(app.reminderSentAt),
          reminderSentAt: app.reminderSentAt
        });
      }
    }

    // Sort by soonest appointment first
    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }
}

export const appointmentReminderService = new AppointmentReminderService();
