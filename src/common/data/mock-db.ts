import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface DbUser {
  id: string;
  username?: string; // Unique system username / login ID
  phone: string;
  email?: string;
  name?: string;
  passwordHash: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
  gender?: string;
  dateOfBirth?: string;
  cnic?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  qualifications?: string[];
  experienceYears?: number;
  consultationFee?: number;
  deskNumber?: string;
  shift?: string;
  allergies?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  allowedModules?: string[]; // Fully flexible dynamic module permissions granted by Admin
  linkedEmployeeId?: string;
  linkedEmployeeName?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEMO_USER_IDS = new Set([
  'u-admin-01',
  'u-doc-01',
  'u-doc-02',
  'u-recep-01',
  'u-pharma-01',
  'u-pat-01',
  'u-pat-02',
  'u-pat-03'
]);

export function isDemoUser(user?: { userId?: string; id?: string; email?: string } | null): boolean {
  if (!user) return false;
  const uid = user.userId || user.id;
  if (uid && DEMO_USER_IDS.has(uid)) return true;
  if (user.email && [
    'admin@hospital.com',
    'dr.aisha@hospital.com',
    'dr.marcus@hospital.com',
    'receptionist@hospital.com',
    'pharmacy@hospital.com',
    'john.doe@example.com',
    'emily.clark@example.com',
    'robert.taylor@example.com'
  ].includes(user.email.toLowerCase())) {
    return true;
  }
  return false;
}

export interface HospitalModuleDef {
  id: string;
  label: string;
  category: 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY';
  categoryLabel: string;
  description: string;
}

export const ORIGINAL_HOSPITAL_MODULES: readonly HospitalModuleDef[] = [
  // Clinical / Doctor
  { id: 'doctor_queue', label: "Today's Clinical Queue", category: 'CLINICAL', categoryLabel: 'Clinical & Doctor Deck', description: 'Live waiting queue, calling next patients & triage status' },
  { id: 'doctor_consultation', label: 'Consultations & Rx Workspace', category: 'CLINICAL', categoryLabel: 'Clinical & Doctor Deck', description: 'Clinical encounter notes, digital prescriptions & lab investigations' },
  { id: 'doctor_tokens', label: 'Token Allocation Matrix', category: 'CLINICAL', categoryLabel: 'Clinical & Doctor Deck', description: 'Doctor capacity limits, token slot reservation & release' },

  // Front-Desk / Reception
  { id: 'recep_desk', label: 'Queue & Patient Check-In', category: 'RECEPTION', categoryLabel: 'Front-Desk & Reception', description: 'Walk-in patient check-in, token issuance & arrival tracking' },
  { id: 'recep_approvals', label: 'Pending Bookings Approval', category: 'RECEPTION', categoryLabel: 'Front-Desk & Reception', description: 'Authorize or decline online/WhatsApp appointment requests' },
  { id: 'recep_pos', label: 'Front-Desk Billing POS', category: 'RECEPTION', categoryLabel: 'Front-Desk & Reception', description: 'Point of sale, consultation fee collection & invoice printing' },
  { id: 'recep_reports', label: 'Front-Desk Analytics', category: 'RECEPTION', categoryLabel: 'Front-Desk & Reception', description: 'Daily patient throughput, check-in stats & front-desk ledger' },

  // Patient Services
  { id: 'patient_portal', label: 'My Appointments & Tokens', category: 'PATIENT', categoryLabel: 'Patient Services', description: 'View active sequential tokens, appointment dates & reschedule/cancel' },
  { id: 'patient_booking', label: 'Book Appointment Suite', category: 'PATIENT', categoryLabel: 'Patient Services', description: '3-step appointment booking wizard for self or family members' },
  { id: 'patient_history', label: 'Medical Records & Prescriptions', category: 'PATIENT', categoryLabel: 'Patient Services', description: 'Clinical diagnosis history, digital prescriptions & notification preferences' },
  { id: 'patient_billing', label: 'Billing & Invoices Ledger', category: 'PATIENT', categoryLabel: 'Patient Services', description: 'Consultation charges ledger, payment records & outstanding balance' },

  // Pharmacy & Medical Store
  { id: 'pharma_queue', label: 'Live Dispense Queue & Rx', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', description: 'Real-time fulfillment of doctor digital prescriptions & dispense logging' },
  { id: 'pharma_inventory', label: 'Drug Inventory Vault', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', description: 'Medicine stock tracking, batch numbers, shelf locations & near-expiry alerts' },
  { id: 'pharma_pos', label: 'Pharmacy POS & OTC Billing', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', description: 'Point-of-sale terminal for walk-in OTC medicine purchases & invoice printing' },
  { id: 'pharma_safety', label: 'Drug Safety & AI Interactions', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', description: 'Contraindication analysis, drug-drug interactions & allergy cross-screening' },
  { id: 'pharma_procurement', label: 'Suppliers & Procurement', category: 'PHARMACY', categoryLabel: 'Pharmacy & Medical Store', description: 'Pharmaceutical distributor purchase orders, stock replenishment & receiving' },

  // System Administration
  { id: 'admin_users', label: 'User Access & Permissions', category: 'ADMIN', categoryLabel: 'System Administration', description: 'Staff account provisioning, blocking/unblocking & granular module access' },
  { id: 'admin_studio', label: 'Module & Page Studio', category: 'ADMIN', categoryLabel: 'System Administration', description: 'Interactive drag-and-drop workspace to reassign and structure hospital pages across modules' },
  { id: 'admin_audit', label: 'Compliance Audit Vault', category: 'ADMIN', categoryLabel: 'System Administration', description: 'Immutable HIPAA & clinical compliance audit ledger' },
  { id: 'admin_queue', label: 'Live System Queue Monitor', category: 'ADMIN', categoryLabel: 'System Administration', description: 'Hospital-wide real-time queue overview & token tracking' },
  { id: 'admin_reports', label: 'Executive Analytics & BI', category: 'ADMIN', categoryLabel: 'System Administration', description: 'Hospital financial summaries, doctor efficiency & patient statistics' },
  { id: 'admin_database', label: 'Database Clear & Maintenance', category: 'ADMIN', categoryLabel: 'System Administration', description: 'Database schema diagnostics, queue cleanup & test purge' },
  { id: 'admin_config', label: 'System Policies & Rules', category: 'ADMIN', categoryLabel: 'System Administration', description: 'Hospital operation hours, daily limits & cancellation rules' },
  { id: 'admin_ledger', label: 'Hospital Financial Ledger', category: 'ADMIN', categoryLabel: 'System Administration', description: 'Hospital balance sheet, total collections & transaction log' },
];

export const HOSPITAL_MODULES: HospitalModuleDef[] = ORIGINAL_HOSPITAL_MODULES.map(m => ({ ...m }));

export const ROLE_DEFAULT_MODULES: Record<string, string[]> = {
  DOCTOR: ['doctor_queue', 'doctor_consultation', 'doctor_tokens'],
  RECEPTIONIST: ['recep_desk', 'recep_approvals', 'recep_pos', 'recep_reports'],
  PATIENT: ['patient_portal', 'patient_booking', 'patient_history', 'patient_billing'],
  PHARMACIST: ['pharma_queue', 'pharma_inventory', 'pharma_pos', 'pharma_safety', 'pharma_procurement'],
  ADMIN: HOSPITAL_MODULES.map(m => m.id),
};

export interface RolePermissionRule {
  moduleId: string;
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface HospitalRoleDefinition {
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
  label: string;
  description: string;
  badgeColor: string;
  permissions: RolePermissionRule[];
}

export const DEFAULT_ROLE_PERMISSIONS: HospitalRoleDefinition[] = [
  {
    role: 'ADMIN',
    label: 'System Administration',
    description: 'Supreme hospital security, user provisioning, audits, billing ledger & core configuration',
    badgeColor: 'emerald',
    permissions: ORIGINAL_HOSPITAL_MODULES.map(m => ({
      moduleId: m.id,
      read: true,
      write: true,
      delete: true
    }))
  },
  {
    role: 'DOCTOR',
    label: 'Clinical & Doctor Deck',
    description: 'Patient queue calling, encounter diagnoses, e-prescriptions and clinical history',
    badgeColor: 'sky',
    permissions: [
      { moduleId: 'doctor_queue', read: true, write: true, delete: false },
      { moduleId: 'doctor_consultation', read: true, write: true, delete: true },
      { moduleId: 'doctor_tokens', read: true, write: true, delete: false },
      { moduleId: 'patient_history', read: true, write: false, delete: false }
    ]
  },
  {
    role: 'RECEPTIONIST',
    label: 'Front-Desk & Reception',
    description: 'Patient check-in, token ticketing, booking authorizations and consultation POS',
    badgeColor: 'purple',
    permissions: [
      { moduleId: 'recep_desk', read: true, write: true, delete: false },
      { moduleId: 'recep_approvals', read: true, write: true, delete: true },
      { moduleId: 'recep_pos', read: true, write: false, delete: false },
      { moduleId: 'recep_reports', read: true, write: false, delete: false }
    ]
  },
  {
    role: 'PHARMACIST',
    label: 'Pharmacy & Medical Store',
    description: 'Live prescription fulfillment, stock inventory tracking, safety analysis & POS sales',
    badgeColor: 'teal',
    permissions: [
      { moduleId: 'pharma_queue', read: true, write: true, delete: false },
      { moduleId: 'pharma_inventory', read: true, write: true, delete: true },
      { moduleId: 'pharma_pos', read: true, write: true, delete: false },
      { moduleId: 'pharma_safety', read: true, write: false, delete: false },
      { moduleId: 'pharma_procurement', read: true, write: true, delete: true }
    ]
  },
  {
    role: 'PATIENT',
    label: 'Patient Services & Portal',
    description: 'Digital self-booking, viewing active sequential tokens, diagnoses & receipts',
    badgeColor: 'amber',
    permissions: [
      { moduleId: 'patient_portal', read: true, write: false, delete: false },
      { moduleId: 'patient_booking', read: true, write: true, delete: true },
      { moduleId: 'patient_history', read: true, write: false, delete: false },
      { moduleId: 'patient_billing', read: true, write: false, delete: false }
    ]
  }
];

export interface DbPatient {
  id: string;
  userId: string;
  fullName: string;
  cnic: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  hasWhatsApp: boolean;
  primaryNotificationChannel: string;
  backupNotificationChannel?: string;
  advance_balance?: number;
  createdAt: string;
}

export interface DbDoctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  biography: string;
  qualifications: string[];
  experienceYears: number;
  languages: string[];
  consultationFee: number;
  followUpFee: number;
  dailyPatientLimit: number;
  createdAt: string;
}

export interface DbReceptionist {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface DbService {
  id: string;
  name: string;
  description: string;
  baseFee: number;
  isActive: boolean;
}

export interface DbDoctorService {
  doctorId: string;
  serviceId: string;
}

export interface DbDailyToken {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  tokenNumber: number;
  status: 'AVAILABLE' | 'RESERVED' | 'ACTIVE' | 'CANCELLED';
  cancelledAt?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface DbAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId?: string;
  appointmentDate: string; // YYYY-MM-DD
  tokenId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'RESCHEDULED';
  bookingSource: string;
  approvedByReceptionistId?: string;
  reminderSentAt?: string;
  dispatchedReminderTiers?: string[];
  followUpDate?: string;
  chiefComplaint?: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbPatientPackage {
  id: string;
  patientId: string;
  packageName: string;
  category: 'AESTHETICS' | 'DERMATOLOGY' | 'DENTAL' | 'GENERAL';
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  purchasedDate: string;
  expiryDate: string;
  lastSessionDate?: string;
  nextRecommendedDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  pricePKR: number;
  notes?: string;
  isDemo?: boolean;
}

export interface DbAssignedLabTest {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  testName: string;
  category: 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'HORMONES' | 'PATHOLOGY' | 'RADIOLOGY' | 'ALLERGY';
  assignedDate: string;
  dueDate: string;
  instructions?: string;
  status: 'ASSIGNED' | 'PENDING_SAMPLE' | 'SAMPLE_COLLECTED' | 'COMPLETED' | 'CANCELLED';
  reportUrl?: string;
  reportSummary?: string;
  reminderSentCount: number;
  lastReminderSentAt?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface DbQueueEntry {
  id: string;
  appointmentId: string;
  queueStatus: 'NOT_CHECKED_IN' | 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'NO_SHOW';
  checkInTime?: string;
  calledTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface DbClinicalRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  examinationNotes: string;
  diagnosis: string;
  treatmentPlan: string;
  privateNotes?: string;
  followUpDate?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbPrescription {
  id: string;
  clinicalRecordId: string;
  patientId: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface DbPrescriptionVersion {
  id: string;
  prescriptionId: string;
  versionNumber: number;
  doctorId: string;
  medicationsJson: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  correctionReason?: string;
  isCurrent: boolean;
  isDemo?: boolean;
  createdAt: string;
}

export interface DbDoctorPatientRelationship {
  id: string;
  doctorId: string;
  patientId: string;
  firstVisitDate: string;
  lastVisitDate: string;
  totalVisits: number;
}

export interface DbAestheticDeal {
  id: string;
  name: string;
  totalPrice: number;
  description?: string;
  sessionsAllowed: number;
  serviceIds?: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface DbAestheticProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  categoryName: string;
  costPrice: number;
  sellingPrice: number;
  taxClass: 'Standard' | 'Exempt';
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
}

export interface DbSalesReturn {
  id: string;
  returnNumber: string;
  paymentId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  refundAmount: number;
  refundMethod: 'CASH' | 'WALLET' | 'ORIGINAL_METHOD';
  reason: string;
  itemsReturned?: Array<{ itemId: string; name: string; quantity: number; unitPrice: number }>;
  processedBy: string;
  createdAt: string;
}

export interface DbPayment {
  id: string;
  invoiceNumber?: string;
  patientId: string;
  appointmentId?: string;
  doctorId?: string;
  doctorName?: string;
  dealId?: string;
  dealName?: string;
  sessionsAllowed?: number;
  sessionsConsumed?: number;
  sessionRemarks?: Array<{ sessionNumber: number; date: string; remarks: string; doctorName?: string }>;
  items?: Array<{ id: string; name: string; type: 'SERVICE' | 'PRODUCT' | 'DEAL'; quantity: number; unitPrice: number; subtotal: number }>;
  totalAmount: number;
  discount?: number;
  amountPaid: number;
  balanceDue: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  paymentMethod?: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER' | 'INSURANCE' | 'WALLET';
  category?: 'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'PHARMACY' | 'EMERGENCY' | 'PACKAGE' | 'RETAIL';
  paymentPlan?: 'FULL' | 'INSTALLMENT_1' | 'INSTALLMENT_2' | 'SPECIAL_WAIVER';
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface DbNotificationLog {
  id: string;
  recipientId: string;
  eventType: string;
  primaryChannel: string;
  backupChannel?: string;
  channelsAttempted: string[];
  finalStatus: string;
  errorTrace?: string;
  payload: any;
  createdAt: string;
}

export interface DbSystemSettings {
  whatsappBotEnabled: boolean;
  hospitalWhatsAppNumber: string;
  whatsappProvider: 'META_CLOUD_API' | 'TWILIO' | 'SIMULATOR';
  metaPhoneNumberId: string;
  metaAccessToken: string;
  metaVerifyToken: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  botWelcomeMessageUrdu?: string;
  botWelcomeMessageEnglish?: string;
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  taxNumber?: string;
  receiptFooterNote?: string;
  clinicLogoUrl?: string;
  updatedAt: string;
}

export interface DbMedicineItem {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: 'Aesthetics & Dermatology' | 'Cardiology' | 'Antibiotics' | 'Analgesics & Pain' | 'Vitamins & Supplements' | 'Emergency & IV' | 'General';
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Cream/Ointment' | 'Drops';
  strength: string;
  stockQuantity: number;
  minStockAlert: number;
  unitPrice: number;
  batchNumber: string;
  expiryDate: string;
  shelfLocation: string;
  supplierName: string;
  isControlled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbDispenseRecord {
  id: string;
  prescriptionId: string;
  prescriptionVersionId?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  diagnosis?: string;
  status: 'PENDING' | 'PREPARING' | 'DISPENSED' | 'CANCELLED';
  items: Array<{
    medicineId?: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantityPrescribed: number;
    quantityDispensed: number;
    batchNumber?: string;
    unitPrice: number;
    subtotal: number;
  }>;
  totalAmount: number;
  pharmacistId?: string;
  pharmacistName?: string;
  dispensedAt?: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface DbPharmacySale {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  customerType: 'WALK_IN' | 'REGISTERED_PATIENT';
  patientId?: string;
  items: Array<{
    medicineId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'ONLINE';
  processedBy: string;
  createdAt: string;
}

export interface DbProcurementOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierContact: string;
  status: 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  expectedDelivery: string;
  deliveryCharges?: number;
  totalCost: number;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    unitCost: number;
  }>;
  notes?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface DbCategory {
  id: string;
  name: string;
  type: 'SERVICE' | 'PRODUCT' | 'DEAL' | 'ALL';
  description?: string;
  createdAt: string;
}

class InMemoryHospitalDatabase {
  users: DbUser[] = [];
  patients: DbPatient[] = [];
  doctors: DbDoctor[] = [];
  receptionists: DbReceptionist[] = [];
  services: DbService[] = [];
  doctorServices: DbDoctorService[] = [];
  dailyTokens: DbDailyToken[] = [];
  appointments: DbAppointment[] = [];
  queueEntries: DbQueueEntry[] = [];
  clinicalRecords: DbClinicalRecord[] = [];
  prescriptions: DbPrescription[] = [];
  prescriptionVersions: DbPrescriptionVersion[] = [];
  doctorPatientRelationships: DbDoctorPatientRelationship[] = [];
  payments: DbPayment[] = [];
  notificationLogs: DbNotificationLog[] = [];
  medicines: DbMedicineItem[] = [];
  dispenseRecords: DbDispenseRecord[] = [];
  pharmacySales: DbPharmacySale[] = [];
  procurementOrders: DbProcurementOrder[] = [];
  patientPackages: DbPatientPackage[] = [];
  assignedLabTests: DbAssignedLabTest[] = [];
  deals: DbAestheticDeal[] = [];
  aestheticProducts: DbAestheticProduct[] = [];
  salesReturns: DbSalesReturn[] = [];
  categories: DbCategory[] = [
    { id: 'cat-1', name: 'HydraFacial & Deep Cleansing', type: 'SERVICE', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-2', name: 'Laser Aesthetics & Hair Removal', type: 'SERVICE', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-3', name: 'Skin Brightening & Peeling', type: 'SERVICE', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-4', name: 'Anti-Aging & Injectables', type: 'SERVICE', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-5', name: 'Retail Serums & Sunscreens', type: 'PRODUCT', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'cat-6', name: 'Body Contouring & Slimming', type: 'SERVICE', createdAt: '2026-01-01T00:00:00.000Z' }
  ];
  moduleHierarchy: HospitalModuleDef[] = ORIGINAL_HOSPITAL_MODULES.map(m => ({ ...m }));
  rolePermissions: HospitalRoleDefinition[] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  systemSettings: DbSystemSettings = {
    whatsappBotEnabled: true,
    hospitalWhatsAppNumber: '+92 300 7654321',
    whatsappProvider: 'META_CLOUD_API',
    metaPhoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '',
    metaAccessToken: process.env.META_WHATSAPP_TOKEN || '',
    metaVerifyToken: process.env.META_WHATSAPP_VERIFY_TOKEN || 'hospital_wa_verify_token_2026',
    clinicName: 'Skin-Lab Aesthetic Hospital & Institute',
    clinicPhone: '+92 42 35876543',
    clinicAddress: 'Plot 14-C, Main Boulevard, Gulberg III, Lahore, Pakistan',
    taxNumber: 'NTN-7418902-1',
    receiptFooterNote: 'Thank you for visiting Skin-Lab! Packages once initiated are valid for 12 months. Keep this slip for subsequent session verification.',
    clinicLogoUrl: '',
    updatedAt: new Date().toISOString()
  };

  getStorageFilePath(): string {
    const rootDataDir = path.join(process.cwd(), 'src', 'common', 'data');
    const rootStorePath = path.join(rootDataDir, 'hospital_persistent_store.json');
    if (fs.existsSync(rootStorePath)) return rootStorePath;

    const localStorePath = path.join(__dirname, 'hospital_persistent_store.json');
    if (fs.existsSync(localStorePath)) return localStorePath;

    if (fs.existsSync(rootDataDir)) return rootStorePath;
    return localStorePath;
  }

  ensureCoreAdminAccounts() {
    const salt = bcrypt.genSaltSync(8);
    const defaultPasswordHash = bcrypt.hashSync('Password123!', salt);
    const chnmnxPasswordHash = bcrypt.hashSync('1234567', salt);

    if (!this.users.some(u => u.id === 'u-chnmnx-01' || u.username === 'chnmnx')) {
      this.users.unshift({
        id: 'u-chnmnx-01',
        username: 'chnmnx',
        name: 'CH Nouman Qamar',
        phone: '+923000000099',
        email: 'chnmnx@hospital.com',
        passwordHash: chnmnxPasswordHash,
        role: 'DOCTOR',
        gender: 'Male',
        dateOfBirth: '1992-05-20',
        cnic: '35201-7654321-9',
        bloodGroup: 'B+',
        department: 'Cardiology & Internal Medicine',
        specialization: 'Cardiology & Internal Medicine',
        licenseNumber: 'PMDC-99210-C',
        qualifications: ['MBBS', 'FCPS', 'Clinical Operations Lead'],
        experienceYears: 10,
        consultationFee: 2500,
        allowedModules: ['doctor_queue', 'doctor_consultation', 'doctor_tokens'],
        isDemo: false,
        createdAt: '2026-09-08T10:19:10.378Z',
        updatedAt: new Date().toISOString()
      });
    }

    if (!this.doctors.some(d => d.id === 'doc-chnmnx' || d.userId === 'u-chnmnx-01')) {
      this.doctors.unshift({
        id: 'doc-chnmnx',
        userId: 'u-chnmnx-01',
        name: 'CH Nouman Qamar',
        specialization: 'Cardiology & Internal Medicine',
        biography: 'Chief Clinical Operations Lead and Senior Consultant.',
        qualifications: ['MBBS', 'FCPS', 'Clinical Operations Lead'],
        experienceYears: 10,
        languages: ['English', 'Urdu', 'Punjabi'],
        consultationFee: 2500.00,
        followUpFee: 1500.00,
        dailyPatientLimit: 100,
        createdAt: '2026-09-08T10:19:10.378Z'
      });
    }

    if (!this.users.some(u => u.id === 'u-admin-01' || u.username === 'admin')) {
      this.users.push({
        id: 'u-admin-01',
        username: 'admin',
        name: 'Root Administrator',
        phone: '+15550000001',
        email: 'admin@hospital.com',
        passwordHash: defaultPasswordHash,
        role: 'ADMIN',
        gender: 'Male',
        department: 'Executive Administration & IT',
        isDemo: true,
        createdAt: '2026-09-08T10:19:10.378Z',
        updatedAt: new Date().toISOString()
      });
    }

    if (!this.users.some(u => u.id === 'u-recep-01' || u.username === 'sarah_desk')) {
      this.users.push({
        id: 'u-recep-01',
        username: 'sarah_desk',
        name: 'Sarah Jenkins',
        phone: '+15550000004',
        email: 'receptionist@hospital.com',
        passwordHash: defaultPasswordHash,
        role: 'RECEPTIONIST',
        gender: 'Female',
        dateOfBirth: '1996-08-14',
        cnic: '35201-5544332-1',
        department: 'Patient Front-Desk',
        deskNumber: 'OPD Counter 1',
        shift: 'Morning Shift (08:00 - 16:00)',
        isDemo: true,
        createdAt: '2026-09-08T10:19:10.378Z',
        updatedAt: new Date().toISOString()
      });
    }

    if (!this.receptionists.some(r => r.id === 'recep-01')) {
      this.receptionists.push({
        id: 'recep-01',
        userId: 'u-recep-01',
        name: 'Sarah Jenkins',
        createdAt: '2026-09-08T10:19:10.378Z'
      });
    }

    if (!this.doctors.some(d => d.id === 'doc-01')) {
      this.doctors.push({
        id: 'doc-01',
        userId: 'u-doc-01',
        name: 'Dr. Aisha Khan',
        specialization: 'Cardiology & Internal Medicine',
        biography: 'Board certified specialist in cardiovascular interventions and preventive cardiology with over 15 years clinical experience.',
        qualifications: ['MBBS (King Edward)', 'FCPS (Cardiology)', 'Fellowship in Interventional Cardiology (USA)'],
        experienceYears: 15,
        languages: ['English', 'Urdu', 'Punjabi'],
        consultationFee: 2500.00,
        followUpFee: 1500.00,
        dailyPatientLimit: 100,
        createdAt: '2026-09-08T10:19:10.378Z'
      });
    }

    if (!this.doctors.some(d => d.id === 'doc-02')) {
      this.doctors.push({
        id: 'doc-02',
        userId: 'u-doc-02',
        name: 'Dr. Marcus Vance',
        specialization: 'Dermatology & Aesthetic Medicine',
        biography: 'Specialist in clinical dermatology, laser aesthetics, and advanced skin barrier restoration.',
        qualifications: ['MD (Johns Hopkins)', 'Board Certified Dermatologist', 'Aesthetic Surgery Diplomate'],
        experienceYears: 12,
        languages: ['English', 'Spanish'],
        consultationFee: 3000.00,
        followUpFee: 2000.00,
        dailyPatientLimit: 80,
        createdAt: '2026-09-08T10:19:10.378Z'
      });
    }
  }

  constructor() {
    const targetPath = this.getStorageFilePath();
    if (fs.existsSync(targetPath)) {
      this.loadFromDisk();
    } else {
      this.seedDefaultData();
      this.saveToDisk();
    }
    this.ensureTokensForAppointments();
  }

  loadFromDisk() {
    try {
      const targetPath = this.getStorageFilePath();
      if (fs.existsSync(targetPath)) {
        const raw = fs.readFileSync(targetPath, 'utf-8');
        const parsed = JSON.parse(raw);

        // Core Users & Staff
        if (Array.isArray(parsed.users)) {
          this.users = parsed.users;
        }
        if (Array.isArray(parsed.doctors)) {
          this.doctors = parsed.doctors;
        }
        if (Array.isArray(parsed.patients)) {
          this.patients = parsed.patients;
        }
        if (Array.isArray(parsed.receptionists)) {
          this.receptionists = parsed.receptionists;
        }

        // Operational Transactions & Queue
        if (Array.isArray(parsed.appointments)) {
          this.appointments = parsed.appointments;
        }
        if (Array.isArray(parsed.dailyTokens)) {
          this.dailyTokens = parsed.dailyTokens;
        }
        if (Array.isArray(parsed.queueEntries)) {
          this.queueEntries = parsed.queueEntries;
        }
        if (Array.isArray(parsed.clinicalRecords)) {
          this.clinicalRecords = parsed.clinicalRecords;
        }
        if (Array.isArray(parsed.prescriptions)) {
          this.prescriptions = parsed.prescriptions;
        }
        if (Array.isArray(parsed.prescriptionVersions)) {
          this.prescriptionVersions = parsed.prescriptionVersions;
        }
        if (Array.isArray(parsed.patientPackages)) {
          this.patientPackages = parsed.patientPackages;
        }
        if (Array.isArray(parsed.assignedLabTests)) {
          this.assignedLabTests = parsed.assignedLabTests;
        }
        if (Array.isArray(parsed.dispenseRecords)) {
          this.dispenseRecords = parsed.dispenseRecords;
        }
        if (Array.isArray(parsed.pharmacySales)) {
          this.pharmacySales = parsed.pharmacySales;
        }
        if (Array.isArray(parsed.procurementOrders)) {
          this.procurementOrders = parsed.procurementOrders;
        }
        if (Array.isArray(parsed.salesReturns)) {
          this.salesReturns = parsed.salesReturns;
        }
        if (Array.isArray(parsed.payments)) {
          this.payments = parsed.payments;
        }
        if (Array.isArray(parsed.notificationLogs)) {
          this.notificationLogs = parsed.notificationLogs;
        }
        if (Array.isArray(parsed.doctorPatientRelationships)) {
          this.doctorPatientRelationships = parsed.doctorPatientRelationships;
        }

        // Catalogs & System Configurations
        if (Array.isArray(parsed.services) && parsed.services.length > 0) {
          this.services = parsed.services;
        }
        if (Array.isArray(parsed.medicines) && parsed.medicines.length > 0) {
          this.medicines = parsed.medicines;
        }
        if (Array.isArray(parsed.deals) && parsed.deals.length > 0) {
          this.deals = parsed.deals;
        }
        if (Array.isArray(parsed.aestheticProducts) && parsed.aestheticProducts.length > 0) {
          this.aestheticProducts = parsed.aestheticProducts;
        }
        if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          this.categories = parsed.categories;
        }
        if (Array.isArray(parsed.moduleHierarchy) && parsed.moduleHierarchy.length > 0) {
          this.moduleHierarchy = parsed.moduleHierarchy;
        }
        if (Array.isArray(parsed.rolePermissions) && parsed.rolePermissions.length > 0) {
          this.rolePermissions = parsed.rolePermissions;
        }
        if (parsed.systemSettings) {
          this.systemSettings = { ...this.systemSettings, ...parsed.systemSettings };
        }

        // Safeguard essential accounts and catalogs
        this.ensureCoreAdminAccounts();
        this.ensureDefaultCatalogs();
      }
    } catch {
      // Safe fallback on read failure
    }
  }

  ensureDefaultCatalogs() {
    if (this.services.length === 0) {
      this.services = [
        {
          id: 'srv-01',
          name: 'Cardiology Consultation & ECG',
          description: 'Comprehensive cardiovascular assessment including 12-lead ECG and hemodynamics.',
          baseFee: 2500.00,
          isActive: true
        },
        {
          id: 'srv-02',
          name: 'Dermatological Skin Scan & Biopsy',
          description: 'Full body dermoscopy analysis and targeted skin lesion evaluation.',
          baseFee: 3000.00,
          isActive: true
        },
        {
          id: 'srv-03',
          name: 'General Medical Screening',
          description: 'Routine executive physical and vital metric profiling.',
          baseFee: 1500.00,
          isActive: true
        }
      ];
      this.doctorServices = [
        { doctorId: 'doc-01', serviceId: 'srv-01' },
        { doctorId: 'doc-01', serviceId: 'srv-03' },
        { doctorId: 'doc-02', serviceId: 'srv-02' }
      ];
    }

    if (this.medicines.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      this.medicines = [
        {
          id: 'med-01',
          name: 'Augmentin 625mg',
          genericName: 'Amoxicillin + Clavulanate Potassium',
          brand: 'GSK',
          category: 'Antibiotics',
          form: 'Tablet',
          strength: '625mg',
          stockQuantity: 120,
          minStockAlert: 20,
          unitPrice: 420.00,
          batchNumber: 'AG-9241',
          expiryDate: '2027-11-30',
          shelfLocation: 'Rack B-2',
          supplierName: 'GlaxoSmithKline Pakistan',
          isControlled: false,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-02',
          name: 'Lisinopril 20mg',
          genericName: 'Lisinopril Dihydrate',
          brand: 'Zestril',
          category: 'Cardiology',
          form: 'Tablet',
          strength: '20mg',
          stockQuantity: 85,
          minStockAlert: 15,
          unitPrice: 380.00,
          batchNumber: 'LS-3012',
          expiryDate: '2028-01-15',
          shelfLocation: 'Rack C-1',
          supplierName: 'AstraZeneca / Getz',
          isControlled: false,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-03',
          name: 'Metoprolol Succinate ER 50mg',
          genericName: 'Metoprolol Succinate',
          brand: 'Betaloc CR',
          category: 'Cardiology',
          form: 'Tablet',
          strength: '50mg',
          stockQuantity: 95,
          minStockAlert: 20,
          unitPrice: 310.00,
          batchNumber: 'MS-7714',
          expiryDate: '2027-09-20',
          shelfLocation: 'Rack C-2',
          supplierName: 'AstraZeneca',
          isControlled: false,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-04',
          name: 'Atorvastatin 20mg',
          genericName: 'Atorvastatin Calcium',
          brand: 'Lipitor',
          category: 'Cardiology',
          form: 'Tablet',
          strength: '20mg',
          stockQuantity: 110,
          minStockAlert: 25,
          unitPrice: 580.00,
          batchNumber: 'AT-8821',
          expiryDate: '2028-03-10',
          shelfLocation: 'Rack C-3',
          supplierName: 'Pfizer Pakistan',
          isControlled: false,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-05',
          name: 'Tretinoin 0.05% Micro-Gel',
          genericName: 'Tretinoin Micronized',
          brand: 'Retin-A Micro',
          category: 'Aesthetics & Dermatology',
          form: 'Cream/Ointment',
          strength: '0.05%',
          stockQuantity: 45,
          minStockAlert: 10,
          unitPrice: 890.00,
          batchNumber: 'TR-1102',
          expiryDate: '2026-11-15',
          shelfLocation: 'Rack D-1',
          supplierName: 'Stiefel / GSK',
          isControlled: false,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-06',
          name: 'Botox Cosmetic 100U',
          genericName: 'OnabotulinumtoxinA',
          brand: 'Allergan Botox',
          category: 'Aesthetics & Dermatology',
          form: 'Injection',
          strength: '100 Units',
          stockQuantity: 14,
          minStockAlert: 5,
          unitPrice: 18500.00,
          batchNumber: 'BX-9941',
          expiryDate: '2027-04-30',
          shelfLocation: 'Cold Vault 4°C',
          supplierName: 'Allergan Aesthetics',
          isControlled: true,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-07',
          name: 'Juvederm Ultra Plus XC 1ml',
          genericName: 'Cross-linked Hyaluronic Acid',
          brand: 'Juvederm',
          category: 'Aesthetics & Dermatology',
          form: 'Injection',
          strength: '24mg/ml + 0.3% Lido',
          stockQuantity: 18,
          minStockAlert: 5,
          unitPrice: 22000.00,
          batchNumber: 'JV-4019',
          expiryDate: '2027-07-22',
          shelfLocation: 'Cold Vault 4°C',
          supplierName: 'Allergan Aesthetics',
          isControlled: true,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-08',
          name: 'Panadol Extra 500mg',
          genericName: 'Paracetamol + Caffeine',
          brand: 'GSK Panadol',
          category: 'Analgesics & Pain',
          form: 'Tablet',
          strength: '500mg/65mg',
          stockQuantity: 340,
          minStockAlert: 50,
          unitPrice: 120.00,
          batchNumber: 'PN-6621',
          expiryDate: '2028-06-30',
          shelfLocation: 'Front Counter A-1',
          supplierName: 'GlaxoSmithKline',
          isControlled: false,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-09',
          name: 'Cevit Effervescent 1000mg',
          genericName: 'Vitamin C + Zinc',
          brand: 'Cevit Gold',
          category: 'Vitamins & Supplements',
          form: 'Tablet',
          strength: '1000mg',
          stockQuantity: 210,
          minStockAlert: 30,
          unitPrice: 340.00,
          batchNumber: 'CV-1099',
          expiryDate: '2028-09-18',
          shelfLocation: 'Front Counter A-2',
          supplierName: 'Bayer AG',
          isControlled: false,
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'med-10',
          name: 'Omeprazole 20mg Capsules',
          genericName: 'Omeprazole Magnesium',
          brand: 'Risek 20',
          category: 'General',
          form: 'Capsule',
          strength: '20mg',
          stockQuantity: 160,
          minStockAlert: 25,
          unitPrice: 260.00,
          batchNumber: 'RK-5501',
          expiryDate: '2027-12-31',
          shelfLocation: 'Rack B-1',
          supplierName: 'Getz Pharma',
          isControlled: false,
          createdAt: today,
          updatedAt: today
        }
      ];
    }
  }

  saveToDisk() {
    try {
      const payload = {
        users: this.users,
        patients: this.patients,
        doctors: this.doctors,
        receptionists: this.receptionists,
        services: this.services,
        doctorServices: this.doctorServices,
        medicines: this.medicines,
        appointments: this.appointments,
        dailyTokens: this.dailyTokens,
        queueEntries: this.queueEntries,
        clinicalRecords: this.clinicalRecords,
        prescriptions: this.prescriptions,
        prescriptionVersions: this.prescriptionVersions,
        patientPackages: this.patientPackages,
        assignedLabTests: this.assignedLabTests,
        dispenseRecords: this.dispenseRecords,
        pharmacySales: this.pharmacySales,
        procurementOrders: this.procurementOrders,
        payments: this.payments,
        deals: this.deals,
        aestheticProducts: this.aestheticProducts,
        salesReturns: this.salesReturns,
        categories: this.categories,
        systemSettings: this.systemSettings,
        moduleHierarchy: this.moduleHierarchy,
        rolePermissions: this.rolePermissions,
        savedAt: new Date().toISOString()
      };
      const targetPath = this.getStorageFilePath();
      fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch {
      // Safe fallback on write failure (e.g. read-only serverless filesystem)
    }
  }

  getModuleHierarchy(): HospitalModuleDef[] {
    return this.moduleHierarchy;
  }

  getRolePermissions(): HospitalRoleDefinition[] {
    // Ensure every role's permissions is an array of RolePermissionRule
    for (const roleDef of this.rolePermissions) {
      if (roleDef && !Array.isArray(roleDef.permissions) && typeof roleDef.permissions === 'object') {
        roleDef.permissions = Object.entries(roleDef.permissions).map(([moduleId, rule]: [string, any]) => ({
          moduleId,
          read: typeof rule === 'boolean' ? rule : !!rule?.read,
          write: typeof rule === 'boolean' ? false : !!rule?.write,
          delete: typeof rule === 'boolean' ? false : !!rule?.delete
        }));
      }
    }
    return this.rolePermissions;
  }

  getPermissionsForRole(role: string): RolePermissionRule[] {
    const roleDef = this.rolePermissions.find(r => r.role === role);
    if (roleDef && Array.isArray(roleDef.permissions)) {
      return roleDef.permissions;
    }
    const fallback = DEFAULT_ROLE_PERMISSIONS.find(r => r.role === role);
    return fallback ? fallback.permissions : [];
  }

  updateRolePermissions(role: string, permissions: RolePermissionRule[]): HospitalRoleDefinition {
    let roleDef = this.rolePermissions.find(r => r.role === role);
    if (!roleDef) {
      const defaultMatch = DEFAULT_ROLE_PERMISSIONS.find(r => r.role === role);
      if (defaultMatch) {
        roleDef = JSON.parse(JSON.stringify(defaultMatch));
        this.rolePermissions.push(roleDef!);
      } else {
        throw new Error(`Invalid hospital role: ${role}`);
      }
    }
    if (!roleDef) {
      throw new Error(`Invalid hospital role: ${role}`);
    }

    if (Array.isArray(permissions)) {
      roleDef.permissions = permissions;
    } else if (permissions && typeof permissions === 'object') {
      roleDef.permissions = Object.entries(permissions).map(([moduleId, rule]: [string, any]) => ({
        moduleId,
        read: typeof rule === 'boolean' ? rule : !!rule?.read,
        write: typeof rule === 'boolean' ? false : !!rule?.write,
        delete: typeof rule === 'boolean' ? false : !!rule?.delete
      }));
    }

    this.saveToDisk();
    return roleDef;
  }

  addModuleToRole(
    role: string,
    moduleId: string,
    read: boolean,
    write: boolean,
    deletePerm: boolean,
    newModuleDef?: HospitalModuleDef
  ): HospitalRoleDefinition {
    if (newModuleDef && !this.moduleHierarchy.some(m => m.id === newModuleDef.id)) {
      this.moduleHierarchy.push(newModuleDef);
    }
    let roleDef = this.rolePermissions.find(r => r.role === role);
    if (!roleDef) {
      const defaultMatch = DEFAULT_ROLE_PERMISSIONS.find(r => r.role === role);
      if (defaultMatch) {
        roleDef = JSON.parse(JSON.stringify(defaultMatch));
        this.rolePermissions.push(roleDef!);
      } else {
        throw new Error(`Invalid hospital role: ${role}`);
      }
    }
    if (!roleDef) {
      throw new Error(`Invalid hospital role: ${role}`);
    }
    const existingPerm = roleDef.permissions.find(p => p.moduleId === moduleId);
    if (existingPerm) {
      existingPerm.read = read;
      existingPerm.write = write;
      existingPerm.delete = deletePerm;
    } else {
      roleDef.permissions.push({
        moduleId,
        read,
        write,
        delete: deletePerm
      });
    }
    this.saveToDisk();
    return roleDef;
  }

  removeModuleFromRole(role: string, moduleId: string): HospitalRoleDefinition {
    const roleDef = this.rolePermissions.find(r => r.role === role);
    if (!roleDef) {
      throw new Error(`Role ${role} not found`);
    }
    roleDef.permissions = roleDef.permissions.filter(p => p.moduleId !== moduleId);
    this.saveToDisk();
    return roleDef;
  }

  resetRolePermissions(): HospitalRoleDefinition[] {
    this.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    this.saveToDisk();
    return this.rolePermissions;
  }

  registerCustomModule(moduleDef: HospitalModuleDef): HospitalModuleDef {
    const existing = this.moduleHierarchy.find(m => m.id === moduleDef.id);
    if (existing) {
      existing.label = moduleDef.label;
      existing.category = moduleDef.category;
      existing.categoryLabel = moduleDef.categoryLabel;
      existing.description = moduleDef.description;
      this.saveToDisk();
      return existing;
    }
    this.moduleHierarchy.push(moduleDef);
    this.saveToDisk();
    return moduleDef;
  }

  movePageModule(pageId: string, targetCategory: 'ADMIN' | 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'PHARMACY') {
    const page = this.moduleHierarchy.find(m => m.id === pageId);
    if (!page) {
      throw new Error(`Page with ID ${pageId} not found`);
    }
    const categoryLabels: Record<'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY', string> = {
      ADMIN: 'System Administration',
      CLINICAL: 'Clinical & Doctor Deck',
      RECEPTION: 'Front-Desk & Reception',
      PATIENT: 'Patient Services',
      PHARMACY: 'Pharmacy & Medical Store',
    };
    page.category = targetCategory;
    page.categoryLabel = categoryLabels[targetCategory] || targetCategory;
    this.saveToDisk();
    return page;
  }

  resetModuleHierarchy() {
    this.moduleHierarchy = ORIGINAL_HOSPITAL_MODULES.map(m => ({ ...m }));
    this.saveToDisk();
    return this.moduleHierarchy;
  }

  private seedDefaultData() {
    const salt = bcrypt.genSaltSync(8);
    const defaultPasswordHash = bcrypt.hashSync('Password123!', salt);
    const today = new Date().toISOString().split('T')[0];

    // 0. User chnmnx (Custom Doctor / Admin Profile with full multi-module access)
    const chnmnxPasswordHash = bcrypt.hashSync('1234567', salt);
    const chnmnxUser: DbUser = {
      id: 'u-chnmnx-01',
      username: 'chnmnx',
      name: 'CH Nouman Qamar',
      phone: '+923000000099',
      email: 'chnmnx@hospital.com',
      passwordHash: chnmnxPasswordHash,
      role: 'DOCTOR',
      gender: 'Male',
      dateOfBirth: '1992-05-20',
      cnic: '35201-7654321-9',
      bloodGroup: 'B+',
      department: 'Cardiology & Internal Medicine',
      specialization: 'Cardiology & Internal Medicine',
      licenseNumber: 'PMDC-99210-C',
      qualifications: ['MBBS', 'FCPS', 'Clinical Operations Lead'],
      experienceYears: 10,
      consultationFee: 2500,
      allowedModules: ['doctor_queue', 'doctor_consultation', 'doctor_tokens'],
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const chnmnxDoctor: DbDoctor = {
      id: 'doc-chnmnx',
      userId: 'u-chnmnx-01',
      name: 'CH Nouman Qamar',
      specialization: 'Cardiology & Internal Medicine',
      biography: 'Chief Clinical Operations Lead and Senior Consultant.',
      qualifications: ['MBBS', 'FCPS', 'Clinical Operations Lead'],
      experienceYears: 10,
      languages: ['English', 'Urdu', 'Punjabi'],
      consultationFee: 2500.00,
      followUpFee: 1500.00,
      dailyPatientLimit: 100,
      createdAt: new Date().toISOString()
    };
    this.users.push(chnmnxUser);
    this.doctors.push(chnmnxDoctor);

    // 1. Admin User
    const adminUser: DbUser = {
      id: 'u-admin-01',
      username: 'admin',
      name: 'Root Administrator',
      phone: '+15550000001',
      email: 'admin@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      gender: 'Male',
      department: 'Executive Administration & IT',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.push(adminUser);

    // 2. Doctor Users & Profiles
    const doc1User: DbUser = {
      id: 'u-doc-01',
      username: 'dr_aisha',
      name: 'Dr. Aisha Khan',
      phone: '+15550000002',
      email: 'dr.aisha@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'DOCTOR',
      gender: 'Female',
      dateOfBirth: '1982-06-15',
      cnic: '35201-1122334-5',
      bloodGroup: 'B+',
      department: 'Cardiology',
      licenseNumber: 'PMDC-48921-C',
      qualifications: ['MBBS (King Edward)', 'FCPS (Cardiology)', 'Fellowship (USA)'],
      experienceYears: 15,
      consultationFee: 2500,
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const doc1: DbDoctor = {
      id: 'doc-01',
      userId: 'u-doc-01',
      name: 'Dr. Aisha Khan',
      specialization: 'Cardiology & Internal Medicine',
      biography: 'Board certified specialist in cardiovascular interventions and preventive cardiology with over 15 years clinical experience.',
      qualifications: ['MBBS (King Edward)', 'FCPS (Cardiology)', 'Fellowship in Interventional Cardiology (USA)'],
      experienceYears: 15,
      languages: ['English', 'Urdu', 'Punjabi'],
      consultationFee: 2500.00,
      followUpFee: 1500.00,
      dailyPatientLimit: 100,
      createdAt: new Date().toISOString()
    };

    const doc2User: DbUser = {
      id: 'u-doc-02',
      username: 'dr_marcus',
      name: 'Dr. Marcus Vance',
      phone: '+15550000003',
      email: 'dr.marcus@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'DOCTOR',
      gender: 'Male',
      dateOfBirth: '1985-03-22',
      cnic: '35201-9988112-7',
      bloodGroup: 'O+',
      department: 'Aesthetics & Dermatology',
      licenseNumber: 'PMDC-77312-D',
      qualifications: ['MD (Johns Hopkins)', 'Aesthetic Surgery Diplomate'],
      experienceYears: 12,
      consultationFee: 3000,
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const doc2: DbDoctor = {
      id: 'doc-02',
      userId: 'u-doc-02',
      name: 'Dr. Marcus Vance',
      specialization: 'Dermatology & Aesthetic Medicine',
      biography: 'Specialist in clinical dermatology, laser aesthetics, and advanced skin barrier restoration.',
      qualifications: ['MD (Johns Hopkins)', 'Board Certified Dermatologist', 'Aesthetic Surgery Diplomate'],
      experienceYears: 12,
      languages: ['English', 'Spanish'],
      consultationFee: 3000.00,
      followUpFee: 2000.00,
      dailyPatientLimit: 80,
      createdAt: new Date().toISOString()
    };

    this.users.push(doc1User, doc2User);
    this.doctors.push(doc1, doc2);

    // 3. Receptionist User & Profile
    const recepUser: DbUser = {
      id: 'u-recep-01',
      username: 'sarah_desk',
      name: 'Sarah Jenkins',
      phone: '+15550000004',
      email: 'receptionist@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'RECEPTIONIST',
      gender: 'Female',
      dateOfBirth: '1996-08-14',
      cnic: '35201-5544332-1',
      department: 'Patient Front-Desk',
      deskNumber: 'OPD Counter 1',
      shift: 'Morning Shift (08:00 - 16:00)',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const receptionist: DbReceptionist = {
      id: 'recep-01',
      userId: 'u-recep-01',
      name: 'Sarah Jenkins',
      createdAt: new Date().toISOString()
    };
    this.users.push(recepUser);
    this.receptionists.push(receptionist);

    // 3.1. Pharmacist User
    const pharmaUser: DbUser = {
      id: 'u-pharma-01',
      username: 'tariq_pharma',
      name: 'Tariq Mehmood, RPh',
      phone: '+15550000040',
      email: 'pharmacy@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'PHARMACIST',
      gender: 'Male',
      dateOfBirth: '1984-12-05',
      cnic: '35201-3322119-8',
      department: 'Central Pharmacy & Dispensary',
      licenseNumber: 'RPh-PK-98124',
      experienceYears: 14,
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.push(pharmaUser);

    // 4. Services
    const service1: DbService = {
      id: 'srv-01',
      name: 'Cardiology Consultation & ECG',
      description: 'Comprehensive cardiovascular assessment including 12-lead ECG and hemodynamics.',
      baseFee: 2500.00,
      isActive: true
    };
    const service2: DbService = {
      id: 'srv-02',
      name: 'Dermatological Skin Scan & Biopsy',
      description: 'Full body dermoscopy analysis and targeted skin lesion evaluation.',
      baseFee: 3000.00,
      isActive: true
    };
    const service3: DbService = {
      id: 'srv-03',
      name: 'General Medical Screening',
      description: 'Routine executive physical and vital metric profiling.',
      baseFee: 1500.00,
      isActive: true
    };
    this.services.push(service1, service2, service3);
    this.doctorServices.push(
      { doctorId: 'doc-01', serviceId: 'srv-01' },
      { doctorId: 'doc-01', serviceId: 'srv-03' },
      { doctorId: 'doc-02', serviceId: 'srv-02' }
    );

    // 5. Patient Users & Profiles
    const p1User: DbUser = {
      id: 'u-pat-01',
      username: 'john_doe',
      name: 'John Doe',
      phone: '+15550000010',
      email: 'john.doe@example.com',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
      gender: 'Male',
      dateOfBirth: '1988-04-12',
      cnic: '35201-1234567-1',
      bloodGroup: 'A+',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const patient1: DbPatient = {
      id: 'pat-01',
      userId: 'u-pat-01',
      fullName: 'John Doe',
      cnic: '35201-1234567-1',
      gender: 'Male',
      dateOfBirth: '1988-04-12',
      address: '742 Evergreen Terrace, Sector B',
      emergencyContact: '+15559990001',
      hasWhatsApp: true,
      primaryNotificationChannel: 'WhatsApp',
      backupNotificationChannel: 'SMS',
      createdAt: new Date().toISOString()
    };

    const p2User: DbUser = {
      id: 'u-pat-02',
      username: 'emily_clark',
      name: 'Emily Clark',
      phone: '+15550000020',
      email: 'emily.clark@example.com',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
      gender: 'Female',
      dateOfBirth: '1993-09-24',
      cnic: '35201-7654321-2',
      bloodGroup: 'O+',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const patient2: DbPatient = {
      id: 'pat-02',
      userId: 'u-pat-02',
      fullName: 'Emily Clark',
      cnic: '35201-7654321-2',
      gender: 'Female',
      dateOfBirth: '1993-09-24',
      address: '104 Boulevard West, Suite 4B',
      emergencyContact: '+15559990002',
      hasWhatsApp: true,
      primaryNotificationChannel: 'WhatsApp',
      backupNotificationChannel: 'Email',
      createdAt: new Date().toISOString()
    };

    const p3User: DbUser = {
      id: 'u-pat-03',
      username: 'robert_taylor',
      name: 'Robert Taylor',
      phone: '+15550000030',
      email: 'robert.taylor@example.com',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
      gender: 'Male',
      dateOfBirth: '1975-11-03',
      cnic: '35201-9988776-3',
      bloodGroup: 'AB+',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const patient3: DbPatient = {
      id: 'pat-03',
      userId: 'u-pat-03',
      fullName: 'Robert Taylor',
      cnic: '35201-9988776-3',
      gender: 'Male',
      dateOfBirth: '1975-11-03',
      address: '22 Elm Street, Clinical District',
      emergencyContact: '+15559990003',
      hasWhatsApp: false,
      primaryNotificationChannel: 'SMS',
      backupNotificationChannel: 'Email',
      createdAt: new Date().toISOString()
    };

    this.users.push(p1User, p2User, p3User);
    this.patients.push(patient1, patient2, patient3);

    // 6. Doctor-Patient Permitted Relationships
    this.doctorPatientRelationships.push(
      {
        id: uuidv4(),
        doctorId: 'doc-01',
        patientId: 'pat-01',
        firstVisitDate: '2026-01-10T10:00:00Z',
        lastVisitDate: today + 'T08:30:00Z',
        totalVisits: 3
      },
      {
        id: uuidv4(),
        doctorId: 'doc-01',
        patientId: 'pat-02',
        firstVisitDate: today + 'T09:00:00Z',
        lastVisitDate: today + 'T09:00:00Z',
        totalVisits: 1
      },
      {
        id: uuidv4(),
        doctorId: 'doc-02',
        patientId: 'pat-03',
        firstVisitDate: '2026-02-15T14:00:00Z',
        lastVisitDate: '2026-02-15T14:00:00Z',
        totalVisits: 1
      }
    );

    // 7. Daily Tokens for Today
    // Token 1: John Doe (Completed)
    const t1: DbDailyToken = {
      id: 'tok-01',
      doctorId: 'doc-01',
      date: today,
      tokenNumber: 1,
      status: 'ACTIVE',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    // Token 2: Cancelled (Permanent non-reusable slot)
    const t2: DbDailyToken = {
      id: 'tok-02',
      doctorId: 'doc-01',
      date: today,
      tokenNumber: 2,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    // Token 3: Emily Clark (CONFIRMED but NOT_CHECKED_IN - to test skip logic)
    const t3: DbDailyToken = {
      id: 'tok-03',
      doctorId: 'doc-01',
      date: today,
      tokenNumber: 3,
      status: 'RESERVED',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    // Token 4: Robert Taylor (CONFIRMED & WAITING - should be picked by Call Next)
    const t4: DbDailyToken = {
      id: 'tok-04',
      doctorId: 'doc-01',
      date: today,
      tokenNumber: 4,
      status: 'ACTIVE',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    // Token 5: Emily Clark with Dr. Marcus Vance (PENDING approval)
    const t5: DbDailyToken = {
      id: 'tok-05',
      doctorId: 'doc-02',
      date: today,
      tokenNumber: 1,
      status: 'RESERVED',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    // Token 6: Robert Taylor with Dr. Aisha Khan (PENDING approval)
    const t6: DbDailyToken = {
      id: 'tok-06',
      doctorId: 'doc-01',
      date: today,
      tokenNumber: 5,
      status: 'RESERVED',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    this.dailyTokens.push(t1, t2, t3, t4, t5, t6);

    // 8. Appointments for Today
    const app1: DbAppointment = {
      id: 'apt-01',
      patientId: 'pat-01',
      doctorId: 'doc-01',
      serviceId: 'srv-01',
      appointmentDate: today,
      tokenId: 'tok-01',
      status: 'CONFIRMED',
      bookingSource: 'PORTAL',
      approvedByReceptionistId: 'recep-01',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const app2: DbAppointment = {
      id: 'apt-02',
      patientId: 'pat-02',
      doctorId: 'doc-01',
      serviceId: 'srv-01',
      appointmentDate: today,
      tokenId: 'tok-03',
      status: 'CONFIRMED',
      bookingSource: 'AI_AGENT',
      approvedByReceptionistId: 'recep-01',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const app3: DbAppointment = {
      id: 'apt-03',
      patientId: 'pat-03',
      doctorId: 'doc-01',
      serviceId: 'srv-01',
      appointmentDate: today,
      tokenId: 'tok-04',
      status: 'CONFIRMED',
      bookingSource: 'RECEPTIONIST',
      approvedByReceptionistId: 'recep-01',
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Pending appointment requests awaiting administrative / receptionist approval
    const app4: DbAppointment = {
      id: 'apt-04',
      patientId: 'pat-02',
      doctorId: 'doc-02',
      serviceId: 'srv-02',
      appointmentDate: today,
      tokenId: 'tok-05',
      status: 'PENDING',
      bookingSource: 'PORTAL',
      chiefComplaint: 'Follow-up consultation for recurring skin rash on forearm.',
      isDemo: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    };
    const app5: DbAppointment = {
      id: 'apt-05',
      patientId: 'pat-03',
      doctorId: 'doc-01',
      serviceId: 'srv-01',
      appointmentDate: today,
      tokenId: 'tok-06',
      status: 'PENDING',
      bookingSource: 'AI_AGENT',
      chiefComplaint: 'Mild exertional chest tightness; cardiology checkup requested.',
      isDemo: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    };
    this.appointments.push(app1, app2, app3, app4, app5);

    // 9. Queue Entries
    const qe1: DbQueueEntry = {
      id: 'qe-01',
      appointmentId: 'apt-01',
      queueStatus: 'COMPLETED',
      checkInTime: today + 'T08:15:00Z',
      calledTime: today + 'T08:30:00Z',
      consultationStartTime: today + 'T08:32:00Z',
      consultationEndTime: today + 'T08:55:00Z',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    const qe2: DbQueueEntry = {
      id: 'qe-02',
      appointmentId: 'apt-02',
      queueStatus: 'NOT_CHECKED_IN',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    const qe3: DbQueueEntry = {
      id: 'qe-03',
      appointmentId: 'apt-03',
      queueStatus: 'WAITING',
      checkInTime: today + 'T09:10:00Z',
      isDemo: true,
      createdAt: new Date().toISOString()
    };
    this.queueEntries.push(qe1, qe2, qe3);

    // 10. Clinical Record & Prescription Versions for Completed Appointment (John Doe)
    const cr1: DbClinicalRecord = {
      id: 'cr-01',
      appointmentId: 'apt-01',
      patientId: 'pat-01',
      doctorId: 'doc-01',
      chiefComplaint: 'Occasional palpitations and exertional dyspnea for 2 weeks.',
      examinationNotes: 'BP: 135/85 mmHg, HR: 78 bpm regular, S1/S2 audible with no murmurs. Lungs clear.',
      diagnosis: 'Stage 1 Essential Hypertension with mild sinus tachycardia.',
      treatmentPlan: 'Initiate lifestyle modifications, low sodium diet, and ACE inhibitor therapy.',
      privateNotes: 'Patient expressed anxiety regarding workplace stress; follow-up in 4 weeks.',
      isDemo: true,
      createdAt: today + 'T08:45:00Z',
      updatedAt: today + 'T08:50:00Z'
    };
    this.clinicalRecords.push(cr1);

    const rx1: DbPrescription = {
      id: 'rx-01',
      clinicalRecordId: 'cr-01',
      patientId: 'pat-01',
      isDemo: true,
      createdAt: today + 'T08:48:00Z'
    };
    this.prescriptions.push(rx1);

    // Version 1 (Superseded)
    const rx1v1: DbPrescriptionVersion = {
      id: 'rx-v1-01',
      prescriptionId: 'rx-01',
      versionNumber: 1,
      doctorId: 'doc-01',
      medicationsJson: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once Daily',
          duration: '30 Days',
          instructions: 'Take in the morning with a full glass of water'
        },
        {
          name: 'Metoprolol Tartrate',
          dosage: '25mg',
          frequency: 'Twice Daily',
          duration: '14 Days',
          instructions: 'Take after meals'
        }
      ],
      correctionReason: undefined,
      isCurrent: false,
      isDemo: true,
      createdAt: today + 'T08:48:00Z'
    };

    // Version 2 (Current - dosage adjusted due to BP reading)
    const rx1v2: DbPrescriptionVersion = {
      id: 'rx-v2-01',
      prescriptionId: 'rx-01',
      versionNumber: 2,
      doctorId: 'doc-01',
      medicationsJson: [
        {
          name: 'Lisinopril',
          dosage: '20mg',
          frequency: 'Once Daily',
          duration: '30 Days',
          instructions: 'Increased dosage from 10mg to 20mg for optimal target pressure'
        },
        {
          name: 'Metoprolol Succinate ER',
          dosage: '50mg',
          frequency: 'Once Daily',
          duration: '30 Days',
          instructions: 'Converted to extended-release formulation'
        }
      ],
      correctionReason: 'Optimized ACE inhibitor dosage for target pressure and switched beta blocker to once-daily extended release.',
      isCurrent: true,
      isDemo: true,
      createdAt: today + 'T08:52:00Z'
    };
    this.prescriptionVersions.push(rx1v1, rx1v2);

    // 10.1 Pharmacy Medicines Inventory
    this.medicines = [
      {
        id: 'med-01',
        name: 'Augmentin 625mg',
        genericName: 'Amoxicillin + Clavulanate Potassium',
        brand: 'GSK',
        category: 'Antibiotics',
        form: 'Tablet',
        strength: '625mg',
        stockQuantity: 120,
        minStockAlert: 20,
        unitPrice: 420.00,
        batchNumber: 'AG-9241',
        expiryDate: '2027-11-30',
        shelfLocation: 'Rack B-2',
        supplierName: 'GlaxoSmithKline Pakistan',
        isControlled: false,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-02',
        name: 'Lisinopril 20mg',
        genericName: 'Lisinopril Dihydrate',
        brand: 'Zestril',
        category: 'Cardiology',
        form: 'Tablet',
        strength: '20mg',
        stockQuantity: 85,
        minStockAlert: 15,
        unitPrice: 380.00,
        batchNumber: 'LS-3012',
        expiryDate: '2028-01-15',
        shelfLocation: 'Rack C-1',
        supplierName: 'AstraZeneca / Getz',
        isControlled: false,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-03',
        name: 'Metoprolol Succinate ER 50mg',
        genericName: 'Metoprolol Succinate',
        brand: 'Betaloc CR',
        category: 'Cardiology',
        form: 'Tablet',
        strength: '50mg',
        stockQuantity: 95,
        minStockAlert: 20,
        unitPrice: 310.00,
        batchNumber: 'MS-7714',
        expiryDate: '2027-09-20',
        shelfLocation: 'Rack C-2',
        supplierName: 'AstraZeneca',
        isControlled: false,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-04',
        name: 'Atorvastatin 20mg',
        genericName: 'Atorvastatin Calcium',
        brand: 'Lipitor',
        category: 'Cardiology',
        form: 'Tablet',
        strength: '20mg',
        stockQuantity: 110,
        minStockAlert: 25,
        unitPrice: 580.00,
        batchNumber: 'AT-8821',
        expiryDate: '2028-03-10',
        shelfLocation: 'Rack C-3',
        supplierName: 'Pfizer Pakistan',
        isControlled: false,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-05',
        name: 'Tretinoin 0.05% Micro-Gel',
        genericName: 'Tretinoin Micronized',
        brand: 'Retin-A Micro',
        category: 'Aesthetics & Dermatology',
        form: 'Cream/Ointment',
        strength: '0.05%',
        stockQuantity: 45,
        minStockAlert: 10,
        unitPrice: 890.00,
        batchNumber: 'TR-1102',
        expiryDate: '2026-11-15',
        shelfLocation: 'Rack D-1',
        supplierName: 'Stiefel / GSK',
        isControlled: false,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-06',
        name: 'Botox Cosmetic 100U',
        genericName: 'OnabotulinumtoxinA',
        brand: 'Allergan Botox',
        category: 'Aesthetics & Dermatology',
        form: 'Injection',
        strength: '100 Units',
        stockQuantity: 14,
        minStockAlert: 5,
        unitPrice: 18500.00,
        batchNumber: 'BX-9941',
        expiryDate: '2027-04-30',
        shelfLocation: 'Cold Vault 4°C',
        supplierName: 'Allergan Aesthetics',
        isControlled: true,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-07',
        name: 'Juvederm Ultra Plus XC 1ml',
        genericName: 'Cross-linked Hyaluronic Acid',
        brand: 'Juvederm',
        category: 'Aesthetics & Dermatology',
        form: 'Injection',
        strength: '24mg/ml + 0.3% Lido',
        stockQuantity: 18,
        minStockAlert: 5,
        unitPrice: 22000.00,
        batchNumber: 'JV-4019',
        expiryDate: '2027-07-22',
        shelfLocation: 'Cold Vault 4°C',
        supplierName: 'Allergan Aesthetics',
        isControlled: true,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-08',
        name: 'Panadol Extra 500mg',
        genericName: 'Paracetamol + Caffeine',
        brand: 'GSK Panadol',
        category: 'Analgesics & Pain',
        form: 'Tablet',
        strength: '500mg/65mg',
        stockQuantity: 340,
        minStockAlert: 50,
        unitPrice: 120.00,
        batchNumber: 'PN-6621',
        expiryDate: '2028-06-30',
        shelfLocation: 'Front Counter A-1',
        supplierName: 'GlaxoSmithKline',
        isControlled: false,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-09',
        name: 'Cevit Effervescent 1000mg',
        genericName: 'Vitamin C + Zinc',
        brand: 'Cevit Gold',
        category: 'Vitamins & Supplements',
        form: 'Tablet',
        strength: '1000mg',
        stockQuantity: 85,
        minStockAlert: 20,
        unitPrice: 380.00,
        batchNumber: 'CV-3310',
        expiryDate: '2027-08-14',
        shelfLocation: 'Front Showcase',
        supplierName: 'Abbott Laboratories',
        isControlled: false,
        createdAt: today,
        updatedAt: today
      },
      {
        id: 'med-10',
        name: 'Ciprofloxacin 500mg',
        genericName: 'Ciprofloxacin HCl',
        brand: 'Ciproxin',
        category: 'Antibiotics',
        form: 'Tablet',
        strength: '500mg',
        stockQuantity: 12,
        minStockAlert: 25,
        unitPrice: 450.00,
        batchNumber: 'CP-2019',
        expiryDate: '2026-10-10',
        shelfLocation: 'Rack B-4',
        supplierName: 'Bayer Pakistan',
        isControlled: false,
        createdAt: today,
        updatedAt: today
      }
    ];

    // 10.2 Pharmacy Dispense Records
    this.dispenseRecords = [
      {
        id: 'disp-01',
        prescriptionId: 'rx-01',
        prescriptionVersionId: 'rx-v2-01',
        patientId: 'pat-01',
        patientName: 'John Doe',
        patientPhone: '+15550000010',
        doctorId: 'doc-01',
        doctorName: 'Dr. Aisha Khan',
        diagnosis: 'Stage 1 Essential Hypertension',
        status: 'PENDING',
        items: [
          {
            medicineId: 'med-02',
            name: 'Lisinopril 20mg',
            dosage: '20mg',
            frequency: 'Once Daily',
            duration: '30 Days',
            quantityPrescribed: 30,
            quantityDispensed: 0,
            batchNumber: 'LS-3012',
            unitPrice: 380.00,
            subtotal: 380.00
          },
          {
            medicineId: 'med-03',
            name: 'Metoprolol Succinate ER 50mg',
            dosage: '50mg',
            frequency: 'Once Daily',
            duration: '30 Days',
            quantityPrescribed: 30,
            quantityDispensed: 0,
            batchNumber: 'MS-7714',
            unitPrice: 310.00,
            subtotal: 310.00
          }
        ],
        totalAmount: 690.00,
        isDemo: true,
        createdAt: today + 'T08:53:00Z'
      },
      {
        id: 'disp-02',
        prescriptionId: 'rx-02',
        patientId: 'pat-02',
        patientName: 'Robert Taylor',
        patientPhone: '+15550000030',
        doctorId: 'doc-01',
        doctorName: 'Dr. Aisha Khan',
        diagnosis: 'Hyperlipidemia & Statin Therapy',
        status: 'DISPENSED',
        items: [
          {
            medicineId: 'med-04',
            name: 'Atorvastatin 20mg',
            dosage: '20mg',
            frequency: 'Once Daily at Night',
            duration: '30 Days',
            quantityPrescribed: 30,
            quantityDispensed: 30,
            batchNumber: 'AT-8821',
            unitPrice: 580.00,
            subtotal: 580.00
          }
        ],
        totalAmount: 580.00,
        pharmacistId: 'u-pharma-01',
        pharmacistName: 'Tariq Mehmood, RPh',
        dispensedAt: today + 'T09:15:00Z',
        notes: 'Counselled on taking medication after dinner. Verified liver profile clear.',
        isDemo: true,
        createdAt: today + 'T09:00:00Z'
      }
    ];

    // 10.3 Procurement Orders
    this.procurementOrders = [
      {
        id: 'po-101',
        poNumber: 'PO-2026-0881',
        supplierName: 'GlaxoSmithKline Pakistan',
        supplierContact: '+92 21 35060121 (Karachi Hub)',
        status: 'ORDERED',
        orderDate: today,
        expectedDelivery: today,
        totalCost: 52000.00,
        items: [
          { name: 'Augmentin 625mg', quantity: 60, unitCost: 350.00 },
          { name: 'Panadol Extra 500mg', quantity: 200, unitCost: 85.00 }
        ],
        createdAt: today + 'T07:30:00Z'
      },
      {
        id: 'po-102',
        poNumber: 'PO-2026-0879',
        supplierName: 'Allergan Aesthetics ME',
        supplierContact: '+971 4 4289000',
        status: 'RECEIVED',
        orderDate: '2026-09-01',
        expectedDelivery: '2026-09-05',
        totalCost: 285000.00,
        items: [
          { name: 'Botox Cosmetic 100U', quantity: 10, unitCost: 15500.00 },
          { name: 'Juvederm Ultra Plus XC 1ml', quantity: 10, unitCost: 18500.00 }
        ],
        receivedAt: today + 'T08:00:00Z',
        createdAt: '2026-09-01T10:00:00Z'
      }
    ];

    // 11. Payments
    this.payments.push(
      {
        id: 'pay-01',
        invoiceNumber: 'INV-100241',
        patientId: 'pat-01',
        appointmentId: 'apt-01',
        totalAmount: 2500.00,
        discount: 0.00,
        amountPaid: 2500.00,
        balanceDue: 0.00,
        status: 'PAID',
        paymentMethod: 'CASH',
        category: 'CONSULTATION',
        paymentPlan: 'FULL',
        notes: 'Initial cardiology consultation settled in full.',
        isDemo: true,
        createdAt: today + 'T08:15:00Z'
      },
      {
        id: 'pay-02',
        invoiceNumber: 'INV-100242',
        patientId: 'pat-02',
        appointmentId: 'apt-02',
        totalAmount: 3000.00,
        discount: 500.00,
        amountPaid: 1500.00,
        balanceDue: 1000.00,
        status: 'PARTIAL',
        paymentMethod: 'JAZZCASH',
        category: 'PROCEDURE',
        paymentPlan: 'INSTALLMENT_1',
        notes: 'Special waiver Rs. 500 applied. 50% advance received via JazzCash.',
        isDemo: true,
        createdAt: today + 'T09:00:00Z'
      }
    );

    // 11.1 Patient Aesthetic Packages & Treatment Deals
    this.patientPackages = [
      {
        id: 'pkg-01',
        patientId: 'pat-01',
        packageName: 'HydraFacial Glow Deal - 3 Sessions',
        category: 'AESTHETICS',
        totalSessions: 3,
        completedSessions: 2,
        remainingSessions: 1,
        purchasedDate: '2026-08-15',
        expiryDate: '2026-11-15',
        lastSessionDate: '2026-08-28',
        nextRecommendedDate: today,
        status: 'ACTIVE',
        pricePKR: 18000,
        notes: 'Special summer aesthetics deal. Session #3 remaining for final glow booster.',
        isDemo: true
      },
      {
        id: 'pkg-02',
        patientId: 'pat-01',
        packageName: 'PRP Hair Rejuvenation - 4 Sessions Deal',
        category: 'DERMATOLOGY',
        totalSessions: 4,
        completedSessions: 1,
        remainingSessions: 3,
        purchasedDate: '2026-08-20',
        expiryDate: '2026-12-20',
        lastSessionDate: '2026-08-20',
        nextRecommendedDate: '2026-09-18',
        status: 'ACTIVE',
        pricePKR: 35000,
        notes: 'Monthly scalp PRP therapy with micro-needling.',
        isDemo: true
      },
      {
        id: 'pkg-03',
        patientId: 'pat-02',
        packageName: 'Full Laser Hair Reduction - 6 Sessions',
        category: 'AESTHETICS',
        totalSessions: 6,
        completedSessions: 4,
        remainingSessions: 2,
        purchasedDate: '2026-05-10',
        expiryDate: '2026-11-30',
        lastSessionDate: '2026-08-14',
        nextRecommendedDate: today,
        status: 'ACTIVE',
        pricePKR: 45000,
        notes: 'Session #5 due for arms and underarms.',
        isDemo: true
      }
    ];

    // 11.2 Doctor-Assigned Diagnostic Lab Tests
    this.assignedLabTests = [
      {
        id: 'lab-01',
        patientId: 'pat-01',
        doctorId: 'doc-01',
        doctorName: 'Dr. Aisha Khan',
        testName: 'Complete Blood Count (CBC) & Serum Ferritin',
        category: 'HEMATOLOGY',
        assignedDate: '2026-09-08',
        dueDate: today,
        instructions: '12-hour fasting required before morning sample collection at the main lab.',
        status: 'ASSIGNED',
        reminderSentCount: 1,
        lastReminderSentAt: today + 'T07:00:00Z',
        isDemo: true,
        createdAt: '2026-09-08T10:30:00Z'
      },
      {
        id: 'lab-02',
        patientId: 'pat-02',
        doctorId: 'doc-02',
        doctorName: 'Dr. Marcus Vance',
        testName: 'Hormonal Panel (Thyroid TSH, FSH, Serum LH)',
        category: 'HORMONES',
        assignedDate: '2026-09-09',
        dueDate: today,
        instructions: 'Sample should be collected early morning between 08:00 AM - 10:00 AM.',
        status: 'PENDING_SAMPLE',
        reminderSentCount: 0,
        isDemo: true,
        createdAt: '2026-09-09T14:15:00Z'
      }
    ];

    // 12. Seed Historical Data for Multi-Period Reports (Daily, Weekly, Monthly, Yearly)
    const seedHistoricalReportsData = () => {
      const now = new Date();
      const doctorsList = ['doc-01', 'doc-02'];
      const patientsList = ['pat-01', 'pat-02', 'pat-03'];
      const categoriesList: Array<'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'PHARMACY' | 'EMERGENCY'> = [
        'CONSULTATION', 'PROCEDURE', 'LAB_TEST', 'PHARMACY', 'CONSULTATION', 'PROCEDURE'
      ];
      const methodsList: Array<'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER' | 'INSURANCE'> = [
        'CASH', 'CARD', 'JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER', 'CASH', 'CARD'
      ];
      const serviceFees: Record<string, number> = {
        CONSULTATION: 2500,
        PROCEDURE: 4500,
        LAB_TEST: 1800,
        PHARMACY: 1200,
        EMERGENCY: 3500
      };

      // A. Today's Hourly Progression (for Daily Report)
      const docTokenCounters: Record<string, number> = {};
      this.dailyTokens.filter(t => t.date === today).forEach(t => {
        docTokenCounters[t.doctorId] = Math.max(docTokenCounters[t.doctorId] || 0, t.tokenNumber || 0);
      });

      const todayHours = [8, 9, 10, 11, 12, 14, 15, 16, 17];
      todayHours.forEach((hour, idx) => {
        const hourStr = String(hour).padStart(2, '0');
        const cat = categoriesList[idx % categoriesList.length];
        const fee = serviceFees[cat];
        const docId = doctorsList[idx % doctorsList.length];
        const patId = patientsList[idx % patientsList.length];
        const aptId = `apt-hist-today-${idx + 1}`;
        const payId = `pay-hist-today-${idx + 1}`;
        const createdAtTime = `${today}T${hourStr}:${(idx * 7) % 50}:00Z`;

        const nextTokNum = (docTokenCounters[docId] || 0) + 1;
        docTokenCounters[docId] = nextTokNum;
        const tokId = `tok-hist-today-${idx + 1}`;

        this.dailyTokens.push({
          id: tokId,
          doctorId: docId,
          date: today,
          tokenNumber: nextTokNum,
          status: 'ACTIVE',
          isDemo: true,
          createdAt: createdAtTime
        });

        this.appointments.push({
          id: aptId,
          patientId: patId,
          doctorId: docId,
          serviceId: cat === 'PROCEDURE' ? 'srv-02' : 'srv-01',
          appointmentDate: today,
          tokenId: tokId,
          status: 'CONFIRMED',
          bookingSource: idx % 2 === 0 ? 'PORTAL' : 'AI_AGENT',
          approvedByReceptionistId: 'recep-01',
          isDemo: true,
          createdAt: createdAtTime,
          updatedAt: createdAtTime
        });

        this.queueEntries.push({
          id: `qe-hist-today-${idx + 1}`,
          appointmentId: aptId,
          queueStatus: 'COMPLETED',
          checkInTime: `${today}T${hourStr}:05:00Z`,
          calledTime: `${today}T${hourStr}:15:00Z`,
          consultationStartTime: `${today}T${hourStr}:18:00Z`,
          consultationEndTime: `${today}T${hourStr}:38:00Z`,
          isDemo: true,
          createdAt: createdAtTime
        });

        this.payments.push({
          id: payId,
          invoiceNumber: `INV-${100250 + idx}`,
          patientId: patId,
          appointmentId: aptId,
          totalAmount: fee,
          discount: idx === 3 ? 300 : 0,
          amountPaid: idx === 3 ? fee - 300 : fee,
          balanceDue: 0,
          status: 'PAID',
          paymentMethod: methodsList[idx % methodsList.length],
          category: cat,
          paymentPlan: 'FULL',
          notes: `${cat} settlement completed at ${hourStr}:00.`,
          isDemo: true,
          createdAt: createdAtTime
        });
      });

      // B. Last 30 Days Progression (for Weekly & Monthly Reports)
      for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
        const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        // 2 to 4 transactions per day
        const txPerDay = (dayOffset % 3) + 2;
        for (let t = 0; t < txPerDay; t++) {
          const cat = categoriesList[(dayOffset + t) % categoriesList.length];
          const fee = serviceFees[cat];
          const docId = doctorsList[(dayOffset + t) % doctorsList.length];
          const patId = patientsList[(dayOffset + t) % patientsList.length];
          const hour = 9 + (t * 2);
          const hourStr = String(hour).padStart(2, '0');
          const timeIso = `${dateStr}T${hourStr}:20:00Z`;
          const aptId = `apt-hist-m-${dayOffset}-${t}`;

          this.appointments.push({
            id: aptId,
            patientId: patId,
            doctorId: docId,
            serviceId: cat === 'PROCEDURE' ? 'srv-02' : 'srv-01',
            appointmentDate: dateStr,
            status: 'CONFIRMED',
            bookingSource: (t + dayOffset) % 2 === 0 ? 'PORTAL' : 'RECEPTIONIST',
            approvedByReceptionistId: 'recep-01',
            isDemo: true,
            createdAt: timeIso,
            updatedAt: timeIso
          });

          this.queueEntries.push({
            id: `qe-hist-m-${dayOffset}-${t}`,
            appointmentId: aptId,
            queueStatus: 'COMPLETED',
            checkInTime: `${dateStr}T${hourStr}:10:00Z`,
            calledTime: `${dateStr}T${hourStr}:22:00Z`,
            consultationStartTime: `${dateStr}T${hourStr}:25:00Z`,
            consultationEndTime: `${dateStr}T${hourStr}:45:00Z`,
            isDemo: true,
            createdAt: timeIso
          });

          const isPartial = (dayOffset + t) % 7 === 0;
          const discountAmt = (dayOffset + t) % 5 === 0 ? 500 : 0;
          const net = fee - discountAmt;
          const paid = isPartial ? Math.round(net / 2) : net;
          const due = net - paid;

          this.payments.push({
            id: `pay-hist-m-${dayOffset}-${t}`,
            invoiceNumber: `INV-${100300 + dayOffset * 10 + t}`,
            patientId: patId,
            appointmentId: aptId,
            totalAmount: fee,
            discount: discountAmt,
            amountPaid: paid,
            balanceDue: due,
            status: isPartial ? 'PARTIAL' : 'PAID',
            paymentMethod: methodsList[(dayOffset + t) % methodsList.length],
            category: cat,
            paymentPlan: isPartial ? 'INSTALLMENT_1' : 'FULL',
            notes: `Clinical settlement for ${cat}.`,
            isDemo: true,
            createdAt: timeIso
          });
        }
      }

      // C. Last 12 Months Progression (for Yearly Report)
      for (let m = 2; m <= 11; m++) {
        const mDate = new Date(now.getFullYear(), now.getMonth() - m, 15, 11, 0, 0);
        const mDateStr = mDate.toISOString().split('T')[0];
        // 5 clustered transactions per month
        for (let k = 0; k < 5; k++) {
          const cat = categoriesList[k % categoriesList.length];
          const fee = serviceFees[cat];
          const docId = doctorsList[k % doctorsList.length];
          const patId = patientsList[k % patientsList.length];
          const timeIso = `${mDateStr}T${10 + k}:00:00Z`;
          const aptId = `apt-hist-yr-${m}-${k}`;

          this.appointments.push({
            id: aptId,
            patientId: patId,
            doctorId: docId,
            serviceId: 'srv-01',
            appointmentDate: mDateStr,
            status: 'CONFIRMED',
            bookingSource: 'PORTAL',
            approvedByReceptionistId: 'recep-01',
            isDemo: true,
            createdAt: timeIso,
            updatedAt: timeIso
          });

          this.payments.push({
            id: `pay-hist-yr-${m}-${k}`,
            invoiceNumber: `INV-${101000 + m * 10 + k}`,
            patientId: patId,
            appointmentId: aptId,
            totalAmount: fee,
            discount: 0,
            amountPaid: fee,
            balanceDue: 0,
            status: 'PAID',
            paymentMethod: methodsList[k % methodsList.length],
            category: cat,
            paymentPlan: 'FULL',
            notes: `Historical archive invoice for ${mDate.toLocaleString('default', { month: 'short' })}.`,
            isDemo: true,
            createdAt: timeIso
          });
        }
      }
    };

    seedHistoricalReportsData();

    // 13. Aesthetic Deals & Multi-Session Packages
    this.deals = [
      {
        id: 'deal-01',
        name: 'HydraFacial Deluxe (5 Sessions)',
        totalPrice: 18000,
        description: '5 deep pore extraction, exfoliation, antioxidant infusion & LED light therapy sessions.',
        sessionsAllowed: 5,
        category: 'Facials & Peels',
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      },
      {
        id: 'deal-02',
        name: 'Full Body Laser Hair Removal (6 Sessions)',
        totalPrice: 65000,
        description: 'Triple-wavelength Diode + Alexandrite laser package with cooling tip technology.',
        sessionsAllowed: 6,
        category: 'Laser Treatments',
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      },
      {
        id: 'deal-03',
        name: 'Carbon Hollywood Laser Peel (3 Sessions)',
        totalPrice: 15000,
        description: 'Q-switched Nd:YAG carbon paste laser peel for instant glass skin glow & pore reduction.',
        sessionsAllowed: 3,
        category: 'Laser Treatments',
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      },
      {
        id: 'deal-04',
        name: 'PRP Hair Rejuvenation (4 Sessions)',
        totalPrice: 28000,
        description: 'Autologous platelet-rich plasma scalp micro-injections for follicular density.',
        sessionsAllowed: 4,
        category: 'Hair Restoration',
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      }
    ];

    // 14. Aesthetic Skincare Retail Products
    this.aestheticProducts = [
      {
        id: 'prod-01',
        name: 'Hyaluronic B5 Intense Hydrating Serum 30ml',
        sku: 'SKN-SRM-001',
        barcode: '890123450011',
        categoryName: 'Serums & Actives',
        costPrice: 2200,
        sellingPrice: 3800,
        taxClass: 'Standard',
        stockQuantity: 45,
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      },
      {
        id: 'prod-02',
        name: 'Invisible Shield Mineral Sunblock SPF 60 PA+++',
        sku: 'SKN-SUN-002',
        barcode: '890123450028',
        categoryName: 'Sun Protection',
        costPrice: 1400,
        sellingPrice: 2600,
        taxClass: 'Standard',
        stockQuantity: 80,
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      },
      {
        id: 'prod-03',
        name: 'Retinol 0.5% Encapsulated Youth Cream 50g',
        sku: 'SKN-RET-003',
        barcode: '890123450035',
        categoryName: 'Anti-Aging',
        costPrice: 2800,
        sellingPrice: 4900,
        taxClass: 'Standard',
        stockQuantity: 30,
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      },
      {
        id: 'prod-04',
        name: 'Vitamin C 20% + Ferulic Glow Booster 30ml',
        sku: 'SKN-VIT-004',
        barcode: '890123450042',
        categoryName: 'Brightening',
        costPrice: 2500,
        sellingPrice: 4200,
        taxClass: 'Standard',
        stockQuantity: 50,
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      },
      {
        id: 'prod-05',
        name: 'Gentle Clarifying Salicylic Foaming Wash 150ml',
        sku: 'SKN-CLN-005',
        barcode: '890123450059',
        categoryName: 'Cleansers',
        costPrice: 900,
        sellingPrice: 1850,
        taxClass: 'Standard',
        stockQuantity: 65,
        isActive: true,
        createdAt: today + 'T08:00:00Z'
      }
    ];

    // 15. Initial Demo Sales Return
    this.salesReturns = [
      {
        id: 'ret-01',
        returnNumber: 'RET-2026-001',
        paymentId: 'pay-02',
        invoiceNumber: 'INV-100242',
        patientId: 'pat-02',
        patientName: 'Emily Clark',
        refundAmount: 500,
        refundMethod: 'WALLET',
        reason: 'Client requested reschedule & post-treatment product credit conversion.',
        processedBy: 'receptionist@hospital.com',
        createdAt: today + 'T10:00:00Z'
      }
    ];

    // Give John Doe an initial active aesthetic package with 1 session completed
    const existingP1 = this.payments.find(p => p.id === 'pay-01');
    if (existingP1) {
      existingP1.doctorId = 'doc-01';
      existingP1.doctorName = 'Dr. Aisha Khan';
      existingP1.dealId = 'deal-01';
      existingP1.dealName = 'HydraFacial Deluxe (5 Sessions)';
      existingP1.sessionsAllowed = 5;
      existingP1.sessionsConsumed = 1;
      existingP1.sessionRemarks = [
        {
          sessionNumber: 1,
          date: today + 'T08:30:00Z',
          remarks: 'Session 1: Deep exfoliation and saline vortex infusion performed. Patient skin clear, no erythema.',
          doctorName: 'Dr. Aisha Khan'
        }
      ];
    }
  }

  ensureTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const hasToday = this.appointments.some(a => a.appointmentDate === today);
    if (!hasToday && this.appointments.length > 0) {
      const dates = Array.from(new Set(this.appointments.map(a => a.appointmentDate))).sort().reverse();
      const mostRecent = dates[0];
      if (mostRecent && mostRecent !== today) {
        this.appointments.forEach(a => {
          if (a.appointmentDate === mostRecent) {
            a.appointmentDate = today;
          }
        });
        this.dailyTokens.forEach(t => {
          if (t.date === mostRecent) {
            t.date = today;
          }
        });
      }
    }
    this.ensureTokensForAppointments();
  }

  ensureTokensForAppointments() {
    let modified = false;
    const docDateCounters: Record<string, number> = {};

    this.dailyTokens.forEach(t => {
      const key = `${t.doctorId}_${t.date}`;
      docDateCounters[key] = Math.max(docDateCounters[key] || 0, t.tokenNumber || 0);
    });

    this.appointments.forEach(a => {
      let token = a.tokenId ? this.dailyTokens.find(t => t.id === a.tokenId) : null;
      if (!token || !token.tokenNumber || token.tokenNumber <= 0) {
        const key = `${a.doctorId}_${a.appointmentDate}`;
        const nextNum = (docDateCounters[key] || 0) + 1;
        docDateCounters[key] = nextNum;

        if (token) {
          token.tokenNumber = nextNum;
        } else {
          token = {
            id: `tok-auto-${a.id.slice(0, 12)}`,
            doctorId: a.doctorId,
            date: a.appointmentDate,
            tokenNumber: nextNum,
            status: a.status === 'CONFIRMED' ? 'ACTIVE' : 'RESERVED',
            isDemo: a.isDemo,
            createdAt: a.createdAt || new Date().toISOString()
          };
          this.dailyTokens.push(token);
          a.tokenId = token.id;
        }
        modified = true;
      }
    });

    if (modified) {
      this.saveToDisk();
    }
  }

  getDatabaseStats() {
    return {
      patients: this.patients.length,
      appointments: this.appointments.length,
      queueEntries: this.queueEntries.length,
      dailyTokens: this.dailyTokens.length,
      clinicalRecords: this.clinicalRecords.length,
      prescriptions: this.prescriptions.length,
      payments: this.payments.length,
      notificationLogs: this.notificationLogs.length,
      users: this.users.length,
      doctors: this.doctors.length,
      receptionists: this.receptionists.length,
      services: this.services.length,
      medicines: this.medicines.length,
      dispenseRecords: this.dispenseRecords.length,
      patientPackages: this.patientPackages.length,
      assignedLabTests: this.assignedLabTests.length,
      procurementOrders: this.procurementOrders.length,
      salesReturns: this.salesReturns.length
    };
  }

  purgeRoughData() {
    const statsBefore = this.getDatabaseStats();

    // 1. Wipe all transactional rough data across every module
    this.appointments = [];
    this.queueEntries = [];
    this.dailyTokens = [];
    this.clinicalRecords = [];
    this.prescriptions = [];
    this.prescriptionVersions = [];
    this.payments = [];
    this.notificationLogs = [];
    this.doctorPatientRelationships = [];
    this.dispenseRecords = [];
    this.pharmacySales = [];
    this.procurementOrders = [];
    this.salesReturns = [];
    this.patientPackages = [];
    this.assignedLabTests = [];

    // 2. Completely wipe all dummy/mock patient profiles & patient login user accounts
    this.patients = [];
    const beforeUsersCount = this.users.length;
    // Strictly remove all PATIENT role users (including demo patient logins like john_doe, emily_clark, robert_taylor, etc.)
    this.users = this.users.filter(u => u.role !== 'PATIENT');
    const purgedPatientUsers = beforeUsersCount - this.users.length;

    // 3. Preserve staff doctors and receptionists
    const validDoctorUserIds = new Set(this.users.filter(u => u.role === 'DOCTOR').map(u => u.id));
    this.doctors = this.doctors.filter(d => validDoctorUserIds.has(d.userId) || d.id === 'doc-chnmnx' || d.id === 'doc-01' || d.id === 'doc-02');

    const validRecepUserIds = new Set(this.users.filter(u => u.role === 'RECEPTIONIST').map(u => u.id));
    this.receptionists = this.receptionists.filter(r => validRecepUserIds.has(r.userId) || r.id === 'recep-01');

    // Guarantee core admin and clinical staff accounts
    this.ensureCoreAdminAccounts();

    // Update settings timestamp
    this.systemSettings = {
      ...this.systemSettings,
      updatedAt: new Date().toISOString()
    };

    // 4. Save clean slate to disk
    this.saveToDisk();

    return {
      purged: {
        patients: statsBefore.patients,
        dummyPatientUsers: purgedPatientUsers,
        appointments: statsBefore.appointments,
        queueEntries: statsBefore.queueEntries,
        dailyTokens: statsBefore.dailyTokens,
        clinicalRecords: statsBefore.clinicalRecords,
        prescriptions: statsBefore.prescriptions,
        patientPackages: statsBefore.patientPackages,
        assignedLabTests: statsBefore.assignedLabTests,
        payments: statsBefore.payments,
        dispenseRecords: statsBefore.dispenseRecords,
        procurementOrders: statsBefore.procurementOrders || 0,
        salesReturns: statsBefore.salesReturns || 0,
        notificationLogs: statsBefore.notificationLogs
      },
      preserved: {
        staffUsers: this.users.length,
        doctors: this.doctors.length,
        receptionists: this.receptionists.length,
        services: this.services.length,
        medicines: this.medicines.length,
        deals: this.deals.length,
        aestheticProducts: this.aestheticProducts.length
      },
      purgedAt: new Date().toISOString()
    };
  }

  resetToDefaultDemo() {
    this.users = [];
    this.patients = [];
    this.doctors = [];
    this.receptionists = [];
    this.services = [];
    this.doctorServices = [];
    this.dailyTokens = [];
    this.appointments = [];
    this.queueEntries = [];
    this.clinicalRecords = [];
    this.prescriptions = [];
    this.prescriptionVersions = [];
    this.doctorPatientRelationships = [];
    this.payments = [];
    this.notificationLogs = [];
    this.medicines = [];
    this.dispenseRecords = [];
    this.pharmacySales = [];
    this.procurementOrders = [];
    this.patientPackages = [];
    this.assignedLabTests = [];
    this.deals = [];
    this.aestheticProducts = [];
    this.salesReturns = [];

    this.seedDefaultData();
    this.saveToDisk();
    return this.getDatabaseStats();
  }
}

export const db = new InMemoryHospitalDatabase();

