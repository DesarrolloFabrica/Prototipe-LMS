import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Archive, ChevronLeft, Download, ExternalLink, Eye, FileText, Folder, X } from "lucide-react";
import { materiasApi } from "@/lib/api";
import type { ApiSubjectTransferFile } from "@/types";

type MegaFilesPanelProps = {
  subjectId: string;
};

type FolderNode = {
  folders: Map<string, FolderNode>;
  files: ApiSubjectTransferFile[];
};

export function MegaFilesPanel({ subjectId }: MegaFilesPanelProps) {
  const [files, setFiles] = useState<ApiSubjectTransferFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<ApiSubjectTransferFile | null>(null);
  const numericSubjectId = Number(subjectId);
  const root = useMemo(() => buildFolderTree(files), [files]);
  const current = useMemo(() => getFolder(root, path), [root, path]);
  const folders = useMemo(() => Array.from(current.folders.keys()).sort((a, b) => a.localeCompare(b)), [current]);
  const currentFiles = useMemo(
    () => [...current.files].sort((a, b) => a.fileName.localeCompare(b.fileName)),
    [current],
  );

  useEffect(() => {
    if (!previewFile) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewFile]);

  useEffect(() => {
    if (!Number.isInteger(numericSubjectId) || numericSubjectId <= 0) return;

    setIsLoading(true);
    setError(null);
    void materiasApi
      .files(numericSubjectId)
      .then((nextFiles) => {
        setFiles(nextFiles);
        setPath([]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar los archivos."))
      .finally(() => setIsLoading(false));
  }, [numericSubjectId]);

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Archivos MEGA</p>
        <div className="flex flex-wrap items-center gap-2">
          {files.length > 0 && Number.isInteger(numericSubjectId) && numericSubjectId > 0 && (
            <a
              href={materiasApi.zipDownloadUrl(numericSubjectId)}
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-800"
            >
              <Archive className="h-3.5 w-3.5" />
              Descargar todo
            </a>
          )}
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
            {files.length} archivo(s)
          </span>
        </div>
      </div>

      {isLoading && <p className="mt-3 text-sm text-sky-700">Cargando archivos...</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {!isLoading && !error && files.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">Todavia no hay archivos transferidos.</p>
      )}

      {files.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-lg bg-white ring-1 ring-sky-100">
          <div className="flex flex-wrap items-center gap-2 border-b border-sky-100 bg-sky-50/60 px-3 py-2 text-sm">
            {path.length > 0 && (
              <button
                type="button"
                onClick={() => setPath((currentPath) => currentPath.slice(0, -1))}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver
              </button>
            )}

            <button
              type="button"
              onClick={() => setPath([])}
              className="font-semibold text-sky-700 hover:underline"
            >
              Inicio
            </button>
            {path.map((segment, index) => (
              <span key={`${segment}-${index}`} className="inline-flex items-center gap-2 text-slate-500">
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setPath(path.slice(0, index + 1))}
                  className="font-semibold text-slate-700 hover:underline"
                >
                  {segment}
                </button>
              </span>
            ))}
          </div>

          <div className="max-h-80 overflow-auto p-2">
            {folders.map((folderName) => (
              <button
                key={folderName}
                type="button"
                onClick={() => setPath((currentPath) => [...currentPath, folderName])}
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-sky-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Folder className="h-4 w-4 shrink-0 text-sky-600" />
                  <span className="truncate font-semibold text-slate-700">{folderName}</span>
                </span>
                <span className="text-xs font-semibold text-sky-700">Abrir</span>
              </button>
            ))}

            {currentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-sky-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate font-medium text-slate-700">{file.fileName}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <a
                    href={file.megaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir
                  </a>
                  {Number.isInteger(numericSubjectId) && numericSubjectId > 0 && canPreview(file) && (
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-200"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Vista previa
                    </button>
                  )}
                  {Number.isInteger(numericSubjectId) && numericSubjectId > 0 && (
                    <a
                      href={materiasApi.fileDownloadUrl(numericSubjectId, file.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Descargar
                    </a>
                  )}
                </span>
              </div>
            ))}

            {folders.length === 0 && currentFiles.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-500">Esta carpeta no contiene archivos visibles.</p>
            )}
          </div>
        </div>
      )}

      {previewFile && Number.isInteger(numericSubjectId) && numericSubjectId > 0 && createPortal(
        <FilePreviewModal
          file={previewFile}
          previewUrl={materiasApi.filePreviewUrl(numericSubjectId, previewFile.id)}
          downloadUrl={materiasApi.fileDownloadUrl(numericSubjectId, previewFile.id)}
          onClose={() => setPreviewFile(null)}
        />,
        document.body,
      )}
    </div>
  );
}

