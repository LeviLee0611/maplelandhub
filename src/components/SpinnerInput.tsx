import { useState, type ChangeEvent, type FocusEvent, type WheelEvent } from "react";

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
  compact?: boolean;
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
  compact = false,
}: SpinnerInputProps) {
  // 타이핑 중인 원문. 예전엔 매 키 입력마다 clamp한 숫자를 그대로 화면에 되돌려 써서
  // (1) max에 도달하면 그 뒤 입력이 전부 무시되고(매직 가드 20 → 더 못 침)
  // (2) 백스페이스로 비우면 즉시 min이 박혀 "1450" 같은 값이 만들어졌다.
  // 포커스가 있는 동안에는 사용자가 친 문자열을 그대로 보여주고, blur에서 정리한다.
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setDraft(raw);

    // 빈 칸이나 "-", "1." 같은 입력 도중 상태에서는 부모 값을 건드리지 않는다.
    if (raw.trim() === "" || raw === "-") return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange(clampValue(parsed, min, max));
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const handleBlur = () => {
    if (draft === null) return;
    const parsed = Number(draft);
    const base = draft.trim() === "" || !Number.isFinite(parsed) ? (min ?? 0) : parsed;
    const next = clampValue(base, min, max);
    setDraft(null);
    if (next !== value) onChange(next);
  };

  // 숫자 입력칸은 포커스된 상태에서 휠을 굴리면 페이지가 스크롤되지 않고 값이 바뀐다.
  // 입력하다 스크롤하면 값이 멋대로 변하고 페이지는 멈춘 것처럼 보여서, 휠이 들어오면 포커스를 놓는다.
  const handleWheel = (event: WheelEvent<HTMLInputElement>) => {
    if (document.activeElement === event.currentTarget) {
      event.currentTarget.blur();
    }
  };

  const handleStep = (delta: number) => {
    setDraft(null);
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
        value={draft ?? (Number.isFinite(value) ? String(value) : "0")}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onWheel={handleWheel}
        disabled={disabled}
      />
      <div className={compact ? "flex items-stretch gap-1" : "spinner-controls"}>
        <button
          type="button"
          className={compact ? "h-[30px] w-6 rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[11px] text-[color:var(--retro-text)]" : "spinner-btn"}
          onClick={() => handleStep(step)}
          disabled={disabled}
          aria-label="Increase value"
        >
          +
        </button>
        <button
          type="button"
          className={compact ? "h-[30px] w-6 rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[11px] text-[color:var(--retro-text)]" : "spinner-btn"}
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
