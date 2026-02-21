type StatRowProps = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

export function StatRow({ label, value, highlight }: StatRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1 text-xs">
      <span className="text-slate-300">{label}</span>
      <span className={`font-semibold ${highlight ? "text-emerald-200" : "text-slate-100"}`}>{value}</span>
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
