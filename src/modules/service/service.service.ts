import { db } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';

export class ClinicalServiceCatalog {
  async getAllServices() {
    return db.services.filter(s => s.isActive);
  }

  async getServiceById(id: string) {
    const service = db.services.find(s => s.id === id);
    if (!service) {
      throw AppError.notFound('Service not found');
    }
    return service;
  }

  async getServicesByDoctor(doctorId: string) {
    const mappedServices = db.doctorServices
      .filter(ds => ds.doctorId === doctorId)
      .map(ds => db.services.find(s => s.id === ds.serviceId))
      .filter(Boolean);

    return mappedServices;
  }
}

export const clinicalServiceCatalog = new ClinicalServiceCatalog();
