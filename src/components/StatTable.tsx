type StatRowProps = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

export function StatRow({ label, value, highlight }: StatRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--retro-border)] py-1.5 text-xs">
      <span className="text-[color:var(--retro-text-muted)]">{label}</span>
      <span
        className={`font-medium ${
          highlight ? "text-[color:var(--retro-text)]" : "text-[color:var(--retro-text)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

type StatTableProps = {
  rows: StatRowProps[];
};

export function StatTable({ rows }: StatTableProps) {
  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <StatRow key={row.label} {...row} />
      ))}
    </div>
  );
}
