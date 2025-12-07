import React, { useState, useEffect, useMemo } from 'react';
import { supabase, getUserSchedules, getScheduleById, deleteSchedule, saveScheduleToDB } from './services/supabase';
import { parseScheduleFile } from './services/ai';
// Google Calendar integration removed per request
import { UserProfile, Schedule, AppView, ClassSession, Feature, DAYS, ScheduleTheme } from './types';
import { FEATURES, API_KEY } from './constants';
import { LogOut, LayoutDashboard, Calendar as CalIcon, Download, Cloud, PenTool, Lock, Check, GraduationCap, RefreshCw, Palette, List, ZoomIn, ZoomOut, Loader2, Sparkles } from 'lucide-react';
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";

import Footer from './components/Footer';
import Uploader from './components/Uploader';
import ScheduleGrid from './components/ScheduleGrid';
import CSSBackground from './components/CSSBackground';
import PremiumModal from './components/PremiumModal';
import ConfirmResetModal from './components/ConfirmResetModal';
import CustomizerSidebar from './components/CustomizerSidebar';
import AuthModal from './components/AuthModal';
import ScheduleList from './components/ScheduleList';
import { EvervaultCard } from './components/ui/evervault-card';
import './globals.css';

// Feature Card now uses EvervaultCard
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <div className="h-[250px] w-full relative">
       <EvervaultCard text={title} icon={icon}>
          <p className="text-white/70">{description}</p>
       </EvervaultCard>
    </div>
  );
};

// Define cleanUserId function at the top
const cleanUserId = (id: string): string => {
  return id.startsWith('TU') ? id.substring(2) : id;
};

