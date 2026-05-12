import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RevealOnScroll } from "@/components/common/RevealOnScroll";
import { MainContentContainer } from "@/components/layout/MainContentContainer";
import { StatusPill } from "@/components/shared/StatusPill";
import { TimelineItem } from "@/components/shared/TimelineItem";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { materiasApi } from "@/lib/api";
import { motionDuration, motionEase, scaleTap } from "@/lib/animations";
import { formatRequestDateLabel, requestCode, requestOwner, subjectToRequest } from "@/lib/requestDerived";
import type { LmsRequest } from "@/types";

export function ReviewDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<LmsRequest | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setHasLoaded(true);
      return;
    }

    void materiasApi
      .get(numericId)
      .then((subject) => setItem(subjectToRequest(subject)))
      .catch((error) => toast.error(readError(error)))
      .finally(() => setHasLoaded(true));
  }, [id]);

  function approveCurrentRequest() {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return;

    setIsApproving(true);
    void materiasApi
      .updateStatus(numericId, { newStatus: "aprobado" })
      .then((subject) => {
        setItem(subjectToRequest(subject));
        toast.success("Solicitud aprobada");
      })
      .catch((error) => toast.error(readError(error)))
      .finally(() => setIsApproving(false));
  }

  if (hasLoaded && !item) {
    return (
      <MainContentContainer>
        <Card className="rounded-2xl border-slate-200/70 p-6">
          <h1 className="text-xl font-semibold text-slate-900">Solicitud no encontrada</h1>
          <p className="mt-2 text-sm text-slate-600">No hay una solicitud real asociada a este identificador.</p>
        </Card>
      </MainContentContainer>
    );
  }

  if (!item) {
    return (
      <MainContentContainer>
        <Card className="rounded-2xl border-slate-200/70 p-6">
          <p className="text-sm font-semibold text-slate-600">Cargando detalle de la solicitud...</p>
        </Card>
      </MainContentContainer>
    );
  }

  return (
    <MainContentContainer>
      <div className="grid gap-4 lg:grid-cols-3">
        <RevealOnScroll as="section" viewportAmount={0.2} className="space-y-4 lg:col-span-2">
          <Card className="rounded-2xl border-slate-200/70 p-5 sm:p-6" whileHover={{ y: -2 }}>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{item.subject}</h1>
            <div className="mt-3">
              <StatusPill status={item.status} />
            </div>
            <div className="mt-6 space-y-0">
              <TimelineItem title="Solicitud creada" date={formatRequestDateLabel(item.createdAt)} />
              <TimelineItem title={`Estado actual: ${item.status.replace("_", " ")}`} date={formatRequestDateLabel(item.createdAt)} />
              {item.adjustmentNotes ? (
                <TimelineItem title="Observacion de ajustes registrada" date={formatRequestDateLabel(item.createdAt)} />
              ) : null}
            </div>
            <div className="mt-6">
              {item.status === "pendiente" ? (
                <motion.div whileTap={scaleTap}>
                  <Button className="px-6" disabled={isApproving} onClick={approveCurrentRequest}>
                    {isApproving ? "Aprobando..." : "Aprobar solicitud"}
                  </Button>
                </motion.div>
              ) : (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-100">
                  {item.status === "aprobado"
                    ? "Esta solicitud ya fue aprobada."
                    : "Esta solicitud requiere ajustes antes de finalizar."}
                </p>
              )}
            </div>
          </Card>
        </RevealOnScroll>

        <RevealOnScroll
          as="aside"
          viewportAmount={0.18}
          transition={{ delay: 0.05, duration: motionDuration.md, ease: motionEase.out }}
        >
          <Card className="rounded-2xl border-slate-200/70 p-5 sm:p-6">
            <p className="font-semibold text-slate-900">Metadatos</p>
            <p className="mt-3 text-sm text-slate-600">
              <span className="text-slate-500">Responsable:</span> {requestOwner(item)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              <span className="text-slate-500">Codigo:</span>{" "}
              <span className="font-mono text-slate-800">{requestCode(item)}</span>
            </p>
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-100">
              Solicitud disponible dentro de la plataforma.
            </p>
          </Card>
        </RevealOnScroll>
      </div>
    </MainContentContainer>
  );
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar el detalle.";
}
