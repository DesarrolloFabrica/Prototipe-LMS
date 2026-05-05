import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { ContentTypePills } from "@/components/shared/ContentTypePills";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { catalogsApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/authStore";
import { useRequestsStore } from "@/store/requestsStore";
import type { AcademicLevel, ApiContentType, ApiProgram, ApiSemester, ContentTypeCode, RequestStatus } from "@/types";

function readError(error: unknown) {
    return error instanceof Error ? error.message : "No fue posible conectar con el backend.";
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

/** Superficie por estado: degradado suave (sin sombra coloreada). */
const gifCardSurface: Record<RequestStatus, string> = {
  pendiente:
    "border-cyan-200/40 bg-gradient-to-br from-white via-cyan-50/30 to-cyan-100/50",
  aprobado:
    "border-teal-200/40 bg-gradient-to-br from-white via-teal-50/30 to-teal-100/50",
  requiere_ajustes:
    "border-rose-200/40 bg-gradient-to-br from-white via-rose-50/35 to-rose-100/45",
};

/** Barra lateral con degradado vertical según estado (imagen LMS). */
const gifCardAccentBar: Record<RequestStatus, string> = {
  pendiente: "bg-gradient-to-b from-cyan-300 via-cyan-500 to-cyan-600",
  aprobado: "bg-gradient-to-b from-teal-300 via-teal-500 to-teal-600",
  requiere_ajustes: "bg-gradient-to-b from-rose-300 via-rose-500 to-rose-600",
};

const academicLevels: AcademicLevel[] = ["PREGRADO", "POSGRADO", "ESPECIALIZACION", "DIPLOMADO"];

const schema = z.object({
    subject: z.string().min(1, "La materia es obligatoria"),
    level: z.string().min(1, "El nivel o tipo es obligatorio"),
    summary: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    driveFolderUrl: z.string().url("Debe ser una URL válida (ej: https://drive.google.com/...)"),
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
    const { register, handleSubmit, reset } = useForm<SubmissionForm>({
        resolver: zodResolver(schema),
        defaultValues: { contentTypeCodes: [] },
    });
    const [semester, setSemester] = useState("");
    const [program, setProgram] = useState("");
    const [contentTypes, setContentTypes] = useState<ApiContentType[]>([]);
    const [semesters, setSemesters] = useState<ApiSemester[]>([]);
    const [programs, setPrograms] = useState<ApiProgram[]>([]);
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<GifStatusFilter>("todas");
    const [semesterFilter, setSemesterFilter] = useState("todos");
    const [programFilter, setProgramFilter] = useState("todos");

    // Estilos visuales por estado (misma paleta que el panel de coordinador).
    // "requiere_ajustes" usa naranja porque representa ajustes pendientes, no un rechazo definitivo.
    const statusStyles: Record<RequestStatus, string> = {
        pendiente: "border border-cyan-200/80 bg-cyan-50/70 text-cyan-800",
        aprobado: "border border-teal-200/80 bg-teal-50/70 text-teal-800",
        requiere_ajustes: "border border-rose-200/80 bg-rose-50/70 text-rose-800",
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

    const onSubmit = async (data: SubmissionForm) => {
        /**
         * Persistimos en Zustand para compartir la data con la vista de Coordinador
         * y también reutilizarla en "Mis solicitudes".
         */
        try {
            await createRequest({
                subject: data.subject,
                level: data.level as AcademicLevel,
                driveFolderUrl: data.driveFolderUrl,
                summary: data.summary,
                semester,
                program,
                contentTypeCodes: data.contentTypeCodes as ContentTypeCode[],
            });
            toast.success("Solicitud enviada");
            reset({ subject: "", level: "", driveFolderUrl: "", summary: "", contentTypeCodes: [] });
            setSemester("");
            setProgram("");
            setView("list");
        } catch (error) {
            toast.error(readError(error));
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

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[min(1280px,calc(100%-2rem))] flex-col px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-35">
                <div className="mb-3 flex items-center justify-center gap-2">
                    <div className="relative inline-flex rounded-2xl bg-white/5 p-1 backdrop-blur-md border border-black/10">

                        <div
                            className={`absolute top-1 bottom-1 w-1/2 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30 transition-all duration-300 ${view === "new" ? "left-1" : "left-1/2"
                                }`}
                        />

                        <button
                            type="button"
                            onClick={() => setView("new")}
                            className={`relative z-10 px-5 py-2 text-sm font-semibold transition ${view === "new" ? "text-white" : "text-slate-400"
                                }`}
                        >
                            Nueva solicitud
                        </button>

                        <button
                            type="button"
                            onClick={() => setView("list")}
                            className={`relative z-10 px-5 py-2 text-sm font-semibold transition ${view === "list" ? "text-white" : "text-slate-400"
                                }`}
                        >
                            Mis solicitudes
                        </button>

                    </div>
                </div>

                {/* Formulario principal de carga — mismo ancho y altura mínima que "Mis solicitudes" */}
                {view === "new" && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="mx-auto mt-5 w-full max-w-6xl px-4 sm:px-6"
                    >
                        <div className="relative min-h-[min(72vh,48rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                                        Nivel / Tipo
                                    </label>

                                    <Select
                                        className="h-12 border-slate-200 bg-slate-50 text-slate-700 shadow-none transition-colors focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                        {...register("level")}
                                    >
                                        <option value="">Seleccione...</option>
                                        {academicLevels.map((level) => (
                                            <option key={level} value={level}>
                                                {labelForContentType(level)}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Semestre
                                    </label>

                                    <select
                                        value={semester}
                                        onChange={(event) => setSemester(event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                        required
                                    >
                                        <option value="">Selecciona un semestre</option>
                                        {semesters.map((item) => (
                                            <option key={item.code} value={item.code}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Campo para seleccionar programa */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Programa
                                    </label>

                                    <select
                                        value={program}
                                        onChange={(event) => setProgram(event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                        required
                                    >
                                        <option value="">Selecciona un programa</option>
                                        {programs.map((item) => (
                                            <option key={item.code} value={item.name}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <Field label="URL de Google Drive" className="mt-5">
                                <Input
                                    className="h-12 border-slate-200 bg-slate-50 text-slate-700 shadow-none transition-colors focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                    placeholder="Enlace de la carpeta..."
                                    {...register("driveFolderUrl")}
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
                                className="flex justify-center py-10"
                            >
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 px-10 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(37,99,235,0.45)]"
                                >
                                    <span className="relative z-10">{isLoading ? "Enviando..." : "Enviar solicitud"}</span>

                                    <Send className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />

                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                                </Button>
                            </RevealOnScroll>
                        </div>
                    </form>

                )}
                {view === "list" && (
                    <div className="mx-auto mt-5 w-full max-w-6xl px-4 sm:px-6">
                        <div className="relative min-h-[min(72vh,48rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                                                onChange={(event) => setStatusFilter(event.target.value as GifStatusFilter)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                                            >
                                                <option value="todas">Todas</option>
                                                <option value="pendiente">Pendiente</option>
                                                <option value="aprobado">Aprobada</option>
                                                <option value="requiere_ajustes">Requiere ajustes</option>
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
                                                {semesterOptions.map((semesterValue) => (
                                                    <option key={semesterValue} value={semesterValue}>
                                                        {semesterValue}
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
                                                {programOptions.map((programValue) => (
                                                    <option key={programValue} value={programValue}>
                                                        {programValue}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
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
                                    <div className="grid gap-4">
                                        {filteredRequests.map((request) => {
                                            const isExpanded = expandedRequestId === request.id;
                                            return (
                                                <article
                                                    key={request.id}
                                                    className={cn(
                                                        "group relative overflow-hidden rounded-3xl border p-6 pl-8 backdrop-blur-[2px] transition-all duration-300 ease-out",
                                                        "hover:-translate-y-1",
                                                        gifCardSurface[request.status],
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "pointer-events-none absolute bottom-0 left-0 top-0 w-1.5 rounded-l-[inherit] sm:w-2",
                                                            gifCardAccentBar[request.status],
                                                        )}
                                                        aria-hidden
                                                    />
                                                    <div
                                                        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-[0.12] blur-3xl sm:h-48 sm:w-48"
                                                        style={{
                                                            background:
                                                                request.status === "pendiente"
                                                                    ? "linear-gradient(135deg, rgb(6,182,212), rgb(14,165,233))"
                                                                    : request.status === "aprobado"
                                                                      ? "linear-gradient(135deg, rgb(20,184,166), rgb(13,148,136))"
                                                                      : "linear-gradient(135deg, rgb(244,63,94), rgb(225,29,72))",
                                                        }}
                                                        aria-hidden
                                                    />

                                                    <div className="relative">
                                                        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                                    Solicitud LMS
                                                                </p>
                                                                <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-slate-800 sm:text-xl">
                                                                    {request.subject}
                                                                </h3>
                                                            </div>

                                                            <span
                                                                className={cn(
                                                                    "shrink-0 inline-flex origin-center items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide",
                                                                    "shadow-sm ring-1 ring-white/60",
                                                                    statusStyles[request.status],
                                                                    request.status === "requiere_ajustes" &&
                                                                        "motion-safe:animate-status-badge-attention",
                                                                )}
                                                            >
                                                                <span className="h-2 w-2 shrink-0 rounded-full bg-current shadow-sm" />
                                                                {statusLabel[request.status]}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                                                                <span className="rounded-full border border-slate-200/90 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
                                                                    {request.level}
                                                                </span>
                                                                <span className="text-slate-300" aria-hidden>
                                                                    •
                                                                </span>
                                                                <span className="font-medium text-slate-600">{request.program}</span>
                                                                <span className="text-slate-300" aria-hidden>
                                                                    •
                                                                </span>
                                                                <span className="font-semibold text-slate-500">{request.semester}</span>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setExpandedRequestId((currentId) =>
                                                                        currentId === request.id ? null : request.id,
                                                                    )
                                                                }
                                                                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] sm:self-auto"
                                                            >
                                                                <span>{isExpanded ? "Ocultar detalles" : "Ver detalles"}</span>
                                                                <svg
                                                                    className={cn(
                                                                        "h-4 w-4 transition-transform duration-200",
                                                                        isExpanded ? "rotate-180" : "rotate-0",
                                                                    )}
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
                                                            className={cn(
                                                                "overflow-hidden transition-all duration-300 ease-out",
                                                                isExpanded ? "mt-5 max-h-[1400px] opacity-100" : "max-h-0 opacity-0",
                                                            )}
                                                        >
                                                            <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-b from-slate-50/95 to-white/90 p-5 shadow-inner backdrop-blur-sm">
                                                            <div className="grid gap-3 md:grid-cols-2">
                                                                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/90">
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

                                                                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/90">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                                        Creación
                                                                    </p>
                                                                    <p className="mt-2 text-sm font-medium text-slate-700">
                                                                        {request.createdAt}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        {request.createdByName ?? "Fabrica"} · {request.createdByRole}
                                                                    </p>
                                                                </div>

                                                                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/90 md:col-span-2">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                                        Descripción
                                                                    </p>
                                                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                                        {request.summary}
                                                                    </p>
                                                                </div>

                                                                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/90 md:col-span-2">
                                                                    <ContentTypePills items={request.contentTypes} />
                                                                </div>
                                                            </div>

                                                            {request.status === "requiere_ajustes" && (
                                                                <div className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4">
                                                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
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
                                                                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                                                                    >
                                                                        Notificar correcciones
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {request.status === "aprobado" && request.approvalLink && (
                                                                <div className="mt-4 rounded-2xl border border-teal-200/80 bg-teal-50/70 p-4">
                                                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
                                                                        Link de aprobación
                                                                    </p>
                                                                    <a
                                                                        href={request.approvalLink}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-200"
                                                                    >
                                                                        Abrir link aprobado
                                                                        <span aria-hidden="true">↗</span>
                                                                    </a>
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
                        )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
