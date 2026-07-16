// 큐브 시뮬레이터/큐브 빌더가 공유하는 등급 표시·숫자 포맷 유틸.
export const GRADE_META = [
  { label: "일반", chip: "border-slate-400/50 bg-slate-400/10 text-slate-300", solid: "bg-slate-400 text-slate-950" },
  { label: "레어", chip: "border-sky-400/50 bg-sky-400/10 text-sky-300", solid: "bg-sky-400 text-sky-950" },
  { label: "에픽", chip: "border-purple-400/50 bg-purple-400/10 text-purple-300", solid: "bg-purple-400 text-purple-950" },
  { label: "유니크", chip: "border-amber-400/50 bg-amber-400/10 text-amber-300", solid: "bg-amber-400 text-amber-950" },
  { label: "레전드리", chip: "border-emerald-400/60 bg-emerald-400/10 text-emerald-300", solid: "bg-emerald-400 text-emerald-950" },
] as const;

export function gradeMeta(grade: number) {
  return GRADE_META[grade] ?? GRADE_META[0];
}

export function formatCount(value: number) {
  if (!Number.isFinite(value)) return "∞";
  return value >= 100000 ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value.toFixed(1);
}

// 아주 희귀한 옵션은 "0.0000%"처럼 사실상 읽을 수 없는 숫자가 되므로, 충분히 작으면 "1/N" 형태로 보여준다.
export function formatProbability(p: number) {
  if (!(p > 0)) return "0%";
  if (p >= 0.001) return `${(p * 100).toFixed(2)}%`;
  if (p >= 0.00001) return `${(p * 100).toFixed(4)}%`;
  return `1/${Math.round(1 / p).toLocaleString()}`;
}
