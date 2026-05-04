import { Badge } from "@/components/ui/Badge";
import { REQUEST_STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import type { RequestStatus } from "@/types";

export function StatusPill({ status }: { status: string }) {
  const label = REQUEST_STATUS_LABELS[status as RequestStatus] ?? status;

  return (
    <Badge
      className={
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/80"
      }
    >
      {label}
    </Badge>
  );
}
