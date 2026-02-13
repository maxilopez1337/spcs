
import { Question, User, ExamResult, CertificateLayout, SystemLog, LogModule } from '../types';
import { INITIAL_QUESTIONS as SEED_QUESTIONS } from '../constants';
import { DEFAULT_USERS } from '../data/defaultUsers';

const DB_KEYS = {
  QUESTIONS: 'stratton_questions',
  USERS: 'stratton_users',
  RESULTS: 'stratton_results',
  CURRENT_USER: 'stratton_current_user',
  CERT_TEMPLATE: 'stratton_cert_template',
  CERT_LAYOUT: 'stratton_cert_layout',
  DB_VERSION: 'stratton_db_version',
  ACTIVE_SESSION: 'stratton_active_session_lock',
  SYSTEM_LOGS: 'stratton_system_logs'
};

const CURRENT_DB_VERSION = 26; // Wymuszenie aktualizacji bazy

// WGRANY SZABLON CERTYFIKATU (Base64) - Czyste białe tło w wysokiej rozdzielczości A4
const EMBEDDED_CERT_TEMPLATE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4AAAAQ4CAIAAABs0g2CAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAA9ZSURBVHhe7dkxAcAAAMMg+zf9O2hgwIECAAAAAElFTkSuQmCC";

const generateRandomPassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

const DEFAULT_LAYOUT: CertificateLayout = {
  fullName: {
    visible: true,
    x: 49,
    y: 43, 
    fontSize: 37,
    color: '#002147',
    fontFamily: 'Playfair Display',
    fontWeight: 800,
    align: 'center'
  },
  hierarchicalId: {
    visible: true,
    x: 49,
    y: 54, 
    fontSize: 16,
    color: '#C5A059',
    fontFamily: 'Montserrat',
    fontWeight: 700,
    align: 'center'
  },
  date: {
    visible: true,
    x: 86,
    y: 87, 
    fontSize: 18,
    color: '#002147',
    fontFamily: 'Montserrat',
    fontWeight: 600,
    align: 'center'
  },
  hologram: {
    visible: false,
    x: 15,
    y: 21,
    fontSize: 165,
    color: '#000000',
    fontFamily: 'Montserrat',
    fontWeight: 400,
    align: 'center'
  }
};

