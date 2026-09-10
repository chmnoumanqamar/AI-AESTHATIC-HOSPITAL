import { patientCareService } from '../../patient/patient-care.service';
import { db } from '../../../common/data/mock-db';

export async function checkAssignedLabTests(patientId: string): Promise<any> {
  const allTests = db.assignedLabTests.filter(t => t.patientId === patientId);
  const pendingTests = patientCareService.getPendingLabTests(patientId);

  return {
    totalAssigned: allTests.length,
    pendingCount: pendingTests.length,
    hasPending: pendingTests.length > 0,
    tests: allTests.map(t => ({
      id: t.id,
      name: t.testName,
      doctor: t.doctorName,
      assignedDate: t.assignedDate,
      dueDate: t.dueDate,
      instructions: t.instructions || 'Standard sample collection protocol.',
      status: t.status,
      reportUrl: t.reportUrl,
      reportSummary: t.reportSummary
    }))
  };
}

export async function updateLabTestStatus(
  testId: string,
  status: 'ASSIGNED' | 'PENDING_SAMPLE' | 'SAMPLE_COLLECTED' | 'COMPLETED',
  reportSummary?: string
): Promise<any> {
  const updated = patientCareService.updateLabTestStatus(testId, status, undefined, reportSummary);
  return {
    success: Boolean(updated),
    test: updated
  };
}
