import { z } from 'zod';

export const createBookingDto = z.object({
  patientId: z.string().optional(), // Inferred from JWT if patient
  doctorId: z.string(),
  serviceId: z.string().optional(),
  appointmentDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Valid date required'),
  bookingSource: z.enum(['PORTAL', 'AI_AGENT', 'RECEPTIONIST', 'CALL', 'WHATSAPP_BOT', 'WEB_BOT']).default('PORTAL'),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional()
});

export const updateAppointmentStatusDto = z.object({
  status: z.enum(['CONFIRMED', 'DECLINED', 'CANCELLED']),
  reason: z.string().optional()
});

export const rescheduleAppointmentDto = z.object({
  appointmentId: z.string(),
  newDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Valid new date required'),
  reason: z.string().optional()
});

export type CreateBookingInput = z.infer<typeof createBookingDto>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusDto>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentDto>;
