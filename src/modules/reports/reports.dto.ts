import { z } from 'zod';

export const ReportsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('daily'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  doctorId: z.string().optional()
});

export type ReportsQuery = z.infer<typeof ReportsQuerySchema>;
