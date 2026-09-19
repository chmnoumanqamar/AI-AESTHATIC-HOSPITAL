import { reportsService } from '../../reports/reports.service';

export async function generateHospitalReport(
  period: 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'yearly' | 'custom' = 'daily',
  doctorId?: string,
  customRange?: { startDate: string; endDate: string }
): Promise<any> {
  const analytics = await reportsService.getAnalytics(period, doctorId, customRange);

  return {
    period: analytics.period,
    formattedLabel: analytics.dateRange.formattedLabel,
    dateRange: analytics.dateRange,
    kpis: {
      totalRevenuePKR: analytics.summary.totalRevenue,
      totalGrossPKR: analytics.summary.totalGross,
      collectionRate: analytics.summary.collectionRate,
      totalPatients: analytics.summary.totalPatients,
      totalAppointments: analytics.summary.totalAppointments,
      completedConsultations: analytics.summary.completedConsultations,
      avgWaitTimeMins: analytics.summary.averageWaitTimeMinutes,
      avgConsultationMins: analytics.summary.averageConsultationMinutes
    },
    topCategories: analytics.categoryBreakdown.slice(0, 4),
    paymentMethods: analytics.paymentMethodBreakdown,
    doctorBreakdown: analytics.doctorPerformance,
    recentTransactions: analytics.transactions.slice(0, 5)
  };
}
