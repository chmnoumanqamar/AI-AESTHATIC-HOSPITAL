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

      const displayName = profile?.name || profile?.fullName || (u.role === 'ADMIN' ? 'Root Administrator' : 'Staff Member');

      return {
        id: u.id,
        phone: u.phone,
        email: u.email || 'N/A',
        role: u.role,
        isBlocked: Boolean(u.isBlocked),
        blockedReason: u.blockedReason || null,
        blockedAt: u.blockedAt || null,
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
      const q = filters.search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
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

  async updateUserRole(userId: string, newRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT', adminActorId: string = 'admin') {
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

  async createUser(input: CreateUserInput, adminActorId: string = 'admin') {
    const existing = db.users.find(
      u => u.phone === input.phone || (input.email && u.email?.toLowerCase() === input.email.toLowerCase())
    );
    if (existing) {
      throw AppError.conflict('A user with this phone or email already exists in the registry.');
    }

    const salt = bcrypt.genSaltSync(8);
    const passwordHash = bcrypt.hashSync(input.password, salt);

    const newUser: DbUser = {
      id: `u-${uuidv4().substring(0, 8)}`,
      phone: input.phone,
      email: input.email,
      passwordHash,
      role: input.role,
      isBlocked: false,
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
        specialization: input.specialization || 'General Practice',
        biography: 'Certified medical practitioner granted access by administrator.',
        qualifications: ['MBBS', 'FCPS'],
        experienceYears: 5,
        languages: ['English', 'Urdu'],
        consultationFee: 100,
        followUpFee: 70,
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
        dateOfBirth: '1995-01-01',
        address: 'Registered by Hospital Administration',
        emergencyContact: input.phone,
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
        phone: newUser.phone,
        role: newUser.role,
        name: input.name
      },
      metadata: { role: input.role }
    });

    return {
      id: newUser.id,
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

