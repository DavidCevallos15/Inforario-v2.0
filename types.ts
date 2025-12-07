export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  career?: string;
}

export interface ClassSession {
  id: string;
  subject: string;
  subject_faculty?: string; // 👈 NUEVO: Facultad específica de la materia
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  teacher: string;
  location: string;
  // Se eliminó la propiedad 'type' ('Teoría' | 'Práctica' | 'Unknown')
  color?: string;
  conflict?: boolean;
}

export interface Schedule {
  id?: string | number;
  title: string;
  academic_period?: string; // mapeado a columna semester en DB
  faculty?: string; // mapeado a columna faculty en DB
  sessions: ClassSession[]; // mapeado a columna data (jsonb)
  lastUpdated?: Date; // opcional: derivado de created_at en DB
}

export type ScheduleTheme = 'DEFAULT' | 'MINIMALIST' | 'SCHOOL' | 'NEON';

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
}

export enum Feature {
  UPLOAD = 'UPLOAD',
  PROCESS = 'PROCESS',
  RESOLVE_CONFLICT = 'RESOLVE_CONFLICT',
  EDIT_NAME = 'EDIT_NAME',
  SAVE_CLOUD = 'SAVE_CLOUD',
  CUSTOMIZE_COLOR = 'CUSTOMIZE_COLOR',
  DOWNLOAD_PDF = 'DOWNLOAD_PDF',
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];