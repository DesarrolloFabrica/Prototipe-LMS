import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, ListFilter, Activity } from "lucide-react";
import { toast } from "sonner";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { MainContentContainer } from "@/components/layout/MainContentContainer";
import { FilterBar } from "@/components/shared/FilterBar";
import { StatusPill } from "@/components/shared/StatusPill";
import { PRIORITY_STYLES } from "@/lib/constants";
import { formatRequestDateLabel, requestCode, requestOwner, requestPriority } from "@/lib/requestDerived";
import { useRequestsStore } from "@/store/requestsStore";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/cn";

export function ReviewPage() {
  const requests = useRequestsStore((state) => state.requests);
  const loadRequests = useRequestsStore((state) => state.loadRequests);
  const reviewQueue = requests.filter((request) => request.status !== "aprobado");
  const pending = reviewQueue.length;
  const reducedMotion = useReducedMotion() === true;

  useEffect(() => {
    void loadRequests().catch((error) => toast.error(readError(error)));
  }, [loadRequests]);

  return (
    <MainContentContainer className="space-y-6">
      <RevealOnScroll viewportAmount={0.25} className="will-change-transform">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          {/* Fondo decorativo interno */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-50/50 blur-3xl" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center">
            <div className="flex-1 p-8 lg:p-12">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/20">
                  <Activity className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Live Operative Hub</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-slate-900">
                    Cola de <span className="text-blue-600">revisión</span>
                  </h1>
                </div>
              </div>
              
              <p className="max-w-xl text-base font-medium leading-relaxed text-slate-500">
                Monitoreo activo de activos técnicos. Cada entrada es auditada en tiempo real para asegurar la integridad del ecosistema.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 border border-slate-100 shadow-sm">
                  <span className="text-sm font-black text-slate-900">{pending} PENDIENTES</span>
                </div>
              </div>
            </div>

            {/* Drone: Integrated as a "Live Monitor" Badge */}
            <div className="p-8 lg:p-12 lg:pl-0 flex items-center justify-center">
              <div className="group relative h-40 w-40 overflow-hidden rounded-[2rem] bg-linear-to-br from-slate-50 to-slate-100/50 p-4 ring-1 ring-slate-200/60 shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <div className="h-24 w-24">
                    <DotLottieReact
                      src="/videos/Drone.lottie"
                      loop
                      autoplay
                      className="h-full w-full"
                    />
                  </div>
                  <span className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-blue-600">
                    Scanning_Active
                  </span>
                </div>
                {/* Rayo de escaneo decorativo */}
                <motion.div 
                  className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-400/50 to-transparent"
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll viewportAmount={0.15}>
        <FilterBar />
      </RevealOnScroll>

      <RevealOnScroll viewportAmount={0.12} className="overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-8 py-6">Materia & Contexto</th>
                <th className="px-4 py-6">Identificador</th>
                <th className="px-4 py-6">Status</th>
                <th className="px-4 py-6">Prioridad</th>
                <th className="px-4 py-6">Responsable</th>
                <th className="px-4 py-6">Timeline</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reviewQueue.map((p, i) => {
                const priority = requestPriority(p);
                const prio = PRIORITY_STYLES[priority] ?? "bg-slate-100 text-slate-700";
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.12 }}
                    transition={{
                      delay: reducedMotion ? 0 : i * 0.05,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                    className="group relative transition-all hover:bg-blue-50/30"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-110">
                          <ListFilter className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">{p.subject}</p>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100/50 px-2 py-1 rounded-md">
                        {requestCode(p)}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-5">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        prio
                      )}>
                        {priority}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-linear-to-br from-slate-100 to-slate-200 border border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {requestOwner(p).split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-bold text-slate-700">{requestOwner(p)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-xs font-bold text-slate-400">
                      {formatRequestDateLabel(p.createdAt)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link
                        to={`/review/${p.id}`}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-900 hover:text-white hover:ring-slate-900 active:scale-95"
                      >
                        Gestionar
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </RevealOnScroll>
    </MainContentContainer>
  );
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar la cola de revision.";
}
