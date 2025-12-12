import { JournalEntry } from '../types';

const STORAGE_KEY = 'medipattern_history';

const MOCK_DATA: JournalEntry[] = [
  {
    id: 'mock-today',
    timestamp: new Date().toISOString(),
    originalText: "Started the day feeling fresh. Slept a solid 8 hours. No pain at all.",
    metrics: {
      painLevel: 0,
      sleepHours: 8.0,
      mood: "Energetic",
      symptoms: []
    }
  },
  {
    id: 'mock-yesterday',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    originalText: "A bit anxious about the meeting. Stomach hurts a little (level 3).",
    metrics: {
      painLevel: 3,
      sleepHours: 6.5,
      mood: "Anxious",
      symptoms: ["Stomach ache"]
    }
  },
  {
    id: 'mock-2days',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    originalText: "Feeling pretty good! Went for a long walk in the park.",
    metrics: {
      painLevel: 1,
      sleepHours: 7.5,
      mood: "Happy",
      symptoms: []
    }
  },
  {
    id: 'mock-3days',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    originalText: "Better than yesterday. Took some ibuprofen. Still tired though.",
    metrics: {
      painLevel: 4,
      sleepHours: 6.0,
      mood: "Tired",
      symptoms: ["Fatigue"]
    }
  },
  {
    id: 'mock-4days',
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    originalText: "Terrible night. Woke up multiple times. Headache is splitting.",
    metrics: {
      painLevel: 8,
      sleepHours: 4.0,
      mood: "Irritable",
      symptoms: ["Headache", "Insomnia"]
    }
  },
  {
    id: 'mock-5days',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    originalText: "Feeling okay today, slept well but had vivid dreams. Back pain is mild.",
    metrics: {
      painLevel: 2,
      sleepHours: 7.0,
      mood: "Calm",
      symptoms: ["Mild back pain"]
    }
  }
];

export const getHistory = (): JournalEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    // Initialize with mock data if storage is empty or undefined
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
      return MOCK_DATA;
    }
    
    const parsed = JSON.parse(stored);
    
    // Also re-populate if the array is empty (optional, but good for demos)
    if (Array.isArray(parsed) && parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
      return MOCK_DATA;
    }
    
    return parsed;
  } catch (error) {
    console.error("Failed to load history", error);
    return [];
  }
};

export const saveEntry = (entry: JournalEntry): JournalEntry[] => {
  const current = getHistory();
  const updated = [entry, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};