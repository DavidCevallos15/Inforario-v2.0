export const MOCK_USER_ID = "guest-user-id";

// Safe env access that works in Vite (import.meta.env) and Node (process.env)
const getEnvVar = (key: string) => {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    // ignore
  }
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // ignore
  }
  return "";
};

// Prefer environment variables; allow browser overrides via localStorage only for Google client ID
export const SUPABASE_URL = getEnvVar("VITE_SUPABASE_URL") || "";
export const SUPABASE_KEY = getEnvVar("VITE_SUPABASE_KEY") || "";
export const API_KEY = getEnvVar("VITE_GEMINI_API_KEY") || "";

export const FEATURES = {
  GUEST: ['UPLOAD', 'PROCESS', 'RESOLVE_CONFLICT'],
  REGISTERED: ['UPLOAD', 'PROCESS', 'RESOLVE_CONFLICT', 'EDIT_NAME', 'SAVE_CLOUD', 'CUSTOMIZE_COLOR', 'DOWNLOAD_PDF']
};