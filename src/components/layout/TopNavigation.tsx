import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus } from "lucide-react";
import {
  DASHBOARD_NAV_SCROLL_TABS,
  DASHBOARD_SCROLL_TAB_IDS,
  DASHBOARD_SECTION_IDS,
  scrollToDashboardSection,
} from "@/lib/dashboardSectionIds";
import { scaleTap } from "@/lib/animations";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/cn";

export type TopNavigationVariant = "solid" | "glass";

/** Estilos base para la barra de navegación futurista */
const navShellBase = "relative flex items-center justify-between gap-4 transition-all duration-500 ease-out";

const glassShell =
  "rounded-[2rem] border border-white/20 bg-slate-950/40 px-4 py-2.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-3xl backdrop-saturate-200 ring-1 ring-white/10";

const solidShell =
  "rounded-[2rem] border border-slate-200 bg-white px-5 py-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl ring-1 ring-slate-900/5";

const LAYOUT_ID = "dashboard-nav-indicator";

export function TopNavigation({ variant = "solid" }: { variant?: TopNavigationVariant }) {
  const isGlass = variant === "glass";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  function handleNewSubmissionClick() {
  /**
   * Si ya estamos en dashboard, solo hacemos scroll al formulario.
   */
  if (pathname === "/dashboard") {
    document.getElementById("drive-submission-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    return;
  }

  /**
   * Si estamos en otra ruta, volvemos al dashboard.
   * El hash nos servirá para ubicar el formulario después.
   */
  navigate("/dashboard#drive-submission-form");
}

  const isDashboard = pathname === "/dashboard";
  const dashboardNavOverLight = useUIStore((s) => s.dashboardNavOverLight);
  const dashboardNavScrollActiveTo = useUIStore((s) => s.dashboardNavScrollActiveTo);
  const setDashboardNavScrollActiveTo = useUIStore((s) => s.setDashboardNavScrollActiveTo);
  const darkNav = isGlass && dashboardNavOverLight;


  const scrollToInicio = useCallback(() => {
    setDashboardNavScrollActiveTo(DASHBOARD_SCROLL_TAB_IDS.inicio);
    scrollToDashboardSection(DASHBOARD_SECTION_IDS.hero);
  }, [setDashboardNavScrollActiveTo]);

  const shellClass = isGlass ? glassShell : solidShell;

  return (
    <header className={cn("z-50", isGlass ? "px-4 pt-6 sm:px-8 sm:pt-8" : "sticky top-4 px-4 sm:px-6")}>
      <div className={cn(navShellBase, isGlass ? "mx-auto max-w-5xl" : "mx-auto max-w-7xl", shellClass)}>

        {/* Lado Izquierdo: Logo con estilo tecnológico */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            onClick={isDashboard && isGlass ? scrollToInicio : undefined}
            className="group relative flex items-center gap-3 outline-none"
          >
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-blue-500/40">
              <span className="relative z-10 text-[11px] font-black tracking-tighter text-white">CL</span>
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
            </div>
            <div className="flex flex-col">
              <span className={cn("text-[14px] font-black uppercase tracking-[0.25em] leading-tight transition-colors", isGlass ? "text-white" : "text-slate-900")}>
                Carga
              </span>
              <span className={cn("text-[9px] font-bold uppercase tracking-[0.45em] opacity-80", isGlass ? "text-white/70" : "text-indigo-600/80")}>
                System
              </span>
            </div>
          </Link>
        </div>

        {/* Centro: Navegación Flotante */}
        <nav className="hidden min-w-0 flex-1 justify-center md:flex" aria-label="Navegación principal">
          <div className={cn(
            "relative flex items-center gap-1 rounded-full p-1 ring-1",
            isGlass ? "bg-white/5 ring-white/10" : "bg-slate-100/50 ring-slate-200/50"
          )}>
            {DASHBOARD_NAV_SCROLL_TABS.map((tab: any) => {
              const isActive = tab.path
                ? pathname === tab.path
                : (isDashboard ? dashboardNavScrollActiveTo === tab.id : false);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.path) {
                      navigate(tab.path);
                      return;
                    }

                    if (isDashboard) {
                      setDashboardNavScrollActiveTo(tab.id);
                      scrollToDashboardSection(tab.sectionId);
                    } else {
                      window.location.href = `/dashboard#${tab.sectionId}`;
                    }
                  }}
                  className={cn(
                    "relative flex items-center justify-center rounded-full px-5 py-2 text-[12.5px] font-bold tracking-tight transition-all duration-300",
                    isActive
                      ? (isGlass ? "text-white" : "text-indigo-600")
                      : (isGlass ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900")
                  )}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId={LAYOUT_ID}
                        className={cn(
                          "absolute inset-0 z-0 rounded-full",
                          isGlass
                            ? "bg-white/15 shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
                            : "bg-white shadow-sm ring-1 ring-slate-200"
                        )}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Lado Derecho: Acciones y Perfil */}
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={scaleTap}>
            <button
              type="button"
              onClick={handleNewSubmissionClick}
              className={cn(
                "group relative flex items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[12.5px] font-bold tracking-tight text-white transition-all duration-300",
                "bg-linear-to-r from-blue-600 via-indigo-600 to-indigo-700 shadow-[0_10px_20px_-5px_rgba(59,130,246,0.5)] ring-1 ring-white/20"
              )}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              <span className="max-sm:hidden">Nueva carga</span>

              {/* Efecto de brillo de escaneo al pasar el mouse */}
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </motion.div>

          <div className={cn("hidden h-6 w-px sm:block", darkNav ? "bg-white/20" : "bg-slate-200")} />

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={scaleTap}
            type="button"
            onClick={() => navigate("/login")}
            className={cn(
              "group flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-semibold tracking-tight transition-all duration-300",
              darkNav
                ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:border-blue-200 hover:text-slate-900 hover:shadow-sm",
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="max-sm:hidden">Salir sesión</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={scaleTap}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-all duration-300",
              isGlass
                ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20 hover:bg-white/20"
                : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 hover:border-indigo-200 hover:shadow-md"
            )}
          >
            <span className="text-[11px] tracking-tighter">LM</span>
            {/* Indicador de estado con pulso */}
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></span>
            </span>
          </motion.button>
        </div>
      </div>

      {/* Detalle decorativo inferior (línea de luz sutil en modo glass) */}
      {isGlass && (
        <div className="mx-auto mt-2 h-px max-w-xs bg-linear-to-r from-transparent via-blue-500/20 to-transparent" />
      )}
    </header>
  );
}
