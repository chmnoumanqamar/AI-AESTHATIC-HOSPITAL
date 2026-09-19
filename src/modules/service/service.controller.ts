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

  // --- Deals & Packages ---
  async getDeals(req: Request, res: Response, next: NextFunction) {
    try {
      const deals = await clinicalServiceCatalog.getAllDeals();
      res.json({ success: true, data: deals });
    } catch (err) {
      next(err);
    }
  }

  async createDeal(req: Request, res: Response, next: NextFunction) {
    try {
      const deal = await clinicalServiceCatalog.createDeal(req.body);
      res.status(201).json({ success: true, data: deal });
    } catch (err) {
      next(err);
    }
  }

  async deleteDeal(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await clinicalServiceCatalog.deleteDeal(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // --- Skincare Retail Products ---
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await clinicalServiceCatalog.getAllProducts();
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await clinicalServiceCatalog.createProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async updateProductStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { delta } = req.body;
      const product = await clinicalServiceCatalog.updateProductStock(req.params.id, Number(delta) || 0);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  // --- Aesthetic Categories ---
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await clinicalServiceCatalog.getCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await clinicalServiceCatalog.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }
}

export const serviceController = new ServiceController();
