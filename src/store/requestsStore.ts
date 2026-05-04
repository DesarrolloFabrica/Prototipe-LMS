import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LmsRequest } from "@/types";

interface CreateRequestInput {
  subject: string;
  level: string;
  source: string;
  summary: string;
  semester: string;
  program: string;
  createdByName?: string;
}

interface RequestsState {
  /** Estado compartido entre GIF y Coordinador. */
  requests: LmsRequest[];
  /** Crea una nueva solicitud con estado inicial "pendiente". */
  createRequest: (input: CreateRequestInput) => void;
  /** Marca una solicitud como "aprobada" y guarda el link de aprobación. */
  approveRequest: (id: string, approvalLink: string) => void;
  /** Marca una solicitud como "rechazada" (requiere ajustes) y guarda las observaciones del coordinador. */
  rejectRequest: (id: string, adjustmentNotes: string) => void;
  /**
   * Acción del GIF: notifica que corrigió la solicitud rechazada.
   * Vuelve la solicitud a "pendiente" para que el coordinador la revise de nuevo.
   */
  notifyCorrectionsReady: (id: string) => void;
}

const createRequestId = () => `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const useRequestsStore = create<RequestsState>()(
  persist(
    (set) => ({
      requests: [],
      createRequest: (input) =>
        set((state) => ({
          requests: [
            {
              id: createRequestId(),
              subject: input.subject,
              level: input.level,
              source: input.source,
              summary: input.summary,
              semester: input.semester,
              program: input.program,
              status: "pendiente",
              createdAt: new Date().toISOString(),
              createdByRole: "gif",
              createdByName: input.createdByName,
            },
            ...state.requests,
          ],
        })),
      approveRequest: (id, approvalLink) =>
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id ? { ...request, status: "aprobada", approvalLink } : request,
          ),
        })),
      // Guarda las observaciones junto al estado para que el GIF pueda ver qué debe corregir.
      rejectRequest: (id, adjustmentNotes) =>
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id
              ? { ...request, status: "rechazada", adjustmentNotes }
              : request,
          ),
        })),
      // El GIF notifica que hizo correcciones → la solicitud vuelve a "pendiente"
      // para que el coordinador la encuentre de nuevo en su bandeja.
      notifyCorrectionsReady: (id) =>
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id ? { ...request, status: "pendiente" } : request,
          ),
        })),
    }),
    {
      name: "carga-lms-requests",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ requests: state.requests }),
      // Forzamos una limpieza única de datos persistidos para iniciar pruebas desde cero.
      // La funcionalidad de guardado se mantiene: después de esta migración, se persisten
      // nuevamente solo las solicitudes creadas durante las pruebas actuales.
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== "object") {
          return { requests: [] };
        }
        if (version < 2) {
          return { requests: [] };
        }
        return persistedState as { requests: LmsRequest[] };
      },
      // Migración automática: normaliza datos persistidos en localStorage.
      // Si existen solicitudes con el estado antiguo "en_revision", se convierten
      // a "pendiente" para mantener consistencia con el sistema de estados actual.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const hasLegacyStatus = state.requests.some(
          (r) => (r.status as string) === "en_revision",
        );
        if (hasLegacyStatus) {
          state.requests = state.requests.map((r) =>
            (r.status as string) === "en_revision"
              ? { ...r, status: "pendiente" }
              : r,
          );
        }
      },
    },
  ),
);
