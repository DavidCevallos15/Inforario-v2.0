import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL as DEFAULT_SUPABASE_URL, SUPABASE_KEY as DEFAULT_SUPABASE_KEY } from '../constants';
import { UserProfile, Schedule } from '../types';

// --- Client Initialization ---

// Check localStorage for user-provided credentials
const customUrl = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_url') : null;
const customKey = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_key') : null;

const activeUrl = customUrl || DEFAULT_SUPABASE_URL;
const activeKey = customKey || DEFAULT_SUPABASE_KEY;

// Robust initialization: fallback to a dummy object if keys are missing to prevent white-screen crashes.
const isConfigured = activeUrl && activeKey && !activeUrl.includes("placeholder");

// Dummy builder that allows chaining for any operation without crashing
// Prevents "Script error" if .delete() is called on an unconfigured client
const createDummyBuilder = () => {
  const errorResult = { data: null, error: { message: "Database not configured" } };
  const promise = Promise.resolve(errorResult);
  
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    lt: () => builder,
    gte: () => builder,
    lte: () => builder,
    in: () => builder,
    is: () => builder,
    like: () => builder,
    ilike: () => builder,
    contains: () => builder,
    match: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => promise,
    maybeSingle: () => promise,
    // Complete Promise Interface to ensure await works correctly
    then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => promise.then(onfulfilled, onrejected),
    catch: (onrejected?: (reason: any) => any) => promise.catch(onrejected),
    finally: (onfinally?: (() => void) | null) => promise.finally(onfinally)
  };
  return builder;
};

let client;
try {
  client = isConfigured ? createClient(activeUrl, activeKey) : null;
} catch (e) {
  console.warn("Supabase client initialization failed:", e);
  client = null;
}

export const supabase = client || {
      from: () => createDummyBuilder(),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ error: { message: "Database not configured" } }),
        signUp: () => Promise.resolve({ error: { message: "Database not configured" } }),
        resetPasswordForEmail: () => Promise.resolve({ error: { message: "Database not configured" } }),
        signInWithOAuth: () => Promise.resolve({ error: { message: "Database not configured" } }),
        signOut: () => Promise.resolve({ error: null })
      }
    } as any;

export const isSupabaseConfigured = () => {
  return !!client;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('custom_supabase_url', url);
  localStorage.setItem('custom_supabase_key', key);
  window.location.reload();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('custom_supabase_url');
  localStorage.removeItem('custom_supabase_key');
  window.location.reload();
};

// --- Database Operations ---

export const saveScheduleToDB = async (userId: string, schedule: Schedule) => {
  if (!isSupabaseConfigured()) return null;

  // Normalize id to numeric for bigint column
  const scheduleIdNumeric = typeof schedule.id === 'string' ? Number(schedule.id) : schedule.id;

  if (schedule.id) {
    // Update
    const { data, error } = await supabase
      .from('schedules')
      .update({
        title: schedule.title,
        data: schedule.sessions,
        faculty: schedule.faculty || null,
        semester: schedule.academic_period || null,
        is_active: true,
      })
      .eq('id', scheduleIdNumeric as any)
      .select();
      
    if (error) throw error;
    return data?.[0];
  } else {
    // Insert
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        user_id: userId,
        title: schedule.title,
        data: schedule.sessions,
        faculty: schedule.faculty || null,
        semester: schedule.academic_period || null,
        is_active: true,
      })
      .select();

    if (error) throw error;
    return data?.[0];
  }
};

export const getUserSchedules = async (userId: string) => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('schedules')
    .select('id, title, semester, faculty, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((item: any) => ({
    id: item.id != null ? String(item.id) : item.id,
    title: item.title,
    academic_period: item.semester,
    faculty: item.faculty || undefined,
    lastUpdated: item.created_at ? new Date(item.created_at) : undefined,
  }));
};

export const getScheduleById = async (scheduleId: string) => {
  if (!isSupabaseConfigured()) return null;

  const scheduleIdNumeric = typeof scheduleId === 'string' ? Number(scheduleId) : scheduleId;

  const { data, error } = await supabase
    .from('schedules')
    .select('id, title, data, faculty, semester, created_at')
    .eq('id', scheduleIdNumeric as any)
    .single();

  if (error) throw error;
  return data
    ? {
        id: data.id != null ? String(data.id) : data.id,
        title: data.title,
        sessions: data.data || [],
        faculty: data.faculty || undefined,
        academic_period: data.semester || undefined,
        lastUpdated: data.created_at ? new Date(data.created_at) : undefined,
      }
    : null;
};

export const deleteSchedule = async (scheduleId: string) => {
  if (!isSupabaseConfigured()) return;

  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
  } catch (err: any) {
    console.error("Delete error:", err);
    // Handle Supabase "Invalid login credentials" which happens if the user was deleted or token revoked
    if (err.message && (err.message.includes("Invalid login credentials") || err.message.includes("JWT"))) {
        throw new Error("Credenciales inválidas o sesión expirada. Por favor cierra sesión y vuelve a ingresar.");
    }
    // Handle generic Script error (CORS/Network issues often masked as Script error)
    if (err.message === "Script error.") {
        throw new Error("Error de conexión. Por favor verifica tu internet o intenta más tarde.");
    }
    throw err;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) return null;
  return data;
};

// --- Authentication Helpers ---

export const signInWithGoogle = async () => {
  // Google OAuth disabled per user request. Use email/password or OTP flows instead.
  throw new Error('Google sign-in disabled');
};

export const signInWithOtp = async (email: string, redirectTo?: string) => {
  const options: any = {};
  if (redirectTo) options.emailRedirectTo = redirectTo;
  const { data, error } = await supabase.auth.signInWithOtp({ email, options });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
   if (error) throw error;
   return data;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  if (error) throw error;
  return data;
};

export const resetPasswordForEmail = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
  return data;
}