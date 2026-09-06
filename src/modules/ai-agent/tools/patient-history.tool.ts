import { clinicalService } from '../../clinical/clinical.service';
import { AppError } from '../../../common/errors/AppError';

export async function getPatientClinicalHistory(patientId: string) {
  if (!patientId) {
    throw AppError.unauthorized('Patient context required');
  }

  // Uses 'PATIENT' role so private notes are automatically redacted
  const history = await clinicalService.getPatientHistory(patientId, 'PATIENT');

  return {
    patientId: history.patientId,
    patientName: history.patientName,
    totalVisits: history.totalRecords,
    consultations: history.records.map((r: any) => ({
      date: r.createdAt?.split('T')[0],
      doctorName: r.doctorName,
      chiefComplaint: r.chiefComplaint,
      diagnosis: r.diagnosis,
      treatmentPlan: r.treatmentPlan,
      currentPrescription: r.prescriptions?.[0]?.versions?.[0]?.medicationsJson || []
    }))
  };
}
