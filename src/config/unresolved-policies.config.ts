/**
 * 21 CONFIGURABLE CLINICAL & OPERATIONAL POLICIES
 * Granular hooks for hospital business logic engine
 */
export const UNRESOLVED_POLICIES = {
  // 1. Token Cancellation Lock
  PERMANENT_TOKEN_CANCELLATION: true,

  // 2. Daily Default Patient Limit per Doctor
  DEFAULT_DAILY_PATIENT_LIMIT: 100,

  // 3. Late Check-in Grace Period (Minutes past appointment window before flag)
  LATE_CHECKIN_GRACE_PERIOD_MINUTES: 30,

  // 4. No-Show Auto-Transition Window (Minutes after day end or doctor shift)
  AUTO_NO_SHOW_THRESHOLD_HOURS: 4,

  // 5. Booking Advance Window (Maximum days in advance a patient can request)
  MAX_ADVANCE_BOOKING_DAYS: 30,

  // 6. Minimum Rescheduling Notice (Hours before appointment date)
  MIN_RESCHEDULE_NOTICE_HOURS: 2,

  // 7. Duplicate Detection Strictness (Matches CNIC, Phone, Email)
  STRICT_DUPLICATE_CNIC: true,
  STRICT_DUPLICATE_PHONE: true,
  STRICT_DUPLICATE_EMAIL: true,

  // 8. Clinical Privacy Wall API Redaction Level
  RECEPTIONIST_PRIVACY_REDACTION: true,
  PATIENT_PRIVATE_NOTES_REDACTION: true,

  // 9. Doctor Patient Access Boundary Check
  DOCTOR_RELATIONSHIP_REQUIRED_FOR_HISTORY: true,

  // 10. Prescription Immutability Enforcement (Never allow in-place overwrite)
  STRICT_PRESCRIPTION_IMMUTABILITY: true,

  // 11. Mandatory Correction Reason on Prescription Revision (v1 -> v2)
  REQUIRE_PRESCRIPTION_CORRECTION_REASON: true,

  // 12. Notification Failover Retry Delay (ms)
  NOTIFICATION_FAILOVER_TIMEOUT_MS: 3000,

  // 13. Max Channels to Attempt in Notification Pipeline
  MAX_NOTIFICATION_CHANNELS: 2,

  // 14. Emergency Deflection Warning Message
  EMERGENCY_DEFLECTION_NOTICE:
    'If you are experiencing severe chest pain, shortness of breath, sudden weakness, or a medical emergency, please call 911 or visit the nearest emergency room immediately.',

  // 15. Medical Safety Guardrail Diagnostic Disclaimer
  DIAGNOSTIC_DEFLECTION_MESSAGE:
    'I am an AI assistant and cannot provide medical diagnoses, treatment decisions, or write prescriptions. I can summarize your past medical records or help you book an appointment with our physicians.',

  // 16. Two-Step Confirmation Required Actions for AI Agent
  AI_REQUIRES_CONFIRMATION_FOR: ['CANCEL_APPOINTMENT', 'RESCHEDULE_APPOINTMENT'],

  // 17. Default Currency Code
  CURRENCY_CODE: 'PKR',

  // 18. Default Follow-up Discount Percentage (if applicable)
  FOLLOW_UP_DISCOUNT_PERCENT: 20,

  // 19. Consultation Timeout Warning (Minutes after start)
  CONSULTATION_ALERT_MINUTES: 45,

  // 20. Call Next Patient Auto-Expire Timeout (Minutes patient has to enter room)
  CALLED_PATIENT_ARRIVAL_WINDOW_MINUTES: 10,

  // 21. Audit Trail Retention Policy (Days, 0 = indefinite)
  AUDIT_LOG_RETENTION_DAYS: 0,
} as const;
