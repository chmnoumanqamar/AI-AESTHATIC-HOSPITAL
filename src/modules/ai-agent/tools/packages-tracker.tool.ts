import { patientCareService } from '../../patient/patient-care.service';
import { db } from '../../../common/data/mock-db';

export async function checkPatientPackages(patientId: string): Promise<any> {
  const packages = patientCareService.getPatientPackages(patientId);

  if (!packages || packages.length === 0) {
    return {
      hasPackages: false,
      packages: [],
      message: 'No active treatment packages or aesthetic deals found for this patient profile.'
    };
  }

  const active = packages.filter(p => p.status === 'ACTIVE');
  const completed = packages.filter(p => p.status === 'COMPLETED');

  return {
    hasPackages: true,
    totalPurchased: packages.length,
    activeCount: active.length,
    completedCount: completed.length,
    packages: packages.map(p => ({
      id: p.id,
      name: p.packageName,
      category: p.category,
      totalSessions: p.totalSessions,
      completedSessions: p.completedSessions,
      remainingSessions: p.remainingSessions,
      status: p.status,
      lastSessionDate: p.lastSessionDate || 'Not started',
      nextRecommendedDate: p.nextRecommendedDate || 'Flexible',
      pricePKR: p.pricePKR,
      isNextDue: p.status === 'ACTIVE' && p.remainingSessions > 0
    }))
  };
}

export async function bookPackageSession(
  packageId: string,
  patientId: string,
  doctorId: string,
  date: string
): Promise<any> {
  return await patientCareService.bookPackageSession(patientId, packageId, doctorId, date);
}
