export interface StoredChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  cardData?: any;
  timestamp: string;
  attachments?: Array<{
    name: string;
    type: string;
    size?: number;
    data: string;
  }>;
  thoughtProcess?: {
    durationMs: number;
    steps: string[];
    thinkingText?: string;
  };
  searchingSteps?: Array<{ label: string; status: 'done' | 'active' }>;
  groundingSources?: Array<{ title: string; subtitle?: string; sourceUrl?: string; verified: boolean }>;
  followUpChips?: string[];
  navigationTarget?: {
    moduleId: string;
    moduleName: string;
    category: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'hospital_ai_chat_sessions_v1';
const ACTIVE_SESSION_ID_KEY = 'hospital_ai_active_session_id';

export class ChatSessionService {
  /**
   * Load all saved sessions from localStorage
   */
  getAllSessions(): ChatSession[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Save all sessions to localStorage
   */
  saveAllSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Safe fallback
    }
  }

  /**
   * Get active session ID
   */
  getActiveSessionId(): string {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY) || '';
  }

  /**
   * Set active session ID
   */
  setActiveSessionId(id: string): void {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  }

  /**
   * Create a new session
   */
  createNewSession(initialMessages: StoredChatMessage[] = []): ChatSession {
    const newSession: ChatSession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: 'New Conversation',
      messages: initialMessages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sessions = this.getAllSessions();
    sessions.unshift(newSession);
    this.saveAllSessions(sessions);
    this.setActiveSessionId(newSession.id);
    return newSession;
  }

  /**
   * Update or auto-title a session based on the first user message
   */
  updateSession(id: string, messages: StoredChatMessage[], customTitle?: string): ChatSession | null {
    const sessions = this.getAllSessions();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx === -1) return null;

    let title = customTitle || sessions[idx].title;
    // Auto-generate title from first user query if still generic
    if (title === 'New Conversation' || title === 'Chat Session') {
      const firstUserMsg = messages.find(m => m.sender === 'user');
      if (firstUserMsg && firstUserMsg.text) {
        title = firstUserMsg.text.slice(0, 38).trim() + (firstUserMsg.text.length > 38 ? '...' : '');
      }
    }

    sessions[idx] = {
      ...sessions[idx],
      title,
      messages,
      updatedAt: new Date().toISOString()
    };

    this.saveAllSessions(sessions);
    return sessions[idx];
  }

  /**
   * Delete a session
   */
  deleteSession(id: string): ChatSession[] {
    let sessions = this.getAllSessions();
    sessions = sessions.filter(s => s.id !== id);
    this.saveAllSessions(sessions);

    if (this.getActiveSessionId() === id) {
      if (sessions.length > 0) {
        this.setActiveSessionId(sessions[0].id);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
      }
    }

    return sessions;
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
  }

  /**
   * Group sessions into timeline categories: Today, Yesterday, Previous 7 Days, Older
   */
  groupSessionsByTimeline(sessions: ChatSession[]): {
    today: ChatSession[];
    yesterday: ChatSession[];
    lastWeek: ChatSession[];
    older: ChatSession[];
  } {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    const result = {
      today: [] as ChatSession[],
      yesterday: [] as ChatSession[],
      lastWeek: [] as ChatSession[],
      older: [] as ChatSession[]
    };

    sessions.forEach(s => {
      const sTime = new Date(s.updatedAt || s.createdAt).getTime();
      if (sTime >= todayStart) {
        result.today.push(s);
      } else if (sTime >= yesterdayStart) {
        result.yesterday.push(s);
      } else if (sTime >= weekStart) {
        result.lastWeek.push(s);
      } else {
        result.older.push(s);
      }
    });

    return result;
  }
}

export const chatSessionService = new ChatSessionService();
