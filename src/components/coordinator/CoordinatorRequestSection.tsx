import type { ApiProgram, ApiSemester, RequestStatus } from "@/types";
import { catalogsApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ContentTypePills } from "@/components/shared/ContentTypePills";
import { useAuthStore } from "@/store/authStore";
import { useRequestsStore } from "@/store/requestsStore";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Folder, MoreVertical } from "lucide-react";

export function CoordinatorRequestsSection() {
  const requests = useRequestsStore((state) => state.requests);
  const loadCoordinatorRequests = useRequestsStore(
    (state) => state.loadCoordinatorRequests,
  );
  const approveRequest = useRequestsStore((state) => state.approveRequest);
  const rejectRequest = useRequestsStore((state) => state.rejectRequest);
  const user = useAuthStore((state) => state.user);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "todas">(
    "todas",
  );
  const [semesterFilter, setSemesterFilter] = useState("todos");
  const [programFilter, setProgramFilter] = useState("todos");
  const [semesters, setSemesters] = useState<ApiSemester[]>([]);
  const [programs, setPrograms] = useState<ApiProgram[]>([]);

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
  // approvalLink: link obligatorio que se guarda al confirmar aprobación.
  const [approvalLink, setApprovalLink] = useState("");
  // approvalError: mensaje de validación cuando se confirma sin link.
  const [approvalError, setApprovalError] = useState("");

  useEffect(() => {
    if (!user || (user.role !== "LMS" && user.role !== "ADMIN")) return;
    void loadCoordinatorRequests().catch((error) =>
      toast.error(readError(error)),
    );
    void catalogsApi
      .semesters()
      .then(setSemesters)
      .catch((error) => toast.error(readError(error)));
    void catalogsApi
      .programs()
      .then(setPrograms)
      .catch((error) => toast.error(readError(error)));
  }, [loadCoordinatorRequests, user]);

  // Aplica los tres filtros al mismo tiempo:
  // estado, semestre y programa.
  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      statusFilter === "todas" || request.status === statusFilter;

    const matchesSemester =
      semesterFilter === "todos" || request.semester === semesterFilter;

    const matchesProgram =
      programFilter === "todos" || request.program === programFilter;

    return matchesStatus && matchesSemester && matchesProgram;
  });

  const statusStyles: Record<RequestStatus, string> = {
    pendiente: "border border-cyan-200/80 bg-cyan-50/70 text-cyan-800",
    aprobado: "border border-teal-200/80 bg-teal-50/70 text-teal-800",
    requiere_ajustes: "border border-rose-200/80 bg-rose-50/70 text-rose-800",
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
      setApprovalLink("");
      setApprovalError("");
    }
  }

  /**
   * Abre el chatbox de ajustes para una solicitud específica.
   * No cambia el estado de la solicitud hasta que el coordinador confirme.
   */
  function openAdjustmentBox(requestId: string) {
    // Si se abre "Solicitar ajustes", se cierra el panel de aprobación.
    setApprovalBoxId(null);
    setApprovalLink("");
    setApprovalError("");
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
      setAdjustmentError(
        "Debes escribir una observación antes de solicitar ajustes.",
      );
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
    setApprovalLink("");
    setApprovalError("");
  }

  function confirmApproval(requestId: string) {
    const normalizedLink = approvalLink.trim();
    if (normalizedLink === "") {
      setApprovalError("Debes pegar un link antes de confirmar la aprobación.");
      return;
    }
    void approveRequest(requestId, normalizedLink)
      .then(() => {
        setApprovalBoxId(null);
        setApprovalLink("");
        setApprovalError("");
      })
      .catch((error) => toast.error(readError(error)));
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#FAFAFA]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40rem] w-[40rem] rounded-full bg-blue-300/20 blur-[120px]" />
        <div className="absolute -right-[5%] top-[20%] h-[35rem] w-[35rem] rounded-full bg-indigo-300/20 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[min(100%,96rem)] flex-col px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Panel LMS
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Solicitudes recibidas
          </h2>
          <p className="mx-auto mt-3 max-w-4xl text-sm leading-relaxed text-slate-500">
            Aquí aparecerán las solicitudes creadas por los GIF para que el
            coordinador pueda revisarlas, hacer seguimiento y gestionar su
            estado.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-800">
                  Filtros de solicitudes
                </h3>
                <p className="text-xs text-slate-500">
                  Filtra por estado, semestre o programa.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Estado
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as RequestStatus | "todas",
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="todas">Todas</option>
                    <option value="pendiente">PENDIENTE</option>
                    <option value="aprobado">APROBADO</option>
                    <option value="requiere_ajustes">REQUIERE AJUSTES</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Semestre
                  </label>

                  <select
                    value={semesterFilter}
                    onChange={(event) => setSemesterFilter(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="todos">Todos</option>
                    {semesters.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Programa
                  </label>

                  <select
                    value={programFilter}
                    onChange={(event) => setProgramFilter(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="todos">Todos</option>
                    {programs.map((item) => (
                      <option key={item.code} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {filteredRequests.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-center text-sm text-slate-500 italic tracking-wide">
                  Aún no se han registrado solicitudes.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Solicitudes recibidas
                  </h2>
                  <p className="text-sm text-slate-500">
                    Revisa, valida y gestiona las solicitudes enviadas por los
                    GIF.
                  </p>
                </div>

                <div className="hidden border-b border-slate-200 bg-slate-50/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[2rem_minmax(0,1.4fr)_minmax(9rem,0.95fr)_minmax(11rem,1fr)_minmax(14rem,1.5fr)_minmax(7.5rem,auto)_auto_auto] md:items-center md:gap-x-4 md:px-4">
                  <span />
                  <span>Solicitud</span>
                  <span>Alta</span>
                  <span>GIF</span>
                  <span>Programa</span>
                  <span className="text-center">Estado</span>
                  <span className="text-right md:col-span-2"> </span>
                </div>

                {filteredRequests.map((request) => {
                  const isExpanded = expandedId === request.id;
                  return (
                    <div key={request.id} className="border-b border-slate-100 last:border-b-0">
                      <article
                        onClick={() => toggleExpand(request.id)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-slate-50/90",
                          isExpanded &&
                            "bg-sky-50/60 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.35)]",
                        )}
                      >
                        <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-3 sm:py-2 md:grid md:grid-cols-[2rem_minmax(0,1.4fr)_minmax(9rem,0.95fr)_minmax(11rem,1fr)_minmax(14rem,1.5fr)_minmax(7.5rem,auto)_auto_auto] md:items-center md:gap-x-4 md:px-4 md:py-2">
                          <Folder
                            className="h-5 w-5 shrink-0 text-slate-500 md:justify-self-center"
                            strokeWidth={1.75}
                            aria-hidden
                          />

                          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-slate-900 md:flex-none">
                            {request.subject}
                          </h3>

                          <div className="hidden min-w-0 text-xs text-slate-600 md:contents">
                            <span
                              className="hidden tabular-nums text-slate-500 md:block"
                              title="Fecha de registro"
                            >
                              {request.createdAt}
                            </span>
                            <span
                              className="hidden max-w-full truncate md:block"
                              title={request.createdByName ?? "Solicitante"}
                            >
                              {request.createdByName?.trim() ? request.createdByName : "—"}
                            </span>
                            <span
                              className="hidden max-w-full truncate md:block"
                              title={`${request.program} · ${request.semester}`}
                            >
                              <span className="text-slate-700">{request.program}</span>
                              <span className="text-slate-300"> · </span>
                              <span className="text-slate-500">{request.semester}</span>
                            </span>
                          </div>

                          <span
                            className={cn(
                              "shrink-0 justify-self-center text-[10px] font-bold uppercase tracking-wide",
                              "inline-flex origin-center items-center gap-1.5 rounded-full px-2.5 py-0.5",
                              statusStyles[request.status],
                              request.status === "pendiente" &&
                                "motion-safe:animate-status-badge-attention",
                            )}
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                            <span className="max-w-[6.5rem] truncate sm:max-w-none">
                              {statusLabel[request.status]}
                            </span>
                          </span>

                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 md:justify-self-end",
                              isExpanded ? "rotate-180" : "rotate-0",
                            )}
                            aria-hidden
                          />

                          <button
                            type="button"
                            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 outline-none hover:bg-slate-200/60 hover:text-slate-600 md:justify-self-end"
                            aria-label="Más opciones"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </button>
                        </div>
                      </article>

                      <div
                        className={cn(
                          "overflow-hidden bg-slate-50/95 transition-all duration-300 ease-out",
                          isExpanded ? "max-h-[1600px] border-t border-slate-100 opacity-100" : "max-h-0 opacity-0",
                        )}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="space-y-4 px-3 py-4 sm:px-4 sm:py-5">
                          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Drive
                                </p>

                                <a
                                  href={request.source}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                >
                                  Ver enlace
                                  <span aria-hidden="true">↗</span>
                                </a>
                              </div>

                              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Creación
                                </p>

                                <p className="mt-2 text-sm font-medium text-slate-700">
                                  {request.createdAt}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {request.createdByName} ·{" "}
                                  {request.createdByRole}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 md:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Nivel y académico
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                  {request.level} · {request.program} ·{" "}
                                  {request.semester}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 md:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Descripción
                                </p>

                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                  {request.summary}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 md:col-span-2">
                                <ContentTypePills
                                  items={request.contentTypes}
                                />
                              </div>

                              {request.approvalLink && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                    Link de aprobación
                                  </p>

                                  <a
                                    href={request.approvalLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                                  >
                                    Abrir link aprobado
                                    <span aria-hidden="true">↗</span>
                                  </a>
                                </div>
                              )}

                              {request.adjustmentNotes && (
                                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 md:col-span-2">
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

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openAdjustmentBox(request.id)
                                    }
                                    className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                                  >
                                    Solicitar ajustes
                                  </button>
                                </>
                              )}
                            </div>

                            {adjustmentBoxId === request.id && (
                              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
                                <p className="mb-2 text-sm font-semibold text-orange-800">
                                  Observaciones para el GIF
                                </p>
                                <p className="mb-3 text-xs text-orange-600">
                                  Explica qué debe corregir el GIF. Este texto
                                  será visible en su panel.
                                </p>

                                <textarea
                                  value={adjustmentNotes}
                                  onChange={(e) => {
                                    setAdjustmentNotes(e.target.value);
                                    if (adjustmentError) setAdjustmentError("");
                                  }}
                                  rows={4}
                                  placeholder="Describe las correcciones necesarias..."
                                  className="w-full resize-none rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
                                />

                                {adjustmentError && (
                                  <p className="mt-2 text-xs font-medium text-red-600">
                                    {adjustmentError}
                                  </p>
                                )}

                                <div className="mt-3 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={cancelAdjustmentBox}
                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                  >
                                    Cancelar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      confirmAdjustments(request.id)
                                    }
                                    className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 active:scale-95"
                                  >
                                    Confirmar ajustes
                                  </button>
                                </div>
                              </div>
                            )}

                            {approvalBoxId === request.id && (
                              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                                <p className="mb-2 text-sm font-semibold text-emerald-800">
                                  Confirmar aprobación
                                </p>
                                <p className="mb-3 text-xs text-emerald-700">
                                  Pega el link final para aprobar esta
                                  solicitud.
                                </p>

                                <input
                                  type="url"
                                  value={approvalLink}
                                  onChange={(event) => {
                                    setApprovalLink(event.target.value);
                                    if (approvalError) setApprovalError("");
                                  }}
                                  placeholder="https://..."
                                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300/40"
                                  required
                                />

                                {approvalError && (
                                  <p className="mt-2 text-xs font-medium text-red-600">
                                    {approvalError}
                                  </p>
                                )}

                                <div className="mt-3 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setApprovalBoxId(null);
                                      setApprovalLink("");
                                      setApprovalError("");
                                    }}
                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => confirmApproval(request.id)}
                                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
                                  >
                                    Confirmar aprobación
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function readError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No fue posible conectar con el backend.";
}
