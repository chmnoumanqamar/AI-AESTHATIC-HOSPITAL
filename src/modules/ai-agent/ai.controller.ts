import { Request, Response, NextFunction } from 'express';
import { aiAgentOrchestrator } from './ai.orchestrator';
import { AppError } from '../../common/errors/AppError';

export class AiController {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, history = [], sessionId } = req.body;
      if (!message || typeof message !== 'string') {
        throw AppError.badRequest('message string is required');
      }

      const activeSessionId = sessionId || req.user?.userId || req.ip || 'default-session';
      const context = {
        userId: req.user?.userId || 'GUEST',
        patientId: req.user?.profileId,
        userRole: req.user?.role || 'PATIENT',
        sessionId: activeSessionId
      };

      const response = await aiAgentOrchestrator.processMessage(message, history, context);

      res.json({
        success: true,
        data: response
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();
