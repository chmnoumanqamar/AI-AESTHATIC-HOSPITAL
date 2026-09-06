import { Request, Response, NextFunction } from 'express';
import { clinicalServiceCatalog } from './service.service';

export class ServiceController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.query.doctorId as string;
      if (doctorId) {
        const services = await clinicalServiceCatalog.getServicesByDoctor(doctorId);
        res.json({ success: true, data: services });
        return;
      }
      const services = await clinicalServiceCatalog.getAllServices();
      res.json({ success: true, data: services });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await clinicalServiceCatalog.getServiceById(req.params.id);
      res.json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  }
}

export const serviceController = new ServiceController();
