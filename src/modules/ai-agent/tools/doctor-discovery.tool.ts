import { doctorService } from '../../doctor/doctor.service';
import { clinicalServiceCatalog } from '../../service/service.service';

export async function findDoctor(params: { specialization?: string; name?: string }) {
  const doctors = await doctorService.getAllDoctors();
  let results = doctors;

  if (params.specialization) {
    const specLower = params.specialization.toLowerCase();
    results = results.filter(d => d.specialization.toLowerCase().includes(specLower));
  }

  if (params.name) {
    const nameLower = params.name.toLowerCase();
    results = results.filter(d => d.name.toLowerCase().includes(nameLower));
  }

  return results.map(d => ({
    id: d.id,
    name: d.name,
    specialization: d.specialization,
    experienceYears: d.experienceYears,
    consultationFee: d.consultationFee,
    languages: d.languages,
    qualifications: d.qualifications
  }));
}

export async function findService(params: { category?: string; keyword?: string }) {
  const services = await clinicalServiceCatalog.getAllServices();
  let results = services;

  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    results = results.filter(s => s.name.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw));
  }

  return results;
}
