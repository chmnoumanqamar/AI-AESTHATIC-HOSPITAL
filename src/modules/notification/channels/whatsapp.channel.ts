import { logger } from '../../../common/utils/logger';
import { db } from '../../../common/data/mock-db';

export interface ChannelResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppChannel {
  async send(recipientPhone: string, message: string): Promise<ChannelResponse> {
    logger.info(`[WhatsAppChannel] Dispatching message to ${recipientPhone}`);
    if (!recipientPhone || recipientPhone.includes('error')) {
      return { success: false, error: 'WhatsApp delivery failure: Phone unreachable' };
    }

    const settings = db.systemSettings;
    const token = settings?.metaAccessToken || process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId = settings?.metaPhoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID;

    // Clean phone number (strip whitespace, hyphens, and leading + for international E.164 without +)
    let cleanPhone = recipientPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('03')) {
      // Convert Pakistan local format 0300... to international 92300...
      cleanPhone = '92' + cleanPhone.slice(1);
    }

    // LIVE META WHATSAPP BUSINESS CLOUD API DISPATCH
    if (
      token &&
      phoneNumberId &&
      !token.includes('mock') &&
      token.length > 20 &&
      cleanPhone.length >= 10
    ) {
      try {
        const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
        logger.info(`[WhatsAppChannel] Sending via Meta Cloud API (${url}) to recipient: ${cleanPhone}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: message
            }
          })
        });

        const data = (await response.json()) as any;
        if (!response.ok) {
          logger.error(`[WhatsAppChannel] Meta API error status ${response.status}: ${JSON.stringify(data)}`);
          return {
            success: false,
            error: data?.error?.message || `Meta API delivery failure (${response.status})`
          };
        }

        const messageId = data?.messages?.[0]?.id || `wa-meta-${Date.now()}`;
        logger.info(`[WhatsAppChannel] Successfully delivered via Meta Cloud API. Message ID: ${messageId}`);
        return {
          success: true,
          messageId
        };
      } catch (err: any) {
        logger.error(`[WhatsAppChannel] Network exception contacting Meta Cloud API: ${err.message}`);
        return {
          success: false,
          error: `Meta Cloud API network error: ${err.message}`
        };
      }
    }

    // Fallback simulation / Sandbox mode
    logger.info(`[WhatsAppChannel] Dispatched via Hospital WhatsApp Gateway (Simulated / Local) to ${cleanPhone}`);
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
