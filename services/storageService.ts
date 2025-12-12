import { JournalEntry, PatientProfile, Insight } from '../types';

const PATIENTS_KEY = 'medipattern_patients';
const HISTORY_PREFIX = 'medipattern_history_';
const OLD_STORAGE_KEY = 'medipattern_history'; // For migration

const MOCK_DATA: JournalEntry[] = [
  {
    id: 'mock-today',
    timestamp: new Date().toISOString(),
    originalText: "Started the day feeling fresh. Slept a solid 8 hours. No pain at all. Took my vitamins.",
    metrics: {
      painLevel: 0,
      sleepHours: 8.0,
      mood: "Energetic",
      symptoms: [],
      medicationStatus: 'Taken'
    }
  },
  {
    id: 'mock-yesterday',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    originalText: "A bit anxious about the meeting. Stomach hurts a little (level 3). Forgot my meds this morning.",
    metrics: {
      painLevel: 3,
      sleepHours: 6.5,
      mood: "Anxious",
      symptoms: ["Stomach ache"],
      medicationStatus: 'Missed'
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
      symptoms: [],
      medicationStatus: 'Unspecified'
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
      symptoms: ["Fatigue"],
      medicationStatus: 'Taken'
    }
  },
  {
    id: 'mock-4days',
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    originalText: "Terrible night. Woke up multiple times. Headache is splitting. Too tired to take meds.",
    metrics: {
      painLevel: 8,
      sleepHours: 4.0,
      mood: "Irritable",
      symptoms: ["Headache", "Insomnia"],
      medicationStatus: 'Missed'
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
      symptoms: ["Mild back pain"],
      medicationStatus: 'Unspecified'
    }
  }
];

// Initialize and Migrate Logic
const initializeStorage = () => {
  const patientsJson = localStorage.getItem(PATIENTS_KEY);
  
  if (!patientsJson) {
    // Check for legacy data
    const oldHistory = localStorage.getItem(OLD_STORAGE_KEY);
    const defaultPatient: PatientProfile = { 
      id: 'default', 
      name: 'My Journal', 
      createdAt: new Date().toISOString(),
      latestInsight: {
        text: "Welcome to MediPattern. I'll analyze your trends here as you log entries.",
        type: 'info',
        timestamp: new Date().toISOString()
      }
    };

    localStorage.setItem(PATIENTS_KEY, JSON.stringify([defaultPatient]));

    if (oldHistory) {
      // Migrate old data to new format
      localStorage.setItem(`${HISTORY_PREFIX}default`, oldHistory);
      localStorage.removeItem(OLD_STORAGE_KEY);
    } else {
      // Initialize with mock data for default patient
      localStorage.setItem(`${HISTORY_PREFIX}default`, JSON.stringify(MOCK_DATA));
    }
    return [defaultPatient];
  }

  return JSON.parse(patientsJson) as PatientProfile[];
};

export const getPatients = (): PatientProfile[] => {
  try {
    return initializeStorage();
  } catch (e) {
    console.error("Error loading patients", e);
    return [];
  }
};

export const addPatient = (name: string): PatientProfile => {
  const patients = getPatients();
  const newPatient: PatientProfile = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
    latestInsight: {
      text: "Start logging to see AI insights about your health patterns.",
      type: 'info',
      timestamp: new Date().toISOString()
    }
  };
  
  patients.push(newPatient);
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  
  // Initialize empty history for new patient
  localStorage.setItem(`${HISTORY_PREFIX}${newPatient.id}`, JSON.stringify([]));
  
  return newPatient;
};

export const updatePatientInsight = (patientId: string, insight: Insight): PatientProfile[] => {
  const patients = getPatients();
  const index = patients.findIndex(p => p.id === patientId);
  if (index !== -1) {
    patients[index] = { ...patients[index], latestInsight: insight };
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  }
  return patients;
};

export const getHistory = (patientId: string): JournalEntry[] => {
  try {
    const key = `${HISTORY_PREFIX}${patientId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load history", error);
    return [];
  }
};

export const saveEntry = (entry: JournalEntry, patientId: string): JournalEntry[] => {
  const current = getHistory(patientId);
  const updated = [entry, ...current];
  localStorage.setItem(`${HISTORY_PREFIX}${patientId}`, JSON.stringify(updated));
  return updated;
};

export const clearHistory = (patientId: string): void => {
  localStorage.removeItem(`${HISTORY_PREFIX}${patientId}`);
};