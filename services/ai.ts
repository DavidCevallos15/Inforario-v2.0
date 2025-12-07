import { GoogleGenAI, Type } from "@google/genai";
import { ClassSession } from "../types"; 
import { API_KEY } from "../constants";

interface ParseResult {
  sessions: ClassSession[];
  faculty?: string; 
  academic_period?: string;
}

// ------------------------------------------------------------------
// PROMPT DE INSTRUCCIÓN PARA LA IA
// ------------------------------------------------------------------
const systemPrompt = (mimeType: string) => `
    Analyze this document (University Schedule). It is a ${mimeType === 'application/pdf' ? 'PDF Document' : 'Image'}.
    
    EXTRACT METADATA (Document Level):
    1. Faculty Name (CARRERA's Faculty): Look for the name of the main faculty at the top of the document. Example: "FACULTAD DE CIENCIAS INFORMÁTICAS". This is the faculty of the overall schedule/career.
    2. Academic Period: Look for the period date range. Example: "SEPTIEMBRE 2025 - ENERO 2026".

    EXTRACT SESSIONS (Class Level):
    Extract all class sessions found in the visual layout or text.
    1. Extract the Subject Name.
    2. **Subject's Faculty Name:** Extract the name of the faculty associated with this specific subject. IMPORTANTE: Aunque la mayoría de las materias pertenezcan a la facultad general, debes analizar si el documento menciona una facultad diferente para alguna materia y extraer ese nombre específico.
    3. Identify the Day of the Week (Monday, Tuesday, Wednesday, Thursday, Friday). Ignore Saturdays or Sundays.
    4. Extract Start Time and End Time (24h format HH:mm).
    5. Extract the Teacher's name. Look for "DOCENTE", "PROF", or names associated with the class. Format strictly as "First Name First Surname" (e.g., convert "Ing. Marlon Antonio Navia" to "Marlon Navia"). Remove titles like "Ing.", "Lic.", "Dr.", "MSc.".
    6. Extract Location. NORMALIZE the location string. format strictly as "Aula [Room] - Piso [Floor]". Example: If "COD. AMB.: 1-59-2-04-A" -> "Aula 204 - Piso 2". If "1-58-2-04-A" -> "Aula 204 - Piso 2".

    Return a JSON Object containing the document metadata and the array of sessions.
`;
// ------------------------------------------------------------------

export const parseScheduleFile = async (base64Data: string, mimeType: string): Promise<ParseResult> => {
  // Use safe API Key from constants
  const apiKey = API_KEY;

  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("Falta la clave API de Gemini.");
  }

  // Initialize client here to avoid top-level ReferenceError if process is not defined during module load
  const ai = new GoogleGenAI({ apiKey });

  // Remove data URL prefix (works for image/* and application/pdf)
  const cleanBase64 = base64Data.replace(/^data:(.*);base64,/, "");
  
  const prompt = systemPrompt(mimeType); // Usamos la función del prompt aquí

  try {
    // Compatibility: some CDN builds expose models.generateContent instead of getGenerativeModel
    const useNewApi = typeof (ai as any).getGenerativeModel === "function";

    const response = useNewApi
      ? await (async () => {
          const model = (ai as any).getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
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
                        subject_faculty: { type: Type.STRING },
                        day: { type: Type.STRING, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
                        startTime: { type: Type.STRING },
                        endTime: { type: Type.STRING },
                        teacher: { type: Type.STRING },
                        location: { type: Type.STRING },
                      },
                      required: ["subject", "subject_faculty", "day", "startTime", "endTime", "teacher", "location"],
                    },
                  },
                },
              },
            },
          });
          const result = await model.generateContent({
            contents: [{
              role: "user",
              parts: [
                { inlineData: { mimeType, data: cleanBase64 } },
                { text: prompt },
              ],
            }],
          });
          return result.response?.text?.() || "";
        })()
      : await (async () => {
          const result = await (ai as any).models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
              parts: [
                { inlineData: { mimeType, data: cleanBase64 } },
                { text: prompt },
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
                        subject_faculty: { type: Type.STRING },
                        day: { type: Type.STRING, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
                        startTime: { type: Type.STRING },
                        endTime: { type: Type.STRING },
                        teacher: { type: Type.STRING },
                        location: { type: Type.STRING },
                      },
                      required: ["subject", "subject_faculty", "day", "startTime", "endTime", "teacher", "location"],
                    },
                  },
                },
              },
            },
          });
          return (result as any).text || "";
        })();

    if (!response) {
      throw new Error("La respuesta del modelo está vacía.");
    }

    const rawData = JSON.parse(response);

    // Polyfill UUID for older runtimes/browsers
    const uuid = (() => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID.bind(crypto);
      }
      // Fallback: RFC4122-ish random
      return () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    })();

    // Map sessions to our internal ID structure
    const processedSessions = (rawData.sessions || []).map((item: any) => ({
      id: uuid(),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...(({ type, ...rest }) => rest)(item), // Aseguramos que 'type' no se incluya
      conflict: false, // Default
      color: "#3b82f6" // Default Blue
    }));

    return {
      sessions: processedSessions,
      faculty: rawData.faculty,
      academic_period: rawData.academic_period
    };

  } catch (error: any) {
    console.error("Gemini Parse Error:", error?.message || error, error);
    throw new Error(error?.message || "Error al analizar el horario. Por favor asegúrate de que el archivo sea legible y contenga un horario válido.");
  }
};