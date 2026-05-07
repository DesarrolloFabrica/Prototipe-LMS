import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FolderTree,
  HardDrive,
  History,
  MessageSquare,
  RefreshCcw,
  Search,
  UploadCloud,
  User,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { MegaFilesPanel } from "@/components/shared/MegaFilesPanel";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { materiasApi } from "@/lib/api";
import type { ApiSubjectTimelineEvent, ApiUploadHistoryItem, SubjectStatus } from "@/types";

const statusLabels: Record<SubjectStatus, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  requiere_ajustes: "Requiere ajustes",
};

const statusStyles: Record<SubjectStatus, string> = {
  pendiente: "border-amber-200 bg-amber-50 text-amber-700",
  aprobado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  requiere_ajustes: "border-orange-200 bg-orange-50 text-orange-700",
};

export function UploadHistorySection() {
  const [items, setItems] = useState<ApiUploadHistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubjectStatus | "todas">("todas");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setIsLoading(true);
    void materiasApi
      .uploadHistory()
      .then(setItems)
      .catch((error) => toast.error(readError(error)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void materiasApi.uploadHistory().then(setItems).catch(() => undefined);
      }
    };
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        totalLoads: acc.totalLoads + (item.hasFiles ? 1 : 0),
        totalFiles: acc.totalFiles + item.fileCount,
        totalFolders: acc.totalFolders + item.folderCount,
        totalBytes: acc.totalBytes + item.totalBytes,
      }),
      { totalLoads: 0, totalFiles: 0, totalFolders: 0, totalBytes: 0 },
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === "todas" || item.currentStatus === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.subjectName, item.programName, item.semester, item.createdBy?.fullName, item.createdBy?.email]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Trazabilidad de cargas</p>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Historial de cargas MEGA</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Consulta las transferencias realizadas desde Drive, su volumetria y el material disponible para revision.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={UploadCloud} label="Cargas" value={summary.totalLoads.toString()} />
            <Metric icon={Archive} label="Archivos" value={summary.totalFiles.toString()} />
            <Metric icon={FolderTree} label="Carpetas" value={summary.totalFolders.toString()} />
            <Metric icon={HardDrive} label="Volumen" value={formatBytes(summary.totalBytes)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por materia, programa, semestre o responsable..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <FilterCombobox
            label="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "todas", label: "Todos los estados" },
              { value: "pendiente", label: "Pendiente" },
              { value: "aprobado", label: "Aprobado" },
              { value: "requiere_ajustes", label: "Requiere ajustes" },
            ]}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
            Cargando historial de cargas...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">No hay cargas para los filtros seleccionados.</p>
            <p className="mt-1 text-xs text-slate-500">Ajusta la busqueda o cambia el estado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <PaginationControls
              currentPage={safeCurrentPage}
              pageSize={pageSize}
              totalItems={filteredItems.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />

            {paginatedItems.map((item) => {
              const isExpanded = expandedId === item.subjectId;
              return (
                <article key={item.subjectId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedId((current) => (current === item.subjectId ? null : item.subjectId))}
                    className="grid w-full gap-4 p-5 text-left transition hover:bg-slate-50 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[item.currentStatus]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabels[item.currentStatus]}
                        </span>
                        {!item.hasFiles && (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
                            Sin archivos
                          </span>
                        )}
                      </div>
                      <h4 className="mt-3 truncate text-base font-extrabold text-slate-900">{item.subjectName}</h4>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {item.programName} · {item.semester} · {item.academicLevel}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm lg:grid-cols-1">
                      <SmallStat label="Archivos" value={item.fileCount.toString()} />
                      <SmallStat label="Carpetas" value={item.folderCount.toString()} />
                      <SmallStat label="Volumen" value={formatBytes(item.totalBytes)} />
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-4 w-4" />
                        <span>{item.lastUploadedAt ? formatDate(item.lastUploadedAt) : "Sin transferencia"}</span>
                      </p>
                      <p className="flex items-center gap-2 text-slate-500">
                        <User className="h-4 w-4" />
                        <span className="truncate">{item.createdBy?.fullName ?? item.createdBy?.email ?? "Sin responsable"}</span>
                      </p>
                    </div>

                    <span className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">
                      {isExpanded ? "Ocultar" : "Ver material"}
                    </span>
                  </button>

                  {item.rootFolders.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        {item.rootFolders.map((folder) => (
                          <span key={folder} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            <FolderTree className="h-3.5 w-3.5" />
                            {folder}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="grid gap-4 border-t border-slate-100 bg-slate-50/70 p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                      <MegaFilesPanel subjectId={String(item.subjectId)} />
                      <SubjectTimelinePanel subjectId={item.subjectId} />
                    </div>
                  )}
                </article>
              );
            })}

            {filteredItems.length > pageSize && (
              <PaginationControls
                currentPage={safeCurrentPage}
                pageSize={pageSize}
                totalItems={filteredItems.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectTimelinePanel({ subjectId }: { subjectId: number }) {
  const [events, setEvents] = useState<ApiSubjectTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    void materiasApi
      .timeline(subjectId)
      .then(setEvents)
      .catch((timelineError) =>
        setError(timelineError instanceof Error ? timelineError.message : "No fue posible cargar la traza."),
      )
      .finally(() => setIsLoading(false));
  }, [subjectId]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Trazabilidad</p>
          <h4 className="mt-1 text-sm font-extrabold text-slate-900">Historial completo del flujo</h4>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          <History className="h-3.5 w-3.5" />
          {events.length}
        </span>
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Cargando traza...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!isLoading && !error && events.length === 0 && (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Todavia no hay eventos para esta solicitud.</p>
      )}

      {events.length > 0 && (
        <div className="mt-4 max-h-[28rem] space-y-3 overflow-auto py-1 pl-2 pr-2">
          {events.map((event, index) => {
            const Icon = timelineIcon(event.type);
            return (
              <div key={event.id} className="relative flex gap-3 pl-1">
                {index < events.length - 1 && <span className="absolute left-[1.4rem] top-9 h-[calc(100%-1rem)] w-px bg-slate-200" />}
                <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${timelineIconClass(event.type)}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-extrabold text-slate-800">{event.title}</p>
                    <time className="text-[11px] font-semibold text-slate-400">{formatDate(event.createdAt)}</time>
                  </div>
                  {event.description && <p className="mt-1 text-xs leading-relaxed text-slate-600">{event.description}</p>}
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {event.actor?.fullName ?? event.actor?.email ?? "Sistema"}
                  </p>
                  <TimelineMetadata event={event} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimelineMetadata({ event }: { event: ApiSubjectTimelineEvent }) {
  const metadata = event.metadata ?? {};
  const fileName = typeof metadata.fileName === "string" ? metadata.fileName : null;
  const recipientEmail = typeof metadata.recipientEmail === "string" ? metadata.recipientEmail : null;
  const fileCount = typeof metadata.fileCount === "number" ? metadata.fileCount : null;
  const totalBytes = typeof metadata.totalBytes === "number" ? metadata.totalBytes : null;

  if (!fileName && !recipientEmail && fileCount === null && totalBytes === null) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {fileName && <MetaPill value={fileName} />}
      {recipientEmail && <MetaPill value={recipientEmail} />}
      {fileCount !== null && <MetaPill value={`${fileCount} archivo(s)`} />}
      {totalBytes !== null && <MetaPill value={formatBytes(totalBytes)} />}
    </div>
  );
}

function MetaPill({ value }: { value: string }) {
  return (
    <span className="max-w-full truncate rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
      {value}
    </span>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-lg font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function timelineIcon(type: string): LucideIcon {
  if (type === "SUBJECT_CREATED") return UploadCloud;
  if (type === "TRANSFER_COMPLETED") return FolderTree;
  if (type === "STATUS_CHANGED") return RefreshCcw;
  if (type === "COMMENT_ADDED") return MessageSquare;
  if (type === "NOTIFICATION") return Bell;
  if (type === "DATA_UPDATED") return Edit3;
  if (type === "DOWNLOAD_FILE" || type === "DOWNLOAD_ZIP") return Download;
  return CheckCircle2;
}

function timelineIconClass(type: string) {
  if (type === "SUBJECT_CREATED") return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  if (type === "TRANSFER_COMPLETED") return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  if (type === "STATUS_CHANGED") return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
  if (type === "COMMENT_ADDED") return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";
  if (type === "NOTIFICATION") return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
  if (type === "DATA_UPDATED") return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  if (type === "DOWNLOAD_FILE" || type === "DOWNLOAD_ZIP") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  return "bg-slate-50 text-slate-600 ring-1 ring-slate-200";
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar el historial de cargas.";
}
