import { db } from '../../../common/data/mock-db';

export async function checkPharmacyStock(params: {
  query?: string;
  category?: string;
}) {
  let list = [...db.medicines];

  if (params.query) {
    const q = params.query.toLowerCase().trim();
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q)
    );
  }

  if (params.category && params.category !== 'ALL') {
    list = list.filter(m => m.category.toLowerCase() === params.category!.toLowerCase());
  }

  return list.map(m => ({
    id: m.id,
    name: m.name,
    genericName: m.genericName,
    brand: m.brand,
    category: m.category,
    form: m.form,
    strength: m.strength,
    unitPrice: m.unitPrice,
    stockQuantity: m.stockQuantity,
    isAvailable: m.stockQuantity > 0,
    shelfLocation: m.shelfLocation,
    requiresPrescription: m.category === 'Antibiotics' || m.isControlled || m.category === 'Cardiology' || m.form === 'Injection',
    isControlled: m.isControlled,
    batchNumber: m.batchNumber
  }));
}
