import { z } from 'zod';

export const UpdateUserAccessSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().optional()
});

export type UpdateUserAccessInput = z.infer<typeof UpdateUserAccessSchema>;

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST'])
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

export const CreateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dashes, and periods').optional(),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST']),
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  cnic: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  qualifications: z.union([z.array(z.string()), z.string()]).optional(),
  experienceYears: z.union([z.number(), z.string()]).optional(),
  consultationFee: z.union([z.number(), z.string()]).optional(),
  deskNumber: z.string().optional(),
  shift: z.string().optional(),
  department: z.string().optional(),
  allergies: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const PurgeDatabaseSchema = z.object({
  action: z.enum(['CLEAN_SLATE', 'RESET_DEMO']),
  confirmText: z.string().optional()
});

export type PurgeDatabaseInput = z.infer<typeof PurgeDatabaseSchema>;

