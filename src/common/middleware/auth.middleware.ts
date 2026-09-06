import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env.config';
import { AppError } from '../errors/AppError';

export interface JwtAuthPayload {
  userId: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'AI_AGENT';
  email?: string;
  phone: string;
  profileId?: string; // patientId, doctorId, or receptionistId
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtAuthPayload;
    }
  }
}

import { db } from '../data/mock-db';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Bearer token required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtAuthPayload;

    // Invariant: If user account has been blocked by Administrator, revoke access immediately
    const user = db.users.find(u => u.id === decoded.userId);
    if (user && user.isBlocked) {
      throw AppError.forbidden(`Your access has been suspended by the Administrator. Reason: ${user.blockedReason || 'Administrative security lock'}`);
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Invalid or expired authentication token');
  }
};
