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
  EyeOff
} from 'lucide-react';
import { api } from '../../services/api';

export interface HospitalUser {
  id: string;
  phone: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  name: string;
  isBlocked: boolean;
  blockedReason?: string | null;
  blockedAt?: string | null;
  createdAt: string;
  profile?: any;
}

export const AdminUserAccessView: React.FC = () => {
  const [users, setUsers] = useState<HospitalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [blockingTargetUser, setBlockingTargetUser] = useState<HospitalUser | null>(null);
  const [blockReason, setBlockReason] = useState('Administrative compliance review');
  const [actionLoading, setActionLoading] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    email: '',
    password: 'Password123!',
    role: 'DOCTOR' as 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT',
    specialization: 'Internal Medicine'
  });
  const [confirmPassword, setConfirmPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  const handleChangeRole = async (user: HospitalUser, newRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT') => {
    if (user.role === newRole) return;
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.password !== confirmPassword) {
      setPasswordError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }
    if (newUser.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    setPasswordError(null);
    setActionLoading(true);
    try {
      await api.post('/admin/users', newUser);
      alert(`✅ Account created and access granted to ${newUser.name} as ${newUser.role}!`);
      setIsCreateModalOpen(false);
      setNewUser({
        name: '',
        phone: '',
        email: '',
        password: 'Password123!',
        role: 'DOCTOR',
        specialization: 'Internal Medicine'
      });
      setConfirmPassword('Password123!');
      setPasswordError(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create user account');
    } finally {
      setActionLoading(false);
    }
  };

  const totalUsers = users.length;
  const activeCount = users.filter(u => !u.isBlocked).length;
  const blockedCount = users.filter(u => u.isBlocked).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-sky-600" />
            <span>Master User Access & Permission Vault</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global administrative control: Grant or revoke access permissions across all doctors, receptionists, and patients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 text-slate-600 dark:text-[#C2C5AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#25331E] rounded-lg border border-slate-200 dark:border-[#38482E] transition-colors cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="clinical-button-primary flex items-center gap-2 text-xs font-semibold py-2 px-3.5"
          >
            <UserPlus className="w-4 h-4 text-emerald-300" />
            <span>Grant Access to New User</span>
          </button>
        </div>
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
      <div className="clinical-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
          {['ALL', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'ADMIN'].map(role => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedRoleFilter === role
                  ? 'clinical-button-primary shadow-xs'
                  : 'bg-slate-100 dark:bg-[#1E2718] text-slate-700 dark:text-[#C2C5AA] border border-slate-200 dark:border-[#38482E] hover:bg-slate-200 dark:hover:bg-[#25331E]'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>

        {/* Status & Live Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="clinical-input text-xs py-1.5 font-medium dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="BLOCKED">Blocked Only</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user name, phone..."
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
                <th className="py-3 px-5">Access Status</th>
                <th className="py-3 px-5 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2F3E29] text-sm">
              {users.map((user) => {
                const isRootAdmin = user.role === 'ADMIN' && user.phone === '+15550000001';

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-[#202C1B] transition-colors ${
                      user.isBlocked ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    {/* User Identity */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                          user.isBlocked
                            ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : user.role === 'DOCTOR'
                            ? 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            : user.role === 'RECEPTIONIST'
                            ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : user.role === 'ADMIN'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {user.role === 'DOCTOR' && <Stethoscope className="w-4 h-4" />}
                          {user.role === 'RECEPTIONIST' && <ClipboardList className="w-4 h-4" />}
                          {user.role === 'PATIENT' && <User className="w-4 h-4" />}
                          {user.role === 'ADMIN' && <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{user.name}</span>
                            {isRootAdmin && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-[#202C1B] text-slate-700 dark:text-[#A4AC86] border border-slate-300 dark:border-[#38482E] rounded font-mono font-bold">
                                ROOT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-3.5 px-5">
                      <select
                        disabled={isRootAdmin}
                        value={user.role}
                        onChange={e => handleChangeRole(user, e.target.value as any)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-all ${
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
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5">
                      {user.isBlocked ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>Access Blocked</span>
                          </span>
                          {user.blockedReason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 italic mt-0.5 max-w-xs truncate">
                              "{user.blockedReason}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Active / Permitted</span>
                        </span>
                      )}
                    </td>

                    {/* Action Controls */}
                    <td className="py-3.5 px-5 text-right">
                      {isRootAdmin ? (
                        <span className="text-xs text-slate-400 font-medium italic">Root Protected</span>
                      ) : user.isBlocked ? (
                        <button
                          onClick={() => handleToggleBlock(user, false)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 clinical-button-primary rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Restore Access</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setBlockingTargetUser(user)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Block Access</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-medium">
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
          <div className="w-full max-w-lg bg-white dark:bg-[#1A2215] border border-slate-200 dark:border-[#2F3E29] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2F3E29]">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base">Grant Access to New Hospital User</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">Full Legal Name</label>
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">System Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                  >
                    <option value="DOCTOR">Doctor</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="PATIENT">Patient</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">Phone Number (Login ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="+15550000099"
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    className="clinical-input w-full text-xs font-mono dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="staff@hospital.com"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                  />
                </div>
              </div>

              {newUser.role === 'DOCTOR' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">Medical Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Dermatology & Cosmetic Surgery"
                    value={newUser.specialization}
                    onChange={e => setNewUser({ ...newUser, specialization: e.target.value })}
                    className="clinical-input w-full text-xs dark:bg-[#171F13] dark:border-[#38482E] dark:text-white"
                  />
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                    Password (Min 6 chars)
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
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
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#C2C5AA] block mb-1">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Re-enter password"
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
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Match Badge */}
              {newUser.password && confirmPassword && (
                <div className="text-[11px] font-semibold flex items-center gap-1.5 transition-all">
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2F3E29]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="clinical-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="clinical-button-primary text-xs font-bold uppercase tracking-wider"
                >
                  {actionLoading ? 'Creating Account...' : 'Grant Access & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminUserAccessView;
