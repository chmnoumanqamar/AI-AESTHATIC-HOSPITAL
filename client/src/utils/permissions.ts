import { api } from '../services/api';

export type RoleKey = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST' | 'PATIENT';

export interface RolePermissionRule {
  moduleId: string;
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface HospitalRoleDefinition {
  role: RoleKey;
  label: string;
  description: string;
  badgeColor: string;
  permissions: RolePermissionRule[];
}

export const DEFAULT_ROLES_PERMISSIONS: HospitalRoleDefinition[] = [
  {
    role: 'ADMIN',
    label: 'System Administration',
    description: 'Supreme hospital security, user provisioning, audits, billing ledger & core configuration',
    badgeColor: 'emerald',
    permissions: [
      { moduleId: 'admin_users', read: true, write: true, delete: true },
      { moduleId: 'admin_studio', read: true, write: true, delete: true },
      { moduleId: 'admin_audit', read: true, write: true, delete: true },
      { moduleId: 'admin_queue', read: true, write: true, delete: true },
      { moduleId: 'admin_reports', read: true, write: true, delete: true },
      { moduleId: 'admin_database', read: true, write: true, delete: true },
      { moduleId: 'admin_config', read: true, write: true, delete: true },
      { moduleId: 'admin_ledger', read: true, write: true, delete: true },
      { moduleId: 'doctor_queue', read: true, write: true, delete: true },
      { moduleId: 'doctor_consultation', read: true, write: true, delete: true },
      { moduleId: 'doctor_tokens', read: true, write: true, delete: true },
      { moduleId: 'recep_desk', read: true, write: true, delete: true },
      { moduleId: 'recep_approvals', read: true, write: true, delete: true },
      { moduleId: 'recep_pos', read: true, write: true, delete: true },
      { moduleId: 'recep_reports', read: true, write: true, delete: true },
      { moduleId: 'pharma_queue', read: true, write: true, delete: true },
      { moduleId: 'pharma_inventory', read: true, write: true, delete: true },
      { moduleId: 'pharma_pos', read: true, write: true, delete: true },
      { moduleId: 'pharma_safety', read: true, write: true, delete: true },
      { moduleId: 'pharma_procurement', read: true, write: true, delete: true },
      { moduleId: 'patient_portal', read: true, write: true, delete: true },
      { moduleId: 'patient_booking', read: true, write: true, delete: true },
      { moduleId: 'patient_history', read: true, write: true, delete: true },
      { moduleId: 'patient_billing', read: true, write: true, delete: true },
    ],
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
      { moduleId: 'patient_history', read: true, write: false, delete: false },
    ],
  },
  {
    role: 'RECEPTIONIST',
    label: 'Front-Desk & Reception',
    description: 'Patient check-in, token ticketing, booking authorizations and consultation POS',
    badgeColor: 'purple',
    permissions: [
      { moduleId: 'recep_desk', read: true, write: true, delete: false },
      { moduleId: 'recep_approvals', read: true, write: true, delete: true },
      { moduleId: 'recep_pos', read: true, write: true, delete: false },
      { moduleId: 'recep_reports', read: true, write: false, delete: false },
    ],
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
      { moduleId: 'pharma_procurement', read: true, write: true, delete: true },
    ],
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
      { moduleId: 'patient_billing', read: true, write: false, delete: false },
    ],
  },
];

export const PERMISSIONS_STORAGE_KEY = 'hospital_role_permissions_cache';
export const PERMISSIONS_UPDATE_EVENT = 'hospital_role_permissions_updated';

/**
 * Load cached role permissions from localStorage or fallback
 */
export function getStoredRolePermissions(): HospitalRoleDefinition[] {
  if (typeof window === 'undefined') return DEFAULT_ROLES_PERMISSIONS;
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return DEFAULT_ROLES_PERMISSIONS;
}

/**
 * Save role permissions and broadcast to all application components
 */
