import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccessPanel } from "@/components/auth/AccessPanel";
import { AuthTransitionOverlay } from "@/components/auth/AuthTransitionOverlay";
import { BootSequence } from "@/components/auth/BootSequence";
import { useMediaMotionProfile } from "@/hooks/useMediaMotionProfile";
import type { AuthProfile, AuthProgressStep, LoginExperiencePhase } from "@/lib/authExperience";
import { AUTH_EXPERIENCE_TIMINGS } from "@/lib/authExperience";

export function LoginExperience() {
  const navigate = useNavigate();
  const { reducedMotion, isMobileLayout } = useMediaMotionProfile();
  const [phase, setPhase] = useState<LoginExperiencePhase>("booting");
  const [substateIndex, setSubstateIndex] = useState(0);

  const [progressStep, setProgressStep] = useState<AuthProgressStep>("validating");

  const authProfile: AuthProfile = reducedMotion || isMobileLayout ? "reduced" : "full";

  const bootDuration = useMemo(() => {
    if (reducedMotion) return AUTH_EXPERIENCE_TIMINGS.boot.reduced;
    if (isMobileLayout) return AUTH_EXPERIENCE_TIMINGS.boot.mobile;
    return AUTH_EXPERIENCE_TIMINGS.boot.desktop;
  }, [isMobileLayout, reducedMotion]);

  useEffect(() => {
    if (phase !== "booting") return undefined;
    const stateRotation = window.setInterval(() => setSubstateIndex((prev) => prev + 1), reducedMotion ? 220 : 360);
    const toLogin = window.setTimeout(() => setPhase("readyForLogin"), bootDuration);
    return () => {
      window.clearInterval(stateRotation);
      window.clearTimeout(toLogin);
    };
  }, [bootDuration, phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "authenticating") return undefined;
    setProgressStep("validating");
    const t1 = window.setTimeout(() => setProgressStep("syncing"), reducedMotion ? 120 : 430);
    const t2 = window.setTimeout(() => setProgressStep("loading"), reducedMotion ? 220 : 870);
    const complete = window.setTimeout(() => {
      setPhase("enteringDashboard");
      navigate("/dashboard", { state: { fromAuthTransition: true, authProfile } });
    }, authProfile === "reduced" ? AUTH_EXPERIENCE_TIMINGS.auth.reduced : AUTH_EXPERIENCE_TIMINGS.auth.full);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(complete);
    };
  }, [authProfile, navigate, phase, reducedMotion]);

  return (
    <div className="relative min-h-dvh overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      {/* Premium Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/images/Fondo-Login.jpg")' }}
        aria-hidden 
      />
      
      {/* Light Overlay to enhance readability while keeping it bright */}
      <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-[2px]" aria-hidden />
      
      <AnimatePresence mode="wait">
        {phase === "booting" ? (
          <BootSequence key="boot-sequence" substateIndex={substateIndex} reducedMotion={reducedMotion} />
        ) : (
          <motion.section
            key="access-panel"
            initial={{ opacity: 0, scale: 1.012, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "none" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            transition={{ duration: reducedMotion ? 0.2 : 0.8 }}
            className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-lg items-center justify-center"
          >
            <div className="relative w-full min-h-[500px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === "authenticating" ? (
                  <AuthTransitionOverlay
                    key="auth-overlay"
                    active={true}
                    step={progressStep}
                    reducedMotion={reducedMotion}
                  />
                ) : phase === "readyForLogin" ? (
                  <AccessPanel
                    key="access-panel-card"
                    disabled={false}
                    isAuthenticating={false}
                    progressStep={progressStep}
                    reducedMotion={reducedMotion}
                    onInteract={() => {}}
                    onSubmitAccess={() => setPhase("authenticating")}
                  />
                ) : null}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
