import { BookMarked, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { PRIORITY_STYLES } from "@/lib/constants";
import type { ProcessItem } from "@/types";
import { cn } from "@/lib/cn";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function pipelineProgress(status: ProcessItem["status"]) {
  switch (status) {
    case "pendiente":
      return 35;
    case "requiere_ajustes":
      return 65;
    case "aprobado":
      return 100;
    default:
      return 20;
  }
}

export function ProcessShowcaseCard({
  item,
  featured,
  className,
}: {
  item: ProcessItem;
  featured?: boolean;
  className?: string;
}) {
  const prio = PRIORITY_STYLES[item.priority] ?? "bg-slate-100 text-slate-700";
  const progress = pipelineProgress(item.status);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-slate-200/80 transition-shadow duration-300 hover:shadow-md",
        featured
          ? "rounded-[28px] border-slate-200/60 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)] sm:p-8 md:p-10"
          : "rounded-2xl border-slate-200/70 bg-white/95 p-5 shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          "bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.06),transparent_55%)]",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between",
          featured && "gap-6",
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className={cn(
              "grid shrink-0 place-items-center rounded-2xl bg-linear-to-br from-blue-600/12 to-indigo-600/10 text-blue-700 ring-1 ring-blue-200/40",
              featured ? "h-16 w-16" : "h-12 w-12",
            )}
          >
            <BookMarked className={featured ? "h-8 w-8" : "h-6 w-6"} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "font-semibold leading-snug text-slate-900",
                  featured ? "text-xl sm:text-2xl" : "text-base",
                )}
              >
                {item.subject}
              </p>
              <Badge className="border border-slate-200/80 bg-slate-50 font-mono text-[11px] font-medium normal-case text-slate-600 ring-0">
                {item.code}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={item.status} />
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", prio)}>
                {item.priority}
              </span>
              <span className="text-xs text-slate-500">{item.timeLabel ?? item.updatedAt}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-200/80 bg-linear-to-br from-slate-50 to-slate-100 text-xs font-semibold text-slate-700">
              {initials(item.owner)}
            </div>
            <div className="hidden text-right sm:block md:hidden lg:block">
              <p className="text-xs font-medium text-slate-500">Responsable</p>
              <p className="text-sm font-medium text-slate-800">{item.owner}</p>
            </div>
          </div>
          <Link
            to={`/review/${item.id}`}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-white hover:text-blue-700"
          >
            Abrir
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "relative mt-5 h-1 overflow-hidden rounded-full bg-slate-100",
          featured && "mt-8 h-1.5",
        )}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance aproximado en el flujo"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-80 transition-all duration-500 group-hover:opacity-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Card>
  );
}
