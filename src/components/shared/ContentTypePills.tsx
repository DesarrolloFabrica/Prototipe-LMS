import { CheckCircle2 } from "lucide-react";
import type { ApiContentType } from "@/types";

type ContentTypePillsProps = {
  className?: string;
  emptyLabel?: string;
  items?: Pick<ApiContentType, "code" | "name">[];
};

export function ContentTypePills({
  className = "",
  emptyLabel = "Sin tipos registrados",
  items = [],
}: ContentTypePillsProps) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Tipos de contenido
      </p>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.code}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm shadow-blue-950/[0.03]"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              {item.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-slate-400">{emptyLabel}</p>
      )}
    </div>
  );
}
