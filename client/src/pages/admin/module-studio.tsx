import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  ShieldCheck,
  Activity,
  ClipboardList,
  Pill,
  Users,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Database,
  Settings,
  Package,
  ShoppingCart,
  ShieldAlert,
  Truck,
  Shield,
  Columns3,
  LayoutGrid,
  Lock,
  Unlock,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

export type RoleKey = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';

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

export interface PageHierarchyItem {
  id: string;
  label: string;
  category: 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY';
  categoryLabel: string;
  description: string;
}

const ICON_MAP: Record<string, any> = {
  doctor_queue: Activity,
  doctor_consultation: FileText,
  doctor_tokens: LayoutDashboard,
  recep_desk: ClipboardList,
  recep_approvals: CalendarCheck,
  recep_pos: CreditCard,
  recep_reports: BarChart3,
  patient_portal: CalendarCheck,
  patient_booking: Activity,
  patient_history: FileText,
  patient_billing: CreditCard,
  pharma_queue: Pill,
  pharma_inventory: Package,
  pharma_pos: ShoppingCart,
  pharma_safety: ShieldAlert,
  pharma_procurement: Truck,
  admin_users: Users,
  admin_studio: Layers,
  admin_audit: ShieldCheck,
  admin_queue: Activity,
  admin_reports: BarChart3,
  admin_database: Database,
  admin_config: Settings,
  admin_ledger: CreditCard,
};

const ROLE_THEMES: Record<
  RoleKey,
  {
    icon: any;
    label: string;
    sublabel: string;
    border: string;
    activeBorder: string;
    bg: string;
    accentBg: string;
    text: string;
    badgeBg: string;
  }
> = {
  ADMIN: {
    icon: ShieldCheck,
    label: 'System Administration',
    sublabel: 'Full governance, security, audit vaults & policy controls',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    accentBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-600 text-white',
  },
  DOCTOR: {
    icon: Activity,
    label: 'Clinical & Doctor Deck',
    sublabel: 'Patient calling, clinical consultations, e-prescriptions & records',
    border: 'border-sky-200 dark:border-sky-800/60',
    activeBorder: 'border-sky-500 ring-2 ring-sky-500/20',
    bg: 'bg-sky-50/40 dark:bg-sky-950/20',
    accentBg: 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300',
    text: 'text-sky-700 dark:text-sky-400',
    badgeBg: 'bg-sky-600 text-white',
  },
  RECEPTIONIST: {
    icon: ClipboardList,
    label: 'Front-Desk & Reception',
    sublabel: 'Walk-in check-in, token ticketing, booking authorizations & billing POS',
    border: 'border-purple-200 dark:border-purple-800/60',
    activeBorder: 'border-purple-500 ring-2 ring-purple-500/20',
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    accentBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300',
    text: 'text-purple-700 dark:text-purple-400',
    badgeBg: 'bg-purple-600 text-white',
  },
  PHARMACIST: {
    icon: Pill,
    label: 'Pharmacy & Medical Store',
    sublabel: 'Prescription dispensing, medication vault inventory, OTC sales & procurement',
    border: 'border-teal-200 dark:border-teal-800/60',
    activeBorder: 'border-teal-500 ring-2 ring-teal-500/20',
    bg: 'bg-teal-50/40 dark:bg-teal-950/20',
    accentBg: 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300',
    text: 'text-teal-700 dark:text-teal-400',
    badgeBg: 'bg-teal-600 text-white',
  },
  PATIENT: {
    icon: Users,
    label: 'Patient Services & Portal',
    sublabel: 'Appointment booking, live token monitoring & digital medical history',
    border: 'border-amber-200 dark:border-amber-800/60',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    accentBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-600 text-white',
  },
};

