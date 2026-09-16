import { v4 as uuidv4 } from 'uuid';
import { db, DbPayment } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { recordAuditLog } from '../../common/middleware/audit.middleware';

export interface RecordPaymentPayload {
  patientId: string;
  appointmentId?: string;
  doctorId?: string;
  doctorName?: string;
  dealId?: string;
  dealName?: string;
  sessionsAllowed?: number;
  items?: Array<{ id: string; name: string; type: 'SERVICE' | 'PRODUCT' | 'DEAL'; quantity: number; unitPrice: number; subtotal: number }>;
  amount: number;
  totalAmount?: number;
  discount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER' | 'INSURANCE' | 'WALLET';
  category?: 'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'PHARMACY' | 'EMERGENCY' | 'PACKAGE' | 'RETAIL';
  paymentPlan?: 'FULL' | 'INSTALLMENT_1' | 'INSTALLMENT_2' | 'SPECIAL_WAIVER';
  notes?: string;
}

export class BillingService {
  /**
   * PATIENT-SCOPED FINANCIAL DOSSIER (Used by AI Agent, Front-Desk POS, and Patient Portal)
   */
  async getPatientBillingSummary(patientId: string) {
    const patient = db.patients.find(p => p.id === patientId || p.userId === patientId);
    const resolvedPatientId = patient?.id || patientId;

    const patientPayments = db.payments.filter(
      p => p.patientId === resolvedPatientId || p.patientId === patientId
    );

    let recordedTotalCharges = patientPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    let recordedDiscounts = patientPayments.reduce((sum, p) => sum + (p.discount || 0), 0);
    let totalPaid = patientPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    let recordedBalanceDue = patientPayments.reduce((sum, p) => sum + p.balanceDue, 0);

    // Look for appointments for this patient that may not have a payment record yet
    const patientAppointments = db.appointments.filter(
      a => a.patientId === resolvedPatientId || a.patientId === patientId
    );

    const unpaidAppointmentsList: any[] = [];
    let pendingAppointmentFees = 0;

    for (const app of patientAppointments) {
      if (['CONFIRMED', 'PENDING'].includes(app.status)) {
        const hasPayment = patientPayments.some(p => p.appointmentId === app.id);
        if (!hasPayment) {
          const doc = db.doctors.find(d => d.id === app.doctorId);
          const fee = doc?.consultationFee || 2000;
          pendingAppointmentFees += fee;
          unpaidAppointmentsList.push({
            appointmentId: app.id,
            appointmentDate: app.appointmentDate,
            doctorName: doc?.name || 'Consultant Specialist',
            specialization: doc?.specialization || 'Clinical Specialist',
            fee
          });
        }
      }
    }

    const totalCharges = recordedTotalCharges + pendingAppointmentFees;
    const netPayable = Math.max(0, totalCharges - recordedDiscounts);
    const balanceDue = recordedBalanceDue + pendingAppointmentFees;
    const advanceCredit = (patient && patient.advance_balance !== undefined)
      ? patient.advance_balance
      : (totalPaid > netPayable ? totalPaid - netPayable : 0);

    let financialStatus: 'CLEAR' | 'PENDING' | 'PARTIAL' = 'CLEAR';
    if (balanceDue > 0) {
      financialStatus = totalPaid > 0 ? 'PARTIAL' : 'PENDING';
    }

    // Extract patient's active multi-session packages
    const activePackages = patientPayments
      .filter(p => (p.dealId || (p.sessionsAllowed && p.sessionsAllowed > 0)) && (p.sessionsAllowed || 0) > (p.sessionsConsumed || 0))
      .map(p => ({
        paymentId: p.id,
        invoiceNumber: p.invoiceNumber,
        dealName: p.dealName || p.notes || 'Aesthetic Treatment Package',
        totalSessions: p.sessionsAllowed || 1,
        sessionsConsumed: p.sessionsConsumed || 0,
        sessionsRemaining: (p.sessionsAllowed || 1) - (p.sessionsConsumed || 0),
        doctorName: p.doctorName || 'Specialist',
        sessionRemarks: p.sessionRemarks || [],
        purchasedAt: p.createdAt
      }));

    return {
      patientId: resolvedPatientId,
      patientName: patient?.fullName || 'Patient',
      cnic: patient?.cnic || 'N/A',
      phone: patient?.emergencyContact || 'N/A',
      totalCharges,
      totalDiscounts: recordedDiscounts,
      netPayable,
      totalPaid,
      balanceDue,
      advanceCredit,
      financialStatus,
      activePackages,
      currency: 'PKR',
      unpaidAppointments: unpaidAppointmentsList,
      payments: [...patientPayments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    };
  }

  /**
   * RECEPTIONIST FRONT-DESK POS PAYMENT COLLECTION
   * Supports both object payload and legacy positional arguments
   */
  async recordPayment(
    inputOrPatientId: string | RecordPaymentPayload,
    appointmentIdOrActorId?: string,
    amountOrActorRole?: number | string,
    actorIdParam?: string,
    actorRoleParam?: string
  ) {
    let payload: RecordPaymentPayload;
    let actorId: string;
    let actorRole: string;

    if (typeof inputOrPatientId === 'string') {
      // Legacy positional call: (patientId, appointmentId, amount, actorId, actorRole)
      payload = {
        patientId: inputOrPatientId,
        appointmentId: appointmentIdOrActorId,
        amount: typeof amountOrActorRole === 'number' ? amountOrActorRole : parseFloat(amountOrActorRole as string),
        totalAmount: typeof amountOrActorRole === 'number' ? amountOrActorRole : parseFloat(amountOrActorRole as string),
        discount: 0,
        paymentMethod: 'CASH',
        category: 'CONSULTATION',
        paymentPlan: 'FULL'
      };
      actorId = actorIdParam || 'SYSTEM';
      actorRole = actorRoleParam || 'RECEPTIONIST';
    } else {
      // Modern payload object: (payload, actorId, actorRole)
      payload = inputOrPatientId;
      actorId = appointmentIdOrActorId || 'SYSTEM';
      actorRole = (amountOrActorRole as string) || 'RECEPTIONIST';
    }

    const gross = payload.totalAmount ?? payload.amount;
    const discount = payload.discount ?? 0;
    const net = Math.max(0, gross - discount);
    const paid = payload.amount;
    const balanceDue = Math.max(0, net - paid);
    const status: 'PAID' | 'PENDING' | 'PARTIAL' =
      balanceDue === 0 ? 'PAID' : paid === 0 ? 'PENDING' : 'PARTIAL';

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    // Resolve doctor name if doctorId is given
    let doctorName = payload.doctorName;
    if (payload.doctorId && !doctorName) {
      const doc = db.doctors.find(d => d.id === payload.doctorId);
      if (doc) doctorName = doc.name;
    }

    // Resolve patient & validate wallet balance if paying via WALLET
    const patient = db.patients.find(p => p.id === payload.patientId || p.userId === payload.patientId);
    if (payload.paymentMethod === 'WALLET') {
      const currentWallet = patient?.advance_balance || 0;
      if (currentWallet < paid) {
        throw AppError.badRequest(`Insufficient advance wallet credit. Available: PKR ${currentWallet.toFixed(2)}, Required: PKR ${paid.toFixed(2)}`);
      }
      if (patient) {
        patient.advance_balance = currentWallet - paid;
      }
    }

    // Auto-deplete physical stock if retail products were in the cart
    if (payload.items && Array.isArray(payload.items)) {
      for (const it of payload.items) {
        if (it.type === 'PRODUCT' && db.aestheticProducts) {
          const prod = db.aestheticProducts.find(p => p.id === it.id);
          if (prod) {
            prod.stockQuantity = Math.max(0, prod.stockQuantity - (it.quantity || 1));
          }
        }
      }
    }

    const payment: DbPayment = {
      id: uuidv4(),
      invoiceNumber,
      patientId: payload.patientId,
      appointmentId: payload.appointmentId,
      doctorId: payload.doctorId,
      doctorName,
      dealId: payload.dealId,
      dealName: payload.dealName,
      sessionsAllowed: payload.sessionsAllowed,
      sessionsConsumed: payload.dealId ? 0 : undefined,
      sessionRemarks: [],
      items: payload.items,
      totalAmount: gross,
      discount,
      amountPaid: paid,
      balanceDue,
      status,
      paymentMethod: payload.paymentMethod || 'CASH',
      category: payload.category || 'CONSULTATION',
      paymentPlan: payload.paymentPlan || 'FULL',
      notes: payload.notes || undefined,
      createdAt: new Date().toISOString()
    };

    db.payments.push(payment);
    db.saveToDisk();

    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: 'POS_PAYMENT_COLLECTED',
      resourceType: 'Payment',
      resourceId: payment.id,
      newState: payment
    });

