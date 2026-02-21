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
    <label htmlFor={id} className="space-y-1 text-sm">
      <span className="font-medium text-slate-100">{label}</span>
      <div className="relative">
        <input
          id={id}
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-slate-100 focus:border-sky-300 focus:outline-none"
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          placeholder={placeholder}
          onChange={handleChange}
        />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-300">{suffix}</span> : null}
      </div>
      {helper ? <p className="text-xs text-slate-300">{helper}</p> : null}
    </label>
  );
}
