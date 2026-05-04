import { SlidersHorizontal, Search, Layers, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";

export function FilterBar() {
  return (
    <div className="flex flex-col gap-4 rounded-[32px] border border-slate-200/40 bg-white/70 p-5 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-3 border-r border-slate-100 pr-6 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div>
          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Filtros</span>
          <span className="text-[11px] font-bold text-slate-800">Operativos</span>
        </div>
      </div>

      <div className="grid flex-1 gap-4 sm:grid-cols-3">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
          <Input 
            placeholder="Buscar materia o código" 
            className="pl-11 h-12 rounded-2xl border-slate-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
          />
        </div>
        <div className="relative group">
          <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
          <Input 
            placeholder="Estado" 
            className="pl-11 h-12 rounded-2xl border-slate-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
          />
        </div>
        <div className="relative group">
          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
          <Input 
            placeholder="Prioridad" 
            className="pl-11 h-12 rounded-2xl border-slate-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
          />
        </div>
      </div>
    </div>
  );
}
