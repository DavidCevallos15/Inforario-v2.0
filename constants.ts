export const MOCK_USER_ID = "guest-user-id";

// Environment variables for Vite
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "";
export const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export const FEATURES = {
  GUEST: ['UPLOAD', 'PROCESS', 'RESOLVE_CONFLICT'],
  REGISTERED: ['UPLOAD', 'PROCESS', 'RESOLVE_CONFLICT', 'EDIT_NAME', 'SAVE_CLOUD', 'CUSTOMIZE_COLOR', 'DOWNLOAD_PDF']
};