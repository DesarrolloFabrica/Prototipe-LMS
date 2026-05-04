import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, ChevronRight, UserRound, LayoutPanelLeft, Sparkles, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { MainContentContainer } from "@/components/layout/MainContentContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { motionEase } from "@/lib/animations";
import { PIPELINE_COLUMN_ACCENT, PRIORITY_STYLES, REQUEST_STATUS_LABELS } from "@/lib/constants";
import { formatRequestDateLabel, requestCode, requestOwner, requestPriority } from "@/lib/requestDerived";
import { useRequestsStore } from "@/store/requestsStore";
import type { LmsRequest, Status } from "@/types";
import { cn } from "@/lib/cn";

const columns: Status[] = ["pendiente", "requiere_ajustes", "aprobado"];

/** Tarjeta de Pipeline con diseño de módulo técnico ligero */
function PipelineCard({ item }: { item: LmsRequest }) {
  const priority = requestPriority(item);
  const prio = PRIORITY_STYLES[priority] ?? "bg-slate-100 text-slate-700";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative"
    >
      {/* Resplandor de fondo suave en hover */}
      <div className="absolute -inset-2 rounded-[1.5rem] bg-blue-500/5 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className={cn(
        "relative flex flex-col overflow-hidden rounded-[1.5rem] border bg-white/80 p-5 transition-all duration-300 backdrop-blur-xl",
        "border-white shadow-[0_4px_15px_-5px_rgba(0,0,0,0.03)]",
        "group-hover:border-blue-400/40 group-hover:shadow-[0_15px_35px_-10px_rgba(37,99,235,0.08)] group-hover:bg-white/95"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold tracking-tight text-slate-800 line-clamp-2 transition-colors group-hover:text-blue-600">
              {item.subject}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="font-mono text-[9px] font-black uppercase tracking-widest text-slate-400/80">UNIT::{requestCode(item)}</span>
              <div className="h-1 w-1 rounded-full bg-blue-100" />
            </div>
          </div>
          <StatusPill status={item.status} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className={cn("rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ring-1 ring-inset shadow-xs", prio)}>
            {priority}
          </span >
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400/90">
            <UserRound className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{requestOwner(item)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400/90">
            <Calendar className="h-3 w-3" />
            <span>{formatRequestDateLabel(item.createdAt)}</span>
          </div>
        </div>

        <Link
          to={`/review/${item.id}`}
          className="group/btn mt-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-[11px] font-bold text-blue-700 transition-all hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <span className="flex items-center gap-2">
            Gestionar Proceso
            <Sparkles className="h-3 w-3 transition-transform group-hover/btn:rotate-12" />
          </span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>

        {/* Borde brillante animado sutil en hover */}
        <div className="absolute inset-0 rounded-[1.5rem] border-2 border-blue-400/0 transition-colors group-hover:border-blue-400/10 pointer-events-none" />
      </div>
    </motion.div>
  );
}

export function PipelinePage() {
  const reducedMotion = useReducedMotion() === true;
  const requests = useRequestsStore((state) => state.requests);
  const loadRequests = useRequestsStore((state) => state.loadRequests);

  useEffect(() => {
    void loadRequests().catch((error) => toast.error(readError(error)));
  }, [loadRequests]);

  return (
    <MainContentContainer className="relative space-y-10 py-8 lg:py-12">
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_70%)" aria-hidden />

      <RevealOnScroll viewportAmount={0.35}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <PageHeader
            title="Pipeline de Operación"
            description="Control de flujo en tiempo real con trazabilidad por nodo."
          />
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/50 px-4 py-2 shadow-sm backdrop-blur-md md:mb-0">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Sistema Seguro v1.2</span>
          </div>
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column, colIndex) => {
          const items = requests.filter((p) => p.status === column);
          const accentClass = PIPELINE_COLUMN_ACCENT[column] ?? "from-slate-400 to-slate-300";

          return (
            <motion.div
              key={column}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                delay: reducedMotion ? 0 : colIndex * 0.1,
                duration: 0.6,
                ease: motionEase.out,
              }}
              className="flex flex-col rounded-[2.5rem] border border-slate-200/50 bg-slate-50/40 p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-3xl lg:p-6"
            >
              {/* Encabezado de columna futurista */}
              <div className="mb-6 flex flex-col gap-4">
                <div className={cn("h-1.5 w-full rounded-full bg-linear-to-r shadow-sm", accentClass)} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-lg bg-linear-to-br", accentClass)} />
                    <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-900">
                      {REQUEST_STATUS_LABELS[column]}
                    </h2>
                  </div>
                  <span className="rounded-xl border border-white bg-white/60 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur-md">
                    {items.length}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30">
                    <LayoutPanelLeft className="mb-2 h-10 w-10 text-slate-400" strokeWidth={1} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sin procesos</span>
                  </div>
                ) : (
                  items.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{
                        delay: reducedMotion ? 0 : colIndex * 0.05 + i * 0.05,
                        duration: 0.4,
                      }}
                    >
                      <PipelineCard item={p} />
                    </motion.div>
                  ))
                )}
              </div>
              
              {/* Detalle decorativo al final de la columna */}
              <div className="mt-6 flex justify-center opacity-10">
                <div className="h-px w-1/2 bg-linear-to-r from-transparent via-slate-900 to-transparent" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </MainContentContainer>
  );
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar el pipeline.";
}
