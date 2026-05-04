import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    Send,
} from "lucide-react";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useRequestsStore } from "@/store/requestsStore";

/**
 * Esquema de validación del formulario.
 * Aquí se definen los campos obligatorios antes de enviar la carga.
 */
const schema = z.object({
    subject: z.string().min(1, "La materia es obligatoria"),
    level: z.string().min(1, "El nivel o tipo es obligatorio"),
    summary: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    source: z.string().url("Debe ser una URL válida (ej: https://drive.google.com/...)"),
});

type SubmissionForm = z.infer<typeof schema>;

export function DriveSubmissionSection() {
    type GifStatusFilter = "todas" | "pendiente" | "aprobada" | "rechazada";
    const [view, setView] = useState<"new" | "list">("new");
    const createRequest = useRequestsStore((state) => state.createRequest);
    const requests = useRequestsStore((state) => state.requests);
    // Acción para que el GIF notifique que corrigió una solicitud rechazada.
    const notifyCorrectionsReady = useRequestsStore((state) => state.notifyCorrectionsReady);
    const { register, handleSubmit, reset } = useForm<SubmissionForm>({
        resolver: zodResolver(schema),
    });
    const [semester, setSemester] = useState("");
    const [program, setProgram] = useState("");
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<GifStatusFilter>("todas");
    const [semesterFilter, setSemesterFilter] = useState("todos");
    const [programFilter, setProgramFilter] = useState("todos");

    // Estilos visuales por estado (misma paleta que el panel de coordinador).
    // "rechazada" usa naranja porque representa ajustes pendientes, no un rechazo definitivo.
    const statusStyles: Record<string, string> = {
        pendiente: "border border-cyan-200/80 bg-cyan-50/70 text-cyan-800",
        aprobada: "border border-teal-200/80 bg-teal-50/70 text-teal-800",
        rechazada: "border border-rose-200/80 bg-rose-50/70 text-rose-800",
    };

    // Etiquetas legibles para el GIF.
    // "rechazada" se muestra como "Requiere ajustes" para que el GIF entienda que debe corregir.
    const statusLabel: Record<string, string> = {
        pendiente: "Pendiente",
        aprobada: "Aprobada",
        rechazada: "Requiere ajustes",
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

    const onSubmit = (data: SubmissionForm) => {
        /**
         * Persistimos en Zustand para compartir la data con la vista de Coordinador
         * y también reutilizarla en "Mis solicitudes".
         */
        createRequest({
            subject: data.subject,
            level: data.level,
            source: data.source,
            summary: data.summary,
            semester: semester,
            program: program,
        });
        toast.success("Solicitud enviada");
        reset();
        setView("list");
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#FAFAFA]">
            {/* Fondo decorativo interno del bloque del formulario */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-[10%] -top-[10%] h-[40rem] w-[40rem] animate-[spin_40s_linear_infinite] rounded-full bg-blue-300/20 blur-[120px]" />
                <div className="absolute -right-[5%] top-[20%] h-[35rem] w-[35rem] animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-indigo-300/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[20%] h-[30rem] w-[30rem] animate-[spin_50s_linear_infinite_reverse] rounded-full bg-cyan-300/20 blur-[120px]" />

                {/* Patrón sutil de cuadrícula para dar textura tecnológica */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[min(1280px,calc(100%-2rem))] flex-col px-4 pb-12 pt-36 sm:px-6 sm:pb-16 sm:pt-50">

                <div className="mb-6 flex items-center justify-center gap-2">
                    {/* Nueva solicitud */}
                    <div className="inline-flex rounded-2xl bg-white/5 p-1 backdrop-blur-md border border-white/10 shadow-inner">

                        <button
                            type="button"
                            onClick={() => setView("new")}
                            className={`relative px-5 py-2 text-sm font-semibold rounded-xl transition-all ${view === "new"
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-700"
                                }`}
                        >
                            Nueva solicitud
                        </button>

                        <button
                            type="button"
                            onClick={() => setView("list")}
                            className={`relative px-5 py-2 text-sm font-semibold rounded-xl transition-all ${view === "list"
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-700"
                                }`}
                        >
                            Mis solicitudes
                        </button>

                    </div>
                </div>

                {/* Formulario principal de carga */}
                {view === "new" && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="mx-auto mt-10 w-full max-w-4xl px-4"
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                                        <option value="pregrado">Pregrado</option>
                                        <option value="posgrado">Posgrado</option>
                                        <option value="diplomado">Diplomado</option>
                                        <option value="curso-corto">Curso corto</option>
                                        <option value="otro">Otro</option>
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
                                        <option value="2024-1">2024-1</option>
                                        <option value="2024-2">2024-2</option>
                                        <option value="2025-1">2025-1</option>
                                        <option value="2025-2">2025-2</option>
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

                            {/* Campo del enlace de Google Drive */}
                            <div className="mt-5">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                                    URL de Google Drive
                                </label>

                                <Input
                                    className="h-12 border-slate-200 bg-slate-50 text-slate-700 shadow-none transition-colors focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                    placeholder="Enlace de la carpeta..."
                                    {...register("source")}
                                />
                            </div>

                            {/* Campo de descripción del material */}
                            <div className="mt-5">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                                    Descripción
                                </label>

                                <Textarea
                                    className="resize-none border-slate-200 bg-slate-50 text-slate-700 shadow-none transition-colors focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                    rows={4}
                                    placeholder="Breve detalle del material..."
                                    {...register("summary")}
                                />
                            </div>

                            {/* Bloque de envío */}
                            <RevealOnScroll
                                as="section"
                                viewportAmount={0.18}
                                className="flex justify-center py-5"
                            >
                                <Button
                                    type="submit"
                                    className="group relative flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 px-10 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(37,99,235,0.45)]"
                                >
                                    <span className="relative z-10">Enviar solicitud</span>

                                    <Send className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />

                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                                </Button>
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
                                                    onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
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
                                                    <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-500 ${request.status === "pendiente" ? "bg-cyan-400" :
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
                                                            <span className={`h-2 w-2 rounded-full animate-pulse ${request.status === "pendiente" ? "bg-cyan-500" :
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
                                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/50 px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 hover:shadow-md active:scale-95"
                                                        >
                                                            <span>{isExpanded ? "Ocultar detalles" : "Ver detalles"}</span>
                                                            <svg
                                                                className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2.5"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
                                                                                    {request.createdByName ?? "GIF"} · {request.createdByRole}
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
                                                                </div>

                                                                {request.status === "rechazada" && (
                                                                    <div className="mt-6 rounded-[1.5rem] border border-rose-200/50 bg-rose-50/50 p-6 ring-1 ring-rose-500/10">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-700">
                                                                                Observaciones del coordinador
                                                                            </p>
                                                                        </div>
                                                                        {request.adjustmentNotes ? (
                                                                            <p className="text-sm leading-relaxed text-rose-900/80 font-medium">
                                                                                {request.adjustmentNotes}
                                                                            </p>
                                                                        ) : (
                                                                            <p className="text-sm italic text-slate-400">
                                                                                El coordinador no dejó observaciones adicionales.
                                                                            </p>
                                                                        )}

                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                notifyCorrectionsReady(request.id);
                                                                            }}
                                                                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-700 active:scale-95"
                                                                        >
                                                                            Notificar correcciones listas
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {request.status === "aprobada" && request.approvalLink && (
                                                                    <div className="mt-6 rounded-[1.5rem] border border-teal-200/50 bg-teal-50/50 p-6 ring-1 ring-teal-500/10">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                                                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">
                                                                                Material Virtualizado
                                                                            </p>
                                                                        </div>
                                                                        <a
                                                                            href={request.approvalLink}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-bold text-teal-700 shadow-sm ring-1 ring-teal-200/50 transition-all hover:bg-white active:scale-95"
                                                                        >
                                                                            Abrir plataforma LMS
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
                )}

            </div>
        </div>
    );
}