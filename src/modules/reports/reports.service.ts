import { db, DbPayment } from '../../common/data/mock-db';

export interface ReportsAnalyticsResult {
  period: 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  dateRange: {
    startDate: string;
    endDate: string;
    formattedLabel: string;
  };
  summary: {
    totalRevenue: number;
    totalGross: number;
    totalDiscounts: number;
    totalOutstanding: number;
    collectionRate: number;
    totalPatients: number;
    totalAppointments: number;
    completedConsultations: number;
    averageWaitTimeMinutes: number;
    averageConsultationMinutes: number;
  };
  timeSeries: Array<{
    label: string;
    key: string;
    revenue: number;
    patients: number;
    appointments: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    label: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    label: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  doctorPerformance: Array<{
    doctorId: string;
    doctorName: string;
    specialization: string;
    patientCount: number;
    revenue: number;
  }>;
  transactions: Array<{
    id: string;
    invoiceNumber: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    category: string;
    paymentMethod: string;
    totalAmount: number;
    discount: number;
    amountPaid: number;
    balanceDue: number;
    status: string;
    createdAt: string;
  }>;
}

export class ReportsService {
  async getAnalytics(
    period: 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'yearly' | 'custom' = 'daily',
    doctorId?: string,
    customRange?: { startDate: string; endDate: string }
  ): Promise<ReportsAnalyticsResult> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let formattedLabel = '';

