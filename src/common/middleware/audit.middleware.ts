import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousState?: any;
  newState?: any;
  metadata?: any;
  timestamp: string;
}

// Global In-Memory / Relational Audit Ledger Store
export const auditLogStore: AuditLogEntry[] = [];

export const seedDefaultAuditLogs = () => {
  if (auditLogStore.length > 0) return;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const baseLogs: Array<Omit<AuditLogEntry, 'id'>> = [
    {
      actorId: 'u-admin-01',
      actorType: 'ADMIN',
      action: 'SYSTEM_COMPLIANCE_POLICIES_ENFORCED',
      resourceType: 'SystemConfig',
      resourceId: 'sys-pol-01',
      newState: {
        policy: 'HIPAA_AUDIT_COMPLIANCE_v2',
        immutableAuditTrail: true,
        sessionTimeoutMinutes: 15,
        emergencyOverrideLogging: true,
        strictRBAC: true
      },
      metadata: {
        enforcedBy: 'Hospital Compliance Director',
        standard: 'ISO 27001 / HIPAA Section 164.312',
        environment: 'PRODUCTION'
      },
      timestamp: `${dateStr}T08:00:15.000Z`
    },
    {
      actorId: 'u-admin-01',
      actorType: 'ADMIN',
      action: 'SECURITY_SESSION_ESTABLISHED',
      resourceType: 'User',
      resourceId: 'u-admin-01',
      newState: { role: 'ADMIN', mfaVerified: true, status: 'ACTIVE' },
      metadata: { ip: '127.0.0.1', method: 'BEARER_AUTH', userAgent: 'Chrome/Clinical-Terminal' },
      timestamp: `${dateStr}T08:05:22.000Z`
    },
    {
      actorId: 'recep-01',
      actorType: 'RECEPTIONIST',
      action: 'APPOINTMENT_CONFIRMED',
      resourceType: 'Appointment',
      resourceId: 'apt-01',
      newState: {
        id: 'apt-01',
        patientId: 'pat-01',
        patientName: 'Amina Khan',
        doctorId: 'doc-01',
        doctorName: 'Dr. Aisha Khan',
        status: 'CONFIRMED',
        appointmentDate: dateStr
      },
      metadata: { bookingChannel: 'IN_PERSON_DESK', confirmedBy: 'Sana Tariq' },
      timestamp: `${dateStr}T08:15:30.000Z`
    },
    {
      actorId: 'recep-01',
      actorType: 'RECEPTIONIST',
      action: 'QUEUE_TOKEN_ISSUED',
      resourceType: 'QueueEntry',
      resourceId: 'qe-01',
      newState: {
        id: 'qe-01',
        appointmentId: 'apt-01',
        tokenNumber: 1,
        queueStatus: 'WAITING',
        department: 'Cardiology'
      },
      metadata: { checkInTime: `${dateStr}T08:20:00Z`, patientName: 'Amina Khan' },
      timestamp: `${dateStr}T08:20:05.000Z`
    },
    {
      actorId: 'doc-01',
      actorType: 'DOCTOR',
      action: 'QUEUE_STATUS_TRANSITION_CALLED',
      resourceType: 'QueueEntry',
      resourceId: 'qe-01',
      previousState: { queueStatus: 'WAITING', tokenNumber: 1 },
      newState: { queueStatus: 'CALLED', tokenNumber: 1, room: 'Consultation Suite 101' },
      metadata: { calledBy: 'Dr. Aisha Khan', roomNumber: 'Room 101' },
      timestamp: `${dateStr}T08:35:12.000Z`
    },
    {
      actorId: 'doc-01',
      actorType: 'DOCTOR',
      action: 'CLINICAL_RECORD_CREATED',
      resourceType: 'ClinicalRecord',
      resourceId: 'rec-01',
      newState: {
        id: 'rec-01',
        patientId: 'pat-01',
        doctorId: 'doc-01',
        chiefComplaint: 'Morning palpitations, resting BP 150/95 mmHg, light headache',
        diagnosis: 'Stage 1 Essential Hypertension',
        treatmentPlan: 'Lisinopril 10mg PO once daily in morning, strict low-sodium dietary protocol',
        examinationNotes: 'BP: 152/94, Pulse: 78 bpm regular. S1/S2 heard, no murmurs. Lungs clear.'
      },
      metadata: { attendingPhysician: 'Dr. Aisha Khan', visitType: 'PRIMARY_CONSULT' },
      timestamp: `${dateStr}T08:50:45.000Z`
    },
    {
      actorId: 'doc-01',
      actorType: 'DOCTOR',
      action: 'CLINICAL_RECORD_REVISION_APPLIED',
      resourceType: 'ClinicalRecord',
      resourceId: 'rec-01',
      previousState: {
        diagnosis: 'Stage 1 Essential Hypertension',
        treatmentPlan: 'Lisinopril 10mg PO once daily in morning, strict low-sodium dietary protocol'
      },
      newState: {
        diagnosis: 'Stage 1 Essential Hypertension with mild postural reflex sensitivity',
        treatmentPlan: 'Lisinopril titrated down to 5mg PO daily, CoQ10 100mg added, 14-day home BP diary requested'
      },
      metadata: {
        editReason: 'Patient reported mild postural lightheadedness on initial 10mg dose. Decreased dosage to 5mg and scheduled 2-week ambulatory blood pressure monitoring check.',
        previousVersionId: 'ver-cr-01-v1'
      },
      timestamp: `${dateStr}T09:12:18.000Z`
    },
    {
      actorId: 'doc-01',
      actorType: 'DOCTOR',
      action: 'PRESCRIPTION_VERSION_v1_CREATED',
      resourceType: 'Prescription',
      resourceId: 'rx-01',
      newState: {
        version: 1,
        medications: [
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily morning', duration: '30 days' }
        ]
      },
      metadata: { doctorName: 'Dr. Aisha Khan', patientName: 'Amina Khan' },
      timestamp: `${dateStr}T09:15:00.000Z`
    },
    {
      actorId: 'doc-01',
      actorType: 'DOCTOR',
      action: 'PRESCRIPTION_VERSION_v2_UPGRADED',
      resourceType: 'PrescriptionVersion',
      resourceId: 'rx-v2-01',
      previousState: {
        versionNumber: 1,
        medications: [
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily morning', duration: '30 days' }
        ]
      },
      newState: {
        versionNumber: 2,
        medications: [
          { name: 'Lisinopril', dosage: '5mg', frequency: 'Once daily morning', duration: '30 days' },
          { name: 'Co-Enzyme Q10', dosage: '100mg', frequency: 'Once daily with meals', duration: '30 days' }
        ]
      },
      metadata: {
        correctionReason: 'Titrated down Lisinopril from 10mg to 5mg due to blood pressure stabilization and mild dizziness report.',
        supersededVersion: 1
      },
      timestamp: `${dateStr}T09:18:22.000Z`
    },
    {
      actorId: 'doc-01',
      actorType: 'DOCTOR',
      action: 'QUEUE_STATUS_TRANSITION_COMPLETED',
      resourceType: 'QueueEntry',
      resourceId: 'qe-01',
      previousState: { queueStatus: 'IN_CONSULTATION', tokenNumber: 1 },
      newState: { queueStatus: 'COMPLETED', tokenNumber: 1, consultationEnd: `${dateStr}T09:20:00Z` },
      metadata: { consultDurationMinutes: 20, outcome: 'PRESCRIPTION_DISPENSED' },
      timestamp: `${dateStr}T09:20:10.000Z`
    },
    {
      actorId: 'recep-01',
      actorType: 'RECEPTIONIST',
      action: 'POS_PAYMENT_COLLECTED',
      resourceType: 'Payment',
      resourceId: 'pay-01',
      newState: {
        invoiceNumber: 'INV-100201',
        patientId: 'pat-01',
        totalAmount: 2500,
        amountPaid: 2500,
        balanceDue: 0,
        status: 'PAID',
        paymentMethod: 'CARD',
        category: 'Consultation'
      },
      metadata: {
        cashier: 'Sana Tariq',
        terminalId: 'POS-TERM-01',
        receiptPrinted: true,
        patientName: 'Amina Khan'
      },
      timestamp: `${dateStr}T09:25:34.000Z`
    },
    {
      actorId: 'recep-01',
      actorType: 'RECEPTIONIST',
      action: 'APPOINTMENT_CONFIRMED',
      resourceType: 'Appointment',
      resourceId: 'apt-02',
      newState: {
        id: 'apt-02',
        patientId: 'pat-02',
        patientName: 'Bilal Ahmed',
        doctorId: 'doc-02',
        doctorName: 'Dr. Marcus Vance',
        status: 'CONFIRMED',
        appointmentDate: dateStr
      },
      metadata: { bookingChannel: 'ONLINE_PORTAL', verifiedBy: 'Sana Tariq' },
      timestamp: `${dateStr}T09:30:15.000Z`
    },
    {
      actorId: 'recep-01',
      actorType: 'RECEPTIONIST',
      action: 'QUEUE_TOKEN_ISSUED',
      resourceType: 'QueueEntry',
      resourceId: 'qe-02',
      newState: {
        id: 'qe-02',
        appointmentId: 'apt-02',
        tokenNumber: 2,
        queueStatus: 'WAITING',
        department: 'Dermatology'
      },
      metadata: { checkInTime: `${dateStr}T09:35:00Z`, patientName: 'Bilal Ahmed' },
      timestamp: `${dateStr}T09:35:04.000Z`
    },
    {
      actorId: 'doc-02',
      actorType: 'DOCTOR',
      action: 'CLINICAL_RECORD_CREATED',
      resourceType: 'ClinicalRecord',
      resourceId: 'rec-02',
      newState: {
        id: 'rec-02',
        patientId: 'pat-02',
        doctorId: 'doc-02',
        chiefComplaint: 'Facial inflammatory papules and comedones for past 3 months',
        diagnosis: 'Moderate Papular Acne Vulgaris',
        treatmentPlan: 'Adapalene 0.1% gel nightly + Benzoyl Peroxide 2.5% wash. Sunscreen SPF 50+ daily.'
      },
      metadata: { attendingPhysician: 'Dr. Marcus Vance', department: 'Dermatology' },
      timestamp: `${dateStr}T10:05:40.000Z`
    },
    {
      actorId: 'recep-01',
      actorType: 'RECEPTIONIST',
      action: 'POS_PAYMENT_COLLECTED',
      resourceType: 'Payment',
      resourceId: 'pay-02',
      newState: {
        invoiceNumber: 'INV-100202',
        patientId: 'pat-02',
        totalAmount: 2000,
        amountPaid: 2000,
        balanceDue: 0,
        status: 'PAID',
        paymentMethod: 'CASH',
        category: 'Consultation'
      },
      metadata: { cashier: 'Sana Tariq', receiptPrinted: true, patientName: 'Bilal Ahmed' },
      timestamp: `${dateStr}T10:20:18.000Z`
    }
  ];

  // Populate into auditLogStore with generated UUIDs
  baseLogs.forEach(entry => {
    auditLogStore.push({
      id: uuidv4(),
      ...entry
    });
  });

  // Sort descending by timestamp (newest first)
  auditLogStore.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Auto-seed on startup
seedDefaultAuditLogs();

export const recordAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry => {
  const fullEntry: AuditLogEntry = {
    id: uuidv4(),
    ...entry,
    timestamp: new Date().toISOString()
  };
  auditLogStore.unshift(fullEntry);
  logger.info(`[AUDIT_LOG] Actor: ${entry.actorType} (${entry.actorId}) -> Action: ${entry.action} on ${entry.resourceType}:${entry.resourceId}`);
  return fullEntry;
};

export const auditInterceptor = (actionName: string, resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const reqAny = req as any;
        const actorId = reqAny.user?.userId || 'SYSTEM';
        const actorType = reqAny.user?.role || 'SYSTEM';
        const resourceId = req.params.id || body?.data?.id || 'UNKNOWN';

        recordAuditLog({
          actorId,
          actorType,
          action: actionName,
          resourceType,
          resourceId,
          newState: body?.data || body,
          metadata: {
            ip: req.ip,
            path: req.originalUrl,
            method: req.method
          }
        });
      }
      return originalJson.call(this, body);
    };
    next();
  };
};

