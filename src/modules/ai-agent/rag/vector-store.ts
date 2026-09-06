export interface RagDocument {
  id: string;
  category: 'POLICY' | 'FAQ' | 'DOCTOR_BIO' | 'SERVICE_INFO' | 'FACILITY_HOURS';
  title: string;
  content: string;
  keywords: string[];
}

export const STATIC_KNOWLEDGE_BASE: RagDocument[] = [
  {
    id: 'rag-01',
    category: 'FACILITY_HOURS',
    title: 'Hospital Operating Hours & Outpatient Clinics',
    content: 'The Aesthetic & General Medical Hospital outpatient clinics operate Monday through Saturday from 08:00 AM to 08:00 PM. Emergency medical triage is open 24/7.',
    keywords: ['hours', 'timing', 'open', 'schedule', 'emergency', 'weekend', 'sunday', 'saturday']
  },
  {
    id: 'rag-02',
    category: 'POLICY',
    title: 'Appointment Arrival & Check-In Policy',
    content: 'Patients must arrive at least 15 minutes prior to their scheduled consultation token window and check in physically at the front desk reception or kiosk. Late arrivals exceeding 30 minutes may be queued after active waiting patients.',
    keywords: ['arrival', 'check in', 'late', 'grace period', 'reception', 'token window']
  },
  {
    id: 'rag-03',
    category: 'POLICY',
    title: 'Token Generation & Non-Reusability Guarantee',
    content: 'Tokens are strictly sequential per doctor per day. If an appointment is cancelled, the assigned token number is permanently retired to ensure mathematical integrity and fairness.',
    keywords: ['token', 'cancelled', 'reuse', 'capacity', 'fairness', 'sequence']
  },
  {
    id: 'rag-04',
    category: 'DOCTOR_BIO',
    title: 'Dr. Aisha Khan - Cardiology & Internal Medicine',
    content: 'Dr. Aisha Khan is our Lead Interventional Cardiologist with over 15 years of clinical practice. Specializes in hypertension management, coronary assessment, preventive cardiology, and ECG diagnostics. Consultation fee is PKR 2,500.',
    keywords: ['aisha', 'khan', 'cardiologist', 'heart', 'cardiology', 'hypertension', 'blood pressure', 'ecg']
  },
  {
    id: 'rag-05',
    category: 'DOCTOR_BIO',
    title: 'Dr. Marcus Vance - Dermatology & Aesthetic Medicine',
    content: 'Dr. Marcus Vance is a board-certified dermatologist specializing in clinical skin health, laser aesthetics, scar revision, and dermoscopy screening with 12 years of experience. Consultation fee is PKR 3,000.',
    keywords: ['marcus', 'vance', 'dermatologist', 'skin', 'dermatology', 'acne', 'laser', 'aesthetic', 'rash']
  },
  {
    id: 'rag-06',
    category: 'SERVICE_INFO',
    title: 'Cardiology Consultation & 12-Lead ECG Service',
    content: 'Includes a complete clinical cardiovascular review, stethoscope auscultation, 12-lead digital electrocardiogram, and blood pressure profiling.',
    keywords: ['cardiology service', 'ecg', 'heart checkup', 'cardiac screening']
  },
  {
    id: 'rag-07',
    category: 'SERVICE_INFO',
    title: 'Dermatological Skin Scan & Biopsy',
    content: 'Comprehensive skin exam using polarized dermoscopy for mole mapping, pigmentation analysis, and skin barrier evaluation.',
    keywords: ['skin scan', 'dermoscopy', 'mole check', 'dermatology service']
  },
  {
    id: 'rag-08',
    category: 'FAQ',
    title: 'Payment Methods & Insurance Policy',
    content: 'We accept major credit/debit cards, contactless NFC payments, cash at the front desk, and direct insurance billing for approved partner networks.',
    keywords: ['payment', 'credit card', 'insurance', 'billing', 'cost', 'fee']
  }
];
