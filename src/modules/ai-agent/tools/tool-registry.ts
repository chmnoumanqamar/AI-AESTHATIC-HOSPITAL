import { findDoctor, findService } from './doctor-discovery.tool';
import { findAvailableTokens } from './token-lookup.tool';
import { createBookingRequest } from './booking-request.tool';
import { cancelAppointment } from './cancellation.tool';
import { requestReschedule } from './reschedule.tool';
import { getPatientClinicalHistory } from './patient-history.tool';
import { getBasicPaymentStatus } from './basic-billing.tool';

export const AI_TOOL_DEFINITIONS = [
  {
    name: 'findDoctor',
    description: 'Retrieves public doctor profiles matching specialization or name keywords.',
    parameters: {
      type: 'object',
      properties: {
        specialization: { type: 'string', description: 'Medical specialty e.g. Cardiology, Dermatology' },
        name: { type: 'string', description: 'Doctor full or partial name' }
      }
    }
  },
  {
    name: 'findService',
    description: 'Retrieves hospital clinical services, examinations, and fee information.',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Search term e.g. ECG, Skin Scan, Consultation' }
      }
    }
  },
  {
    name: 'findAvailableTokens',
    description: 'Calculates active doctor patient load and returns sequential token slots for a given date.',
    parameters: {
      type: 'object',
      properties: {
        doctorId: { type: 'string', description: 'Doctor UUID' },
        date: { type: 'string', description: 'Target date (YYYY-MM-DD)' }
      },
      required: ['doctorId', 'date']
    }
  },
  {
    name: 'createBookingRequest',
    description: 'Creates an appointment booking request. The request is strictly placed in PENDING status.',
    parameters: {
      type: 'object',
      properties: {
        doctorId: { type: 'string', description: 'Target Doctor ID' },
        serviceId: { type: 'string', description: 'Optional Service ID' },
        date: { type: 'string', description: 'Target appointment date (YYYY-MM-DD)' }
      },
      required: ['doctorId', 'date']
    }
  },
  {
    name: 'cancelAppointment',
    description: 'Permanently cancels an existing appointment and marks the daily token as permanently non-reusable.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', description: 'ID of the appointment to cancel' },
        reason: { type: 'string', description: 'Reason for cancellation' }
      },
      required: ['appointmentId']
    }
  },
  {
    name: 'requestReschedule',
    description: 'Cancels old appointment & token, and generates a new booking request on a new date with PENDING status.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', description: 'ID of current appointment' },
        newDate: { type: 'string', description: 'New requested date (YYYY-MM-DD)' },
        reason: { type: 'string', description: 'Reason for rescheduling' }
      },
      required: ['appointmentId', 'newDate']
    }
  },
  {
    name: 'getPatientClinicalHistory',
    description: 'Read-only access for the authenticated patient own past diagnoses, visits, and active prescriptions.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getBasicPaymentStatus',
    description: 'Returns total charges, amount paid, and outstanding balance for the authenticated patient.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

export const toolHandlers = {
  findDoctor,
  findService,
  findAvailableTokens,
  createBookingRequest,
  cancelAppointment,
  requestReschedule,
  getPatientClinicalHistory,
  getBasicPaymentStatus
};
