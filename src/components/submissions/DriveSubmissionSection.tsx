import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { ContentTypePills } from "@/components/shared/ContentTypePills";
import { MegaFilesPanel } from "@/components/shared/MegaFilesPanel";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/Button";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { catalogsApi, materiasApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRequestsStore } from "@/store/requestsStore";
import type { AcademicLevel, ApiContentType, ApiProgram, ApiSemester, ContentTypeCode, RequestStatus } from "@/types";

const academicLevels: AcademicLevel[] = ["PREGRADO", "POSGRADO", "ESPECIALIZACION", "DIPLOMADO"];

const schema = z.object({
    subject: z.string().min(1, "La materia es obligatoria"),
    level: z.string().min(1, "El nivel o tipo es obligatorio"),
    summary: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    source: z.string().url("Debe ser una URL válida (ej: https://drive.google.com/...)"),
    contentTypeCodes: z.array(z.string()).min(1, "Selecciona al menos un tipo de contenido"),
});

type SubmissionForm = z.infer<typeof schema>;

export function DriveSubmissionSection() {
    type GifStatusFilter = RequestStatus | "todas";
    const [view, setView] = useState<"new" | "list">("new");
    const createRequest = useRequestsStore((state) => state.createRequest);
    const loadMyRequests = useRequestsStore((state) => state.loadMyRequests);
    const requests = useRequestsStore((state) => state.requests);
    const isLoading = useRequestsStore((state) => state.isLoading);
    // Accion para que Fabrica notifique que corrigio una solicitud con ajustes.
    const notifyCorrectionsReady = useRequestsStore((state) => state.notifyCorrectionsReady);
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, reset, setValue, watch } = useForm<SubmissionForm>({
        resolver: zodResolver(schema),
        defaultValues: { contentTypeCodes: [] },
    });
    const selectedLevel = watch("level");
    const [semester, setSemester] = useState("");
    const [program, setProgram] = useState("");
    const [contentTypes, setContentTypes] = useState<ApiContentType[]>([]);
    const [semesters, setSemesters] = useState<ApiSemester[]>([]);
    const [programs, setPrograms] = useState<ApiProgram[]>([]);
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState<GifStatusFilter>("todas");
    const [semesterFilter, setSemesterFilter] = useState("todos");
    const [programFilter, setProgramFilter] = useState("todos");
    const [transferPercent, setTransferPercent] = useState(0);
    const [transferCurrentFile, setTransferCurrentFile] = useState("");
    const [transferDetails, setTransferDetails] = useState("");
    const [isTransferActive, setIsTransferActive] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estilos visuales por estado (misma paleta que el panel de coordinador).
    // "requiere_ajustes" usa naranja porque representa ajustes pendientes, no un rechazo definitivo.
    const statusStyles: Record<RequestStatus, string> = {
        pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
        aprobado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        requiere_ajustes: "bg-orange-50 text-orange-700 border border-orange-200",
    };

    // Etiquetas legibles para el GIF.
    // "requiere_ajustes" indica que Fabrica debe corregir y notificar al revisor.
    const statusLabel: Record<RequestStatus, string> = {
        pendiente: "PENDIENTE",
        aprobado: "APROBADO",
        requiere_ajustes: "REQUIERE AJUSTES",
    };

    const myRequests = requests.filter((request) => request.createdByRole === "gif");
    const semesterOptions = Array.from(new Set(myRequests.map((request) => request.semester))).sort();
    const programOptions = Array.from(new Set(myRequests.map((request) => request.program))).sort();

    const filteredRequests = myRequests.filter((request) => {
        const matchesStatus =
            statusFilter === "todas" || request.status === statusFilter;

        const matchesSemester =
            semesterFilter === "todos" || request.semester === semesterFilter;

        const matchesProgram =
            programFilter === "todos" || request.program === programFilter;

        return matchesStatus && matchesSemester && matchesProgram;
    });
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedRequests = filteredRequests.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

    useEffect(() => {
        if (!user || user.role !== "FABRICA") return;
        void catalogsApi.contentTypes().then(setContentTypes).catch((error) => toast.error(readError(error)));
        void catalogsApi.semesters().then(setSemesters).catch((error) => toast.error(readError(error)));
        void catalogsApi.programs().then(setPrograms).catch((error) => toast.error(readError(error)));
    }, [user]);

    useEffect(() => {
        if (!user || user.role !== "FABRICA") return;
        void loadMyRequests().catch((error) => toast.error(readError(error)));
    }, [loadMyRequests, user]);

    useEffect(() => {
        if (!user || user.role !== "FABRICA") return undefined;

        const refresh = () => {
            if (document.visibilityState === "visible" && !isLoading) {
                void loadMyRequests().catch(() => undefined);
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
    }, [isLoading, loadMyRequests, user]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, semesterFilter, programFilter, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const onSubmit = async (data: SubmissionForm) => {
        /**
         * Persistimos en Zustand para compartir la data con la vista de Coordinador
         * y también reutilizarla en "Mis solicitudes".
         */
        let poll: number | undefined;
        try {
        if (!semester || !program) {
            toast.error("Selecciona semestre y programa antes de enviar.");
            return;
        }
        const transferId = crypto.randomUUID();
        setIsTransferActive(true);
        setTransferPercent(1);
        setTransferCurrentFile("Preparando transferencia...");
        poll = window.setInterval(() => {
            void materiasApi.transferProgress(transferId).then((progress) => {
                setTransferPercent(progress.percent);
                setTransferCurrentFile(progress.currentFile ?? statusText(progress.status));
                setTransferDetails(progressDetails(progress));
            }).catch(() => undefined);
        }, 900);

        await createRequest({
            subject: data.subject,
            level: data.level as AcademicLevel,
            source: data.source,
            summary: data.summary,
            semester,
            program,
            contentTypeCodes: data.contentTypeCodes as ContentTypeCode[],
            transferId,
        });
        window.clearInterval(poll);
        setTransferPercent(100);
        setTransferCurrentFile("Transferencia completada");
        setTransferDetails("");
        toast.success("Solicitud enviada");
        reset({ subject: "", level: "", source: "", summary: "", contentTypeCodes: [] });
        setSemester("");
        setProgram("");
        setView("list");
        } catch (error) {
            toast.error(readError(error));
        } finally {
            if (poll) window.clearInterval(poll);
            window.setTimeout(() => {
                setIsTransferActive(false);
                setTransferPercent(0);
                setTransferCurrentFile("");
                setTransferDetails("");
            }, 1200);
        }
    };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAFAFA]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40rem] w-[40rem] animate-[spin_40s_linear_infinite] rounded-full bg-blue-300/20 blur-[120px]" />
        <div className="absolute -right-[5%] top-[20%] h-[35rem] w-[35rem] animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-indigo-300/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[30rem] w-[30rem] animate-[spin_50s_linear_infinite_reverse] rounded-full bg-cyan-300/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[min(1280px,calc(100%-2rem))] flex-col px-4 pb-12 pt-36 sm:px-6 sm:pb-16 sm:pt-50">
        <div className="mb-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setView("new")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === "new" ? "bg-teal-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Nueva solicitud
          </button>

          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === "list" ? "bg-teal-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Mis solicitudes
          </button>
        </div>

                {/* Formulario principal de carga */}
                {view === "new" && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="mx-auto mt-10 w-full max-w-4xl px-4"
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            {isTransferActive && (
                              <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                                <div className="mb-3 h-2 overflow-hidden rounded-full bg-blue-100">
                                  <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                    style={{ width: `${Math.max(transferPercent, 1)}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-blue-900">
                                    Transfiriendo archivos de Drive a MEGA
                                  </p>
                                  <span className="text-sm font-bold text-blue-900">{Math.round(transferPercent)}%</span>
                                </div>
                                <p className="mt-1 truncate text-xs text-blue-700">
                                  {transferCurrentFile || "La solicitud se enviará cuando el material quede listo para revisión."}
                                </p>
                                {transferDetails && (
                                  <p className="mt-1 text-xs font-medium text-blue-800">
                                    {transferDetails}
                                  </p>
                                )}
                              </div>
                            )}
                            {/* Campo de materia */}
                            {/* Fila inicial: materia y nivel/tipo */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Campo de materia */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Materia
                                    </label>

                                    <Input
                                        className="h-12 border-slate-200 bg-slate-50 text-slate-700 shadow-none transition-colors focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                        placeholder="Nombre..."
                                        {...register("subject")}
                                    />
                                </div>

                                {/* Campo de nivel o tipo */}
                                <div>
                                    <FilterCombobox
                                        label="Nivel / Tipo"
                                        value={selectedLevel || ""}
                                        onChange={(nextLevel) => setValue("level", nextLevel, { shouldDirty: true, shouldValidate: true })}
                                        options={[
                                            { value: "", label: "Seleccione..." },
                                            ...academicLevels.map((level) => ({ value: level, label: labelForContentType(level) })),
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <FilterCombobox
                                        label="Semestre"
                                        value={semester}
                                        onChange={setSemester}
                                        options={[
                                            { value: "", label: "Selecciona un semestre" },
                                            ...semesters.map((item) => ({ value: item.code, label: item.name })),
                                        ]}
                                    />
                                </div>

                                {/* Campo para seleccionar programa */}
                                <div>
                                    <FilterCombobox
                                        label="Programa"
                                        value={program}
                                        onChange={setProgram}
                                        options={[
                                            { value: "", label: "Selecciona un programa" },
                                            ...programs.map((item) => ({ value: item.name, label: item.name })),
                                        ]}
                                    />
                                </div>
                            </div>

              <Field label="URL de Google Drive" className="mt-5">
                <Input
                  className="h-12 border-slate-200 bg-slate-50 text-slate-700 shadow-none transition-colors focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  placeholder="Enlace de la carpeta..."
                  {...register("source")}
                />
              </Field>

              <Field label="Tipos de contenido" className="mt-5">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {contentTypes.map((contentType) => (
                    <label
                      key={contentType.code}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"
                    >
                      <input
                        type="checkbox"
                        value={contentType.code}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        {...register("contentTypeCodes")}
                      />
                      {contentType.name}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Descripción" className="mt-5">
                <Textarea
                  className="resize-none border-slate-200 bg-slate-50 text-slate-700 shadow-none transition-colors focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  rows={4}
                  placeholder="Breve detalle del material..."
                  {...register("summary")}
                />
              </Field>

              <RevealOnScroll
                as="section"
                viewportAmount={0.18}
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-blue-200/50 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 p-6 shadow-inner sm:p-8"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />

                <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-blue-900">
                      Revisión previa al envío
                    </h2>

                    <p className="mt-2 max-w-md text-sm text-blue-800/70">
                                            Confirma que el resumen y el enlace son correctos. Al enviar, el sistema copiará el material a MEGA y lo dejará listo como{" "}
                                            <span className="font-semibold text-blue-900">Pendiente</span>.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="group relative overflow-hidden rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-[0_0_20px_rgb(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgb(37,99,235,0.5)]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isTransferActive ? "Preparando link MEGA..." : "Enviar solicitud"}
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </span>

                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    </Button>
                                </div>
                            </RevealOnScroll>
                        </div>
                    </form>

                )}
                {view === "list" && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-700 mb-4">
                            Mis solicitudes
                        </h2>
                        {myRequests.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Aún no tienes solicitudes creadas.
                            </p>
                        ) : (
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
                                                Filtra por estado, semestre o programa.
                                            </p>
                                        </div>

                                        <svg
                                            className={`h-5 w-5 text-slate-500 transition-transform ${showFilters ? "rotate-180" : "rotate-0"}`}
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
                                                        { value: "aprobado", label: "Aprobada" },
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
                                                        ...semesterOptions.map((semesterValue) => ({ value: semesterValue, label: semesterValue })),
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
                                                        ...programOptions.map((programValue) => ({ value: programValue, label: programValue })),
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {filteredRequests.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                                        <p className="text-sm font-medium text-slate-700">
                                            No hay solicitudes para este filtro.
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Ajusta los filtros para ver más resultados.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        <PaginationControls
                                            currentPage={safeCurrentPage}
                                            pageSize={pageSize}
                                            totalItems={filteredRequests.length}
                                            onPageChange={setCurrentPage}
                                            onPageSizeChange={setPageSize}
                                        />
                                {paginatedRequests.map((request) => {
                                    const isExpanded = expandedRequestId === request.id;
                                    return (
                                        <article
                                            key={request.id}
                                            className={`
                                                relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
                                                transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg
                                                before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl before:transition-all before:duration-200 hover:before:w-1.5
                                                ${request.status === "pendiente" && "before:bg-amber-400"}
                                                ${request.status === "requiere_ajustes" && "before:bg-orange-500"}
                                                ${request.status === "aprobado" && "before:bg-emerald-500"}
                                            `}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Solicitud LMS
                                                    </p>
                                                    <h3 className="mt-1 text-lg font-semibold leading-tight text-slate-900">
                                                        {request.subject}
                                                    </h3>
                                                </div>

                                                <span className={`shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {statusLabel[request.status]}
                                                </span>
                                            </div>

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
                                                    onClick={() =>
                                                        setExpandedRequestId((currentId) =>
                                                            currentId === request.id ? null : request.id
                                                        )
                                                    }
                                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md active:scale-95"
                                                >
                                                    <span>{isExpanded ? "Ocultar detalles" : "Ver detalles"}</span>
                                                    <svg
                                                        className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`}
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
                                            >
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                                Creación
                                                            </p>
                                                            <p className="mt-2 text-sm font-medium text-slate-700">
                                                                {request.createdAt}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {request.createdByName ?? "GIF"} · {request.createdByRole}
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
                                                            <ContentTypePills items={request.contentTypes} />
                                                        </div>

                                                        <MegaFilesPanel subjectId={request.id} />
                                                    </div>

                                                    {/* Bloque de observaciones del coordinador:
                                                        Se muestra cuando la solicitud requiere ajustes.
                                                        El GIF ve aquí qué debe corregir antes de reenviar. */}
                                                    {request.status === "requiere_ajustes" && (
                                                        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
                                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                                                                Observaciones del coordinador
                                                            </p>
                                                            {request.adjustmentNotes ? (
                                                                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                                                    {request.adjustmentNotes}
                                                                </p>
                                                            ) : (
                                                                <p className="mt-1 text-sm italic text-slate-400">
                                                                    El coordinador no dejó observaciones adicionales.
                                                                </p>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void notifyCorrectionsReady(request.id)
                                                                        .then(() => toast.success("Correcciones notificadas"))
                                                                        .catch((error) => toast.error(readError(error)))
                                                                }
                                                                className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-95"
                                                            >
                                                                Notificar correcciones
                                                            </button>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
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
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function labelForContentType(code: string) {
  return code
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible conectar con el backend.";
}

function statusText(status: string) {
    if (status === "listing") return "Leyendo carpeta de Drive...";
    if (status === "uploading") return "Subiendo archivos a MEGA...";
    if (status === "completed") return "Transferencia completada";
    if (status === "failed") return "La transferencia falló";
    return "Preparando transferencia...";
}

function progressDetails(progress: {
    totalFiles: number;
    completedFiles: number;
    totalBytes: number;
    transferredBytes: number;
}) {
    const files = progress.totalFiles > 0
        ? `${progress.completedFiles}/${progress.totalFiles} archivo(s)`
        : "";
    const bytes = progress.totalBytes > 0
        ? `${formatBytes(progress.transferredBytes)} / ${formatBytes(progress.totalBytes)}`
        : "";

    return [files, bytes].filter(Boolean).join(" · ");
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

