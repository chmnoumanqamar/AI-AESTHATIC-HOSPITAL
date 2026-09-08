import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Ban,
  RefreshCw,
  Phone,
  Mail,
  X,
  AlertTriangle,
  Stethoscope,
  ClipboardList,
  User,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  KeyRound,
  Pill,
  AtSign,
  Building,
  Calendar,
  MapPin,
  Award,
  Clock,
  Heart,
  PhoneCall,
  Info,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';

export interface HospitalUser {
  id: string;
  username: string;
  phone: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
  name: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  cnic?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  department?: string | null;
  licenseNumber?: string | null;
  qualifications?: string[];
  experienceYears?: number | null;
  consultationFee?: number | null;
  deskNumber?: string | null;
  shift?: string | null;
  allergies?: string | null;
  isBlocked: boolean;
  blockedReason?: string | null;
  blockedAt?: string | null;
  allowedModules?: string[];
  createdAt: string;
  profile?: any;
}

export interface ModuleCatalogItem {
  id: string;
  name: string;
  desc: string;
  defaultCategory: 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY';
}

export const ALL_HOSPITAL_PAGE_ITEMS: ModuleCatalogItem[] = [
  { id: 'doctor_queue', name: "Today's Clinical Queue", desc: 'Live waiting queue, calling next patients & triage status', defaultCategory: 'CLINICAL' },
  { id: 'doctor_consultation', name: 'Consultations & Rx', desc: 'Clinical encounter notes, digital prescriptions & lab tests', defaultCategory: 'CLINICAL' },
  { id: 'doctor_tokens', name: 'Token Matrix', desc: 'Doctor capacity limits, token slot reservation & release', defaultCategory: 'CLINICAL' },

  { id: 'recep_desk', name: 'Queue & Check-In', desc: 'Walk-in patient check-in, token issuance & arrival tracking', defaultCategory: 'RECEPTION' },
  { id: 'recep_approvals', name: 'Pending Bookings', desc: 'Authorize or decline online/WhatsApp appointment requests', defaultCategory: 'RECEPTION' },
  { id: 'recep_pos', name: 'Front-Desk POS', desc: 'Point of sale, consultation fee collection & invoice printing', defaultCategory: 'RECEPTION' },
  { id: 'recep_reports', name: 'Front-Desk Analytics', desc: 'Daily patient throughput, check-in stats & front-desk ledger', defaultCategory: 'RECEPTION' },

  { id: 'patient_portal', name: 'My Appointments & Tokens', desc: 'Active tokens, upcoming visits & reschedule/cancellation', defaultCategory: 'PATIENT' },
  { id: 'patient_booking', name: 'Book Appointment Suite', desc: 'Appointment booking wizard for self or family members', defaultCategory: 'PATIENT' },
  { id: 'patient_history', name: 'Medical Records & Rx', desc: 'Diagnosis history, digital prescriptions & notification preferences', defaultCategory: 'PATIENT' },
  { id: 'patient_billing', name: 'Billing & Invoices', desc: 'Consultation charges ledger, payment records & balance', defaultCategory: 'PATIENT' },

  { id: 'pharma_queue', name: 'Live Dispense Queue', desc: 'Real-time doctor prescription fulfillment & allergy cross-checks', defaultCategory: 'PHARMACY' },
  { id: 'pharma_inventory', name: 'Drug Inventory Vault', desc: 'Electronic medicine stock levels, batch tracking, rack locations & low-stock alerts', defaultCategory: 'PHARMACY' },
  { id: 'pharma_pos', name: 'Pharmacy POS Counter', desc: 'Walk-in over-the-counter sales, instant cart calculations & thermal receipt billing', defaultCategory: 'PHARMACY' },
  { id: 'pharma_safety', name: 'Drug Safety & AI Screener', desc: 'Clinical contraindication screener, drug-drug interactions & patient allergy checks', defaultCategory: 'PHARMACY' },
  { id: 'pharma_procurement', name: 'Suppliers & Procurement', desc: 'Distributor purchase orders, stock intake verification & supply chain tracking', defaultCategory: 'PHARMACY' },

  { id: 'admin_users', name: 'User Access Control', desc: 'Staff account provisioning, blocking & module access', defaultCategory: 'ADMIN' },
  { id: 'admin_studio', name: 'Module & Page Studio', desc: 'Interactive drag-and-drop workspace to reassign and structure hospital pages across modules', defaultCategory: 'ADMIN' },
  { id: 'admin_audit', name: 'Compliance Audit Vault', desc: 'Immutable HIPAA & clinical compliance audit ledger', defaultCategory: 'ADMIN' },
  { id: 'admin_queue', name: 'Live Queue Monitor', desc: 'Hospital-wide real-time queue overview & token tracking', defaultCategory: 'ADMIN' },
  { id: 'admin_reports', name: 'Executive Analytics & BI', desc: 'Financial summaries, doctor efficiency & patient statistics', defaultCategory: 'ADMIN' },
  { id: 'admin_database', name: 'Database Clear & Reset', desc: 'Database schema diagnostics, queue cleanup & test purge', defaultCategory: 'ADMIN' },
  { id: 'admin_config', name: 'System Policies & Rules', desc: 'Hospital operation hours, daily limits & cancellation rules', defaultCategory: 'ADMIN' },
  { id: 'admin_ledger', name: 'Hospital Financial Ledger', desc: 'Hospital balance sheet, total collections & transaction log', defaultCategory: 'ADMIN' },
];

