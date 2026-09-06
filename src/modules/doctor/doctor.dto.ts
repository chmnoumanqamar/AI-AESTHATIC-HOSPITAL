import { z } from 'zod';

export const updateDoctorProfileDto = z.object({
  specialization: z.string().optional(),
  biography: z.string().optional(),
  consultationFee: z.number().positive().optional(),
  followUpFee: z.number().positive().optional(),
  dailyPatientLimit: z.number().int().positive().max(1000).optional(),
  languages: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional()
});

export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileDto>;

export const updateDailyLimitDto = z.object({
  doctorId: z.string().optional(),
  dailyPatientLimit: z.number().int().min(1).max(1000)
});

export type UpdateDailyLimitInput = z.infer<typeof updateDailyLimitDto>;

