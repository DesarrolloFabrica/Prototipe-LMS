import { useCallback, useEffect, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import type { AuthProgressStep } from "@/lib/authExperience";
import { AUTH_PROGRESS_MESSAGES } from "@/lib/authExperience";
import { mapBackendRoleToUiRole, useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "pill" | "rectangular" | "circle" | "square";
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

type AccessPanelProps = {
  disabled: boolean;
  isAuthenticating: boolean;
  progressStep: AuthProgressStep;
  reducedMotion: boolean;
  onSubmitAccess: () => void;
  onInteract: () => void;
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function AccessPanel({
  disabled,
  isAuthenticating,
  progressStep,
  reducedMotion,
  onSubmitAccess,
  onInteract,
}: AccessPanelProps) {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const setUserRole = useUIStore((state) => state.setUserRole);

  const handleCredential = useCallback(
    async (credential?: string) => {
      if (!credential) {
        toast.error("Google no devolvio una credencial valida.");
        return;
      }

      try {
        setIsSigningIn(true);
        onInteract();
        const session = await authApi.loginWithGoogle(credential);
        setSession(session);
        setUserRole(mapBackendRoleToUiRole(session.user.role));
        toast.success(`Bienvenido, ${session.user.fullName}`);
        onSubmitAccess();
      } catch (error) {
        const message = error instanceof Error ? error.message : "No fue posible iniciar sesion.";
        toast.error(message);
      } finally {
        setIsSigningIn(false);
      }
    },
    [onInteract, onSubmitAccess, setSession, setUserRole],
  );

  useEffect(() => {
    if (!googleClientId) return undefined;

    const existing = document.getElementById("google-identity-services");
    if (existing) {
      if (window.google) {
        setScriptReady(true);
      } else {
        existing.addEventListener("load", () => setScriptReady(true), { once: true });
        existing.addEventListener("error", () => setScriptFailed(true), { once: true });
      }
      return undefined;
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => {
      setScriptFailed(true);
      toast.error("No se pudo cargar Google Identity Services.");
    };
    document.head.appendChild(script);

    return undefined;
  }, []);

  useEffect(() => {
    const buttonHost = googleButtonRef.current;
    if (!scriptReady || !googleClientId || !buttonHost || !window.google) return;

    buttonHost.innerHTML = "";
    setButtonRendered(false);
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => void handleCredential(response.credential),
    });
    window.google.accounts.id.renderButton(buttonHost, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      width: 320,
    });
    window.requestAnimationFrame(() => setButtonRendered(true));
  }, [handleCredential, scriptReady]);

  const busy = disabled || isAuthenticating || isSigningIn;

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
      onMouseEnter={onInteract}
    >
      <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-transparent to-indigo-50/30" aria-hidden />

      <div className="relative z-10 space-y-6">
        <header className="mb-2 flex flex-col items-center space-y-4 text-center">
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
            <p className="text-sm font-medium text-slate-500">
              Inicia sesion con tu cuenta institucional de Google para abrir Carga LMS.
            </p>
          </div>
        </header>

        <div className="flex flex-col items-center gap-3 rounded-3xl border border-blue-100/60 bg-white/60 p-5">
          {googleClientId ? (
            <>
              <div className="flex min-h-11 w-full justify-center">
                <div
                  ref={googleButtonRef}
                  className={busy ? "pointer-events-none opacity-60" : undefined}
                  aria-busy={busy}
                />
              </div>
              {!scriptReady && !scriptFailed ? (
                <div className="flex h-11 w-full max-w-xs items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-500 shadow-sm">
                  Cargando boton de Google...
                </div>
              ) : null}
              {scriptFailed ? (
                <p className="text-center text-sm font-semibold text-rose-600">
                  No se pudo cargar el boton de Google. Revisa conexion, bloqueadores o configuracion del navegador.
                </p>
              ) : null}
              {scriptReady && !buttonRendered ? (
                <p className="text-center text-xs font-semibold text-slate-500">
                  Preparando acceso con Google...
                </p>
              ) : null}
              {busy ? (
                <p className="text-center text-xs font-bold uppercase tracking-wider text-blue-600">
                  {isSigningIn ? "Validando con Google" : AUTH_PROGRESS_MESSAGES[progressStep]}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-center text-sm font-semibold text-rose-600">
              Falta configurar VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-blue-100/50 bg-blue-50/50 p-4 backdrop-blur-sm">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-blue-600/70">
            Acceso federado
          </p>
          <p className="mt-2 text-center text-xs font-medium leading-relaxed text-slate-500">
            Usa tu cuenta institucional autorizada para continuar.
          </p>
        </div>

        <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
          Acceso institucional protegido
        </p>
      </div>
    </motion.section>
  );
}
