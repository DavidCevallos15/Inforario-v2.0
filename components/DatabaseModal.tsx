import React, { useState } from 'react';
import { X, Database, Save, AlertTriangle, ExternalLink } from 'lucide-react';
import { saveSupabaseConfig, clearSupabaseConfig, isSupabaseConfigured } from '../services/supabase';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  
  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && key) {
      saveSupabaseConfig(url, key);
      // Window will reload automatically
    }
  };

  const handleReset = () => {
    if (confirm("¿Estás seguro de desconectar la base de datos real y volver al modo Demo?")) {
      clearSupabaseConfig();
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative border border-muted">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
          <X size={20} />
        </button>

        <div className="bg-muted/30 p-6 border-b border-muted flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-900/30 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Configuración de Base de Datos</h2>
            <p className="text-xs text-muted-foreground">Conecta tu propio proyecto de Supabase</p>
          </div>
        </div>

        <div className="p-6">
          {isConfigured ? (
             <div className="text-center py-4">
               <div className="w-12 h-12 bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Save size={24} />
               </div>
               <h3 className="font-bold text-foreground mb-2">Base de datos conectada</h3>
               <p className="text-sm text-muted-foreground mb-6">
                 La aplicación está utilizando tus credenciales personalizadas de Supabase.
               </p>
               <button 
                onClick={handleReset}
                className="px-4 py-2 bg-destructive/10 text-destructive font-medium rounded-lg hover:bg-destructive/20 transition-colors text-sm"
               >
                 Desconectar y volver a Modo Demo
               </button>
             </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg flex items-start gap-2 text-xs text-primary mb-4 border border-primary/20">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <p>
                  Obtén tus credenciales en el <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-bold hover:text-cyan-300">Dashboard de Supabase</a> {'->'} Settings {'->'} API.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Project URL</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full p-2.5 bg-background border border-muted rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Anon Public Key</label>
                <input 
                  type="password" 
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="w-full p-2.5 bg-background border border-muted rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Guardar y Recargar
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default DatabaseModal;