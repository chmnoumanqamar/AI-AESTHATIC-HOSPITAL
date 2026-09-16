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

  // --- Aesthetic Deals & Multi-Session Packages ---
  async getAllDeals() {
    return (db.deals || []).filter(d => d.isActive);
  }

  async getDealById(id: string) {
    const deal = (db.deals || []).find(d => d.id === id);
    if (!deal) throw AppError.notFound('Aesthetic Deal package not found');
    return deal;
  }

  async createDeal(payload: { name: string; totalPrice: number; sessionsAllowed: number; description?: string; category?: string }) {
    const newDeal = {
      id: `deal-${Date.now()}`,
      name: payload.name,
      totalPrice: Number(payload.totalPrice),
      sessionsAllowed: Number(payload.sessionsAllowed) || 1,
      description: payload.description || '',
      category: payload.category || 'Aesthetic Packages',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    if (!db.deals) db.deals = [];
    db.deals.push(newDeal);
    db.saveToDisk();
    return newDeal;
  }

  async deleteDeal(id: string) {
    const deal = (db.deals || []).find(d => d.id === id);
    if (!deal) throw AppError.notFound('Deal not found');
    deal.isActive = false;
    db.saveToDisk();
    return { success: true, message: 'Deal archived successfully' };
  }

  // --- Aesthetic Retail Products & Inventory ---
  async getAllProducts() {
    return (db.aestheticProducts || []).filter(p => p.isActive);
  }

  async getProductById(id: string) {
    const product = (db.aestheticProducts || []).find(p => p.id === id);
    if (!product) throw AppError.notFound('Product not found');
    return product;
  }

  async createProduct(payload: { name: string; sku: string; barcode?: string; categoryName?: string; costPrice: number; sellingPrice: number; stockQuantity: number }) {
    const newProd = {
      id: `prod-${Date.now()}`,
      name: payload.name,
      sku: payload.sku,
      barcode: payload.barcode || '',
      categoryName: payload.categoryName || 'General Skincare',
      costPrice: Number(payload.costPrice) || 0,
      sellingPrice: Number(payload.sellingPrice) || 0,
      taxClass: 'Standard' as const,
      stockQuantity: Number(payload.stockQuantity) || 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    if (!db.aestheticProducts) db.aestheticProducts = [];
    db.aestheticProducts.push(newProd);
    db.saveToDisk();
    return newProd;
  }

  async updateProductStock(id: string, delta: number) {
    const product = (db.aestheticProducts || []).find(p => p.id === id);
    if (!product) throw AppError.notFound('Product not found');
    product.stockQuantity = Math.max(0, product.stockQuantity + delta);
    db.saveToDisk();
    return product;
  }
}

export const clinicalServiceCatalog = new ClinicalServiceCatalog();
