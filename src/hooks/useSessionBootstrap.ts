import { useEffect, useRef } from "react";
import { authApi } from "@/lib/api";
import { isSessionIdleExpired } from "@/lib/session";
import { mapBackendRoleToUiRole, useAuthStore } from "@/store/authStore";
import { useRequestsStore } from "@/store/requestsStore";
import { useUIStore } from "@/store/uiStore";

export function useSessionBootstrap() {
  const bootstrappedRef = useRef(false);
  const clearRequests = useRequestsStore((state) => state.clearRequests);
  const setUserRole = useUIStore((state) => state.setUserRole);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const { clearSession, lastActivityAt, setSession, user } = useAuthStore.getState();

    if (user && isSessionIdleExpired(lastActivityAt)) {
      clearSession();
      clearRequests();
      return;
    }

    void authApi
      .refresh()
      .then((session) => {
        setSession(session);
        setUserRole(mapBackendRoleToUiRole(session.user.role));
      })
      .catch(() => {
        clearSession();
        clearRequests();
      });
  }, [clearRequests, setUserRole]);
}
