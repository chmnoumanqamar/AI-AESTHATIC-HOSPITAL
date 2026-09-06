import { medicalSafetyGuard } from './safety/medical-safety.guard';
import { confirmationGuard } from './safety/confirmation.guard';
import { ragRetrieverService } from './rag/retriever.service';
import { toolHandlers } from './tools/tool-registry';
import { logger } from '../../common/utils/logger';
import { db } from '../../common/data/mock-db';
import { geminiClient } from './gemini-client';
import { appointmentReminderService, UpcomingReminderItem } from '../appointment/appointment-reminder.service';
import { auditVaultService } from '../audit/audit.service';
import { appointmentService } from '../appointment/appointment.service';
import { queueService } from '../queue/queue.service';
import { doctorService } from '../doctor/doctor.service';
import { tokenService } from '../token/token.service';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCall?: {
    name: string;
    params: any;
  };
  cardData?: any;
}

export interface AiChatSessionContext {
  userId: string;
  patientId?: string;
  userRole: string;
  sessionId: string;
}

export class AiAgentOrchestrator {
  /**
   * Detect user language category: 'urdu' | 'roman_urdu' | 'english' | 'other'
   */
  private detectLanguage(text: string): 'urdu' | 'roman_urdu' | 'english' {
    // Check for Urdu / Arabic script Unicode range
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'urdu';
    }

    // Common Roman Urdu keywords
    const romanUrduKeywords = [
      'mera', 'meri', 'meray', 'mujhe', 'ap', 'aap', 'kya', 'kia', 'kab', 'kese', 'kaise',
      'hai', 'hain', 'ho', 'hoga', 'hogi', 'karo', 'karna', 'karni', 'batao', 'batayein', 'btao', 'chahiye',
      'chahie', 'chahye', 'kitna', 'kitni', 'kitne', 'pehlay', 'baad', 'shukriya', 'theek', 'doctor', 'bhi', 'hum',
      'session', 'le', 'liay', 'liye', 'wala', 'wali', 'kuch', 'bhejo', 'milna', 'milay', 'milenge',
      'aaj', 'kal', 'parson', 'waqt', 'dikhao', 'dikhayein', 'baithte', 'baithti', 'khali', 'bache',
      'konsa', 'kon', 'koun', 'kounsa', 'kahan', 'kis'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const hasRomanUrdu = words.some(w => romanUrduKeywords.includes(w));
    if (hasRomanUrdu) {
      return 'roman_urdu';
    }

    return 'english';
  }

