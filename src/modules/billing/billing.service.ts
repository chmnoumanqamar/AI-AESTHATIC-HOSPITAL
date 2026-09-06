import { v4 as uuidv4 } from 'uuid';
import { db, DbPayment } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { recordAuditLog } from '../../common/middleware/audit.middleware';

export interface RecordPaymentPayload {
  patientId: string;
  appointmentId?: string;
  amount: number;
  totalAmount?: number;
  discount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER' | 'INSURANCE';
  category?: 'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'PHARMACY' | 'EMERGENCY';
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
    const advanceCredit = totalPaid > netPayable ? totalPaid - netPayable : 0;

    let financialStatus: 'CLEAR' | 'PENDING' | 'PARTIAL' = 'CLEAR';
    if (balanceDue > 0) {
      financialStatus = totalPaid > 0 ? 'PARTIAL' : 'PENDING';
    }

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

    const payment: DbPayment = {
      id: uuidv4(),
      invoiceNumber,
      patientId: payload.patientId,
      appointmentId: payload.appointmentId,
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
