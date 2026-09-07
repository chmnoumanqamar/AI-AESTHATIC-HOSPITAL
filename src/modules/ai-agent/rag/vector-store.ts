export interface RagDocument {
  id: string;
  category: 'POLICY' | 'FAQ' | 'DOCTOR_BIO' | 'SERVICE_INFO' | 'FACILITY_HOURS' | 'PHARMACY_INFO' | 'DEPARTMENT_OVERVIEW';
  title: string;
  content: string;
  keywords: string[];
}

export const STATIC_KNOWLEDGE_BASE: RagDocument[] = [
  {
    id: 'rag-01',
    category: 'FACILITY_HOURS',
    title: 'Hospital Operating Hours & Outpatient Clinics',
    content: 'The Aesthetic & General Medical Hospital outpatient clinics operate Monday through Saturday from 08:00 AM to 08:00 PM. Emergency medical triage and the hospital pharmacy are open 24/7.',
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
    title: 'Payment Methods & Currency Policy',
    content: 'All hospital services, consultations, lab diagnostics, and pharmacy dispensary items are billed in PKR (Pakistani Rupees). We accept Cash, Credit/Debit cards, contactless NFC, and direct health insurance billing.',
    keywords: ['payment', 'credit card', 'insurance', 'billing', 'cost', 'fee', 'currency', 'pkr', 'rupees']
  },
  {
    id: 'rag-pharma-01',
    category: 'PHARMACY_INFO',
    title: 'Hospital Clinical Pharmacy & Dispensary (24/7 Service)',
    content: 'The hospital maintains a fully licensed, 24/7 in-house Clinical Pharmacy and Medical Store located on the Ground Floor adjacent to the Outpatient Department. Supervised by Chief Clinical Pharmacist Tariq Mehmood, RPh, the pharmacy offers direct electronic prescription fulfillment from doctor consultations, an Over-The-Counter (OTC) medicine counter, aesthetic dermatology injectables, and emergency medication dispensing. All sales are processed in PKR with itemized receipts.',
    keywords: ['pharmacy', 'medical store', 'dispensary', 'medicines', 'dawai', 'drugs', 'chemist', 'tariq mehmood', 'pharmacist', 'prescription fulfillment', 'hours', '24/7', 'open', 'timing', 'store', 'shop']
  },
  {
    id: 'rag-pharma-02',
    category: 'PHARMACY_INFO',
    title: 'Pharmacy Drug Inventory & Common Medications in Stock',
    content: 'The hospital pharmacy vault maintains a real-time computerized inventory: Antibiotics (Augmentin 625mg @ PKR 450, Ciproxin 500mg @ PKR 380), Cardiology & Blood Pressure (Lisinopril 10mg @ PKR 320, Metoprolol 50mg @ PKR 280, Atorvastatin 20mg @ PKR 520), Dermatology & Aesthetic Injectables (Retin-A 0.05% Cream @ PKR 850, Botox 100U @ PKR 35,000, Juvederm Ultra 1ml @ PKR 42,000), and Analgesics & Wellness (Panadol 500mg @ PKR 50, Cevit 500mg Vitamin C @ PKR 180). Prescriptions can be picked up immediately after physician sign-off.',
    keywords: ['augmentin', 'panadol', 'botox', 'juvederm', 'retin-a', 'ciproxin', 'lisinopril', 'metoprolol', 'atorvastatin', 'cevit', 'stock', 'inventory', 'medicines in stock', 'price', 'dawai available', 'medicine price']
  },
  {
    id: 'rag-pharma-03',
    category: 'PHARMACY_INFO',
    title: 'Clinical Drug Safety, Allergy Screening & Interaction Engine',
    content: 'Every prescription fulfilled at our pharmacy is automatically screened by our AI Clinical Drug Safety engine. The system checks patient allergy histories (e.g. Penicillin group contraindication with Amoxicillin/Augmentin) and flags multi-drug interactions, maximum daily doses, and high-risk pregnancy contraindications before drugs are physically dispensed.',
    keywords: ['drug interaction', 'allergy', 'safety', 'contraindication', 'drug safety', 'allergy check', 'rx safety']
  },
  {
    id: 'rag-dept-01',
    category: 'DEPARTMENT_OVERVIEW',
    title: 'Hospital Departments & Unified Operating Suite Overview',
    content: 'AI Aesthetic Hospital comprises 5 interconnected departments: 1. Clinical & Doctor Deck (doctor consultations, queue management, electronic prescriptions, triage); 2. Front-Desk & Reception (patient check-in, token ticketing, appointment authorizations, POS billing); 3. Pharmacy & Medical Store (24/7 dispensary, live dispense queue, computerized inventory vault, OTC sales counter, procurement); 4. Patient Services & Portal (online self-booking, digital health records, 48h appointment reminders, WhatsApp AI concierge); 5. System Administration (cryptographic SHA-256 immutable audit vault, RBAC security, drag-and-drop module studio).',
    keywords: ['departments', 'modules', 'hospital overview', 'clinical deck', 'reception', 'pharmacy', 'patient portal', 'system administration', 'audit vault', 'features']
  }
];