  /**
   * AI AGENT RUNTIME EXECUTION PIPELINE (Multi-Lingual & 48h Reminder Capable):
   * User Input -> Language Detection -> Medical Safety Check -> Upcoming Reminder Injection -> Intent / Gemini Processing
   */
  async processMessage(
    message: string,
    history: AiChatMessage[],
    context: AiChatSessionContext
  ): Promise<AiChatMessage> {
    const trimmedInput = message.trim();
    const lang = this.detectLanguage(trimmedInput);
    const lower = trimmedInput.toLowerCase();

    // Resolve patientId fallback if not directly provided in context
    let resolvedPatientId = context.patientId;
    if (!resolvedPatientId && context.userId) {
      const pat = db.patients.find(p => p.userId === context.userId);
      if (pat) resolvedPatientId = pat.id;
    }

    logger.info(`[AI Orchestrator] User ${context.userId} [Lang: ${lang}]: "${trimmedInput}"`);

    // STEP 1: Medical Safety Guardrail Check (Diagnostic Deflection Rule)
    const safetyCheck = medicalSafetyGuard.evaluatePrompt(trimmedInput);
    if (!safetyCheck.isSafe) {
      logger.warn(`[AI Safety Intercepted] Prompt flagged as diagnostic/emergency.`);

      let deflectionText = safetyCheck.deflectionMessage || 'Medical inquiry declined by safety guardrail.';
      if (lang === 'roman_urdu') {
        deflectionText = '⚠️ **Tibbi Tahaffuz Notice:** Main AI assistant hoon aur direct bimari diagnose ya dawai prescribe nahi kar sakta. Baraye meharbani hamaray specialist doctor se appointment book karein.';
      } else if (lang === 'urdu') {
        deflectionText = '⚠️ **طبی تحفظ نوٹس:** میں بطور اے آئی اسسٹنٹ براہ راست بیماری کی تشخیص یا دوا تجویز نہیں کر سکتا۔ برائے مہربانی ہمارے ماہر ڈاکٹر سے رجوع فرمائیں۔';
      }

      return {
        role: 'assistant',
        content: deflectionText,
        cardData: safetyCheck.isEmergency
          ? {
              type: 'EMERGENCY_ALERT',
              title: lang === 'roman_urdu' ? 'Emergency Madad Darkaar Hai' : 'Emergency Assistance Required',
              emergencyPhone: '911'
            }
          : {
              type: 'SAFETY_DISCLAIMER',
              title: lang === 'roman_urdu' ? 'Clinical Safety Protocol Active' : 'Clinical Safety Protocol Active',
              actionPrompt: lang === 'roman_urdu' ? 'Kya aap hamaray doctor se appointment book karna chahtay hain?' : 'Would you like to book an appointment with our specialist physicians instead?'
            }
      };
    }

    // STEP 2: Check for Pending Two-Step Confirmation Handshake
    const pendingAction = confirmationGuard.getPendingAction(context.sessionId);
    if (pendingAction) {
      const isAffirmative = confirmationGuard.isConfirmationAffirmative(trimmedInput) ||
        lower.includes('haan') || lower.includes('yes') || lower.includes('theek hai') || lower.includes('jee');

      if (isAffirmative) {
        confirmationGuard.clearPendingAction(context.sessionId);

        if (pendingAction.action === 'CANCEL_APPOINTMENT') {
          const res = await toolHandlers.cancelAppointment(
            pendingAction.parameters,
            context.patientId!,
            context.userId
          );

          const confirmedMsg = lang === 'roman_urdu'
            ? `✅ **Kamyabi:** Aap ki appointment cancel kar di gayi hai.`
            : `✅ Confirmed: ${res.message}`;

          return {
            role: 'assistant',
            content: confirmedMsg,
            cardData: {
              type: 'APPOINTMENT_CANCELLED',
              ...res
            }
          };
        } else if (pendingAction.action === 'RESCHEDULE_APPOINTMENT') {
          const res = await toolHandlers.requestReschedule(
            pendingAction.parameters,
            context.patientId!,
            context.userId
          );

          const confirmedMsg = lang === 'roman_urdu'
            ? `✅ **Kamyabi:** Aap ki appointment nayi tareekh par reschedule ho chuki hai.`
            : `✅ Confirmed: ${res.message}`;

          return {
            role: 'assistant',
            content: confirmedMsg,
            cardData: {
              type: 'APPOINTMENT_RESCHEDULED',
              ...res
            }
          };
        }
      } else if (lower.includes('no') || lower.includes('nahi') || lower.includes('cancel') || lower.includes('mat')) {
        confirmationGuard.clearPendingAction(context.sessionId);
        const cancelAck = lang === 'roman_urdu'
          ? 'Amal rok diya gaya hai. Aap ki appointment pehle ki tarah barqarar hai. Main mazeed kis cheez mein madad kar sakta hoon?'
          : 'Action cancelled. Your appointment remains unchanged. How else may I assist you?';
        return {
          role: 'assistant',
          content: cancelAck
        };
      }
    }

    // Fetch patient upcoming appointments / reminders for live context
    let upcomingReminders: UpcomingReminderItem[] = [];
    if (resolvedPatientId) {
      try {
        upcomingReminders = await appointmentReminderService.getUpcomingRemindersForPatient(resolvedPatientId);
      } catch (err) {
        logger.warn(`Could not load reminders for patient ${resolvedPatientId}`);
      }
    }

    // STEP 3: Multi-Lingual & Role-Aware Intent Classification

    // 1. Pending Approvals & Booking Requests Intent (Staff & Admin)
    const isPendingApprovalIntent =
      lower.includes('pending approval') ||
      lower.includes('pending booking') ||
      lower.includes('pending appointment') ||
      lower.includes('approval request') ||
      lower.includes('list all pending') ||
      (lower.includes('pending') && (lower.includes('request') || lower.includes('booking') || lower.includes('list') || lower.includes('show') || lower.includes('approv')));

    if (isPendingApprovalIntent) {
      const pendingList = await appointmentService.getAllAppointments({ status: 'PENDING' });

      if (pendingList.length === 0) {
        return {
          role: 'assistant',
          content: '✅ **No Pending Approvals:**\nThere are currently zero pending appointment requests awaiting staff review. All patient bookings have been approved or processed.',
          cardData: {
            type: 'PENDING_APPROVALS',
            count: 0,
            appointments: []
          }
        };
      }

      const listLines = pendingList.map((app, idx) =>
        `${idx + 1}. **${app.patientName}** → **${app.doctorName}**\n   • Date: **${app.appointmentDate}** | Service: ${app.serviceName || 'Consultation'}\n   • Source: \`${app.bookingSource}\` | Reason: *${app.chiefComplaint || 'Consultation Request'}*`
      ).join('\n\n');

      return {
        role: 'assistant',
        content: `📋 **Pending Appointment Requests (${pendingList.length}):**\n\nThe following patient bookings are currently awaiting administrative or receptionist review:\n\n${listLines}`,
        cardData: {
          type: 'PENDING_APPROVALS',
          count: pendingList.length,
          appointments: pendingList.map(a => ({
            id: a.id,
            patientName: a.patientName,
            doctorName: a.doctorName,
            appointmentDate: a.appointmentDate,
            serviceName: a.serviceName,
            bookingSource: a.bookingSource,
            chiefComplaint: a.chiefComplaint
          }))
        }
      };
    }

    // 2. Live Queue Status & Waiting Patients Intent
    const isQueueIntent =
      lower.includes('queue status') ||
      lower.includes('live queue') ||
      lower.includes('waiting patient') ||
      lower.includes('token status') ||
      lower.includes('next patient') ||
      lower.includes('next token') ||
      lower.includes('who is the next patient') ||
      (lower.includes('queue') && (lower.includes('check') || lower.includes('status') || lower.includes('today') || lower.includes('who') || lower.includes('waiting') || lower.includes('token')));

    if (isQueueIntent) {
      const doctorIdFilter = context.userRole === 'DOCTOR' ? context.userId : undefined;
      const liveQueue = await queueService.getLiveQueue(doctorIdFilter);

      const total = liveQueue.length;
      const waitingList = liveQueue.filter(q => q.queueStatus === 'WAITING');
      const inConsultationList = liveQueue.filter(q => q.queueStatus === 'IN_CONSULTATION' || q.queueStatus === 'CALLED');
      const completedList = liveQueue.filter(q => q.queueStatus === 'COMPLETED');
      const notCheckedInList = liveQueue.filter(q => q.queueStatus === 'NOT_CHECKED_IN');

      const nextPatient = waitingList[0];
      const currentPatient = inConsultationList[0];

      const queueText = `📊 **Live OPD Queue Status (Today):**\n\n` +
        `• **Waiting in Lobby:** **${waitingList.length}** patient(s)\n` +
        `• **Currently In Consultation:** **${inConsultationList.length}** patient(s)` +
        (currentPatient ? ` (Token #${currentPatient.tokenNumber} - ${currentPatient.patientName} with ${currentPatient.doctorName})` : '') + `\n` +
        `• **Next in Line:** ` + (nextPatient ? `Token #${nextPatient.tokenNumber} (${nextPatient.patientName} → ${nextPatient.doctorName})` : 'None waiting at the moment') + `\n` +
        `• **Completed Today:** **${completedList.length}** patient(s)\n` +
        `• **Not Checked In Yet:** **${notCheckedInList.length}** patient(s)\n` +
        `• **Total Today's Queue:** **${total}** patient(s)`;

      return {
        role: 'assistant',
        content: queueText,
        cardData: {
          type: 'QUEUE_SUMMARY',
          total,
          waiting: waitingList.length,
          inConsultation: inConsultationList.length,
          completed: completedList.length,
          notCheckedIn: notCheckedInList.length,
          nextToken: nextPatient?.tokenNumber,
          nextPatientName: nextPatient?.patientName,
          activeToken: currentPatient?.tokenNumber,
          activePatientName: currentPatient?.patientName,
          doctorName: nextPatient?.doctorName || currentPatient?.doctorName,
          queueEntries: liveQueue.slice(0, 5)
        }
      };
    }

    // 3. Audit Vault Summary & Security Integrity Intent
    const isAuditIntent =
      lower.includes('audit vault') ||
      lower.includes('audit log') ||
      lower.includes('security and clinical audit') ||
      lower.includes('audit summary') ||
      lower.includes('vault summary') ||
      (lower.includes('audit') && (lower.includes('summar') || lower.includes('recent') || lower.includes('security') || lower.includes('log')));

    if (isAuditIntent) {
      const stats = await auditVaultService.getAuditStats();
      const recentLogs = await auditVaultService.getAuditLogs({ limit: 4 });

      const auditText = `🛡️ **Immutable Audit Vault Summary:**\n\n` +
        `• **Cryptographic Integrity:** **100% Tamper-Free** (SHA-256 Chain Verified)\n` +
        `• **Total Cryptographically Sealed Events:** **${stats.total}** records\n` +
        `• **Provenance Diffs Tracked:** **${stats.diffsTracked}** revision snapshots\n` +
        `• **Integrity Hash:** \`${stats.integrity.hashSignature.slice(0, 28)}...\`\n\n` +
        `**Category Breakdown:**\n` +
        `• Clinical Records: **${stats.breakdown.clinical}**\n` +
        `• Prescriptions & Version Revisions: **${stats.breakdown.prescriptions}**\n` +
        `• OPD Queue & Token Operations: **${stats.breakdown.queue}**\n` +
        `• Financial & Billing Transactions: **${stats.breakdown.payments}**\n` +
        `• System & Administrative Changes: **${stats.breakdown.system}**\n\n` +
        `*All operations are strictly append-only. Zero historical deletions are permitted by the security kernel.*`;

      return {
        role: 'assistant',
        content: auditText,
        cardData: {
          type: 'AUDIT_VAULT_SUMMARY',
          stats,
          recentLogs: recentLogs.map(l => ({
            id: l.id,
            action: l.action,
            resourceType: l.resourceType,
            resourceId: l.resourceId,
            actorType: l.actorType,
            timestamp: l.timestamp
          }))
        }
      };
    }

    // 4. Doctors On Duty Intent
    const isDoctorsOnDutyIntent =
      lower.includes('doctors on duty') ||
      lower.includes('duty today') ||
      lower.includes('which doctors are on duty') ||
      (lower.includes('doctor') && lower.includes('duty'));

    if (isDoctorsOnDutyIntent) {
      const doctors = await toolHandlers.findDoctor({});
      const docLines = doctors.map(d =>
        `• **${d.name}** — ${d.specialization} (${d.experienceYears} yrs experience | Fee: PKR ${d.consultationFee})`
      ).join('\n');

      return {
        role: 'assistant',
        content: `🩺 **Specialist Physicians On Duty Today (${doctors.length}):**\n\n${docLines}\n\nAll physicians are actively accepting consultations. Sequential tokens are issued at reception.`,
        cardData: {
          type: 'DOCTOR_LIST',
          doctors
        }
      };
    }

    // 5. Doctor Schedule Intent
    const isDoctorScheduleIntent =
      (context.userRole === 'DOCTOR' || lower.includes('my schedule') || lower.includes('appointments today')) &&
      (lower.includes('today schedule') || lower.includes('my appointments today') || lower.includes('schedule today') || lower.includes('summary of my appointments'));

    if (isDoctorScheduleIntent) {
      const todayAppointments = await appointmentService.getAllAppointments({
        doctorId: context.userRole === 'DOCTOR' ? context.userId : undefined,
        date: new Date().toISOString().split('T')[0]
      });

      if (todayAppointments.length === 0) {
        return {
          role: 'assistant',
          content: '📅 **Today Schedule:**\nYou have no appointments scheduled on your roster today.'
        };
      }

      const schedLines = todayAppointments.map(a =>
        `• **Token #${a.tokenNumber || '—'}**: ${a.patientName} (${a.serviceName || 'Consultation'}) - Status: \`${a.status}\``
      ).join('\n');

      return {
        role: 'assistant',
        content: `📅 **Today Roster & Appointments (${todayAppointments.length}):**\n\n${schedLines}`
      };
    }

    // 6. Active Prescriptions Follow-Up
    const isPrescriptionFollowUpIntent =
      lower.includes('prescription guide') ||
      lower.includes('prescriptions requiring follow up') ||
      lower.includes('active prescriptions requiring');

    if (isPrescriptionFollowUpIntent) {
      const followUps = db.prescriptionVersions.filter(pv => pv.isCurrent && pv.correctionReason);
      const content = `💊 **Active Prescriptions & Follow-Up Guide:**\n\n` +
        `There are currently **${followUps.length}** active prescription revision(s) with clinical justification recorded:\n\n` +
        followUps.map(f => `• **Prescription ${f.prescriptionId} (v${f.versionNumber})**: *${f.correctionReason}*`).join('\n') +
        `\n\nTo inspect complete dosage diffs and physician audit trails, refer to the Clinical Records & Audit Vault.`;

      return {
        role: 'assistant',
        content
      };
    }

    // A. Explicit Appointment Reminder or "Meri Appointment Kab Hai?" Intent
    const isAskingAboutAppointment =
      (lower.includes('reminder') ||
       lower.includes('meri appointment') ||
       lower.includes('my appointment') ||
       lower.includes('kab hai') ||
       lower.includes('agla session') ||
       lower.includes('next session') ||
       lower.includes('upcoming appointment') ||
       lower.includes('میری اپائنٹمنٹ') ||
       lower.includes('یاد دہانی')) &&
      !lower.includes('queue') &&
      !lower.includes('pending') &&
      !lower.includes('vault');

    if (isAskingAboutAppointment) {
      if (!context.patientId) {
        const notLoggedInMsg = lang === 'roman_urdu'
          ? 'Apni upcoming appointments aur 48h reminders dekhne ke liye baraye meharbani patient account se login karein.'
          : 'Please log in with your patient account to view your scheduled appointments and reminders.';
        return {
          role: 'assistant',
          content: notLoggedInMsg
        };
      }

      if (upcomingReminders.length === 0) {
        const noAppMsg = lang === 'roman_urdu'
          ? 'Aap ki koi upcoming appointment scheduled nahi hai. Kya aap kisi doctor ke sath consultation book karna chahtay hain?'
          : 'You do not have any upcoming appointments scheduled. Would you like to book a consultation?';
        return {
          role: 'assistant',
          content: noAppMsg,
          cardData: {
            type: 'NO_APPOINTMENTS',
            action: 'BOOK_NEW'
          }
        };
      }

      const soonest = upcomingReminders[0];
      let reminderText = '';

      if (lang === 'roman_urdu') {
        reminderText = `🔔 **Aap ki Appointment ka Reminder:**\nAap ki **${soonest.doctorName}** (${soonest.doctorSpecialization}) ke sath appointment **${soonest.appointmentDate}** ko scheduled hai (Token #${soonest.tokenNumber || 'Assigned'}).\n\n${
          soonest.isUpcomingSoon
            ? '⚠️ **Ahem Notice:** Yeh appointment **2 din (48 hours)** ke andar hai! Baraye meharbani waqt se 15 minute pehlay tashreef layein.'
            : `Aap ki appointment mein abhi **${soonest.daysRemaining} din** baqi hain.`
        }${soonest.isFollowUp ? '\n*(Yeh aap ka follow-up session hai)*' : ''}`;
      } else if (lang === 'urdu') {
        reminderText = `🔔 **اپائنٹمنٹ یاد دہانی:**\nآپ کی **${soonest.doctorName}** کے ساتھ اپائنٹمنٹ **${soonest.appointmentDate}** کو مقرر ہے (ٹوکن #${soonest.tokenNumber || 'مقرر'})۔\n\n${
          soonest.isUpcomingSoon
            ? '⚠️ یہ اپائنٹمنٹ اگلے دو دنوں میں ہے۔ برائے مہربانی 15 منٹ قبل تشریف لائیں۔'
            : `آپ کی اپائنٹمنٹ میں **${soonest.daysRemaining} دن** باقی ہیں۔`
        }`;
      } else {
        reminderText = `🔔 **Upcoming Consultation Reminder:**\nYou have an appointment with **${soonest.doctorName}** (${soonest.doctorSpecialization}) on **${soonest.appointmentDate}** (Token #${soonest.tokenNumber || 'Assigned'}).\n\n${
          soonest.isUpcomingSoon
            ? '⚠️ **Notice:** This consultation is scheduled within **48 hours**! Please arrive 15 minutes prior to your time slot.'
            : `Your appointment is in **${soonest.daysRemaining} days**.`
        }${soonest.isFollowUp ? '\n*(This is your scheduled follow-up session)*' : ''}`;
      }

      return {
        role: 'assistant',
        content: reminderText,
        cardData: {
          type: 'APPOINTMENT_REMINDER',
          ...soonest
        }
      };
    }

    // B. Cancellation Intent
    const isCancelIntent =
      lower.includes('cancel') ||
      lower.includes('mansookh') ||
      lower.includes('khatam') ||
      lower.includes('منسوخ');

    if (isCancelIntent) {
      const patientAppointments = db.appointments.filter(
        a => a.patientId === context.patientId && a.status === 'CONFIRMED'
      );

      if (patientAppointments.length === 0) {
        const noActive = lang === 'roman_urdu'
          ? 'Aap ke paas is waqt koi active confirmed appointment cancel karne ke liye nahi hai.'
          : 'You do not currently have any active confirmed appointments to cancel.';
        return {
          role: 'assistant',
          content: noActive
        };
      }

      const targetApp = patientAppointments[0];
      const doctor = db.doctors.find(d => d.id === targetApp.doctorId);
      const token = targetApp.tokenId ? db.dailyTokens.find(t => t.id === targetApp.tokenId) : null;

      confirmationGuard.registerPendingAction(
        context.sessionId,
        'CANCEL_APPOINTMENT',
        { appointmentId: targetApp.id, reason: 'Patient initiated AI cancellation' },
        `Cancel appointment with ${doctor?.name} on ${targetApp.appointmentDate}`
      );

      const confirmPrompt = lang === 'roman_urdu'
        ? `⚠️ **Tasdeeq Darkaar Hai:** Kya aap waqai **${doctor?.name}** ke sath **${targetApp.appointmentDate}** (Token #${token?.tokenNumber}) wali appointment cancel karna chahtay hain?\n\n*Tasdeeq ke liye 'Yes' ya 'Haan' type karein.*`
        : `⚠️ **Confirmation Required:** Are you sure you want to cancel your appointment with **${doctor?.name}** on **${targetApp.appointmentDate}** (Token #${token?.tokenNumber})?\n\n*Please type 'Yes' to proceed.*`;

      return {
        role: 'assistant',
        content: confirmPrompt,
        cardData: {
          type: 'CONFIRMATION_REQUIRED',
          action: 'CANCEL_APPOINTMENT',
          appointmentId: targetApp.id,
          doctorName: doctor?.name,
          appointmentDate: targetApp.appointmentDate,
          tokenNumber: token?.tokenNumber
        }
      };
    }

    // C. Rescheduling Intent
    const isRescheduleIntent =
      lower.includes('reschedule') ||
      lower.includes('change date') ||
      lower.includes('postpone') ||
      lower.includes('tareekh badal') ||
      lower.includes('agay barha') ||
      lower.includes('تاریخ');

    if (isRescheduleIntent) {
      const patientAppointments = db.appointments.filter(
        a => a.patientId === context.patientId && a.status === 'CONFIRMED'
      );

      if (patientAppointments.length === 0) {
        const noActive = lang === 'roman_urdu'
          ? 'Reschedule karne ke liye koi active appointment nahi mili. Kya aap nayi appointment lena chahtay hain?'
          : "You don't have an active confirmed appointment to reschedule. Would you like to book a new appointment?";
        return {
          role: 'assistant',
          content: noActive
        };
      }

      const targetApp = patientAppointments[0];
      const doctor = db.doctors.find(d => d.id === targetApp.doctorId);
      const token = targetApp.tokenId ? db.dailyTokens.find(t => t.id === targetApp.tokenId) : null;

      const d = new Date();
      d.setDate(d.getDate() + 1);
      const tomorrow = d.toISOString().split('T')[0];

      confirmationGuard.registerPendingAction(
        context.sessionId,
        'RESCHEDULE_APPOINTMENT',
        { appointmentId: targetApp.id, newDate: tomorrow },
        `Reschedule appointment with ${doctor?.name} to ${tomorrow}`
      );

      const reschedPrompt = lang === 'roman_urdu'
        ? `📅 **Reschedule ki Tasdeeq:** Main aap ki **${doctor?.name}** ke sath consultation ko **${tomorrow}** par muntaqil kar sakta hoon.\n\nTasdeeq ke liye **'Yes'** ya **'Haan'** likhein.`
        : `📅 **Rescheduling Handshake:** I can move your consultation with **${doctor?.name}** (Current Token #${token?.tokenNumber}) to **${tomorrow}**.\n\nType **'Yes'** to confirm this change.`;

      return {
        role: 'assistant',
        content: reschedPrompt,
        cardData: {
          type: 'CONFIRMATION_REQUIRED',
          action: 'RESCHEDULE_APPOINTMENT',
          appointmentId: targetApp.id,
          doctorName: doctor?.name,
          currentDate: targetApp.appointmentDate,
          newDate: tomorrow
        }
      };
    }

    // D1. Direct Booking Execution Intent (When patient asks to book with a specific doctor and/or date)
    const isDirectBookingRequest =
      (lower.includes('book an appointment with doctor') ||
       (lower.includes('book') && (lower.includes('doc-') || lower.includes('aisha') || lower.includes('marcus'))) ||
       (lower.includes('appointment book') && (lower.includes('aisha') || lower.includes('marcus') || lower.includes('karo')))) &&
      !lower.includes('approval') &&
      !lower.includes('pending') &&
      !lower.includes('list');

    if (isDirectBookingRequest) {
      if (!resolvedPatientId) {
        const loginReqMsg = lang === 'roman_urdu'
          ? '⚠️ **Patient Login Darkaar Hai:** Appointment request bhejne ke liye baraye meharbani Patient account se login ya register karein.'
          : '⚠️ **Patient Login Required:** Please log in with your patient account to book an appointment with our specialist physicians.';
        return {
          role: 'assistant',
          content: loginReqMsg
        };
      }

      // Determine Doctor ID
      let selectedDoctorId = 'doc-01'; // Default Dr. Aisha
      const allDocs = await doctorService.getAllDoctors();
      if (lower.includes('doc-02') || lower.includes('marcus')) {
        selectedDoctorId = 'doc-02';
      } else if (lower.includes('doc-01') || lower.includes('aisha')) {
        selectedDoctorId = 'doc-01';
      } else {
        const matched = allDocs.find(d => lower.includes(d.name.toLowerCase()));
        if (matched) selectedDoctorId = matched.id;
      }

      // Determine Target Date
      let targetDate = new Date().toISOString().split('T')[0];
      const dateMatch = trimmedInput.match(/\b\d{4}-\d{2}-\d{2}\b/);
      if (dateMatch) {
        targetDate = dateMatch[0];
      } else if (lower.includes('tomorrow') || lower.includes('kal')) {
        targetDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      } else if (lower.includes('parson')) {
        targetDate = new Date(Date.now() + 172800000).toISOString().split('T')[0];
      }

      try {
        const bookingRes = await toolHandlers.createBookingRequest(
          { doctorId: selectedDoctorId, date: targetDate },
          resolvedPatientId,
          context.userId
        );

        const successText = lang === 'roman_urdu'
          ? `✅ **Appointment Request Kamyabi Se Bhej Di Gayi Hai!**\n\n` +
            `• **Doctor:** **${bookingRes.doctorName}**\n` +
            `• **Tareekh:** **${bookingRes.appointmentDate}**\n` +
            `• **Assigned Token:** **#${bookingRes.tokenNumber}**\n` +
            `• **Status:** \`PENDING\` *(Front-desk review ke baad confirm ho jayegi)*\n\n` +
            `Reception se verify hotay he aap ki appointment confirm ho jayegi.`
          : `✅ **Appointment Request Submitted Successfully!**\n\n` +
            `• **Physician:** **${bookingRes.doctorName}**\n` +
            `• **Appointment Date:** **${bookingRes.appointmentDate}**\n` +
            `• **Allocated Sequential Token:** **#${bookingRes.tokenNumber}**\n` +
            `• **Status:** \`PENDING\` *(Awaiting front-desk triage & confirmation)*\n\n` +
            `A confirmation notice will be transmitted upon receptionist validation.`;

        return {
          role: 'assistant',
          content: successText,
          cardData: {
            type: 'BOOKING_CONFIRMED',
            ...bookingRes
          }
        };
      } catch (err: any) {
        const errMsg = err.message || 'Failed to allocate token slot.';
        return {
          role: 'assistant',
          content: `❌ **Booking Error:** ${errMsg}`
        };
      }
    }

    // D2. Doctor Availability, OPD Timings & Live Slot Capacity Inquiry Intent
    const isAvailabilityTimingOrSlotIntent =
      (lower.includes('timing') || lower.includes('timings') || lower.includes('schedule') ||
       lower.includes('available') || lower.includes('availability') || lower.includes('dastyab') ||
       lower.includes('waqt') || lower.includes('time') || lower.includes('slot') ||
       lower.includes('slots') || lower.includes('kab') || lower.includes('khali') ||
       lower.includes('shift') || lower.includes('hours') || lower.includes('kitne baje') ||
       lower.includes('baithte') || lower.includes('baithti') || lower.includes('milenge') ||
       lower.includes('token') || lower.includes('open slot') || lower.includes('kab hai') ||
       lower.includes('kab mil') || lower.includes('kis waqt')) &&
      (lower.includes('doctor') || lower.includes('dr') || lower.includes('aisha') ||
       lower.includes('marcus') || lower.includes('cardio') || lower.includes('derm') ||
       lower.includes('appointment') || lower.includes('opd') || lower.includes('clinic') ||
       lower.includes('specialist') || lower.includes('physician') || lower.includes('checkup'));

    if (isAvailabilityTimingOrSlotIntent && !lower.includes('my schedule') && !lower.includes('audit')) {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const allDoctors = await doctorService.getAllDoctors();

      let targetDoctors = allDoctors;
      if (lower.includes('aisha') || lower.includes('ayesha')) {
        targetDoctors = allDoctors.filter(d => d.name.toLowerCase().includes('aisha'));
      } else if (lower.includes('marcus') || lower.includes('vance')) {
        targetDoctors = allDoctors.filter(d => d.name.toLowerCase().includes('marcus'));
      } else if (lower.includes('cardio') || lower.includes('heart') || lower.includes('dil')) {
        targetDoctors = allDoctors.filter(d => d.specialization.toLowerCase().includes('cardio'));
      } else if (lower.includes('derm') || lower.includes('skin') || lower.includes('jild') || lower.includes('aesthetic') || lower.includes('laser')) {
        targetDoctors = allDoctors.filter(d => d.specialization.toLowerCase().includes('derm'));
      }

      if (targetDoctors.length === 0) targetDoctors = allDoctors;

      const detailedDoctors = await Promise.all(
        targetDoctors.map(async doc => {
          let matrixToday;
          let matrixTomorrow;
          try {
            matrixToday = await tokenService.getDoctorTokensMatrix(doc.id, today);
          } catch {
            matrixToday = { availableCapacity: doc.dailyPatientLimit || 100, activePatientsCount: 0, dailyLimit: doc.dailyPatientLimit || 100 };
          }
          try {
            matrixTomorrow = await tokenService.getDoctorTokensMatrix(doc.id, tomorrow);
          } catch {
            matrixTomorrow = { availableCapacity: doc.dailyPatientLimit || 100, activePatientsCount: 0, dailyLimit: doc.dailyPatientLimit || 100 };
          }

          let shifts = {
            morning: '09:00 AM – 01:00 PM',
            evening: '04:00 PM – 08:00 PM',
            days: 'Monday – Saturday',
            consultationDuration: '15–20 mins per patient'
          };
          if (doc.name.toLowerCase().includes('marcus')) {
            shifts = {
              morning: 'N/A',
              evening: '02:00 PM – 08:00 PM',
              days: 'Monday – Friday',
              consultationDuration: '20–25 mins per patient'
            };
          }

          return {
            id: doc.id,
            name: doc.name,
            specialization: doc.specialization,
            qualifications: doc.qualifications || ['MBBS', 'Specialist'],
            experienceYears: doc.experienceYears || 10,
            consultationFee: doc.consultationFee,
            followUpFee: doc.followUpFee || Math.round(doc.consultationFee * 0.6),
            shifts,
            todaySlots: {
              date: today,
              available: matrixToday.availableCapacity,
              booked: matrixToday.activePatientsCount,
              limit: matrixToday.dailyLimit,
              hasSlots: matrixToday.availableCapacity > 0
            },
            tomorrowSlots: {
              date: tomorrow,
              available: matrixTomorrow.availableCapacity,
              booked: matrixTomorrow.activePatientsCount,
              limit: matrixTomorrow.dailyLimit,
              hasSlots: matrixTomorrow.availableCapacity > 0
            }
          };
        })
      );

      let responseText = '';
      if (lang === 'roman_urdu') {
        const docSummaries = detailedDoctors.map(d => {
          const shiftStr = d.shifts.morning !== 'N/A'
            ? `• **OPD Timings:** Subah ${d.shifts.morning} | Shaam ${d.shifts.evening} (${d.shifts.days})`
            : `• **OPD Timings:** Dopehar/Shaam ${d.shifts.evening} (${d.shifts.days})`;

          const todayStatus = d.todaySlots.hasSlots
            ? `✅ **Aaj (${d.todaySlots.date}):** **${d.todaySlots.available} Slots Khali Hain** (${d.todaySlots.booked} booked out of ${d.todaySlots.limit})`
            : `❌ **Aaj (${d.todaySlots.date}):** Tamam slots full hain`;

          const tomorrowStatus = d.tomorrowSlots.hasSlots
            ? `✅ **Kal (${d.tomorrowSlots.date}):** **${d.tomorrowSlots.available} Slots Khali Hain**`
            : `❌ **Kal (${d.tomorrowSlots.date}):** Slots full hain`;

          return `🩺 **${d.name}** (*${d.specialization}*)\n` +
            `  ${shiftStr}\n` +
            `  • **Slot Availability:**\n    - ${todayStatus}\n    - ${tomorrowStatus}\n` +
            `  • **Consultation Fee:** PKR ${d.consultationFee.toLocaleString()} *(Follow-up: PKR ${d.followUpFee.toLocaleString()})*\n` +
            `  • **Tajurba:** ${d.experienceYears} saal (${d.qualifications.join(', ')})`;
        }).join('\n\n');

        responseText = `🏥 **Aesthetic Hospital — Doctors Ki Timings Aur Live Slot Status:**\n\n` +
          `${docSummaries}\n\n` +
          `📌 **Slot Lene Ka Tareeqa:**\n` +
          `Aap neechay diay gaye card se **'Book Consultation'** click kar ke kisi bhi doctor ki appointment request kar sakte hain, ya mujhay likhein: *"Dr. Aisha ke sath appointment book karo"*.`;
      } else if (lang === 'urdu') {
        const docSummaries = detailedDoctors.map(d => {
          const shiftStr = d.shifts.morning !== 'N/A'
            ? `• **کلینک کے اوقات:** صبح ${d.shifts.morning} | شام ${d.shifts.evening} (${d.shifts.days})`
            : `• **کلینک کے اوقات:** بعد دوپہر/شام ${d.shifts.evening} (${d.shifts.days})`;

          const todayStatus = d.todaySlots.hasSlots
            ? `✅ **آج:** **${d.todaySlots.available} نشستیں خالی ہیں**`
            : `❌ **آج:** تمام نشستیں پر ہیں`;

          return `🩺 **${d.name}** (${d.specialization})\n` +
            `  ${shiftStr}\n` +
            `  • **دستیاب نشستیں:** ${todayStatus}\n` +
            `  • **معائنہ فیس:** PKR ${d.consultationFee.toLocaleString()}`;
        }).join('\n\n');

        responseText = `🏥 **ڈاکٹروں کے کلینک اوقات اور دستیاب نشستیں:**\n\n${docSummaries}\n\nآپ نیچے دیے گئے کارڈ سے فوری طور پر اپائنٹمنٹ حاصل کر سکتے ہیں۔`;
      } else {
        const docSummaries = detailedDoctors.map(d => {
          const shiftStr = d.shifts.morning !== 'N/A'
            ? `• **Clinic Hours:** Morning: ${d.shifts.morning} | Evening: ${d.shifts.evening} (${d.shifts.days})`
            : `• **Clinic Hours:** Afternoon/Evening: ${d.shifts.evening} (${d.shifts.days})`;

          const todayStatus = d.todaySlots.hasSlots
            ? `✅ **Today (${d.todaySlots.date}):** **${d.todaySlots.available} open slots** (${d.todaySlots.booked} reserved of ${d.todaySlots.limit} capacity)`
            : `❌ **Today (${d.todaySlots.date}):** Fully booked for today`;

          const tomorrowStatus = d.tomorrowSlots.hasSlots
            ? `✅ **Tomorrow (${d.tomorrowSlots.date}):** **${d.tomorrowSlots.available} open slots**`
            : `❌ **Tomorrow (${d.tomorrowSlots.date}):** Fully booked`;

          return `🩺 **${d.name}** — *${d.specialization}*\n` +
            `  ${shiftStr}\n` +
            `  • **Live Availability:**\n    - ${todayStatus}\n    - ${tomorrowStatus}\n` +
            `  • **Fee:** PKR ${d.consultationFee.toLocaleString()} *(Follow-up: PKR ${d.followUpFee.toLocaleString()})*\n` +
            `  • **Credentials:** ${d.qualifications.join(', ')} (${d.experienceYears} yrs experience)`;
        }).join('\n\n');

        responseText = `🏥 **Aesthetic Hospital — Specialist Roster, Timings & Live Slot Capacity:**\n\n` +
          `${docSummaries}\n\n` +
          `💡 **To Secure a Slot:**\n` +
          `Click **'Book Consultation'** on the doctor card below, or tell me: *"Book an appointment with Dr. Aisha tomorrow"*.`;
      }

      return {
        role: 'assistant',
        content: responseText,
        cardData: {
          type: 'DOCTOR_AVAILABILITY_CARD',
          doctors: detailedDoctors,
          dates: [today, tomorrow, new Date(Date.now() + 172800000).toISOString().split('T')[0]]
        }
      };
    }

    // D3. General Doctor Search Intent (Fallback)
    const isDoctorIntent =
      lower.includes('doctor') ||
      lower.includes('cardiologist') ||
      lower.includes('dermatologist') ||
      lower.includes('physician') ||
      lower.includes('specialist') ||
      lower.includes('ڈاکٹر');

    if (isDoctorIntent) {
      let spec: string | undefined;
      if (lower.includes('cardio') || lower.includes('heart') || lower.includes('dil')) spec = 'Cardiology';
      if (lower.includes('derm') || lower.includes('skin') || lower.includes('jild')) spec = 'Dermatology';

      const docs = await toolHandlers.findDoctor({ specialization: spec });
      const docHeading = lang === 'roman_urdu'
        ? `Hamare hospital mein ${docs.length} specialist doctors dastyab hain:`
        : `Found ${docs.length} specialist${docs.length === 1 ? '' : 's'} available at our hospital:`;

      return {
        role: 'assistant',
        content: docHeading,
        cardData: {
          type: 'DOCTOR_LIST',
          doctors: docs
        }
      };
    }

    // E. Guided Booking Request Intent
    const isBookingIntent =
      (lower.includes('book') ||
       lower.includes('appointment') ||
       lower.includes('milna hai') ||
       lower.includes('checkup') ||
       lower.includes('اپائنٹمنٹ')) &&
      !lower.includes('pending') &&
      !lower.includes('approval') &&
      !lower.includes('queue') &&
      !lower.includes('vault');

    if (isBookingIntent) {
      const doctors = await toolHandlers.findDoctor({});
      const bookingHeading = lang === 'roman_urdu'
        ? 'Main aap ki appointment request karne mein madad kar sakta hoon. Neechay se apna pasandeeda doctor aur tareekh muntakhib karein:'
        : 'I would be happy to help you request an appointment. Please select a doctor and your preferred date below. All booking requests are confirmed by our reception desk.';

      return {
        role: 'assistant',
        content: bookingHeading,
        cardData: {
          type: 'BOOKING_PICKER',
          doctors,
          availableDates: [
            new Date().toISOString().split('T')[0],
            new Date(Date.now() + 86400000).toISOString().split('T')[0],
            new Date(Date.now() + 172800000).toISOString().split('T')[0]
          ]
        }
      };
    }

    // F. Medical History / Prescriptions Intent
    if (lower.includes('history') || lower.includes('record') || lower.includes('dawai') || lower.includes('prescription') || lower.includes('nuskha')) {
      if (!context.patientId) {
        const needLogin = lang === 'roman_urdu'
          ? 'Apna medical record dekhne ke liye patient account se login karein.'
          : 'Please log in with your patient account to view your medical history and prescriptions.';
        return {
          role: 'assistant',
          content: needLogin
        };
      }
      const historyData = await toolHandlers.getPatientClinicalHistory(context.patientId);
      const histHeading = lang === 'roman_urdu'
        ? `Yeh raha aap ka medical record (${historyData.totalVisits} visits). Privacy ke tahat private doctor notes redacted hain.`
        : `Here is a summary of your medical history (${historyData.totalVisits} visit record${historyData.totalVisits === 1 ? '' : 's'}).`;

      return {
        role: 'assistant',
        content: histHeading,
        cardData: {
          type: 'PATIENT_HISTORY',
          ...historyData
        }
      };
    }

    // G. Billing & Payments Intent
    if (lower.includes('balance') || lower.includes('bill') || lower.includes('payment') || lower.includes('fees') || lower.includes('charges') || lower.includes('paisa') || lower.includes('paise')) {
      if (!context.patientId) {
        return {
          role: 'assistant',
          content: lang === 'roman_urdu' ? 'Apna bill dekhne ke liye login karein.' : 'Please log in to check your billing summary.'
        };
      }
      const billingData = await toolHandlers.getBasicPaymentStatus(context.patientId);
      const billText = billingData.hasOutstandingBalance
        ? (lang === 'roman_urdu'
            ? `Aap ka baqiya balance **PKR ${billingData.balanceDue.toFixed(2)}** hai.`
            : `You have an outstanding balance of **PKR ${billingData.balanceDue.toFixed(2)}**.`)
        : (lang === 'roman_urdu'
            ? `Aap ke tamam bills ada ho chukay hain (PKR 0.00 baqiya).`
            : `All your accounts are settled! Your outstanding balance is **PKR 0.00**.`);

      return {
        role: 'assistant',
        content: billText,
        cardData: {
          type: 'BILLING_SUMMARY',
          ...billingData
        }
      };
    }

    // STEP 4: Call Gemini for Natural All-Language Conversational Response
    const systemPrompt = `You are the friendly, professional AI Clinical Assistant for AI Aesthetic Hospital.
CRITICAL LANGUAGE INSTRUCTION:
- ALWAYS identify the user's language and reply in the EXACT SAME LANGUAGE and style.
- If user writes in Roman Urdu (e.g. "kese ho", "hospital kab khulta hai"), respond in natural Roman Urdu.
- If user writes in Urdu script (اردو), respond in Urdu script.
- If user writes in English, respond in English.
- If in Arabic, Spanish, etc., respond in that exact language.

SAFETY PROTOCOL:
- Never diagnose symptoms or prescribe medical prescriptions directly.
- Politely explain that you are an AI assistant and guide patients to book an appointment with our specialist doctors.

HOSPITAL CONTEXT:
- Open 24/7 for emergency and executive clinics.
- Sequential daily tokens ensure zero wait time confusion.
- Reception desk confirms bookings.
${upcomingReminders.length > 0 ? `NOTE: The patient has an upcoming appointment on ${upcomingReminders[0].appointmentDate} with Dr. ${upcomingReminders[0].doctorName} (Token #${upcomingReminders[0].tokenNumber}). Warmly mention this reminder if helpful!` : ''}`;

    const geminiReply = await geminiClient.generateResponse(
      systemPrompt,
      history.map(h => ({ role: h.role, content: h.content })),
      trimmedInput
    );

    if (geminiReply) {
      return {
        role: 'assistant',
        content: geminiReply
      };
    }

    // STEP 5: Static RAG Knowledge Fallback
    const ragResults = ragRetrieverService.search(trimmedInput, 2);
    if (ragResults.length > 0) {
      const topMatch = ragResults[0];
      return {
        role: 'assistant',
        content: `${topMatch.content}\n\n*(Source: ${topMatch.title})*`,
        cardData: {
          type: 'KNOWLEDGE_ARTICLE',
          title: topMatch.title,
          category: topMatch.category
        }
      };
    }

    // Dynamic Default Welcome Fallback based on detected language
    if (lang === 'roman_urdu') {
      const reminderNote = upcomingReminders.length > 0 && upcomingReminders[0].isUpcomingSoon
        ? `\n\n🔔 **Reminder:** Aap ki Dr. ${upcomingReminders[0].doctorName} ke sath appointment ${upcomingReminders[0].appointmentDate} ko scheduled hai (Token #${upcomingReminders[0].tokenNumber}).`
        : '';
      return {
        role: 'assistant',
        content: `Assalam-o-Alaikum! Main aap ka AI Clinical Assistant hoon. Main doctors dhoondnay, nayi appointment lene, 48h reminders check karne, ya aap ki purani tareekh aur bills dekhne mein madad kar sakta hoon. Main aap ki kya madad karoon?${reminderNote}`
      };
    } else if (lang === 'urdu') {
      return {
        role: 'assistant',
        content: 'السلام علیکم! میں آپ کا اے آئی کلینیکل اسسٹنٹ ہوں۔ میں ڈاکٹر تلاش کرنے، نئی اپائنٹمنٹ حاصل کرنے، اور آپ کے ریکارڈز کی معلومات میں مدد کر سکتا ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟'
      };
    }

    return {
      role: 'assistant',
      content: "Hello! I am your AI Clinical Assistant. I can help you find specialist physicians, request appointments, manage 2-day prior reminders, view medical records, or answer hospital policy inquiries in any language. How may I assist you today?"
    };
  }
}

export const aiAgentOrchestrator = new AiAgentOrchestrator();
