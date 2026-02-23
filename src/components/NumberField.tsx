import type { ChangeEvent } from "react";

type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  suffix?: string;
  helper?: string;
};

export function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  suffix,
  helper,
}: NumberFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    onChange(Number.isFinite(nextValue) ? nextValue : 0);
  };

  return (
    <label htmlFor={id} className="space-y-1 text-xs">
      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
        {label}
      </span>
      <div className="relative">
        <input
          id={id}
          className="w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          placeholder={placeholder}
          onChange={handleChange}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--retro-text-muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
      {helper ? <p className="text-[10px] text-[color:var(--retro-text-muted)]">{helper}</p> : null}
    </label>
  );
}
