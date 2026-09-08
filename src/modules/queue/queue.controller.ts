import { Request, Response, NextFunction } from 'express';
import { queueService } from './queue.service';
import { AppError } from '../../common/errors/AppError';

export class QueueController {
  async getLiveQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = (req.query.doctorId as string) || (req.user?.role === 'DOCTOR' ? req.user.profileId : undefined);
      const date = req.query.date as string;
      const list = await queueService.getLiveQueue(doctorId, date, req.user);
      res.json({
        success: true,
        data: list
      });
    } catch (err) {
      next(err);
    }
  }

  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.body;
      if (!appointmentId) {
        throw AppError.badRequest('appointmentId is required for check-in');
      }
      const queue = await queueService.checkInPatient(
        appointmentId,
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'RECEPTIONIST'
      );
      res.json({
        success: true,
        data: queue
      });
    } catch (err) {
      next(err);
    }
  }

  async callNext(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user?.profileId || (req.body.doctorId as string);
      if (!doctorId) {
        throw AppError.badRequest('doctorId is required to call next patient');
      }
      const result = await queueService.callNextPatient(
        doctorId,
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'DOCTOR'
      );
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async startConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.params;
      const result = await queueService.startConsultation(
        appointmentId,
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'DOCTOR'
      );
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async completeConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.params;
      const result = await queueService.completeConsultation(
        appointmentId,
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'DOCTOR'
      );
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const queueController = new QueueController();
