import { UNRESOLVED_POLICIES } from '../../../config/unresolved-policies.config';

export interface SafetyCheckResult {
  isSafe: boolean;
  deflectionMessage?: string;
  isEmergency?: boolean;
}

export class MedicalSafetyGuard {
  // Common diagnostic, symptoms, or self-prescription intent patterns (English, Roman Urdu, Urdu)
  private diagnosticPatterns = [
    /\b(diagnose|diagnosis|what disease|what sickness|what illness|do i have)\b/i,
    /\b(prescribe|give me medicine|antibiotic|painkiller|dosage for|rx for)\b/i,
    /\b(what is wrong with me|why does my .+ hurt|cure for|treatment for my)\b/i,
    // Roman Urdu patterns
    /\b(dawa|dawai|ilaaj|ilaj|bimari|bukhar|dard|nuskhah|nuskha|prescribe karo|dawa batao|dawai batao|dawa do)\b/i,
    // Urdu script patterns
    /(تشخیص|علاج|دوا|دوائی|نسخہ|بخار|درد)/
  ];

  // Acute emergency patterns requiring immediate emergency redirect
  private emergencyPatterns = [
    /\b(chest pain|heart attack|cannot breathe|shortness of breath|unconscious|stroke|severe bleeding|coughing blood)\b/i,
    /\b(suicide|overdose|poisoning|anaphylaxis)\b/i,
    // Roman Urdu patterns
    /\b(seene mein dard|dil ka dora|saans nahi|behosh|khoon nikal)\b/i,
    // Urdu script patterns
    /(سینے میں درد|دل کا دورہ|سانس نہیں|بے ہوش|خون)/
  ];

  /**
   * MEDICAL SAFETY GUARDRAIL ENGINE (Part 6):
   * Diagnostic Deflection Rule:
   * Rejects diagnostic queries or prescription requests unconditionally.
   */
  evaluatePrompt(prompt: string): SafetyCheckResult {
    const trimmed = prompt.trim();

    // Check emergency triggers first
    for (const pattern of this.emergencyPatterns) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          isEmergency: true,
          deflectionMessage: `${UNRESOLVED_POLICIES.EMERGENCY_DEFLECTION_NOTICE}\n\n${UNRESOLVED_POLICIES.DIAGNOSTIC_DEFLECTION_MESSAGE}`
        };
      }
    }

    // Operational inquiries about pharmacy facilities, store hours, stock availability or picking up prescriptions are safe
    const isPharmacyOperational =
      /\b(pharmacy|medical store|dispensary|dawa ki dukaan|dawai ki dukaan|store)\b/i.test(trimmed) ||
      /\b(stock|available|price|cost|fees|timing|hours|open|khuli|kahan|where|rack|shelf)\b/i.test(trimmed) ||
      /\b(augmentin|panadol|botox|juvederm|ciproxin|lisinopril|metoprolol|atorvastatin|retin-a|cevit)\b/i.test(trimmed);

    const isExplicitDiagnostic =
      /\b(diagnose|diagnosis|what disease|what sickness|what illness|do i have|what is wrong with me|why does my .+ hurt|cure for|treatment for my)\b/i.test(trimmed) ||
      /\b(prescribe|prescribe karo|dawa batao|dawai batao|dawa do|dawai do|konsi dawa loon|konsi dawai loon)\b/i.test(trimmed) ||
      /(تشخیص|علاج|نسخہ)/.test(trimmed);

    if (isPharmacyOperational && !isExplicitDiagnostic) {
      return { isSafe: true };
    }

    // Check diagnostic and prescription triggers
    for (const pattern of this.diagnosticPatterns) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          isEmergency: false,
          deflectionMessage: UNRESOLVED_POLICIES.DIAGNOSTIC_DEFLECTION_MESSAGE
        };
      }
    }

    return { isSafe: true };
  }
}

export const medicalSafetyGuard = new MedicalSafetyGuard();
