import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, DbUser, DbPatient } from '../../common/data/mock-db';
import { ENV } from '../../config/env.config';
import { AppError } from '../../common/errors/AppError';
import { LoginInput, RegisterPatientInput } from './auth.dto';
import { JwtAuthPayload } from '../../common/middleware/auth.middleware';

export class AuthService {
  async login(input: LoginInput) {
    const identifier = input.identifier.trim().toLowerCase();
    const user = db.users.find(
      u =>
        u.phone.toLowerCase() === identifier ||
        (u.email && u.email.toLowerCase() === identifier) ||
        (u.email && u.email.split('@')[0].toLowerCase() === identifier) ||
        u.role.toLowerCase() === identifier
    );

    if (!user) {
      throw AppError.unauthorized('Invalid phone/email or password');
    }

    if (user.isBlocked) {
      throw AppError.forbidden(`Access Denied: Your account has been blocked by the Administrator. Reason: ${user.blockedReason || 'Administrative suspension'}`);
    }

    const isValid = bcrypt.compareSync(input.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid phone/email or password');
    }

    let profileId: string | undefined;
    let profileData: any;

    if (user.role === 'PATIENT') {
      const patient = db.patients.find(p => p.userId === user.id);
      profileId = patient?.id;
      profileData = patient;
    } else if (user.role === 'DOCTOR') {
      const doc = db.doctors.find(d => d.userId === user.id);
      profileId = doc?.id;
      profileData = doc;
    } else if (user.role === 'RECEPTIONIST') {
      const recep = db.receptionists.find(r => r.userId === user.id);
      profileId = recep?.id;
      profileData = recep;
    }

    const tokenPayload: JwtAuthPayload = {
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
      profileId
    };

    const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, {
      expiresIn: '7d'
    });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profileId,
        profile: profileData
      }
    };
  }

  async registerPatient(input: RegisterPatientInput) {
    // Check duplicate user phone or email
    const existingUser = db.users.find(
      u => u.phone === input.phone || (input.email && u.email?.toLowerCase() === input.email.toLowerCase())
    );
    if (existingUser) {
      throw AppError.conflict('An account with this phone number or email already exists.');
    }

    // Check duplicate patient CNIC
    const existingPatientCnic = db.patients.find(p => p.cnic === input.cnic);
    if (existingPatientCnic) {
      throw AppError.conflict(`Duplicate Patient Record detected for CNIC: ${input.cnic}`);
    }

    const salt = bcrypt.genSaltSync(8);
    const passwordHash = bcrypt.hashSync(input.password, salt);

    const newUser: DbUser = {
      id: uuidv4(),
      phone: input.phone,
      email: input.email,
      passwordHash,
      role: 'PATIENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newPatient: DbPatient = {
      id: uuidv4(),
      userId: newUser.id,
      fullName: input.fullName,
      cnic: input.cnic,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      address: input.address,
      emergencyContact: input.emergencyContact,
      hasWhatsApp: input.hasWhatsApp,
      primaryNotificationChannel: input.primaryNotificationChannel,
      backupNotificationChannel: input.backupNotificationChannel,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    db.patients.push(newPatient);

    const tokenPayload: JwtAuthPayload = {
      userId: newUser.id,
      role: 'PATIENT',
      phone: newUser.phone,
      email: newUser.email,
      profileId: newPatient.id
    };

    const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        profileId: newPatient.id,
        profile: newPatient
      }
    };
  }

  private resetOtpStore = new Map<string, { otp: string; expiresAt: number }>();

  async requestPasswordResetOtp(input: { identifier: string }) {
    const identifier = input.identifier.trim().toLowerCase();
    const user = db.users.find(
      u =>
        u.phone.toLowerCase() === identifier ||
        (u.email && u.email.toLowerCase() === identifier) ||
        (u.email && u.email.split('@')[0].toLowerCase() === identifier) ||
        u.role.toLowerCase() === identifier
    );

    if (!user) {
      throw AppError.notFound('No registered account found with this username or email.');
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Valid for 10 minutes
    this.resetOtpStore.set(user.id, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Mask contact for privacy
    let maskedContact = 'registered contact';
    if (user.email) {
      const [local, domain] = user.email.split('@');
      maskedContact = `${local.slice(0, 2)}***@${domain}`;
    } else if (user.phone) {
      maskedContact = `${user.phone.slice(0, 5)}****${user.phone.slice(-3)}`;
    }

    return {
      message: `Verification code dispatched to ${maskedContact}`,
      maskedContact,
      devOtp: otp
    };
  }

  async resetPassword(input: { identifier: string; otp: string; newPassword: string }) {
    const identifier = input.identifier.trim().toLowerCase();
    const user = db.users.find(
      u =>
        u.phone.toLowerCase() === identifier ||
        (u.email && u.email.toLowerCase() === identifier) ||
        (u.email && u.email.split('@')[0].toLowerCase() === identifier) ||
        u.role.toLowerCase() === identifier
    );

    if (!user) {
      throw AppError.notFound('No account found with this username or email.');
    }

    const stored = this.resetOtpStore.get(user.id);
    if (!stored || stored.expiresAt < Date.now()) {
      throw AppError.badRequest('Verification code has expired or was not requested. Please request a new code.');
    }

    if (stored.otp !== input.otp.trim()) {
      throw AppError.badRequest('Invalid 6-digit verification code. Please check and try again.');
    }

    // Burn OTP immediately after single successful use
    this.resetOtpStore.delete(user.id);

    const salt = bcrypt.genSaltSync(8);
    user.passwordHash = bcrypt.hashSync(input.newPassword, salt);
    user.updatedAt = new Date().toISOString();

    return {
      message: 'Identity verified. Password has been successfully updated.'
    };
  }
}

export const authService = new AuthService();
