import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSaveAndRegister: () => void;
  isLoggedIn: boolean;
}

const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({ isOpen, onClose, onConfirm, onSaveAndRegister, isLoggedIn }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl shadow-2xl border border-muted max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">¿Estás seguro de volver?</h3>
          <p className="text-muted-foreground mb-6">
            {isLoggedIn 
              ? "Volverás a la pantalla principal." 
              : "Perderás todo tu progreso actual."}
          </p>
          
          <div className="flex flex-col gap-3">
             <button 
              onClick={onConfirm}
              className="w-full py-3 bg-transparent border-2 border-destructive/50 text-destructive font-medium rounded-lg hover:bg-destructive/10 hover:border-destructive transition-all"
            >
              Si, no hay problema
            </button>
            <button 
              onClick={isLoggedIn ? onClose : onSaveAndRegister}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              {isLoggedIn ? "No, regresar" : "No, registrarme y Guardar"}
            </button>
          </div>
          
           <button 
            onClick={onClose}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmResetModal;