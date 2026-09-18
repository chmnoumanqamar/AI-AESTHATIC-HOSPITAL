import { Request, Response, NextFunction } from 'express';
import { appointmentService } from './appointment.service';
import { createBookingDto, updateAppointmentStatusDto, rescheduleAppointmentDto } from './appointment.dto';
import { AppError } from '../../common/errors/AppError';
import { db } from '../../common/data/mock-db';

export class AppointmentController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { doctorId, patientId, date, status } = req.query;
      let effectivePatientId = patientId as string | undefined;

      // Patients can only query their own appointments
      if (req.user?.role === 'PATIENT') {
        effectivePatientId = req.user.profileId;
      }

      const appointments = await appointmentService.getAllAppointments({
        doctorId: doctorId as string,
        patientId: effectivePatientId,
        date: date as string,
        status: status as string
      }, req.user);

      res.json({
        success: true,
        data: appointments
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentService.getAppointmentById(req.params.id);
      res.json({
        success: true,
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createBookingDto.parse(req.body);

      // Default patientId to logged in user if patient role and not explicitly specified (e.g. booking for family)
      // Default patientId to logged in user if patient role and not explicitly specified (e.g. booking for family)
      if (req.user?.role === 'PATIENT') {
        const perms = db.getPermissionsForRole('PATIENT');
        const rule = perms.find(p => p.moduleId === 'patient_booking');
        if (rule && !rule.write) {
          throw AppError.forbidden('Access Denied: Appointment booking is disabled for patients by Administrator.');
        }
        if (!validated.patientId) {
          validated.patientId = req.user.profileId;
        }
      }

      if (!validated.patientId) {
        throw AppError.badRequest('Patient ID is required');
      }

      const appointment = await appointmentService.createBooking(
        validated,
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'PORTAL'
      );

      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateAppointmentStatusDto.parse(req.body);

      // Enforce granular role permissions for approval & decline
      if (req.user?.role === 'RECEPTIONIST') {
        const perms = db.getPermissionsForRole('RECEPTIONIST');
        const rule = perms.find(p => p.moduleId === 'recep_approvals');
        if (validated.status === 'CONFIRMED' && rule && !rule.write) {
          throw AppError.forbidden('Access Denied: Appointment approval write permission is disabled by Administrator.');
        }
        if ((validated.status === 'DECLINED' || validated.status === 'CANCELLED') && rule && !rule.delete) {
          throw AppError.forbidden('Access Denied: Appointment decline/delete permission is disabled by Administrator.');
        }
      } else if (req.user?.role === 'PATIENT') {
        const perms = db.getPermissionsForRole('PATIENT');
        const rule = perms.find(p => p.moduleId === 'patient_booking');
        if (validated.status === 'CANCELLED' && rule && !rule.delete) {
          throw AppError.forbidden('Access Denied: Appointment cancellation is disabled for patients by Administrator.');
        }
      }

      const updated = await appointmentService.updateStatus(
        req.params.id,
        validated,
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'SYSTEM'
      );

      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role === 'PATIENT') {
        const perms = db.getPermissionsForRole('PATIENT');
        const rule = perms.find(p => p.moduleId === 'patient_booking');
        if (rule && !rule.write) {
          throw AppError.forbidden('Access Denied: Appointment reschedule write permission is disabled by Administrator.');
        }
      }

      const validated = rescheduleAppointmentDto.parse(req.body);
      const result = await appointmentService.rescheduleAppointment(
        validated,
        req.user?.userId || 'SYSTEM',
        req.user?.role || 'SYSTEM'
      );

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getUpcomingReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId || req.user?.profileId;
      if (!patientId) {
        throw AppError.badRequest('Patient ID is required');
      }

      const reminders = await (await import('./appointment-reminder.service')).appointmentReminderService.getUpcomingRemindersForPatient(patientId);
      res.json({
        success: true,
        data: reminders
      });
    } catch (err) {
      next(err);
    }
  }

  async triggerReminderCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await (await import('./appointment-reminder.service')).appointmentReminderService.scanAndDispatchUpcomingReminders();
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const appointmentController = new AppointmentController();
