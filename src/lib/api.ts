import { useAuthStore } from "@/store/authStore";
import { isSessionIdleExpired } from "@/lib/session";
import type {
  ApiContentType,
  ApiProgram,
  ApiSemester,
  ApiActivityEntry,
  ApiSubject,
  ApiSubjectMetrics,
  ApiUser,
  AuthSession,
  CreateSubjectPayload,
  UpdateSubjectStatusPayload,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { clearSession, lastActivityAt, touchSession, user } = useAuthStore.getState();
  const headers = new Headers(options.headers);
  const skipsIdleCheck = path === "/auth/google" || path === "/auth/logout";

  if (user && !skipsIdleCheck && isSessionIdleExpired(lastActivityAt)) {
    clearSession();
    throw new ApiError("La sesión expiró por inactividad.", 401, null);
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }
    throw new ApiError(readApiMessage(payload), response.status, payload);
  }

  if (user && !skipsIdleCheck) {
    touchSession();
  }

  return payload as T;
}

function readApiMessage(payload: unknown) {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message: unknown }).message;
    return Array.isArray(message) ? message.join(", ") : String(message);
  }
  return "No fue posible completar la solicitud.";
}

export const authApi = {
  loginWithGoogle: (credential: string) =>
    apiRequest<AuthSession>("/auth/google", {
      method: "POST",
      body: { credential },
    }),
  logout: () =>
    apiRequest<{ ok: true }>("/auth/logout", {
      method: "POST",
    }),
  refresh: () =>
    apiRequest<AuthSession>("/auth/refresh", {
      method: "POST",
    }),
  me: () => apiRequest<ApiUser>("/auth/me"),
};

export const catalogsApi = {
  contentTypes: () => apiRequest<ApiContentType[]>("/catalogs/content-types"),
  programs: () => apiRequest<ApiProgram[]>("/catalogs/programs"),
  semesters: () => apiRequest<ApiSemester[]>("/catalogs/semesters"),
};

export const materiasApi = {
  list: () => apiRequest<ApiSubject[]>("/materias"),
  metrics: () => apiRequest<ApiSubjectMetrics>("/materias/metrics"),
  activity: () => apiRequest<ApiActivityEntry[]>("/materias/activity"),
  get: (id: number) => apiRequest<ApiSubject>(`/materias/${id}`),
  create: (payload: CreateSubjectPayload) =>
    apiRequest<ApiSubject>("/materias", {
      method: "POST",
      body: payload,
    }),
  mine: () => apiRequest<ApiSubject[]>("/materias/fabrica/mine"),
  updateStatus: (id: number, payload: UpdateSubjectStatusPayload) =>
    apiRequest<ApiSubject>(`/materias/${id}/status`, {
      method: "PATCH",
      body: payload,
    }),
};

