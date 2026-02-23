import { useEffect, useMemo, useRef, useState } from "react";

type SelectFieldOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const found = options.find((opt) => opt.value === value);
    return found?.label ?? "";
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="space-y-1 text-xs">
      {label ? (
        <label
          htmlFor={id}
          className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <button
          id={id}
          type="button"
          className="flex w-full items-center justify-between rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-left text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
          onClick={() => setOpen((prev) => !prev)}
          disabled={disabled}
        >
          <span className={selectedLabel ? "" : "text-[color:var(--retro-text-muted)]"}>
            {selectedLabel || placeholder || "선택"}
          </span>
          <span className="text-[10px] text-[color:var(--retro-text-muted)]">▾</span>
        </button>

        {open ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-bg)] shadow-[0_8px_16px_rgba(15,23,42,0.08)]">
            <ul role="listbox" className="max-h-52 overflow-auto py-1 text-xs">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-2 text-left ${
                        active
                          ? "bg-[var(--retro-cell-strong)] text-[color:var(--retro-text)]"
                          : "text-[color:var(--retro-text)] hover:bg-[var(--retro-cell)]"
                      }`}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span>{option.label}</span>
                      {active ? (
                        <span className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-1.5 py-0.5 text-[9px] text-[color:var(--retro-text-muted)]">
                          선택됨
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