const DEFAULT_ROLES_FALLBACK: HospitalRoleDefinition[] = [
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

export const AdminModuleStudio: React.FC = () => {
  const [roles, setRoles] = useState<HospitalRoleDefinition[]>(() => {
    try {
      const cached = localStorage.getItem('hospital_role_permissions_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_ROLES_FALLBACK;
  });

  const [allModules, setAllModules] = useState<PageHierarchyItem[]>(() => {
    try {
      const cached = localStorage.getItem('hospital_dynamic_hierarchy');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [selectedRoleKey, setSelectedRoleKey] = useState<RoleKey>('ADMIN');
  const [viewMode, setViewMode] = useState<'tabbed' | 'stacked'>('tabbed');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add New Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalRole, setAddModalRole] = useState<RoleKey>('ADMIN');
  const [addModalTab, setAddModalTab] = useState<'existing' | 'custom'>('existing');

  // Existing Module form state
  const [selectedExistingModuleId, setSelectedExistingModuleId] = useState('');
  const [existingRead, setExistingRead] = useState(true);
  const [existingWrite, setExistingWrite] = useState(false);
  const [existingDelete, setExistingDelete] = useState(false);

  // Custom Module form state
  const [customModuleId, setCustomModuleId] = useState('');
  const [customModuleLabel, setCustomModuleLabel] = useState('');
  const [customModuleCategory, setCustomModuleCategory] = useState<'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY'>('CLINICAL');
  const [customModuleDescription, setCustomModuleDescription] = useState('');
  const [customRead, setCustomRead] = useState(true);
  const [customWrite, setCustomWrite] = useState(true);
  const [customDelete, setCustomDelete] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [permRes, hierRes] = await Promise.all([
        api.get('/admin/role-permissions'),
        api.get('/admin/hierarchy'),
      ]);

      if (permRes.data?.data?.roles && Array.isArray(permRes.data.data.roles)) {
        setRoles(permRes.data.data.roles);
        localStorage.setItem('hospital_role_permissions_cache', JSON.stringify(permRes.data.data.roles));
      }

      if (hierRes.data?.data && Array.isArray(hierRes.data.data)) {
        setAllModules(hierRes.data.data);
        localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(hierRes.data.data));
      }
    } catch (err) {
      console.warn('Fallback to local cache for role permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Module lookup dictionary
  const moduleMap = useMemo(() => {
    const map = new Map<string, PageHierarchyItem>();
    for (const m of allModules) {
      map.set(m.id, m);
    }
    return map;
  }, [allModules]);

  // Toggle individual permission (read, write, delete)
  const handleTogglePermission = (
    roleKey: RoleKey,
    moduleId: string,
    field: 'read' | 'write' | 'delete'
  ) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.role !== roleKey) return r;
        const newPerms = r.permissions.map((p) => {
          if (p.moduleId !== moduleId) return p;
          const updated = { ...p, [field]: !p[field] };
          // If write or delete is enabled, read should automatically be enabled
          if ((field === 'write' || field === 'delete') && updated[field]) {
            updated.read = true;
          }
          // If read is disabled, write and delete should also be disabled
          if (field === 'read' && !updated.read) {
            updated.write = false;
            updated.delete = false;
          }
          return updated;
        });
        return { ...r, permissions: newPerms };
      })
    );
  };

  // Set preset for a module (Full Access or Read Only)
  const handleSetPreset = (
    roleKey: RoleKey,
    moduleId: string,
    preset: 'full' | 'read_only' | 'none'
  ) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.role !== roleKey) return r;
        const newPerms = r.permissions.map((p) => {
          if (p.moduleId !== moduleId) return p;
          if (preset === 'full') {
            return { ...p, read: true, write: true, delete: true };
          }
          if (preset === 'read_only') {
            return { ...p, read: true, write: false, delete: false };
          }
          return { ...p, read: false, write: false, delete: false };
        });
        return { ...r, permissions: newPerms };
      })
    );
  };

  // Grant bulk permissions to all modules in a role
  const handleBulkGrant = (roleKey: RoleKey, type: 'all_read' | 'all_full' | 'clear') => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.role !== roleKey) return r;
        const newPerms = r.permissions.map((p) => {
          if (type === 'all_full') return { ...p, read: true, write: true, delete: true };
          if (type === 'all_read') return { ...p, read: true, write: false, delete: false };
          return { ...p, read: false, write: false, delete: false };
        });
        return { ...r, permissions: newPerms };
      })
    );
    showToast(`✓ Bulk permissions applied to ${roleKey} role`);
  };

  // Remove a module from a role
  const handleRemoveModule = async (roleKey: RoleKey, moduleId: string) => {
    const pageObj = moduleMap.get(moduleId);
    const label = pageObj ? pageObj.label : moduleId;

    if (!window.confirm(`Remove "${label}" from role ${roleKey}?`)) {
      return;
    }

    try {
      await api.delete(`/admin/role-permissions/${roleKey}/${moduleId}`);
    } catch (e) {
      console.warn('API remove failed, updating locally:', e);
    }

    setRoles((prev) =>
      prev.map((r) => {
        if (r.role !== roleKey) return r;
        return {
          ...r,
          permissions: r.permissions.filter((p) => p.moduleId !== moduleId),
        };
      })
    );
    showToast(`✓ Removed "${label}" from ${roleKey}`);
  };

  // Save changes for a role to backend
  const handleSaveRole = async (roleKey: RoleKey) => {
    const targetRole = roles.find((r) => r.role === roleKey);
    if (!targetRole) return;

    setSavingRole(roleKey);
    try {
      await api.put(`/admin/role-permissions/${roleKey}`, {
        permissions: targetRole.permissions,
      });
      localStorage.setItem('hospital_role_permissions_cache', JSON.stringify(roles));
      showToast(`✓ Successfully saved permissions for ${ROLE_THEMES[roleKey].label}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || `✓ Saved permissions locally for ${roleKey}`);
    } finally {
      setSavingRole(null);
    }
  };

  // Reset all role permissions to defaults
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Reset all role permissions to standard clinical system defaults? Any custom assignments will revert.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/role-permissions/reset');
      if (res.data?.data?.roles) {
        setRoles(res.data.data.roles);
        localStorage.setItem('hospital_role_permissions_cache', JSON.stringify(res.data.data.roles));
      } else {
        setRoles(DEFAULT_ROLES_FALLBACK);
      }
      showToast('✓ Role permissions restored to clinical defaults');
    } catch (err: any) {
      setRoles(DEFAULT_ROLES_FALLBACK);
      showToast('✓ Role permissions restored to clinical defaults');
    } finally {
      setLoading(false);
    }
  };

  // Open Add Modal
  const openAddModal = (roleKey: RoleKey) => {
    setAddModalRole(roleKey);
    // Find first available existing module not yet in this role
    const currentRole = roles.find((r) => r.role === roleKey);
    const assignedIds = new Set(currentRole?.permissions.map((p) => p.moduleId) || []);
    const available = allModules.filter((m) => !assignedIds.has(m.id));
    setSelectedExistingModuleId(available[0]?.id || allModules[0]?.id || '');
    setExistingRead(true);
    setExistingWrite(roleKey === 'ADMIN');
    setExistingDelete(roleKey === 'ADMIN');
    setCustomModuleId('');
    setCustomModuleLabel('');
    setCustomModuleDescription('');
    setIsAddModalOpen(true);
  };

  // Submit Add Module
  const handleAddModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addModalTab === 'existing') {
      if (!selectedExistingModuleId) {
        alert('Please select a module to assign');
        return;
      }

      try {
        await api.post('/admin/role-permissions/module', {
          role: addModalRole,
          moduleId: selectedExistingModuleId,
          read: existingRead,
          write: existingWrite,
          delete: existingDelete,
        });
      } catch (e) {
        console.warn('API add module error, updating local state:', e);
      }

      // Update local state
      setRoles((prev) =>
        prev.map((r) => {
          if (r.role !== addModalRole) return r;
          const exists = r.permissions.find((p) => p.moduleId === selectedExistingModuleId);
          if (exists) {
            return {
              ...r,
              permissions: r.permissions.map((p) =>
                p.moduleId === selectedExistingModuleId
                  ? { ...p, read: existingRead, write: existingWrite, delete: existingDelete }
                  : p
              ),
            };
          }
          return {
            ...r,
            permissions: [
              ...r.permissions,
              {
                moduleId: selectedExistingModuleId,
                read: existingRead,
                write: existingWrite,
                delete: existingDelete,
              },
            ],
          };
        })
      );

      const modObj = moduleMap.get(selectedExistingModuleId);
      showToast(`✓ Added "${modObj?.label || selectedExistingModuleId}" to ${addModalRole}`);
      setIsAddModalOpen(false);
    } else {
      // Custom Module
      const cleanId = customModuleId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const cleanLabel = customModuleLabel.trim();

      if (!cleanId || !cleanLabel) {
        alert('Module ID and Page Title are required');
        return;
      }

      const categoryLabels: Record<'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY', string> = {
        ADMIN: 'System Administration',
        CLINICAL: 'Clinical & Doctor Deck',
        RECEPTION: 'Front-Desk & Reception',
        PATIENT: 'Patient Services',
        PHARMACY: 'Pharmacy & Medical Store',
      };

      const newModuleDef: PageHierarchyItem = {
        id: cleanId,
        label: cleanLabel,
        category: customModuleCategory,
        categoryLabel: categoryLabels[customModuleCategory],
        description: customModuleDescription.trim() || `${cleanLabel} service module`,
      };

      try {
        await api.post('/admin/role-permissions/module', {
          role: addModalRole,
          moduleId: cleanId,
          read: customRead,
          write: customWrite,
          delete: customDelete,
          newModuleDef,
        });
      } catch (e) {
        console.warn('API create custom module error, updating local state:', e);
      }

      // Update modules list
      setAllModules((prev) => {
        if (prev.some((m) => m.id === cleanId)) return prev;
        const updated = [...prev, newModuleDef];
        localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('hospital_hierarchy_updated', {
            detail: updated,
          })
        );
        return updated;
      });

      // Update role permissions
      setRoles((prev) =>
        prev.map((r) => {
          if (r.role !== addModalRole) return r;
          return {
            ...r,
            permissions: [
              ...r.permissions.filter((p) => p.moduleId !== cleanId),
              {
                moduleId: cleanId,
                read: customRead,
                write: customWrite,
                delete: customDelete,
              },
            ],
          };
        })
      );

      showToast(`✓ Registered custom page "${cleanLabel}" & assigned to ${addModalRole}`);
      setIsAddModalOpen(false);
    }
  };

  const displayedRoles = viewMode === 'tabbed'
    ? roles.filter((r) => r.role === selectedRoleKey)
    : roles;

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#889476]" />
          <input
            type="text"
            placeholder="Search pages, module IDs, or permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#1E2718] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#6C785C] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#202C1B] p-1 rounded-xl border border-slate-200 dark:border-[#38482E]">
            <button
              onClick={() => setViewMode('tabbed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'tabbed'
                  ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-[#A4AC86]'
              }`}
              title="Focus on one role at a time"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Role Tabs</span>
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'stacked'
                  ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-[#A4AC86]'
              }`}
              title="View all role sections simultaneously"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Roles Deck</span>
            </button>
          </div>

          {/* Global + Add New Button */}
          <button
            onClick={() => openAddModal(selectedRoleKey)}
            className="clinical-button-primary px-3 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Add module to role"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#38482E] text-slate-600 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#202C1B] transition-colors cursor-pointer"
            title="Refresh Permissions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Reset Defaults */}
          <button
            onClick={handleResetDefaults}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-[#38482E] text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#202C1B] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset role permissions to system defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Real-time Toast Banner */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Role Navigation Bar (Role Tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 select-none">
        {roles.map((r) => {
          const theme = ROLE_THEMES[r.role] || ROLE_THEMES.ADMIN;
          const RoleIcon = theme.icon;
          const isSelected = selectedRoleKey === r.role && viewMode === 'tabbed';
          const assignedCount = r.permissions.length;
          const readCount = r.permissions.filter((p) => p.read).length;
          const writeCount = r.permissions.filter((p) => p.write).length;
          const deleteCount = r.permissions.filter((p) => p.delete).length;

          return (
            <button
              key={r.role}
              onClick={() => {
                setSelectedRoleKey(r.role);
                if (viewMode === 'stacked') {
                  const el = document.getElementById(`role-section-${r.role}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? `bg-white dark:bg-[#1E2718] ${theme.activeBorder} shadow-sm`
                  : 'bg-white/60 dark:bg-[#1A2215]/80 border-slate-200/80 dark:border-[#2F3E29] hover:bg-slate-50 dark:hover:bg-[#202C1B]'
              }`}
            >
              {/* Header: Icon & Role Name */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${theme.accentBg}`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {r.role}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                    isSelected ? theme.badgeBg : 'bg-slate-200 dark:bg-[#2A3723] text-slate-700 dark:text-[#A4AC86]'
                  }`}
                >
                  {assignedCount}
                </span>
              </div>

              {/* Role Title */}
              <div className="text-[11px] font-medium text-slate-600 dark:text-[#A4AC86] line-clamp-1 mb-2">
                {theme.label}
              </div>

              {/* Mini Permissions Badge Indicator */}
              <div className="flex items-center gap-1.5 text-[9.5px] font-mono border-t border-slate-100 dark:border-[#2B3824] pt-1.5 text-slate-500 dark:text-[#7A866E]">
                <span title="Read permissions" className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                  <Eye className="w-2.5 h-2.5" />
                  <span>{readCount}</span>
                </span>
                <span>•</span>
                <span title="Write permissions" className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400">
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>{writeCount}</span>
                </span>
                <span>•</span>
                <span title="Delete permissions" className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>{deleteCount}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Role Sections Container */}
      <div className="space-y-6">
        {displayedRoles.map((r) => {
          const theme = ROLE_THEMES[r.role] || ROLE_THEMES.ADMIN;
          const RoleIcon = theme.icon;
          const isSaving = savingRole === r.role;

          // Filter permissions by search query
          const filteredPermissions = r.permissions.filter((p) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const mod = moduleMap.get(p.moduleId);
            if (p.moduleId.toLowerCase().includes(query)) return true;
            if (mod?.label.toLowerCase().includes(query)) return true;
            if (mod?.description?.toLowerCase().includes(query)) return true;
            if (mod?.categoryLabel?.toLowerCase().includes(query)) return true;
            return false;
          });

          const totalAssigned = r.permissions.length;
          const readCount = r.permissions.filter((p) => p.read).length;
          const writeCount = r.permissions.filter((p) => p.write).length;
          const deleteCount = r.permissions.filter((p) => p.delete).length;

          return (
            <div
              key={r.role}
              id={`role-section-${r.role}`}
              className="bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl shadow-xs overflow-hidden"
            >
              {/* Role Section Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-[#2F3E29] bg-slate-50/70 dark:bg-[#161E12]/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Role Identity */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${theme.accentBg}`}
                  >
                    <RoleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {theme.label}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md font-bold uppercase bg-slate-200/80 dark:bg-[#24301D] text-slate-700 dark:text-[#C2C5AA]">
                        {r.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-0.5 leading-relaxed max-w-2xl">
                      {r.description || theme.sublabel}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500 dark:text-[#7A866E]">
                      <span>
                        <strong className="text-slate-800 dark:text-white font-bold">{totalAssigned}</strong> Pages Assigned
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        {readCount} Read
                      </span>
                      <span>•</span>
                      <span className="text-sky-700 dark:text-sky-400 font-medium">
                        {writeCount} Write
                      </span>
                      <span>•</span>
                      <span className="text-rose-700 dark:text-rose-400 font-medium">
                        {deleteCount} Delete
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Section Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Quick Presets */}
                  <div className="flex items-center gap-1 bg-white dark:bg-[#202C1B] p-1 rounded-xl border border-slate-200 dark:border-[#38482E]">
                    <button
                      onClick={() => handleBulkGrant(r.role, 'all_full')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#2D3A24] rounded-lg transition-colors cursor-pointer"
                      title="Grant full Read, Write & Delete on all pages"
                    >
                      Grant Full
                    </button>
                    <button
                      onClick={() => handleBulkGrant(r.role, 'all_read')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#2D3A24] rounded-lg transition-colors cursor-pointer"
                      title="Set all pages to Read-Only"
                    >
                      Read Only All
                    </button>
                  </div>

                  {/* Add New Button for this role */}
                  <button
                    onClick={() => openAddModal(r.role)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-[#2A3824] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Add New</span>
                  </button>

                  {/* Save Button for this role */}
                  <button
                    onClick={() => handleSaveRole(r.role)}
                    disabled={isSaving}
                    className="clinical-button-primary px-3.5 py-1.5 text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Save Permissions</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Permissions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#2F3E29] bg-slate-50/50 dark:bg-[#192214] text-[11px] font-bold text-slate-600 dark:text-[#A4AC86] uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6">Module / Hospital Page</th>
                      <th className="py-3 px-4 text-center w-28">Read</th>
                      <th className="py-3 px-4 text-center w-28">Write</th>
                      <th className="py-3 px-4 text-center w-28">Delete</th>
                      <th className="py-3 px-4 text-center w-36">Preset</th>
                      <th className="py-3 px-4 text-right w-20">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#25321E] text-xs">
                    {filteredPermissions.length > 0 ? (
                      filteredPermissions.map((perm) => {
                        const mod = moduleMap.get(perm.moduleId);
                        const ModIcon = ICON_MAP[perm.moduleId] || FileText;
                        const label = mod ? mod.label : perm.moduleId;
                        const categoryLabel = mod ? mod.categoryLabel : 'General Module';
                        const description = mod?.description || '';

                        const isFull = perm.read && perm.write && perm.delete;
                        const isReadOnly = perm.read && !perm.write && !perm.delete;
                        const isNone = !perm.read && !perm.write && !perm.delete;

                        return (
                          <tr
                            key={perm.moduleId}
                            className="hover:bg-slate-50/80 dark:hover:bg-[#202C1B]/60 transition-colors group"
                          >
                            {/* Module Info */}
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#25331E] border border-slate-200/80 dark:border-[#333D29] flex items-center justify-center shrink-0 text-slate-700 dark:text-[#C2C5AA] mt-0.5 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                                  <ModIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                      {label}
                                    </span>
                                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#25331E] border border-slate-200/60 dark:border-[#333D29] text-slate-500 dark:text-[#A4AC86]">
                                      {perm.moduleId}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-slate-100 dark:bg-[#202C1B] text-slate-600 dark:text-[#9FB188]">
                                      {categoryLabel}
                                    </span>
                                  </div>
                                  {description && (
                                    <p className="text-[11px] text-slate-500 dark:text-[#889476] mt-0.5 line-clamp-1">
                                      {description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* READ Toggle */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(r.role, perm.moduleId, 'read')}
                                className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  perm.read
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs hover:bg-emerald-200'
                                    : 'bg-slate-100 dark:bg-[#222E1D] text-slate-400 dark:text-[#5B6651] border border-slate-200 dark:border-[#2F3E29] hover:bg-slate-200 dark:hover:bg-[#293822]'
                                }`}
                                title={perm.read ? 'Click to revoke Read' : 'Click to grant Read'}
                              >
                                {perm.read ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Read</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 opacity-60" />
                                    <span className="line-through opacity-60">Read</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* WRITE Toggle */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(r.role, perm.moduleId, 'write')}
                                className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  perm.write
                                    ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-2xs hover:bg-sky-200'
                                    : 'bg-slate-100 dark:bg-[#222E1D] text-slate-400 dark:text-[#5B6651] border border-slate-200 dark:border-[#2F3E29] hover:bg-slate-200 dark:hover:bg-[#293822]'
                                }`}
                                title={perm.write ? 'Click to revoke Write' : 'Click to grant Write'}
                              >
                                <Edit3 className={`w-3.5 h-3.5 ${perm.write ? '' : 'opacity-60'}`} />
                                <span className={perm.write ? '' : 'line-through opacity-60'}>Write</span>
                              </button>
                            </td>

                            {/* DELETE Toggle */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(r.role, perm.moduleId, 'delete')}
                                className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  perm.delete
                                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs hover:bg-rose-200'
                                    : 'bg-slate-100 dark:bg-[#222E1D] text-slate-400 dark:text-[#5B6651] border border-slate-200 dark:border-[#2F3E29] hover:bg-slate-200 dark:hover:bg-[#293822]'
                                }`}
                                title={perm.delete ? 'Click to revoke Delete' : 'Click to grant Delete'}
                              >
                                <Trash2 className={`w-3.5 h-3.5 ${perm.delete ? '' : 'opacity-60'}`} />
                                <span className={perm.delete ? '' : 'line-through opacity-60'}>Delete</span>
                              </button>
                            </td>

                            {/* Preset Buttons */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#222E1D] p-1 rounded-xl border border-slate-200 dark:border-[#2F3E29]">
                                <button
                                  type="button"
                                  onClick={() => handleSetPreset(r.role, perm.moduleId, 'full')}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                    isFull
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                  title="Enable Read, Write and Delete"
                                >
                                  Full
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetPreset(r.role, perm.moduleId, 'read_only')}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                    isReadOnly
                                      ? 'bg-sky-600 text-white shadow-2xs'
                                      : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                  title="Enable Read Only"
                                >
                                  Read Only
                                </button>
                              </div>
                            </td>

                            {/* Remove from Role */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveModule(r.role, perm.moduleId)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title={`Remove ${label} from ${r.role}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-[#6D7762]">
                          <div className="max-w-xs mx-auto space-y-2">
                            <p className="text-xs">
                              {searchQuery
                                ? `No modules matching "${searchQuery}" in this role.`
                                : `No modules assigned to ${r.role} yet.`}
                            </p>
                            <button
                              type="button"
                              onClick={() => openAddModal(r.role)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add First Page to {r.role}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Role Section Footer */}
              <div className="p-3 bg-slate-50/50 dark:bg-[#161E12]/50 border-t border-slate-100 dark:border-[#25321E] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#A4AC86]">
                <span>
                  Showing {filteredPermissions.length} of {r.permissions.length} modules configured for {theme.label}
                </span>
                <button
                  type="button"
                  onClick={() => openAddModal(r.role)}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add another module</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* ADD NEW MODAL (Add Existing Page or Register Custom Page) */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-[#2F3E29] bg-slate-50/70 dark:bg-[#161E12] flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Add Module to Role
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-0.5">
                    Assign hospital pages with granular Read, Write, and Delete access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddModuleSubmit} className="p-5 space-y-4">
              {/* Target Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1.5 uppercase tracking-wide">
                  Target Role
                </label>
                <select
                  value={addModalRole}
                  onChange={(e) => setAddModalRole(e.target.value as RoleKey)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="ADMIN">ADMIN — System Administration</option>
                  <option value="DOCTOR">DOCTOR — Clinical & Doctor Deck</option>
                  <option value="RECEPTIONIST">RECEPTIONIST — Front-Desk & Reception</option>
                  <option value="PHARMACIST">PHARMACIST — Pharmacy & Medical Store</option>
                  <option value="PATIENT">PATIENT — Patient Services & Portal</option>
                </select>
              </div>

              {/* Sub-tabs: Existing Page vs Custom Page */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#202C1B] p-1 rounded-xl border border-slate-200 dark:border-[#38482E]">
                <button
                  type="button"
                  onClick={() => setAddModalTab('existing')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    addModalTab === 'existing'
                      ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  From Existing Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalTab('custom')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    addModalTab === 'custom'
                      ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  + Create New Custom Page
                </button>
              </div>

              {addModalTab === 'existing' ? (
                /* Existing Page Form */
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1.5">
                      Select Hospital Page / Module
                    </label>
                    <select
                      value={selectedExistingModuleId}
                      onChange={(e) => setSelectedExistingModuleId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none cursor-pointer"
                    >
                      {allModules.map((m) => {
                        const currentRole = roles.find((r) => r.role === addModalRole);
                        const isAssigned = currentRole?.permissions.some((p) => p.moduleId === m.id);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.label} ({m.id}) {isAssigned ? '— [Already Assigned]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Permissions Checkboxes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-2">
                      Assign Initial Permissions for this Page
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* READ */}
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          existingRead
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-600 dark:text-[#A4AC86]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={existingRead}
                          onChange={(e) => setExistingRead(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs">Read Access</span>
                      </label>

                      {/* WRITE */}
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          existingWrite
                            ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-600 dark:text-[#A4AC86]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={existingWrite}
                          onChange={(e) => setExistingWrite(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-xs">Write Access</span>
                      </label>

                      {/* DELETE */}
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          existingDelete
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-600 dark:text-[#A4AC86]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={existingDelete}
                          onChange={(e) => setExistingDelete(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-xs">Delete Access</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Custom Page Form */
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                        Module Identifier (ID) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. tele_consult"
                        value={customModuleId}
                        onChange={(e) => setCustomModuleId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                        Page Title / Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Telehealth Suite"
                        value={customModuleLabel}
                        onChange={(e) => setCustomModuleLabel(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                      Department Category
                    </label>
                    <select
                      value={customModuleCategory}
                      onChange={(e) =>
                        setCustomModuleCategory(
                          e.target.value as 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY'
                        )
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40 focus:outline-none cursor-pointer"
                    >
                      <option value="CLINICAL">Clinical & Doctor Deck</option>
                      <option value="RECEPTION">Front-Desk & Reception</option>
                      <option value="PATIENT">Patient Services</option>
                      <option value="PHARMACY">Pharmacy & Medical Store</option>
                      <option value="ADMIN">System Administration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief description of page capabilities..."
                      value={customModuleDescription}
                      onChange={(e) => setCustomModuleDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                    />
                  </div>

                  {/* Initial permissions for new module */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-2">
                      Permissions for {addModalRole}
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <label
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${
                          customRead
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-600 dark:text-[#A4AC86]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={customRead}
                          onChange={(e) => setCustomRead(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs">Read</span>
                      </label>
                      <label
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${
                          customWrite
                            ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-600 dark:text-[#A4AC86]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={customWrite}
                          onChange={(e) => setCustomWrite(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-xs">Write</span>
                      </label>
                      <label
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${
                          customDelete
                            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-600 dark:text-[#A4AC86]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={customDelete}
                          onChange={(e) => setCustomDelete(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-xs">Delete</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#2F3E29]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#25331E] border border-slate-200 dark:border-[#38482E] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clinical-button-primary px-4 py-2 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    {addModalTab === 'existing'
                      ? `Assign to ${addModalRole}`
                      : `Create & Assign to ${addModalRole}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModuleStudio;
