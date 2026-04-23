import type { LucideIcon } from "lucide-react";
import type { MutableRefObject, Ref } from "react";
import { forwardRef, useCallback, useEffect, useRef } from "react";

import {
  motion,
  useReducedMotion,
} from "framer-motion";

import { Activity, FilePlus, GitBranch, History, Sparkles, Binary, Cpu } from "lucide-react";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";



import {
  DASHBOARD_SCROLL_TAB_IDS,
  DASHBOARD_SECTION_IDS,
  scrollToDashboardSection,
} from "@/lib/dashboardSectionIds";
import {
  motionDuration,
  motionEase,
  reducedStaggerContainer,
  scaleTap,
  staggerItem,
} from "@/lib/animations";
import { useMediaMotionProfile } from "@/hooks/useMediaMotionProfile";
import { useParallaxMouse } from "@/hooks/useParallaxMouse";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/cn";

export type DashboardHeroProps = {
  statsLine: string;
};

function assignRef<T>(instanceRef: Ref<T> | undefined, node: T | null) {
  if (!instanceRef) return;
  if (typeof instanceRef === "function") instanceRef(node);
  else (instanceRef as MutableRefObject<T | null>).current = node;
}

const HERO_VIDEO_SRC = "/videos/192779-893446888.mp4";

const FLOW_LEGEND: { title: string; description: string; icon: LucideIcon; featured?: boolean }[] = [
  {
    title: "Pipeline",
    description: "Resumen de etapas y volumen de trabajo por fase.",
    icon: GitBranch,
    featured: true,
  },
  {
    title: "Revisión editorial",
    description: "Cola priorizada, QA y comentarios técnicos.",
    icon: Sparkles,
  },
  {
    title: "Altas de materia",
    description: "Registro de entregas con trazabilidad total.",
    icon: FilePlus,
  },
  {
    title: "Actividad en vivo",
    description: "Línea de tiempo de movimientos recientes.",
    icon: Activity,
  },
  {
    title: "Historial y cierres",
    description: "Documentación lista para auditoría final.",
    icon: History,
  },
];

