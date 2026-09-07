import { db, DbMedicineItem, DbDispenseRecord, DbPharmacySale, DbProcurementOrder } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { recordAuditLog } from '../../common/middleware/audit.middleware';

export class PharmacyService {
  /**
   * Fetch all dispense queue records, automatically synchronizing any doctor prescriptions
   */
  async getDispenseQueue() {
    // Sync any doctor prescriptions that don't have a dispense record yet
    for (const rx of db.prescriptions) {
      const existing = db.dispenseRecords.find(d => d.prescriptionId === rx.id);
      if (!existing) {
        const patient = db.patients.find(p => p.id === rx.patientId);
        const cr = db.clinicalRecords.find(c => c.id === rx.clinicalRecordId);
        const doctor = cr ? db.doctors.find(d => d.id === cr.doctorId) : null;
        const currentVersion = db.prescriptionVersions.find(v => v.prescriptionId === rx.id && v.isCurrent)
          || db.prescriptionVersions.find(v => v.prescriptionId === rx.id);

        const items = (currentVersion?.medicationsJson || []).map(med => {
          const matchedMed = db.medicines.find(m => 
            m.name.toLowerCase().includes(med.name.toLowerCase()) || 
            med.name.toLowerCase().includes(m.name.toLowerCase())
          );
          const unitPrice = matchedMed ? matchedMed.unitPrice : 250.00;
          return {
            medicineId: matchedMed?.id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            quantityPrescribed: 30,
            quantityDispensed: 0,
            batchNumber: matchedMed?.batchNumber || 'RX-STD',
            unitPrice: unitPrice,
            subtotal: unitPrice
          };
        });

        const totalAmount = items.reduce((acc, curr) => acc + curr.subtotal, 0);

        db.dispenseRecords.unshift({
          id: `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          prescriptionId: rx.id,
          prescriptionVersionId: currentVersion?.id,
          patientId: rx.patientId,
          patientName: patient?.fullName || 'Patient Member',
          patientPhone: patient?.emergencyContact || '+15550000000',
          doctorId: doctor?.id || 'doc-01',
          doctorName: doctor?.name || 'Attending Physician',
          diagnosis: cr?.diagnosis || 'Clinical Consultation Follow-Up',
          status: 'PENDING',
          items,
          totalAmount,
          createdAt: rx.createdAt
        });
      }
    }

    return db.dispenseRecords;
  }

  /**
   * Dispense a prescription, validate inventory and deduct stock
   */
  async dispensePrescription(params: {
    dispenseRecordId?: string;
    prescriptionId?: string;
    pharmacistId?: string;
    pharmacistName?: string;
    notes?: string;
    paymentMethod?: string;
  }) {
    const targetId = params.dispenseRecordId || params.prescriptionId;
    const record = db.dispenseRecords.find(d => d.id === targetId || d.prescriptionId === targetId);
    if (!record) {
      throw AppError.notFound('Prescription dispense record not found');
    }

    if (record.status === 'DISPENSED') {
      throw AppError.badRequest('This prescription has already been dispensed');
    }

    // Deduct stock for each dispensed item
    for (const item of record.items) {
      const med = db.medicines.find(m => 
        (item.medicineId && m.id === item.medicineId) || 
        m.name.toLowerCase() === item.name.toLowerCase()
      );
      if (med) {
        const qtyToDeduct = item.quantityPrescribed || 30;
        med.stockQuantity = Math.max(0, med.stockQuantity - qtyToDeduct);
        item.quantityDispensed = qtyToDeduct;
        item.batchNumber = med.batchNumber;
        med.updatedAt = new Date().toISOString();
      } else {
        item.quantityDispensed = item.quantityPrescribed || 30;
      }
    }

    record.status = 'DISPENSED';
    record.pharmacistId = params.pharmacistId;
    record.pharmacistName = params.pharmacistName;
    record.dispensedAt = new Date().toISOString();
    record.notes = params.notes || 'Fulfilled & dispensed as prescribed';

    // Register pharmacy payment receipt
    const invoiceNum = `INV-RX-${Date.now().toString().slice(-6)}`;
    db.payments.push({
      id: `pay-rx-${Date.now()}`,
      invoiceNumber: invoiceNum,
      patientId: record.patientId,
      totalAmount: record.totalAmount,
      discount: 0,
      amountPaid: record.totalAmount,
      balanceDue: 0,
      status: 'PAID',
      paymentMethod: 'CASH',
      category: 'PHARMACY',
      paymentPlan: 'FULL',
      notes: `Pharmacy Rx Dispense: ${record.items.map(i => i.name).join(', ')}`,
      createdAt: new Date().toISOString()
    });

    recordAuditLog({
      actorId: params.pharmacistId || 'u-pharma-01',
      actorType: 'STAFF',
      action: 'DISPENSE_PRESCRIPTION',
      resourceType: 'PharmacyDispense',
      resourceId: record.id,
      metadata: {
        patientName: record.patientName,
        doctorName: record.doctorName,
        totalAmount: record.totalAmount,
        invoiceNumber: invoiceNum,
        itemsCount: record.items.length
      }
    });

    return record;
  }

  /**
   * Get drug inventory with category and low-stock filters
   */
  async getInventory(filters?: { query?: string; category?: string; lowStockOnly?: boolean }) {
    let result = [...db.medicines];

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.genericName.toLowerCase().includes(q) || 
        m.batchNumber.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q)
      );
    }

    if (filters?.category && filters.category !== 'ALL') {
      result = result.filter(m => m.category === filters.category);
    }

    if (filters?.lowStockOnly) {
      result = result.filter(m => m.stockQuantity <= m.minStockAlert);
    }

    const normalized = result.map(m => ({
      ...m,
      quantity: m.stockQuantity,
      reorderLevel: m.minStockAlert,
      batchNo: m.batchNumber,
      rackLocation: m.shelfLocation
    }));

    const categories = Array.from(new Set(db.medicines.map(m => m.category)));
    const lowStockAlerts = normalized.filter(m => m.quantity <= m.reorderLevel);

    return {
      medicines: normalized,
      lowStockAlerts,
      categories
    };
  }

  /**
   * Add or update an inventory medicine item
   */
  async saveMedicine(item: any) {
    if (item.id) {
      const existing = db.medicines.find(m => m.id === item.id);
      if (existing) {
        Object.assign(existing, item, { updatedAt: new Date().toISOString() });
        return {
          ...existing,
          quantity: existing.stockQuantity,
          reorderLevel: existing.minStockAlert,
          batchNo: existing.batchNumber,
          rackLocation: existing.shelfLocation
        };
      }
    }

    const newMed: DbMedicineItem = {
      id: item.id || `med-${Date.now()}`,
      name: item.name || 'New Medicine',
      genericName: item.genericName || item.name || '',
      brand: item.brand || item.name || 'Generic',
      category: (item.category as any) || 'General',
      form: (item.form as any) || 'Tablet',
      strength: item.strength || '500mg',
      stockQuantity: Number(item.stockQuantity ?? item.quantity) || 50,
      minStockAlert: Number(item.minStockAlert ?? item.reorderLevel) || 15,
      unitPrice: Number(item.unitPrice) || 100.00,
      batchNumber: item.batchNumber || item.batchNo || `BT-${Math.floor(Math.random() * 9000 + 1000)}`,
      expiryDate: item.expiryDate || '2028-12-31',
      shelfLocation: item.shelfLocation || item.rackLocation || 'Rack A-1',
      supplierName: item.supplierName || 'Primary Distributor',
      isControlled: Boolean(item.isControlled),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.medicines.unshift(newMed);
    return {
      ...newMed,
      quantity: newMed.stockQuantity,
      reorderLevel: newMed.minStockAlert,
      batchNo: newMed.batchNumber,
      rackLocation: newMed.shelfLocation
    };
  }

  /**
   * Process over-the-counter (OTC) walk-in point of sale checkout
   */
  async processPosSale(data: {
    customerName?: string;
    customerPhone?: string;
    customerType?: 'WALK_IN' | 'REGISTERED_PATIENT';
    patientId?: string;
    items: Array<{ medicineId: string; quantity: number; unitPrice?: number }>;
    paymentMethod?: any;
    discount?: number;
    discountPercent?: number;
    notes?: string;
    processedBy?: string;
  }) {
    if (!data.items || data.items.length === 0) {
      throw AppError.badRequest('Cart is empty');
    }

    const saleItems: Array<{
      medicineId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    let subtotal = 0;

    for (const item of data.items) {
      const med = db.medicines.find(m => m.id === item.medicineId);
      if (!med) {
        throw AppError.badRequest(`Medicine with ID ${item.medicineId} not found`);
      }
      if (med.stockQuantity < item.quantity) {
        throw AppError.badRequest(`Insufficient stock for ${med.name}. Available: ${med.stockQuantity}`);
      }

      // Deduct stock
      med.stockQuantity -= item.quantity;
      med.updatedAt = new Date().toISOString();

      const itemTotal = med.unitPrice * item.quantity;
      subtotal += itemTotal;

      saleItems.push({
        medicineId: med.id,
        name: med.name,
        quantity: item.quantity,
        unitPrice: med.unitPrice,
        total: itemTotal
      });
    }

    let discount = Number(data.discount) || 0;
    if (data.discountPercent && data.discountPercent > 0) {
      discount = (subtotal * data.discountPercent) / 100;
    }
    const totalAmount = Math.max(0, subtotal - discount);
    const receiptNumber = `OTC-${Date.now().toString().slice(-6)}`;

    const saleRecord: DbPharmacySale = {
      id: `sale-${Date.now()}`,
      receiptNumber,
      customerName: data.customerName || 'Walk-in Customer',
      customerPhone: data.customerPhone || '+92 300 0000000',
      customerType: data.customerType || 'WALK_IN',
      patientId: data.patientId,
      items: saleItems,
      subtotal,
      discount,
      totalAmount,
      paymentMethod: data.paymentMethod || 'CASH',
      processedBy: data.processedBy || 'Pharmacist Counter',
      createdAt: new Date().toISOString()
    };

    db.pharmacySales.unshift(saleRecord);

    // Register into hospital payment ledger
    db.payments.push({
      id: `pay-otc-${Date.now()}`,
      invoiceNumber: receiptNumber,
      patientId: data.patientId || 'walk-in',
      totalAmount,
      discount,
      amountPaid: totalAmount,
      balanceDue: 0,
      status: 'PAID',
      paymentMethod: data.paymentMethod as any,
      category: 'PHARMACY',
      paymentPlan: 'FULL',
      notes: `OTC Pharmacy Sale (${saleItems.length} items): ${receiptNumber}`,
      createdAt: new Date().toISOString()
    });

    recordAuditLog({
      actorId: data.processedBy || 'u-pharma-01',
      actorType: 'STAFF',
      action: 'PHARMACY_OTC_SALE',
      resourceType: 'PharmacyPOS',
      resourceId: saleRecord.id,
      metadata: {
        receiptNumber,
        customerName: saleRecord.customerName,
        totalAmount,
        itemsCount: saleItems.length
      }
    });

    return {
      ...saleRecord,
      invoiceNo: receiptNumber,
      netTotal: totalAmount,
      saleDate: saleRecord.createdAt
    };
  }

  /**
   * Drug-Drug Interaction & Clinical Allergy Checker
   */
  async checkDrugSafety(medications: string[], patientAllergies: string[] = []) {
    const alerts: Array<{
      severity: 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';
      title: string;
      description: string;
      recommendation: string;
    }> = [];

    const medsLower = medications.map(m => m.toLowerCase());
    const allergiesLower = patientAllergies.map(a => a.toLowerCase());

    // 1. Allergy Screening
    allergiesLower.forEach(allergy => {
      if (allergy.includes('penicillin') || allergy.includes('amox')) {
        if (medsLower.some(m => m.includes('augmentin') || m.includes('amox'))) {
          alerts.push({
            severity: 'HIGH',
            title: 'Critical Allergy Contraindication: Penicillin Group',
            description: `Patient has documented allergy to "${allergy}". Augmentin/Amoxicillin is contraindicated.`,
            recommendation: 'Switch to a non-beta-lactam antibiotic (e.g. Azithromycin, Ciprofloxacin, or Clarithromycin).'
          });
        }
      }
      if (allergy.includes('sulfa')) {
        if (medsLower.some(m => m.includes('sulfa') || m.includes('bactrim'))) {
          alerts.push({
            severity: 'HIGH',
            title: 'Critical Allergy Contraindication: Sulfonamides',
            description: `Patient allergy "${allergy}" flagged against prescribed sulfonamide medication.`,
            recommendation: 'Cease sulfonamide therapy immediately.'
          });
        }
      }
    });

    // 2. Drug-Drug Interactions Matrix
    const hasACE = medsLower.some(m => m.includes('lisinopril') || m.includes('ramipril') || m.includes('enalapril') || m.includes('ace'));
    const hasBetaBlocker = medsLower.some(m => m.includes('metoprolol') || m.includes('atenolol') || m.includes('bisoprolol'));
    const hasStatin = medsLower.some(m => m.includes('atorvastatin') || m.includes('rosuvastatin') || m.includes('simvastatin'));
    const hasNSAID = medsLower.some(m => m.includes('ibuprofen') || m.includes('diclofenac') || m.includes('naproxen') || m.includes('aspirin'));
    const hasFluoroquinolone = medsLower.some(m => m.includes('cipro') || m.includes('levofloxacin'));

    if (hasACE && hasBetaBlocker) {
      alerts.push({
        severity: 'LOW',
        title: 'Synergistic Hypotension & Bradycardia Monitor',
        description: 'Concurrent ACE inhibitor and Beta-blocker therapy may produce additive blood pressure lowering.',
        recommendation: 'Monitor standing BP and heart rate. Optimal cardioprotective pairing when titrated.'
      });
    }

    if (hasACE && hasNSAID) {
      alerts.push({
        severity: 'MODERATE',
        title: 'Renal Hemodynamics & Antihypertensive Blunting',
        description: 'NSAIDs reduce prostaglandin synthesis, blunting ACE inhibitor efficacy and elevating acute renal risk.',
        recommendation: 'Substitute NSAID with Paracetamol 500mg for routine pain management.'
      });
    }

    if (hasFluoroquinolone) {
      alerts.push({
        severity: 'MODERATE',
        title: 'Ciprofloxacin Mineral Chelation Warning',
        description: 'Fluoroquinolones form insoluble chelates with polyvalent cations (calcium, zinc, antacids).',
        recommendation: 'Administer Ciprofloxacin at least 2 hours before or 4 hours after mineral supplements (Cevit / Antacids).'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        severity: 'INFO',
        title: 'Zero High-Risk Contraindications Found',
        description: `Screened ${medications.length} active medications against clinical safety database and patient allergy profile.`,
        recommendation: 'Standard administration schedules apply. Advise patient on prescribed hydration.'
      });
    }

    const hasHigh = alerts.some(a => a.severity === 'HIGH');
    const safe = !hasHigh;
    const warnings = alerts.filter(a => a.severity === 'HIGH' || a.severity === 'MODERATE').map(a => `${a.title}: ${a.description}`);
    const interactions = alerts.map(a => ({
      drugA: a.title,
      drugB: 'Target Regimen',
      severity: a.severity,
      description: a.description,
      recommendation: a.recommendation
    }));

    return {
      safe,
      warnings,
      interactions,
      screenedMedicationsCount: medications.length,
      alertsCount: alerts.length,
      alerts
    };
  }

  /**
   * Procurement Orders Management
   */
  async getProcurementOrders() {
    return db.procurementOrders;
  }

  async receiveProcurementOrder(orderId: string) {
    const order = db.procurementOrders.find(o => o.id === orderId);
    if (!order) {
      throw AppError.notFound('Purchase order not found');
    }

    if (order.status === 'RECEIVED') {
      throw AppError.badRequest('This order has already been received into inventory');
    }

    // Increment stock for each item
    for (const item of order.items) {
      const med = db.medicines.find(m => m.name.toLowerCase().includes(item.name.toLowerCase()));
      if (med) {
        med.stockQuantity += item.quantity;
        med.updatedAt = new Date().toISOString();
      }
    }

    order.status = 'RECEIVED';
    order.receivedAt = new Date().toISOString();

    recordAuditLog({
      actorId: 'pharmacy',
      actorType: 'STAFF',
      action: 'RECEIVE_PROCUREMENT_ORDER',
      resourceType: 'PharmacyProcurement',
      resourceId: order.id,
      metadata: {
        poNumber: order.poNumber,
        supplierName: order.supplierName,
        totalCost: order.totalCost
      }
    });

    return order;
  }
}

export const pharmacyService = new PharmacyService();
