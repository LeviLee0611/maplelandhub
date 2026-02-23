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
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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

  const toggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          const threshold = 260;
          setOpenUp(spaceBelow < threshold && spaceAbove > spaceBelow);
        }
      }
      return next;
    });
  };

  return (
    <div ref={rootRef} className="space-y-1 text-xs">
      {label ? (
        <label
          htmlFor={id}
          className="retro-chip"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <button
          id={id}
          type="button"
          ref={buttonRef}
          className={`flex w-full items-center justify-between rounded-[6px] border px-2 py-1.5 text-left text-xs transition duration-150 focus:outline-none ${
            open
              ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-50 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]"
              : "border-[var(--retro-border)] bg-[var(--retro-cell)] text-[color:var(--retro-text)] hover:border-[var(--retro-border-strong)]"
          }`}
          onClick={toggleOpen}
          disabled={disabled}
        >
          <span className={selectedLabel ? "" : "text-[color:var(--retro-text-muted)]"}>
            {selectedLabel || placeholder || "선택"}
          </span>
          <span
            className={`text-[10px] transition duration-150 ${
              open ? "rotate-180 text-cyan-100" : "text-[color:var(--retro-text-muted)]"
            }`}
          >
            ▾
          </span>
        </button>

        {open ? (
          <div
            className={`select-dropdown absolute z-20 w-full max-h-[60vh] overflow-y-auto overscroll-contain rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] shadow-[0_12px_22px_rgba(2,6,23,0.45)] ${
              openUp ? "bottom-full mb-2" : "top-full mt-2"
            }`}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <ul role="listbox" className="select-options py-1 text-xs">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-2 text-left ${
                        active
                          ? "bg-cyan-400/20 text-cyan-50"
                          : "text-[color:var(--retro-text)] hover:bg-white/5"
                      }`}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span>{option.label}</span>
                      {active ? (
                        <span className="rounded-[4px] border border-cyan-300/40 bg-cyan-300/15 px-1.5 py-0.5 text-[9px] text-cyan-100">
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
