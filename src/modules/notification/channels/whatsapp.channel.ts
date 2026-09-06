import { logger } from '../../../common/utils/logger';

export interface ChannelResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppChannel {
  async send(recipientPhone: string, message: string): Promise<ChannelResponse> {
    logger.info(`[WhatsAppChannel] Dispatching message to ${recipientPhone}`);
    // Simulate provider network request
    if (!recipientPhone || recipientPhone.includes('error')) {
      return { success: false, error: 'WhatsApp delivery failure: Phone unreachable' };
    }
    return {
      success: true,
      messageId: `wa-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
  }
}

export class SmsChannel {
  async send(recipientPhone: string, message: string): Promise<ChannelResponse> {
    logger.info(`[SmsChannel] Dispatching SMS to ${recipientPhone}`);
    if (!recipientPhone) {
      return { success: false, error: 'SMS delivery failure: Invalid phone' };
    }
    return {
      success: true,
      messageId: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
  }
}

export class EmailChannel {
  async send(recipientEmail: string, subject: string, body: string): Promise<ChannelResponse> {
    logger.info(`[EmailChannel] Dispatching Email to ${recipientEmail}`);
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return { success: false, error: 'Email delivery failure: Invalid address' };
    }
    return {
      success: true,
      messageId: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
  }
}
