import { CropAnalysisReport } from '../../types/analysis.types';
import { ChatMessage, ChatSession } from '../../types/chat.types';
import { User } from '../../types/auth.types';
import { LocationInfo } from '../../types/weather.types';
import { SAMPLE_SEED_REPORTS } from './seedData';

const DB_KEYS = {
  REPORTS: 'krishidrishti_reports_v1',
  AUTH_USER: 'krishidrishti_auth_user_v1',
  AUTH_TOKEN: 'krishidrishti_auth_token_v1',
  CHAT_MESSAGES: 'krishidrishti_chat_messages_v1',
  CHAT_SESSIONS: 'krishidrishti_chat_sessions_v2',
  ACTIVE_SESSION_ID: 'krishidrishti_active_session_id_v2',
  APP_SETTINGS: 'krishidrishti_settings_v1',
  OFFLINE_QUEUE: 'krishidrishti_offline_queue_v1',
  LOCATION: 'krishidrishti_location_v1',
};

class LocalDatabase {
  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    const existing = localStorage.getItem(DB_KEYS.REPORTS);
    if (!existing) {
      localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify([]));
    } else {
      try {
        const parsed = JSON.parse(existing);
        // Purge legacy hardcoded static sample reports so database only reflects real user diagnostic scans
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (r: any) => r.id !== 'rep-tomato-blight-01' && r.id !== 'rep-wheat-rust-02'
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify(cleaned));
          }
        }
      } catch (e) {
        localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify([]));
      }
    }
  }

  // Location persistence for dynamic farm grounding
  public getLocation(): LocationInfo | null {
    try {
      const data = localStorage.getItem(DB_KEYS.LOCATION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setLocation(loc: LocationInfo): void {
    try {
      localStorage.setItem(DB_KEYS.LOCATION, JSON.stringify(loc));
    } catch (e) {
      console.error('Error saving dynamic location:', e);
    }
  }

  // Reports CRUD
  public getReports(): CropAnalysisReport[] {
    try {
      const data = localStorage.getItem(DB_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading reports from local storage:', e);
      return [];
    }
  }

  public getReportById(id: string): CropAnalysisReport | null {
    const reports = this.getReports();
    return reports.find((r) => r.id === id) || null;
  }

  public saveReport(report: CropAnalysisReport): void {
    try {
      const reports = this.getReports();
      // Prepend so the newest appears first
      const updated = [report, ...reports.filter((r) => r.id !== report.id)];
      localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving report to local storage:', e);
    }
  }

  public deleteReport(id: string): void {
    try {
      const reports = this.getReports();
      const filtered = reports.filter((r) => r.id !== id);
      localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting report:', e);
    }
  }

  // Auth User
  public getAuthUser(): User | null {
    try {
      const user = localStorage.getItem(DB_KEYS.AUTH_USER);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  }

  public setAuthUser(user: User | null, token: string | null): void {
    if (user && token) {
      localStorage.setItem(DB_KEYS.AUTH_USER, JSON.stringify(user));
      localStorage.setItem(DB_KEYS.AUTH_TOKEN, token);
    } else {
      localStorage.removeItem(DB_KEYS.AUTH_USER);
      localStorage.removeItem(DB_KEYS.AUTH_TOKEN);
    }
  }

  public getAuthToken(): string | null {
    return localStorage.getItem(DB_KEYS.AUTH_TOKEN);
  }

  // Chat Session & History Persistence
  public getChatSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(DB_KEYS.CHAT_SESSIONS);
      if (data) {
        const parsed: ChatSession[] = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
      // Migrate legacy single session if present
      const legacyMsgs = localStorage.getItem(DB_KEYS.CHAT_MESSAGES);
      if (legacyMsgs) {
        const msgs = JSON.parse(legacyMsgs);
        if (Array.isArray(msgs) && msgs.length > 0) {
          const defaultSession: ChatSession = {
            id: `session_${Date.now()}`,
            title: msgs.find((m: ChatMessage) => m.sender === 'user')?.text?.slice(0, 40) || 'Previous Farm Chat',
            messages: msgs,
            createdAt: msgs[0]?.timestamp || new Date().toISOString(),
            lastActive: msgs[msgs.length - 1]?.timestamp || new Date().toISOString(),
          };
          localStorage.setItem(DB_KEYS.CHAT_SESSIONS, JSON.stringify([defaultSession]));
          localStorage.setItem(DB_KEYS.ACTIVE_SESSION_ID, defaultSession.id);
          return [defaultSession];
        }
      }
      return [];
    } catch (e) {
      console.error('Error reading chat sessions:', e);
      return [];
    }
  }

  public getChatSession(id: string): ChatSession | null {
    const sessions = this.getChatSessions();
    return sessions.find((s) => s.id === id) || null;
  }

  public saveChatSession(session: ChatSession): void {
    try {
      const sessions = this.getChatSessions();
      const existingIdx = sessions.findIndex((s) => s.id === session.id);
      let updated: ChatSession[];
      if (existingIdx >= 0) {
        updated = [...sessions];
        updated[existingIdx] = session;
      } else {
        updated = [session, ...sessions];
      }
      // Keep up to 30 past sessions
      const trimmed = updated.slice(0, 30);
      localStorage.setItem(DB_KEYS.CHAT_SESSIONS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Error saving chat session:', e);
    }
  }

  public deleteChatSession(id: string): void {
    try {
      const sessions = this.getChatSessions();
      const filtered = sessions.filter((s) => s.id !== id);
      localStorage.setItem(DB_KEYS.CHAT_SESSIONS, JSON.stringify(filtered));
      if (this.getActiveSessionId() === id) {
        const nextActive = filtered[0]?.id || null;
        this.setActiveSessionId(nextActive);
      }
    } catch (e) {
      console.error('Error deleting chat session:', e);
    }
  }

  public getActiveSessionId(): string | null {
    try {
      return localStorage.getItem(DB_KEYS.ACTIVE_SESSION_ID);
    } catch {
      return null;
    }
  }

  public setActiveSessionId(id: string | null): void {
    if (id) {
      localStorage.setItem(DB_KEYS.ACTIVE_SESSION_ID, id);
    } else {
      localStorage.removeItem(DB_KEYS.ACTIVE_SESSION_ID);
    }
  }

  public getChatMessages(sessionId?: string): ChatMessage[] {
    const targetId = sessionId || this.getActiveSessionId();
    if (targetId) {
      const session = this.getChatSession(targetId);
      if (session) return session.messages;
    }
    // Fallback to legacy key if no active session exists yet
    try {
      const data = localStorage.getItem(DB_KEYS.CHAT_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveChatMessage(message: ChatMessage, sessionId?: string): void {
    const targetId = sessionId || this.getActiveSessionId();
    if (targetId) {
      const session = this.getChatSession(targetId);
      if (session) {
        session.messages.push(message);
        if (session.messages.length > 100) {
          session.messages = session.messages.slice(-100);
        }
        session.lastActive = new Date().toISOString();
        if (message.sender === 'user' && (!session.title || session.title === 'New Chat Session' || session.title === 'Farm Advisory')) {
          session.title = message.text.slice(0, 45).trim() || 'Farm Advisory';
        }
        this.saveChatSession(session);
        return;
      }
    }

    // Fallback legacy storage
    try {
      const messages = this.getChatMessages();
      messages.push(message);
      const trimmed = messages.slice(-100);
      localStorage.setItem(DB_KEYS.CHAT_MESSAGES, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Error saving chat message:', e);
    }
  }

  public clearChatHistory(sessionId?: string): void {
    const targetId = sessionId || this.getActiveSessionId();
    if (targetId) {
      const session = this.getChatSession(targetId);
      if (session) {
        session.messages = [];
        session.lastActive = new Date().toISOString();
        this.saveChatSession(session);
        return;
      }
    }
    localStorage.removeItem(DB_KEYS.CHAT_MESSAGES);
  }

  // Reset database to seed
  public resetToDefaults(): void {
    localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify(SAMPLE_SEED_REPORTS));
    localStorage.removeItem(DB_KEYS.CHAT_MESSAGES);
    localStorage.removeItem(DB_KEYS.CHAT_SESSIONS);
    localStorage.removeItem(DB_KEYS.ACTIVE_SESSION_ID);
  }
}

export const localDb = new LocalDatabase();
