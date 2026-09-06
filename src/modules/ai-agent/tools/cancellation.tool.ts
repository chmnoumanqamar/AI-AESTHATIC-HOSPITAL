import { appointmentService } from '../../appointment/appointment.service';
import { AppError } from '../../../common/errors/AppError';

export async function cancelAppointment(
  params: {
    appointmentId: string;
    reason?: string;
  },
  patientId: string,
  userId: string
) {
  const appointment = await appointmentService.getAppointmentById(params.appointmentId);
  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }

  // Validate ownership
  if (appointment.patientId !== patientId) {
    throw AppError.forbidden('You can only cancel your own appointments.');
  }

  const updated = await appointmentService.updateStatus(
    params.appointmentId,
    {
      status: 'CANCELLED',
      reason: params.reason || 'Cancelled via AI Assistant'
    },
    userId,
    'AI_AGENT'
  );

  return {
    appointmentId: updated.id,
    status: updated.status,
    cancelledTokenNumber: updated.tokenNumber,
    message: `Appointment for ${updated.doctorName} on ${updated.appointmentDate} (Token #${updated.tokenNumber}) has been CANCELLED. The token slot is permanently locked.`
  };
}
