export interface PendingConfirmationState {
  action: 'CANCEL_APPOINTMENT' | 'RESCHEDULE_APPOINTMENT' | 'BOOK_APPOINTMENT';
  parameters: any;
  summaryText: string;
  expiresAt: number;
}

export class ConfirmationGuard {
  // In-memory pending confirmation sessions per patient/session
  private pendingSessions: Map<string, PendingConfirmationState> = new Map();

  registerPendingAction(
    sessionId: string,
    action: 'CANCEL_APPOINTMENT' | 'RESCHEDULE_APPOINTMENT' | 'BOOK_APPOINTMENT',
    parameters: any,
    summaryText: string
  ): PendingConfirmationState {
    const state: PendingConfirmationState = {
      action,
      parameters,
      summaryText,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5-minute confirmation TTL
    };
    this.pendingSessions.set(sessionId, state);
    return state;
  }

  getPendingAction(sessionId: string): PendingConfirmationState | null {
    const state = this.pendingSessions.get(sessionId);
    if (!state) return null;
    if (Date.now() > state.expiresAt) {
      this.pendingSessions.delete(sessionId);
      return null;
    }
    return state;
  }

  clearPendingAction(sessionId: string): void {
    this.pendingSessions.delete(sessionId);
  }

  isConfirmationAffirmative(text: string): boolean {
    const clean = text.trim().toLowerCase();
    return (
      clean === 'yes' ||
      clean === 'confirm' ||
      clean === 'yes please' ||
      clean === 'proceed' ||
      clean === 'i confirm' ||
      clean === 'yes, cancel' ||
      clean === 'yes, reschedule' ||
      clean === 'haan' ||
      clean === 'theek hai' ||
      clean === 'theek' ||
      clean === 'sahi hai' ||
      clean === 'ji' ||
      clean === 'ji haan' ||
      clean === '1' ||
      clean === 'ok' ||
      clean === 'done' ||
      clean === 'book karo' ||
      clean === 'book kar dein' ||
      clean === 'confirm karo'
    );
  }

  isConfirmationNegative(text: string): boolean {
    const clean = text.trim().toLowerCase();
    return (
      clean === 'no' ||
      clean === 'nahi' ||
      clean === 'nahin' ||
      clean === 'cancel' ||
      clean === 'edit' ||
      clean === 'change' ||
      clean === 'tabdeel' ||
      clean === 'tabdeel karo' ||
      clean === 'galat' ||
      clean === '2' ||
      clean === 'nhi' ||
      clean === 'dont book' ||
      clean === 'mat karo'
    );
  }
}

export const confirmationGuard = new ConfirmationGuard();
