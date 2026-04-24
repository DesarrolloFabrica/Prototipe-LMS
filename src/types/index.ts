export type Status = "Submitted" | "In Review" | "Requires Finalization" | "Completed";

export interface ProcessItem {
  id: string;
  subject: string;
  code: string;
  owner: string;
  status: Status;
  priority: "Low" | "Medium" | "High";
  updatedAt: string;
  /** Imagen de cabecera para tarjetas tipo showcase (URL absoluta o bajo /public). */
  coverImage?: string;
  /** Etiqueta corta tipo "hace 2 h" para tableros */
  timeLabel?: string;
  /** Solo procesos cerrados (historial) */
  closedAt?: string;
  archiveUrl?: string;
}

export interface ActivityEntry {
  id: string;
  type: string;
  text: string;
  at: string;
  time: string;
  actor: string;
  linkedStatus?: string;
}

/** Tarjeta del panel «Procesos activos»: cola editorial o atajo a una vista con ruta real. */
export interface DashboardActiveCard {
  id: string;
  subject: string;
  code: string;
  owner: string;
  status: Status;
  priority: "Low" | "Medium" | "High";
  updatedAt: string;
  timeLabel?: string;
  coverImage?: string;
  href: string;
}

export type UserRole = "gif" | "coordinador";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
