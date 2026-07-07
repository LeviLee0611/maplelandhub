export function PlanetBadge() {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-accent-text)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)] shadow-[0_0_8px_var(--brand-accent)]" />
      메이플 플래닛 버전
    </div>
  );
}