export const DashboardHero = forwardRef<HTMLElement, DashboardHeroProps>(function DashboardHero(
  { statsLine },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const setDashboardNavScrollActiveTo = useUIStore((s) => s.setDashboardNavScrollActiveTo);
  const reducedMotion = useReducedMotion() === true;
  const { allowRichMotion } = useMediaMotionProfile();
  const [parallaxRef, parallax] = useParallaxMouse<HTMLElement>({ disabled: !allowRichMotion });

  const itemVariant = reducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.01 } },
      }
    : staggerItem;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    el.defaultMuted = true;
    const play = () => {
      const r = el.play();
      if (r !== undefined) void r.catch(() => {});
    };
    play();
    const onVis = () => {
      if (document.visibilityState === "visible") play();
      else el.pause();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const setMergedRef = useCallback(
    (node: HTMLElement | null) => {
      (parallaxRef as { current: HTMLElement | null }).current = node;
      assignRef(ref, node);
    },
    [ref, parallaxRef],
  );

  const goFlow = () => {
    setDashboardNavScrollActiveTo(DASHBOARD_SCROLL_TAB_IDS.procesos);
    scrollToDashboardSection(DASHBOARD_SECTION_IDS.flow);
  };

  const goNav = () => {
    setDashboardNavScrollActiveTo(DASHBOARD_SCROLL_TAB_IDS.procesos);
    scrollToDashboardSection(DASHBOARD_SECTION_IDS.processes);
  };

  const shiftX = parallax.enabled ? parallax.x * 10 : 0;
  const shiftY = parallax.enabled ? parallax.y * 8 : 0;
  const glowX = 50 + parallax.x * 12;
  const glowY = 42 + parallax.y * 10;
  const staggerParent = reducedStaggerContainer(reducedMotion);

  return (
    <div className="w-full min-h-dvh shrink-0 bg-[#020617]">
      <motion.section
        id={DASHBOARD_SECTION_IDS.hero}
        ref={setMergedRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionDuration.xl, ease: motionEase.outExpo }}
        className="relative flex h-dvh min-h-0 w-full shrink-0 flex-col overflow-hidden bg-slate-950 text-white"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            className="absolute inset-[-4%] h-[108%] w-[108%]"
            style={{ x: shiftX, y: shiftY }}
            transition={{ type: "spring", stiffness: 64, damping: 28 }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.8] contrast-[1.2] saturate-[1.3] opacity-100"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
            >
              <source src={HERO_VIDEO_SRC} type="video/mp4" />
            </video>
          </motion.div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-1 opacity-[0.3]"
          style={{
            background: `radial-gradient(ellipse 70% 60% at ${glowX}% ${glowY}%, rgba(59,130,246,0.3), transparent 80%)`,
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 z-1 bg-slate-950/40 backdrop-blur-[0.5px]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-linear-to-t from-slate-950 via-transparent to-white/5"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[min(1280px,calc(100%-2rem))] flex-1 flex-col justify-center py-14 pb-28 pt-23 sm:pt-16 sm:pb-32 md:pb-36 md:pt-28 lg:pb-40">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex max-w-xl flex-col justify-center text-left">
              <motion.div variants={staggerParent} initial="hidden" animate="visible" className="contents">
                <motion.div
                  variants={itemVariant}
                  className="mb-6 flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-400 backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                >
                  <Cpu className="h-3 w-3" />
                  Workspace Operativo v2.0
                </motion.div>
                
                <motion.h1
                  variants={itemVariant}
                  className="mb-6 bg-linear-to-br from-white via-slate-200 to-blue-400 bg-clip-text text-4xl font-black leading-[1.05] tracking-tight text-transparent drop-shadow-lg sm:text-6xl md:text-[4rem]"
                >
                  Control académico <br className="hidden sm:block" />
                  en un solo flujo
                </motion.h1>
                
                <motion.p
                  variants={itemVariant}
                  className="mb-6 max-w-lg text-base font-medium leading-relaxed text-slate-300 drop-shadow-md sm:text-xl"
                >
                  Orquesta entregas, revisiones y cierres con visibilidad total. Sistema de gestión unificada sin fricción.
                </motion.p>
                
                <motion.div variants={itemVariant} className="mb-10 flex items-center gap-4 text-xs font-bold tracking-widest text-blue-400/80">
                  <Binary className="h-4 w-4" />
                  {statsLine.toUpperCase()}
                </motion.div>

                <motion.div variants={itemVariant} className="flex flex-wrap gap-4">
                  <motion.button
                    type="button"
                    onClick={goFlow}
                    className="group relative flex h-12 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-blue-600 px-8 text-[14px] font-bold text-white shadow-2xl transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={scaleTap}
                  >
                    <span className="relative z-10">Comenzar flujo</span>
                    <GitBranch className="relative z-10 h-4 w-4 transition-transform group-hover:rotate-12" />
                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    onClick={goNav}
                    className="group flex h-12 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 text-[14px] font-bold text-white shadow-sm transition-all hover:bg-white/10 hover:border-white/20 backdrop-blur-md"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={scaleTap}
                  >
                    Ver pipeline
                    <Activity className="h-4 w-4 text-blue-400" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>

            <div className="flex items-center justify-center lg:justify-end">
              {/* Lottie Animation: Tech Coding Upload - Made larger and central */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: motionEase.outExpo, delay: 0.2 }}
                className="relative z-10 w-full max-w-[580px] aspect-square"
              >
                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
                <DotLottieReact
                  src="/videos/tech%20coding%20upload.lottie"
                  loop
                  autoplay
                  className="h-full w-full object-contain drop-shadow-[0_0_50px_rgba(59,130,246,0.4)]"
                />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-14 h-48 bg-linear-to-t from-slate-950 via-slate-950/80 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-4 md:px-8">
          <div className="pointer-events-auto w-full max-w-7xl">
            <ul className="flex list-none flex-row gap-4 overflow-x-auto rounded-[2.5rem] border border-white/10 bg-slate-900/40 p-4 shadow-2xl backdrop-blur-3xl [&::-webkit-scrollbar]:hidden">
              {FLOW_LEGEND.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.li
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className={cn(
                      "group relative flex min-w-64 flex-1 shrink-0 items-center gap-4 rounded-3xl border px-5 py-5 transition-all duration-500 sm:min-w-0",
                      item.featured
                        ? "border-blue-500/40 bg-blue-500/20 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.3)]"
                        : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10"
                    )}
                  >
                    {/* Detalles decorativos de módulo */}
                    <div className="absolute -left-px top-4 h-4 w-[2px] bg-blue-500/50 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute -right-px bottom-4 h-4 w-[2px] bg-blue-500/50 opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-500",
                      item.featured
                        ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        : "bg-white/5 text-slate-400 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    )}>
                      <Icon className="h-5 w-5" strokeWidth={2.5} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-1">
                      <p className={cn(
                        "text-[14px] font-bold tracking-tight transition-colors duration-300",
                        item.featured ? "text-white" : "text-slate-300 group-hover:text-white"
                      )}>
                        {item.title}
                      </p>
                      <p className="truncate text-[11px] font-medium text-slate-400 transition-colors group-hover:text-slate-300">
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Efecto de escaneo hover */}
                    <div className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl opacity-0 group-hover:opacity-100 pointer-events-none">
                      <motion.div 
                        className="absolute inset-y-0 w-px bg-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        animate={{ left: ["0%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.section>
    </div>
  );
});
