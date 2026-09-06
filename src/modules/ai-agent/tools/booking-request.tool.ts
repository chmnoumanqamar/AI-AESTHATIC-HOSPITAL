import { appointmentService } from '../../appointment/appointment.service';
import { AppError } from '../../../common/errors/AppError';

export async function createBookingRequest(
  params: {
    doctorId: string;
    serviceId?: string;
    date: string;
    bookingSource?: 'PORTAL' | 'AI_AGENT' | 'RECEPTIONIST' | 'CALL' | 'WHATSAPP_BOT' | 'WEB_BOT';
  },
  patientId: string,
  userId: string
) {
  if (!patientId) {
    throw AppError.unauthorized('Patient context is required to create a booking request.');
  }

  const source = params.bookingSource || 'AI_AGENT';
  const appointment = await appointmentService.createBooking(
    {
      doctorId: params.doctorId,
      serviceId: params.serviceId,
      appointmentDate: params.date,
      patientId,
      bookingSource: source
    },
    userId,
    source
  );

  return {
    appointmentId: appointment.id,
    status: appointment.status, // Always PENDING
    tokenNumber: appointment.tokenNumber,
    appointmentDate: appointment.appointmentDate,
    doctorName: appointment.doctorName,
    serviceName: appointment.serviceName,
    message: `Booking request successfully created with Token #${appointment.tokenNumber}. Status is PENDING front-desk review and confirmation.`
  };
}
