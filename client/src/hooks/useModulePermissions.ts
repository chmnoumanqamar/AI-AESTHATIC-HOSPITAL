import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface ModulePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  isBlocked: boolean;
}

/**
 * Universal hook for querying granular Read / Write / Delete permissions for any module
 * Reactively updates when permissions are modified in Admin Module & Page Studio
 */
export function useModulePermissions(moduleId: string, targetRole: string = 'RECEPTIONIST'): ModulePermissions {
  const resolvePermissions = (): ModulePermissions => {
    const role = (targetRole || 'RECEPTIONIST').toUpperCase();

    // Invariant: If specifically querying ADMIN role modules, admin has supreme universal access
    if (role === 'ADMIN') {
      return { canRead: true, canWrite: true, canDelete: true, isBlocked: false };
    }

    // 1. Dynamic client RBAC cache (synchronized live with Admin Module & Page Studio)
    try {
      const cached = localStorage.getItem('hospital_role_permissions_cache');
      if (cached) {
        const roles = JSON.parse(cached);
        if (Array.isArray(roles)) {
          const roleDef = roles.find((r: any) => r.role === role);
          if (roleDef && Array.isArray(roleDef.permissions)) {
            const rule = roleDef.permissions.find((p: any) => p.moduleId === moduleId);
            if (rule) {
              return {
                canRead: rule.read === true,
                canWrite: rule.write === true,
                canDelete: rule.delete === true,
                isBlocked: rule.read === false
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading module permissions from cache:', e);
    }

    // 2. Role-based fallback defaults if cache is not yet loaded
    if (role === 'RECEPTIONIST') {
      if (moduleId === 'recep_desk') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'recep_approvals') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'recep_pos') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'recep_reports') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
    }

    if (role === 'DOCTOR') {
      if (moduleId === 'doctor_queue') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'doctor_consultation') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'doctor_tokens') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'patient_history') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
    }

    if (role === 'PHARMACIST') {
      if (moduleId === 'pharma_queue') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'pharma_inventory') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'pharma_pos') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'pharma_safety') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      if (moduleId === 'pharma_procurement') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
    }

    if (role === 'PATIENT') {
      if (moduleId === 'patient_booking') return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
      return { canRead: true, canWrite: false, canDelete: false, isBlocked: false };
    }

    return {
      canRead: true,
      canWrite: false,
      canDelete: false,
      isBlocked: false
    };
  };

  const [permissions, setPermissions] = useState<ModulePermissions>(resolvePermissions);

  useEffect(() => {
    setPermissions(resolvePermissions());

    // Fetch live ground truth permissions from backend to synchronize cache
    api.get('/admin/role-permissions')
      .then(res => {
        if (res.data?.data?.roles && Array.isArray(res.data.data.roles)) {
          localStorage.setItem('hospital_role_permissions_cache', JSON.stringify(res.data.data.roles));
          setPermissions(resolvePermissions());
        }
      })
      .catch(() => {});

    const handleUpdate = () => {
      setPermissions(resolvePermissions());
    };

    window.addEventListener('hospital:permissions-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('hospital:permissions-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [moduleId, targetRole]);

  return permissions;
}
