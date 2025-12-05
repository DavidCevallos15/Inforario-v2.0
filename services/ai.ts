import { GoogleGenAI, Type } from "@google/genai";
import { ClassSession } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ParseResult {
  sessions: ClassSession[];
  faculty?: string;
  academic_period?: string;
}

export const parseScheduleFile = async (base64Data: string, mimeType: string): Promise<ParseResult> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing");
    throw new Error("Falta la clave API de Gemini.");
  }

  // Remove data URL prefix (works for image/* and application/pdf)
  const cleanBase64 = base64Data.replace(/^data:(.*);base64,/, "");

  const prompt = `
    Analyze this document (University Schedule). It is a ${mimeType === 'application/pdf' ? 'PDF Document' : 'Image'}.
    
    EXTRACT METADATA:
    1. Faculty Name: Look for the name of the faculty at the top of the document. Example: "FACULTAD DE CIENCIAS INFORMÁTICAS" or "CARRERA DE INGENIERÍA".
    2. Academic Period: Look for the period date range. Example: "SEPTIEMBRE 2025 - ENERO 2026".

    EXTRACT SESSIONS:
    Extract all class sessions found in the visual layout or text.
    1. Extract the Subject Name.
    2. Identify the Day of the Week (Monday, Tuesday, Wednesday, Thursday, Friday). Ignore Saturdays or Sundays.
    3. Extract Start Time and End Time (24h format HH:mm).
    4. Extract the Teacher's name. Look for "DOCENTE", "PROF", or names associated with the class. Format strictly as "First Name First Surname" (e.g., convert "Ing. Marlon Antonio Navia" to "Marlon Navia"). Remove titles like "Ing.", "Lic.", "Dr.", "MSc.".
    5. Extract Location. NORMALIZE the location string. format strictly as "Aula [Room] - Piso [Floor]". Example: If "COD. AMB.: 1-59-2-04-A" -> "Aula 204 - Piso 2". If "1-58-2-04-A" -> "Aula 204 - Piso 2".
    6. Identify Type: 'Teoría' or 'Práctica'.

    Return a JSON Object containing the metadata and the array of sessions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faculty: { type: Type.STRING },
            academic_period: { type: Type.STRING },
            sessions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  day: { type: Type.STRING, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  teacher: { type: Type.STRING },
                  location: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Teoría", "Práctica", "Unknown"] },
                },
                required: ["subject", "day", "startTime", "endTime", "teacher", "location", "type"],
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return { sessions: [] };

    const rawData = JSON.parse(text);

    // Map sessions to our internal ID structure
    const processedSessions = (rawData.sessions || []).map((item: any) => ({
      id: crypto.randomUUID(),
      ...item,
      conflict: false, // Default
      color: "#3b82f6" // Default Blue
    }));

    return {
      sessions: processedSessions,
      faculty: rawData.faculty,
      academic_period: rawData.academic_period
    };

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw new Error("Error al analizar el horario. Por favor asegúrate de que el archivo sea legible y contenga un horario válido.");
  }
};