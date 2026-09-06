import { z } from 'zod';

export const UpdateUserAccessSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().optional()
});

export type UpdateUserAccessInput = z.infer<typeof UpdateUserAccessSchema>;

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'])
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

export const CreateUserSchema = z.object({
  phone: z.string().min(8),
  email: z.string().email().optional(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']),
  name: z.string().min(2),
  specialization: z.string().optional(),
  cnic: z.string().optional(),
  gender: z.string().optional()
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const PurgeDatabaseSchema = z.object({
  action: z.enum(['CLEAN_SLATE', 'RESET_DEMO']),
  confirmText: z.string().optional()
});

export type PurgeDatabaseInput = z.infer<typeof PurgeDatabaseSchema>;

