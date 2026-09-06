import { z } from 'zod';

export const checkDuplicateDto = z.object({
  cnic: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const updateNotificationPreferencesDto = z.object({
  hasWhatsApp: z.boolean().optional(),
  primaryNotificationChannel: z.enum(['WhatsApp', 'SMS', 'Email']),
  backupNotificationChannel: z.enum(['WhatsApp', 'SMS', 'Email']).optional(),
});

export type CheckDuplicateInput = z.infer<typeof checkDuplicateDto>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesDto>;
