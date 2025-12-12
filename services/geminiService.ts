import { GoogleGenAI, Type, Schema } from "@google/genai";
import { JournalEntry, AnalysisResult, Insight } from "../types";

// Initialize the client. The API_KEY is injected by the environment.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const PARSE_SYSTEM_INSTRUCTION = `
You are an expert medical AI assistant. Your task is to extract structured data from a patient's natural language journal entry.
Extract the following:
1. Pain Level (0-10 integer). If not mentioned, estimate based on tone or default to 0.
2. Sleep Hours (number).
3. Mood (string, e.g., "Anxious", "Happy", "Tired").
4. Symptoms (array of strings).
5. Medication Status (enum: 'Taken', 'Missed', 'Unspecified'). Look for keywords like "took meds", "forgot pills", etc.
`;

const REPORT_SYSTEM_INSTRUCTION = `
You are a senior medical consultant AI. Analyze the provided patient history JSON.
Identify trends in pain, sleep, and mood over time.
Provide a professional summary suitable for a doctor to read.
Highlight correlations (e.g., "Poor sleep correlates with higher pain").
Use Markdown for formatting.
DO NOT provide a medical diagnosis.
`;

const INSIGHT_SYSTEM_INSTRUCTION = `
You are a proactive medical health agent. 
Analyze the last few days of patient data. 
Identify ONE significant correlation or pattern (e.g., "Pain spikes when meds are missed" or "Sleep quality is improving").
Output a JSON object with:
- "text": A concise, single-sentence insight (max 20 words).
- "type": "warning" (if negative trend), "positive" (if positive trend), or "info" (neutral).
`;

export const parseJournalEntry = async (text: string): Promise<AnalysisResult> => {
  const ai = getAIClient();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      painLevel: { type: Type.INTEGER, description: "Pain scale from 0 to 10" },
      sleepHours: { type: Type.NUMBER, description: "Hours of sleep" },
      mood: { type: Type.STRING, description: "One or two word description of mood" },
      symptoms: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "List of identified physical symptoms" 
      },
      medicationStatus: { 
        type: Type.STRING, 
        enum: ['Taken', 'Missed', 'Unspecified'],
        description: "Whether the patient mentioned taking their medication" 
      }
    },
    required: ["painLevel", "sleepHours", "mood", "symptoms", "medicationStatus"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: PARSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
      const cleanText = response.text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleanText) as AnalysisResult;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
};

export const generateDoctorReport = async (history: JournalEntry[]): Promise<string> => {
  const ai = getAIClient();
  
  const historyContext = history.map(h => ({
    date: new Date(h.timestamp).toLocaleDateString(),
    metrics: h.metrics
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify(historyContext),
      config: {
        systemInstruction: REPORT_SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Report Generation Error:", error);
    return "Error generating report. Please check your connection or API limit.";
  }
};

export const generateTrendInsight = async (history: JournalEntry[]): Promise<Insight> => {
  const ai = getAIClient();
  
  // Use last 7 entries for recent trend analysis
  const recentHistory = history.slice(0, 7).map(h => ({
    d: new Date(h.timestamp).toLocaleDateString(),
    ...h.metrics
  }));

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['positive', 'warning', 'info'] }
    },
    required: ["text", "type"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify(recentHistory),
      config: {
        systemInstruction: INSIGHT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
      const cleanText = response.text.replace(/```json\n?|```/g, '').trim();
      const result = JSON.parse(cleanText);
      return {
        ...result,
        timestamp: new Date().toISOString()
      };
    }
    throw new Error("No insight generated");
  } catch (error) {
    console.error("Insight generation error:", error);
    return {
      text: "Unable to generate new insights at this moment.",
      type: 'info',
      timestamp: new Date().toISOString()
    };
  }
};