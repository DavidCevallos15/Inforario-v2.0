import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileImage, FileText, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploaderProps {
  onUpload: (file: File) => Promise<void>;
  isProcessing: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Iniciando...");
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulación de progreso divertido
  useEffect(() => {
    if (isProcessing) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          // Incremento aleatorio para que se sienta "vivo"
          return prev + Math.random() * 5;
        });
      }, 300);

      // Textos dinámicos según el progreso
      const textInterval = setInterval(() => {
        setProgress((currentProgress) => {
          if (currentProgress < 20) setStatusText("👀 Escaneando documento...");
          else if (currentProgress < 40) setStatusText("🧠 Entendiendo tu horario...");
          else if (currentProgress < 60) setStatusText("✨ Extrayendo materias mágicas...");
          else if (currentProgress < 80) setStatusText("🎨 Organizando colores y horas...");
          else setStatusText("🚀 ¡Casi listo para despegar!");
          return currentProgress;
        });
      }, 100);

      return () => {
        clearInterval(interval);
        clearInterval(textInterval);
      };
    } else {
      setProgress(0);
    }
  }, [isProcessing]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert("Por favor sube un archivo compatible: PNG, JPG, o PDF.");
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <div 
          className={`relative border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center min-h-[200px] text-center
            ${dragActive ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50 bg-card'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            onChange={handleChange}
            accept="image/*,application/pdf"
          />
          
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 text-primary">
            <Upload size={24} />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-1">Cargar Horario Académico</h3>
          <p className="text-muted-foreground mb-4 max-w-md text-sm">
            Arrastra tu archivo PDF o Imagen aquí.<br/>
            Nuestra IA extraerá la información automáticamente.
          </p>
          
          <button 
            onClick={() => inputRef.current?.click()}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-none transition-transform transition-shadow duration-150 ease-out hover:bg-[rgb(0,240,255)] hover:shadow-[0_0_16px_rgba(0,240,255,0.32)] hover:-translate-y-[2px]"
          >
            Seleccionar Archivo
          </button>
          
          <div className="mt-3 text-[10px] text-muted-foreground">
            Formatos soportados: PDF, PNG, JPG
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-lg p-5 border border-primary">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-primary">
                 {selectedFile.type === 'application/pdf' ? <FileText size={20} /> : <FileImage size={20} />}
               </div>
               <div>
                 <p className="font-medium text-foreground text-sm">{selectedFile.name}</p>
                 <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
               </div>
             </div>
             <button 
                onClick={() => setSelectedFile(null)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                disabled={isProcessing}
             >
               <X size={20} />
             </button>
          </div>
          
          <div className="relative w-full mt-6">
            <AnimatePresence mode="wait">
              {!isProcessing ? (
                <button
                  key="upload-btn"
                  onClick={handleSubmit}
                  className="group relative w-full overflow-hidden rounded-2xl bg-slate-950 p-px transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(0,240,255,0.3)]"
                >
                  {/* RGB Gradient Background (Hidden by default, visible on hover) */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00F0FF_0%,#7C3AED_25%,#FF006E_50%,#FFBE0B_75%,#00F0FF_100%)]" />
                  </div>

                  {/* Button Content */}
                  <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-slate-950 px-8 py-4 text-sm font-bold text-white transition-all duration-300 group-hover:bg-slate-950/90 group-hover:text-cyan-300">
                    <Sparkles size={20} className="mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                    <span className="tracking-wide">GENERAR MI HORARIO</span>
                  </div>
                </button>
              ) : (
                <motion.div
                  key="progress-bar"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-slate-900/50 rounded-2xl overflow-hidden relative h-14 border border-white/10 backdrop-blur-sm"
                >
                  {/* Barra de progreso animada */}
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                    style={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 40, damping: 15 }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[progress-slide_1s_linear_infinite]"></div>
                    
                    {/* Glow effect at the leading edge */}
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/50 blur-[4px]"></div>
                  </motion.div>
                  
                  {/* Texto de estado centrado */}
                  <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
                    <span className="text-xs md:text-sm font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] flex items-center gap-3 uppercase tracking-wider">
                      <Loader2 size={16} className="animate-spin text-white" />
                      {statusText} <span className="text-cyan-300">{Math.round(progress)}%</span>
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {isProcessing && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[10px] text-muted-foreground mt-3"
            >
              La IA está trabajando duro para ti... 🤖
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
};

export default Uploader;