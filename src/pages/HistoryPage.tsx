import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Database, Download, FileCheck, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { MainContentContainer } from "@/components/layout/MainContentContainer";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/shared/FilterBar";
import { StatusPill } from "@/components/shared/StatusPill";
import { motionEase } from "@/lib/animations";
import { formatRequestDateLabel, requestCode, requestOwner } from "@/lib/requestDerived";
import { useRequestsStore } from "@/store/requestsStore";

export function HistoryPage() {
  const reducedMotion = useReducedMotion() === true;
  const requests = useRequestsStore((state) => state.requests);
  const loadRequests = useRequestsStore((state) => state.loadRequests);
  const historyItems = requests.filter((request) => request.status === "aprobado");

  useEffect(() => {
    void loadRequests().catch((error) => toast.error(readError(error)));
  }, [loadRequests]);

  return (
    <MainContentContainer className="space-y-8 relative pb-20">
      {/* Fondo Tecnológico sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-slate-500/5 blur-[120px]" />
      </div>

      <RevealOnScroll viewportAmount={0.25}>
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200/50 bg-white p-8 shadow-2xl">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-slate-100/50 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 ring-1 ring-slate-200">
                <Database className="h-3 w-3" />
                Secure Archive Vault
              </div>
              <h1 className="bg-linear-to-br from-slate-900 to-slate-600 bg-clip-text text-4xl font-black tracking-tighter text-transparent sm:text-5xl">
                Archivo de cierres
              </h1>
              <p className="mt-4 text-lg font-medium leading-relaxed text-slate-500">
                Repositorio histórico de unidades finalizadas. Gestión centralizada de auditorías, cierres y activos.
              </p>
            </div>
            <Button 
              type="button" 
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-95 shrink-0"
            >
              <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              <span>Exportar Reporte</span>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Button>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll viewportAmount={0.15}>
        <FilterBar />
      </RevealOnScroll>

      <RevealOnScroll viewportAmount={0.1} className="overflow-hidden rounded-[32px] border border-slate-200/40 bg-white/70 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-8 py-6">Operación / Materia</th>
                <th className="px-6 py-6 text-center">Código</th>
                <th className="px-6 py-6">Responsable</th>
                <th className="px-6 py-6">Fecha Cierre</th>
                <th className="px-6 py-6">Estado Final</th>
                <th className="px-8 py-6 text-right">Repositorio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historyItems.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    delay: reducedMotion ? 0 : i * 0.05,
                    duration: reducedMotion ? 0.01 : 0.5,
                    ease: motionEase.out,
                  }}
                  className="group cursor-default transition-all duration-300 hover:bg-indigo-50/30"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all group-hover:bg-indigo-100 group-hover:text-indigo-600">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-black tracking-tight text-slate-900">{p.subject}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Audit</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="mx-auto w-fit rounded-lg border border-slate-100 bg-white px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-slate-600 shadow-sm transition-all group-hover:border-indigo-200 group-hover:text-indigo-600">
                      {requestCode(p)}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500 ring-1 ring-white">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{requestOwner(p)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs font-bold tabular-nums">{formatRequestDateLabel(p.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="scale-90 origin-left">
                      <StatusPill status={p.status} />
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {p.approvalLink ? (
                      <a
                        href={p.approvalLink}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Material
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Asset</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </RevealOnScroll>
    </MainContentContainer>
  );
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar el historico.";
}
