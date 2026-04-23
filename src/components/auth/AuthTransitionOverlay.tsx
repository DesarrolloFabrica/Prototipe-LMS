import { AnimatePresence, motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { AuthProgressStep } from "@/lib/authExperience";
import { AUTH_PROGRESS_MESSAGES } from "@/lib/authExperience";

type AuthTransitionOverlayProps = {
  active: boolean;
  step: AuthProgressStep;
  reducedMotion: boolean;
};

export function AuthTransitionOverlay({ active, step, reducedMotion }: AuthTransitionOverlayProps) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.08 : 0.5, delay: reducedMotion ? 0 : 0.5 }}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center p-8"
        >
          <div className="relative overflow-hidden rounded-[3rem] border border-white/40 bg-white/70 p-10 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.1)] backdrop-blur-3xl sm:p-14 w-full max-w-lg">
            <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-transparent to-indigo-50/30" aria-hidden />
            
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: reducedMotion ? 0.25 : 0.9, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 50% 28% at 50% 55%, rgba(59,130,246,0.15), transparent 72%), radial-gradient(circle at 20% 30%, rgba(168,85,247,0.1), transparent 30%)",
              }}
            />
            
            <div className="relative z-10 flex flex-col items-center gap-8 w-full">
              <div className="flex h-28 w-28 items-center justify-center" style={{ transform: "translateZ(0)" }}>
                <DotLottieReact
                  src="/videos/User.lottie"
                  loop
                  autoplay
                  className="h-full w-full object-contain [image-rendering:optimizeQuality]"
                />
              </div>
              
              <div className="w-full max-w-xs space-y-6">
                <div className="h-1.5 w-full rounded-full bg-slate-200/50 overflow-hidden">
                  <motion.div
                    className="h-full bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500"
                    initial={{ width: "0%" }}
                    animate={{ width: ["0%", "45%", "86%", "100%"] }}
                    transition={{ duration: reducedMotion ? 0.35 : 1.25, ease: "easeInOut" }}
                  />
                </div>
                <motion.p 
                  key={step}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm font-bold uppercase tracking-[0.3em] text-blue-700 drop-shadow-sm"
                >
                  {AUTH_PROGRESS_MESSAGES[step]}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
