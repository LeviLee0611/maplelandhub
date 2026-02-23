import type { ChangeEvent } from "react";

type SpinnerInputProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
};

const clampValue = (value: number, min?: number, max?: number) => {
  let next = value;
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
};

export function SpinnerInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  inputClassName,
  disabled,
}: SpinnerInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    const safeValue = Number.isFinite(nextValue) ? nextValue : 0;
    onChange(clampValue(safeValue, min, max));
  };

  const handleFocus = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleStep = (delta: number) => {
    const next = clampValue(value + delta, min, max);
    onChange(next);
  };

  return (
    <div className={`spinner-input ${className ?? ""}`}>
      <input
        id={id}
        className={`spinner-field ${inputClassName ?? ""}`}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={handleChange}
        onFocus={handleFocus}
        disabled={disabled}
      />
      <div className="spinner-controls">
        <button
          type="button"
          className="spinner-btn"
          onClick={() => handleStep(step)}
          disabled={disabled}
          aria-label="Increase value"
        >
          +
        </button>
        <button
          type="button"
          className="spinner-btn"
          onClick={() => handleStep(-step)}
          disabled={disabled}
          aria-label="Decrease value"
        >
          -
        </button>
      </div>
    </div>
  );
}
