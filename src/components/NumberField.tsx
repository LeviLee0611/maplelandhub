import { SpinnerInput } from "@/components/SpinnerInput";

type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
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
  suffix,
  helper,
}: NumberFieldProps) {
  return (
    <label htmlFor={id} className="space-y-1 text-xs">
      <span className="retro-chip">
        {label}
      </span>
      <div className="relative">
        <SpinnerInput
          id={id}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="w-full"
          inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
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
