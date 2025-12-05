import React, { useState } from 'react';
import { Calendar, X, Check, Loader2, Settings } from 'lucide-react';
import { GOOGLE_CLIENT_ID } from '../constants';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => Promise<void>;
  isSyncing: boolean;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onConfirm, isSyncing }) => {
  // Default: Start next Monday, End in 4 months
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7)); // Next Monday
  
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setMonth(defaultEnd.getMonth() + 4);

  const [startDate, setStartDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split('T')[0]);
  
  // Config State
  const [clientIdInput, setClientIdInput] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin.");
      return;
    }
    onConfirm(start, end);
  };

  const handleSaveConfig = () => {
    if (clientIdInput) {
      localStorage.setItem('google_client_id', clientIdInput);
      window.location.reload(); // Reload to re-initialize API services with new key
    }
  };

  const isConfigured = !!GOOGLE_CLIENT_ID;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-muted max-w-sm w-full overflow-hidden">
        
        <div className="bg-muted p-5 border-b border-muted flex justify-between items-center">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <div className="bg-green-900/30 text-green-400 p-1.5 rounded-lg">
              <Calendar size={20} />
            </div>
            Sincronizar Calendario
          </div>
          <button onClick={onClose} disabled={isSyncing} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!isConfigured ? (
             <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto">
                   <Settings size={24} />
                </div>
                <div>
                   <h3 className="font-bold text-foreground">Falta Configuración</h3>
                   <p className="text-xs text-muted-foreground mt-1">
                      No se detectó un Google Client ID. Por favor ingrésalo para habilitar la sincronización.
                   </p>
                </div>
                <input 
                  type="text" 
                  placeholder="Pegar Google Client ID aquí..."
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full p-2.5 bg-background border border-muted rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <button 
                  onClick={handleSaveConfig}
                  className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-cyan-300 transition-colors text-sm"
                >
                  Guardar y Recargar
                </button>
                <div className="text-[10px] text-muted-foreground bg-muted p-2 rounded">
                   El ID se guardará localmente en tu navegador.
                </div>
             </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Define el inicio y fin del semestre. Inforario creará eventos recurrentes en tu Google Calendar.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Inicio de Clases</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-background border border-muted rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none [color-scheme:dark]"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Fin de Clases</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-background border border-muted rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSyncing}
                className="w-full mt-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-cyan-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Confirmar Sincronización
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default CalendarModal;