function AnimatedHeroTitle() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Académica Inteligente", "Universitaria Simple", "de Horarios Rápida", "Estudiantil Total", "Sin Conflictos"],
    []
  );

  // Rotación automática cada 2.5s
  useEffect(() => {
    const id = setInterval(() => {
      setTitleNumber(prev => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2500);
    return () => clearInterval(id);
  }, [titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-4 hero-tight items-center justify-center">
          <h1 className="text-3xl md:text-5xl max-w-full tracking-tighter text-center font-extrabold inline-flex items-center gap-4 justify-center whitespace-nowrap overflow-visible">
            <span className="text-foreground inline-block">Gestión</span>
            <motion.span 
              layout
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="font-extrabold inline-block pb-0 relative"
            >
              {/* Texto invisible para reservar ancho exacto del título actual y evitar reflow */}
              <span className="invisible select-none">{titles[titleNumber]}</span>

              {/* Overlay absoluto que hace la animación centrada sobre el texto reservado */}
              <span className="title-overlay">
                {titles.map((t, i) => (
                  <span
                    key={t}
                    className={`title-item ${titleNumber === i ? 'active' : (titleNumber > i ? 'up' : 'down')} bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500`}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    {t}
                  </span>
                ))}
              </span>
            </motion.span>
          </h1>
        </div>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<{ label: string; percent: number } | null>(null);
  
  // Saved Schedules State
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [showUploaderInDashboard, setShowUploaderInDashboard] = useState(false);

  // Title Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  
  // Customization State
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [theme, setTheme] = useState<ScheduleTheme>('DEFAULT');
  const [fontScale, setFontScale] = useState(1); // 1 = 100%

  // Premium Guard State
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Background disabled for performance

  // Calendar sync removed

  // Reset Confirmation State
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // UI Actions Menu State removed (direct download button)

  // Auth Listener
  useEffect(() => {
    // Initialize session and fetch schedules
    const initAuth = async () => {
      try {
        // Initialize session from Supabase
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const fetchedSession = data?.session;
        if (fetchedSession?.user) {
            const cleanId = cleanUserId(fetchedSession.user.id);
            const userData = {
              id: cleanId,
              email: fetchedSession.user.email!,
              full_name: fetchedSession.user.user_metadata?.full_name
            };
            setUser(userData);
            setSession(fetchedSession);
            fetchSchedules(cleanId);
        }

        // second getSession call removed to avoid redeclaration errors
      } catch (err: any) {
        console.error('Auth init error:', err);
        // If refresh token invalid, force sign out and clear session state so user can re-login
        const msg = err?.message || '';
        if (msg.includes('Refresh Token') || msg.includes('Invalid Refresh Token') || msg.includes('token not found')) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.warn('signOut failed during refresh-token handling', e);
          }
          try {
            // Try remove common supabase auth keys from localStorage to fully clear client state
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('@supabase/auth');
            localStorage.removeItem('supabase.auth');
          } catch (e) {
            // ignore
          }
          setUser(null);
          setSession(null);
          // Notify user to re-login
          alert('Tu sesión expiró o es inválida. Por favor inicia sesión de nuevo.');
        }
      }
    };
    initAuth();

    // Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const cleanId = cleanUserId(session.user.id);
        setUser({ 
          id: cleanId, 
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name 
        });
        fetchSchedules(cleanId);
      } else {
        setUser(null);
        setSavedSchedules([]);
      }
    });

    // Google API initialization removed

    return () => subscription.unsubscribe();
  }, []);

  const fetchSchedules = async (userId: string) => {
    try {
      const data = await getUserSchedules(userId);
      setSavedSchedules(data);
    } catch (error: any) {
      console.error("Error fetching schedules:", error?.message || error, error);
      // Surface minimal info to user to debug 400s
      alert("No se pudieron cargar horarios guardados. Verifica las credenciales de Supabase y que la tabla 'schedules' exista con RLS correcta.");
    }
  };

  // Helper to get Spanish feature names
  const getFeatureDisplayName = (feature: Feature) => {
    const map: Record<string, string> = {
      [Feature.EDIT_NAME]: "Editar Nombre",
      [Feature.SAVE_CLOUD]: "Guardar en Nube",
      [Feature.CUSTOMIZE_COLOR]: "Personalizar Colores",
      [Feature.DOWNLOAD_PDF]: "Descargar PDF",
      [Feature.RESOLVE_CONFLICT]: "Resolver Conflictos"
    };
    return map[feature] || feature.replace('_', ' ');
  };

  // Handlers
  const handleFeatureAccess = (feature: Feature) => {
    const isAllowed = user 
      ? FEATURES.REGISTERED.includes(feature) 
      : FEATURES.GUEST.includes(feature);

    if (!isAllowed) {
      setBlockedFeature(getFeatureDisplayName(feature));
      setPremiumModalOpen(true);
      return false;
    }
    return true;
  };

            // Fondo 3D deshabilitado para mejorar rendimiento en todos los dispositivos

  const handleUpload = async (file: File) => {
    if(!API_KEY) {
      alert("Falta la API Key de Gemini en la configuración.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep({ label: 'Subiendo 0%', percent: 0 });
    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        setProcessingStep({ label: 'Subiendo 50%', percent: 50 });
        // small delay to make the 50% visible for very small files
        setTimeout(() => setProcessingStep({ label: 'Extrayendo OCR', percent: 65 }), 120);
        const base64data = reader.result as string;
        const mimeType = file.type;
        try {
          // Indicate structure processing before parsing result resolves
          setProcessingStep({ label: 'Procesando estructura', percent: 80 });
          const { sessions, faculty, academic_period } = await parseScheduleFile(base64data, mimeType);
          setProcessingStep({ label: 'Generando horario', percent: 95 });
          
          let newSchedule: Schedule = {
            title: "Mi Horario Académico",
            sessions: sessions,
            lastUpdated: new Date(),
            academic_period: academic_period || "SEPTIEMBRE 2025 - ENERO 2026",
            faculty: faculty || "FACULTAD DE CIENCIAS INFORMÁTICAS"
          };
          
          // Auto-save if logged in
          if (user) {
            try {
              const savedData = await saveScheduleToDB(user.id, newSchedule);
              if (savedData) {
                newSchedule.id = savedData.id;
                fetchSchedules(user.id); // Refresh list
              }
            } catch (saveError) {
              console.error("Auto-save failed:", saveError);
            }
          }
          
          setCurrentSchedule(newSchedule);
          setView(AppView.DASHBOARD);
          setShowUploaderInDashboard(false);
          setFontScale(1); // Reset font scale on new upload
          
        } catch (err: any) {
          alert(err.message || "No se pudo procesar el documento.");
          console.error(err);
        } finally {
          setIsProcessing(false);
          setProcessingStep(null);
        }
      };
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Error al leer el archivo.");
    }
  };

  const handleLogin = async (mockData?: any) => {
    // Standard Supabase flow handled by subscription
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView(AppView.LANDING);
    setCurrentSchedule(null);
    setUser(null);
    setSession(null);
    setTheme('DEFAULT');
    setFontScale(1);
    setSavedSchedules([]);
    setShowUploaderInDashboard(false);
  };

  const handleConflictResolution = (session: ClassSession) => {
    alert(`Resolviendo conflicto para ${session.subject}.`);
  };

  const startEditingTitle = () => {
    if (handleFeatureAccess(Feature.EDIT_NAME) && currentSchedule) {
      setTempTitle(currentSchedule.title);
      setIsEditingTitle(true);
    }
  };

  const saveTitle = async () => {
    if (currentSchedule) {
      const updatedSchedule = { ...currentSchedule, title: tempTitle };
      setCurrentSchedule(updatedSchedule);
      
      // Persist change if logged in
      if (user && updatedSchedule.id) {
         await saveScheduleToDB(user.id, updatedSchedule);
         fetchSchedules(user.id); // Update list
      }
    }
    setIsEditingTitle(false);
  };

  const handleReset = () => {
    setResetModalOpen(true);
  };

  const confirmReset = () => {
    setCurrentSchedule(null);
    setView(AppView.LANDING);
    setIsEditingTitle(false);
    setResetModalOpen(false);
    setTheme('DEFAULT'); // Reset theme
    setFontScale(1);
    setShowUploaderInDashboard(false);
  };

  const handleSaveAndRegister = () => {
    setResetModalOpen(false);
    setAuthModalOpen(true); // Open Auth Modal instead of direct login
  };

  const handleCustomize = () => {
    if (handleFeatureAccess(Feature.CUSTOMIZE_COLOR)) {
      setCustomizerOpen(true);
    }
  };

  const handleColorChange = async (subject: string, color: string) => {
    if (!currentSchedule) return;
    
    // Update all sessions with this subject name
    const updatedSessions = currentSchedule.sessions.map(s => 
      s.subject === subject ? { ...s, color } : s
    );
    
    const updatedSchedule = { ...currentSchedule, sessions: updatedSessions };
    setCurrentSchedule(updatedSchedule);
    
    // Persist change if logged in
    if (user && updatedSchedule.id) {
        await saveScheduleToDB(user.id, updatedSchedule);
    }
  };

  // Font Size Actions
  const handleZoomIn = () => setFontScale(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setFontScale(prev => Math.max(prev - 0.1, 0.7));

  // Schedule List Actions
  const handleOpenSchedule = async (id: string) => {
    try {
      const fullSchedule = await getScheduleById(id);
      if (fullSchedule && fullSchedule.sessions) {
        setCurrentSchedule({
          id: fullSchedule.id,
          title: fullSchedule.title,
          academic_period: fullSchedule.academic_period,
          faculty: fullSchedule.faculty, 
          sessions: fullSchedule.sessions,
          lastUpdated: new Date()
        });
        setView(AppView.DASHBOARD);
      }
    } catch (e) {
      console.error(e);
      alert("Error al abrir el horario.");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este horario?")) {
      try {
        await deleteSchedule(id);
        // Optimistic update: Remove from UI immediately so it reflects the deletion instantly
        setSavedSchedules(prev => prev.filter(s => s.id !== id));
      } catch (e) {
        console.error("Error removing schedule", e);
        alert("No se pudo eliminar el horario. Por favor intente de nuevo.");
      }
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (confirm(`¿Estás seguro de eliminar ${ids.length} horarios seleccionados?`)) {
      try {
        await Promise.all(ids.map(id => deleteSchedule(id)));
        if (user) fetchSchedules(user.id);
      } catch (e) {
        console.error(e);
        alert("Ocurrió un error al eliminar los horarios.");
      }
    }
  };
  
  const handleBackToSchedules = () => {
    setView(AppView.LANDING);
    setCurrentSchedule(null);
    setShowUploaderInDashboard(false);
    setIsEditingTitle(false);
    setFontScale(1);
  };

  // Google Calendar integration removed

  // Helper to convert Hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const handleDownload = async () => {
    if(!handleFeatureAccess(Feature.DOWNLOAD_PDF) || !currentSchedule) {
      return;
    }

    setIsExporting(true);

    try {
      // Initialize jsPDF Landscape A4
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // --- Theme Configurations ---
      // Updated Themes for PDF export to match new look where appropriate
      const themeConfig = {
        DEFAULT: {
          bg: [10, 14, 39], // #0A0E27
          textMain: [224, 231, 255], // #E0E7FF
          textSec: [139, 146, 176], // Muted
          headerFill: [0, 240, 255], // Primary Cyan
          headerText: [10, 14, 39], // Dark Blue
          gridLines: [30, 39, 73], // Muted Dark
          timeText: [0, 240, 255], // Cyan
          font: "helvetica"
        },
        MINIMALIST: {
          bg: [255, 255, 255],
          textMain: [0, 0, 0],
          textSec: [50, 50, 50],
          headerFill: [255, 255, 255], // White
          headerText: [0, 0, 0], // Black text
          headerBorder: true,
          gridLines: [200, 200, 200], 
          timeText: [0, 0, 0],
          font: "times"
        },
        SCHOOL: {
          bg: [255, 253, 240], // Cream
          textMain: [67, 20, 7], // Dark Orange/Brown
          textSec: [124, 45, 18],
          headerFill: [255, 237, 213], // Orange 100
          headerText: [154, 52, 18], // Orange 800
          gridLines: [253, 186, 116], // Orange 300
          timeText: [194, 65, 12],
          font: "courier"
        },
        NEON: {
          bg: [15, 23, 42], // Slate 900
          textMain: [34, 211, 238], // Cyan 400
          textSec: [165, 243, 252],
          headerFill: [2, 6, 23], // Slate 950
          headerText: [34, 211, 238],
          gridLines: [22, 78, 99], // Cyan 900
          timeText: [8, 145, 178], // Cyan 600
          font: "courier"
        }
      };

      const style = themeConfig[theme === 'DEFAULT' ? 'DEFAULT' : theme];

      // Set Page Background
      doc.setFillColor(style.bg[0], style.bg[1], style.bg[2]);
      doc.rect(0, 0, 297, 210, 'F');

      // --- 1. Header Section ---
      const centerX = 148.5; // A4 Width 297mm / 2
      
      doc.setFont(style.font, "bold");
      doc.setFontSize(18 * fontScale); 
      doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]); 
      doc.text("UNIVERSIDAD TÉCNICA DE MANABÍ", centerX, 15, { align: "center" });
      
      doc.setFont(style.font, "normal");
      doc.setFontSize(12 * fontScale);
      doc.setTextColor(style.textSec[0], style.textSec[1], style.textSec[2]);
      
      // Dynamic Faculty Name
      const facultyName = currentSchedule.faculty || "FACULTAD DE CIENCIAS INFORMÁTICAS";
      doc.text(facultyName, centerX, 22, { align: "center" });

      // Metadata Line
      doc.setFontSize(10 * fontScale);
      doc.setTextColor(style.textMain[0], style.textMain[1], style.textMain[2]);
      // If user is not logged in, block export (extra guard even if handleFeatureAccess ran)
      if (!user) {
        setIsExporting(false);
        setBlockedFeature(getFeatureDisplayName(Feature.DOWNLOAD_PDF));
        setPremiumModalOpen(true);
        return;
      }

      // Use only the full name; do not fall back to the email
      const studentName = user?.full_name?.toUpperCase() || "ESTUDIANTE";
      const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      const academicPeriod = currentSchedule.academic_period || "SEPTIEMBRE 2025 - ENERO 2026";
      
      doc.text(`Estudiante: ${studentName}`, 15, 32);
      doc.text(`Período: ${academicPeriod}`, centerX, 32, { align: "center" });
      doc.text(`Generado: ${dateStr}`, 282, 32, { align: "right" });

      // --- 2. Grid Configuration ---
      const startX = 15;
      const startY = 40;
      const pageWidth = 297;
      const margin = 15;
      const usableWidth = pageWidth - (margin * 2);
      
      const timeColWidth = 20;
      const dayColWidth = (usableWidth - timeColWidth) / 5; // 5 Days
      
      // Calculate Hours Range
      let minHour = 7;
      let maxHour = 18;
      if (currentSchedule.sessions.length > 0) {
        let min = 24;
        let max = 0;
        currentSchedule.sessions.forEach(s => {
          const startH = parseInt(s.startTime.split(':')[0]);
          const endH = parseInt(s.endTime.split(':')[0]) + (s.endTime.includes(':30') ? 1 : 0);
          if (startH < min) min = startH;
          if (endH > max) max = endH;
        });
        minHour = Math.max(6, min);
        maxHour = Math.max(minHour + 4, max + 1);
      }
      
      // Dynamic Height Calculation based on scale
      // Base height is 15mm. We scale it up, but clamp it to avoid running off page excessively
      const hourHeight = Math.min(15 * fontScale, 20); 
      const totalGridHeight = (maxHour - minHour) * hourHeight;
      const headerHeight = 10;

      // --- 3. Draw Table Headers ---
      doc.setFillColor(style.headerFill[0], style.headerFill[1], style.headerFill[2]);
      doc.rect(startX, startY, usableWidth, headerHeight, 'F');
      if (theme === 'MINIMALIST') {
        doc.setDrawColor(0,0,0);
        doc.rect(startX, startY, usableWidth, headerHeight, 'S'); // Stroke for minimalist
      }
      
      doc.setTextColor(style.headerText[0], style.headerText[1], style.headerText[2]);
      // Scale header font
      doc.setFontSize(10 * fontScale);
      doc.setFont(style.font, "bold");
      
      // Time Header
      doc.text("Hora", startX + (timeColWidth/2), startY + 6.5, { align: "center" });
      
      // Days Headers
      const daysEs = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      daysEs.forEach((day, index) => {
        const xPos = startX + timeColWidth + (index * dayColWidth) + (dayColWidth/2);
        doc.text(day, xPos, startY + 6.5, { align: "center" });
      });

      // --- 4. Draw Grid Lines & Time Labels ---
      doc.setTextColor(style.timeText[0], style.timeText[1], style.timeText[2]);
      // Scale time labels
      doc.setFontSize(8 * fontScale);
      doc.setFont(style.font, "normal");
      
      // Vertical Lines
      doc.setDrawColor(style.gridLines[0], style.gridLines[1], style.gridLines[2]);
      doc.line(startX, startY, startX, startY + headerHeight + totalGridHeight); // Left
      doc.line(startX + timeColWidth, startY, startX + timeColWidth, startY + headerHeight + totalGridHeight); // Time separator
      
      for(let i=1; i<=5; i++) {
        const x = startX + timeColWidth + (i * dayColWidth);
        doc.line(x, startY, x, startY + headerHeight + totalGridHeight);
      }
      // Right most line
      doc.line(startX + usableWidth, startY, startX + usableWidth, startY + headerHeight + totalGridHeight);


      // Horizontal Lines & Times
      for (let i = 0; i < (maxHour - minHour); i++) {
        const y = startY + headerHeight + (i * hourHeight);
        const hour = minHour + i;
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        
        doc.text(timeStr, startX + timeColWidth - 2, y + 4, { align: "right" });
        doc.line(startX, y, startX + usableWidth, y);
      }
      // Bottom line
      doc.line(startX, startY + headerHeight + totalGridHeight, startX + usableWidth, startY + headerHeight + totalGridHeight);


      // --- 5. Draw Classes ---
      currentSchedule.sessions.forEach(session => {
        const dayIndex = DAYS.indexOf(session.day);
        if (dayIndex === -1) return; 

        const [startH, startM] = session.startTime.split(':').map(Number);
        const [endH, endM] = session.endTime.split(':').map(Number);

        const startOffsetMins = ((startH - minHour) * 60) + startM;
        const durationMins = ((endH * 60) + endM) - ((startH * 60) + startM);
        
        const cellX = startX + timeColWidth + (dayIndex * dayColWidth);
        const cellY = startY + headerHeight + ((startOffsetMins / 60) * hourHeight);
        const cellHeight = (durationMins / 60) * hourHeight;
        
        // Use user selected color if available (hex to RGB)
        let { r, g, b } = hexToRgb(session.color || '#00F0FF');
        if (session.conflict) { r=255; g=0; b=110; } // Conflict color pink

        // --- Theme-Specific Event Rendering ---
        if (theme === 'MINIMALIST') {
          // White box, black border, color strip on left
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0, 0, 0);
          doc.rect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 'FD'); // Fill and Draw
          
          // Color Strip
          doc.setFillColor(r, g, b);
          doc.rect(cellX + 0.5, cellY + 0.5, 2, cellHeight - 1, 'F');
          
          doc.setTextColor(0, 0, 0); // Black text

        } else if (theme === 'NEON' || theme === 'DEFAULT') {
          // Dark box, color border
          doc.setFillColor(21, 27, 59); // Dark Card Color
          doc.setDrawColor(r, g, b); // Color border
          doc.setLineWidth(0.5);
          doc.rect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 'FD');
          
          // Left strip for emphasis
          doc.setFillColor(r, g, b);
          doc.rect(cellX + 0.5, cellY + 0.5, 1.5, cellHeight - 1, 'F');

          doc.setTextColor(224, 231, 255); // Light Text

        } else if (theme === 'SCHOOL') {
           // Full color block with rounded corners
           doc.setFillColor(r, g, b);
           doc.roundedRect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 2, 2, 'F');
           doc.setTextColor(255, 255, 255); // White text on color
           
        } else {
          // FALLBACK
          doc.setFillColor(r, g, b);
          doc.roundedRect(cellX + 0.5, cellY + 0.5, dayColWidth - 1, cellHeight - 1, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
        }

        // Draw Text inside Box - SCALED
        const titleFontSize = 10 * fontScale; // Increased from 7
        doc.setFontSize(titleFontSize);
        doc.setFont(style.font, "bold");
        
        const textX = cellX + 3; // Little padding
        let textY = cellY + 3.5;
        
        // Auto-split text based on column width and font size
        const subjectLines = doc.splitTextToSize(session.subject, dayColWidth - 5);
        doc.text(subjectLines, textX, textY);
        
        textY += (subjectLines.length * (titleFontSize / 2)) + 0.5; // Adjusted spacing
        
        const detailsFontSize = 8 * fontScale; // Increased from 6
        doc.setFont(style.font, "normal");
        doc.setFontSize(detailsFontSize);
        
        // Add Subject Faculty (if exists) - NEW FEATURE
        if (session.subject_faculty) {
          doc.setFont(style.font, "italic");
          doc.setFontSize(detailsFontSize - 1);
          // Truncate if too long to keep neat
          const facultyText = session.subject_faculty.length > 30 ? session.subject_faculty.substring(0, 27) + '...' : session.subject_faculty;
          doc.text(facultyText, textX, textY);
          textY += (detailsFontSize / 2) + 0.5;
          doc.setFont(style.font, "normal");
          doc.setFontSize(detailsFontSize);
        }

        doc.text(`${session.startTime} - ${session.endTime}`, textX, textY);
        textY += (detailsFontSize / 2) + 0.5;
        
        if (session.teacher) {
          doc.text(session.teacher, textX, textY);
          textY += (detailsFontSize / 2) + 0.5;
        }
        
        if (session.location) {
           doc.text(session.location, textX, textY);
        }
      });

        // Build a safe filename containing the student's name
        const sanitizeFileName = (name: string) => {
          return name
            .normalize('NFD') // separate accents
            .replace(/[\u0300-\u036f]/g, '') // remove accents (diacritics)
            .replace(/[^\w\s-]/g, '') // remove non word chars
            .trim()
            .replace(/\s+/g, '_') // spaces to underscore
            .toLowerCase();
        };

        // Use only the full name for the filename; never use email
        const baseName = user?.full_name || 'estudiante';
        const safe = sanitizeFileName(baseName);
        const fileName = `${safe}_horario_utm.pdf`;

        doc.save(fileName);

    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("No se pudo generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  // Removed framer-motion variants: using simple CSS/static rendering for landing animations to reduce bundle/runtime.

  const Content = () => (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground relative z-10">
      {/* Navbar - Sticky at top, full width, no margin */}
      <nav className="sticky top-0 z-50 w-full bg-gradient-to-b from-white/10 via-white/6 to-transparent backdrop-blur-md h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.LANDING)}>
            <img src="/favicon.svg" alt="Inforario" className="w-10 h-10 rounded-xl bg-transparent object-cover shadow-[0_0_15px_rgba(0,240,255,0.35)]" />
            <span className="text-xl font-bold text-foreground">Inforario</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 pr-2 backdrop-blur-md">
                <div className="flex items-center gap-3 px-2">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-bold text-foreground leading-none">{user.full_name || user.email.split('@')[0]}</span>
                    <span className="text-[10px] text-muted-foreground">{user.email}</span>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner ring-1 ring-white/20">
                    {user.full_name ? user.full_name[0] : user.email[0].toUpperCase()}
                  </div>
                </div>
                <div className="h-5 w-px bg-white/10 mx-1"></div>
                <button 
                  onClick={handleLogout} 
                  className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl transition-transform transition-shadow duration-150 ease-out shadow-none hover:bg-[rgb(0,240,255)] hover:shadow-[0_0_20px_rgba(0,240,255,0.28)] hover:-translate-y-[2px]"
              >
                Acceso Estudiante
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content with adjusted padding since nav is sticky */}
      <main className="flex-grow container mx-auto px-4 pt-2 pb-8">
        
        {view === AppView.LANDING && (
          <div className="flex flex-col items-center pt-0 pb-8 w-full max-w-6xl mx-auto relative z-10">
            {/* If Logged In, show Schedule List unless manually uploading */}
            {user && !showUploaderInDashboard ? (
              <ScheduleList 
                user={user}
                schedules={savedSchedules}
                onOpen={handleOpenSchedule}
                onDelete={handleDeleteSchedule}
                onBulkDelete={handleBulkDelete}
                onCreateNew={() => setShowUploaderInDashboard(true)}
              />
            ) : (
              // Default Landing / Uploader View
              <>
                <div>
                  <AnimatedHeroTitle />
                </div>
                
                <p className="text-lg text-muted-foreground text-center max-w-2xl mb-6 font-medium">
                  Carga tu horario universitario (PDF/Imagen). Nuestra IA lo transforma en una agenda digital editable. Personalízalo a tu gusto, descárgalo en PDF o guárdalo en la nube para acceder desde cualquier dispositivo.
                </p>
                
                {/* Back button if in Dashboard mode logic */}
                {user && showUploaderInDashboard && (
                  <button 
                    onClick={() => setShowUploaderInDashboard(false)}
                    className="mb-4 text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    ← Volver a mis horarios
                  </button>
                )}

                <div className="w-full">
                  <Uploader onUpload={handleUpload} isProcessing={isProcessing} />
                </div>
                
                 <div className="mt-12 grid md:grid-cols-3 gap-8 text-center max-w-6xl w-full">
                  <FeatureCard 
                      icon={<LayoutDashboard size={24} />}
                      title="Extracción con IA"
                      description="Convierte instantáneamente tus documentos de matrícula en un horario digital interactivo."
                  />
                  <FeatureCard 
                      icon={<Cloud size={24} />}
                      title="Respaldo en Nube"
                      description="Accede a tu planificación académica desde cualquier dispositivo, en cualquier momento."
                  />
                  <FeatureCard 
                      icon={<CalIcon size={24} />}
                      title="Sincronización Total"
                      description="Exporta tus clases y eventos fácilmente para tenerlos siempre a mano."
                  />
                </div>
              </>
            )}
          </div>
        )}

        {view === AppView.DASHBOARD && currentSchedule && (
          <div className="animate-in fade-in duration-500 pt-2 relative z-10">
            
            {/* Header Card */}
            <div className="bg-card/70 backdrop-blur-md rounded-2xl shadow-lg border border-muted p-4 mb-4 relative z-20">
                <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
                  
                  <div className="flex items-start gap-4 w-full lg:w-auto">
                    <div className="hidden sm:flex w-12 h-12 bg-primary rounded-xl items-center justify-center text-primary-foreground shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                        <GraduationCap size={24} />
                    </div>

                    <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-1">
                          {isEditingTitle ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={tempTitle}
                                  onChange={(e) => setTempTitle(e.target.value)}
                                  className="text-xl md:text-2xl font-bold text-foreground border-b-2 border-primary outline-none bg-transparent min-w-[200px]"
                                  autoFocus
                                  onBlur={saveTitle}
                                  onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                                />
                                <button onClick={saveTitle} className="text-green-400 hover:text-green-300">
                                  <Check size={20} />
                                </button>
                              </div>
                            ) : (
                              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2 group cursor-pointer" onClick={startEditingTitle}>
                                {currentSchedule.title}
                                <span className="opacity-0 group-hover:opacity-100 text-muted-foreground">
                                  <PenTool size={14} />
                                </span>
                              </h2>
                            )}
                        </div>

                        {/* Updated Faculty / Career Line */}
                        <p className="text-muted-foreground font-medium text-sm mb-2">
                          {currentSchedule.faculty || "TECNOLOGIAS DE LA INFORMACION"}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          {user && (
                            <div className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1 rounded-lg text-[10px] md:text-xs font-semibold uppercase border border-border">
                              <UserIconSmall /> 
                              {user.full_name || user.email}
                            </div>
                          )}
                          
                          {currentSchedule.academic_period && (
                            <div className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1 rounded-lg text-[10px] md:text-xs font-semibold uppercase border border-border">
                              <CalIcon size={12} />
                              {currentSchedule.academic_period}
                            </div>
                          )}
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
                    
                    {/* Font Size Controls - Mobile Only */}
                    <div className="flex md:hidden items-center gap-1 bg-card border border-muted rounded-lg p-1 mr-2 shadow-sm">
                        <button onClick={handleZoomOut} className="p-1.5 hover:bg-muted rounded text-muted-foreground" title="Disminuir letra">
                          <ZoomOut size={16}/>
                        </button>
                        <span className="text-xs font-medium w-10 text-center text-foreground">{Math.round(fontScale * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-1.5 hover:bg-muted rounded text-muted-foreground" title="Aumentar letra">
                          <ZoomIn size={16}/>
                        </button>
                    </div>

                    {user && (
                      <button 
                        onClick={handleBackToSchedules}
                        className="flex-1 lg:flex-none justify-center px-4 py-2 bg-card border border-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted flex items-center gap-2 transition-colors"
                      >
                          <List size={16} />
                          Mis horarios
                      </button>
                    )}

                    <button 
                      onClick={handleReset}
                      className="flex-1 lg:flex-none justify-center px-4 py-2 bg-card border border-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted flex items-center gap-2 transition-colors"
                      title="Limpiar y crear nuevo"
                    >
                        <RefreshCw size={16} />
                        Nuevo
                    </button>
                    
                    <button 
                      onClick={handleCustomize}
                      className="flex-1 lg:flex-none justify-center px-4 py-2 bg-card border border-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                        <Palette size={16} />
                        Personalizar
                        {!user && <Lock size={14} className="text-muted-foreground ml-1" />}
                    </button>
                    
                    {/* Botón directo de descarga */}
                    <div className="relative z-50">
                        <button
                          onClick={() => handleDownload()}
                          disabled={isExporting}
                          className="flex-1 lg:flex-none justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center gap-2 transition-transform transition-shadow duration-150 ease-out shadow-none hover:bg-[rgb(0,240,255)] hover:shadow-[0_0_18px_rgba(0,240,255,0.3)] hover:-translate-y-[2px] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isExporting ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                          Descargar
                        </button>
                    </div>
                  </div>

                </div>
            </div>

            <div id="schedule-export-container" className="p-2 md:p-4 rounded-xl transition-all duration-300 bg-card/80 border border-muted/50 backdrop-blur-sm">
                <div className="flex flex-row gap-4 items-start">
                  
                  {/* Desktop Vertical Zoom Controls */}
                  <div className="hidden md:flex flex-col items-center gap-2 py-3 px-2 rounded-full shadow-lg border transition-colors sticky top-28 z-10 bg-card border-muted text-primary">
                      <button 
                        onClick={handleZoomIn} 
                        className="p-2 rounded-full transition-colors hover:bg-muted text-primary" 
                        title="Aumentar"
                      >
                        <ZoomIn size={20} />
                      </button>
                      
                      <div className="h-px w-4 bg-muted"></div>
                      
                      <span className="text-[10px] font-bold select-none text-foreground">{Math.round(fontScale * 100)}%</span>
                      
                      <div className="h-px w-4 bg-muted"></div>
                      
                      <button 
                        onClick={handleZoomOut} 
                        className="p-2 rounded-full transition-colors hover:bg-muted text-primary" 
                        title="Disminuir"
                      >
                        <ZoomOut size={20} />
                      </button>
                  </div>

                  <div className="flex-grow w-full">
                      <ScheduleGrid 
                        schedule={currentSchedule} 
                        isGuest={!user}
                        onResolveConflict={handleConflictResolution}
                        theme={theme}
                        fontScale={fontScale}
                      />
                  </div>
                </div>
            </div>
            
            {!user && (
              <div className="mt-8 p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-3">
                <div className="text-accent mt-1"><Lock size={20} /></div>
                <div>
                  <h4 className="font-bold text-accent text-sm">Modo Invitado Activo</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estás viendo un horario temporal. Para guardarlo permanentemente y sincronizarlo, por favor inicia sesión.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
      
      {/* Modals & Drawers */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />

      <PremiumModal 
        isOpen={premiumModalOpen} 
        onClose={() => setPremiumModalOpen(false)} 
        featureName={blockedFeature}
        onLoginRequest={() => { setPremiumModalOpen(false); setAuthModalOpen(true); }}
      />
      
      <ConfirmResetModal 
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={confirmReset}
        onSaveAndRegister={handleSaveAndRegister}
        isLoggedIn={!!user}
      />
      
      {currentSchedule && (
        <CustomizerSidebar
          isOpen={customizerOpen}
          onClose={() => setCustomizerOpen(false)}
          schedule={currentSchedule}
          onColorChange={handleColorChange}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      )}

      {/* Calendar Sync removed */}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full text-white overflow-hidden selection:bg-indigo-500 selection:text-white">
        <CSSBackground className="absolute inset-0 z-0 pointer-events-none" />
        <Content />
        <AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl"
            >
              <div className="w-full max-w-md p-8 flex flex-col items-center text-center relative">
                
                {/* Animated Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>

                {/* Icon Animation */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-slate-900 rounded-2xl border border-cyan-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                    <Sparkles size={40} className="text-cyan-400 animate-[spin_3s_linear_infinite]" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {processingStep?.label?.includes('Generando') ? 'Creando tu Horario' : 'Analizando Documento'}
                </h3>
                
                <p className="text-slate-400 mb-8 text-sm font-medium h-6">
                  {
                    processingStep?.label?.includes('Subiendo') ? '🚀 Subiendo tus archivos a la nube...' :
                    processingStep?.label?.includes('Extrayendo') ? '🧠 La IA está leyendo tu documento...' :
                    processingStep?.label?.includes('Procesando') ? '🎨 Organizando materias y colores...' :
                    processingStep?.label?.includes('Generando') ? '✨ Dando los toques finales...' : 
                    '🤖 Iniciando motores de inteligencia artificial...'
                  }
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800/50 h-4 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600"
                    initial={{ width: "0%" }}
                    animate={{ width: processingStep ? `${processingStep.percent}%` : "100%" }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-slide_1s_linear_infinite]"></div>
                  </motion.div>
                </div>

                <div className="mt-4 flex justify-between w-full text-xs font-mono text-cyan-500/70">
                  <span>PROCESANDO</span>
                  <span>{processingStep ? Math.round(processingStep.percent) : 0}%</span>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

// Helper component for the user icon in the pill
const UserIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export default App;