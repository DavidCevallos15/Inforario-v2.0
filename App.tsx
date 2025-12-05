import React, { useState, useEffect, useMemo } from 'react';
import { supabase, getUserSchedules, getScheduleById, deleteSchedule, saveScheduleToDB } from './services/supabase';
import { parseScheduleFile } from './services/ai';
import { initializeGoogleApi, syncScheduleToCalendar } from './services/googleCalendar';
import { UserProfile, Schedule, AppView, ClassSession, Feature, DAYS, ScheduleTheme } from './types';
import { FEATURES, API_KEY } from './constants';
import { LogOut, LayoutDashboard, Calendar as CalIcon, Download, Cloud, PenTool, Lock, Check, GraduationCap, RefreshCw, Palette, List, ZoomIn, ZoomOut, ChevronDown, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";
import { motion, Variants } from "framer-motion";

import Footer from './components/Footer';
import Uploader from './components/Uploader';
import ScheduleGrid from './components/ScheduleGrid';
import PremiumModal from './components/PremiumModal';
import ConfirmResetModal from './components/ConfirmResetModal';
import CustomizerSidebar from './components/CustomizerSidebar';
import AuthModal from './components/AuthModal';
import ScheduleList from './components/ScheduleList';
import CalendarModal from './components/CalendarModal';
import { EvervaultCard } from './components/ui/evervault-card';
import BackgroundDots from './components/BackgroundDots';
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

function AnimatedHeroTitle() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Académica Inteligente", "Universitaria Simple", "de Horarios Rápida", "Estudiantil Total", "Sin Conflictos"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-4 py-4 md:py-10 items-center justify-center flex-col">
          <h1 className="text-5xl md:text-7xl max-w-5xl tracking-tighter text-center font-extrabold flex flex-col gap-6 justify-center items-center">
            <span className="text-foreground drop-shadow-md">Gestión</span>
            <span className="relative flex w-[100vw] md:w-[70vw] justify-center overflow-hidden text-center h-[2em] items-center">
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 whitespace-nowrap pb-2"
                  initial={{ opacity: 0, y: 50 }}
                  animate={
                    titleNumber === index
                      ? {
                          y: 0,
                          opacity: 1,
                        }
                      : {
                          y: titleNumber > index ? -50 : 50,
                          opacity: 0,
                        }
                  }
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                >
                  {title}
                </motion.span>
              ))}
            </span>
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

  // Calendar Sync State
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // Reset Confirmation State
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // UI Actions Menu State
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    // Initialize session and fetch schedules
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
          const userData = { 
            id: session.user.id, 
            email: session.user.email!, 
            full_name: session.user.user_metadata?.full_name 
          };
          setUser(userData);
          setSession(session);
          fetchSchedules(session.user.id);
      }
    };
    initAuth();

    // Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name 
        });
        fetchSchedules(session.user.id);
      } else {
        setUser(null);
        setSavedSchedules([]);
      }
    });

    // Initialize Google API Client
    initializeGoogleApi().catch(console.error);

    return () => subscription.unsubscribe();
  }, []);

  const fetchSchedules = async (userId: string) => {
    try {
      const data = await getUserSchedules(userId);
      setSavedSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  // Helper to get Spanish feature names
  const getFeatureDisplayName = (feature: Feature) => {
    const map: Record<string, string> = {
      [Feature.EDIT_NAME]: "Editar Nombre",
      [Feature.SAVE_CLOUD]: "Guardar en Nube",
      [Feature.CUSTOMIZE_COLOR]: "Personalizar Colores",
      [Feature.DOWNLOAD_PDF]: "Descargar PDF",
      [Feature.SYNC_CALENDAR]: "Sincronizar Calendario",
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

  const handleUpload = async (file: File) => {
    if(!API_KEY) {
      alert("Falta la API Key de Gemini en la configuración.");
      return;
    }

    setIsProcessing(true);
    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const mimeType = file.type;
        try {
          const { sessions, faculty, academic_period } = await parseScheduleFile(base64data, mimeType);
          
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
              if (savedData && savedData[0]) {
                newSchedule.id = savedData[0].id; // Persist ID
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
      if (fullSchedule && fullSchedule.schedule_data) {
        setCurrentSchedule({
          id: fullSchedule.id,
          title: fullSchedule.title,
          academic_period: fullSchedule.academic_period,
          faculty: fullSchedule.faculty, 
          sessions: fullSchedule.schedule_data,
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

  // --- Google Calendar Logic ---
  const handleSyncClick = () => {
    if (handleFeatureAccess(Feature.SYNC_CALENDAR) && currentSchedule) {
      setCalendarModalOpen(true);
    }
  };

  const confirmSync = async (startDate: Date, endDate: Date) => {
    if (!currentSchedule) return;
    setIsSyncingCalendar(true);
    try {
      const result = await syncScheduleToCalendar(currentSchedule, startDate, endDate);
      if (result.success) {
        alert(result.message);
        setCalendarModalOpen(false);
      } else {
        alert(result.message);
      }
    } catch (e) {
      console.error(e);
      alert("Error inesperado en la sincronización.");
    } finally {
      setIsSyncingCalendar(false);
    }
  };

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
      const studentName = user?.full_name?.toUpperCase() || "INVITADO";
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
        const titleFontSize = 7 * fontScale;
        doc.setFontSize(titleFontSize);
        doc.setFont(style.font, "bold");
        
        const textX = cellX + 3; // Little padding
        let textY = cellY + 3.5;
        
        // Auto-split text based on column width and font size
        const subjectLines = doc.splitTextToSize(session.subject, dayColWidth - 5);
        doc.text(subjectLines, textX, textY);
        
        textY += (subjectLines.length * (titleFontSize / 2)); // Dynamic line height approx
        
        const detailsFontSize = 6 * fontScale;
        doc.setFont(style.font, "normal");
        doc.setFontSize(detailsFontSize);
        
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

      doc.save('mi_horario_utm.pdf');

    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("No se pudo generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  const Content = () => (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground relative z-10">
      {/* Navbar - Sticky at top, full width, no margin */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-white/10 h-20 shadow-lg">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.LANDING)}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] text-lg">I</div>
            <span className="text-xl font-bold text-foreground">Inforario</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3 text-sm text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
                    {user.full_name ? user.full_name[0] : user.email[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="hidden lg:block leading-tight text-foreground font-medium">{user.full_name || user.email}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-sm font-medium text-destructive hover:text-red-400 bg-white/5 p-2.5 rounded-full hover:bg-white/10 transition-colors">
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                Acceso Estudiante
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content with adjusted padding since nav is sticky */}
      <main className="flex-grow container mx-auto px-4 py-8">
        
        {view === AppView.LANDING && (
          <div className="flex flex-col items-center pt-10 pb-12 w-full max-w-6xl mx-auto relative z-10">
            {/* If Logged In, show Schedule List unless manually uploading */}
            {user && !showUploaderInDashboard ? (
              <ScheduleList 
                user={user}
                schedules={savedSchedules}
                onOpen={handleOpenSchedule}
                onDelete={handleDeleteSchedule}
                onBulkDelete={handleBulkDelete}
                onLogout={handleLogout}
                onCreateNew={() => setShowUploaderInDashboard(true)}
              />
            ) : (
              // Default Landing / Uploader View
              <>
                <motion.div
                  custom={0}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatedHeroTitle />
                </motion.div>
                
                <motion.p 
                  custom={1}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-lg text-muted-foreground text-center max-w-2xl mb-8 font-medium"
                >
                  Carga tu horario universitario (PDF/Imagen). Nuestra IA lo transforma en una agenda digital editable. Personalízalo a tu gusto, descárgalo en PDF o sincronízalo con Google Calendar.
                </motion.p>
                
                {/* Back button if in Dashboard mode logic */}
                {user && showUploaderInDashboard && (
                  <button 
                    onClick={() => setShowUploaderInDashboard(false)}
                    className="mb-4 text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    ← Volver a mis horarios
                  </button>
                )}

                <motion.div
                   custom={2}
                   variants={fadeUpVariants}
                   initial="hidden"
                   animate="visible"
                   className="w-full"
                >
                  <Uploader onUpload={handleUpload} isProcessing={isProcessing} />
                </motion.div>
                
                <motion.div 
                   custom={3}
                   variants={fadeUpVariants}
                   initial="hidden"
                   animate="visible"
                   className="mt-24 grid md:grid-cols-3 gap-8 text-center max-w-6xl w-full"
                >
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
                      description="Exporta tus clases a Google Calendar con alertas y recordatorios automáticos."
                  />
                </motion.div>
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
                    
                    {/* Botón de Acciones Dropdown (Exportar / Sync) */}
                    <div className="relative z-50">
                        <button 
                          onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                          className="flex-1 lg:flex-none justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-cyan-300 flex items-center gap-2 shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-colors"
                        >
                          <Download size={16} />
                          Exportar
                          <ChevronDown size={14} className={`transition-transform duration-200 ${actionsMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {actionsMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionsMenuOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-2xl border border-primary z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                              <button 
                                onClick={() => { setActionsMenuOpen(false); handleSyncClick(); }}
                                className="w-full text-left px-4 py-3 hover:bg-muted text-sm text-foreground font-medium flex items-center gap-3 border-b border-muted"
                              >
                                <div className="w-8 h-8 bg-green-900/30 text-green-400 rounded-lg flex items-center justify-center">
                                    <CalIcon size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span>Google Calendar</span>
                                    <span className="text-[10px] text-muted-foreground">Sincronizar Eventos</span>
                                </div>
                                {!user && <Lock size={12} className="text-muted-foreground ml-auto" />}
                              </button>
                              <button 
                                onClick={() => { setActionsMenuOpen(false); handleDownload(); }}
                                disabled={isExporting}
                                className="w-full text-left px-4 py-3 hover:bg-muted text-sm text-foreground font-medium flex items-center gap-3"
                              >
                                <div className="w-8 h-8 bg-red-900/30 text-destructive rounded-lg flex items-center justify-center">
                                    {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
                                </div>
                                <div className="flex flex-col">
                                    <span>Documento PDF</span>
                                    <span className="text-[10px] text-muted-foreground">Descargar Alta Calidad</span>
                                </div>
                                {!user && <Lock size={12} className="text-muted-foreground ml-auto" />}
                              </button>
                            </div>
                          </>
                        )}
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

      {/* Calendar Sync Modal */}
      <CalendarModal 
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        onConfirm={confirmSync}
        isSyncing={isSyncingCalendar}
      />
    </div>
  );

  return (
    <>
      {/* Global Background Shader */}
      <BackgroundDots theme={theme} />
      
      <div className="relative min-h-screen w-full text-white overflow-hidden selection:bg-indigo-500 selection:text-white">
          <Content />
      </div>
    </>
  );
};

// Helper component for the user icon in the pill
const UserIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export default App;