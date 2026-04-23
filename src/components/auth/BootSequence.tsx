import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { BOOT_SUBSTATES } from "@/lib/authExperience";
import { cn } from "@/lib/cn";

type BootSequenceProps = {
  substateIndex: number;
  reducedMotion: boolean;
};

export function BootSequence({ substateIndex, reducedMotion }: BootSequenceProps) {
  const activeNode = substateIndex % 4;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: reducedMotion ? 0.12 : 0.6 }}
      className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_60%)] animate-pulse" aria-hidden />

      <div className="relative z-10 w-full max-w-2xl rounded-[2.5rem] border border-white/40 bg-white/70 p-8 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.1)] backdrop-blur-3xl sm:p-12">
        {/* Glow effect behind the logo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-32 w-32 bg-blue-500/10 blur-3xl rounded-full" />
        
        <div className="mb-10 flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden"
          >
            <DotLottieReact
              src="/videos/Seal.lottie"
              loop
              autoplay
              className="h-full w-full object-contain"
            />
          </motion.div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-600">Carga LMS</p>
            <p className="mt-1 text-sm font-semibold text-slate-500 uppercase tracking-widest">Academic Operating System</p>
          </div>
        </div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.5rem] leading-tight"
        >
          Inicializando <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">entorno académico</span>
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-base font-medium text-slate-600"
        >
          Activando módulos esenciales para abrir tu workspace operativo.
        </motion.p>

        <div className="mt-12 space-y-6">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="absolute left-0 top-0 h-full bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500"
              initial={{ width: "14%" }}
              animate={{ width: ["14%", "42%", "71%", "100%"] }}
              transition={{ duration: reducedMotion ? 0.45 : 1.9, ease: "easeInOut" }}
            />
            {/* Scanning light effect */}
            <motion.div 
              className="absolute inset-y-0 w-24 bg-linear-to-r from-transparent via-white/40 to-transparent"
              animate={{ left: ["-20%", "120%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-2">
            <motion.p 
              key={substateIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-bold uppercase tracking-widest text-blue-600"
            >
              {BOOT_SUBSTATES[substateIndex % BOOT_SUBSTATES.length]}
            </motion.p>
            <div className="flex items-center gap-3" aria-hidden>
              {[0, 1, 2, 3].map((node) => (
                <motion.span
                  key={node}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border border-slate-200 bg-white",
                    node <= activeNode ? "shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "",
                  )}
                  animate={{
                    scale: node === activeNode ? 1.2 : 1,
                    opacity: node <= activeNode ? 1 : 0.4,
                    backgroundColor: node <= activeNode ? "#2563eb" : "#f8fafc",
                  }}
                  transition={{ duration: reducedMotion ? 0.08 : 0.3 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
