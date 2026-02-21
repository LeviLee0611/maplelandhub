export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toNumber(input: string | number, fallback = 0) {
  const parsed = typeof input === "number" ? input : Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value));
}

export function formatPercent(value: number, fractionDigits = 0) {
  return `${value.toFixed(fractionDigits)}%`;
}
