import React from 'react';
import { Github, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-t from-white/10 via-white/8 to-transparent backdrop-blur-md text-muted-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-primary font-bold text-lg">Inforario v2.0</h3>
          <p className="text-sm">Gestor Inteligente de Horarios UTM</p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Desarrollado por:</span>
            <span>David Cevallos, Estudiante de TI</span>
          </div>
          <div className="flex gap-4 mt-2">
             <a href="https://github.com/DavidCevallos15" className="hover:text-primary transition-colors flex items-center gap-1">
               <Github size={16} /> GitHub
             </a>
             <a href="https://wa.me/593983719418" className="hover:text-green-400 transition-colors flex items-center gap-1">
               <Phone size={16} /> +593 983 719 418
             </a>
             <span className="flex items-center gap-1">
               <MapPin size={16} /> Portoviejo, Ecuador
             </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;