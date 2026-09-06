import { z } from 'zod';

export const loginDto = z.object({
  identifier: z.string().min(3, 'Phone number or email required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerPatientDto = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PATIENT', 'DOCTOR', 'RECEPTIONIST']).default('PATIENT').optional(),
  specialization: z.string().optional(),
  cnic: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).default('Male').optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  hasWhatsApp: z.boolean().default(false).optional(),
  primaryNotificationChannel: z.enum(['WhatsApp', 'SMS', 'Email']).default('SMS').optional(),
  backupNotificationChannel: z.enum(['WhatsApp', 'SMS', 'Email']).optional()
});

export const requestPasswordResetOtpDto = z.object({
  identifier: z.string().min(3, 'Username or email required')
});

export const resetPasswordDto = z.object({
  identifier: z.string().min(3, 'Username or email required'),
  otp: z.string().min(4, 'Verification code is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
});

export type LoginInput = z.infer<typeof loginDto>;
export type RegisterPatientInput = z.infer<typeof registerPatientDto>;
export type RequestPasswordResetOtpInput = z.infer<typeof requestPasswordResetOtpDto>;
export type ResetPasswordInput = z.infer<typeof resetPasswordDto>;
