import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type FilterComboboxOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type FilterComboboxProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: FilterComboboxOption<TValue>[];
  onChange: (value: TValue) => void;
};

export function FilterCombobox<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: FilterComboboxProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-semibold shadow-sm outline-none transition ${
          isOpen
            ? "border-blue-300 ring-4 ring-blue-100"
            : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/40"
        }`}
      >
        <span className="min-w-0 truncate text-slate-700">{selected?.label ?? "Selecciona"}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-blue-600" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/12 ring-1 ring-black/5">
          <div className="max-h-64 overflow-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
