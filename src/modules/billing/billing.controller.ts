import { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service';
import { AppError } from '../../common/errors/AppError';

export class BillingController {
  async getMySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = req.user?.profileId;
      if (!patientId) {
        throw AppError.unauthorized('Patient profile required');
      }
      const summary = await billingService.getPatientBillingSummary(patientId);
      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }

  async getPatientSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await billingService.getPatientBillingSummary(req.params.patientId);
      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        patientId,
        appointmentId,
        amount,
        totalAmount,
        discount,
        paymentMethod,
        category,
        paymentPlan,
        notes
      } = req.body;

      if (!patientId || amount === undefined) {
        throw AppError.badRequest('patientId and amount are required');
      }

      const payment = await billingService.recordPayment(
        {
          patientId,
          appointmentId,
          amount: parseFloat(amount),
          totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
          discount: discount !== undefined ? parseFloat(discount) : undefined,
          paymentMethod,
          category,
          paymentPlan,
          notes
        },
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'RECEPTIONIST'
      );
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }

  async getHospitalLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const ledger = await billingService.getHospitalLedger();
      res.json({
        success: true,
        data: ledger
      });
    } catch (err) {
      next(err);
    }
  }
}

export const billingController = new BillingController();
