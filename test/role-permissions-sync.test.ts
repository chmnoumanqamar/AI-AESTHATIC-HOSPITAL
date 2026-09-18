import { db } from '../src/common/data/mock-db';
import { adminService } from '../src/modules/admin/admin.service';
import { authService } from '../src/modules/auth/auth.service';

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

const BASE_URL = 'http://localhost:4000/api';

async function fetchJson(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function loginUser(identifier: string, password: string = 'Password123!') {
  const res = await fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  });
  if (!res.ok || !res.data?.data?.token) {
    throw new Error(`Failed to login user: ${identifier} -> ${JSON.stringify(res.data)}`);
  }
  return {
    token: res.data.data.token,
    user: res.data.data.user
  };
}

export async function runRolePermissionsSyncSuite() {
  console.log('\n================================================================');
  console.log('🧪 COMPREHENSIVE ROLE PERMISSIONS READ/WRITE/DELETE SYNC SUITE');
  console.log('================================================================\n');

  // Authenticate Admin and Roles
  const admin = await loginUser('admin');
  const receptionist = await loginUser('receptionist');
  const doctor = await loginUser('doctor');
  const pharmacist = await loginUser('pharmacist');
  const patient = await loginUser('patient');

  assert(admin.user.role === 'ADMIN', 'Auth Setup: Admin logged in with role ADMIN');
  assert(receptionist.user.role === 'RECEPTIONIST', 'Auth Setup: Receptionist logged in with role RECEPTIONIST');
  assert(doctor.user.role === 'DOCTOR', 'Auth Setup: Doctor logged in with role DOCTOR');
  assert(pharmacist.user.role === 'PHARMACIST', 'Auth Setup: Pharmacist logged in with role PHARMACIST');
  assert(patient.user.role === 'PATIENT', 'Auth Setup: Patient logged in with role PATIENT');

  // Helper to update role permissions as Admin
  const setRolePerms = async (role: string, permissions: Array<{ moduleId: string; read: boolean; write: boolean; delete: boolean }>) => {
    const res = await fetchJson(`/admin/role-permissions/${role}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${admin.token}` },
      body: JSON.stringify({ permissions })
    });
    return res;
  };

  // -------------------------------------------------------------
  // 1. RECEPTIONIST ROLE PERMISSION MATRIX
  // -------------------------------------------------------------
  console.log('\n--- 1. RECEPTIONIST PERMISSION SYNCHRONIZATION ---');

  // 1.1 Front-Desk Billing POS (recep_pos): Read-Only vs Write
  console.log('  Testing recep_pos (Front-Desk Billing POS)...');
  await setRolePerms('RECEPTIONIST', [
    { moduleId: 'recep_desk', read: true, write: true, delete: false },
    { moduleId: 'recep_approvals', read: true, write: true, delete: true },
    { moduleId: 'recep_pos', read: true, write: false, delete: false }, // WRITE OFF
    { moduleId: 'recep_reports', read: false, write: false, delete: false }
  ]);

  // Read action (lookup patient billing summary) should succeed
  const readPatientBilling = await fetchJson('/billing/patient/pat-01', {
    headers: { Authorization: `Bearer ${receptionist.token}` }
  });
  assert(readPatientBilling.status === 200, 'recep_pos [Read Only]: Receptionist CAN read patient billing dossier');

  // Write action (collect payment) should fail with 403 Forbidden
  const writePaymentBlocked = await fetchJson('/billing/pay', {
    method: 'POST',
    headers: { Authorization: `Bearer ${receptionist.token}` },
    body: JSON.stringify({
      patientId: 'pat-01',
      totalAmount: 2500,
      amountPaid: 2500,
      category: 'CONSULTATION',
      paymentMethod: 'CASH'
    })
  });
  assert(
    writePaymentBlocked.status === 403 && writePaymentBlocked.data?.error?.code === 'FORBIDDEN',
    'recep_pos [Write OFF]: Receptionist payment recording rejected with 403 Forbidden',
    `Status: ${writePaymentBlocked.status}`
  );

  // Now enable Write for recep_pos
  await setRolePerms('RECEPTIONIST', [
    { moduleId: 'recep_desk', read: true, write: true, delete: false },
    { moduleId: 'recep_approvals', read: true, write: true, delete: true },
    { moduleId: 'recep_pos', read: true, write: true, delete: false }, // WRITE ON
    { moduleId: 'recep_reports', read: false, write: false, delete: false }
  ]);

  const writePaymentAllowed = await fetchJson('/billing/pay', {
    method: 'POST',
    headers: { Authorization: `Bearer ${receptionist.token}` },
    body: JSON.stringify({
      patientId: 'pat-01',
      totalAmount: 100,
      amountPaid: 100,
      category: 'CONSULTATION',
      paymentMethod: 'CASH'
    })
  });
  assert(
    writePaymentAllowed.status !== 403,
    'recep_pos [Write ON]: Receptionist payment recording authorized by RBAC (non-403 response)',
    `Status: ${writePaymentAllowed.status}`
  );

  // Restore recep_pos back to Write OFF
  await setRolePerms('RECEPTIONIST', [
    { moduleId: 'recep_desk', read: true, write: true, delete: false },
    { moduleId: 'recep_approvals', read: true, write: true, delete: true },
    { moduleId: 'recep_pos', read: true, write: false, delete: false },
    { moduleId: 'recep_reports', read: false, write: false, delete: false }
  ]);

  // 1.2 Pending Bookings (recep_approvals): Read Only vs Write & Delete
  console.log('  Testing recep_approvals (Pending Bookings & Patient Creation Gate)...');
  await setRolePerms('RECEPTIONIST', [
    { moduleId: 'recep_desk', read: true, write: true, delete: false },
    { moduleId: 'recep_approvals', read: true, write: false, delete: false }, // WRITE & DELETE OFF
    { moduleId: 'recep_pos', read: true, write: false, delete: false },
    { moduleId: 'recep_reports', read: false, write: false, delete: false }
  ]);

  // Read action (view appointments) should succeed
  const readAppointments = await fetchJson('/appointments?status=PENDING', {
    headers: { Authorization: `Bearer ${receptionist.token}` }
  });
  assert(readAppointments.status === 200, 'recep_approvals [Read Only]: Receptionist CAN read pending appointments');

  // Register patient should be blocked because recep_approvals is read-only
  const regPatientBlocked = await fetchJson('/auth/register', {
    method: 'POST',
    headers: { Authorization: `Bearer ${receptionist.token}` },
    body: JSON.stringify({
      fullName: 'Test Blocked Patient',
      phone: '+923999999991',
      cnic: '35201-9999999-1'
    })
  });
  assert(
    regPatientBlocked.status === 403 && regPatientBlocked.data?.error?.message?.includes('Pending Bookings is in Read-Only mode'),
    'recep_approvals [Read Only]: Patient registration strictly blocked when Pending Bookings is Read-Only',
    `Status: ${regPatientBlocked.status}`
  );

  // Confirm appointment should be blocked when Write is OFF
  const confirmAptBlocked = await fetchJson('/appointments/apt-01/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${receptionist.token}` },
    body: JSON.stringify({ status: 'CONFIRMED' })
  });
  assert(
    confirmAptBlocked.status === 403,
    'recep_approvals [Write OFF]: Confirming appointment rejected with 403 Forbidden',
    `Status: ${confirmAptBlocked.status}`
  );

  // Decline/Cancel appointment should be blocked when Delete is OFF
  const cancelAptBlocked = await fetchJson('/appointments/apt-01/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${receptionist.token}` },
    body: JSON.stringify({ status: 'DECLINED' })
  });
  assert(
    cancelAptBlocked.status === 403,
    'recep_approvals [Delete OFF]: Declining appointment rejected with 403 Forbidden',
    `Status: ${cancelAptBlocked.status}`
  );

  // Restore recep_approvals Write & Delete
  await setRolePerms('RECEPTIONIST', [
    { moduleId: 'recep_desk', read: true, write: true, delete: false },
    { moduleId: 'recep_approvals', read: true, write: true, delete: true },
    { moduleId: 'recep_pos', read: true, write: false, delete: false },
    { moduleId: 'recep_reports', read: false, write: false, delete: false }
  ]);

  // 1.3 Queue & Check-In Desk (recep_desk): Read-Only vs Write
  console.log('  Testing recep_desk (Queue & Check-In Desk)...');
  await setRolePerms('RECEPTIONIST', [
    { moduleId: 'recep_desk', read: true, write: false, delete: false }, // WRITE OFF
    { moduleId: 'recep_approvals', read: true, write: true, delete: true },
    { moduleId: 'recep_pos', read: true, write: false, delete: false },
    { moduleId: 'recep_reports', read: false, write: false, delete: false }
  ]);

  // Check-in should fail with 403
  const checkInBlocked = await fetchJson('/queue/check-in', {
    method: 'POST',
    headers: { Authorization: `Bearer ${receptionist.token}` },
    body: JSON.stringify({ appointmentId: 'apt-01' })
  });
  assert(
    checkInBlocked.status === 403,
    'recep_desk [Write OFF]: Patient check-in rejected with 403 Forbidden',
    `Status: ${checkInBlocked.status}`
  );

  // Patient registration should fail with 403
  const regPatientDeskBlocked = await fetchJson('/auth/register', {
    method: 'POST',
    headers: { Authorization: `Bearer ${receptionist.token}` },
    body: JSON.stringify({
      fullName: 'Test Blocked Desk Patient',
      phone: '+923999999992',
      cnic: '35201-9999999-2'
    })
  });
  assert(
    regPatientDeskBlocked.status === 403,
    'recep_desk [Write OFF]: Patient registration rejected with 403 Forbidden',
    `Status: ${regPatientDeskBlocked.status}`
  );

  // Restore recep_desk Write ON
  await setRolePerms('RECEPTIONIST', [
    { moduleId: 'recep_desk', read: true, write: true, delete: false },
    { moduleId: 'recep_approvals', read: true, write: true, delete: true },
    { moduleId: 'recep_pos', read: true, write: false, delete: false },
    { moduleId: 'recep_reports', read: false, write: false, delete: false }
  ]);

  // -------------------------------------------------------------
  // 2. DOCTOR ROLE PERMISSION MATRIX
  // -------------------------------------------------------------
  console.log('\n--- 2. DOCTOR PERMISSION SYNCHRONIZATION ---');

  // 2.1 Today\'s Clinical Queue (doctor_queue): Write OFF -> Cannot Call Next
  console.log('  Testing doctor_queue (Clinical Queue)...');
  await setRolePerms('DOCTOR', [
    { moduleId: 'doctor_queue', read: true, write: false, delete: false }, // WRITE OFF
    { moduleId: 'doctor_consultation', read: true, write: true, delete: true },
    { moduleId: 'doctor_tokens', read: true, write: true, delete: false },
    { moduleId: 'patient_history', read: true, write: false, delete: false }
  ]);

  const callNextBlocked = await fetchJson('/queue/call-next', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify({ doctorId: 'doc-01' })
  });
  assert(
    callNextBlocked.status === 403,
    'doctor_queue [Write OFF]: Doctor calling next patient rejected with 403 Forbidden',
    `Status: ${callNextBlocked.status}`
  );

  // 2.2 Consultations & Rx (doctor_consultation): Write OFF -> Cannot record clinical encounters
  console.log('  Testing doctor_consultation (Encounter & Rx)...');
  await setRolePerms('DOCTOR', [
    { moduleId: 'doctor_queue', read: true, write: true, delete: false },
    { moduleId: 'doctor_consultation', read: true, write: false, delete: false }, // WRITE OFF
    { moduleId: 'doctor_tokens', read: true, write: true, delete: false },
    { moduleId: 'patient_history', read: true, write: false, delete: false }
  ]);

  const recordClinicalBlocked = await fetchJson('/clinical-records/records', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify({
      appointmentId: 'apt-01',
      patientId: 'pat-01',
      doctorId: 'doc-01',
      chiefComplaint: 'Headache',
      examinationNotes: 'Normal BP',
      diagnosis: 'Tension headache',
      treatmentPlan: 'Rest'
    })
  });
  assert(
    recordClinicalBlocked.status === 403,
    'doctor_consultation [Write OFF]: Creating clinical record rejected with 403 Forbidden',
    `Status: ${recordClinicalBlocked.status}`
  );

  // 2.3 Doctor Token Allocation & Capacity Limit (doctor_tokens)
  console.log('  Testing doctor_tokens (Capacity Limit & Token Allocation)...');
  await setRolePerms('DOCTOR', [
    { moduleId: 'doctor_queue', read: true, write: true, delete: false },
    { moduleId: 'doctor_consultation', read: true, write: true, delete: true },
    { moduleId: 'doctor_tokens', read: true, write: false, delete: false }, // WRITE & DELETE OFF
    { moduleId: 'patient_history', read: true, write: false, delete: false }
  ]);

  const updateLimitBlocked = await fetchJson('/doctors/daily-limit', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify({ dailyLimit: 25 })
  });
  assert(
    updateLimitBlocked.status === 403,
    'doctor_tokens [Write OFF]: Updating daily limit rejected with 403 Forbidden',
    `Status: ${updateLimitBlocked.status}`
  );

  const allocateTokenBlocked = await fetchJson('/tokens/allocate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${doctor.token}` },
    body: JSON.stringify({ doctorId: 'doc-01', date: new Date().toISOString().split('T')[0] })
  });
  assert(
    allocateTokenBlocked.status === 403,
    'doctor_tokens [Write OFF]: Allocating token rejected with 403 Forbidden',
    `Status: ${allocateTokenBlocked.status}`
  );

  // Restore DOCTOR default permissions
  await setRolePerms('DOCTOR', [
    { moduleId: 'doctor_queue', read: true, write: true, delete: false },
    { moduleId: 'doctor_consultation', read: true, write: true, delete: true },
    { moduleId: 'doctor_tokens', read: true, write: true, delete: false },
    { moduleId: 'patient_history', read: true, write: false, delete: false }
  ]);

  // -------------------------------------------------------------
  // 3. PHARMACIST ROLE PERMISSION MATRIX
  // -------------------------------------------------------------
  console.log('\n--- 3. PHARMACIST PERMISSION SYNCHRONIZATION ---');

  // 3.1 Live Dispense Queue (pharma_queue): Write OFF -> Cannot Dispense
  console.log('  Testing pharma_queue (Prescription Fulfillment)...');
  await setRolePerms('PHARMACIST', [
    { moduleId: 'pharma_queue', read: true, write: false, delete: false }, // WRITE OFF
    { moduleId: 'pharma_inventory', read: true, write: true, delete: true },
    { moduleId: 'pharma_pos', read: true, write: true, delete: false },
    { moduleId: 'pharma_safety', read: true, write: false, delete: false },
    { moduleId: 'pharma_procurement', read: true, write: true, delete: true }
  ]);

  const dispenseBlocked = await fetchJson('/pharmacy/dispense', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pharmacist.token}` },
    body: JSON.stringify({
      prescriptionId: 'rx-01',
      pharmacistNotes: 'Checking inventory'
    })
  });
  assert(
    dispenseBlocked.status === 403,
    'pharma_queue [Write OFF]: Dispensing medication rejected with 403 Forbidden',
    `Status: ${dispenseBlocked.status}`
  );

  // 3.2 Inventory Vault (pharma_inventory): Write OFF -> Cannot Add Drug SKU
  console.log('  Testing pharma_inventory (Drug Inventory Vault)...');
  await setRolePerms('PHARMACIST', [
    { moduleId: 'pharma_queue', read: true, write: true, delete: false },
    { moduleId: 'pharma_inventory', read: true, write: false, delete: false }, // WRITE OFF
    { moduleId: 'pharma_pos', read: true, write: true, delete: false },
    { moduleId: 'pharma_safety', read: true, write: false, delete: false },
    { moduleId: 'pharma_procurement', read: true, write: true, delete: true }
  ]);

  const addSkuBlocked = await fetchJson('/pharmacy/inventory', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pharmacist.token}` },
    body: JSON.stringify({
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      category: 'Antibiotic',
      unitPrice: 150,
      stockQuantity: 100
    })
  });
  assert(
    addSkuBlocked.status === 403,
    'pharma_inventory [Write OFF]: Adding medicine SKU rejected with 403 Forbidden',
    `Status: ${addSkuBlocked.status}`
  );

  // 3.3 Pharmacy POS (pharma_pos): Write OFF -> Cannot Checkout OTC Sale
  console.log('  Testing pharma_pos (Pharmacy POS Counter)...');
  await setRolePerms('PHARMACIST', [
    { moduleId: 'pharma_queue', read: true, write: true, delete: false },
    { moduleId: 'pharma_inventory', read: true, write: true, delete: true },
    { moduleId: 'pharma_pos', read: true, write: false, delete: false }, // WRITE OFF
    { moduleId: 'pharma_safety', read: true, write: false, delete: false },
    { moduleId: 'pharma_procurement', read: true, write: true, delete: true }
  ]);

  const posCheckoutBlocked = await fetchJson('/pharmacy/pos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pharmacist.token}` },
    body: JSON.stringify({
      items: [{ medicineId: 'med-01', quantity: 1, unitPrice: 200 }],
      totalAmount: 200,
      amountPaid: 200,
      paymentMethod: 'CASH'
    })
  });
  assert(
    posCheckoutBlocked.status === 403,
    'pharma_pos [Write OFF]: OTC sale checkout rejected with 403 Forbidden',
    `Status: ${posCheckoutBlocked.status}`
  );

  // 3.4 Procurement & Shipment Receiving (pharma_procurement)
  console.log('  Testing pharma_procurement (Distributor Restock Intake)...');
  await setRolePerms('PHARMACIST', [
    { moduleId: 'pharma_queue', read: true, write: true, delete: false },
    { moduleId: 'pharma_inventory', read: true, write: true, delete: true },
    { moduleId: 'pharma_pos', read: true, write: true, delete: false },
    { moduleId: 'pharma_safety', read: true, write: false, delete: false },
    { moduleId: 'pharma_procurement', read: true, write: false, delete: false } // WRITE OFF
  ]);

  const receiveShipmentBlocked = await fetchJson('/pharmacy/procurement/po-01/receive', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pharmacist.token}` }
  });
  assert(
    receiveShipmentBlocked.status === 403,
    'pharma_procurement [Write OFF]: Receiving shipment rejected with 403 Forbidden',
    `Status: ${receiveShipmentBlocked.status}`
  );

  // Restore PHARMACIST default permissions
  await setRolePerms('PHARMACIST', [
    { moduleId: 'pharma_queue', read: true, write: true, delete: false },
    { moduleId: 'pharma_inventory', read: true, write: true, delete: true },
    { moduleId: 'pharma_pos', read: true, write: true, delete: false },
    { moduleId: 'pharma_safety', read: true, write: false, delete: false },
    { moduleId: 'pharma_procurement', read: true, write: true, delete: true }
  ]);

  // -------------------------------------------------------------
  // 4. PATIENT ROLE PERMISSION MATRIX
  // -------------------------------------------------------------
  console.log('\n--- 4. PATIENT PERMISSION SYNCHRONIZATION ---');

  // 4.1 Online Appointment Booking (patient_booking): Write OFF -> Cannot Book or Reschedule
  console.log('  Testing patient_booking (Online Appointment Booking & Reschedule)...');
  await setRolePerms('PATIENT', [
    { moduleId: 'patient_portal', read: true, write: false, delete: false },
    { moduleId: 'patient_booking', read: true, write: false, delete: false }, // WRITE OFF
    { moduleId: 'patient_history', read: true, write: false, delete: false },
    { moduleId: 'patient_billing', read: true, write: false, delete: false }
  ]);

  const bookAptBlocked = await fetchJson('/appointments/booking', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patient.token}` },
    body: JSON.stringify({
      doctorId: 'doc-01',
      appointmentDate: new Date().toISOString().split('T')[0],
      chiefComplaint: 'Follow-up consultation'
    })
  });
  assert(
    bookAptBlocked.status === 403,
    'patient_booking [Write OFF]: Online appointment booking rejected with 403 Forbidden',
    `Status: ${bookAptBlocked.status}`
  );

  const rescheduleBlocked = await fetchJson('/appointments/reschedule', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patient.token}` },
    body: JSON.stringify({
      appointmentId: 'apt-01',
      newDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      reason: 'Patient changed schedule'
    })
  });
  assert(
    rescheduleBlocked.status === 403,
    'patient_booking [Write OFF]: Appointment reschedule rejected with 403 Forbidden',
    `Status: ${rescheduleBlocked.status}`
  );

  // 4.2 Online Appointment Booking (patient_booking): Delete OFF -> Cannot Cancel
  console.log('  Testing patient_booking (Cancellation Policy)...');
  const cancelAptPatientBlocked = await fetchJson('/appointments/apt-01/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${patient.token}` },
    body: JSON.stringify({ status: 'CANCELLED' })
  });
  assert(
    cancelAptPatientBlocked.status === 403,
    'patient_booking [Delete OFF]: Patient appointment cancellation rejected with 403 Forbidden',
    `Status: ${cancelAptPatientBlocked.status}`
  );

  // 4.3 Medical History & Records (patient_history): Read OFF -> Cannot View History
  console.log('  Testing patient_history (Medical Records Privacy Boundary)...');
  await setRolePerms('PATIENT', [
    { moduleId: 'patient_portal', read: true, write: false, delete: false },
    { moduleId: 'patient_booking', read: true, write: true, delete: true },
    { moduleId: 'patient_history', read: false, write: false, delete: false }, // READ OFF
    { moduleId: 'patient_billing', read: true, write: false, delete: false }
  ]);

  const readHistoryBlocked = await fetchJson('/clinical-records/patient/pat-01/history', {
    headers: { Authorization: `Bearer ${patient.token}` }
  });
  assert(
    readHistoryBlocked.status === 403,
    'patient_history [Read OFF]: Reading medical records rejected with 403 Forbidden',
    `Status: ${readHistoryBlocked.status}`
  );

  // Restore PATIENT default permissions
  await setRolePerms('PATIENT', [
    { moduleId: 'patient_portal', read: true, write: false, delete: false },
    { moduleId: 'patient_booking', read: true, write: true, delete: true },
    { moduleId: 'patient_history', read: true, write: false, delete: false },
    { moduleId: 'patient_billing', read: true, write: false, delete: false }
  ]);

  // -------------------------------------------------------------
  // 5. SYSTEM ADMINISTRATOR SUPREME ACCESS INVARIANT
  // -------------------------------------------------------------
  console.log('\n--- 5. SYSTEM ADMINISTRATOR SUPREME BYPASS INVARIANT ---');
  // Admin performing operations across restricted modules must succeed
  const adminPatientBilling = await fetchJson('/billing/patient/pat-01', {
    headers: { Authorization: `Bearer ${admin.token}` }
  });
  assert(adminPatientBilling.status === 200, 'ADMIN Invariant: Admin has unrestricted access to Billing Dossier');

  const adminQueueMatrix = await fetchJson('/tokens/matrix?doctorId=doc-01', {
    headers: { Authorization: `Bearer ${admin.token}` }
  });
  assert(adminQueueMatrix.status === 200, 'ADMIN Invariant: Admin has unrestricted access to Clinical Token Matrix');

  // -------------------------------------------------------------
  // 6. PUBLIC HIERARCHY & ROLE DEFINITION SYNC FOR CLIENT TERMINALS
  // -------------------------------------------------------------
  console.log('\n--- 6. PUBLIC CLIENT TERMINALS RBAC SYNCHRONIZATION ---');
  const publicPermsRes = await fetchJson('/admin/role-permissions');
  assert(publicPermsRes.status === 200, 'Client Sync: Public /admin/role-permissions endpoint accessible without auth');
  assert(Array.isArray(publicPermsRes.data?.data?.roles), 'Client Sync: Returns complete array of hospital roles');
  
  const recepDef = publicPermsRes.data?.data?.roles.find((r: any) => r.role === 'RECEPTIONIST');
  const posRule = recepDef?.permissions?.find((p: any) => p.moduleId === 'recep_pos');
  assert(posRule && posRule.write === false, 'Client Sync: Front-Desk POS correctly reports write: false as ground truth');

  console.log('\n================================================================');
  console.log(`PERMISSIONS SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runRolePermissionsSyncSuite().catch(err => {
    console.error('Test execution fatal error:', err);
    process.exit(1);
  });
}
