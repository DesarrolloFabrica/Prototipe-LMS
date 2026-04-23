import { useMemo, useRef, useState, useEffect} from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, User, Clock, Zap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { SelectableCardPanel } from "@/components/dashboard/SelectableCardPanel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Badge } from "@/components/ui/Badge";
import { StatusPill } from "@/components/shared/StatusPill";
import { DASHBOARD_SECTION_IDS } from "@/lib/dashboardSectionIds";
import { dashboardRouteShortcuts, processes } from "@/data/mockProcesses";
import { PRIORITY_STYLES } from "@/lib/constants";
import { techCoverImageForKey } from "@/lib/techCoverImages";
import { motionEase, motionDuration, scaleTap } from "@/lib/animations";
import type { DashboardActiveCard, Status } from "@/types";
import { cn } from "@/lib/cn";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";


function cardCoverUrl(p: DashboardActiveCard) {
  return p.coverImage ?? techCoverImageForKey(p.id);
}

function pipelineProgress(status: Status) {
  switch (status) {
    case "Submitted":
      return 28;
    case "In Review":
      return 52;
    case "Requires Finalization":
      return 78;
    case "Completed":
      return 100;
    default:
      return 20;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Componente de progreso futurista con brillo y animación de flujo */
function FuturisticProgress({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion() === true;
  const inView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <div className="mt-auto space-y-2" ref={ref}>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <span>Progreso del pipeline</span>
        <span className="text-indigo-500">{value}%</span>
      </div>
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50 shadow-inner"
        role="presentation"
        aria-hidden
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-cyan-500 via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(79,70,229,0.4)]"
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : { width: 0 }}
          transition={{
            duration: reduced ? 0.02 : 1.5,
            ease: motionEase.outExpo,
          }}
        >
          {/* Efecto de brillo que recorre la barra */}
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export function ActiveProcessesSection() {
  const reducedMotion = useReducedMotion() === true;
  const panelItems = useMemo((): DashboardActiveCard[] => {
    // Solo mostramos los atajos de rutas que son las tarjetas operativas principales
    return dashboardRouteShortcuts;
  }, []);

  return (
    <AnimatedSection
      id={DASHBOARD_SECTION_IDS.processes}
      className="relative overflow-hidden border-b border-slate-200/60 bg-[#f8fafc] py-16 sm:py-20 lg:py-24"
      reveal={false}
    >
      {/* Fondo Tecnológico Animado e Impactante */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Orbes de luz animados */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] left-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 100, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[100px]" 
        />

        {/* Cuadrícula técnica con pulsos de luz */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(79,70,229,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.2) 1px, transparent 1px)`,
          backgroundSize: "4rem 4rem"
        }} />
        
        {/* Pulso de luz horizontal */}
        <motion.div 
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-[200px] bg-linear-to-b from-transparent via-indigo-500/5 to-transparent opacity-50"
        />

        {/* Partículas flotantes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-indigo-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.5, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative mx-auto max-w-[min(1280px,calc(100%-2rem))] px-4 sm:px-6">
        <RevealOnScroll viewportAmount={0.2} className="will-change-transform">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle
              size="editorial"
              title="Procesos activos"
              subtitle="Ecosistema de gestión en tiempo real. Selecciona una unidad para interactuar con su flujo de trabajo."
            />
            <div className="mb-4 flex items-center gap-2 rounded-full border border-indigo-100 bg-white/50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-600 backdrop-blur-md shadow-sm sm:mb-1">
              <Zap className="h-3.5 w-3.5 fill-indigo-600" />
              Live System
            </div>
          </div>
        </RevealOnScroll>

        {panelItems.length === 0 ? (
          <p className="mt-8 text-sm text-slate-600">No hay procesos activos en el sistema.</p>
        ) : (
          <div className="mt-12">
            <SelectableCardPanel
              items={panelItems}
              getItemId={(p) => p.id}
              gridClassName="gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
                renderCard={({ item: p, index, selected, onSelect, detailPanelId }) => {
                  const prio = PRIORITY_STYLES[p.priority] ?? "bg-slate-100 text-slate-700";
                  const cover = cardCoverUrl(p);
                  const progress = pipelineProgress(p.status);
                  
                  // 1. Estados para el hover y para la instancia de Lottie
                  const [isHovered, setIsHovered] = useState(false);
                  const [dotLottie, setDotLottie] = useState<any>(null);

                  // 2. Referencia para capturar la instancia cuando el componente carga
                  const lottieRefCallback = (dotLottieInstance: any) => {
                    setDotLottie(dotLottieInstance);
                  };

                  // 3. Efecto para reaccionar al cambio de isHovered
                  useEffect(() => {
                    if (!dotLottie) return;

                    if (isHovered) {
                      dotLottie.play();
                    } else {
                      // Opcional: puedes usar .stop() si quieres que vuelva al frame 0
                      dotLottie.stop(); 
                    }
                  }, [isHovered, dotLottie]);

                    return (
                        <motion.div
                          className="group relative"
                          initial="hidden"
                          onHoverStart={() => setIsHovered(true)}
                          onHoverEnd={() => setIsHovered(false)}
                          whileInView="visible"
                          whileHover="hover"
                          viewport={{ once: true, amount: 0.1 }}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { 
                              opacity: 1, 
                              y: 0,
                              transition: {
                                duration: reducedMotion ? 0.01 : 0.6,
                                delay: reducedMotion ? 0 : index * 0.05,
                                ease: motionEase.out,
                              }
                            }
                          }}
                        >
                    {/* Borde animado en hover */}
                    <div className="absolute -inset-[1px] rounded-[2rem] bg-linear-to-r from-cyan-400 via-indigo-500 to-purple-600 opacity-0 blur-[2px] transition-opacity duration-500 group-hover:opacity-100" />

                    <Link
                      to={p.href}
                      onClick={onSelect}
                      aria-controls={detailPanelId}
                      className={cn(
                        "relative flex h-full flex-col overflow-hidden rounded-[2rem] border transition-all duration-500 ease-out",
                        selected
                          ? "border-transparent bg-white shadow-2xl ring-2 ring-indigo-500/20"
                          : "border-white/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl hover:bg-white/90 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]",
                      )}
                    >
                      {/* Detalles decorativos en esquinas */}
                      <div className="absolute right-6 top-6 z-20 flex gap-1 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <div className="h-1 w-4 rounded-full bg-indigo-500/30" />
                        <div className="h-1 w-1 rounded-full bg-indigo-500/30" />
                      </div>

                      <div className="relative aspect-16/9 overflow-hidden">
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        {/* Overlay futurista con patrón de escaneo */}
                        <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:10px_10px] opacity-20" />

                        {/* Efecto de línea de escaneo al pasar el mouse */}
                        <motion.div
                          className="absolute inset-x-0 h-[1px] bg-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                          initial={{ top: "-10%" }}
                          whileHover={{ top: ["0%", "100%"] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />

                        <div className="absolute inset-x-4 top-4 flex justify-between items-start">
                          <span className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/30 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-white shadow-lg backdrop-blur-md">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                            {p.code}
                          </span>
                        </div>

                        <div className="absolute inset-x-5 bottom-4">
                          <h3 className="text-lg font-bold tracking-tight text-white drop-shadow-lg sm:text-xl">
                            {p.subject}
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-6 pt-5">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <StatusPill status={p.status} />
                          <Badge
                            className={cn(
                              "border-0 bg-slate-100/80 px-3 text-[10px] uppercase tracking-widest text-slate-600 ring-1 ring-inset ring-slate-200/50",
                              prio,
                            )}
                          >
                            {p.priority}
                          </Badge>
                        </div>

                        {/* Nueva Sección: Fusión de Detalles e Inteligencia */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="flex-1 min-w-0">
                            <div className="mb-4 flex items-center gap-3">
                              <div className="relative">
                                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-linear-to-br from-indigo-50 to-slate-50 text-[11px] font-bold text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                                  {initials(p.owner)}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                  Lead Responsibility
                                </span>
                                <p className="truncate text-sm font-bold text-slate-800">{p.owner}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                              <Clock className="h-3 w-3" />
                              <span className="truncate">{p.timeLabel ?? p.updatedAt}</span>
                            </div>
                          </div>

                          {/* Inteligencia del Sistema: Ubicación dedicada y grande */}
                  <div className="relative flex flex-col items-center justify-center border-l border-slate-100 pl-4">
                          <div className="relative h-20 w-20">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-[20px] rounded-full animate-pulse" />
                            <DotLottieReact
                              src="/videos/Processing.lottie"
                              dotLottieRefCallback={lottieRefCallback} // Asignamos la instancia
                              loop
                              autoplay={false} // Desactivamos el inicio automático por defecto
                              className="h-full w-full"
                            />
                          </div>
                          <span className="mt-1 text-[8px] font-black uppercase tracking-[0.15em] text-indigo-500/80 text-center">
                            AI_AUDIT
                          </span>
                        </div>
                        </div>

                        <FuturisticProgress value={progress} />
                      </div>
                    </Link>
                  </motion.div>
                );
              }}
              renderDetail={(p) => {
                if (!p) return null;
                const prio = PRIORITY_STYLES[p.priority] ?? "bg-slate-100 text-slate-700";
                const progress = pipelineProgress(p.status);
                const cover = cardCoverUrl(p);
                return (
                  <div className="group relative mt-4 overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/40 p-1 shadow-2xl backdrop-blur-2xl">
                    {/* Borde gradiente sutil para el panel de detalle */}
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-cyan-500/10 opacity-50" />

                    <div className="relative overflow-hidden rounded-[2.25rem] bg-white shadow-sm">
                      <div className="flex flex-col lg:flex-row">
                        <div className="relative h-64 w-full shrink-0 overflow-hidden lg:h-auto lg:w-2/5">
                          <img src={cover} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-linear-to-r from-slate-950/80 via-slate-950/20 to-transparent" />
                          <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" />

                          <div className="absolute inset-x-8 bottom-8">
                            <Badge className="mb-4 border-white/20 bg-white/10 font-mono text-[12px] font-bold tracking-widest text-white backdrop-blur-md">
                              SYSTEM ID: {p.code}
                            </Badge>
                            <h3 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-2xl lg:text-4xl">
                              {p.subject}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-8 sm:p-10">
                          <div className="mb-8 flex flex-wrap items-center gap-4">
                            <StatusPill status={p.status} />
                            <Badge
                              className={cn(
                                "rounded-xl border-0 bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest",
                                prio,
                              )}
                            >
                              {p.priority}
                            </Badge>
                            <div className="flex items-center gap-3 text-sm font-semibold text-slate-400">
                              <div className="h-8 w-8 rounded-lg bg-indigo-50 p-0.5">
                                <DotLottieReact
                                  src="/videos/brain.lottie"
                                  loop
                                  autoplay
                                  className="h-full w-full"
                                />
                              </div>
                              Active Workflow Analysis
                            </div>
                          </div>

                          <div className="mb-10 grid gap-8 sm:grid-cols-2">
                            <div className="flex items-center gap-4">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                                <User className="h-6 w-6" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Propiedad de
                                </span>
                                <p className="text-lg font-bold text-slate-900">{p.owner}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 shadow-inner">
                                <Clock className="h-6 w-6" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Último registro
                                </span>
                                <p className="text-lg font-bold text-slate-900">{p.timeLabel ?? p.updatedAt}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex-1 max-w-md">
                              <FuturisticProgress value={progress} />
                            </div>
                            <Link
                              to={p.href}
                              className="group/btn relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 px-10 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-600 hover:shadow-2xl active:scale-95"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                Acceder al workspace
                                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                              </span>
                              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}

