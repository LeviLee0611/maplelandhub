type ResultCardProps = {
  title: string;
  value: string;
  helper?: string;
  highlight?: boolean;
};

export function ResultCard({ title, value, helper, highlight }: ResultCardProps) {
  return (
    <div
      className={`flex flex-col gap-1 border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2 ${
        highlight ? "border-[var(--retro-border-strong)]" : ""
      }`}
    >
      <p className="text-[10px] tracking-[0.2em] text-[color:var(--retro-text-muted)]">{title}</p>
      <p className="text-xl font-semibold text-[color:var(--retro-text)]">{value}</p>
      {helper ? <p className="text-[10px] text-[color:var(--retro-text-muted)]">{helper}</p> : null}
    </div>
  );
}
