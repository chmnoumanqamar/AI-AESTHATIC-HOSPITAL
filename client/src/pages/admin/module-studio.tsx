import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  ShieldCheck,
  Activity,
  ClipboardList,
  Pill,
  Users,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  RefreshCw,
  RotateCcw,
  Search,
  CheckCircle2,
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
  Filter,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';

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

const ROLES_CONFIG: {
  key: RoleKey;
  label: string;
  shortLabel: string;
  icon: any;
  colorClass: string;
  activeTabClass: string;
}[] = [
  {
    key: 'ADMIN',
    label: 'System Administration',
    shortLabel: 'Admin',
    icon: ShieldCheck,
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    activeTabClass: 'bg-emerald-700 text-white dark:bg-emerald-600',
  },
  {
    key: 'DOCTOR',
    label: 'Clinical & Doctor Deck',
    shortLabel: 'Doctor',
    icon: Activity,
    colorClass: 'text-sky-700 dark:text-sky-400',
    activeTabClass: 'bg-sky-700 text-white dark:bg-sky-600',
  },
  {
    key: 'RECEPTIONIST',
    label: 'Front-Desk & Reception',
    shortLabel: 'Reception',
    icon: ClipboardList,
    colorClass: 'text-purple-700 dark:text-purple-400',
    activeTabClass: 'bg-purple-700 text-white dark:bg-purple-600',
  },
  {
    key: 'PHARMACIST',
    label: 'Pharmacy & Medical Store',
    shortLabel: 'Pharmacy',
    icon: Pill,
    colorClass: 'text-teal-700 dark:text-teal-400',
    activeTabClass: 'bg-teal-700 text-white dark:bg-teal-600',
  },
  {
    key: 'PATIENT',
    label: 'Patient Services & Portal',
    shortLabel: 'Patient',
    icon: Users,
    colorClass: 'text-amber-700 dark:text-amber-400',
    activeTabClass: 'bg-amber-700 text-white dark:bg-amber-600',
  },
];

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

  const [activeRole, setActiveRole] = useState<RoleKey>('ADMIN');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});

  // Add New Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'existing' | 'custom'>('existing');
  const [targetAddRole, setTargetAddRole] = useState<RoleKey>('ADMIN');

  // Existing Page Form
  const [selectedExistingModuleId, setSelectedExistingModuleId] = useState('');
  const [existingRead, setExistingRead] = useState(true);
  const [existingWrite, setExistingWrite] = useState(false);
  const [existingDelete, setExistingDelete] = useState(false);

  // Custom Page Form
  const [customModuleId, setCustomModuleId] = useState('');
  const [customModuleLabel, setCustomModuleLabel] = useState('');
  const [customCategory, setCustomCategory] = useState<'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY'>('CLINICAL');
  const [customDescription, setCustomDescription] = useState('');
  const [customRead, setCustomRead] = useState(true);
  const [customWrite, setCustomWrite] = useState(true);
  const [customDelete, setCustomDelete] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
      console.warn('Fallback to local cache:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moduleMap = useMemo(() => {
    const map = new Map<string, PageHierarchyItem>();
    for (const m of allModules) {
      map.set(m.id, m);
    }
    return map;
  }, [allModules]);

  const currentRoleDefinition = roles.find((r) => r.role === activeRole) || roles[0];

  // Toggle individual permission (Read / Write / Delete)
  const handleToggle = (roleKey: RoleKey, moduleId: string, field: 'read' | 'write' | 'delete') => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.role !== roleKey) return r;
        const updated = r.permissions.map((p) => {
          if (p.moduleId !== moduleId) return p;
          const nextVal = !p[field];
          const newRule = { ...p, [field]: nextVal };
          if ((field === 'write' || field === 'delete') && nextVal) {
            newRule.read = true; // Auto-enable Read if Write or Delete is given
          }
          if (field === 'read' && !nextVal) {
            newRule.write = false; // Auto-disable Write & Delete if Read is revoked
            newRule.delete = false;
          }
          return newRule;
        });
        return { ...r, permissions: updated };
      })
    );
    setHasUnsavedChanges((prev) => ({ ...prev, [roleKey]: true }));
  };

  // Bulk Grant (All Full / All Read / Clear)
  const handleBulkSet = (roleKey: RoleKey, mode: 'full' | 'read' | 'clear') => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.role !== roleKey) return r;
        return {
          ...r,
          permissions: r.permissions.map((p) => {
            if (mode === 'full') return { ...p, read: true, write: true, delete: true };
            if (mode === 'read') return { ...p, read: true, write: false, delete: false };
            return { ...p, read: false, write: false, delete: false };
          }),
        };
      })
    );
    setHasUnsavedChanges((prev) => ({ ...prev, [roleKey]: true }));
    showToast(`Applied ${mode === 'full' ? 'Full Access' : mode === 'read' ? 'Read-Only' : 'Revoked'} to ${roleKey}`);
  };

  // Remove module from role
  const handleRemove = async (roleKey: RoleKey, moduleId: string) => {
    const pageObj = moduleMap.get(moduleId);
    const label = pageObj ? pageObj.label : moduleId;

    if (!window.confirm(`Remove "${label}" from role ${roleKey}?`)) return;

    try {
      await api.delete(`/admin/role-permissions/${roleKey}/${moduleId}`);
    } catch (e) {
      console.warn('API error, falling back locally', e);
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
    showToast(`Removed "${label}" from ${roleKey}`);
  };

  // Save changes
  const handleSave = async (roleKey: RoleKey) => {
    const target = roles.find((r) => r.role === roleKey);
    if (!target) return;

    setSavingRole(roleKey);
    try {
      await api.put(`/admin/role-permissions/${roleKey}`, {
        permissions: target.permissions,
      });
      localStorage.setItem('hospital_role_permissions_cache', JSON.stringify(roles));
      setHasUnsavedChanges((prev) => ({ ...prev, [roleKey]: false }));
      showToast(`✓ Permissions saved for ${roleKey}`);
    } catch (err: any) {
      localStorage.setItem('hospital_role_permissions_cache', JSON.stringify(roles));
      setHasUnsavedChanges((prev) => ({ ...prev, [roleKey]: false }));
      showToast(`✓ Permissions saved locally for ${roleKey}`);
    } finally {
      setSavingRole(null);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!window.confirm('Reset all roles and permissions to standard clinical defaults?')) return;
    setLoading(true);
    try {
      const res = await api.post('/admin/role-permissions/reset');
      if (res.data?.data?.roles) {
        setRoles(res.data.data.roles);
        localStorage.setItem('hospital_role_permissions_cache', JSON.stringify(res.data.data.roles));
      } else {
        setRoles(DEFAULT_ROLES_FALLBACK);
      }
      setHasUnsavedChanges({});
      showToast('✓ Reset to system defaults');
    } catch (err) {
      setRoles(DEFAULT_ROLES_FALLBACK);
      setHasUnsavedChanges({});
      showToast('✓ Reset to system defaults');
    } finally {
      setLoading(false);
    }
  };

  // Open modal
  const openAddModal = (roleKey: RoleKey) => {
    setTargetAddRole(roleKey);
    const curr = roles.find((r) => r.role === roleKey);
    const assigned = new Set(curr?.permissions.map((p) => p.moduleId) || []);
    const available = allModules.filter((m) => !assigned.has(m.id));
    setSelectedExistingModuleId(available[0]?.id || allModules[0]?.id || '');
    setExistingRead(true);
    setExistingWrite(roleKey === 'ADMIN');
    setExistingDelete(roleKey === 'ADMIN');
    setCustomModuleId('');
    setCustomModuleLabel('');
    setCustomDescription('');
    setIsAddModalOpen(true);
  };

  // Submit modal
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addModalTab === 'existing') {
      if (!selectedExistingModuleId) {
        alert('Please select a module to assign');
        return;
      }

      try {
        await api.post('/admin/role-permissions/module', {
          role: targetAddRole,
          moduleId: selectedExistingModuleId,
          read: existingRead,
          write: existingWrite,
          delete: existingDelete,
        });
      } catch (e) {
        console.warn('API error, falling back locally', e);
      }

      setRoles((prev) =>
        prev.map((r) => {
          if (r.role !== targetAddRole) return r;
          const exists = r.permissions.some((p) => p.moduleId === selectedExistingModuleId);
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

      const mod = moduleMap.get(selectedExistingModuleId);
      showToast(`✓ Added "${mod?.label || selectedExistingModuleId}" to ${targetAddRole}`);
      setIsAddModalOpen(false);
    } else {
      const cleanId = customModuleId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const cleanLabel = customModuleLabel.trim();
      if (!cleanId || !cleanLabel) {
        alert('Module ID and Page Title are required');
        return;
      }

      const categoryLabels: Record<string, string> = {
        ADMIN: 'System Administration',
        CLINICAL: 'Clinical & Doctor Deck',
        RECEPTION: 'Front-Desk & Reception',
        PATIENT: 'Patient Services',
        PHARMACY: 'Pharmacy & Medical Store',
      };

      const newModuleDef: PageHierarchyItem = {
        id: cleanId,
        label: cleanLabel,
        category: customCategory,
        categoryLabel: categoryLabels[customCategory] || customCategory,
        description: customDescription.trim() || `${cleanLabel} service`,
      };

      try {
        await api.post('/admin/role-permissions/module', {
          role: targetAddRole,
          moduleId: cleanId,
          read: customRead,
          write: customWrite,
          delete: customDelete,
          newModuleDef,
        });
      } catch (e) {
        console.warn('API error, falling back locally', e);
      }

      setAllModules((prev) => {
        if (prev.some((m) => m.id === cleanId)) return prev;
        const updated = [...prev, newModuleDef];
        localStorage.setItem('hospital_dynamic_hierarchy', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('hospital_hierarchy_updated', { detail: updated }));
        return updated;
      });

      setRoles((prev) =>
        prev.map((r) => {
          if (r.role !== targetAddRole) return r;
          return {
            ...r,
            permissions: [
              ...r.permissions.filter((p) => p.moduleId !== cleanId),
              { moduleId: cleanId, read: customRead, write: customWrite, delete: customDelete },
            ],
          };
        })
      );

      showToast(`✓ Created "${cleanLabel}" & assigned to ${targetAddRole}`);
      setIsAddModalOpen(false);
    }
  };

  // Filtered list of permissions for active role
  const displayedPermissions = useMemo(() => {
    if (!currentRoleDefinition) return [];
    return currentRoleDefinition.permissions.filter((p) => {
      const mod = moduleMap.get(p.moduleId);
      if (selectedCategory !== 'ALL' && mod?.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (p.moduleId.toLowerCase().includes(q)) return true;
      if (mod?.label.toLowerCase().includes(q)) return true;
      if (mod?.description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [currentRoleDefinition, moduleMap, searchQuery, selectedCategory]);

  const activeRoleConfig = ROLES_CONFIG.find((c) => c.key === activeRole) || ROLES_CONFIG[0];
  const isDirty = Boolean(hasUnsavedChanges[activeRole]);

  return (
    <div className="space-y-4 animate-fade-in pb-10 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 p-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-2 shadow-xl animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Segmented Role Tabs & Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#2A3422] pb-3">
        {/* Horizontal Segmented Role Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#1C2518] border border-slate-200/80 dark:border-[#2F3E29] overflow-x-auto max-w-full">
          {ROLES_CONFIG.map((rc) => {
            const roleDef = roles.find((r) => r.role === rc.key);
            const count = roleDef?.permissions.length || 0;
            const isSelected = activeRole === rc.key;
            const Icon = rc.icon;
            const roleDirty = Boolean(hasUnsavedChanges[rc.key]);

            return (
              <button
                key={rc.key}
                type="button"
                onClick={() => setActiveRole(rc.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${
                  isSelected
                    ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#A4AC86] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600 dark:text-emerald-300' : ''}`} />
                <span>{rc.shortLabel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-white/20 text-slate-900 dark:text-white'
                      : 'bg-slate-200 dark:bg-[#25331E] text-slate-600 dark:text-[#889476]'
                  }`}
                >
                  {count}
                </span>
                {roleDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openAddModal(activeRole)}
            className="clinical-button-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Page</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(activeRole)}
            disabled={savingRole === activeRole}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/30'
                : 'bg-slate-100 dark:bg-[#202C1B] text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-200 dark:hover:bg-[#293822] border border-slate-200 dark:border-[#38482E]'
            }`}
          >
            {savingRole === activeRole ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            )}
            <span>{isDirty ? 'Save Changes' : 'Saved'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-[#A4AC86] dark:hover:text-white border border-slate-200 dark:border-[#38482E] hover:bg-slate-100 dark:hover:bg-[#202C1B] transition-colors cursor-pointer"
            title="Reset to system defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Role Summary Bar & Quick Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1A2215] p-3 rounded-2xl border border-slate-200/90 dark:border-[#2A3422] shadow-2xs">
        {/* Role Identity Tag & Metrics */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#24301D] flex items-center justify-center text-slate-700 dark:text-[#C2C5AA] shrink-0 border border-slate-200 dark:border-[#333E2B]">
            {React.createElement(activeRoleConfig.icon, { className: 'w-4 h-4 text-emerald-600 dark:text-emerald-400' })}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                {activeRoleConfig.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-[#7A866E]">
                ({currentRoleDefinition?.permissions.length || 0} pages assigned)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#8C987C] line-clamp-1">
              {currentRoleDefinition?.description}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#748264]" />
            <input
              type="text"
              placeholder="Search module name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-slate-50 dark:bg-[#202C1B] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-slate-50 dark:bg-[#202C1B] text-slate-700 dark:text-[#C2C5AA] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="CLINICAL">Clinical Deck</option>
            <option value="RECEPTION">Front-Desk</option>
            <option value="PHARMACY">Pharmacy</option>
            <option value="PATIENT">Patient Portal</option>
            <option value="ADMIN">System Admin</option>
          </select>

          {/* Quick Bulk Access Dropdown */}
          <div className="flex items-center gap-1 border border-slate-200 dark:border-[#38482E] rounded-xl p-0.5 bg-slate-50 dark:bg-[#202C1B]">
            <button
              type="button"
              onClick={() => handleBulkSet(activeRole, 'full')}
              className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-[#A4AC86] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title="Grant Read, Write, and Delete to all pages"
            >
              All Full
            </button>
            <span className="text-slate-300 dark:text-[#38482E]">|</span>
            <button
              type="button"
              onClick={() => handleBulkSet(activeRole, 'read')}
              className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-[#A4AC86] hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
              title="Set all pages to Read-Only"
            >
              All Read
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2A3422] rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#25301E] bg-slate-50/60 dark:bg-[#161E12] text-[11px] font-bold text-slate-500 dark:text-[#889476] uppercase tracking-wider">
                <th className="py-3 px-5">Module / Hospital Page</th>
                <th className="py-3 px-3 text-center w-28">Department</th>
                <th className="py-3 px-3 text-center w-28">
                  <div className="inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Read</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28">
                  <div className="inline-flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Write</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28">
                  <div className="inline-flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Delete</span>
                  </div>
                </th>
                <th className="py-3 px-5 text-right w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222E1B] text-xs">
              {displayedPermissions.length > 0 ? (
                displayedPermissions.map((rule) => {
                  const mod = moduleMap.get(rule.moduleId);
                  const ModIcon = ICON_MAP[rule.moduleId] || FileText;
                  const label = mod ? mod.label : rule.moduleId;
                  const categoryLabel = mod ? mod.categoryLabel : 'Module';
                  const description = mod?.description || '';

                  return (
                    <tr
                      key={rule.moduleId}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#202C1B]/50 transition-colors group"
                    >
                      {/* Module Title & ID */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#24301D] border border-slate-200/80 dark:border-[#333E2B] flex items-center justify-center shrink-0 text-slate-700 dark:text-[#C2C5AA]">
                            <ModIcon className="w-3.5 h-3.5 text-slate-700 dark:text-[#A4AC86] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {label}
                              </span>
                              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-[#232F1D] text-slate-500 dark:text-[#889476]">
                                {rule.moduleId}
                              </span>
                            </div>
                            {description && (
                              <p className="text-[11px] text-slate-400 dark:text-[#768266] truncate max-w-md mt-0.5">
                                {description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Tag */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block text-[10.5px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-[#202C1B] text-slate-600 dark:text-[#95A580] border border-slate-200/60 dark:border-[#2F3E29]">
                          {categoryLabel.split('&')[0].trim()}
                        </span>
                      </td>

                      {/* READ Toggle Switch */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(activeRole, rule.moduleId, 'read')}
                          className={`w-9 h-5 inline-flex items-center rounded-full transition-colors cursor-pointer p-0.5 ${
                            rule.read
                              ? 'bg-emerald-600 justify-end'
                              : 'bg-slate-200 dark:bg-[#2D3925] justify-start'
                          }`}
                          title={rule.read ? 'Read permission active (click to revoke)' : 'Read permission revoked (click to grant)'}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow-xs block transition-transform" />
                        </button>
                      </td>

                      {/* WRITE Toggle Switch */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(activeRole, rule.moduleId, 'write')}
                          className={`w-9 h-5 inline-flex items-center rounded-full transition-colors cursor-pointer p-0.5 ${
                            rule.write
                              ? 'bg-sky-600 justify-end'
                              : 'bg-slate-200 dark:bg-[#2D3925] justify-start'
                          }`}
                          title={rule.write ? 'Write permission active (click to revoke)' : 'Write permission revoked (click to grant)'}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow-xs block transition-transform" />
                        </button>
                      </td>

                      {/* DELETE Toggle Switch */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(activeRole, rule.moduleId, 'delete')}
                          className={`w-9 h-5 inline-flex items-center rounded-full transition-colors cursor-pointer p-0.5 ${
                            rule.delete
                              ? 'bg-rose-600 justify-end'
                              : 'bg-slate-200 dark:bg-[#2D3925] justify-start'
                          }`}
                          title={rule.delete ? 'Delete permission active (click to revoke)' : 'Delete permission revoked (click to grant)'}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow-xs block transition-transform" />
                        </button>
                      </td>

                      {/* Remove Button */}
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(activeRole, rule.moduleId)}
                          className="p-1.5 rounded-lg text-slate-300 dark:text-[#4A5543] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove module from role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-[#6E7B61]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-xs">
                        {searchQuery
                          ? `No modules matching "${searchQuery}".`
                          : `No modules currently assigned to ${activeRoleConfig.label}.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => openAddModal(activeRole)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign First Page</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Footer Bar */}
        <div className="px-5 py-2.5 bg-slate-50/50 dark:bg-[#161E12] border-t border-slate-100 dark:border-[#222E1B] flex items-center justify-between text-[11px] text-slate-400 dark:text-[#7A866E]">
          <span>
            Showing {displayedPermissions.length} of {currentRoleDefinition?.permissions.length || 0} modules configured for {activeRole}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Read Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" /> Write Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> Delete Active
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* ADD MODULE MODAL (Clean, Minimalist Dialog) */}
      {/* ======================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-[#2A3422] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Page to {targetAddRole}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-[#7A866E]">
                    Configure Read, Write, and Delete access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleModalSubmit} className="p-4 space-y-4">
              {/* Segmented Mode Selector */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-[#202C1B] rounded-xl border border-slate-200/80 dark:border-[#2F3E29]">
                <button
                  type="button"
                  onClick={() => setAddModalTab('existing')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    addModalTab === 'existing'
                      ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-[#A4AC86]'
                  }`}
                >
                  Existing Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalTab('custom')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    addModalTab === 'custom'
                      ? 'bg-white dark:bg-[#2D6A4F] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-[#A4AC86]'
                  }`}
                >
                  + Create New Page
                </button>
              </div>

              {addModalTab === 'existing' ? (
                /* Select Existing Module */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                      Choose Page
                    </label>
                    <select
                      value={selectedExistingModuleId}
                      onChange={(e) => setSelectedExistingModuleId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      {allModules.map((m) => {
                        const curr = roles.find((r) => r.role === targetAddRole);
                        const isAssigned = curr?.permissions.some((p) => p.moduleId === m.id);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.label} ({m.id}) {isAssigned ? '— [Assigned]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Initial Permissions */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1.5">
                      Permissions
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <label
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${
                          existingRead
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-500'
                        }`}
                      >
                        <span>Read</span>
                        <input
                          type="checkbox"
                          checked={existingRead}
                          onChange={(e) => setExistingRead(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      <label
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${
                          existingWrite
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-500'
                        }`}
                      >
                        <span>Write</span>
                        <input
                          type="checkbox"
                          checked={existingWrite}
                          onChange={(e) => setExistingWrite(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                      </label>

                      <label
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${
                          existingDelete
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-500'
                        }`}
                      >
                        <span>Delete</span>
                        <input
                          type="checkbox"
                          checked={existingDelete}
                          onChange={(e) => setExistingDelete(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Custom New Module Form */
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                        Module ID *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. tele_consult"
                        value={customModuleId}
                        onChange={(e) => setCustomModuleId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                        Page Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Telehealth Suite"
                        value={customModuleLabel}
                        onChange={(e) => setCustomModuleLabel(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                      Department
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) =>
                        setCustomCategory(
                          e.target.value as 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY'
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="CLINICAL">Clinical & Doctor Deck</option>
                      <option value="RECEPTION">Front-Desk & Reception</option>
                      <option value="PHARMACY">Pharmacy & Medical Store</option>
                      <option value="PATIENT">Patient Services & Portal</option>
                      <option value="ADMIN">System Administration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Short description..."
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#38482E] bg-white dark:bg-[#202C1B] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#C2C5AA] mb-1.5">
                      Permissions
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <label
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${
                          customRead
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-500'
                        }`}
                      >
                        <span>Read</span>
                        <input
                          type="checkbox"
                          checked={customRead}
                          onChange={(e) => setCustomRead(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      <label
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${
                          customWrite
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-500'
                        }`}
                      >
                        <span>Write</span>
                        <input
                          type="checkbox"
                          checked={customWrite}
                          onChange={(e) => setCustomWrite(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                      </label>

                      <label
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${
                          customDelete
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#202C1B] border-slate-200 dark:border-[#2F3E29] text-slate-500'
                        }`}
                      >
                        <span>Delete</span>
                        <input
                          type="checkbox"
                          checked={customDelete}
                          onChange={(e) => setCustomDelete(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2A3422]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#A4AC86] hover:bg-slate-100 dark:hover:bg-[#202C1B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clinical-button-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Assign Page</span>
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
