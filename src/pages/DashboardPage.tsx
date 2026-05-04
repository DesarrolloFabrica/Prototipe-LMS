import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CoordinatorRequestsSection } from "@/components/coordinator/CoordinatorRequestSection";
import { DashboardEntryTransition } from "@/components/dashboard/DashboardEntryTransition";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DriveSubmissionSection } from "@/components/submissions/DriveSubmissionSection";
import { materiasApi } from "@/lib/api";
import type { AuthNavigationState, AuthProfile } from "@/lib/authExperience";
import { AUTH_EXPERIENCE_INTENSITY } from "@/lib/authExperience";
import {
  DASHBOARD_SECTION_ID_TO_NAV,
  dashboardSectionIdFromHash,
  scrollToDashboardSection,
} from "@/lib/dashboardSectionIds";
import { mapBackendRoleToUiRole, useAuthStore } from "@/store/authStore";
import { useRequestsStore } from "@/store/requestsStore";
import { useUIStore } from "@/store/uiStore";
import type { ApiSubjectMetrics } from "@/types";

const NAV_SWITCH_PX = 80;

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const heroDarkRef = useRef<HTMLElement | null>(null);
  const setDashboardNavOverLight = useUIStore((s) => s.setDashboardNavOverLight);
  const setDashboardNavScrollActiveTo = useUIStore((s) => s.setDashboardNavScrollActiveTo);
  const authUser = useAuthStore((state) => state.user);
  const navState = (location.state ?? null) as AuthNavigationState | null;
  /** Captura en el primer montaje: al limpiar `state` con `replace`, el perfil ya no debe cambiar a mitad de la animación. */
  const [entrySession] = useState<{ fromAuth: boolean; profile: AuthProfile }>(() => ({
    fromAuth: navState?.fromAuthTransition === true,
    profile: navState?.authProfile === "full" ? "full" : "reduced",
  }));
  const entryProfile: AuthProfile = entrySession.fromAuth ? entrySession.profile : "reduced";
  const [showEntryTransition, setShowEntryTransition] = useState(entrySession.fromAuth);
  const intensity = useMemo(
    () =>
      entrySession.fromAuth && entrySession.profile === "full"
        ? AUTH_EXPERIENCE_INTENSITY.full
        : AUTH_EXPERIENCE_INTENSITY.reduced,
    [entrySession.fromAuth, entrySession.profile],
  );
  const dashboardRevealDuration = entrySession.fromAuth && entrySession.profile === "full" ? 1.05 : 0.26;

  const fallbackUserRole = useUIStore((state) => state.userRole);
  const userRole = authUser ? mapBackendRoleToUiRole(authUser.role) : fallbackUserRole;
  const loadRequests = useRequestsStore((state) => state.loadRequests);
  const [metrics, setMetrics] = useState<ApiSubjectMetrics | null>(null);
  const activeCount = metrics?.active ?? 0;
  const pendingCount = metrics?.pending ?? 0;
  const todayCount = metrics?.today ?? 0;
  const statsLine =
    userRole === "coordinador"
      ? `Panel de coordinación · ${activeCount} procesos activos · ${pendingCount} pendientes`
      : `${activeCount} procesos activos · ${pendingCount} pendientes · ${todayCount} solicitudes de hoy`;

  useEffect(() => {
    if (!authUser) return;
    void Promise.all([loadRequests(), materiasApi.metrics()])
      .then(([, nextMetrics]) => setMetrics(nextMetrics))
      .catch(() => {
        // Las secciones operativas muestran feedback puntual si una petición falla.
      });
  }, [authUser, loadRequests]);

  useEffect(() => {
    const tick = () => {
      const el = heroDarkRef.current;
      if (!el) return;
      const bottom = el.getBoundingClientRect().bottom;
      setDashboardNavOverLight(bottom < NAV_SWITCH_PX);
    };
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
      setDashboardNavOverLight(false);
    };
  }, [setDashboardNavOverLight]);

  useEffect(() => {
    if (!entrySession.fromAuth) return;
    navigate(`${location.pathname}${location.hash}`, { replace: true, state: null });
  }, [entrySession.fromAuth, location.hash, location.pathname, navigate]);

  useLayoutEffect(() => {
    if (location.pathname !== "/dashboard") return;
    const sectionId = dashboardSectionIdFromHash(location.hash);
    if (!sectionId) return;
    scrollToDashboardSection(sectionId);
    const tab = DASHBOARD_SECTION_ID_TO_NAV[sectionId];
    if (tab) setDashboardNavScrollActiveTo(tab);
  }, [location.pathname, location.hash, setDashboardNavScrollActiveTo]);

  useEffect(() => {
    const ids = Object.keys(DASHBOARD_SECTION_ID_TO_NAV);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0.12)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const best = intersecting[0];
        const id = best?.target.id;
        if (id) {
          const to = DASHBOARD_SECTION_ID_TO_NAV[id];
          if (to) setDashboardNavScrollActiveTo(to);
        }
      },
      { threshold: [0.08, 0.14, 0.22, 0.35, 0.5], rootMargin: "-12% 0px -52% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [setDashboardNavScrollActiveTo]);

  function handleScrollToDriveForm() {
    document.getElementById("drive-submission-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (

    <>

      <div className="fixed top-30 left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-gray-950/90 px-6 py-3 text-xs font-bold text-white backdrop-blur-xl shadow-xl ring-1 ring-white/10">
        {userRole === "coordinador" ? "Panel de coordinación" : "Vista de GIF"}
        <span className="ml-2 opacity-70">●</span>
      </div>

      <DashboardEntryTransition
        active={showEntryTransition}
        profile={entryProfile}
        onComplete={() => setShowEntryTransition(false)}
      />

      <motion.div
        initial={
          entrySession.fromAuth
            ? { opacity: 0.9, scale: intensity.scaleFrom, filter: `blur(${intensity.blurPx}px)` }
            : false
        }
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: dashboardRevealDuration, ease: [0.22, 1, 0.36, 1] }}
      >
        <DashboardHero ref={heroDarkRef} statsLine={statsLine} onPrimaryAction={handleScrollToDriveForm} />
        <section
          id="drive-submission-form"
          className="min-h-screen scroll-mt-0"
        >
          {userRole === "coordinador" ? (
            <CoordinatorRequestsSection />
          ) : (
            <DriveSubmissionSection />
          )}
        </section>
      </motion.div>
    </>
  );
}