export const storage = {
  init() {
    try {
        const storedVersion = parseInt(localStorage.getItem(DB_KEYS.DB_VERSION) || '0');
        
        if (!localStorage.getItem(DB_KEYS.QUESTIONS) || SEED_QUESTIONS.length === 0 || storedVersion < CURRENT_DB_VERSION) {
          localStorage.setItem(DB_KEYS.QUESTIONS, JSON.stringify(SEED_QUESTIONS));
        }
        
        const storedUsersJson = localStorage.getItem(DB_KEYS.USERS);
        
        if (storedVersion < CURRENT_DB_VERSION || !storedUsersJson) {
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
            localStorage.setItem(DB_KEYS.DB_VERSION, CURRENT_DB_VERSION.toString());
            this.saveCertLayout(DEFAULT_LAYOUT);
        }

        if (!localStorage.getItem(DB_KEYS.RESULTS)) {
          localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(DB_KEYS.CERT_LAYOUT)) {
          this.saveCertLayout(DEFAULT_LAYOUT);
        }
        
        if (!localStorage.getItem(DB_KEYS.SYSTEM_LOGS)) {
            localStorage.setItem(DB_KEYS.SYSTEM_LOGS, JSON.stringify([]));
        }

        if (!this.getCertTemplate()) {
            this.loadDefaultTemplateFromAssets();
        }
    } catch (e) {
        console.error("Krytyczny błąd inicjalizacji Storage:", e);
        localStorage.clear();
    }
  },

  // ... (funkcje loadDefaultTemplateFromAssets, saveBlobAsTemplate bez zmian) ...
  async loadDefaultTemplateFromAssets() {
    // Wymuszamy zawsze próbę pobrania /CERTYFIKAT.png z katalogu public
    try {
      const response = await fetch('/CERTYFIKAT.png');
      if (response.ok) {
        const blob = await response.blob();
        this.saveBlobAsTemplate(blob, 'System (CERTYFIKAT.png)');
        return;
      }
    } catch (e) {}
    // Jeśli fetch się nie powiedzie, fallback na wbudowany base64
    this.saveCertTemplate({ name: 'System Default', base64: EMBEDDED_CERT_TEMPLATE });
  },

  saveBlobAsTemplate(blob: Blob, name: string) {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        this.saveCertTemplate({ name, base64 });
    };
    reader.readAsDataURL(blob);
  },

  getQuestions(): Question[] {
    try { return JSON.parse(localStorage.getItem(DB_KEYS.QUESTIONS) || '[]'); } catch { return []; }
  },

  saveQuestions(questions: Question[]) {
    localStorage.setItem(DB_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  getResults(): ExamResult[] {
    try { return JSON.parse(localStorage.getItem(DB_KEYS.RESULTS) || '[]'); } catch { return []; }
  },

  getFailedAttemptsCount(email: string): number {
    const results = this.getResults();
    return results.filter(r => r.email === email && !r.passed).length;
  },

  hasPassed(email: string): boolean {
    const results = this.getResults();
    return results.some(r => r.email === email && r.passed);
  },

  saveResult(result: ExamResult) {
    const results = this.getResults();
    results.push(result);
    localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify(results));
    
    // Auto-log wyniku egzaminu
    this.addLog(
        result.passed ? "Zaliczony egzamin" : "Niezaliczony egzamin",
        `Użytkownik: ${result.userName} (${result.score}%)`,
        'EXAM'
    );
  },

  getCurrentUser(): User | null {
    try { return JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER) || 'null'); } catch { return null; }
  },

  setCurrentUser(user: User | null) {
    if (user) localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(DB_KEYS.CURRENT_USER);
  },

  getUsers(): User[] {
    try { return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]'); } catch { return []; }
  },

  saveUsers(users: User[]) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  },

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  saveCertTemplate(data: { name: string, base64: string } | null) {
    if (data) localStorage.setItem(DB_KEYS.CERT_TEMPLATE, JSON.stringify(data));
    else localStorage.removeItem(DB_KEYS.CERT_TEMPLATE);
  },

  getCertTemplate(): { name: string, base64: string } | null {
    try { return JSON.parse(localStorage.getItem(DB_KEYS.CERT_TEMPLATE) || 'null'); } catch { return null; }
  },

  saveCertLayout(layout: CertificateLayout) {
    localStorage.setItem(DB_KEYS.CERT_LAYOUT, JSON.stringify(layout));
  },

  getCertLayout(): CertificateLayout {
    try {
        const data = localStorage.getItem(DB_KEYS.CERT_LAYOUT);
        if (!data) return DEFAULT_LAYOUT;
        const parsed = JSON.parse(data);
        return {
            fullName: { ...DEFAULT_LAYOUT.fullName, ...parsed.fullName },
            hierarchicalId: { ...DEFAULT_LAYOUT.hierarchicalId, ...parsed.hierarchicalId },
            date: { ...DEFAULT_LAYOUT.date, ...parsed.date },
            hologram: { ...DEFAULT_LAYOUT.hologram, ...(parsed.hologram || {}) }
        };
    } catch { return DEFAULT_LAYOUT; }
  },

  startExamSession(email: string) { localStorage.setItem(DB_KEYS.ACTIVE_SESSION, email); },
  clearExamSession() { localStorage.removeItem(DB_KEYS.ACTIVE_SESSION); },
  checkActiveSession(email: string): boolean { return localStorage.getItem(DB_KEYS.ACTIVE_SESSION) === email; },

  // --- LOGI SYSTEMOWE (AUDIT TRAIL) ---
  
  getLogs(): SystemLog[] {
      try {
          return JSON.parse(localStorage.getItem(DB_KEYS.SYSTEM_LOGS) || '[]');
      } catch { return []; }
  },

  addLog(action: string, details: string, module: LogModule, targetId?: string) {
      const logs = this.getLogs();
      const currentUser = this.getCurrentUser();
      
      const newLog: SystemLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          actor: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System',
          action,
          details,
          module,
          targetId
      };

      // Trzymamy historię ostatnich 200 operacji
      const updatedLogs = [newLog, ...logs].slice(0, 200);
      localStorage.setItem(DB_KEYS.SYSTEM_LOGS, JSON.stringify(updatedLogs));
  },

  clearLogs() {
      localStorage.setItem(DB_KEYS.SYSTEM_LOGS, JSON.stringify([]));
  }
};
