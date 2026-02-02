// Development-only error logging utility
export const logError = (context: string, error: unknown) => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
};

export const logWarning = (context: string, message: string) => {
  if (import.meta.env.DEV) {
    console.warn(`[${context}]`, message);
  }
};
