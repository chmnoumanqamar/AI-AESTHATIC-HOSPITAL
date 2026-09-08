import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, DbUser, DbDoctor, DbReceptionist, DbPatient } from '../../common/data/mock-db';
import { AppError } from '../../common/errors/AppError';
import { recordAuditLog, purgeAuditLogs, resetDefaultAuditLogs, auditLogStore } from '../../common/middleware/audit.middleware';
import { CreateUserInput } from './admin.dto';

export class AdminService {
  async getAllUsers(filters?: { role?: string; search?: string; status?: string }) {
    let users = db.users.map(u => {
      let profile: any = null;
      if (u.role === 'DOCTOR') {
        profile = db.doctors.find(d => d.userId === u.id);
      } else if (u.role === 'RECEPTIONIST') {
        profile = db.receptionists.find(r => r.userId === u.id);
      } else if (u.role === 'PATIENT') {
        profile = db.patients.find(p => p.userId === u.id);
      }

      const displayName = profile?.name || profile?.fullName || u.name || (u.role === 'ADMIN' ? 'Root Administrator' : 'Staff Member');

      return {
        id: u.id,
        username: u.username || u.phone,
        phone: u.phone,
        email: u.email || 'N/A',
        role: u.role,
        gender: u.gender || profile?.gender || null,
        dateOfBirth: u.dateOfBirth || profile?.dateOfBirth || null,
        cnic: u.cnic || profile?.cnic || null,
        bloodGroup: u.bloodGroup || null,
        address: u.address || profile?.address || null,
        emergencyContact: u.emergencyContact || profile?.emergencyContact || null,
        emergencyPhone: u.emergencyPhone || null,
        department: u.department || (u.role === 'DOCTOR' ? profile?.specialization : u.role === 'PHARMACIST' ? 'Central Pharmacy' : u.role === 'RECEPTIONIST' ? 'Front Desk' : u.role === 'ADMIN' ? 'Administration' : 'Outpatient'),
        licenseNumber: u.licenseNumber || null,
        qualifications: u.qualifications || profile?.qualifications || [],
        experienceYears: u.experienceYears || profile?.experienceYears || null,
        consultationFee: u.consultationFee || profile?.consultationFee || null,
        deskNumber: u.deskNumber || null,
        shift: u.shift || null,
        allergies: u.allergies || null,
        isBlocked: Boolean(u.isBlocked),
        blockedReason: u.blockedReason || null,
        blockedAt: u.blockedAt || null,
        allowedModules: u.allowedModules || [],
        createdAt: u.createdAt,
        name: displayName,
        profile
      };
    });

    if (filters?.role && filters.role !== 'ALL') {
      users = users.filter(u => u.role === filters.role);
    }

    if (filters?.status === 'ACTIVE') {
      users = users.filter(u => !u.isBlocked);
    } else if (filters?.status === 'BLOCKED') {
      users = users.filter(u => u.isBlocked);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().replace(/^@/, '');
      users = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.phone.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.cnic && u.cnic.toLowerCase().includes(q))
      );
    }

    return users;
  }

  async updateUserAccess(userId: string, isBlocked: boolean, reason?: string, adminActorId: string = 'admin') {
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Safety Invariant: Protect primary admin from lockout
    if (user.role === 'ADMIN' && isBlocked && user.phone === '+15550000001') {
      throw AppError.badRequest('Security Invariant: Primary System Administrator cannot be blocked.');
    }

    const previousState = {
      isBlocked: Boolean(user.isBlocked),
      blockedReason: user.blockedReason
    };

    user.isBlocked = isBlocked;
    user.blockedReason = isBlocked ? (reason || 'Administrative restriction applied') : undefined;
    user.blockedAt = isBlocked ? new Date().toISOString() : undefined;
    user.updatedAt = new Date().toISOString();

    // Record Immutable Audit Log
    recordAuditLog({
      actorId: adminActorId,
      actorType: 'ADMIN',
      action: isBlocked ? 'BLOCK_USER_ACCESS' : 'RESTORE_USER_ACCESS',
      resourceType: 'UserAccess',
      resourceId: user.id,
      previousState,
      newState: {
        isBlocked,
        blockedReason: user.blockedReason,
        blockedAt: user.blockedAt
      },
      metadata: {
        targetRole: user.role,
        targetPhone: user.phone,
        reason: reason || (isBlocked ? 'Blocked by Administrator' : 'Access restored by Administrator')
      }
    });

    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      isBlocked: user.isBlocked,
      blockedReason: user.blockedReason,
      blockedAt: user.blockedAt
    };
  }

  async updateUserRole(userId: string, newRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST', adminActorId: string = 'admin') {
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const previousRole = user.role;
    user.role = newRole;
    user.updatedAt = new Date().toISOString();

    recordAuditLog({
      actorId: adminActorId,
      actorType: 'ADMIN',
      action: 'CHANGE_USER_ROLE',
      resourceType: 'UserAccess',
      resourceId: user.id,
      previousState: { role: previousRole },
      newState: { role: newRole },
      metadata: { targetPhone: user.phone }
    });

    return user;
  }

  async updateUserPermissions(userId: string, allowedModules: string[], adminActorId: string = 'admin') {
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const previousModules = user.allowedModules || [];
    user.allowedModules = Array.isArray(allowedModules) ? allowedModules : [];
    user.updatedAt = new Date().toISOString();

    recordAuditLog({
      actorId: adminActorId,
      actorType: 'ADMIN',
      action: 'UPDATE_USER_PERMISSIONS',
      resourceType: 'UserAccess',
      resourceId: user.id,
      previousState: { allowedModules: previousModules },
      newState: { allowedModules: user.allowedModules },
      metadata: { 
        targetPhone: user.phone,
        targetName: user.name,
        targetRole: user.role,
        modulesCount: user.allowedModules.length
      }
    });

    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      allowedModules: user.allowedModules
    };
  }

  async getModuleHierarchy() {
    return db.getModuleHierarchy();
  }

  async movePageModule(pageId: string, targetCategory: 'ADMIN' | 'CLINICAL' | 'RECEPTION' | 'PATIENT' | 'PHARMACY', adminActorId: string = 'admin') {
    const validCategories = ['ADMIN', 'CLINICAL', 'RECEPTION', 'PATIENT', 'PHARMACY'];
    if (!validCategories.includes(targetCategory)) {
      throw AppError.badRequest(`Invalid target department: ${targetCategory}`);
    }

    const previousPage = db.getModuleHierarchy().find(m => m.id === pageId);
    if (!previousPage) {
      throw AppError.notFound(`Page with ID ${pageId} does not exist`);
    }

    const previousCategory = previousPage.category;
    const updatedPage = db.movePageModule(pageId, targetCategory);

    recordAuditLog({
      actorId: adminActorId,
      actorType: 'ADMIN',
      action: 'MOVE_PAGE_MODULE',
      resourceType: 'ModuleHierarchy',
      resourceId: pageId,
      previousState: { category: previousCategory },
      newState: { category: targetCategory },
      metadata: {
        pageId,
        pageTitle: updatedPage.label,
        sourceDepartment: previousCategory,
        targetDepartment: targetCategory
      }
    });

    return {
      movedPage: updatedPage,
      hierarchy: db.getModuleHierarchy()
    };
  }

  async resetModuleHierarchy(adminActorId: string = 'admin') {
    const hierarchy = db.resetModuleHierarchy();
    recordAuditLog({
      actorId: adminActorId,
      actorType: 'ADMIN',
      action: 'RESET_MODULE_HIERARCHY',
      resourceType: 'ModuleHierarchy',
      resourceId: 'ALL',
      metadata: { restoredCount: hierarchy.length }
    });
    return hierarchy;
  }

  async createUser(input: CreateUserInput, adminActorId: string = 'admin') {
    // 1. Process & Validate Username (Login ID)
    let finalUsername = input.username?.trim().toLowerCase();
    if (!finalUsername) {
      if (input.email && input.email.includes('@')) {
        finalUsername = input.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      } else {
        finalUsername = input.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }
      if (finalUsername.length < 3) {
        finalUsername = `user_${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(finalUsername)) {
      throw AppError.badRequest('Invalid username format: Username must be 3 to 30 characters with no spaces (only letters, numbers, underscores, and dashes allowed).');
    }

    const usernameTaken = db.users.some(u => u.username && u.username.toLowerCase() === finalUsername);
    if (usernameTaken) {
      throw AppError.conflict(`Username "@${finalUsername}" is already taken. Please choose another username.`);
    }

    // 2. Check Phone / Email duplicate
    const existing = db.users.find(
      u => u.phone === input.phone || (input.email && input.email.trim() && u.email?.toLowerCase() === input.email.toLowerCase())
    );
    if (existing) {
      throw AppError.conflict('A user with this phone number or email already exists in the registry.');
    }

    const salt = bcrypt.genSaltSync(8);
    const passwordHash = bcrypt.hashSync(input.password, salt);

    const qualificationsArray = Array.isArray(input.qualifications)
      ? input.qualifications
      : typeof input.qualifications === 'string'
      ? input.qualifications.split(',').map(q => q.trim()).filter(Boolean)
      : undefined;

    const newUser: DbUser = {
      id: `u-${uuidv4().substring(0, 8)}`,
      username: finalUsername,
      name: input.name,
      phone: input.phone,
      email: input.email && input.email.trim() ? input.email.trim() : undefined,
      passwordHash,
      role: input.role,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      cnic: input.cnic,
      bloodGroup: input.bloodGroup,
      address: input.address,
      emergencyContact: input.emergencyContact,
      emergencyPhone: input.emergencyPhone,
      department: input.department || (input.role === 'DOCTOR' ? input.specialization : undefined),
      licenseNumber: input.licenseNumber,
      qualifications: qualificationsArray,
      experienceYears: input.experienceYears ? Number(input.experienceYears) : undefined,
      consultationFee: input.consultationFee ? Number(input.consultationFee) : undefined,
      deskNumber: input.deskNumber,
      shift: input.shift,
      allergies: input.allergies,
      isBlocked: false,
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(newUser);

    // Create Role-Specific Profile
    if (input.role === 'DOCTOR') {
      const newDoc: DbDoctor = {
        id: `doc-${uuidv4().substring(0, 6)}`,
        userId: newUser.id,
        name: input.name,
        specialization: input.specialization || input.department || 'General Practice',
        biography: `Certified medical practitioner (${newUser.qualifications?.join(', ') || 'MBBS'}).`,
        qualifications: newUser.qualifications || ['MBBS', 'FCPS'],
        experienceYears: newUser.experienceYears || 5,
        languages: ['English', 'Urdu'],
        consultationFee: newUser.consultationFee || 1500,
        followUpFee: (newUser.consultationFee || 1500) * 0.7,
        dailyPatientLimit: 100,
        createdAt: new Date().toISOString()
      };
      db.doctors.push(newDoc);
    } else if (input.role === 'RECEPTIONIST') {
      const newRecep: DbReceptionist = {
        id: `rec-${uuidv4().substring(0, 6)}`,
        userId: newUser.id,
        name: input.name,
        createdAt: new Date().toISOString()
      };
      db.receptionists.push(newRecep);
    } else if (input.role === 'PATIENT') {
      const newPat: DbPatient = {
        id: `pat-${uuidv4().substring(0, 6)}`,
        userId: newUser.id,
        fullName: input.name,
        cnic: input.cnic || `${Date.now()}`.substring(0, 13),
        gender: input.gender || 'Not Specified',
        dateOfBirth: input.dateOfBirth || '1995-01-01',
        address: input.address || 'Registered by Hospital Administration',
        emergencyContact: input.emergencyPhone || input.emergencyContact || input.phone,
        hasWhatsApp: true,
        primaryNotificationChannel: 'SMS',
        createdAt: new Date().toISOString()
      };
      db.patients.push(newPat);
    }

    recordAuditLog({
      actorId: adminActorId,
      actorType: 'ADMIN',
      action: 'CREATE_USER_AND_GRANT_ACCESS',
      resourceType: 'UserAccess',
      resourceId: newUser.id,
      newState: {
        userId: newUser.id,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role,
        name: input.name
      },
      metadata: { role: input.role, username: newUser.username }
    });

    return {
      id: newUser.id,
      username: newUser.username,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      name: input.name
    };
  }

  async getDatabaseStats() {
    const dbStats = db.getDatabaseStats();
    return {
      ...dbStats,
      auditLogs: auditLogStore.length,
      timestamp: new Date().toISOString()
    };
  }

  async purgeDatabase(action: 'CLEAN_SLATE' | 'RESET_DEMO', adminActorId: string = 'u-admin-01') {
    if (action === 'CLEAN_SLATE') {
      const purgeResult = db.purgeRoughData();
      const auditEntry = purgeAuditLogs(adminActorId, purgeResult.purged);
      const currentStats = await this.getDatabaseStats();

      return {
        action: 'CLEAN_SLATE',
        message: 'Rough database records successfully purged. System is ready for live operational deployment.',
        purgeResult,
        currentStats,
        auditLogId: auditEntry.id
      };
    } else if (action === 'RESET_DEMO') {
      db.resetToDefaultDemo();
      resetDefaultAuditLogs(adminActorId);
      const currentStats = await this.getDatabaseStats();

      return {
        action: 'RESET_DEMO',
        message: 'Factory demo dataset and audit trail restored successfully.',
        currentStats
      };
    } else {
      throw AppError.badRequest('Invalid database maintenance action requested.');
    }
  }
}

export const adminService = new AdminService();