export const purgeAuditLogs = (adminActorId: string = 'u-admin-01', summary?: any): AuditLogEntry => {
  auditLogStore.length = 0;
  return recordAuditLog({
    actorId: adminActorId,
    actorType: 'ADMIN',
    action: 'DATABASE_PURGED_CLEAN_SLATE',
    resourceType: 'HospitalDatabase',
    resourceId: 'db-root',
    newState: {
      status: 'CLEAN_SLATE',
      message: 'All rough transactional data, dummy patients, and mock clinical records permanently cleared.',
      purgedSummary: summary
    },
    metadata: {
      initiatedBy: 'Root Hospital Administrator',
      environment: 'PRODUCTION_READY',
      timestamp: new Date().toISOString()
    }
  });
};

export const resetDefaultAuditLogs = (adminActorId: string = 'u-admin-01'): void => {
  auditLogStore.length = 0;
  seedDefaultAuditLogs();
  recordAuditLog({
    actorId: adminActorId,
    actorType: 'ADMIN',
    action: 'DATABASE_RESET_TO_DEMO',
    resourceType: 'HospitalDatabase',
    resourceId: 'db-root',
    newState: {
      status: 'DEMO_DATA_RESTORED',
      message: 'Factory demo dataset and audit trail restored.'
    },
    metadata: {
      initiatedBy: 'Administrator',
      timestamp: new Date().toISOString()
    }
  });
};

