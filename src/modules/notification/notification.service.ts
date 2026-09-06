import { v4 as uuidv4 } from 'uuid';
import { db, DbNotificationLog } from '../../common/data/mock-db';
import { WhatsAppChannel, SmsChannel, EmailChannel } from './channels/whatsapp.channel';
import { logger } from '../../common/utils/logger';

export class NotificationService {
  private whatsapp = new WhatsAppChannel();
  private sms = new SmsChannel();
  private email = new EmailChannel();

  /**
   * NOTIFICATION FAILOVER PIPELINE (Part 7):
   * 1. Dispatch event trigger (Booking Confirmed, Reminder, Status Change).
   * 2. Attempt dispatch to Primary Channel.
   * 3. If Primary fails or times out: Immediately route message payload to Backup Channel.
   * 4. Record log entry in NotificationLog table: recipient_id, channels_attempted, final_status, error_trace.
   */
  async dispatchNotification(
    recipientId: string,
    eventType: string,
    message: string,
    subject: string = 'Hospital Notification'
  ) {
    const patient = db.patients.find(p => p.id === recipientId);
    const user = patient ? db.users.find(u => u.id === patient.userId) : null;

    const primaryChannel = patient?.primaryNotificationChannel || 'SMS';
    const backupChannel = patient?.backupNotificationChannel || (primaryChannel === 'SMS' ? 'Email' : 'SMS');

    const phone = user?.phone || '+15550000000';
    const recipientEmail = user?.email || 'patient@example.com';

    const channelsAttempted: string[] = [];
    let finalStatus = 'FAILED';
    let errorTrace: string | undefined;

    // Step 1: Attempt Primary Channel
    channelsAttempted.push(primaryChannel);
    let primarySuccess = false;

    try {
      if (primaryChannel === 'WhatsApp') {
        const res = await this.whatsapp.send(phone, message);
        primarySuccess = res.success;
        if (!res.success) errorTrace = res.error;
      } else if (primaryChannel === 'SMS') {
        const res = await this.sms.send(phone, message);
        primarySuccess = res.success;
        if (!res.success) errorTrace = res.error;
      } else if (primaryChannel === 'Email') {
        const res = await this.email.send(recipientEmail, subject, message);
        primarySuccess = res.success;
        if (!res.success) errorTrace = res.error;
      }
    } catch (err: any) {
      errorTrace = err.message || 'Primary channel exception';
    }

    if (primarySuccess) {
      finalStatus = 'DELIVERED_PRIMARY';
    } else if (backupChannel) {
      // Step 2: Failover to Backup Channel
      logger.warn(
        `[NotificationFailover] Primary [${primaryChannel}] failed for patient ${recipientId}. Initiating failover to [${backupChannel}].`
      );
      channelsAttempted.push(backupChannel);
      let backupSuccess = false;

      try {
        if (backupChannel === 'WhatsApp') {
          const res = await this.whatsapp.send(phone, message);
          backupSuccess = res.success;
        } else if (backupChannel === 'SMS') {
          const res = await this.sms.send(phone, message);
          backupSuccess = res.success;
        } else if (backupChannel === 'Email') {
          const res = await this.email.send(recipientEmail, subject, message);
          backupSuccess = res.success;
        }
      } catch (err: any) {
        errorTrace += ` | Backup exception: ${err.message}`;
      }

      finalStatus = backupSuccess ? 'DELIVERED_BACKUP_FAILOVER' : 'FAILED_ALL_CHANNELS';
    }

    // Step 3: Record Immutable Notification Log
    const logEntry: DbNotificationLog = {
      id: uuidv4(),
      recipientId,
      eventType,
      primaryChannel,
      backupChannel,
      channelsAttempted,
      finalStatus,
      errorTrace,
      payload: { message, subject },
      createdAt: new Date().toISOString()
    };
    db.notificationLogs.unshift(logEntry);

    return logEntry;
  }

  async getLogs(recipientId?: string) {
    if (recipientId) {
      return db.notificationLogs.filter(l => l.recipientId === recipientId);
    }
    return db.notificationLogs;
  }
}

export const notificationService = new NotificationService();
