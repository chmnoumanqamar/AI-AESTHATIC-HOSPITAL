import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { ReportsQuerySchema } from './reports.dto';

export class ReportsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ReportsQuerySchema.parse(req.query);
      const data = await reportsService.getAnalytics(
        parsed.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
        parsed.doctorId
      );

      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
