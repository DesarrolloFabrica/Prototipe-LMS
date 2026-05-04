import { Toaster } from "sonner";
import { InteractiveCursor } from "@/components/common/InteractiveCursor";
import { useSessionBootstrap } from "@/hooks/useSessionBootstrap";
import { useSessionIdleTimeout } from "@/hooks/useSessionIdleTimeout";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useSessionBootstrap();
  useSessionIdleTimeout();

  return (
    <>
      <InteractiveCursor />
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
