import { billingService } from '../../billing/billing.service';
import { AppError } from '../../../common/errors/AppError';

export async function getBasicPaymentStatus(patientId: string) {
  if (!patientId) {
    throw AppError.unauthorized('Patient context required');
  }

  const summary = await billingService.getPatientBillingSummary(patientId);

  return {
    patientId: summary.patientId,
    totalCharges: summary.totalCharges,
    totalPaid: summary.totalPaid,
    balanceDue: summary.balanceDue,
    currency: summary.currency,
    hasOutstandingBalance: summary.balanceDue > 0
  };
}
