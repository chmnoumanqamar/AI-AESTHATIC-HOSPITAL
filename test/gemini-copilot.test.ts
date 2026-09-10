import { aiAgentOrchestrator } from '../src/modules/ai-agent/ai.orchestrator';
import { patientCareService } from '../src/modules/patient/patient-care.service';
import { appointmentReminderService } from '../src/modules/appointment/appointment-reminder.service';
import { reportsService } from '../src/modules/reports/reports.service';
import { db } from '../src/common/data/mock-db';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runGeminiCopilotTestSuite() {
  console.log('\n========================================================');
  console.log('🤖 RUNNING GOOGLE GEMINI-GRADE AI COPILOT TEST SUITE');
  console.log('========================================================\n');

  // TEST 1: Multimodal Attachment Ingestion
  console.log('--- TEST GROUP 1: MULTIMODAL ATTACHMENT INGESTION ---');
  const validBase64 = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 simulated pdf document test').toString('base64');
  const multimodalRes = await aiAgentOrchestrator.processMessage(
    'Please analyze this attached lab blood test report',
    [],
    { userId: 'u-patient-01', patientId: 'pat-01', userRole: 'PATIENT', sessionId: 'sess-test-mm' },
    [
      {
        name: 'cbc_report.pdf',
        type: 'application/pdf',
        size: 1048576,
        data: validBase64
      }
    ]
  );
  assert(
    Boolean(multimodalRes.thoughtProcess?.steps.some((s: string) => s.toLowerCase().includes('multimodal') || s.toLowerCase().includes('attachment'))),
    'Multimodal: Gemini OCR steps triggered for attached documents'
  );
  assert(
    multimodalRes.cardData?.type === 'MULTIMODAL_FILE_ANALYSIS' && multimodalRes.cardData?.fileCount === 1,
    'Multimodal: Returns MULTIMODAL_FILE_ANALYSIS card data with attachment metrics'
  );

  // TEST 2: Autonomous 24-Module Navigation
  console.log('\n--- TEST GROUP 2: AUTONOMOUS 24-MODULE NAVIGATION ---');
  const navPharmacy = await aiAgentOrchestrator.processMessage(
    'open pharmacy inventory',
    [],
    { userId: 'u-admin-01', userRole: 'ADMIN', sessionId: 'sess-test-nav' }
  );
  assert(
    navPharmacy.navigationTarget?.moduleId === 'pharma_inventory' && navPharmacy.cardData?.type === 'NAVIGATE_MODULE',
    'Navigation: Maps "open pharmacy inventory" to pharma_inventory module'
  );

  const navVaultUrdu = await aiAgentOrchestrator.processMessage(
    'audit vault kholo',
    [],
    { userId: 'u-admin-01', userRole: 'ADMIN', sessionId: 'sess-test-nav2' }
  );
  assert(
    navVaultUrdu.navigationTarget?.moduleId === 'admin_audit' && navVaultUrdu.cardData?.type === 'NAVIGATE_MODULE',
    'Navigation: Maps Roman Urdu "audit vault kholo" to admin_audit module'
  );

  const navQueue = await aiAgentOrchestrator.processMessage(
    'take me to doctor queue',
    [],
    { userId: 'u-doc-01', userRole: 'DOCTOR', sessionId: 'sess-test-nav3' }
  );
  assert(
    navQueue.navigationTarget?.moduleId === 'doctor_queue' && navQueue.cardData?.type === 'NAVIGATE_MODULE',
    'Navigation: Maps "take me to doctor queue" to doctor_queue module'
  );

  // TEST 3: Deals & Aesthetic Package Tracker
  console.log('\n--- TEST GROUP 3: DEALS & AESTHETIC PACKAGE TRACKER ---');
  const patientPackages = patientCareService.getPatientPackages('pat-01');
  assert(patientPackages.length > 0, 'Packages: Demo patient has active aesthetic packages seeded');

  const primaryPkg = patientPackages[0];
  assert(
    primaryPkg.totalSessions === 3 && primaryPkg.completedSessions === 2 && primaryPkg.remainingSessions === 1,
    'Packages: Correctly tracks total (3), completed (2), and remaining (1) sessions'
  );

  const packageChat = await aiAgentOrchestrator.processMessage(
    'Show my treatment packages and remaining sessions',
    [],
    { userId: 'u-patient-01', patientId: 'pat-01', userRole: 'PATIENT', sessionId: 'sess-test-pkg' }
  );
  assert(
    packageChat.cardData?.type === 'PATIENT_PACKAGES' && packageChat.cardData?.hasPackages === true,
    'Packages: AI Copilot returns PATIENT_PACKAGES card with remaining session details'
  );

  // Book next package session
  const bookSessionRes = await patientCareService.bookPackageSession('pat-01', primaryPkg.id, 'doc-01', '2026-09-18');
  assert(bookSessionRes.success, 'Packages: Successfully books zero-fee remaining package session');
  assert(bookSessionRes.remainingSessions === 0, 'Packages: Decrements remaining sessions from 1 to 0');

  // TEST 4: Assigned Lab Tests & Reminders
  console.log('\n--- TEST GROUP 4: ASSIGNED DIAGNOSTIC LAB TESTS & REMINDERS ---');
  const pendingLabs = patientCareService.getPendingLabTests('pat-01');
  assert(pendingLabs.length > 0, 'Lab Tests: Demo patient has pending diagnostic tests');

  const labChat = await aiAgentOrchestrator.processMessage(
    'Show my assigned diagnostic lab tests and pending checkups',
    [],
    { userId: 'u-patient-01', patientId: 'pat-01', userRole: 'PATIENT', sessionId: 'sess-test-lab' }
  );
  assert(
    labChat.cardData?.type === 'ASSIGNED_LAB_TESTS' && labChat.cardData?.tests.length > 0,
    'Lab Tests: AI Copilot returns ASSIGNED_LAB_TESTS card with due dates and fasting guidance'
  );

  // Complete lab test
  const updateLab = patientCareService.updateLabTestStatus(pendingLabs[0].id, 'COMPLETED', 'Report verified by pathology');
  assert(updateLab?.status === 'COMPLETED', 'Lab Tests: Successfully transitions test status to COMPLETED');

  // TEST 5: Multi-Timeframe Hospital Reports (Yesterday, Week, Month)
  console.log('\n--- TEST GROUP 5: MULTI-TIMEFRAME HOSPITAL REPORTS ---');
  const yesterdayReport = await reportsService.getAnalytics('yesterday');
  assert(
    Boolean(yesterdayReport.summary && yesterdayReport.dateRange.formattedLabel.includes('Yesterday')),
    'Reports: Successfully calculates analytics KPIs for "yesterday"'
  );

  const weekReport = await reportsService.getAnalytics('weekly');
  assert(
    Boolean(weekReport.summary && weekReport.dateRange.formattedLabel.includes('Weekly')),
    'Reports: Successfully calculates analytics KPIs for "weekly"'
  );

  const reportChat = await aiAgentOrchestrator.processMessage(
    'Generate hospital performance report for yesterday',
    [],
    { userId: 'u-admin-01', userRole: 'ADMIN', sessionId: 'sess-test-rep' }
  );
  assert(
    reportChat.cardData?.type === 'REPORT_ANALYTICS' && reportChat.cardData?.kpis.totalGrossPKR > 0,
    'Reports: AI Copilot returns REPORT_ANALYTICS card with revenue, patients, and wait times'
  );

  // TEST 6: Progressive 5-Tier Appointment Countdown Reminders
  console.log('\n--- TEST GROUP 6: PROGRESSIVE 5-TIER COUNTDOWN REMINDERS ---');
  const now = new Date();
  const dateTodayStr = now.toISOString().split('T')[0];

  // Test tier calculation
  const cdInfo = appointmentReminderService.calculateCountdownInfo(dateTodayStr, 1);
  assert(
    ['1H', '3H', '6H', '12H', '24H', 'TODAY'].includes(cdInfo.tier),
    `Countdown: Resolves valid progressive reminder tier (${cdInfo.tier})`
  );
  assert(
    Boolean(cdInfo.label && cdInfo.stageMessage),
    'Countdown: Formulates human-friendly label and stage message'
  );

  const scanCountdown = await appointmentReminderService.scanAndDispatchUpcomingReminders(2);
  assert(
    typeof scanCountdown.dispatchedCount === 'number',
    'Countdown: Scans and dispatches countdown notifications without error'
  );

  // TEST 7: Thinking Stream, Grounding, and Response Tuning Metadata
  console.log('\n--- TEST GROUP 7: GEMINI METADATA (THINKING STREAM & GROUNDING) ---');
  const doctorScheduleChat = await aiAgentOrchestrator.processMessage(
    'Which specialist doctors are available today and what are their clinic hours?',
    [],
    { userId: 'u-patient-01', userRole: 'PATIENT', sessionId: 'sess-test-meta' }
  );
  assert(
    Boolean(doctorScheduleChat.thoughtProcess && doctorScheduleChat.thoughtProcess.steps.length > 0),
    'Gemini Metadata: Enriches response with multi-step thought process'
  );
  assert(
    Boolean(doctorScheduleChat.groundingSources && doctorScheduleChat.groundingSources.length > 0),
    'Gemini Metadata: Enriches response with verified grounding citations'
  );
  assert(
    Boolean(doctorScheduleChat.followUpChips && doctorScheduleChat.followUpChips.length > 0),
    'Gemini Metadata: Generates contextual interactive follow-up suggestion chips'
  );

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGeminiCopilotTestSuite().catch(err => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
