import React, { useState } from 'react';
import { Calendar, Trash2, Plus, ArrowLeft, Check, CheckSquare } from 'lucide-react';
import { UserProfile } from '../types';

interface ScheduleSummary {
  id: string;
  title: string;
  academic_period?: string;
  last_updated?: string;
}

interface ScheduleListProps {
  user: UserProfile;
  schedules: ScheduleSummary[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onCreateNew: () => void;
  onBack?: () => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({ 
  user, 
  schedules, 
  onOpen, 
  onDelete,
  onBulkDelete,
  onCreateNew,
  onBack
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === schedules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(schedules.map(s => s.id));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 md:px-8 pt-6 pb-8">
      
      {/* Header: Greeting & Actions */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4">
          <div className="rgb-border-container w-full md:w-auto md:min-w-[500px]">
            <div className="rgb-border-content flex items-center gap-5 pr-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-inner ring-2 ring-white/10">
                  {user.full_name ? user.full_name[0] : user.email[0].toUpperCase()}
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">
                  Hola, {user.full_name?.split(' ')[0] || 'Estudiante'}
                </h2>
                <p className="text-muted-foreground font-medium">
                  Gestiona tus horarios académicos
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             {schedules.length > 0 && (
                <button 
                    onClick={toggleSelectAll}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border
                      ${selectedIds.length === schedules.length 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-card/50 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5'}
                    `}
                  >
                    <CheckSquare size={18} className={selectedIds.length === schedules.length ? "" : "opacity-50"} />
                    {selectedIds.length === schedules.length ? 'Deseleccionar' : 'Seleccionar Todo'}
                </button>
             )}

             <button 
               onClick={onCreateNew}
               className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
             >
               <Plus size={20} />
               <span>Nuevo Horario</span>
             </button>
          </div>
      </div>

      {/* Bulk Delete Alert */}
      {selectedIds.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
           <div className="flex items-center gap-3 text-destructive">
             <Trash2 size={20} />
             <span className="font-bold">{selectedIds.length} horarios seleccionados</span>
           </div>
           {onBulkDelete && (
              <button 
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-bold rounded-lg hover:bg-destructive/90 transition-colors"
                >
                Eliminar
              </button>
           )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
           {schedules.length === 0 ? (
              /* Empty State */
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity">
                 <div className="w-16 h-16 bg-gradient-to-tr from-muted/20 to-muted/5 rounded-full flex items-center justify-center mb-3 border border-white/5">
                    <Calendar size={28} className="text-muted-foreground" />
                 </div>
                 <p className="text-muted-foreground text-base">No hay horarios aún.</p>
                 <p className="text-xs text-muted-foreground/60">¡Crea el primero arriba!</p>
              </div>
           ) : (
              schedules.map(schedule => {
                 const isSelected = selectedIds.includes(schedule.id);
                 const formattedDate = schedule.last_updated
                  ? new Date(schedule.last_updated).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) 
                  : '';

                 return (
                    <div 
                      key={schedule.id}
                      onClick={() => onOpen(schedule.id)}
                      className={`
                        group relative bg-card/40 backdrop-blur-sm hover:bg-card/60 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col
                        ${isSelected ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'border-white/5 hover:border-white/20 hover:shadow-lg hover:-translate-y-1'}
                      `}
                    >
                       {/* Selection Circle */}
                       <div className="absolute top-2 left-2 z-20">
                          <div 
                            onClick={(e) => { e.stopPropagation(); toggleSelection(schedule.id); }}
                            className={`
                              w-4 h-4 rounded-full border flex items-center justify-center transition-all cursor-pointer
                              ${isSelected ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-black/40 border-white/30 hover:border-white text-transparent'}
                            `}
                          >
                            <Check size={10} strokeWidth={4} />
                          </div>
                       </div>

                       {/* Preview / Icon Area */}
                       <div className="h-28 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center relative group-hover:from-cyan-500/10 transition-colors duration-500 overflow-hidden">
                          
                          {/* Mock Schedule Background */}
                          <div className="absolute inset-4 opacity-10 group-hover:opacity-25 transition-all duration-700 transform group-hover:scale-110 group-hover:-rotate-2">
                             <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-1">
                                <div className="bg-cyan-400 rounded-[2px] col-span-1 row-span-2"></div>
                                <div className="bg-purple-400 rounded-[2px] col-span-2 row-span-1"></div>
                                <div className="bg-white rounded-[2px] col-span-1 row-span-1"></div>
                                <div className="bg-cyan-400 rounded-[2px] col-span-1 row-span-1"></div>
                                <div className="bg-purple-400 rounded-[2px] col-span-1 row-span-2"></div>
                                <div className="bg-white rounded-[2px] col-span-2 row-span-1"></div>
                             </div>
                          </div>

                          <Calendar size={32} className="relative z-10 text-white/20 group-hover:text-cyan-400/80 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3" />
                          
                          {/* Delete Action (Hover) */}
                          <button 
                            onClick={(e) => handleDeleteClick(e, schedule.id)}
                            className="absolute top-2 right-2 z-20 p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>

                       {/* Info */}
                       <div className="p-3 flex flex-col gap-0.5">
                          <h4 className="font-bold text-foreground text-sm truncate group-hover:text-cyan-400 transition-colors">{schedule.title}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{schedule.academic_period || 'Sin periodo'}</p>
                          <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                             <span className="text-[9px] text-muted-foreground/60">{formattedDate}</span>
                             <span className="text-[10px] text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 flex items-center gap-0.5">
                               Ver <ArrowLeft size={8} className="rotate-180" />
                             </span>
                          </div>
                       </div>
                    </div>
                 )
              })
           )}
        </div>

    </div>
  );
};

export default ScheduleList;