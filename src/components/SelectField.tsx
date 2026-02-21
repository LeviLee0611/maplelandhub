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
  return (
    <label htmlFor={id} className="space-y-1 text-xs">
      <span className="text-slate-300">{label}</span>
      <div className="relative">
        <select
          id={id}
          className="w-full appearance-none rounded-md border border-white/10 bg-white/5 px-2 py-2 pr-7 text-xs text-slate-100 focus:border-emerald-300 focus:outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▾</span>
      </div>
    </label>
  );
}
