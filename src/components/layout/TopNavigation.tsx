import { useCallback } from "react";
import { motion } from "framer-motion";
import { LogOut, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DASHBOARD_SCROLL_TAB_IDS,
  DASHBOARD_SECTION_IDS,
  scrollToDashboardSection,
} from "@/lib/dashboardSectionIds";
import { authApi } from "@/lib/api";
import { scaleTap } from "@/lib/animations";
import { useAuthStore } from "@/store/authStore";
import { useRequestsStore } from "@/store/requestsStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/cn";

export type TopNavigationVariant = "solid" | "glass";

const navShellBase = "relative flex items-center justify-between gap-4 transition-all duration-500 ease-out";

const glassShell =
  "rounded-[2rem] border border-white/20 bg-slate-950/40 px-4 py-2.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-3xl backdrop-saturate-200 ring-1 ring-white/10";

const solidShell =
  "rounded-[2rem] border border-slate-200 bg-white px-5 py-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl ring-1 ring-slate-900/5";

export function TopNavigation({ variant = "solid" }: { variant?: TopNavigationVariant }) {
  const isGlass = variant === "glass";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);
  const clearRequests = useRequestsStore((state) => state.clearRequests);
  const setUserRole = useUIStore((state) => state.setUserRole);
  const isDashboard = pathname === "/dashboard";
  const dashboardNavOverLight = useUIStore((state) => state.dashboardNavOverLight);
  const setDashboardNavScrollActiveTo = useUIStore((state) => state.setDashboardNavScrollActiveTo);
  const darkNav = isGlass && dashboardNavOverLight;
  const shellClass = isGlass ? glassShell : solidShell;

  function handleNewSubmissionClick() {
    if (pathname === "/dashboard") {
      document.getElementById("drive-submission-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    navigate("/dashboard#drive-submission-form");
  }

  const scrollToInicio = useCallback(() => {
    setDashboardNavScrollActiveTo(DASHBOARD_SCROLL_TAB_IDS.inicio);
    scrollToDashboardSection(DASHBOARD_SECTION_IDS.hero);
  }, [setDashboardNavScrollActiveTo]);

  const handleLogout = () => {
    void authApi.logout().finally(() => {
      clearSession();
      clearRequests();
      setUserRole("gif");
      navigate("/login");
    });
  };

  return (
    <header className={cn("z-50", isGlass ? "px-4 pt-6 sm:px-8 sm:pt-8" : "sticky top-4 px-4 sm:px-6")}>
      <div className={cn(navShellBase, isGlass ? "mx-auto max-w-5xl" : "mx-auto max-w-7xl", shellClass)}>
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
              <span
                className={cn(
                  "text-[14px] font-black uppercase leading-tight tracking-[0.25em] transition-colors",
                  isGlass ? "text-white" : "text-slate-900",
                )}
              >
                Carga
              </span>
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-[0.45em] opacity-80",
                  isGlass ? "text-white/70" : "text-indigo-600/80",
                )}
              >
                System
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={scaleTap}>
            <button
              type="button"
              onClick={handleNewSubmissionClick}
              className={cn(
                "group relative flex items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[12.5px] font-bold tracking-tight text-white transition-all duration-300",
                "bg-linear-to-r from-blue-600 via-indigo-600 to-indigo-700 shadow-[0_10px_20px_-5px_rgba(59,130,246,0.5)] ring-1 ring-white/20",
              )}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              <span className="max-sm:hidden">Nueva carga</span>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </motion.div>

          <div className={cn("hidden h-6 w-px sm:block", darkNav ? "bg-white/20" : "bg-slate-200")} />

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={scaleTap}
            type="button"
            onClick={handleLogout}
            className={cn(
              "group flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-semibold tracking-tight transition-all duration-300",
              darkNav
                ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:border-blue-200 hover:text-slate-900 hover:shadow-sm",
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="max-sm:hidden">Cerrar sesión</span>
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={scaleTap}
            title={user?.fullName ?? user?.email ?? "Usuario"}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-all duration-300",
              isGlass
                ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20 hover:bg-white/20"
                : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 hover:border-indigo-200 hover:shadow-md",
            )}
          >
            <span className="absolute inset-0 overflow-hidden rounded-xl">
              <span className="flex h-full w-full items-center justify-center text-[11px] tracking-tighter">
                {getUserInitials(user?.fullName ?? user?.email)}
              </span>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName ? `Foto de ${user.fullName}` : "Foto de usuario"}
                  className="absolute inset-0 h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </span>
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </motion.div>
        </div>
      </div>

      {isGlass ? (
        <div className="mx-auto mt-2 h-px max-w-xs bg-linear-to-r from-transparent via-blue-500/20 to-transparent" />
      ) : null}
    </header>
  );
}

function getUserInitials(value?: string | null) {
  if (!value) return "US";

  const [first = "", second = ""] = value
    .replace(/@.*/, "")
    .split(/\s|[._-]/)
    .filter(Boolean);

  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase() || "US";
}
