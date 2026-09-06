import { z } from 'zod';

export const loginDto = z.object({
  identifier: z.string().min(3, 'Phone number or email required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerPatientDto = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  cnic: z.string().min(10, 'Valid CNIC / National ID is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), 'Valid birth date required'),
  address: z.string().min(5, 'Address is required'),
  emergencyContact: z.string().min(7, 'Emergency contact is required'),
  hasWhatsApp: z.boolean().default(false),
  primaryNotificationChannel: z.enum(['WhatsApp', 'SMS', 'Email']).default('SMS'),
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