    if (period === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      formattedLabel = `Yesterday • ${startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      formattedLabel = `Today • ${now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (period === 'weekly') {
      startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      formattedLabel = `Weekly (Last 7 Days) • ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (period === 'monthly') {
      startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      formattedLabel = `Monthly (Last 30 Days) • ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (period === 'custom' && customRange) {
      startDate = new Date(customRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      formattedLabel = `Custom Range • ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      // Yearly
      startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1, 0, 0, 0, 0);
      formattedLabel = `Annual Performance • Last 12 Months (${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;
    }

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    // 1. Filter Appointments
    let periodAppointments = db.appointments.filter(a => {
      const aDate = a.createdAt || a.appointmentDate;
      return aDate >= startIso && aDate <= endIso;
    });

    // 2. Filter Payments
    let periodPayments = db.payments.filter(p => {
      const pDate = p.createdAt;
      return pDate >= startIso && pDate <= endIso;
    });

    if (doctorId) {
      const aptIdsForDoc = new Set(
        db.appointments.filter(a => a.doctorId === doctorId).map(a => a.id)
      );
      periodAppointments = periodAppointments.filter(a => a.doctorId === doctorId);
      periodPayments = periodPayments.filter(p => p.appointmentId && aptIdsForDoc.has(p.appointmentId));
    }

    // 3. Filter Queue Entries
    const aptIdsInPeriod = new Set(periodAppointments.map(a => a.id));
    const periodQueueEntries = db.queueEntries.filter(q => aptIdsInPeriod.has(q.appointmentId));

    // Summary Totals
    const totalRevenue = periodPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const totalGross = periodPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalDiscounts = periodPayments.reduce((sum, p) => sum + (p.discount || 0), 0);
    const totalOutstanding = periodPayments.reduce((sum, p) => sum + (p.balanceDue || 0), 0);
    const collectionRate = totalGross > 0 ? Math.round(((totalGross - totalOutstanding) / totalGross) * 100) : 100;

    const uniquePatients = new Set([
      ...periodAppointments.map(a => a.patientId),
      ...periodPayments.map(p => p.patientId)
    ]);
    const totalPatients = uniquePatients.size;
    const totalAppointments = periodAppointments.length;
    const completedConsultations = periodQueueEntries.filter(q => q.queueStatus === 'COMPLETED').length;

    // Wait Time & Consultation Duration Calculation
    let totalWaitMins = 0;
    let waitCount = 0;
    let totalConsultMins = 0;
    let consultCount = 0;

    for (const q of periodQueueEntries) {
      if (q.checkInTime && (q.calledTime || q.consultationStartTime)) {
        const checkIn = new Date(q.checkInTime).getTime();
        const start = new Date(q.consultationStartTime || q.calledTime!).getTime();
        const diffMins = Math.max(0, Math.round((start - checkIn) / 60000));
        if (diffMins < 300) { // filter outliers
          totalWaitMins += diffMins;
          waitCount++;
        }
      }
      if (q.consultationStartTime && q.consultationEndTime) {
        const start = new Date(q.consultationStartTime).getTime();
        const end = new Date(q.consultationEndTime).getTime();
        const diffMins = Math.max(0, Math.round((end - start) / 60000));
        if (diffMins < 120) {
          totalConsultMins += diffMins;
          consultCount++;
        }
      }
    }

    const averageWaitTimeMinutes = waitCount > 0 ? Math.round(totalWaitMins / waitCount) : 16;
    const averageConsultationMinutes = consultCount > 0 ? Math.round(totalConsultMins / consultCount) : 22;

    // 4. Time Series Generation
    const timeSeries: Array<{ label: string; key: string; revenue: number; patients: number; appointments: number }> = [];

    if (period === 'daily') {
      const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      for (const h of hours) {
        const hourLabel = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
        const hourPayments = periodPayments.filter(p => {
          const dt = new Date(p.createdAt);
          return dt.getHours() === h;
        });
        const hourApts = periodAppointments.filter(a => {
          const dt = new Date(a.createdAt || a.appointmentDate);
          return dt.getHours() === h;
        });
        const hourPatients = new Set([...hourPayments.map(p => p.patientId), ...hourApts.map(a => a.patientId)]);

        timeSeries.push({
          label: hourLabel,
          key: `H${h}`,
          revenue: hourPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          patients: hourPatients.size,
          appointments: hourApts.length
        });
      }
    } else if (period === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

        const dayPayments = periodPayments.filter(p => p.createdAt.startsWith(dayStr));
        const dayApts = periodAppointments.filter(a => (a.createdAt || a.appointmentDate).startsWith(dayStr));
        const dayPatients = new Set([...dayPayments.map(p => p.patientId), ...dayApts.map(a => a.patientId)]);

        timeSeries.push({
          label: dayLabel,
          key: dayStr,
          revenue: dayPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          patients: dayPatients.size,
          appointments: dayApts.length
        });
      }
    } else if (period === 'monthly') {
      // 6 intervals of 5 days each
      for (let interval = 5; interval >= 0; interval--) {
        const intervalEnd = new Date(now.getTime() - interval * 5 * 24 * 60 * 60 * 1000);
        const intervalStart = new Date(intervalEnd.getTime() - 4 * 24 * 60 * 60 * 1000);
        const startStr = intervalStart.toISOString().split('T')[0];
        const endStr = intervalEnd.toISOString().split('T')[0];
        const label = `${intervalStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${intervalEnd.toLocaleDateString('en-US', { day: 'numeric' })}`;

        const intPayments = periodPayments.filter(p => {
          const dtStr = p.createdAt.split('T')[0];
          return dtStr >= startStr && dtStr <= endStr;
        });
        const intApts = periodAppointments.filter(a => {
          const dtStr = (a.createdAt || a.appointmentDate).split('T')[0];
          return dtStr >= startStr && dtStr <= endStr;
        });
        const intPatients = new Set([...intPayments.map(p => p.patientId), ...intApts.map(a => a.patientId)]);

        timeSeries.push({
          label,
          key: `${startStr}_${endStr}`,
          revenue: intPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          patients: intPatients.size,
          appointments: intApts.length
        });
      }
    } else {
      // Yearly: 12 months
      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        const mPayments = periodPayments.filter(p => p.createdAt.startsWith(yearMonth));
        const mApts = periodAppointments.filter(a => (a.createdAt || a.appointmentDate).startsWith(yearMonth));
        const mPatients = new Set([...mPayments.map(p => p.patientId), ...mApts.map(a => a.patientId)]);

        timeSeries.push({
          label: monthLabel,
          key: yearMonth,
          revenue: mPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          patients: mPatients.size,
          appointments: mApts.length
        });
      }
    }

    // 5. Category Breakdown
    const categoryLabels: Record<string, string> = {
      CONSULTATION: 'Doctor Consultation',
      PROCEDURE: 'Clinical & Aesthetic Procedure',
      LAB_TEST: 'Diagnostic & Lab Investigation',
      PHARMACY: 'Pharmacy & Prescriptions',
      EMERGENCY: 'Emergency & Triage Copay'
    };

    const categoryStats: Record<string, { count: number; revenue: number }> = {};
    for (const p of periodPayments) {
      const cat = p.category || 'CONSULTATION';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, revenue: 0 };
      }
      categoryStats[cat].count++;
      categoryStats[cat].revenue += (p.amountPaid || 0);
    }

    const categoryBreakdown = Object.keys(categoryLabels).map(catKey => {
      const stat = categoryStats[catKey] || { count: 0, revenue: 0 };
      const percentage = totalRevenue > 0 ? Math.round((stat.revenue / totalRevenue) * 100) : 0;
      return {
        category: catKey,
        label: categoryLabels[catKey],
        count: stat.count,
        revenue: stat.revenue,
        percentage
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 6. Payment Method Breakdown
    const methodLabels: Record<string, string> = {
      CASH: 'Cash (PKR)',
      CARD: 'Debit/Credit Card',
      JAZZCASH: 'JazzCash Mobile',
      EASYPAISA: 'EasyPaisa Mobile',
      BANK_TRANSFER: 'Bank IBFT / Raast',
      INSURANCE: 'Insurance / Corporate Panel'
    };

    const methodStats: Record<string, { count: number; revenue: number }> = {};
    for (const p of periodPayments) {
      const m = p.paymentMethod || 'CASH';
      if (!methodStats[m]) {
        methodStats[m] = { count: 0, revenue: 0 };
      }
      methodStats[m].count++;
      methodStats[m].revenue += (p.amountPaid || 0);
    }

    const paymentMethodBreakdown = Object.keys(methodLabels).map(mKey => {
      const stat = methodStats[mKey] || { count: 0, revenue: 0 };
      const percentage = totalRevenue > 0 ? Math.round((stat.revenue / totalRevenue) * 100) : 0;
      return {
        method: mKey,
        label: methodLabels[mKey],
        count: stat.count,
        revenue: stat.revenue,
        percentage
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 7. Doctor Performance
    const doctorPerformance = db.doctors.map(doc => {
      const docApts = periodAppointments.filter(a => a.doctorId === doc.id);
      const docAptIds = new Set(docApts.map(a => a.id));
      const docPayments = periodPayments.filter(p => p.appointmentId && docAptIds.has(p.appointmentId));
      const docRevenue = docPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      const uniquePats = new Set(docApts.map(a => a.patientId));

      return {
        doctorId: doc.id,
        doctorName: doc.name,
        specialization: doc.specialization,
        patientCount: uniquePats.size || docApts.length,
        revenue: docRevenue
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 8. Enriched Transactions
    const patientMap = new Map(db.patients.map(p => [p.id, p.fullName]));
    const aptDocMap = new Map(db.appointments.map(a => {
      const doc = db.doctors.find(d => d.id === a.doctorId);
      return [a.id, doc?.name || 'General Clinic'];
    }));

    const transactions = [...periodPayments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(p => ({
        id: p.id,
        invoiceNumber: p.invoiceNumber || `INV-${p.id.slice(0, 6).toUpperCase()}`,
        patientId: p.patientId,
        patientName: patientMap.get(p.patientId) || 'Walk-in Patient',
        doctorName: p.appointmentId ? (aptDocMap.get(p.appointmentId) || 'Staff Physician') : 'Front Desk Billing',
        category: p.category || 'CONSULTATION',
        paymentMethod: p.paymentMethod || 'CASH',
        totalAmount: p.totalAmount,
        discount: p.discount || 0,
        amountPaid: p.amountPaid,
        balanceDue: p.balanceDue,
        status: p.status,
        createdAt: p.createdAt
      }));

    return {
      period,
      dateRange: {
        startDate: startIso,
        endDate: endIso,
        formattedLabel
      },
      summary: {
        totalRevenue,
        totalGross,
        totalDiscounts,
        totalOutstanding,
        collectionRate,
        totalPatients,
        totalAppointments,
        completedConsultations,
        averageWaitTimeMinutes,
        averageConsultationMinutes
      },
      timeSeries,
      categoryBreakdown,
      paymentMethodBreakdown,
      doctorPerformance,
      transactions
    };
  }
}

export const reportsService = new ReportsService();
