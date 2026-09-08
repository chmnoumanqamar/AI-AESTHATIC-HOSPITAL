import { Request, Response, NextFunction } from 'express';
import { aiAgentOrchestrator } from './ai.orchestrator';
import { AppError } from '../../common/errors/AppError';
import { db } from '../../common/data/mock-db';

export class AiController {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, history = [], sessionId } = req.body;
      if (!message || typeof message !== 'string') {
        throw AppError.badRequest('message string is required');
      }

      const activeSessionId = sessionId || req.user?.userId || req.ip || 'default-session';
      const activeUser = req.user?.userId ? db.users.find(u => u.id === req.user?.userId) : null;
      const userRole = req.user?.role || activeUser?.role || 'PATIENT';

      let resolvedDoctorId = userRole === 'DOCTOR' ? req.user?.profileId : undefined;
      if (!resolvedDoctorId && userRole === 'DOCTOR' && req.user?.userId) {
        const d = db.doctors.find(doc => doc.userId === req.user?.userId);
        if (d) resolvedDoctorId = d.id;
      }

      const context = {
        userId: req.user?.userId || 'GUEST',
        doctorId: resolvedDoctorId,
        patientId: userRole === 'PATIENT' ? (req.user?.profileId || undefined) : undefined,
        userRole,
        userName: activeUser?.name || activeUser?.username || (userRole === 'DOCTOR' ? 'Doctor' : 'Staff Member'),
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
