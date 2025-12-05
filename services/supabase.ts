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

export const supabase = isConfigured 
  ? createClient(activeUrl, activeKey)
  : {
      from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ error: { message: "No connection" } }) }) }) }),
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
  return !!isConfigured;
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

  if (schedule.id) {
    // Update
    const { data, error } = await supabase
      .from('schedules')
      .update({
        title: schedule.title,
        academic_period: schedule.academic_period,
        schedule_data: schedule.sessions,
        faculty: schedule.faculty,
        customization_settings: {
          // You can save theme/color/fontScale here if you extend the DB schema
        },
        last_updated: new Date().toISOString()
      })
      .eq('id', schedule.id)
      .select();
      
    if (error) throw error;
    return data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        user_id: userId,
        title: schedule.title,
        academic_period: schedule.academic_period,
        schedule_data: schedule.sessions,
        faculty: schedule.faculty,
        last_updated: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return data;
  }
};

export const getUserSchedules = async (userId: string) => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('schedules')
    .select('id, title, academic_period, last_updated')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getScheduleById = async (scheduleId: string) => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', scheduleId)
    .single();

  if (error) throw error;
  return data;
};

export const deleteSchedule = async (scheduleId: string) => {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);

  if (error) throw error;
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
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