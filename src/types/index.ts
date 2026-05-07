export type RequestStatus = "pendiente" | "aprobado" | "requiere_ajustes";
export type Status = RequestStatus;

export interface ProcessItem {
  id: string;
  subject: string;
  code: string;
  owner: string;
  status: Status;
  priority: "Low" | "Medium" | "High";
  updatedAt: string;
  coverImage?: string;
  timeLabel?: string;
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

export type BackendUserRole = "FABRICA" | "LMS" | "ADMIN";
export type AcademicLevel = "PREGRADO" | "POSGRADO" | "ESPECIALIZACION" | "DIPLOMADO";
export type ContentTypeCode =
  | "VIDEO"
  | "PDF"
  | "PODCAST"
  | "PRESENTACION"
  | "ACTIVIDAD_INTERACTIVA"
  | "EVALUACION"
  | "SCORM"
  | "OTRO";
export type SubjectStatus = RequestStatus;

export interface ApiUser {
  id: number;
  email: string;
  fullName: string;
  role: BackendUserRole;
  area?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface ApiContentType {
  id: number;
  code: ContentTypeCode;
  name: string;
  isActive: boolean;
}

export interface ApiSemester {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ApiProgram {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ApiComment {
  id: number;
  commentType: "GENERAL" | "DEVOLUCION" | "ERROR" | "CIERRE";
  content: string;
  createdAt: string;
  author?: Pick<ApiUser, "id" | "email" | "fullName" | "role">;
}

export interface ApiSubject {
  id: number;
  name: string;
  semester: string;
  academicLevel: AcademicLevel;
  programName?: string | null;
  contentDescription: string;
  driveFolderUrl: string;
  cdigitalUrl?: string | null;
  currentStatus: SubjectStatus;
  createdByUserId: number;
  assignedLmsUserId?: number | null;
  reviewedAt?: string | null;
  completedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: Pick<ApiUser, "id" | "email" | "fullName" | "role">;
  assignedLmsUser?: Pick<ApiUser, "id" | "email" | "fullName" | "role"> | null;
  contentTypes?: ApiContentType[];
  comments?: ApiComment[];
}

export interface ApiSubjectTransferFile {
  id: number;
  subjectId: number;
  fileName: string;
  filePath: string[];
  megaUrl: string;
  sizeBytes?: number | null;
  mimeType?: string | null;
  createdAt: string;
}

export interface ApiSubjectMetrics {
  total: number;
  active: number;
  pending: number;
  requiresAdjustments: number;
  approved: number;
  today: number;
  byStatus: Record<RequestStatus, number>;
}

export interface ApiActivityEntry {
  id: string;
  type: string;
  subjectId: number;
  subjectName: string;
  text: string;
  actor: string;
  linkedStatus?: RequestStatus;
  createdAt: string;
}

export interface AuthSession {
  tokenType: "Cookie";
  expiresIn: string;
  user: ApiUser;
}

export interface CreateSubjectPayload {
  name: string;
  semester: string;
  academicLevel: AcademicLevel;
  programName: string;
  contentDescription: string;
  driveFolderUrl: string;
  contentTypeCodes: ContentTypeCode[];
  transferId?: string;
}

export interface ApiTransferProgress {
  transferId: string;
  status: "idle" | "listing" | "uploading" | "completed" | "failed";
  totalFiles: number;
  completedFiles: number;
  totalBytes: number;
  transferredBytes: number;
  percent: number;
  currentFile?: string;
  error?: string;
  updatedAt: string;
}

export interface ApiUploadHistoryItem {
  subjectId: number;
  subjectName: string;
  semester: string;
  academicLevel: AcademicLevel;
  programName: string;
  currentStatus: SubjectStatus;
  createdAt: string;
  reviewedAt?: string | null;
  completedAt?: string | null;
  createdBy?: Pick<ApiUser, "id" | "email" | "fullName" | "role"> | null;
  assignedLmsUser?: Pick<ApiUser, "id" | "email" | "fullName" | "role"> | null;
  fileCount: number;
  folderCount: number;
  totalBytes: number;
  firstUploadedAt?: string | null;
  lastUploadedAt?: string | null;
  rootFolders: string[];
  hasFiles: boolean;
}

export interface UpdateSubjectStatusPayload {
  newStatus: SubjectStatus;
  observation?: string;
  cdigitalUrl?: string;
  assignedLmsUserId?: number;
}

export interface LmsRequest {
  id: string;
  subject: string;
  level: AcademicLevel;
  source: string;
  summary: string;
  status: RequestStatus;
  createdAt: string;
  createdByRole: UserRole;
  createdByName?: string;
  semester: string;
  program: string;
  contentTypes?: Pick<ApiContentType, "code" | "name">[];
  adjustmentNotes?: string;
  /** Link final compartido al aprobar la solicitud. Solo presente cuando status === "aprobado". */
  approvalLink?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
