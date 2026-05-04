import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { MainContentContainer } from "@/components/layout/MainContentContainer";
import { ActivityFeedItem } from "@/components/shared/ActivityFeedItem";
import { Card } from "@/components/ui/Card";
import { Activity, Zap, TrendingUp, Users, Terminal } from "lucide-react";
import { cn } from "@/lib/cn";
import { materiasApi } from "@/lib/api";
import { apiActivityToEntry } from "@/lib/requestDerived";
import type { ActivityEntry } from "@/types";

function countByType(activityFeed: ActivityEntry[]) {
  const m: Record<string, number> = {};
  for (const e of activityFeed) {
    m[e.type] = (m[e.type] ?? 0) + 1;
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

export function ActivityPage() {
  const [activityFeed, setActivityFeed] = useState<ActivityEntry[]>([]);
  const byType = countByType(activityFeed);
  const latest = activityFeed[0];
  const reducedMotion = useReducedMotion() === true;
  const actorCount = new Set(activityFeed.map((entry) => entry.actor)).size;

  useEffect(() => {
    void materiasApi
      .activity()
      .then((entries) => setActivityFeed(entries.map(apiActivityToEntry)))
      .catch((error) => toast.error(readError(error)));
  }, []);

  return (
    <MainContentContainer className="space-y-8 relative pb-20">
      {/* Fondo Tecnológico sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

      <RevealOnScroll viewportAmount={0.22}>
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200/50 bg-white p-8 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/5">
          {/* Decoración de esquina */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-50/50 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 ring-1 ring-indigo-100">
                <Activity className="h-3 w-3" />
                Live Analytics
              </div>
              <h1 className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-600 bg-clip-text text-4xl font-black tracking-tighter text-transparent sm:text-5xl">
                Actividad del workspace
              </h1>
              <p className="mt-4 text-lg font-medium leading-relaxed text-slate-500">
                Monitor de eventos en tiempo real. Análisis cronológico de interacciones, auditorías y flujo de materia.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:w-1/3">
              {[
                { label: "Eventos", val: activityFeed.length, icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Tipos", val: byType.length, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Actores", val: actorCount, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-center transition-all hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-xl shadow-sm", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                  <span className="text-xl font-black text-slate-900">{stat.val}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Línea de Tiempo Principal */}
        <div className="lg:col-span-8">
          <RevealOnScroll
            as="section"
            viewportAmount={0.1}
            className="rounded-[32px] border border-slate-200/40 bg-white/60 p-6 shadow-xl backdrop-blur-xl sm:p-10"
          >
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">Línea de tiempo</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operative Log Stream</p>
                </div>
              </div>
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>

            <div className="relative flex flex-col gap-2">
              {/* Línea vertical decorativa extendida */}
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-linear-to-b from-indigo-500 via-slate-200 to-transparent" />
              
              {activityFeed.length === 0 ? (
                <p className="pl-12 text-sm font-semibold text-slate-500">Aun no hay actividad real registrada.</p>
              ) : (
                activityFeed.map((a, i) => (
                  <ActivityFeedItem
                    key={a.id}
                    type={a.type}
                    text={a.text}
                    at={a.at}
                    time={a.time}
                    actor={a.actor}
                    linkedStatus={a.linkedStatus}
                    isLast={i === activityFeed.length - 1}
                    highlighted={i === 0}
                  />
                ))
              )}
            </div>
          </RevealOnScroll>
        </div>

        {/* Sidebar de Inteligencia */}
        <div className="space-y-6 lg:col-span-4">
          <RevealOnScroll
            as="aside"
            viewportAmount={0.12}
            transition={{ delay: reducedMotion ? 0 : 0.06 }}
          >
            <Card className="overflow-hidden rounded-[32px] border-white bg-white/70 p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Resumen por tipo</h2>
                <div className="h-1 w-8 rounded-full bg-indigo-500/20" />
              </div>
              <ul className="space-y-4">
                {byType.map(([label, n], i) => (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                      <span className="text-sm font-bold text-slate-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-12 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500" 
                  style={{ width: `${activityFeed.length === 0 ? 0 : (n / activityFeed.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-black text-slate-900">{n}</span>
                    </div>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 rounded-[2rem] bg-linear-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-xl shadow-indigo-500/20">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
                    <Zap className="h-3 w-3 fill-white" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Operative Insight</span>
                </div>
                <p className="text-sm font-bold leading-relaxed">{latest?.text ?? "Sin actividad reciente."}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] font-bold text-white/60">{latest?.actor ?? "Sistema"}</span>
                  <span className="text-[10px] font-black text-white/80">{latest?.time ?? "--:--"}</span>
                </div>
              </div>
            </Card>
          </RevealOnScroll>
        </div>
      </div>
    </MainContentContainer>
  );
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar la actividad.";
}
