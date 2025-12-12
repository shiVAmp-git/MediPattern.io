export interface JournalEntry {
  id: string;
  timestamp: string; // ISO String
  originalText: string;
  metrics: {
    painLevel: number; // 0-10
    sleepHours: number;
    mood: string;
    symptoms: string[];
    medicationStatus: 'Taken' | 'Missed' | 'Unspecified';
  };
}

export interface AnalysisResult {
  metrics: {
    painLevel: number;
    sleepHours: number;
    mood: string;
    symptoms: string[];
    medicationStatus: 'Taken' | 'Missed' | 'Unspecified';
  };
}

export interface Insight {
  text: string;
  type: 'positive' | 'warning' | 'info';
  timestamp: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  createdAt: string;
  latestInsight?: Insight;
}

export type TabView = 'dashboard' | 'journal' | 'report' | 'history';