export const ALL_MODULE_IDS = ALL_HOSPITAL_PAGE_ITEMS.map(m => m.id);

export const ROLE_DEFAULT_PERMS: Record<string, string[]> = {
  DOCTOR: ['doctor_queue', 'doctor_consultation', 'doctor_tokens'],
  RECEPTIONIST: ['recep_desk', 'recep_approvals', 'recep_pos', 'recep_reports'],
  PATIENT: ['patient_portal', 'patient_booking', 'patient_history', 'patient_billing'],
  PHARMACIST: ['pharma_queue', 'pharma_inventory', 'pharma_pos', 'pharma_safety', 'pharma_procurement'],
  ADMIN: ALL_MODULE_IDS,
};

export const AdminUserAccessView: React.FC = () => {
  const [users, setUsers] = useState<HospitalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'CREDENTIALS' | 'PERSONAL' | 'PROFESSIONAL'>('CREDENTIALS');
  const [blockingTargetUser, setBlockingTargetUser] = useState<HospitalUser | null>(null);
  const [profileTargetUser, setProfileTargetUser] = useState<HospitalUser | null>(null);
  const [blockReason, setBlockReason] = useState('Administrative compliance review');
  const [actionLoading, setActionLoading] = useState(false);

  // Granular Permissions Modal State
  const [permissionTargetUser, setPermissionTargetUser] = useState<HospitalUser | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionsSuccessMsg, setPermissionsSuccessMsg] = useState<string | null>(null);

  // Enhanced New User Form State
  const defaultUserForm = {
    name: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    role: 'DOCTOR' as 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST',
    gender: 'Male',
    dateOfBirth: '',
    cnic: '',
    bloodGroup: 'O+',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    department: 'Cardiology',
    specialization: 'Cardiology & Internal Medicine',
    licenseNumber: '',
    qualifications: 'MBBS, FCPS',
    experienceYears: 5,
    consultationFee: 2500,
    deskNumber: 'OPD Counter 1',
    shift: 'Morning Shift (08:00 - 16:00)',
    allergies: ''
  };

  const [newUser, setNewUser] = useState(defaultUserForm);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [usernameTouched, setUsernameTouched] = useState(false);

  const getUsernameValidationStatus = () => {
    const uname = newUser.username.trim();
    if (!uname) {
      return { valid: false, message: 'Username is required for system login' };
    }
    if (uname.length < 3) {
      return { valid: false, message: 'Invalid username: Minimum 3 characters required' };
    }
    if (uname.length > 30) {
      return { valid: false, message: 'Invalid username: Maximum 30 characters allowed' };
    }
    if (/\s/.test(uname)) {
      return { valid: false, message: 'Invalid username: Spaces are not allowed' };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(uname)) {
      return { valid: false, message: 'Invalid username: Only letters, numbers, underscores (_), and dashes (-) allowed' };
    }
    const isTaken = users.some(u => u.username && u.username.toLowerCase() === uname.toLowerCase());
    if (isTaken) {
      return { valid: false, message: `Username "@${uname}" is already taken by another user` };
    }
    return { valid: true, message: `Username "@${uname}" is valid and available` };
  };

  const handleRoleSelect = (role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST') => {
    let defaultDept = 'Cardiology';
    let defaultSpec = 'Cardiology & Internal Medicine';
    if (role === 'RECEPTIONIST') {
      defaultDept = 'Patient Front-Desk';
      defaultSpec = 'Front-Desk Operations';
    } else if (role === 'PHARMACIST') {
      defaultDept = 'Central Pharmacy & Dispensary';
      defaultSpec = 'Clinical Pharmacology & Dispensing';
    } else if (role === 'PATIENT') {
      defaultDept = 'Outpatient Department';
      defaultSpec = 'General Medicine';
    } else if (role === 'ADMIN') {
      defaultDept = 'Hospital Administration';
      defaultSpec = 'Systems Operations & Compliance';
    }
    setNewUser(prev => ({
      ...prev,
      role,
      department: defaultDept,
      specialization: defaultSpec
    }));
  };

  const handleOpenCreateModal = () => {
    setNewUser(defaultUserForm);
    setConfirmPassword('');
    setPasswordError(null);
    setUsernameTouched(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCreateModalTab('CREDENTIALS');
    setIsCreateModalOpen(true);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          role: selectedRoleFilter,
          status: selectedStatusFilter,
          search: searchQuery || undefined
        }
      });
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to load hospital users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRoleFilter, selectedStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleBlock = async (user: HospitalUser, block: boolean, reason?: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/access`, {
        isBlocked: block,
        reason: block ? (reason || 'Administrative restriction applied') : undefined
      });
      await fetchUsers();
      setBlockingTargetUser(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update access permissions');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (user: HospitalUser, newRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST') => {
    if (user.role === newRole) return;
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const [categoryMap, setCategoryMap] = useState<Record<string, 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'ADMIN' | 'PHARMACY'>>(() => {
    try {
      const raw = localStorage.getItem('hospital_dynamic_hierarchy');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const map: Record<string, any> = {};
          parsed.forEach((p: any) => { map[p.id] = p.category; });
          return map;
        }
      }
    } catch (e) {}
    const defaultMap: Record<string, any> = {};
    ALL_HOSPITAL_PAGE_ITEMS.forEach(p => { defaultMap[p.id] = p.defaultCategory; });
    return defaultMap;
  });

  useEffect(() => {
    const handleHierarchySync = (e: any) => {
      const list = e.detail;
      if (Array.isArray(list)) {
        const map: Record<string, any> = {};
        list.forEach((p: any) => { map[p.id] = p.category; });
        setCategoryMap(map);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hospital_dynamic_hierarchy' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const map: Record<string, any> = {};
            parsed.forEach((p: any) => { map[p.id] = p.category; });
            setCategoryMap(map);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('hospital_hierarchy_updated', handleHierarchySync);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('hospital_hierarchy_updated', handleHierarchySync);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const permissionGroups = [
    {
      category: 'CLINICAL',
      title: 'Clinical & Doctor Deck',
      modules: ALL_HOSPITAL_PAGE_ITEMS.filter(m => (categoryMap[m.id] || m.defaultCategory) === 'CLINICAL')
    },
    {
      category: 'RECEPTION',
      title: 'Front-Desk & Reception',
      modules: ALL_HOSPITAL_PAGE_ITEMS.filter(m => (categoryMap[m.id] || m.defaultCategory) === 'RECEPTION')
    },
    {
      category: 'PATIENT',
      title: 'Patient Services',
      modules: ALL_HOSPITAL_PAGE_ITEMS.filter(m => (categoryMap[m.id] || m.defaultCategory) === 'PATIENT')
    },
    {
      category: 'PHARMACY',
      title: 'Pharmacy & Medical Store',
      modules: ALL_HOSPITAL_PAGE_ITEMS.filter(m => (categoryMap[m.id] || m.defaultCategory) === 'PHARMACY')
    },
    {
      category: 'ADMIN',
      title: 'System Administration',
      modules: ALL_HOSPITAL_PAGE_ITEMS.filter(m => (categoryMap[m.id] || m.defaultCategory) === 'ADMIN')
    },
  ].filter(g => g.modules.length > 0);

  const getRoleDefaultPerms = (role: string) => {
    if (role === 'ADMIN') return ALL_MODULE_IDS;
    const catMap: Record<string, string> = {
      DOCTOR: 'CLINICAL',
      RECEPTIONIST: 'RECEPTION',
      PATIENT: 'PATIENT',
      PHARMACIST: 'PHARMACY',
    };
    const targetCat = catMap[role];
    if (!targetCat) return [];
    return ALL_HOSPITAL_PAGE_ITEMS
      .filter(m => (categoryMap[m.id] || m.defaultCategory) === targetCat)
      .map(m => m.id);
  };

  const handleOpenPermissions = (user: HospitalUser) => {
    setPermissionTargetUser(user);
    if (user.allowedModules && Array.isArray(user.allowedModules)) {
      setSelectedModules([...user.allowedModules]);
    } else {
      setSelectedModules(getRoleDefaultPerms(user.role));
    }
    setPermissionsSuccessMsg(null);
  };

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSelectAllModules = () => {
    setSelectedModules([...ALL_MODULE_IDS]);
  };

  const handleResetToRoleDefaults = () => {
    if (!permissionTargetUser) return;
    setSelectedModules(getRoleDefaultPerms(permissionTargetUser.role));
  };

  const handleClearAllModules = () => {
    setSelectedModules([]);
  };

  const handleSavePermissions = async () => {
    if (!permissionTargetUser) return;
    setSavingPermissions(true);
    try {
      await api.patch(`/admin/users/${permissionTargetUser.id}/permissions`, {
        allowedModules: selectedModules
      });
      setUsers(prev =>
        prev.map(u => (u.id === permissionTargetUser.id ? { ...u, allowedModules: selectedModules } : u))
      );
      setPermissionsSuccessMsg('Permissions updated and applied successfully!');
      setTimeout(() => {
        setPermissionTargetUser(null);
        setPermissionsSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update user permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = newUser.username.trim();
    if (!uname) {
      setPasswordError('Username (Login ID) is required.');
      setCreateModalTab('CREDENTIALS');
      return;
    }
    if (uname.length < 3 || uname.length > 30) {
      setPasswordError('Invalid username: Must be between 3 and 30 characters.');
      setCreateModalTab('CREDENTIALS');
      return;
    }
    if (/\s/.test(uname)) {
      setPasswordError('Invalid username: Spaces are not allowed in username.');
      setCreateModalTab('CREDENTIALS');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(uname)) {
      setPasswordError('Invalid username: Only letters, numbers, underscores (_), and dashes (-) are allowed.');
      setCreateModalTab('CREDENTIALS');
      return;
    }
    if (users.some(u => u.username && u.username.toLowerCase() === uname.toLowerCase())) {
      setPasswordError(`Username "@${uname}" is already taken. Please choose another username.`);
      setCreateModalTab('CREDENTIALS');
      return;
    }
    if (!newUser.name.trim()) {
      setPasswordError('Full Legal Name is required.');
      setCreateModalTab('CREDENTIALS');
      return;
    }
    if (!newUser.phone.trim()) {
      setPasswordError('Phone number is required for contact and verification.');
      setCreateModalTab('PROFESSIONAL');
      return;
    }
    if (newUser.password !== confirmPassword) {
      setPasswordError('Passwords do not match. Please ensure both fields are identical.');
      setCreateModalTab('CREDENTIALS');
      return;
    }
    if (newUser.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      setCreateModalTab('CREDENTIALS');
      return;
    }
    setPasswordError(null);
    setActionLoading(true);
    try {
      await api.post('/admin/users', {
        ...newUser,
        username: uname.toLowerCase(),
        phone: newUser.phone.trim(),
        email: newUser.email.trim() || undefined,
        experienceYears: Number(newUser.experienceYears) || 0,
        consultationFee: Number(newUser.consultationFee) || 0
      });
      alert(`✅ Account created and access granted to ${newUser.name} (@${uname}) as ${newUser.role}!`);
      setIsCreateModalOpen(false);
      setNewUser(defaultUserForm);
      setConfirmPassword('');
      setPasswordError(null);
      await fetchUsers();
    } catch (err: any) {
      setPasswordError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create user account');
    } finally {
      setActionLoading(false);
    }
  };

  const totalUsers = users.length;
  const activeCount = users.filter(u => !u.isBlocked).length;
  const blockedCount = users.filter(u => u.isBlocked).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header Section: Actions Only */}
      <div className="flex items-center justify-end gap-2 pb-1">
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 text-slate-600 dark:text-[#C2C5AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#25331E] rounded-lg border border-slate-200 dark:border-[#38482E] transition-colors cursor-pointer"
          title="Refresh Registry"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={handleOpenCreateModal}
          className="clinical-button-primary flex items-center gap-2 text-xs font-semibold py-2 px-3.5"
        >
          <UserPlus className="w-4 h-4 text-emerald-300" />
          <span>Grant Access to New User</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Accounts */}
        <div className="clinical-card p-4 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#202C1B] border border-slate-200 dark:border-[#38482E] flex items-center justify-center text-slate-700 dark:text-[#C2C5AA] shrink-0">
            <Users className="w-5 h-5 text-slate-700 dark:text-[#C2C5AA]" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A4AC86] font-semibold uppercase tracking-wider">Total Accounts</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalUsers}</div>
          </div>
        </div>

        {/* Active & Authorized */}
        <div className="clinical-card p-4 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A4AC86] font-semibold uppercase tracking-wider">Active & Authorized</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          </div>
        </div>

        {/* Access Blocked */}
        <div className="clinical-card p-4 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A4AC86] font-semibold uppercase tracking-wider">Access Blocked</div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{blockedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clinical-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Dropdowns: Role Filter & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider shrink-0">
              Role:
            </label>
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="clinical-input text-xs py-1.5 px-2.5 font-semibold dark:bg-[#171F13] dark:border-[#38482E] dark:text-white cursor-pointer min-w-[135px]"
            >
              <option value="ALL">All Roles</option>
              <option value="DOCTOR">Doctors</option>
              <option value="RECEPTIONIST">Receptionists</option>
              <option value="PATIENT">Patients</option>
              <option value="PHARMACIST">Pharmacists</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider shrink-0">
              Status:
            </label>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="clinical-input text-xs py-1.5 px-2.5 font-semibold dark:bg-[#171F13] dark:border-[#38482E] dark:text-white cursor-pointer min-w-[125px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="BLOCKED">Blocked Only</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, @username, phone, CNIC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
              className="clinical-input w-full py-1.5 text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
            />
          </form>
        </div>
      </div>

      {/* Master Users Access Table */}
      <div className="bg-white dark:bg-[#1E2718] border border-slate-200 dark:border-[#2F3E29] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2F3E29] bg-slate-50/80 dark:bg-[#171F13] text-[11px] font-bold text-slate-500 dark:text-[#A4AC86] uppercase tracking-wider">
                <th className="py-3 px-5">User Name & Identity</th>
                <th className="py-3 px-5">Contact Details</th>
                <th className="py-3 px-5">Assigned Role</th>
                <th className="py-3 px-5">Module Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2F3E29] text-sm">
              {users.map((user) => {
                const isRootAdmin = user.role === 'ADMIN' && user.phone === '+15550000001';

                return (
                  <tr
                    key={user.id}
                    onClick={() => setProfileTargetUser(user)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-[#202C1B] transition-colors cursor-pointer group ${
                      user.isBlocked ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                    }`}
                    title="Click row to view full user profile dossier"
                  >
                    {/* User Identity - Minimal: Name & Username */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border transition-transform group-hover:scale-105 ${
                          user.isBlocked
                            ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : user.role === 'DOCTOR'
                            ? 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            : user.role === 'RECEPTIONIST'
                            ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : user.role === 'PHARMACIST'
                            ? 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                            : user.role === 'ADMIN'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {user.role === 'DOCTOR' && <Stethoscope className="w-4 h-4" />}
                          {user.role === 'RECEPTIONIST' && <ClipboardList className="w-4 h-4" />}
                          {user.role === 'PATIENT' && <User className="w-4 h-4" />}
                          {user.role === 'PHARMACIST' && <Pill className="w-4 h-4" />}
                          {user.role === 'ADMIN' && <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{user.name}</span>
                            {isRootAdmin && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-[#202C1B] text-slate-700 dark:text-[#A4AC86] border border-slate-300 dark:border-[#38482E] rounded font-mono font-bold">
                                ROOT
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono font-medium text-slate-500 dark:text-[#A4AC86] mt-0.5">
                            @{user.username || user.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details - Only Contact Number */}
                    <td className="py-3.5 px-5 text-xs">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-mono font-semibold">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-[#A4AC86]" />
                        <span>{user.phone}</span>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-3.5 px-5" onClick={e => e.stopPropagation()}>
                      <select
                        disabled={isRootAdmin}
                        value={user.role}
                        onChange={e => handleChangeRole(user, e.target.value as any)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer ${
                          user.role === 'DOCTOR'
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            : user.role === 'RECEPTIONIST'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : user.role === 'ADMIN'
                            ? 'bg-slate-100 dark:bg-[#203622] text-slate-800 dark:text-[#74C69D] border-slate-300 dark:border-[#2D6A4F]'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        <option value="DOCTOR">Doctor</option>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="PATIENT">Patient</option>
                        <option value="PHARMACIST">Pharmacist</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>

                    {/* Module Permissions */}
                    <td className="py-3.5 px-5" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenPermissions(user)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-[#203622] dark:hover:bg-[#2A482D] text-emerald-800 dark:text-[#74C69D] border border-emerald-200 dark:border-[#2D6A4F] transition-all cursor-pointer shadow-2xs"
                        title="Configure Granular Module Permissions"
                      >
                        <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {user.allowedModules && user.allowedModules.length > 0
                            ? `${user.allowedModules.length} Modules`
                            : user.role === 'ADMIN'
                            ? 'All 18 Modules'
                            : 'Role Default'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-sm font-medium">
                    No matching users found for this filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Block User Confirmation */}
      {blockingTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2F3E29]">
              <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Block Account Access</h3>
              </div>
              <button
                onClick={() => setBlockingTargetUser(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#C2C5AA]">
              Are you sure you want to block access for <strong className="text-slate-900 dark:text-white">{blockingTargetUser.name}</strong> ({blockingTargetUser.role})?
              Their active session will be invalidated and they will be barred from logging into the portal.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">Reason for Access Revocation</label>
              <textarea
                rows={2}
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="e.g. Disciplinary suspension, policy violation, security audit hold"
                className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockingTargetUser(null)}
                className="clinical-button-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleBlock(blockingTargetUser, true, blockReason)}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Revoking Access...' : 'Confirm Block Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Grant Access to New User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#2F3E29] flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#151D11]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-2xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Grant Access to New Hospital User
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {newUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-0.5">
                    Configure official system username, personal demographics, and hospital credentials.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setPasswordError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202C1B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="px-5 py-2.5 border-b border-slate-200 dark:border-[#2F3E29] flex items-center gap-2 bg-slate-50/40 dark:bg-[#131A10] shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCreateModalTab('CREDENTIALS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  createModalTab === 'CREDENTIALS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#202C1B] text-slate-600 dark:text-[#C2C5AA] border border-slate-200 dark:border-[#38482E] hover:bg-slate-100 dark:hover:bg-[#2A3924]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>1. Account Credentials</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateModalTab('PERSONAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  createModalTab === 'PERSONAL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#202C1B] text-slate-600 dark:text-[#C2C5AA] border border-slate-200 dark:border-[#38482E] hover:bg-slate-100 dark:hover:bg-[#2A3924]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>2. Personal Demographics</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateModalTab('PROFESSIONAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  createModalTab === 'PROFESSIONAL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#202C1B] text-slate-600 dark:text-[#C2C5AA] border border-slate-200 dark:border-[#38482E] hover:bg-slate-100 dark:hover:bg-[#2A3924]'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>3. Contact & Department</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {passwordError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* TAB 1: Account & Credentials */}
                {createModalTab === 'CREDENTIALS' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Full Legal Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Dr. Tariq Mehmood"
                          value={newUser.name}
                          onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                          className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          System Role <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={newUser.role}
                          onChange={e => handleRoleSelect(e.target.value as any)}
                          className="clinical-input w-full text-xs font-bold dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        >
                          <option value="DOCTOR">Doctor (Consultant / Surgeon)</option>
                          <option value="RECEPTIONIST">Receptionist (Front-Desk / Triage)</option>
                          <option value="PHARMACIST">Pharmacist (Clinical Dispensary)</option>
                          <option value="PATIENT">Patient (Outpatient Member)</option>
                          <option value="ADMIN">Administrator (IT & Compliance)</option>
                        </select>
                      </div>
                    </div>

                    {/* Dedicated Username (Login ID) with Live Validation */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA]">
                          Username (Login ID) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Used to sign in across all portals
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono font-bold text-xs">
                          @
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="e.g. dr_tariq or nouman_desk"
                          value={newUser.username}
                          onChange={e => {
                            setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s+/g, '_') });
                            setUsernameTouched(true);
                            if (passwordError) setPasswordError(null);
                          }}
                          style={{ paddingLeft: '2rem' }}
                          className={`clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:text-white ${
                            usernameTouched && newUser.username
                              ? getUsernameValidationStatus().valid
                                ? 'border-emerald-500 focus:ring-emerald-500'
                                : 'border-rose-500 focus:ring-rose-500'
                              : 'dark:border-[#38482E]'
                          }`}
                        />
                      </div>

                      {/* Live Username Feedback */}
                      {usernameTouched && newUser.username && (
                        <div
                          className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1.5 ${
                            getUsernameValidationStatus().valid
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {getUsernameValidationStatus().valid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{getUsernameValidationStatus().message}</span>
                        </div>
                      )}
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Password (Min 6 chars) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            placeholder="Enter password"
                            value={newUser.password}
                            onChange={e => {
                              setNewUser({ ...newUser, password: e.target.value });
                              if (passwordError) setPasswordError(null);
                            }}
                            style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
                            className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={e => {
                              setConfirmPassword(e.target.value);
                              if (passwordError) setPasswordError(null);
                            }}
                            style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
                            className={`clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:text-white ${
                              confirmPassword && newUser.password
                                ? confirmPassword === newUser.password
                                  ? 'border-emerald-500 focus:ring-emerald-500'
                                  : 'border-rose-500 focus:ring-rose-500'
                                : 'dark:border-[#38482E]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {newUser.password && confirmPassword && (
                      <div className="text-[11px] font-semibold flex items-center gap-1.5">
                        {newUser.password === confirmPassword ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passwords match</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Passwords do not match</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Personal & Identity */}
                {createModalTab === 'PERSONAL' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Gender
                        </label>
                        <select
                          value={newUser.gender}
                          onChange={e => setNewUser({ ...newUser, gender: e.target.value })}
                          className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Blood Group
                        </label>
                        <select
                          value={newUser.bloodGroup}
                          onChange={e => setNewUser({ ...newUser, bloodGroup: e.target.value })}
                          className="clinical-input w-full text-xs font-bold dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        >
                          <option value="O+">O Positive (O+)</option>
                          <option value="A+">A Positive (A+)</option>
                          <option value="B+">B Positive (B+)</option>
                          <option value="AB+">AB Positive (AB+)</option>
                          <option value="O-">O Negative (O-)</option>
                          <option value="A-">A Negative (A-)</option>
                          <option value="B-">B Negative (B-)</option>
                          <option value="AB-">AB Negative (AB-)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={newUser.dateOfBirth}
                          onChange={e => setNewUser({ ...newUser, dateOfBirth: e.target.value })}
                          className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          CNIC / National Identity Card
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 35201-1234567-1"
                          value={newUser.cnic}
                          onChange={e => setNewUser({ ...newUser, cnic: e.target.value })}
                          className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Emergency Contact Person
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Spouse, parent or guardian"
                          value={newUser.emergencyContact}
                          onChange={e => setNewUser({ ...newUser, emergencyContact: e.target.value })}
                          className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Emergency Contact Phone
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. +92 300 9988776"
                          value={newUser.emergencyPhone}
                          onChange={e => setNewUser({ ...newUser, emergencyPhone: e.target.value })}
                          className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Contact & Professional Placement */}
                {createModalTab === 'PROFESSIONAL' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Phone Number (Mobile / WhatsApp) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="+92 300 1234567"
                            value={newUser.phone}
                            onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                            style={{ paddingLeft: '2.25rem' }}
                            className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                          Email Address (Optional)
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="email"
                            placeholder="staff@hospital.com"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            style={{ paddingLeft: '2.25rem' }}
                            className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                        Residential Address & City
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. House 14, Street 7, Sector F-8, Islamabad"
                          value={newUser.address}
                          onChange={e => setNewUser({ ...newUser, address: e.target.value })}
                          style={{ paddingLeft: '2.25rem' }}
                          className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Dynamic Role-Adaptive Field Card */}
                    <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-[#162315] space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <Award className="w-4 h-4" />
                        <span>Professional Placement Details ({newUser.role})</span>
                      </div>

                      {/* Doctor Specific Fields */}
                      {newUser.role === 'DOCTOR' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                                Medical Specialization
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Dermatology & Aesthetic Medicine"
                                value={newUser.specialization}
                                onChange={e => setNewUser({ ...newUser, specialization: e.target.value })}
                                className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                                PMDC / Medical License No.
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. PMDC-89214-C"
                                value={newUser.licenseNumber}
                                onChange={e => setNewUser({ ...newUser, licenseNumber: e.target.value })}
                                className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                                Qualifications / Degrees
                              </label>
                              <input
                                type="text"
                                placeholder="MBBS, FCPS"
                                value={newUser.qualifications}
                                onChange={e => setNewUser({ ...newUser, qualifications: e.target.value })}
                                className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                                Experience (Years)
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={newUser.experienceYears}
                                onChange={e => setNewUser({ ...newUser, experienceYears: Number(e.target.value) })}
                                className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                                Consultation Fee (PKR)
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={newUser.consultationFee}
                                onChange={e => setNewUser({ ...newUser, consultationFee: Number(e.target.value) })}
                                className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Receptionist Specific Fields */}
                      {newUser.role === 'RECEPTIONIST' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                              Assigned Front Desk / Station
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. OPD Lobby Counter 1"
                              value={newUser.deskNumber}
                              onChange={e => setNewUser({ ...newUser, deskNumber: e.target.value })}
                              className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                              Duty Shift
                            </label>
                            <select
                              value={newUser.shift}
                              onChange={e => setNewUser({ ...newUser, shift: e.target.value })}
                              className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                            >
                              <option value="Morning Shift (08:00 - 16:00)">Morning Shift (08:00 - 16:00)</option>
                              <option value="Evening Shift (16:00 - 00:00)">Evening Shift (16:00 - 00:00)</option>
                              <option value="Night Shift (00:00 - 08:00)">Night Shift (00:00 - 08:00)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Pharmacist Specific Fields */}
                      {newUser.role === 'PHARMACIST' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                              Pharmacy License Number (RPh)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. RPh-PK-98124"
                              value={newUser.licenseNumber}
                              onChange={e => setNewUser({ ...newUser, licenseNumber: e.target.value })}
                              className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                              Assigned Dispensary Section
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Central OPD Pharmacy"
                              value={newUser.department}
                              onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                              className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Patient Specific Fields */}
                      {newUser.role === 'PATIENT' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                              Known Drug Allergies
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Penicillin, NSAIDs, Sulfa, or None"
                              value={newUser.allergies}
                              onChange={e => setNewUser({ ...newUser, allergies: e.target.value })}
                              className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Admin Specific Fields */}
                      {newUser.role === 'ADMIN' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                              Administrative Department
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Hospital IT & Operations"
                              value={newUser.department}
                              onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                              className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                              Designation / Title
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Systems & Compliance Officer"
                              value={newUser.specialization}
                              onChange={e => setNewUser({ ...newUser, specialization: e.target.value })}
                              className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-[#2F3E29] flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#151D11]">
                <div className="flex items-center gap-1.5">
                  {createModalTab !== 'CREDENTIALS' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (createModalTab === 'PROFESSIONAL') setCreateModalTab('PERSONAL');
                        else if (createModalTab === 'PERSONAL') setCreateModalTab('CREDENTIALS');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] bg-white dark:bg-[#202C1B] border border-slate-200 dark:border-[#38482E] rounded-xl hover:bg-slate-100 dark:hover:bg-[#2A3924] transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                  )}
                  {createModalTab !== 'PROFESSIONAL' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (createModalTab === 'CREDENTIALS') setCreateModalTab('PERSONAL');
                        else if (createModalTab === 'PERSONAL') setCreateModalTab('PROFESSIONAL');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] bg-white dark:bg-[#202C1B] border border-slate-200 dark:border-[#38482E] rounded-xl hover:bg-slate-100 dark:hover:bg-[#2A3924] transition-colors cursor-pointer"
                    >
                      Next Step →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setPasswordError(null);
                    }}
                    className="clinical-button-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="clinical-button-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Grant Access & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Full Personnel Profile Dossier */}
      {profileTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Dossier Header Banner */}
            <div className="p-5 border-b border-slate-200 dark:border-[#2F3E29] bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 dark:from-[#151D11] dark:via-[#192716] dark:to-[#151D11] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  {profileTargetUser.role === 'DOCTOR' && <Stethoscope className="w-6 h-6" />}
                  {profileTargetUser.role === 'RECEPTIONIST' && <ClipboardList className="w-6 h-6" />}
                  {profileTargetUser.role === 'PHARMACIST' && <Pill className="w-6 h-6" />}
                  {profileTargetUser.role === 'ADMIN' && <ShieldCheck className="w-6 h-6" />}
                  {profileTargetUser.role === 'PATIENT' && <User className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {profileTargetUser.name}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {profileTargetUser.role}
                    </span>
                    {profileTargetUser.isBlocked ? (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                        <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Active & Permitted
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-[#74C69D] bg-emerald-50 dark:bg-[#203622] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      @{profileTargetUser.username || profileTargetUser.phone}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {profileTargetUser.id}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileTargetUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202C1B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Content Grid */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar text-xs">
              {/* Contact & Demographics Card */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E12] border border-slate-200 dark:border-[#2F3E29]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone / WhatsApp</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-white">{profileTargetUser.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Official Email</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{profileTargetUser.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">CNIC / National ID</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-white">{profileTargetUser.cnic || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Blood Group</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{profileTargetUser.bloodGroup || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Gender</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{profileTargetUser.gender || 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Date of Birth</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{profileTargetUser.dateOfBirth || 'N/A'}</span>
                </div>
              </div>

              {/* Department & Placement Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E12] border border-slate-200 dark:border-[#2F3E29] space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Hospital Department & Placement</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-500 dark:text-[#A4AC86]">Department / Unit:</span>
                    <p className="font-bold text-slate-800 dark:text-white">{profileTargetUser.department || profileTargetUser.profile?.specialization || 'Clinical General'}</p>
                  </div>
                  {profileTargetUser.licenseNumber && (
                    <div>
                      <span className="text-slate-500 dark:text-[#A4AC86]">License / Registration:</span>
                      <p className="font-mono font-bold text-emerald-700 dark:text-[#74C69D]">{profileTargetUser.licenseNumber}</p>
                    </div>
                  )}
                  {profileTargetUser.qualifications && profileTargetUser.qualifications.length > 0 && (
                    <div>
                      <span className="text-slate-500 dark:text-[#A4AC86]">Qualifications:</span>
                      <p className="font-semibold text-slate-800 dark:text-white">{profileTargetUser.qualifications.join(', ')}</p>
                    </div>
                  )}
                  {profileTargetUser.consultationFee && (
                    <div>
                      <span className="text-slate-500 dark:text-[#A4AC86]">Consultation Fee:</span>
                      <p className="font-mono font-bold text-slate-800 dark:text-white">PKR {profileTargetUser.consultationFee}</p>
                    </div>
                  )}
                  {profileTargetUser.deskNumber && (
                    <div>
                      <span className="text-slate-500 dark:text-[#A4AC86]">Assigned Station:</span>
                      <p className="font-semibold text-slate-800 dark:text-white">{profileTargetUser.deskNumber}</p>
                    </div>
                  )}
                  {profileTargetUser.shift && (
                    <div>
                      <span className="text-slate-500 dark:text-[#A4AC86]">Duty Shift:</span>
                      <p className="font-semibold text-slate-800 dark:text-white">{profileTargetUser.shift}</p>
                    </div>
                  )}
                  {profileTargetUser.allergies && (
                    <div className="col-span-2">
                      <span className="text-slate-500 dark:text-[#A4AC86]">Documented Allergies:</span>
                      <p className="font-bold text-rose-600 dark:text-rose-400">{profileTargetUser.allergies}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Residential & Emergency Contact */}
              {(profileTargetUser.address || profileTargetUser.emergencyContact || profileTargetUser.emergencyPhone) && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E12] border border-slate-200 dark:border-[#2F3E29] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Emergency & Location Info</span>
                  {profileTargetUser.address && (
                    <p className="text-slate-700 dark:text-[#C2C5AA]">
                      <strong className="text-slate-900 dark:text-white">Address:</strong> {profileTargetUser.address}
                    </p>
                  )}
                  {(profileTargetUser.emergencyContact || profileTargetUser.emergencyPhone) && (
                    <p className="text-slate-700 dark:text-[#C2C5AA]">
                      <strong className="text-slate-900 dark:text-white">Emergency Contact:</strong> {profileTargetUser.emergencyContact || ''} {profileTargetUser.emergencyPhone ? `(${profileTargetUser.emergencyPhone})` : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Module Scope */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">Active Module Permissions:</span>
                <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-400">
                  {profileTargetUser.allowedModules && profileTargetUser.allowedModules.length > 0
                    ? `${profileTargetUser.allowedModules.length} Modules Granted`
                    : profileTargetUser.role === 'ADMIN'
                    ? 'All 18 Modules (Full Root)'
                    : 'Role Default Suite'}
                </span>
              </div>
            </div>

            {/* Dossier Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#2F3E29] flex items-center justify-between bg-slate-50/70 dark:bg-[#151D11] shrink-0">
              <div className="flex items-center gap-2">
                {profileTargetUser.phone !== '+15550000001' && (
                  profileTargetUser.isBlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleBlock(profileTargetUser, false);
                        setProfileTargetUser(prev => prev ? { ...prev, isBlocked: false } : null);
                      }}
                      disabled={actionLoading}
                      className="clinical-button-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Restore Access</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBlockingTargetUser(profileTargetUser)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-white dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Block Access</span>
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleOpenPermissions(profileTargetUser);
                    setProfileTargetUser(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-[#202C1B] hover:bg-slate-200 dark:hover:bg-[#283822] text-slate-700 dark:text-[#C2C5AA] border border-slate-200 dark:border-[#38482E] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Configure Permissions</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setProfileTargetUser(null)}
                className="clinical-button-secondary text-xs px-4 py-2"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Granular Module Permissions */}
      {permissionTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-[#2F3E29] flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-[#161E12]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Granular Module Permissions
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-200 dark:bg-[#202C1B] text-slate-700 dark:text-[#A4AC86]">
                      {permissionTargetUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#A4AC86] mt-0.5">
                    Assign any single module or multi-role combination to <span className="font-semibold text-slate-800 dark:text-white">{permissionTargetUser.name}</span> ({permissionTargetUser.phone})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPermissionTargetUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202C1B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Module Counter Toolbar */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-[#2F3E29] flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 dark:bg-[#131A10]">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-[#A4AC86]">Active Scope:</span>
                <span className="font-bold font-mono px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  {selectedModules.length} of {ALL_MODULE_IDS.length} Modules Granted
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllModules}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#202C1B] border border-slate-200 dark:border-[#38482E] text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#2A3924] transition-colors cursor-pointer"
                >
                  Grant All ({ALL_MODULE_IDS.length})
                </button>
                <button
                  type="button"
                  onClick={handleResetToRoleDefaults}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#202C1B] border border-slate-200 dark:border-[#38482E] text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#2A3924] transition-colors cursor-pointer"
                >
                  Reset to Role Defaults
                </button>
                <button
                  type="button"
                  onClick={handleClearAllModules}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#202C1B] border border-slate-200 dark:border-[#38482E] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Scrollable Module Selector Grid */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
              {permissionsSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{permissionsSuccessMsg}</span>
                </div>
              )}

              {permissionGroups.map(group => {
                const groupSelectedCount = group.modules.filter(m => selectedModules.includes(m.id)).length;
                const isAllGroupSelected = groupSelectedCount === group.modules.length;

                return (
                  <div key={group.category} className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-[#2F3E29]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#1B4332] dark:text-[#74C69D]">
                          {group.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({groupSelectedCount}/{group.modules.length} active)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isAllGroupSelected) {
                            setSelectedModules(prev => prev.filter(id => !group.modules.some(m => m.id === id)));
                          } else {
                            const groupIds = group.modules.map(m => m.id);
                            setSelectedModules(prev => Array.from(new Set([...prev, ...groupIds])));
                          }
                        }}
                        className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        {isAllGroupSelected ? 'Deselect Category' : 'Select All in Category'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.modules.map(module => {
                        const isChecked = selectedModules.includes(module.id);
                        return (
                          <div
                            key={module.id}
                            onClick={() => handleToggleModule(module.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                              isChecked
                                ? 'bg-[#E8F3EB] dark:bg-[#203622] border-[#2D6A4F] dark:border-[#406343] shadow-xs ring-1 ring-[#2D6A4F]/20'
                                : 'bg-white dark:bg-[#192215] border-slate-200 dark:border-[#2F3E29] hover:border-slate-300 dark:hover:border-[#38482E]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent onClick
                              className="mt-0.5 rounded border-slate-300 text-[#2D6A4F] focus:ring-[#2D6A4F] cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                <span>{module.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 dark:text-[#A4AC86]">
                                  {module.id}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-[#A4AC86] mt-0.5 leading-snug">
                                {module.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#2F3E29] flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/60 dark:bg-[#161E12]">
              <button
                type="button"
                onClick={() => setPermissionTargetUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] hover:bg-slate-100 dark:hover:bg-[#202C1B] border border-slate-200 dark:border-[#38482E] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPermissions}
                onClick={handleSavePermissions}
                className="clinical-button-primary px-5 py-2 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {savingPermissions ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying Permissions...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Apply & Save Permissions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminUserAccessView;
