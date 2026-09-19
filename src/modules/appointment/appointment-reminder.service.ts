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
  hoursRemaining: number;
  countdownTier?: '24H' | '12H' | '6H' | '3H' | '1H' | 'TODAY' | 'UPCOMING';
  countdownLabel: string;
  isUpcomingSoon: boolean; // <= 2 days (48 hours)
  isFollowUp: boolean;
  reminderSent: boolean;
  reminderSentAt?: string;
  dispatchedTiers: string[];
}

export class AppointmentReminderService {
  /**
   * Progressive 5-Tier Countdown Engine:
   * 24h -> 12h -> 6h -> 3h -> 1h
   * Adaptive logic: if booked closer to time, automatically enters closest stage
   */
  calculateCountdownInfo(appointmentDateStr: string, tokenNumber: number = 1): {
    hoursRemaining: number;
    daysRemaining: number;
    tier: '24H' | '12H' | '6H' | '3H' | '1H' | 'TODAY' | 'UPCOMING';
    label: string;
    stageMessage: string;
  } {
    const now = new Date();
    // Default clinic slot start is calculated around 09:00 AM + (tokenNumber * 15 mins)
    const [year, month, day] = appointmentDateStr.split('-').map(Number);
    const appDateTime = new Date(year, month - 1, day, 9, 0, 0, 0);
    // Adjust slot based on token number (each patient ~15 mins)
    appDateTime.setMinutes(appDateTime.getMinutes() + Math.max(0, (tokenNumber - 1) * 15));

    const diffMs = appDateTime.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours <= 1 && diffHours >= 0) {
      return {
        hoursRemaining: Math.max(1, diffHours),
        daysRemaining: 0,
        tier: '1H',
        label: 'Immediate Arrival: In ~1 Hour',
        stageMessage: 'Your slot starts in ~1 hour! Please arrive at reception desk for token check-in.'
      };
    }

    if (diffHours <= 3 && diffHours > 1) {
      return {
        hoursRemaining: diffHours,
        daysRemaining: 0,
        tier: '3H',
        label: `In ${diffHours} Hours (Pre-Departure)`,
        stageMessage: `Your appointment is in ${diffHours} hours! Please plan your commute to arrive 15 mins early.`
      };
    }

    if (diffHours <= 6 && diffHours > 3) {
      return {
        hoursRemaining: diffHours,
        daysRemaining: 0,
        tier: '6H',
        label: `In ${diffHours} Hours (Clinic On-Schedule)`,
        stageMessage: `Doctor clinic is on schedule. Your appointment is in ${diffHours} hours.`
      };
    }

    if (diffHours <= 12 && diffHours > 6) {
      return {
        hoursRemaining: diffHours,
        daysRemaining: 0,
        tier: '12H',
        label: `In ${diffHours} Hours (Preparation)`,
        stageMessage: `Appointment in ${diffHours} hours. Remember to bring prior medical records and lab reports.`
      };
    }

    if (diffHours <= 24 && diffHours > 12) {
      return {
        hoursRemaining: diffHours,
        daysRemaining: 1,
        tier: '24H',
        label: 'Tomorrow (In ~24 Hours)',
        stageMessage: 'Your consultation is tomorrow. Please confirm attendance or reschedule if needed.'
      };
    }

    if (diffDays <= 0) {
      return {
        hoursRemaining: Math.max(0, diffHours),
        daysRemaining: 0,
        tier: 'TODAY',
        label: 'Today',
        stageMessage: 'Your consultation is scheduled for today.'
      };
    }

