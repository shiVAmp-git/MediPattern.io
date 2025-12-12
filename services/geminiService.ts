import { GoogleGenAI, Type, Schema } from "@google/genai";
import { JournalEntry, AnalysisResult } from "../types";

// Initialize the client. The API_KEY is injected by the environment.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const PARSE_SYSTEM_INSTRUCTION = `
You are an expert medical AI assistant. Your task is to extract structured data from a patient's natural language journal entry.
Extract the following:
1. Pain Level (0-10 integer). If not mentioned, estimate based on tone or default to 0.
2. Sleep Hours (number).
3. Mood (string, e.g., "Anxious", "Happy", "Tired").
4. Symptoms (array of strings).
`;

const REPORT_SYSTEM_INSTRUCTION = `
You are a senior medical consultant AI. Analyze the provided patient history JSON.
Identify trends in pain, sleep, and mood over time.
Provide a professional summary suitable for a doctor to read.
Highlight correlations (e.g., "Poor sleep correlates with higher pain").
Use Markdown for formatting.
DO NOT provide a medical diagnosis.
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
      }
    },
    required: ["painLevel", "sleepHours", "mood", "symptoms"]
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
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
};

export const generateDoctorReport = async (history: JournalEntry[]): Promise<string> => {
  const ai = getAIClient();
  
  // Format history for the prompt to be token-efficient but readable
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