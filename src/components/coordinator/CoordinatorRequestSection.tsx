import type { ApiProgram, ApiSemester, RequestStatus } from "@/types";
import { catalogsApi } from "@/lib/api";
import { ContentTypePills } from "@/components/shared/ContentTypePills";
import { DriveFilesPanel } from "@/components/shared/DriveFilesPanel";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { UploadHistorySection } from "@/components/coordinator/UploadHistorySection";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { useRequestsStore } from "@/store/requestsStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { Archive, ClipboardList, Inbox } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";

export function CoordinatorRequestsSection() {
  const requests = useRequestsStore((state) => state.requests);
  const isLoading = useRequestsStore((state) => state.isLoading);
  const loadCoordinatorRequests = useRequestsStore((state) => state.loadCoordinatorRequests);
  const approveRequest = useRequestsStore((state) => state.approveRequest);
  const rejectRequest = useRequestsStore((state) => state.rejectRequest);
  const user = useAuthStore((state) => state.user);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "todas">("todas");
  const [showFilters, setShowFilters] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("todos");
  const [programFilter, setProgramFilter] = useState("todos");
  const [semesters, setSemesters] = useState<ApiSemester[]>([]);
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [activePanel, setActivePanel] = useState<"requests" | "uploads">("requests");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // --- Estado del chatbox de ajustes ---
  // adjustmentBoxId: ID de la solicitud que tiene el chatbox abierto (null = ninguno).
  const [adjustmentBoxId, setAdjustmentBoxId] = useState<string | null>(null);
  // adjustmentNotes: texto que el coordinador está escribiendo como observación.
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  // adjustmentError: mensaje de validación cuando el coordinador intenta confirmar sin texto.
  const [adjustmentError, setAdjustmentError] = useState("");
  // --- Estado del panel de aprobación ---
  // approvalBoxId: ID de la solicitud con panel de aprobación abierto.
  const [approvalBoxId, setApprovalBoxId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "LMS" && user.role !== "ADMIN")) return;
    void loadCoordinatorRequests().catch((error) => toast.error(readError(error)));
    void catalogsApi.semesters().then(setSemesters).catch((error) => toast.error(readError(error)));
    void catalogsApi.programs().then(setPrograms).catch((error) => toast.error(readError(error)));
  }, [loadCoordinatorRequests, user]);

  useEffect(() => {
    if (!user || (user.role !== "LMS" && user.role !== "ADMIN")) return undefined;

    const refresh = () => {
      if (document.visibilityState === "visible") {
        void loadCoordinatorRequests().catch(() => undefined);
      }
    };
    const interval = window.setInterval(refresh, 15_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadCoordinatorRequests, user]);


  const activeRequests = requests.filter((request) => request.status !== "aprobado");
  const pendingCount = activeRequests.filter((request) => request.status === "pendiente").length;
  const adjustmentCount = activeRequests.filter((request) => request.status === "requiere_ajustes").length;
  const completedCount = requests.filter((request) => request.status === "aprobado").length;

  // Aplica los tres filtros al mismo tiempo sobre la bandeja operativa:
  // estado, semestre y programa. Las aprobadas se consultan en Historial de cargas.
  const filteredRequests = activeRequests.filter((request) => {
    const matchesStatus =
      statusFilter === "todas" || request.status === statusFilter;

    const matchesSemester =
      semesterFilter === "todos" || request.semester === semesterFilter;

    const matchesProgram =
      programFilter === "todos" || request.program === programFilter;

    return matchesStatus && matchesSemester && matchesProgram;
  });
  const hasActiveFilters = statusFilter !== "todas" || semesterFilter !== "todos" || programFilter !== "todos";
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRequests = filteredRequests.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, semesterFilter, programFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);



  const statusStyles: Record<RequestStatus, string> = {
    pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
    aprobado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    // "requiere_ajustes" no es rechazo definitivo: Fabrica puede corregir y reenviar.
    requiere_ajustes: "bg-orange-50 text-orange-700 border border-orange-200",
  };


  const statusLabel: Record<RequestStatus, string> = {
    pendiente: "PENDIENTE",
    aprobado: "APROBADO",
    // "requiere_ajustes" se muestra como "REQUIERE AJUSTES" para indicar que
    // debe hacer correcciones y notificar al coordinador.
    requiere_ajustes: "REQUIERE AJUSTES",
  };
  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
    // Cierra el chatbox de ajustes si se colapsa la tarjeta correspondiente.
    if (adjustmentBoxId === id) {
      setAdjustmentBoxId(null);
      setAdjustmentNotes("");
      setAdjustmentError("");
    }
    if (approvalBoxId === id) {
      setApprovalBoxId(null);
    }
  }

  /**
   * Abre el chatbox de ajustes para una solicitud específica.
   * No cambia el estado de la solicitud hasta que el coordinador confirme.
   */
  function openAdjustmentBox(requestId: string) {
    // Si se abre "Solicitar ajustes", se cierra el panel de aprobación.
    setApprovalBoxId(null);
    setAdjustmentBoxId(requestId);
    setAdjustmentNotes("");
    setAdjustmentError("");
  }

  /** Cierra el chatbox sin hacer ningún cambio de estado. */
  function cancelAdjustmentBox() {
    setAdjustmentBoxId(null);
    setAdjustmentNotes("");
    setAdjustmentError("");
  }

  /**
   * Confirma los ajustes:
   * - Valida que el textarea no esté vacío (trim()).
   * - Llama a rejectRequest con el texto para guardar las observaciones.
   * - Limpia y cierra el chatbox.
   */
  function confirmAdjustments(requestId: string) {
    if (adjustmentNotes.trim() === "") {
      // Muestra el mensaje de validación si el campo está vacío.
      setAdjustmentError("Debes escribir una observación antes de solicitar ajustes.");
      return;
    }
    void rejectRequest(requestId, adjustmentNotes.trim())
      .then(() => {
        setAdjustmentBoxId(null);
        setAdjustmentNotes("");
        setAdjustmentError("");
      })
      .catch((error) => toast.error(readError(error)));
  }

  function openApprovalBox(requestId: string) {
    setAdjustmentBoxId(null);
    setAdjustmentNotes("");
    setAdjustmentError("");
    setApprovalBoxId(requestId);
  }

  function confirmApproval(requestId: string) {
    setApprovingId(requestId);
    void approveRequest(requestId)
      .then(() => {
        setApprovalBoxId(null);
      })
      .catch((error) => toast.error(readError(error)))
      .finally(() => setApprovingId(null));
  }

  function clearFilters() {
    setStatusFilter("todas");
    setSemesterFilter("todos");
    setProgramFilter("todos");
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#FAFAFA]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40rem] w-[40rem] rounded-full bg-blue-300/20 blur-[120px]" />
        <div className="absolute -right-[5%] top-[20%] h-[35rem] w-[35rem] rounded-full bg-indigo-300/20 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-12 sm:px-6 sm:pt-16">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Panel LMS</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Solicitudes recibidas</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">

            Aquí aparecerán las solicitudes activas creadas por los GIF para que el coordinador pueda revisarlas, hacer seguimiento y gestionar su estado.

          </p>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setActivePanel("requests")}
            className={`group rounded-2xl border p-4 text-left shadow-sm transition ${
              activePanel === "requests"
                ? "border-blue-200 bg-blue-600 text-white shadow-blue-950/10"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  activePanel === "requests" ? "bg-white/15 text-white" : "bg-blue-50 text-blue-700"
                }`}
              >
                <ClipboardList className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold">Solicitudes activas</span>
                <span className={`mt-1 block text-xs leading-relaxed ${activePanel === "requests" ? "text-blue-50" : "text-slate-500"}`}>
                  Bandeja de trabajo para aprobar o devolver solicitudes pendientes.
                </span>
                <span className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${activePanel === "requests" ? "bg-white/15 text-white" : "bg-amber-50 text-amber-700"}`}>
                    {pendingCount} pendientes
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${activePanel === "requests" ? "bg-white/15 text-white" : "bg-orange-50 text-orange-700"}`}>
                    {adjustmentCount} con ajustes
                  </span>
                </span>
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel("uploads")}
            className={`group rounded-2xl border p-4 text-left shadow-sm transition ${
              activePanel === "uploads"
                ? "border-slate-300 bg-slate-900 text-white shadow-slate-950/10"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  activePanel === "uploads" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                <Archive className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold">Auditoría de cargas</span>
                <span className={`mt-1 block text-xs leading-relaxed ${activePanel === "uploads" ? "text-slate-200" : "text-slate-500"}`}>
                  Consulta histórica con material copiado al Drive de revisión, descargas y trazabilidad completa.
                </span>
                <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  {completedCount} aprobadas
                </span>
              </span>
            </div>
          </button>
        </div>

        {activePanel === "uploads" ? (
          <UploadHistorySection />
        ) : (
        <div className="space-y-5">
            <div className="grid gap-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="flex w-full items-center justify-between"
                >
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Filtros de solicitudes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Filtra solicitudes activas por estado, semestre o programa.
                    </p>
                  </div>

                  <svg
                    className={`h-5 w-5 text-slate-500 transition-transform ${showFilters ? "rotate-180" : "rotate-0"
                      }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showFilters && (
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div>
                      <FilterCombobox
                        label="Estado"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                          { value: "todas", label: "Todas" },
                          { value: "pendiente", label: "Pendiente" },
                          { value: "requiere_ajustes", label: "Requiere ajustes" },
                        ]}
                      />
                    </div>

                    <div>
                      <FilterCombobox
                        label="Semestre"
                        value={semesterFilter}
                        onChange={setSemesterFilter}
                        options={[
                          { value: "todos", label: "Todos" },
                          ...semesters.map((item) => ({ value: item.code, label: item.name })),
                        ]}
                      />
                    </div>

                    <div>
                      <FilterCombobox
                        label="Programa"
                        value={programFilter}
                        onChange={setProgramFilter}
                        options={[
                          { value: "todos", label: "Todos" },
                          ...programs.map((item) => ({ value: item.name, label: item.name })),
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Solicitudes activas
                  </h2>
                  <p className="text-sm text-slate-500">
                    Revisa pendientes y solicitudes que requieren ajustes. Las aprobadas quedan en Historial de cargas.
                  </p>
                </div>
                {filteredRequests.length > 0 && (
                  <PaginationControls
                    currentPage={safeCurrentPage}
                    pageSize={pageSize}
                    totalItems={filteredRequests.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                )}
                {isLoading && activeRequests.length === 0 ? (
                  <RequestsSkeleton />
                ) : filteredRequests.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      No hay solicitudes activas para los filtros seleccionados.
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                      Los filtros siguen activos para que puedas ajustar la busqueda sin perder el contexto.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                ) : (
                paginatedRequests.map((request) => {
                  const isExpanded = expandedId === request.id;
                  return (
                    <article
                      key={request.id}
                      onClick={() => toggleExpand(request.id)}
                      className={`
                       relative cursor-pointer overflow-hidden
                       rounded-2xl border border-slate-200 bg-white p-5
                       shadow-sm
                   
                       transition-all duration-200 ease-out
                       hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg
                   
                       before:absolute before:left-0 before:top-0 before:h-full before:w-1
                       before:rounded-l-2xl before:transition-all before:duration-200
                       hover:before:w-1.5
                   
                       ${request.status === "pendiente" && "before:bg-amber-400"}
                       ${request.status === "requiere_ajustes" && "before:bg-orange-500"}
                       ${request.status === "aprobado" && "before:bg-emerald-500"}
                     `}
                    >
                      {/* Header resumido */}
                      {/* Header principal de la tarjeta */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Solicitud LMS
                          </p>

                          <h3 className="mt-1 text-lg font-semibold leading-tight text-slate-900">
                            {request.subject}
                          </h3>
                        </div>

                        <span
                          className={`shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabel[request.status]}
                        </span>
                      </div>

                      {/* Metadata + acción */}
                      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                            {request.level}
                          </span>

                          <span className="text-slate-300">•</span>

                          <span>{request.program}</span>

                          <span className="text-slate-300">•</span>

                          <span>{request.semester}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleExpand(request.id);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md active:scale-95"
                        >
                          <span>{isExpanded ? "Ocultar detalles" : "Ver detalles"}</span>

                          <svg
                            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"
                              }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <div
                        className={`
                        overflow-hidden transition-all duration-300 ease-out
                        ${isExpanded ? "mt-5 max-h-[1400px] opacity-100" : "mt-0 max-h-0 opacity-0"}
                      `}
                        onClick={(event) => event.stopPropagation()}
                      >
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                          <div className="grid gap-3 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.15fr)]">
                            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Creación
                              </p>

                              <p className="mt-2 text-sm font-medium text-slate-700">
                                {formatDateTime(request.createdAt)}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {request.createdByName} · {request.createdByRole}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Descripción
                              </p>

                              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                {request.summary}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 lg:col-span-2">
                              <ContentTypePills items={request.contentTypes} />
                            </div>

                            <DriveFilesPanel subjectId={request.id} className="lg:col-span-2" />

                            {request.adjustmentNotes && (
                              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 lg:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                                  Observaciones solicitadas
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-orange-800">
                                  {request.adjustmentNotes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                            {request.status === "pendiente" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openApprovalBox(request.id)}
                                  className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  Aprobar
                                </button>

                                {/* Solicitar ajustes: abre el chatbox obligatorio.
                                    No cambia el estado hasta que el coordinador confirme con observaciones. */}
                                <button
                                  type="button"
                                  onClick={() => openAdjustmentBox(request.id)}
                                  className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                                >
                                  Solicitar ajustes
                                </button>
                              </>
                            )}
                          </div>

                          {/* --- CHATBOX DE AJUSTES ---
                                Se muestra solo cuando el coordinador hace clic en "Solicitar ajustes".
                                El coordinador debe escribir observaciones antes de confirmar. */}
                          {adjustmentBoxId === request.id && (
                            <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
                              <p className="mb-2 text-sm font-semibold text-orange-800">
                                Observaciones para el GIF
                              </p>
                              <p className="mb-3 text-xs text-orange-600">
                                Explica qué debe corregir el GIF. Este texto será visible en su panel.
                              </p>

                              {/* Textarea de observaciones */}
                              <textarea
                                value={adjustmentNotes}
                                onChange={(e) => {
                                  setAdjustmentNotes(e.target.value);
                                  // Limpia el error en cuanto el coordinador empieza a escribir.
                                  if (adjustmentError) setAdjustmentError("");
                                }}
                                rows={4}
                                placeholder="Describe las correcciones necesarias..."
                                className="w-full resize-none rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
                              />

                              {/* Mensaje de validación: aparece solo si se intenta confirmar sin texto */}
                              {adjustmentError && (
                                <p className="mt-2 text-xs font-medium text-red-600">
                                  {adjustmentError}
                                </p>
                              )}

                              {/* Botones del chatbox */}
                              <div className="mt-3 flex justify-end gap-2">
                                {/* Cancelar: cierra el chatbox sin cambiar el estado */}
                                <button
                                  type="button"
                                  onClick={cancelAdjustmentBox}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                  Cancelar
                                </button>

                                {/* Confirmar: valida el textarea y llama a rejectRequest */}
                                <button
                                  type="button"
                                  onClick={() => confirmAdjustments(request.id)}
                                  className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 active:scale-95"
                                >
                                  Confirmar ajustes
                                </button>
                              </div>
                            </div>
                          )}

                          {/* --- PANEL DE APROBACIÓN --- */}
                          {approvalBoxId === request.id && (
                            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                              {approvingId === request.id && (
                                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                                  <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-600" />
                                </div>
                              )}
                              <p className="mb-2 text-sm font-semibold text-emerald-800">
                                {approvingId === request.id ? "Confirmando aprobación" : "Confirmar aprobación"}
                              </p>
                              <p className="mb-3 text-xs text-emerald-700">
                                {approvingId === request.id
                                  ? "Confirmando aprobación de la solicitud."
                                  : "El material ya fue copiado al Drive de revisión. Confirma si la revisión es satisfactoria."}
                              </p>

                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApprovalBoxId(null);
                                  }}
                                  disabled={approvingId === request.id}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmApproval(request.id)}
                                  disabled={approvingId === request.id}
                                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95 disabled:cursor-wait disabled:bg-emerald-400"
                                >
                                  {approvingId === request.id ? "Procesando..." : "Confirmar aprobación"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>

                  );

                })
                )}
                {filteredRequests.length > pageSize && (
                  <PaginationControls
                    currentPage={safeCurrentPage}
                    pageSize={pageSize}
                    totalItems={filteredRequests.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                )}
              </div>

            </div>

        </div>
        )}

      </div>

    </section>

  );

}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible conectar con el backend.";
}

function RequestsSkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="h-5 w-2/5 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-3">
              <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="h-7 w-40 animate-pulse rounded-full bg-slate-200" />
              <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

