import { Toaster } from "sonner";
import { useSessionBootstrap } from "@/hooks/useSessionBootstrap";
import { useSessionIdleTimeout } from "@/hooks/useSessionIdleTimeout";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useSessionBootstrap();
  useSessionIdleTimeout();

  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
