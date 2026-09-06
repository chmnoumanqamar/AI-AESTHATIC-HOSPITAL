import { appointmentService } from '../../appointment/appointment.service';
import { AppError } from '../../../common/errors/AppError';

export async function requestReschedule(
  params: {
    appointmentId: string;
    newDate: string;
    reason?: string;
  },
  patientId: string,
  userId: string
) {
  const appointment = await appointmentService.getAppointmentById(params.appointmentId);
  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }

  if (appointment.patientId !== patientId) {
    throw AppError.forbidden('You can only reschedule your own appointments.');
  }

  const result = await appointmentService.rescheduleAppointment(
    {
      appointmentId: params.appointmentId,
      newDate: params.newDate,
      reason: params.reason || 'Rescheduled via AI Assistant'
    },
    userId,
    'AI_AGENT'
  );

  return {
    previousAppointmentId: result.cancelledAppointment.id,
    previousDate: result.cancelledAppointment.appointmentDate,
    cancelledTokenNumber: result.cancelledAppointment.tokenNumber,
    newAppointmentId: result.newAppointment.id,
    newDate: result.newAppointment.appointmentDate,
    newTokenNumber: result.newAppointment.tokenNumber,
    newStatus: result.newAppointment.status,
    message: `Rescheduling processed: Previous appointment (Token #${result.cancelledAppointment.tokenNumber}) is CANCELLED. New request created for ${result.newAppointment.appointmentDate} (Token #${result.newAppointment.tokenNumber}) with status PENDING review.`
  };
}
