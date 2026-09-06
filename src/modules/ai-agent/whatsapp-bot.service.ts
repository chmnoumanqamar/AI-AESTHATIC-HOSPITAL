import { logger } from '../../common/utils/logger';
import { db } from '../../common/data/mock-db';
import { aiAgentOrchestrator } from './ai.orchestrator';
import { WhatsAppChannel } from '../notification/channels/whatsapp.channel';

export interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppBotService {
  private whatsappChannel = new WhatsAppChannel();

  /**
   * Meta Webhook Verification Handshake (GET /api/ai/whatsapp-webhook)
   */
  verifyWebhook(mode?: string, token?: string, challenge?: string): string | null {
    const expectedToken = db.systemSettings.metaVerifyToken || process.env.META_WHATSAPP_VERIFY_TOKEN || 'hospital_wa_verify_token_2026';
    if (mode === 'subscribe' && token === expectedToken) {
      logger.info('[WhatsAppBot] Meta Webhook verified successfully.');
      return challenge || 'OK';
    }
    logger.warn(`[WhatsAppBot] Webhook verification failed. Token mismatch or invalid mode: ${mode}`);
    return null;
  }

  /**
   * Process incoming Meta WhatsApp message (POST /api/ai/whatsapp-webhook)
   */
  async handleInboundMetaMessage(payload: MetaWebhookPayload) {
    if (payload.object !== 'whatsapp_business_account') {
      return { status: 'IGNORED_NOT_WHATSAPP' };
    }

    const changes = payload.entry?.[0]?.changes?.[0]?.value;
    if (!changes || !changes.messages || changes.messages.length === 0) {
      // Could be status update (sent, delivered, read)
      return { status: 'STATUS_UPDATE_ACK' };
    }

    const msg = changes.messages[0];
    const senderPhone = msg.from;
    const profileName = changes.contacts?.[0]?.profile?.name || 'Valued Patient';
    const messageText = msg.text?.body || '';

    if (!messageText.trim()) {
      return { status: 'EMPTY_MESSAGE_IGNORED' };
    }

    // Check if WhatsApp Bot is turned ON by Main Admin
    if (!db.systemSettings.whatsappBotEnabled) {
      const pausedNotice =
        `🏥 *Aesthetic Hospital Assistant*\n\n` +
        `Moazziz *${profileName}*,\n` +
        `Hospital ka WhatsApp appointment system filhal maintenance par hai.\n\n` +
        `Baraye meharbani hamaray reception counter ya helpline (${db.systemSettings.hospitalWhatsAppNumber}) par rabta karein. Shukriya!`;
      
      await this.whatsappChannel.send(senderPhone, pausedNotice);
      return { status: 'BOT_PAUSED_NOTICE_SENT' };
    }

    logger.info(`[WhatsAppBot] Incoming message from ${profileName} (${senderPhone}): "${messageText}"`);

    // Format Session Context
    const sessionId = `wa_${senderPhone}`;
    const context = {
      sessionId,
      userRole: 'PATIENT',
      userId: `wa_user_${senderPhone}`,
      channel: 'WHATSAPP' as const,
      senderPhone,
      senderName: profileName
    };

    // Route through AI Orchestrator
    const aiResponse = await aiAgentOrchestrator.processMessage(
      messageText,
      [],
      context
    );

    // Send WhatsApp Response back to patient
    if (aiResponse && aiResponse.content) {
      await this.whatsappChannel.send(senderPhone, aiResponse.content);
    }

    return {
      status: 'PROCESSED',
      recipient: senderPhone,
      replySent: !!aiResponse.content
    };
  }

  /**
   * Fast-path Simulator message dispatcher for in-browser testing
   */
  async handleSimulatorMessage(input: {
    senderPhone: string;
    senderName?: string;
    messageText: string;
  }) {
    const { senderPhone, senderName = 'Guest Patient', messageText } = input;

    if (!db.systemSettings.whatsappBotEnabled) {
      return {
        reply:
          `🏥 *Aesthetic Hospital Assistant*\n\n` +
          `Moazziz *${senderName}*,\n` +
          `Hospital ka WhatsApp appointment system filhal Admin ki taraf se PAUSED hai.\n\n` +
          `Baraye meharbani Admin Console se WhatsApp Bot enable karein.`,
        isBotPaused: true
      };
    }

    const sessionId = `wa_sim_${senderPhone.replace(/\D/g, '')}`;
    const context = {
      sessionId,
      userRole: 'PATIENT',
      userId: `wa_sim_${senderPhone}`,
      channel: 'WHATSAPP' as const,
      senderPhone,
      senderName
    };

    const aiResponse = await aiAgentOrchestrator.processMessage(
      messageText,
      [],
      context
    );

    return {
      reply: aiResponse.content,
      cardData: aiResponse.cardData,
      senderPhone,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  /**
   * Admin Config Getters & Setters
   */
  getConfig() {
    return {
      ...db.systemSettings,
      metaAccessTokenConfigured: !!(db.systemSettings.metaAccessToken && db.systemSettings.metaAccessToken.length > 20)
    };
  }

  updateConfig(updates: Partial<typeof db.systemSettings>) {
    db.systemSettings = {
      ...db.systemSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    logger.info('[WhatsAppBot] System WhatsApp configuration updated by Admin.');
    return this.getConfig();
  }
}

export const whatsappBotService = new WhatsAppBotService();
