import type { RequestStatus } from "@/types";
import { useRequestsStore } from "@/store/requestsStore";
import { useState } from "react";
export function CoordinatorRequestsSection() {
  const requests = useRequestsStore((state) => state.requests);
  const approveRequest = useRequestsStore((state) => state.approveRequest);
  const rejectRequest = useRequestsStore((state) => state.rejectRequest);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "todas">(
    "todas",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("todos");
  const [programFilter, setProgramFilter] = useState("todos");

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
    aprobada: "border border-teal-200/80 bg-teal-50/70 text-teal-800",
    // "rechazada" significa que el coordinador pidió ajustes al GIF.
    // No es un rechazo definitivo: el GIF puede corregir y reenviar.
    rechazada: "border border-rose-200/80 bg-rose-50/70 text-rose-800",
  };

  const statusLabel: Record<RequestStatus, string> = {
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    // "rechazada" se muestra como "Requiere ajustes" para indicar que
    // debe hacer correcciones y notificar al coordinador.
    rechazada: "Requiere ajustes",
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
    rejectRequest(requestId, adjustmentNotes.trim());
    setAdjustmentBoxId(null);
    setAdjustmentNotes("");
    setAdjustmentError("");
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
    approveRequest(requestId, normalizedLink);
    setApprovalBoxId(null);
    setApprovalLink("");
    setApprovalError("");
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#FAFAFA]">
      {/* Fondo visual de la sección */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40rem] w-[40rem] rounded-full bg-blue-300/20 blur-[120px]" />
        <div className="absolute -right-[5%] top-[20%] h-[35rem] w-[35rem] rounded-full bg-indigo-300/20 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
        {/* Encabezado de la sección */}
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Panel de coordinación
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Solicitudes recibidas
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            Aquí aparecerán las solicitudes creadas por los GIF para que el
            coordinador pueda revisarlas, hacer seguimiento y gestionar su
            estado.
          </p>
        </div>
        {/* Lista real de solicitudes compartidas por Zustand entre GIF y Coordinador */}
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
                      setStatusFilter(event.target.value as RequestStatus | "todas")
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="todas">Todas</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Requiere ajustes</option>
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
                    <option value="2024-1">2024-1</option>
                    <option value="2024-2">2024-2</option>
                    <option value="2025-1">2025-1</option>
                    <option value="2025-2">2025-2</option>
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
                    <option value="Administración de Empresas">
                      Administración de Empresas
                    </option>
                    <option value="Ingeniería de Sistemas">
                      Ingeniería de Sistemas
                    </option>
                    <option value="Diseño Gráfico">Diseño Gráfico</option>
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Solicitudes recibidas
                  </h2>
                  <p className="text-sm text-slate-500">
                    Revisa, valida y gestiona las solicitudes enviadas por los
                    GIF.
                  </p>
                </div>
                {filteredRequests.map((request) => {
                  const isExpanded = expandedId === request.id;
                  return (
                    <article
                      key={request.id}
                      onClick={() => toggleExpand(request.id)}
                      className={`
                       relative cursor-pointer overflow-hidden
                       rounded-[2rem] border border-white/40 bg-white/60 p-6
                       backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]
                   
                       transition-all duration-300 ease-out
                       hover:-translate-y-1 hover:border-white/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]
                   
                       before:absolute before:left-0 before:top-0 before:h-full before:w-1.5
                       before:transition-all before:duration-300
                       hover:before:w-2
                   
                       ${request.status === "pendiente" && "before:bg-gradient-to-b before:from-cyan-400 before:to-blue-500"}
                       ${request.status === "rechazada" && "before:bg-gradient-to-b before:from-rose-400 before:to-red-500"}
                       ${request.status === "aprobada" && "before:bg-gradient-to-b before:from-teal-400 before:to-emerald-500"}
                     `}
                    >
                      {/* Brillo decorativo de fondo */}
                      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-500 ${
                        request.status === "pendiente" ? "bg-cyan-400" :
                        request.status === "rechazada" ? "bg-rose-400" : "bg-teal-400"
                      }`} />

                      {/* 🔹 HEADER RESUMIDO */}
                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400/80 mb-1">
                            Solicitud LMS
                          </p>

                          <h3 className="text-xl font-extrabold leading-tight text-slate-900 tracking-tight">
                            {request.subject}
                          </h3>
                        </div>

                        <span
                          className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm ring-1 ring-white/50 backdrop-blur-md ${statusStyles[request.status]}`}
                        >
                          <span className={`h-2 w-2 rounded-full animate-pulse ${
                            request.status === "pendiente" ? "bg-cyan-500" :
                            request.status === "rechazada" ? "bg-rose-500" : "bg-teal-500"
                          }`} />
                          {statusLabel[request.status]}
                        </span>
                      </div>

                      {/* Metadata + acción */}
                      <div className="relative z-10 mt-6 flex flex-col gap-4 border-t border-slate-200/40 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium text-slate-500/90">
                          <span className="rounded-xl bg-slate-100/80 px-3.5 py-1.5 ring-1 ring-slate-200/50">
                            {request.level}
                          </span>

                          <span className="text-slate-300">/</span>

                          <span className="tracking-tight">{request.program}</span>

                          <span className="text-slate-300">/</span>

                          <span className="font-bold text-slate-400">{request.semester}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleExpand(request.id);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/50 px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 hover:shadow-md active:scale-95"
                        >
                          <span>
                            {isExpanded ? "Ocultar detalles" : "Ver detalles"}
                          </span>

                          <svg
                            className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"
                              }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>

                      <div
                        className={`
                        relative z-10 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                        ${isExpanded ? "mt-6 max-h-[1200px] opacity-100" : "mt-0 max-h-0 opacity-0"}
                      `}
                      >
                        <div className="rounded-[1.5rem] border border-white/60 bg-slate-50/40 p-1 shadow-inner">
                          <div className="rounded-[1.25rem] border border-slate-200/50 bg-white/40 p-6 backdrop-blur-md">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="group rounded-[1.25rem] bg-white/60 p-5 ring-1 ring-slate-200/40 transition-all hover:bg-white/80 hover:shadow-lg hover:shadow-blue-500/5">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                    Drive Source
                                  </p>
                                  <div className="h-2 w-2 rounded-full bg-blue-400/40" />
                                </div>

                                <a
                                  href={request.source}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-95"
                                >
                                  Ver material en Drive
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>

                              <div className="rounded-[1.25rem] bg-white/60 p-5 ring-1 ring-slate-200/40 transition-all hover:bg-white/80">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
                                  Información de Creación
                                </p>

                                <div className="flex items-center gap-4">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500 ring-1 ring-slate-200">
                                    {request.createdByName?.charAt(0) || "G"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">
                                      {request.createdAt}
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-500">
                                      {request.createdByName || "GIF User"} · {request.createdByRole}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-[1.25rem] bg-white/60 p-5 ring-1 ring-slate-200/40 md:col-span-2 transition-all hover:bg-white/80">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3">
                                  Resumen de la Solicitud
                                </p>

                                <p className="text-[14px] leading-relaxed text-slate-600 font-medium italic">
                                  "{request.summary}"
                                </p>
                              </div>

                              {request.adjustmentNotes && (
                                <div className="rounded-[1.25rem] border border-rose-200/50 bg-rose-50/50 p-5 md:col-span-2 ring-1 ring-rose-500/10">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-700">
                                      Observaciones solicitadas
                                    </p>
                                  </div>
                                  <p className="text-sm leading-relaxed text-rose-900/80 font-medium">
                                    {request.adjustmentNotes}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-200/60 pt-6">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openApprovalBox(request.id);
                                }}
                                className="group relative overflow-hidden rounded-2xl bg-teal-50 px-6 py-3 text-sm font-bold text-teal-800 transition-all hover:bg-teal-500 hover:text-white hover:shadow-lg hover:shadow-teal-500/20 active:scale-95"
                              >
                                <span className="relative z-10">Aprobar Solicitud</span>
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-transform duration-300 group-hover:translate-x-0" />
                              </button>

                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openAdjustmentBox(request.id);
                                }}
                                className="group relative overflow-hidden rounded-2xl bg-rose-50 px-6 py-3 text-sm font-bold text-rose-800 transition-all hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20 active:scale-95"
                              >
                                <span className="relative z-10">Solicitar ajustes</span>
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-rose-400 to-red-500 transition-transform duration-300 group-hover:translate-x-0" />
                              </button>
                            </div>

                            {adjustmentBoxId === request.id && (
                              <div
                                className="mt-6 rounded-[1.5rem] border border-rose-200/50 bg-white/80 p-6 shadow-xl shadow-rose-500/5"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="h-4 w-1 rounded-full bg-rose-500" />
                                  <p className="text-sm font-bold text-rose-900 tracking-tight">
                                    Panel de Observaciones
                                  </p>
                                </div>
                                <p className="mb-4 text-xs font-medium text-slate-500 leading-relaxed">
                                  Explica detalladamente qué debe corregir el GIF. Estas observaciones serán visibles instantáneamente en su panel de control.
                                </p>

                                <textarea
                                  value={adjustmentNotes}
                                  onChange={(e) => {
                                    setAdjustmentNotes(e.target.value);
                                    if (adjustmentError) setAdjustmentError("");
                                  }}
                                  rows={4}
                                  placeholder="Escribe aquí las correcciones necesarias..."
                                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-slate-700 outline-none transition-all focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
                                />

                                {adjustmentError && (
                                  <p className="mt-3 text-xs font-bold text-rose-600 flex items-center gap-1.5">
                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    {adjustmentError}
                                  </p>
                                )}

                                <div className="mt-5 flex justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={cancelAdjustmentBox}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
                                  >
                                    Descartar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      confirmAdjustments(request.id)
                                    }
                                    className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-black active:scale-95 shadow-lg shadow-black/10"
                                  >
                                    Confirmar y Notificar
                                  </button>
                                </div>
                              </div>
                            )}

                            {approvalBoxId === request.id && (
                              <div
                                className="mt-6 rounded-[1.5rem] border border-teal-200/50 bg-white/80 p-6 shadow-xl shadow-teal-500/5"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="h-4 w-1 rounded-full bg-teal-500" />
                                  <p className="text-sm font-bold text-teal-900 tracking-tight">
                                    Aprobación Final
                                  </p>
                                </div>
                                <p className="mb-4 text-xs font-medium text-slate-500 leading-relaxed">
                                  Para completar la aprobación, es obligatorio proporcionar el enlace final donde se ha desplegado o virtualizado el material.
                                </p>

                                <input
                                  type="url"
                                  value={approvalLink}
                                  onChange={(event) => {
                                    setApprovalLink(event.target.value);
                                    if (approvalError) setApprovalError("");
                                  }}
                                  placeholder="Pega el link final aquí (https://...)"
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                                  required
                                />

                                {approvalError && (
                                  <p className="mt-3 text-xs font-bold text-rose-600 flex items-center gap-1.5">
                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    {approvalError}
                                  </p>
                                )}

                                <div className="mt-5 flex justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setApprovalBoxId(null);
                                      setApprovalLink("");
                                      setApprovalError("");
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => confirmApproval(request.id)}
                                    className="rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-teal-700 active:scale-95 shadow-lg shadow-teal-500/20"
                                  >
                                    Confirmar Aprobación
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
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
