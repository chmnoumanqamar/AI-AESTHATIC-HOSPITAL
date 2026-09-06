import { Router, Request, Response } from 'express';
import { whatsappBotService } from './whatsapp-bot.service';
import { logger } from '../../common/utils/logger';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

/**
 * META WEBHOOK VERIFICATION (GET)
 * Meta calls this when you configure the Callback URL in the App Dashboard:
 * /api/ai/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const verifiedChallenge = whatsappBotService.verifyWebhook(mode, token, challenge);
  if (verifiedChallenge) {
    return res.status(200).send(verifiedChallenge);
  }
  return res.status(403).send('Forbidden: Token mismatch or invalid mode');
});

/**
 * META WEBHOOK INBOUND MESSAGES (POST)
 * Meta pushes patient messages here in real-time.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Meta expects an immediate 200 OK acknowledgment within 3 seconds
    res.status(200).json({ status: 'EVENT_RECEIVED' });

    // Process asynchronously so we never timeout Meta's webhook deadline
    await whatsappBotService.handleInboundMetaMessage(req.body);
  } catch (err: any) {
    logger.error(`[WhatsAppRoute] Error handling inbound message: ${err.message}`);
  }
});

/**
 * IN-BROWSER WHATSAPP SIMULATOR (POST)
 * Allows Admin, Receptionist, or testing patients to chat live via the WhatsApp preview UI.
 */
router.post('/simulator', async (req: Request, res: Response) => {
  try {
    const { senderPhone, senderName, messageText } = req.body;
    if (!senderPhone || !messageText) {
      return res.status(400).json({
        success: false,
        error: { message: 'senderPhone and messageText are required.' }
      });
    }

    const result = await whatsappBotService.handleSimulatorMessage({
      senderPhone,
      senderName,
      messageText
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    logger.error(`[WhatsAppSimulator] Error: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Failed to process simulated WhatsApp message' }
    });
  }
});

/**
 * ADMIN CONFIGURATION: GET
 */
router.get('/config', (req: Request, res: Response) => {
  const config = whatsappBotService.getConfig();
  return res.json({
    success: true,
    data: config
  });
});

/**
 * ADMIN CONFIGURATION: UPDATE (PATCH)
 */
router.patch('/config', authMiddleware, requireRoles('ADMIN'), (req: Request, res: Response) => {
  try {
    const updated = whatsappBotService.updateConfig(req.body);
    return res.json({
      success: true,
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { message: err.message || 'Failed to update WhatsApp configuration' }
    });
  }
});

export default router;
