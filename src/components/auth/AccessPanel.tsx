import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AuthProgressStep } from "@/lib/authExperience";
import { AUTH_PROGRESS_MESSAGES } from "@/lib/authExperience";

const schema = z.object({ email: z.email(), password: z.string().min(6) });
type FormData = z.infer<typeof schema>;

type AccessPanelProps = {
  disabled: boolean;
  isAuthenticating: boolean;
  progressStep: AuthProgressStep;
  reducedMotion: boolean;
  onSubmitAccess: () => void;
  onInteract: () => void;
};

export function AccessPanel({
  disabled,
  isAuthenticating,
  progressStep,
  reducedMotion,
  onSubmitAccess,
  onInteract,
}: AccessPanelProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "none" }}
      exit={{ 
        scaleX: [1, 1.05, 1.05, 0], 
        scaleY: [1, 1, 0.005, 0], 
        opacity: [1, 1, 0.8, 0],
        filter: ["blur(0px)", "blur(0px)", "blur(2px)", "blur(12px)"]
      }}
      transition={{ 
        duration: reducedMotion ? 0.3 : 0.8,
        times: [0, 0.2, 0.7, 1],
        ease: [0.45, 0, 0.55, 1]
      }}
      className="relative overflow-hidden rounded-[3rem] border border-white/40 bg-white/70 p-10 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.1)] backdrop-blur-3xl sm:p-14"
    >
      <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-transparent to-indigo-50/30" aria-hidden />

      <form
        className="relative z-10 space-y-6"
        onSubmit={handleSubmit(() => onSubmitAccess())}
        onFocus={onInteract}
        onChange={onInteract}
      >
        <header className="flex flex-col items-center text-center space-y-4 mb-2">
          <div className="flex h-28 w-28 items-center justify-center" style={{ transform: "translateZ(0)" }}>
            <DotLottieReact
              src="/videos/User.lottie"
              loop
              autoplay
              className="h-full w-full object-contain [image-rendering:optimizeQuality]"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Accede a tu entorno</h1>
            <p className="text-sm font-medium text-slate-500">Inicia sesión para abrir tu espacio operativo en Carga LMS.</p>
          </div>
        </header>

        <div className="space-y-2">
          <label htmlFor="email" className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Correo institucional
          </label>
          <Input
            id="email"
            placeholder="correo@carga.com"
            autoComplete="email"
            disabled={disabled}
            className="border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500/50"
            {...register("email")}
          />
          {errors.email ? <p className="ml-1 text-xs text-rose-600 font-bold">Ingresa un correo válido.</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••"
            autoComplete="current-password"
            disabled={disabled}
            className="border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500/50"
            {...register("password")}
          />
          {errors.password ? <p className="ml-1 text-xs text-rose-600 font-bold">Mínimo 6 caracteres.</p> : null}
        </div>

        <div className="pt-2">
          <Button type="submit" className="group relative w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.3)] transition-all border-none" disabled={disabled}>
            <span className="relative z-10 font-bold">{isAuthenticating ? AUTH_PROGRESS_MESSAGES[progressStep] : "Acceder al sistema"}</span>
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </Button>
        </div>

        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Acceso institucional protegido</p>
      </form>
    </motion.section>
  );
}