    return {
      hoursRemaining: diffHours,
      daysRemaining: diffDays,
      tier: 'UPCOMING',
      label: `In ${diffDays} days`,
      stageMessage: `Appointment scheduled in ${diffDays} days.`
    };
  }

  /**
   * Scan all confirmed appointments and dispatch progressive countdown alerts
   * (24h -> 12h -> 6h -> 3h -> 1h) without duplicate nagging
   */
  async scanAndDispatchUpcomingReminders(daysAhead: number = 2) {
    const confirmedAppointments = db.appointments.filter(a => a.status === 'CONFIRMED');
    const dispatched: UpcomingReminderItem[] = [];

    for (const app of confirmedAppointments) {
      const patient = db.patients.find(p => p.id === app.patientId);
      const doctor = db.doctors.find(d => d.id === app.doctorId);
      const token = app.tokenId ? db.dailyTokens.find(t => t.id === app.tokenId) : null;
      const tokenNum = token?.tokenNumber || 1;

      const countdown = this.calculateCountdownInfo(app.appointmentDate, tokenNum);
      const dispatchedTiers = app.dispatchedReminderTiers || [];

      // Determine if a tier is due and not yet sent
      let shouldDispatch = false;
      let targetTier: '24H' | '12H' | '6H' | '3H' | '1H' | null = null;

      if (countdown.tier === '1H' && !dispatchedTiers.includes('1H')) {
        shouldDispatch = true;
        targetTier = '1H';
      } else if (countdown.tier === '3H' && !dispatchedTiers.includes('3H')) {
        shouldDispatch = true;
        targetTier = '3H';
      } else if (countdown.tier === '6H' && !dispatchedTiers.includes('6H')) {
        shouldDispatch = true;
        targetTier = '6H';
      } else if (countdown.tier === '12H' && !dispatchedTiers.includes('12H')) {
        shouldDispatch = true;
        targetTier = '12H';
      } else if (countdown.tier === '24H' && !dispatchedTiers.includes('24H')) {
        shouldDispatch = true;
        targetTier = '24H';
      } else if (countdown.daysRemaining <= daysAhead && !dispatchedTiers.includes('24H') && !app.reminderSentAt) {
        shouldDispatch = true;
        targetTier = '24H';
      }

      if (shouldDispatch && targetTier) {
        const reminderMsg = `🔔 [${targetTier} Reminder] Hello ${patient?.fullName || 'Patient'}, your appointment with ${doctor?.name || 'Doctor'} (${doctor?.specialization || 'Specialist'}) is scheduled for ${app.appointmentDate} (Token #${tokenNum}). ${countdown.stageMessage}`;

        await notificationService.dispatchNotification(
          app.patientId,
          `APPOINTMENT_REMINDER_${targetTier}`,
          reminderMsg,
          `Hospital Appointment Reminder (${targetTier})`
        );

        app.dispatchedReminderTiers = [...dispatchedTiers, targetTier];
        app.reminderSentAt = new Date().toISOString();
        app.updatedAt = new Date().toISOString();
        db.saveToDisk();

        recordAuditLog({
          actorId: 'SYSTEM_COUNTDOWN_SCHEDULER',
          actorType: 'AI_AGENT',
          action: `DISPATCH_${targetTier}_REMINDER`,
          resourceType: 'Appointment',
          resourceId: app.id,
          metadata: {
            tier: targetTier,
            hoursRemaining: countdown.hoursRemaining,
            patientName: patient?.fullName,
            doctorName: doctor?.name
          }
        });

        logger.info(`[CountdownReminderEngine] Dispatched ${targetTier} reminder for appointment ${app.id} (${patient?.fullName})`);

        dispatched.push({
          appointmentId: app.id,
          appointmentDate: app.appointmentDate,
          doctorId: app.doctorId,
          doctorName: doctor?.name || 'Specialist Doctor',
          doctorSpecialization: doctor?.specialization || 'Clinical Medicine',
          patientId: app.patientId,
          patientName: patient?.fullName || 'Patient',
          tokenNumber: tokenNum,
          daysRemaining: countdown.daysRemaining,
          hoursRemaining: countdown.hoursRemaining,
          countdownTier: countdown.tier,
          countdownLabel: countdown.label,
          isUpcomingSoon: countdown.daysRemaining <= 2,
          isFollowUp: Boolean(app.followUpDate),
          reminderSent: true,
          reminderSentAt: app.reminderSentAt,
          dispatchedTiers: app.dispatchedReminderTiers
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
   * Get countdown reminders for a specific patient (for chat banner and dashboard)
   */
  async getUpcomingRemindersForPatient(patientId: string): Promise<UpcomingReminderItem[]> {
    const appointments = db.appointments.filter(
      a => a.patientId === patientId && (a.status === 'CONFIRMED' || a.status === 'PENDING')
    );

    const items: UpcomingReminderItem[] = [];

    for (const app of appointments) {
      const patient = db.patients.find(p => p.id === app.patientId);
      const doctor = db.doctors.find(d => d.id === app.doctorId);
      const token = app.tokenId ? db.dailyTokens.find(t => t.id === app.tokenId) : null;
      const tokenNum = token?.tokenNumber || 1;

      const countdown = this.calculateCountdownInfo(app.appointmentDate, tokenNum);

      if (countdown.daysRemaining >= 0 && countdown.daysRemaining <= 21) {
        items.push({
          appointmentId: app.id,
          appointmentDate: app.appointmentDate,
          doctorId: app.doctorId,
          doctorName: doctor?.name || 'Specialist Physician',
          doctorSpecialization: doctor?.specialization || 'Clinical Medicine',
          patientId: app.patientId,
          patientName: patient?.fullName || 'Patient',
          tokenNumber: tokenNum,
          daysRemaining: countdown.daysRemaining,
          hoursRemaining: countdown.hoursRemaining,
          countdownTier: countdown.tier,
          countdownLabel: countdown.label,
          isUpcomingSoon: countdown.daysRemaining <= 2,
          isFollowUp: Boolean(app.followUpDate),
          reminderSent: Boolean(app.reminderSentAt),
          reminderSentAt: app.reminderSentAt,
          dispatchedTiers: app.dispatchedReminderTiers || []
        });
      }
    }

    return items.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
  }
}

export const appointmentReminderService = new AppointmentReminderService();
