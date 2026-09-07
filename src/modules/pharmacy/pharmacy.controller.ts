import { Request, Response, NextFunction } from 'express';
import { pharmacyService } from './pharmacy.service';

export class PharmacyController {
  async getDispenseQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const queue = await pharmacyService.getDispenseQueue();
      res.json({
        status: 'SUCCESS',
        data: queue
      });
    } catch (err) {
      next(err);
    }
  }

  async dispensePrescription(req: Request, res: Response, next: NextFunction) {
    try {
      const { dispenseRecordId, prescriptionId, notes, pharmacistNotes, paymentMethod } = req.body;
      const pharmacistId = req.user?.userId || 'u-pharma-01';
      const pharmacistName = req.user?.phone || 'Tariq Mehmood, RPh';

      const result = await pharmacyService.dispensePrescription({
        dispenseRecordId: dispenseRecordId || prescriptionId,
        prescriptionId,
        pharmacistId,
        pharmacistName,
        notes: notes || pharmacistNotes,
        paymentMethod
      });

      res.json({
        status: 'SUCCESS',
        message: 'Prescription successfully fulfilled and stock deducted',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, category, lowStockOnly } = req.query;
      const inventory = await pharmacyService.getInventory({
        query: query as string,
        category: category as string,
        lowStockOnly: lowStockOnly === 'true'
      });

      res.json({
        status: 'SUCCESS',
        data: inventory
      });
    } catch (err) {
      next(err);
    }
  }

  async saveMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const item = req.body;
      const saved = await pharmacyService.saveMedicine(item);
      res.json({
        status: 'SUCCESS',
        message: 'Medicine inventory saved successfully',
        data: saved
      });
    } catch (err) {
      next(err);
    }
  }

  async processPosSale(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacistName = req.user?.phone || 'Tariq Mehmood, RPh';
      const result = await pharmacyService.processPosSale({
        ...req.body,
        processedBy: pharmacistName
      });

      res.json({
        status: 'SUCCESS',
        message: 'OTC Point-of-Sale transaction completed',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async checkDrugSafety(req: Request, res: Response, next: NextFunction) {
    try {
      const { medications, drugNames, patientAllergies } = req.body;
      const drugs = medications || drugNames || [];
      const result = await pharmacyService.checkDrugSafety(drugs, patientAllergies || []);
      res.json({
        status: 'SUCCESS',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getProcurementOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await pharmacyService.getProcurementOrders();
      res.json({
        status: 'SUCCESS',
        data: orders
      });
    } catch (err) {
      next(err);
    }
  }

  async receiveProcurementOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const order = await pharmacyService.receiveProcurementOrder(orderId);
      res.json({
        status: 'SUCCESS',
        message: 'Procurement shipment verified and stock updated',
        data: order
      });
    } catch (err) {
      next(err);
    }
  }
}

export const pharmacyController = new PharmacyController();
