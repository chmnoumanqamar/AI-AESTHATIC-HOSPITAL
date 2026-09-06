import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface DbUser {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  passwordHash: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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
  followUpDate?: string;
  chiefComplaint?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbQueueEntry {
  id: string;
  appointmentId: string;
  queueStatus: 'NOT_CHECKED_IN' | 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'NO_SHOW';
  checkInTime?: string;
  calledTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface DbPrescription {
  id: string;
  clinicalRecordId: string;
  patientId: string;
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

export interface DbPayment {
  id: string;
  invoiceNumber?: string;
  patientId: string;
  appointmentId?: string;
  totalAmount: number;
  discount?: number;
  amountPaid: number;
  balanceDue: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  paymentMethod?: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER' | 'INSURANCE';
  category?: 'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'PHARMACY' | 'EMERGENCY';
  paymentPlan?: 'FULL' | 'INSTALLMENT_1' | 'INSTALLMENT_2' | 'SPECIAL_WAIVER';
  notes?: string;
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

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const salt = bcrypt.genSaltSync(8);
    const defaultPasswordHash = bcrypt.hashSync('Password123!', salt);
    const today = new Date().toISOString().split('T')[0];

    // 1. Admin User
    const adminUser: DbUser = {
      id: 'u-admin-01',
      name: 'Root Administrator',
      phone: '+15550000001',
      email: 'admin@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.push(adminUser);

    // 2. Doctor Users & Profiles
    const doc1User: DbUser = {
      id: 'u-doc-01',
      phone: '+15550000002',
      email: 'dr.aisha@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'DOCTOR',
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
      phone: '+15550000003',
      email: 'dr.marcus@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'DOCTOR',
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
      phone: '+15550000004',
      email: 'receptionist@hospital.com',
      passwordHash: defaultPasswordHash,
      role: 'RECEPTIONIST',
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
      phone: '+15550000010',
      email: 'john.doe@example.com',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
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
      phone: '+15550000020',
      email: 'emily.clark@example.com',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
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
      phone: '+15550000030',
      email: 'robert.taylor@example.com',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
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
      createdAt: new Date().toISOString()
    };
    // Token 3: Emily Clark (CONFIRMED but NOT_CHECKED_IN - to test skip logic)
    const t3: DbDailyToken = {
      id: 'tok-03',
      doctorId: 'doc-01',
      date: today,
      tokenNumber: 3,
      status: 'RESERVED',
      createdAt: new Date().toISOString()
    };
    // Token 4: Robert Taylor (CONFIRMED & WAITING - should be picked by Call Next)
    const t4: DbDailyToken = {
      id: 'tok-04',
      doctorId: 'doc-01',
      date: today,
      tokenNumber: 4,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.dailyTokens.push(t1, t2, t3, t4);

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
      status: 'PENDING',
      bookingSource: 'PORTAL',
      chiefComplaint: 'Follow-up consultation for recurring skin rash on forearm.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    };
    const app5: DbAppointment = {
      id: 'apt-05',
      patientId: 'pat-03',
      doctorId: 'doc-01',
      serviceId: 'srv-01',
      appointmentDate: today,
      status: 'PENDING',
      bookingSource: 'AI_AGENT',
      chiefComplaint: 'Mild exertional chest tightness; cardiology checkup requested.',
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
      createdAt: new Date().toISOString()
    };
    const qe2: DbQueueEntry = {
      id: 'qe-02',
      appointmentId: 'apt-02',
      queueStatus: 'NOT_CHECKED_IN',
      createdAt: new Date().toISOString()
    };
    const qe3: DbQueueEntry = {
      id: 'qe-03',
      appointmentId: 'apt-03',
      queueStatus: 'WAITING',
      checkInTime: today + 'T09:10:00Z',
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
      createdAt: today + 'T08:45:00Z',
      updatedAt: today + 'T08:50:00Z'
    };
    this.clinicalRecords.push(cr1);

    const rx1: DbPrescription = {
      id: 'rx-01',
      clinicalRecordId: 'cr-01',
      patientId: 'pat-01',
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
      createdAt: today + 'T08:52:00Z'
    };
    this.prescriptionVersions.push(rx1v1, rx1v2);

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
        createdAt: today + 'T09:00:00Z'
      }
    );

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

        this.appointments.push({
          id: aptId,
          patientId: patId,
          doctorId: docId,
          serviceId: cat === 'PROCEDURE' ? 'srv-02' : 'srv-01',
          appointmentDate: today,
          status: 'CONFIRMED',
          bookingSource: idx % 2 === 0 ? 'PORTAL' : 'AI_AGENT',
          approvedByReceptionistId: 'recep-01',
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
            createdAt: timeIso
          });
        }
      }
    };

    seedHistoricalReportsData();
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
      services: this.services.length
    };
  }

  purgeRoughData() {
    const statsBefore = this.getDatabaseStats();

    // 1. Wipe all transactional rough data
    this.appointments = [];
    this.queueEntries = [];
    this.dailyTokens = [];
    this.clinicalRecords = [];
    this.prescriptions = [];
    this.prescriptionVersions = [];
    this.payments = [];
    this.notificationLogs = [];
    this.doctorPatientRelationships = [];

    // 2. Wipe all mock patients & patient user accounts
    this.patients = [];
    this.users = this.users.filter(u => u.role !== 'PATIENT');

    // Return purge summary
    return {
      purged: {
        patients: statsBefore.patients,
        appointments: statsBefore.appointments,
        queueEntries: statsBefore.queueEntries,
        dailyTokens: statsBefore.dailyTokens,
        clinicalRecords: statsBefore.clinicalRecords,
        prescriptions: statsBefore.prescriptions,
        payments: statsBefore.payments,
        notificationLogs: statsBefore.notificationLogs
      },
      preserved: {
        staffUsers: this.users.length,
        doctors: this.doctors.length,
        receptionists: this.receptionists.length,
        services: this.services.length
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

    this.seedDefaultData();
    return this.getDatabaseStats();
  }
}

export const db = new InMemoryHospitalDatabase();

