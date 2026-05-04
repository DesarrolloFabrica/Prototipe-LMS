import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { materiasApi } from "@/lib/api";
import { subjectToRequest } from "@/lib/requestDerived";
import type { AcademicLevel, ApiSubject, ContentTypeCode, LmsRequest } from "@/types";

interface CreateRequestInput {
  subject: string;
  level: AcademicLevel;
  source: string;
  summary: string;
  semester: string;
  program: string;
  contentTypeCodes: ContentTypeCode[];
  createdByName?: string;
}

interface RequestsState {
  requests: LmsRequest[];
  isLoading: boolean;
  error: string | null;
  loadRequests: () => Promise<void>;
  loadMyRequests: () => Promise<void>;
  loadCoordinatorRequests: () => Promise<void>;
  createRequest: (input: CreateRequestInput) => Promise<void>;
  approveRequest: (id: string, cdigitalUrl?: string) => Promise<void>;
  rejectRequest: (id: string, adjustmentNotes: string) => Promise<void>;
  notifyCorrectionsReady: (id: string) => Promise<void>;
  clearRequests: () => void;
}

const toRequest = (subject: ApiSubject): LmsRequest => subjectToRequest(subject);

const sortNewestFirst = (requests: LmsRequest[]) =>
  [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const replaceRequest = (requests: LmsRequest[], next: LmsRequest) => {
  const exists = requests.some((request) => request.id === next.id);
  return sortNewestFirst(exists ? requests.map((request) => (request.id === next.id ? next : request)) : [next, ...requests]);
};

const backendId = (id: string) => {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
};

const readError = (error: unknown) => (error instanceof Error ? error.message : "No fue posible conectar con el backend.");

export const useRequestsStore = create<RequestsState>()(
  persist(
    (set) => ({
      requests: [],
      isLoading: false,
      error: null,
      loadRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const subjects = await materiasApi.list();
          set({ requests: sortNewestFirst(subjects.map(toRequest)), isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: readError(error) });
          throw error;
        }
      },
      loadMyRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const subjects = await materiasApi.mine();
          set({ requests: sortNewestFirst(subjects.map(toRequest)), isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: readError(error) });
          throw error;
        }
      },
      loadCoordinatorRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const subjects = await materiasApi.list();
          set({ requests: sortNewestFirst(subjects.map(toRequest)), isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: readError(error) });
          throw error;
        }
      },
      createRequest: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const subject = await materiasApi.create({
            name: input.subject,
            semester: input.semester,
            academicLevel: input.level,
            programName: input.program,
            contentDescription: input.summary,
            driveFolderUrl: input.source,
            contentTypeCodes: input.contentTypeCodes,
          });
          set((state) => ({
            requests: replaceRequest(state.requests, toRequest(subject)),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false, error: readError(error) });
          throw error;
        }
      },
      approveRequest: async (id, cdigitalUrl) => {
        const numericId = backendId(id);
        if (!numericId) {
          set((state) => ({
            requests: state.requests.map((request) =>
              request.id === id ? { ...request, status: "aprobado" } : request,
            ),
          }));
          return;
        }

        const subject = await materiasApi.updateStatus(numericId, { newStatus: "aprobado", cdigitalUrl });
        set((state) => ({ requests: replaceRequest(state.requests, toRequest(subject)) }));
      },
      rejectRequest: async (id, adjustmentNotes) => {
        const numericId = backendId(id);
        if (!numericId) {
          set((state) => ({
            requests: state.requests.map((request) =>
              request.id === id ? { ...request, status: "requiere_ajustes", adjustmentNotes } : request,
            ),
          }));
          return;
        }

        const subject = await materiasApi.updateStatus(numericId, {
          newStatus: "requiere_ajustes",
          observation: adjustmentNotes,
        });
        set((state) => ({ requests: replaceRequest(state.requests, toRequest(subject)) }));
      },
      notifyCorrectionsReady: async (id) => {
        const numericId = backendId(id);
        if (!numericId) {
          set((state) => ({
            requests: state.requests.map((request) =>
              request.id === id ? { ...request, status: "pendiente" } : request,
            ),
          }));
          return;
        }

        const subject = await materiasApi.updateStatus(numericId, { newStatus: "pendiente" });
        set((state) => ({ requests: replaceRequest(state.requests, toRequest(subject)) }));
      },
      clearRequests: () => set({ requests: [], error: null, isLoading: false }),
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
