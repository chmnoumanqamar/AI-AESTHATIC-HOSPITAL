export interface NavigationDestination {
  moduleId: string;
  moduleName: string;
  category: string;
  description: string;
}

export const MODULE_MAP: Record<string, NavigationDestination> = {
  // Clinical / Doctor Deck
  doctor_queue: {
    moduleId: 'doctor_queue',
    moduleName: "Today's Clinical Queue",
    category: 'CLINICAL',
    description: 'Live doctor patient waiting queue and triage calling deck'
  },
  doctor_consultation: {
    moduleId: 'doctor_consultation',
    moduleName: 'Consultations & Rx Workspace',
    category: 'CLINICAL',
    description: 'Patient encounter notes, digital prescriptions, and clinical history'
  },
  doctor_tokens: {
    moduleId: 'doctor_tokens',
    moduleName: 'Token Matrix',
    category: 'CLINICAL',
    description: 'Sequential token slot control center and doctor capacity limits'
  },

  // Front-Desk / Reception
  recep_desk: {
    moduleId: 'recep_desk',
    moduleName: 'Queue & Patient Check-In',
    category: 'RECEPTION',
    description: 'Walk-in patient arrival check-in, token issuance, and queue triage'
  },
  recep_approvals: {
    moduleId: 'recep_approvals',
    moduleName: 'Pending Bookings',
    category: 'RECEPTION',
    description: 'Review and approve online/WhatsApp appointment requests'
  },
  recep_pos: {
    moduleId: 'recep_pos',
    moduleName: 'Front-Desk Billing POS',
    category: 'RECEPTION',
    description: 'Point of sale, consultation fee collection, and printed receipts'
  },
  recep_reports: {
    moduleId: 'recep_reports',
    moduleName: 'Front-Desk Analytics',
    category: 'RECEPTION',
    description: 'Daily patient throughput, check-in stats, and reception ledger'
  },

  // Patient Services
  patient_portal: {
    moduleId: 'patient_portal',
    moduleName: 'My Appointments & Tokens',
    category: 'PATIENT',
    description: 'Active sequential tokens, appointment dates, and booking management'
  },
  patient_booking: {
    moduleId: 'patient_booking',
    moduleName: 'Book Appointment Suite',
    category: 'PATIENT',
    description: 'Self-service appointment booking wizard for specialist physicians'
  },
  patient_history: {
    moduleId: 'patient_history',
    moduleName: 'Medical Records & Prescriptions',
    category: 'PATIENT',
    description: 'Digital diagnosis history, prescriptions, and clinical records'
  },
  patient_billing: {
    moduleId: 'patient_billing',
    moduleName: 'Billing & Invoices Ledger',
    category: 'PATIENT',
    description: 'Consultation charges, payment receipts, and outstanding dues'
  },

  // Pharmacy & Medical Store
  pharma_queue: {
    moduleId: 'pharma_queue',
    moduleName: 'Live Dispense Queue',
    category: 'PHARMACY',
    description: 'Electronic prescription fulfillment and medicine dispensing'
  },
  pharma_inventory: {
    moduleId: 'pharma_inventory',
    moduleName: 'Drug Inventory Vault',
    category: 'PHARMACY',
    description: 'Medicine stock levels, batches, shelf locations, and low-stock alerts'
  },
  pharma_pos: {
    moduleId: 'pharma_pos',
    moduleName: 'Pharmacy POS & OTC Billing',
    category: 'PHARMACY',
    description: 'Point of sale terminal for walk-in OTC medicine purchases'
  },
  pharma_safety: {
    moduleId: 'pharma_safety',
    moduleName: 'Drug Safety & AI Screener',
    category: 'PHARMACY',
    description: 'Allergy contraindications and drug-drug interaction analysis'
  },
  pharma_procurement: {
    moduleId: 'pharma_procurement',
    moduleName: 'Suppliers & Procurement',
    category: 'PHARMACY',
    description: 'Pharmaceutical distributor purchase orders and restocking'
  },

  // System Administration
  admin_users: {
    moduleId: 'admin_users',
    moduleName: 'User Access Control',
    category: 'ADMIN',
    description: 'Hospital staff user accounts, role permissions, and access toggles'
  },
  admin_studio: {
    moduleId: 'admin_studio',
    moduleName: 'Module & Page Studio',
    category: 'ADMIN',
    description: 'Interactive drag-and-drop workspace layout and hierarchy builder'
  },
  admin_audit: {
    moduleId: 'admin_audit',
    moduleName: 'Compliance Audit Vault',
    category: 'ADMIN',
    description: 'Immutable SHA-256 cryptographic audit logs and access records'
  },
  admin_queue: {
    moduleId: 'admin_queue',
    moduleName: 'Live System Queue Monitor',
    category: 'ADMIN',
    description: 'Hospital-wide real-time queue overview across all clinic rooms'
  },
  admin_reports: {
    moduleId: 'admin_reports',
    moduleName: 'Executive Analytics & BI',
    category: 'ADMIN',
    description: 'Hospital financial summaries, doctor performance, and patient BI'
  },
  admin_database: {
    moduleId: 'admin_database',
    moduleName: 'Database Clear & Reset',
    category: 'ADMIN',
    description: 'Database diagnostics, test data purge, and system maintenance'
  },
  admin_config: {
    moduleId: 'admin_config',
    moduleName: 'System Policies & Rules',
    category: 'ADMIN',
    description: 'Operating hours, booking windows, and hospital policy configuration'
  },
  admin_ledger: {
    moduleId: 'admin_ledger',
    moduleName: 'Hospital Financial Ledger',
    category: 'ADMIN',
    description: 'Master hospital balance sheet, total collections, and revenue ledger'
  }
};

