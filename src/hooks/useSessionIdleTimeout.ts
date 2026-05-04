import { useEffect } from "react";
import { toast } from "sonner";
import { ApiError, authApi } from "@/lib/api";
import { SESSION_ACTIVITY_THROTTLE_MS, isSessionIdleExpired, shouldRefreshSession } from "@/lib/session";
import { useAuthStore } from "@/store/authStore";
import { useRequestsStore } from "@/store/requestsStore";

const ACTIVITY_EVENTS = ["click", "keydown", "mousemove", "scroll", "touchstart"] as const;

export function useSessionIdleTimeout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const touchSession = useAuthStore((state) => state.touchSession);
  const user = useAuthStore((state) => state.user);
  const clearRequests = useRequestsStore((state) => state.clearRequests);

  useEffect(() => {
    if (!user) return undefined;

    let lastTouchAt = 0;
    let refreshInFlight = false;

    const expireSession = () => {
      clearSession();
      clearRequests();
      toast.info("Sesión cerrada por inactividad.");
    };

    const checkExpiration = () => {
      const { lastActivityAt, user: currentUser } = useAuthStore.getState();
      if (currentUser && isSessionIdleExpired(lastActivityAt)) {
        expireSession();
        return true;
      }
      return false;
    };

    const refreshSessionIfNeeded = (now: number) => {
      const { lastSessionRefreshAt, setSession } = useAuthStore.getState();
      if (refreshInFlight || !shouldRefreshSession(lastSessionRefreshAt, now)) return;

      refreshInFlight = true;
      void authApi
        .refresh()
        .then(setSession)
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401) {
            clearRequests();
            toast.info("Sesión cerrada por inactividad.");
          }
        })
        .finally(() => {
          refreshInFlight = false;
        });
    };

    const registerActivity = () => {
      if (checkExpiration()) return;

      const now = Date.now();
      if (now - lastTouchAt >= SESSION_ACTIVITY_THROTTLE_MS) {
        lastTouchAt = now;
        touchSession(now);
        refreshSessionIfNeeded(now);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        registerActivity();
        return;
      }

      checkExpiration();
    };

    checkExpiration();

    const intervalId = window.setInterval(checkExpiration, SESSION_ACTIVITY_THROTTLE_MS);
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true });
    });
    window.addEventListener("focus", registerActivity);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity);
      });
      window.removeEventListener("focus", registerActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearRequests, clearSession, touchSession, user]);
}
