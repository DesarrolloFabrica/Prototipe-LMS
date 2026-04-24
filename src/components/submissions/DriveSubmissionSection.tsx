import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
    CheckCircle2,
    Sparkles,
    Send,
    Box,
    FileText,
    Link as LinkIcon,
    Activity,
} from "lucide-react";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

/**
 * Esquema de validación del formulario.
 * Aquí se definen los campos obligatorios antes de enviar la carga.
 */
const schema = z.object({
    subject: z.string().min(1, "La materia es obligatoria"),
    level: z.string().min(1, "El nivel o tipo es obligatorio"),
    summary: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    source: z.url("Debe ser una URL válida"),
});

type SubmissionForm = z.infer<typeof schema>;

/**
 * Lista visual que se marca según el avance del formulario.
 */
const checklist = [
    "Objetivo instruccional definido",
    "Unidades y alcance acordados",
    "Material fuente verificable",
];

const HERO_LOTTIE_SRC = "/videos/Processing.lottie";

export function DriveSubmissionSection() {
    const [view, setView] = useState<"new" | "list">("new");
    const { register, handleSubmit, watch } = useForm<SubmissionForm>({
        resolver: zodResolver(schema),
    });

    const formValues = watch();

    /**
     * Calcula cuántos campos ya cumplen las condiciones mínimas.
     * Esto alimenta la barra de progreso lateral.
     */
    let completedCount = 0;

    if (formValues.subject) completedCount++;
    if (formValues.summary && formValues.summary.length >= 20) completedCount++;
    if (formValues.source && formValues.source.includes("http")) completedCount++;

    const progressPercent = Math.round((completedCount / 3) * 100);

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
                    <button
                        type="button"
                        onClick={() => setView("new")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === "new"
                            ? "bg-teal-600 text-white shadow"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        Nueva solicitud
                    </button>

                    {/* Mis solicitudes */}
                    <button
                        type="button"
                        onClick={() => setView("list")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === "list"
                            ? "bg-teal-600 text-white shadow"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        Mis solicitudes
                    </button>
                </div>

                {/* Formulario principal de carga */}
                {view === "new" && (
                    <form
                        onSubmit={handleSubmit(() => toast.success("Solicitud enviada"))}
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
                                className="relative overflow-hidden rounded-[2rem] border border-blue-200/50 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 p-6 shadow-inner sm:p-8"
                            >
                                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />

                                <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                                    <div>
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-900">
                                            Revisión previa al envío
                                        </h2>

                                        <p className="mt-2 max-w-md text-sm text-blue-800/70">
                                            Confirma que el resumen y el enlace son correctos. Tras enviar, el proceso entra en pipeline automatizado como{" "}
                                            <span className="font-semibold text-blue-900">Submitted</span>.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="group relative overflow-hidden rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-[0_0_20px_rgb(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgb(37,99,235,0.5)]"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            Enviar submission
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

                        <p className="text-sm text-slate-500">
                            Aquí se mostrará la tabla de solicitudes del usuario.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}