function buildFolderTree(files: ApiSubjectTransferFile[]) {
  const root: FolderNode = { folders: new Map(), files: [] };

  for (const file of files) {
    let current = root;
    for (const folderName of file.filePath) {
      const existing = current.folders.get(folderName);
      if (existing) {
        current = existing;
        continue;
      }

      const next: FolderNode = { folders: new Map(), files: [] };
      current.folders.set(folderName, next);
      current = next;
    }
    current.files.push(file);
  }

  return root;
}

function getFolder(root: FolderNode, path: string[]) {
  let current = root;
  for (const segment of path) {
    const next = current.folders.get(segment);
    if (!next) return root;
    current = next;
  }
  return current;
}

function FilePreviewModal({
  file,
  previewUrl,
  downloadUrl,
  onClose,
}: {
  file: ApiSubjectTransferFile;
  previewUrl: string;
  downloadUrl: string;
  onClose: () => void;
}) {
  const previewKind = filePreviewKind(file);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        className="flex h-[min(86vh,820px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Vista previa</p>
            <h3 className="truncate text-sm font-extrabold text-slate-900">{file.fileName}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Cerrar vista previa"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100">
          {previewKind === "image" && (
            <div className="flex h-full items-center justify-center p-4">
              <img src={previewUrl} alt={file.fileName} className="max-h-full max-w-full rounded-lg object-contain shadow" />
            </div>
          )}
          {previewKind === "video" && (
            <div className="flex h-full items-center justify-center bg-black">
              <video src={previewUrl} className="max-h-full max-w-full" controls />
            </div>
          )}
          {previewKind === "audio" && (
            <div className="flex h-full items-center justify-center p-8">
              <audio src={previewUrl} className="w-full max-w-2xl" controls />
            </div>
          )}
          {previewKind === "document" && (
            <DocumentPreview title={file.fileName} previewUrl={previewUrl} />
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentPreview({ title, previewUrl }: { title: string; previewUrl: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let nextObjectUrl: string | null = null;

    setObjectUrl(null);
    setError(null);
    void fetch(previewUrl, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message: unknown }).message)
            : "No fue posible generar la vista previa.";
          throw new Error(message);
        }

        const blob = await response.blob();
        nextObjectUrl = URL.createObjectURL(blob);
        if (active) setObjectUrl(nextObjectUrl);
      })
      .catch((previewError) => {
        if (active) {
          setError(previewError instanceof Error ? previewError.message : "No fue posible generar la vista previa.");
        }
      });

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [previewUrl]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
          <p className="text-sm font-bold text-amber-900">Vista previa no disponible</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">{error}</p>
          <p className="mt-3 text-xs text-amber-700">Puedes descargar el archivo original desde el botón superior.</p>
        </div>
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
          Generando vista previa...
        </p>
      </div>
    );
  }

  return <iframe src={objectUrl} title={title} className="h-full w-full border-0" />;
}

function canPreview(file: ApiSubjectTransferFile) {
  return filePreviewKind(file) !== "unsupported";
}

function filePreviewKind(file: ApiSubjectTransferFile) {
  const mimeType = file.mimeType?.toLowerCase() ?? "";
  const name = file.fileName.toLowerCase();

  if (mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return "image";
  if (mimeType.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(name)) return "video";
  if (mimeType.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(name)) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    /\.(pdf|txt|csv|json|md|html|xml|docx?|pptx?|xlsx?)$/i.test(name)
  ) {
    return "document";
  }

  return "unsupported";
}