export function saveStoredRolePermissions(roles: HospitalRoleDefinition[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(roles));
  } catch (e) {
    // Ignore storage write errors
  }
  window.dispatchEvent(new CustomEvent(PERMISSIONS_UPDATE_EVENT, { detail: roles }));
}

/**
 * Fetch latest role permissions from server, update local cache, and notify components
 */
export async function syncRolePermissionsFromServer(): Promise<HospitalRoleDefinition[]> {
  try {
    const res = await api.get('/admin/role-permissions');
    if (res.data?.data?.roles && Array.isArray(res.data.data.roles)) {
      saveStoredRolePermissions(res.data.data.roles);
      return res.data.data.roles;
    }
  } catch (err) {
    console.warn('Using cached role permissions, server fetch fallback:', err);
  }
  return getStoredRolePermissions();
}

/**
 * Check if a specific module is permitted for read/viewing
 */
export function isModulePermitted(
  moduleId: string,
  role: string,
  user?: any,
  rolesPermissions?: HospitalRoleDefinition[]
): boolean {
  if (!moduleId) return false;

  // STRICT SECURITY: Non-admins can NEVER view or access system admin modules
  if (role !== 'ADMIN' && moduleId.startsWith('admin_')) {
    return false;
  }

  const allRoles = rolesPermissions || getStoredRolePermissions();
  const roleDef = allRoles.find(r => r.role === role);

  // If role definition exists, check explicit READ toggle
  if (roleDef) {
    const perm = roleDef.permissions.find(p => p.moduleId === moduleId);
    // If permission doesn't exist in role (module removed) or read is false, access is revoked!
    if (!perm || perm.read === false) {
      return false;
    }
  }

  // If user has custom user-level allowedModules, verify membership
  if (user?.allowedModules && Array.isArray(user.allowedModules) && user.allowedModules.length > 0) {
    if (!user.allowedModules.includes(moduleId)) {
      return false;
    }
  }

  return true;
}

/**
 * Get all permitted module IDs for the current role and user
 */
export function getEffectivePermittedModules(
  role: string,
  user?: any,
  rolesPermissions?: HospitalRoleDefinition[]
): string[] {
  const allRoles = rolesPermissions || getStoredRolePermissions();
  const roleDef = allRoles.find(r => r.role === role);
  if (!roleDef) return [];

  return roleDef.permissions
    .filter(p => p.read)
    .map(p => p.moduleId)
    .filter(moduleId => isModulePermitted(moduleId, role, user, allRoles));
}

/**
 * Dynamically resolve the primary initial tab for a role, ensuring it has read: true
 */
export function resolveInitialTabForRole(
  role: string,
  user?: any,
  rolesPermissions?: HospitalRoleDefinition[]
): string {
  const permitted = getEffectivePermittedModules(role, user, rolesPermissions);

  const preferredDefaults: Record<string, string[]> = {
    DOCTOR: ['doctor_queue', 'doctor_consultation', 'doctor_tokens', 'patient_history'],
    RECEPTIONIST: ['recep_desk', 'recep_approvals', 'recep_pos', 'recep_reports'],
    PATIENT: ['patient_portal', 'patient_booking', 'patient_history', 'patient_billing'],
    PHARMACIST: ['pharma_queue', 'pharma_inventory', 'pharma_pos', 'pharma_safety', 'pharma_procurement'],
    ADMIN: ['admin_users', 'admin_studio', 'admin_audit', 'admin_queue', 'admin_reports', 'admin_database', 'admin_config', 'admin_ledger']
  };

  const rolePrefs = preferredDefaults[role] || [];
  for (const pref of rolePrefs) {
    if (permitted.includes(pref)) {
      return pref;
    }
  }

  if (permitted.length > 0) {
    return permitted[0];
  }

  return role === 'DOCTOR' ? 'doctor_queue'
    : role === 'RECEPTIONIST' ? 'recep_desk'
    : role === 'PATIENT' ? 'patient_portal'
    : role === 'PHARMACIST' ? 'pharma_queue'
    : 'admin_users';
}