/**
 * Maps natural language user requests to target module ID
 */
export function resolveNavigationTarget(input: string): NavigationDestination | null {
  const lower = input.toLowerCase();

  // Keyword Matching Matrix
  if (lower.includes('pharmacy invent') || lower.includes('drug stock') || lower.includes('medicine stock') || lower.includes('inventory vault') || lower.includes('dawai ka stock')) {
    return MODULE_MAP.pharma_inventory;
  }
  if (lower.includes('dispense queue') || lower.includes('pharma queue') || lower.includes('dispensary')) {
    return MODULE_MAP.pharma_queue;
  }
  if (lower.includes('drug safety') || lower.includes('allergy screen') || lower.includes('interaction check')) {
    return MODULE_MAP.pharma_safety;
  }
  if (lower.includes('supplier') || lower.includes('procure') || lower.includes('purchase order')) {
    return MODULE_MAP.pharma_procurement;
  }
  if (lower.includes('audit') || lower.includes('vault') || lower.includes('security log')) {
    return MODULE_MAP.admin_audit;
  }
  if (lower.includes('doctor queue') || lower.includes('today queue') || lower.includes('clinical queue') || lower.includes('aaj ka queue') || lower.includes('waiting room')) {
    return MODULE_MAP.doctor_queue;
  }
  if (lower.includes('consultation') || lower.includes('prescriptions') || lower.includes('rx workspace') || lower.includes('doctor notes')) {
    return MODULE_MAP.doctor_consultation;
  }
  if (lower.includes('token matrix') || lower.includes('slot matrix') || lower.includes('doctor capacity') || lower.includes('token allocation')) {
    return MODULE_MAP.doctor_tokens;
  }
  if (lower.includes('check-in') || lower.includes('reception desk') || lower.includes('front desk') || lower.includes('dakhla')) {
    return MODULE_MAP.recep_desk;
  }
  if (lower.includes('pending booking') || lower.includes('approval') || lower.includes('booking request')) {
    return MODULE_MAP.recep_approvals;
  }
  if (lower.includes('reception pos') || lower.includes('front desk bill') || lower.includes('counter bill')) {
    return MODULE_MAP.recep_pos;
  }
  if (lower.includes('my appointment') || lower.includes('patient portal') || lower.includes('meri appointment') || lower.includes('mera token')) {
    return MODULE_MAP.patient_portal;
  }
  if (lower.includes('book appointment') || lower.includes('booking suite') || lower.includes('naya appointment')) {
    return MODULE_MAP.patient_booking;
  }
  if (lower.includes('medical record') || lower.includes('my history') || lower.includes('purana record') || lower.includes('test report')) {
    return MODULE_MAP.patient_history;
  }
  if (lower.includes('patient bill') || lower.includes('my bill') || lower.includes('invoice ledger')) {
    return MODULE_MAP.patient_billing;
  }
  if (lower.includes('user access') || lower.includes('manage user') || lower.includes('staff account') || lower.includes('rbac')) {
    return MODULE_MAP.admin_users;
  }
  if (lower.includes('studio') || lower.includes('module layout') || lower.includes('page builder')) {
    return MODULE_MAP.admin_studio;
  }
  if (lower.includes('system monitor') || lower.includes('live queue monitor') || lower.includes('hospital queue')) {
    return MODULE_MAP.admin_queue;
  }
  if (lower.includes('executive report') || lower.includes('analytics bi') || lower.includes('hospital report') || lower.includes('bi dashboard')) {
    return MODULE_MAP.admin_reports;
  }
  if (lower.includes('database maintenance') || lower.includes('database clear') || lower.includes('reset database') || lower.includes('purge')) {
    return MODULE_MAP.admin_database;
  }
  if (lower.includes('hospital ledger') || lower.includes('balance sheet') || lower.includes('financial ledger') || lower.includes('hisab kitab')) {
    return MODULE_MAP.admin_ledger;
  }
  if (lower.includes('system policy') || lower.includes('hospital policy') || lower.includes('clinic timing rule')) {
    return MODULE_MAP.admin_config;
  }
  if (lower.includes('billing') || lower.includes('bill')) {
    return MODULE_MAP.recep_pos;
  }
  if (lower.includes('pharmacy') || lower.includes('medical store')) {
    return MODULE_MAP.pharma_inventory;
  }

  return null;
}