    return payment;
  }

  /**
   * REDEEM / CONSUME 1 SESSION FROM AN ACTIVE AESTHETIC PACKAGE
   */
  async consumePackageSession(paymentId: string, remarks: string, doctorName?: string, actorId: string = 'SYSTEM', actorRole: string = 'RECEPTIONIST') {
    const payment = db.payments.find(p => p.id === paymentId);
    if (!payment) throw AppError.notFound('Package payment record not found');
    if (!payment.sessionsAllowed || payment.sessionsAllowed <= 0) {
      throw AppError.badRequest('This invoice is not a multi-session package deal');
    }
    const consumed = payment.sessionsConsumed || 0;
    if (consumed >= payment.sessionsAllowed) {
      throw AppError.badRequest(`All ${payment.sessionsAllowed} sessions for this package have already been utilized`);
    }

    payment.sessionsConsumed = consumed + 1;
    if (!payment.sessionRemarks) payment.sessionRemarks = [];
    payment.sessionRemarks.push({
      sessionNumber: payment.sessionsConsumed,
      date: new Date().toISOString(),
      remarks: remarks || `Session ${payment.sessionsConsumed} redeemed successfully.`,
      doctorName: doctorName || payment.doctorName || 'Clinical Specialist'
    });

    db.saveToDisk();

    recordAuditLog({
      actorId,
      actorType: actorRole,
      action: 'AESTHETIC_SESSION_CONSUMED',
      resourceType: 'Payment',
      resourceId: payment.id,
      newState: {
        sessionsConsumed: payment.sessionsConsumed,
        sessionsRemaining: payment.sessionsAllowed - payment.sessionsConsumed
      }
    });

    return {
      success: true,
      paymentId: payment.id,
      sessionsAllowed: payment.sessionsAllowed,
      sessionsConsumed: payment.sessionsConsumed,
      sessionsRemaining: payment.sessionsAllowed - payment.sessionsConsumed,
      sessionRemarks: payment.sessionRemarks
    };
  }

  /**
   * PROCESS SALES RETURN & REFUND
   */
  async processRefund(payload: {
    paymentId: string;
    refundAmount: number;
    reason: string;
    refundMethod?: 'CASH' | 'WALLET' | 'ORIGINAL_METHOD';
    itemsReturned?: Array<{ itemId: string; name: string; quantity: number; unitPrice: number }>;
    actorId?: string;
    actorRole?: string;
  }) {
    const payment = db.payments.find(p => p.id === payload.paymentId);
    if (!payment) throw AppError.notFound('Original payment invoice not found');

    const refundAmt = Number(payload.refundAmount);
    if (refundAmt <= 0) throw AppError.badRequest('Refund amount must be greater than 0');
    if (refundAmt > payment.amountPaid) {
      throw AppError.badRequest(`Refund amount (Rs. ${refundAmt}) exceeds amount paid (Rs. ${payment.amountPaid})`);
    }

    const patient = db.patients.find(p => p.id === payment.patientId);
    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;

    // Restock returned skincare products if any
    if (payload.itemsReturned && Array.isArray(payload.itemsReturned) && db.aestheticProducts) {
      for (const item of payload.itemsReturned) {
        const prod = db.aestheticProducts.find(p => p.id === item.itemId || p.name === item.name);
        if (prod) {
          prod.stockQuantity += Number(item.quantity) || 1;
        }
      }
    }

    // Adjust payment in ledger
    payment.amountPaid = Math.max(0, payment.amountPaid - refundAmt);
    payment.balanceDue = Math.max(0, payment.totalAmount - (payment.discount || 0) - payment.amountPaid);
    if (payment.amountPaid === 0) {
      payment.status = 'PENDING';
    } else if (payment.balanceDue > 0) {
      payment.status = 'PARTIAL';
    }
    payment.notes = (payment.notes ? payment.notes + ' | ' : '') + `[Refunded Rs. ${refundAmt} via ${payload.refundMethod || 'CASH'} on ${new Date().toLocaleDateString()}: ${payload.reason}]`;

    const salesReturn = {
      id: `ret-${Date.now()}`,
      returnNumber,
      paymentId: payment.id,
      invoiceNumber: payment.invoiceNumber || 'INV-UNKNOWN',
      patientId: payment.patientId,
      patientName: patient?.fullName || 'Patient',
      refundAmount: refundAmt,
      refundMethod: payload.refundMethod || 'CASH',
      reason: payload.reason,
      itemsReturned: payload.itemsReturned,
      processedBy: payload.actorId || 'receptionist@hospital.com',
      createdAt: new Date().toISOString()
    };

    if (payload.refundMethod === 'WALLET' && patient) {
      patient.advance_balance = (patient.advance_balance || 0) + refundAmt;
    }

    if (!db.salesReturns) db.salesReturns = [];
    db.salesReturns.unshift(salesReturn);
    db.saveToDisk();

    recordAuditLog({
      actorId: payload.actorId || 'SYSTEM',
      actorType: payload.actorRole || 'RECEPTIONIST',
      action: 'SALES_RETURN_REFUNDED',
      resourceType: 'Payment',
      resourceId: payment.id,
      newState: salesReturn
    });

    return {
      success: true,
      returnRecord: salesReturn,
      updatedPayment: payment
    };
  }

  /**
   * GET ALL SALES RETURNS / REFUNDS LOG
   */
  async getSalesReturns() {
    return db.salesReturns || [];
  }

  /**
   * WALLET TOP-UP FOR PATIENTS
   */
  async topUpWallet(payload: {
    patientId: string;
    amount: number;
    paymentMethod?: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER';
    actorId?: string;
    actorRole?: string;
  }) {
    const patient = db.patients.find(p => p.id === payload.patientId || p.userId === payload.patientId);
    if (!patient) throw AppError.notFound('Patient not found');

    const creditAmt = Number(payload.amount);
    if (creditAmt <= 0) throw AppError.badRequest('Top-up amount must be greater than 0');
    patient.advance_balance = (patient.advance_balance || 0) + creditAmt;

    const topUpPayment: DbPayment = {
      id: uuidv4(),
      invoiceNumber: `WAL-${Date.now().toString().slice(-6)}`,
      patientId: patient.id,
      totalAmount: creditAmt,
      discount: 0,
      amountPaid: creditAmt,
      balanceDue: 0,
      status: 'PAID',
      paymentMethod: payload.paymentMethod || 'CASH',
      category: 'PACKAGE',
      paymentPlan: 'FULL',
      notes: `Patient Prepaid Wallet Top-up of Rs. ${creditAmt}`,
      createdAt: new Date().toISOString()
    };

    db.payments.push(topUpPayment);
    db.saveToDisk();

    return {
      success: true,
      message: `Wallet credited with Rs. ${payload.amount}`,
      payment: topUpPayment
    };
  }

  /**
   * ADMIN BILLING LEDGER & HOSPITAL FINANCIAL SUMMARY
   */
  async getHospitalLedger() {
    const totalRevenue = db.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalOutstanding = db.payments.reduce((sum, p) => sum + p.balanceDue, 0);
    const totalDiscounts = db.payments.reduce((sum, p) => sum + (p.discount || 0), 0);

    const paidCount = db.payments.filter(p => p.status === 'PAID').length;
    const partialCount = db.payments.filter(p => p.status === 'PARTIAL').length;
    const pendingCount = db.payments.filter(p => p.status === 'PENDING').length;

    return {
      totalRevenue,
      totalOutstanding,
      totalDiscounts,
      currency: 'PKR',
      paidCount,
      partialCount,
      pendingCount,
      transactionCount: db.payments.length,
      recentTransactions: [...db.payments]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30)
    };
  }
}

export const billingService = new BillingService();
