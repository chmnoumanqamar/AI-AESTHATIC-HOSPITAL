import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { loginDto, registerPatientDto, resetPasswordDto, requestPasswordResetOtpDto } from './auth.dto';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginDto.parse(req.body);
      const result = await authService.login(validated);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async registerPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerPatientDto.parse(req.body);
      const result = await authService.registerPatient(validated);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: req.user
      });
    } catch (err) {
      next(err);
    }
  }

  async requestPasswordResetOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = requestPasswordResetOtpDto.parse(req.body);
      const result = await authService.requestPasswordResetOtp(validated);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = resetPasswordDto.parse(req.body);
      const result = await authService.resetPassword(validated);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
