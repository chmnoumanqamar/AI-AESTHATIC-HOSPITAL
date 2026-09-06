import { z } from 'zod';

const medicationItemDto = z.object({
  name: z.string().min(1, 'Medication name required'),
  dosage: z.string().optional().default('As directed'),
  frequency: z.string().optional().default('Once Daily'),
  duration: z.string().optional().default('7 Days'),
  instructions: z.string().optional().default('')
});

export const createClinicalRecordDto = z.object({
  appointmentId: z.string().min(1, 'Appointment ID required'),
  patientId: z.string().min(1, 'Patient ID required'),
  chiefComplaint: z.string().optional().default('General consultation'),
  examinationNotes: z.string().optional().default('Routine physical examination completed'),
  diagnosis: z.string().optional().default('Clinical observation'),
  treatmentPlan: z.string().optional().default('Follow prescribed regimen'),
  privateNotes: z.string().optional(),
  medications: z.array(medicationItemDto).optional().default([])
});

export const updateClinicalRecordDto = z.object({
  chiefComplaint: z.string().optional(),
  examinationNotes: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  privateNotes: z.string().optional(),
  editReason: z.string().min(3, 'Reason for clinical modification is mandatory for audit logging')
});

export const createPrescriptionVersionDto = z.object({
  prescriptionId: z.string(),
  medications: z.array(medicationItemDto).min(1, 'At least one medication is required'),
  correctionReason: z.string().min(5, 'Mandatory correction reason for prescription versioning')
});

export type MedicationItem = z.infer<typeof medicationItemDto>;
export type CreateClinicalRecordInput = z.infer<typeof createClinicalRecordDto>;
export type UpdateClinicalRecordInput = z.infer<typeof updateClinicalRecordDto>;
export type CreatePrescriptionVersionInput = z.infer<typeof createPrescriptionVersionDto>;
