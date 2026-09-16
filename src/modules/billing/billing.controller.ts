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
        doctorId,
        doctorName,
        dealId,
        dealName,
        sessionsAllowed,
        items,
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
          doctorId,
          doctorName,
          dealId,
          dealName,
          sessionsAllowed: sessionsAllowed !== undefined ? Number(sessionsAllowed) : undefined,
          items,
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

  async consumePackageSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { remarks, doctorName } = req.body;
      const result = await billingService.consumePackageSession(
        req.params.id,
        remarks,
        doctorName,
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'RECEPTIONIST'
      );
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId, refundAmount, reason, refundMethod, itemsReturned } = req.body;
      if (!paymentId || refundAmount === undefined || !reason) {
        throw AppError.badRequest('paymentId, refundAmount, and reason are required');
      }
      const result = await billingService.processRefund({
        paymentId,
        refundAmount: Number(refundAmount),
        reason,
        refundMethod,
        itemsReturned,
        actorId: req.user?.userId || 'SYSTEM',
        actorRole: req.user?.role || 'RECEPTIONIST'
      });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getSalesReturns(req: Request, res: Response, next: NextFunction) {
    try {
      const returns = await billingService.getSalesReturns();
      res.json({
        success: true,
        data: returns
      });
    } catch (err) {
      next(err);
    }
  }

  async topUpWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { patientId, amount, paymentMethod } = req.body;
      if (!patientId || !amount) {
        throw AppError.badRequest('patientId and amount are required');
      }
      const result = await billingService.topUpWallet({
        patientId,
        amount: Number(amount),
        paymentMethod,
        actorId: req.user?.userId || 'SYSTEM',
        actorRole: req.user?.role || 'RECEPTIONIST'
      });
      res.status(201).json({
        success: true,
        data: result
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

  async collectDuePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const { amountPaidNow, paymentMethod, notes } = req.body;
      const result = await billingService.collectDuePayment(
        paymentId,
        {
          amountPaidNow: Number(amountPaidNow),
          paymentMethod,
          notes
        },
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'RECEPTIONIST'
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

export const billingController = new BillingController();
