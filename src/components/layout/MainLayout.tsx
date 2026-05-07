import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { mapBackendRoleToUiRole, useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { ArrowUp } from "lucide-react";

export function MainLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDashboardHero = pathname === "/dashboard";
  const [showDashboardNav, setShowDashboardNav] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const user = useAuthStore((state) => state.user);
  const setUserRole = useUIStore((state) => state.setUserRole);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setUserRole(mapBackendRoleToUiRole(user.role));
  }, [navigate, setUserRole, user]);

  useEffect(() => {
    if (!isDashboardHero) {
      setShowDashboardNav(true);
      return undefined;
    }

    const updateDashboardNavVisibility = () => {
      const limit = Math.min(window.innerHeight * 0.55, 520);
      setShowDashboardNav(window.scrollY <= limit);
    };

    updateDashboardNavVisibility();
    window.addEventListener("scroll", updateDashboardNavVisibility, { passive: true });
    window.addEventListener("resize", updateDashboardNavVisibility);

    return () => {
      window.removeEventListener("scroll", updateDashboardNavVisibility);
      window.removeEventListener("resize", updateDashboardNavVisibility);
    };
  }, [isDashboardHero]);

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 520);
    };

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateBackToTopVisibility);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#f1f5f9] text-slate-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-6%,rgba(37,99,235,0.055),transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-[min(520px,50vh)] w-[min(520px,45vw)] rounded-full bg-violet-200/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-sky-200/12 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10">
        {!isDashboardHero ? <TopNavigation variant="solid" /> : null}
        <main className="w-full">
          <Outlet />
        </main>
        {isDashboardHero ? (
          <header
            className={`pointer-events-none fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
              showDashboardNav ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
            }`}
            aria-hidden={!showDashboardNav}
          >
            <div className="pointer-events-auto">
              <TopNavigation variant="glass" />
            </div>
          </header>
        ) : null}
        <button
          type="button"
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_18px_36px_-14px_rgba(37,99,235,0.75)] ring-1 ring-white/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95 ${
            showBackToTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
          }`}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
