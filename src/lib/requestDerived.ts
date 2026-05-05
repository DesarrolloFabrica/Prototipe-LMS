import type { ActivityEntry, ApiActivityEntry, ApiSubject, DashboardActiveCard, LmsRequest } from "@/types";

export function requestCode(request: Pick<LmsRequest, "id" | "semester">) {
  return `MAT-${request.semester.replace(/\W+/g, "")}-${request.id.padStart(3, "0")}`;
}

export function requestOwner(request: Pick<LmsRequest, "createdByName">) {
  return request.createdByName ?? "Fabrica de Contenido";
}

export function requestPriority(request: Pick<LmsRequest, "status">): "Low" | "Medium" | "High" {
  if (request.status === "requiere_ajustes") return "High";
  if (request.status === "pendiente") return "Medium";
  return "Low";
}

export function formatRequestDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function toDashboardActiveCard(request: LmsRequest): DashboardActiveCard {
  return {
    id: request.id,
    subject: request.subject,
    code: requestCode(request),
    owner: requestOwner(request),
    status: request.status,
    priority: requestPriority(request),
    updatedAt: request.createdAt,
    timeLabel: formatRequestDateLabel(request.createdAt),
    href: `/review/${request.id}`,
  };
}

export function buildActivityEntries(requests: LmsRequest[]): ActivityEntry[] {
  return requests
    .flatMap((request): ActivityEntry[] => {
      const created = new Date(request.createdAt);
      const base = {
        at: formatRequestDateLabel(request.createdAt),
        time: Number.isNaN(created.getTime())
          ? "--:--"
          : new Intl.DateTimeFormat("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(created),
        actor: requestOwner(request),
        linkedStatus: request.status,
      };

      const entries: ActivityEntry[] = [
        {
          ...base,
          id: `created-${request.id}`,
          type: "Solicitud",
          text: `${request.subject} fue registrada para revision LMS`,
        },
      ];

      if (request.status === "requiere_ajustes") {
        entries.unshift({
          ...base,
          id: `returned-${request.id}`,
          type: "Ajustes",
          text: `${request.subject} requiere ajustes de Fabrica`,
        });
      }

      if (request.status === "aprobado") {
        entries.unshift({
          ...base,
          id: `approved-${request.id}`,
          type: "Cierre",
          text: `${request.subject} fue aprobada y cerrada`,
        });
      }

      return entries;
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}

export function apiActivityToEntry(entry: ApiActivityEntry): ActivityEntry {
  const date = new Date(entry.createdAt);
  return {
    id: entry.id,
    type: entry.type,
    text: entry.text,
    at: formatRequestDateLabel(entry.createdAt),
    time: Number.isNaN(date.getTime())
      ? "--:--"
      : new Intl.DateTimeFormat("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(date),
    actor: entry.actor,
    linkedStatus: entry.linkedStatus,
  };
}

export function subjectToRequest(subject: ApiSubject): LmsRequest {
  const adjustmentNotes = subject.comments
    ?.filter((comment) => comment.commentType === "DEVOLUCION")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .at(-1)?.content;

  return {
    id: String(subject.id),
    subject: subject.name,
    level: subject.academicLevel,
    source: subject.driveFolderUrl,
    megaFolderId: subject.megaFolderId?.trim() || undefined,
    megaFolderLink: subject.megaFolderLink?.trim() || undefined,
    megaPath: subject.megaPath?.trim() || undefined,
    megaStatus: subject.megaStatus?.trim() || undefined,
    summary: subject.contentDescription,
    status: subject.currentStatus,
    createdAt: subject.createdAt,
    createdByRole: subject.createdBy?.role === "FABRICA" ? "gif" : "coordinador",
    createdByName: subject.createdBy?.fullName,
    semester: subject.semester,
    program: subject.programName ?? "",
    contentTypes:
      subject.contentTypes?.map((contentType) => ({
        code: contentType.code,
        name: contentType.name,
      })) ?? [],
    adjustmentNotes,
    approvalLink: subject.cdigitalUrl ?? undefined,
  };
}
