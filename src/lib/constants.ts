import type { RequestStatus } from "@/types";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pendiente: "PENDIENTE",
  aprobado: "APROBADO",
  requiere_ajustes: "REQUIERE AJUSTES",
};

export const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-amber-50/90 text-amber-800 ring-1 ring-inset ring-amber-200/60",
  aprobado: "bg-emerald-50/90 text-emerald-800 ring-1 ring-inset ring-emerald-200/60",
  requiere_ajustes: "bg-orange-50/90 text-orange-800 ring-1 ring-inset ring-orange-200/60",
};

export const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/50",
  Medium: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/60",
  Low: "bg-slate-50 text-slate-600 ring-1 ring-slate-200/40",
};

export const PIPELINE_COLUMN_ACCENT: Record<string, string> = {
  pendiente: "from-amber-500 to-amber-400",
  aprobado: "from-emerald-500 to-emerald-400",
  requiere_ajustes: "from-orange-500 to-orange-400",
};
