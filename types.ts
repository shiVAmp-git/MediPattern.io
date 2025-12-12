export interface JournalEntry {
  id: string;
  timestamp: string; // ISO String
  originalText: string;
  metrics: {
    painLevel: number; // 0-10
    sleepHours: number;
    mood: string;
    symptoms: string[];
  };
}

export interface AnalysisResult {
  metrics: {
    painLevel: number;
    sleepHours: number;
    mood: string;
    symptoms: string[];
  };
}

export type TabView = 'dashboard' | 'journal' | 'report' | 'history';