import { authService } from '../src/modules/auth/auth.service';
import { patientService } from '../src/modules/patient/patient.service';
import { doctorService } from '../src/modules/doctor/doctor.service';
import { tokenService } from '../src/modules/token/token.service';
import { appointmentService } from '../src/modules/appointment/appointment.service';
import { queueService } from '../src/modules/queue/queue.service';
import { clinicalService } from '../src/modules/clinical/clinical.service';
import { prescriptionVersionService } from '../src/modules/clinical/prescription-version.service';
import { notificationService } from '../src/modules/notification/notification.service';
import { medicalSafetyGuard } from '../src/modules/ai-agent/safety/medical-safety.guard';
import { aiAgentOrchestrator } from '../src/modules/ai-agent/ai.orchestrator';
import { appointmentReminderService } from '../src/modules/appointment/appointment-reminder.service';
import { sanitizeClinicalResponse } from '../src/common/middleware/rbac.middleware';
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

async function runSystemTestSuite() {
  console.log('\n========================================================');
  console.log('🧪 RUNNING HOSPITAL MANAGEMENT SYSTEM ARCHITECTURAL TESTS');
  console.log('========================================================\n');

  // TEST 1: Token Engine - Mathematical Invariants & Non-Reusability
  console.log('--- TEST GROUP 1: MATHEMATICAL TOKEN ENGINE & NON-REUSABILITY ---');
  const today = new Date().toISOString().split('T')[0];
  const doc1Id = 'doc-01';

  const matrixBefore = await tokenService.getDoctorTokensMatrix(doc1Id, today);
  const allocatedToken = await tokenService.allocateToken(doc1Id, today);
  assert(
    allocatedToken.tokenNumber === matrixBefore.maxSequenceIssued + 1,
    'Sequential Token Number Allocation (T_max + 1)',
    `Expected ${matrixBefore.maxSequenceIssued + 1}, got ${allocatedToken.tokenNumber}`
  );

  await tokenService.cancelToken(allocatedToken.id);
  const matrixAfterCancel = await tokenService.getDoctorTokensMatrix(doc1Id, today);
  const nextTokenAfterCancel = await tokenService.allocateToken(doc1Id, today);

  assert(
    nextTokenAfterCancel.tokenNumber > allocatedToken.tokenNumber,
    'Non-Reusability Rule: Cancelled token slot is permanently locked and never reassigned',
    `Cancelled was #${allocatedToken.tokenNumber}, Next is #${nextTokenAfterCancel.tokenNumber}`
  );

  // TEST 2: Queue Engine - "Call Next Patient" Skip Logic
  console.log('\n--- TEST GROUP 2: QUEUE ENGINE "CALL NEXT" SKIP LOGIC ---');
  // In seed: Token 3 is NOT_CHECKED_IN, Token 4 is WAITING
  const callNextResult = await queueService.callNextPatient(doc1Id, 'u-doc-01', 'DOCTOR');
  assert(
    callNextResult.tokenNumber === 4,
    'Call Next Algorithm skips Token 3 (NOT_CHECKED_IN) and summons Token 4 (WAITING)',
    `Expected Token #4, got Token #${callNextResult.tokenNumber}`
  );
  assert(
    callNextResult.calledQueueEntry.queueStatus === 'CALLED',
    'Called Queue Entry mutated from WAITING -> CALLED'
  );

  // TEST 3: Prescription Versioning Engine (Immutable Git-Style Diff)
  console.log('\n--- TEST GROUP 3: PRESCRIPTION VERSIONING (v1 -> v2 IMMUTABILITY) ---');
  const rxAudit = await prescriptionVersionService.getPrescriptionAuditView('rx-01');
  assert(
    rxAudit.versionsCount >= 2,
    'Prescription contains immutable version history (v1 and v2 exist simultaneously)'
  );
  const v1 = rxAudit.versions.find(v => v.versionNumber === 1);
  const v2 = rxAudit.versions.find(v => v.versionNumber === 2);
  assert(v1?.isCurrent === false, 'Superseded Version 1 marked isCurrent = false');
  assert(v2?.isCurrent === true, 'Updated Version 2 marked isCurrent = true');
  assert(
    Boolean(v2?.correctionReason && v2.correctionReason.length > 5),
    'Mandatory correction reason captured on version creation'
  );

  // TEST 4: Clinical Privacy Wall (API-Level Redaction)
  console.log('\n--- TEST GROUP 4: CLINICAL PRIVACY WALL & RBAC REDACTION ---');
  const sampleClinicalRecord = {
    id: 'cr-test',
    diagnosis: 'Cardiomegaly',
    examinationNotes: 'Systolic murmur audible at apex',
    chiefComplaint: 'Chest tightness',
    treatmentPlan: 'Echocardiogram required',
    privateNotes: 'Sensitive doctor private note: patient expressed psychological stress',
    prescriptions: [{ id: 'rx-test', versions: [{ versionNumber: 1, isCurrent: false }, { versionNumber: 2, isCurrent: true }] }]
  };

  const receptionistView = sanitizeClinicalResponse('RECEPTIONIST', sampleClinicalRecord);
  assert(
    receptionistView.diagnosis === undefined &&
    receptionistView.examinationNotes === undefined &&
    receptionistView.privateNotes === undefined &&
    receptionistView.prescriptions === undefined,
    'Receptionist Privacy Wall: Absolute zero access to Diagnosis, Exam, Notes, Prescriptions'
  );

  const patientView = sanitizeClinicalResponse('PATIENT', sampleClinicalRecord);
  assert(
    patientView.diagnosis === 'Cardiomegaly' &&
    patientView.privateNotes === undefined &&
    patientView.prescriptions[0].versions.length === 1 &&
    patientView.prescriptions[0].versions[0].isCurrent === true,
    'Patient Privacy View: Has diagnosis and active Rx (v2 only), doctor private notes redacted'
  );

  // TEST 5: Duplicate Detection Routine
  console.log('\n--- TEST GROUP 5: PATIENT DUPLICATE DETECTION ROUTINE ---');
  const dupCheck = await patientService.checkDuplicate({ cnic: '35201-1234567-1' });
  assert(
    dupCheck.isDuplicate === true && dupCheck.matchType === 'CNIC',
    'Duplicate detection identifies existing CNIC and returns masked summary'
  );
  assert(
    Boolean(dupCheck.maskedCnic && dupCheck.maskedCnic.includes('***')),
    'Duplicate detection masks sensitive CNIC in response payload'
  );

  // TEST 6: Medical Safety Guardrails & Diagnostic Deflection
  console.log('\n--- TEST GROUP 6: AI MEDICAL SAFETY GUARDRAILS ---');
  const diagnosticPrompt = 'What disease is causing my high blood pressure and please prescribe me an antibiotic for infection';
  const safetyResult = medicalSafetyGuard.evaluatePrompt(diagnosticPrompt);
  assert(
    safetyResult.isSafe === false && safetyResult.deflectionMessage !== undefined,
    'Diagnostic & self-prescription query unconditionally deflected with medical disclaimer'
  );

  const aiChatResponse = await aiAgentOrchestrator.processMessage(
    'Can you diagnose my fever and write a prescription?',
    [],
    { userId: 'u-pat-01', patientId: 'pat-01', userRole: 'PATIENT', sessionId: 'test-session-1' }
  );
  assert(
    aiChatResponse.cardData?.type === 'SAFETY_DISCLAIMER' || aiChatResponse.content.includes('cannot provide medical diagnoses'),
    'AI Orchestrator intercepts diagnostic query and returns safety disclaimer card'
  );

  // TEST 7: Notification Failover Pipeline
  console.log('\n--- TEST GROUP 7: NOTIFICATION PRIMARY -> BACKUP FAILOVER ---');
  const notifLog = await notificationService.dispatchNotification(
    'pat-01',
    'APPOINTMENT_CONFIRMATION',
    'Your appointment is confirmed for today.'
  );
  assert(
    notifLog.channelsAttempted.length >= 1 && ['DELIVERED_PRIMARY', 'DELIVERED_BACKUP_FAILOVER'].includes(notifLog.finalStatus),
    'Notification pipeline dispatches to primary channel and logs immutable entry'
  );

  // TEST 8: Admin Master Access & User Blocking / Granting Controls
  console.log('\n--- TEST GROUP 8: ADMIN USER ACCESS, BLOCKING & PRIVILEGES ---');
  const { adminService } = await import('../src/modules/admin/admin.service');
  
  // 8.1: Fetch all registered users
  const allUsers = await adminService.getAllUsers();
  assert(allUsers.length >= 4, 'Admin can view all registered users across all roles', `Found ${allUsers.length} users`);

  // 8.2: Admin blocks user access
  const targetUser = allUsers.find(u => u.role === 'PATIENT')!;
  const blockedResult = await adminService.updateUserAccess(targetUser.id, true, 'Violation of hospital terms', 'u-admin-01');
  assert(blockedResult.isBlocked === true, 'Admin successfully blocks patient access');

  // 8.3: Blocked user cannot log in
  let loginBlocked = false;
  try {
    await authService.login({ identifier: targetUser.phone, password: 'Password123!' });
  } catch (err: any) {
    if (err.statusCode === 403) loginBlocked = true;
  }
  assert(loginBlocked, 'Blocked user is rejected with 403 Forbidden on login');

  // 8.4: Admin unblocks and restores access
  const restoredResult = await adminService.updateUserAccess(targetUser.id, false, undefined, 'u-admin-01');
  assert(restoredResult.isBlocked === false, 'Admin restores and grants access back to user');

  // 8.5: Unblocked user can log in again
  const loginRestored = await authService.login({ identifier: targetUser.phone, password: 'Password123!' });
  assert(loginRestored.token !== undefined, 'User successfully logs in after admin grants access back');

  // 8.6: Admin creates new staff user & grants access
  const newDoctorPhone = `+155500000${Math.floor(Math.random() * 900) + 100}`;
  const newStaff = await adminService.createUser({
    name: 'Dr. Zeeshan Ali',
    phone: newDoctorPhone,
    email: `dr.zeeshan.${Date.now()}@hospital.com`,
    password: 'Password123!',
    role: 'DOCTOR',
    specialization: 'Neurology'
  }, 'u-admin-01');
  assert(newStaff.role === 'DOCTOR', 'Admin creates new staff member and grants access to clinical deck');

  // 8.7: Safety Invariant: Root Admin cannot be blocked
  let rootAdminBlocked = false;
  try {
    await adminService.updateUserAccess('u-admin-01', true, 'Trying to lock root', 'u-admin-01');
  } catch (err: any) {
    if (err.statusCode === 400) rootAdminBlocked = true;
  }
  assert(rootAdminBlocked, 'Safety invariant prevents primary Administrator from lockout');

  // TEST GROUP 9: END-TO-END WORKFLOW, 48H REMINDER ENGINE & MULTI-LINGUAL CHATBOT
  console.log('\n--- TEST GROUP 9: END-TO-END WORKFLOW, 48H REMINDER ENGINE & MULTI-LINGUAL CHATBOT ---');

  // 9.1: Add new doctor
  const docPhone = `+155500000${Math.floor(Math.random() * 800) + 100}`;
  const newDoctorStaff = await adminService.createUser({
    name: 'Dr. Tariq Mahmood',
    phone: docPhone,
    email: `dr.tariq.${Date.now()}@hospital.com`,
    password: 'Password123!',
    role: 'DOCTOR',
    specialization: 'Orthopedics'
  }, 'u-admin-01');
  const createdDoctorProfile = db.doctors.find(d => d.userId === newDoctorStaff.id);
  assert(Boolean(createdDoctorProfile), 'End-to-End: Admin successfully adds new specialist doctor with profile');

  // 9.2: Register new patient
  const patPhone = `+155599900${Math.floor(Math.random() * 80) + 10}`;
  const newPatientReg = await authService.registerPatient({
    fullName: 'Fatima Noor',
    phone: patPhone,
    email: `fatima.${Date.now()}@example.com`,
    password: 'Password123!',
    cnic: `35201-${Math.floor(Math.random() * 8999999) + 1000000}-1`,
    gender: 'Female',
    dateOfBirth: '1995-06-15',
    address: 'Gulberg III, Lahore',
    emergencyContact: '+15559991111',
    hasWhatsApp: true,
    primaryNotificationChannel: 'WhatsApp'
  });
  assert(Boolean(newPatientReg.user.profileId), 'End-to-End: New patient registered successfully');

  // 9.3: Book appointment for today
  const booking = await appointmentService.createBooking({
    patientId: newPatientReg.user.profileId!,
    doctorId: createdDoctorProfile!.id,
    appointmentDate: today,
    bookingSource: 'PORTAL'
  }, newPatientReg.user.id, 'PATIENT');
  assert(booking.status === 'PENDING' && typeof booking.tokenNumber === 'number', 'End-to-End: Patient books appointment and receives sequential token');

  // 9.4: Front-Desk Receptionist approves/confirms booking & checks in patient
  const confirmedBooking = await appointmentService.updateStatus(booking.id, { status: 'CONFIRMED' }, 'u-recep-01', 'RECEPTIONIST');
  assert(confirmedBooking.status === 'CONFIRMED', 'End-to-End: Receptionist confirms patient booking');
  await queueService.checkInPatient(booking.id, 'u-recep-01', 'RECEPTIONIST');

  // 9.5: Doctor summons patient in live queue
  const calledPatient = await queueService.callNextPatient(createdDoctorProfile!.id, newDoctorStaff.id, 'DOCTOR');
  assert(calledPatient.calledQueueEntry.appointmentId === booking.id && calledPatient.calledQueueEntry.queueStatus === 'CALLED', 'End-to-End: Doctor summons patient in live queue');

  // 9.6: Doctor completes consultation and records follow-up session (1 week out)
  const clinicalRec = await clinicalService.createRecord({
    appointmentId: booking.id,
    patientId: newPatientReg.user.profileId!,
    chiefComplaint: 'Severe knee pain and stiffness',
    examinationNotes: 'Mild swelling on right patella',
    diagnosis: 'Patellofemoral syndrome',
    treatmentPlan: 'Physiotherapy exercises and follow up in 1 week',
    medications: [
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' }
    ]
  }, createdDoctorProfile!.id);
  assert(Boolean(clinicalRec.prescription) && clinicalRec.prescription?.activeVersion.versionNumber === 1, 'End-to-End: Doctor completes consultation, prescription v1 and schedules follow-up');

  // 9.7: Book an upcoming follow-up session within 48h
  const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const followUpBooking = await appointmentService.createBooking({
    patientId: newPatientReg.user.profileId!,
    doctorId: createdDoctorProfile!.id,
    appointmentDate: tomorrowDate,
    bookingSource: 'PORTAL'
  }, newPatientReg.user.id, 'PATIENT');
  await appointmentService.updateStatus(followUpBooking.id, { status: 'CONFIRMED' }, 'u-recep-01', 'RECEPTIONIST');

  // 9.8: Automated 48-Hour Reminder Engine Scan
  const reminderResult = await appointmentReminderService.scanAndDispatchUpcomingReminders(2);
  assert(reminderResult.dispatchedCount >= 1, 'Reminder Engine: Scans upcoming 48-hour appointments and dispatches reminder');

  // 9.9: Patient upcoming reminders query
  const patientReminders = await appointmentReminderService.getUpcomingRemindersForPatient(newPatientReg.user.profileId!);
  assert(patientReminders.length > 0 && patientReminders[0].isUpcomingSoon, 'Reminder Engine: Correctly flags appointment within 48h for patient');

  // 9.10: Multi-Lingual AI Chatbot - Roman Urdu detection and response
  const chatRomanUrdu = await aiAgentOrchestrator.processMessage(
    'Meri appointment kab hai?',
    [],
    { userId: newPatientReg.user.id, patientId: newPatientReg.user.profileId!, userRole: 'PATIENT', sessionId: 's-test-01' }
  );
  assert(chatRomanUrdu.content.includes('Reminder') && (chatRomanUrdu.content.includes('Dr.') || chatRomanUrdu.content.includes('appointment')), 'AI Chatbot: Responds to Roman Urdu query with appointment reminder details');

  // 9.11: Multi-Lingual AI Chatbot - Medical safety guardrail in Roman Urdu
  const safetyRomanUrdu = await aiAgentOrchestrator.processMessage(
    'Mujhe bukhar hai dawa batao',
    [],
    { userId: newPatientReg.user.id, patientId: newPatientReg.user.profileId!, userRole: 'PATIENT', sessionId: 's-test-02' }
  );
  assert(safetyRomanUrdu.cardData?.type === 'SAFETY_DISCLAIMER', 'AI Chatbot: Deflects diagnostic query with safety protocol in Roman Urdu');

  // 9.12: AI Chatbot - Pharmacy & Dispensary Facility Inquiry (Roman Urdu & English)
  const pharmaInquiry = await aiAgentOrchestrator.processMessage(
    'Hospital pharmacy khuli hai aur dispensary kahan hai?',
    [],
    { userId: newPatientReg.user.id, patientId: newPatientReg.user.profileId!, userRole: 'PATIENT', sessionId: 's-test-03' }
  );
  assert(
    pharmaInquiry.content.includes('Pharmacy') && pharmaInquiry.content.includes('24/7') && pharmaInquiry.cardData?.type === 'PHARMACY_INFO_CARD',
    'AI Chatbot: Correctly provides 24/7 hospital pharmacy hours and location info'
  );

  // 9.13: AI Chatbot - Specific Medicine Inventory Stock & Pricing in PKR
  const medStockCheck = await aiAgentOrchestrator.processMessage(
    'Augmentin 625mg stock mein available hai aur price kya hai?',
    [],
    { userId: newPatientReg.user.id, patientId: newPatientReg.user.profileId!, userRole: 'PATIENT', sessionId: 's-test-04' }
  );
  assert(
    medStockCheck.content.includes('Augmentin') && medStockCheck.content.includes('PKR') && medStockCheck.cardData?.type === 'MEDICINE_INFO_CARD',
    'AI Chatbot: Accurately checks medicine inventory stock and returns PKR unit pricing'
  );

  // 9.14: AI Chatbot - Pharmacist Role Live Dispense Queue Overview
  const pharmacistQueueCheck = await aiAgentOrchestrator.processMessage(
    'Show pending prescriptions in live dispense queue',
    [],
    { userId: 'u-pharma-01', userRole: 'PHARMACIST', sessionId: 's-test-05' }
  );
  assert(
    pharmacistQueueCheck.cardData?.type === 'PHARMACY_QUEUE_CARD',
    'AI Chatbot: Generates live dispense queue report for Pharmacist staff role'
  );

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSystemTestSuite().catch(e => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
