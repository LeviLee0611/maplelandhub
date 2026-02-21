type ResultCardProps = {
  title: string;
  value: string;
  helper?: string;
  highlight?: boolean;
};

export function ResultCard({ title, value, helper, highlight }: ResultCardProps) {
  return (
    <div className={`glass-panel flex flex-col gap-2 rounded-2xl p-4 ${highlight ? "border border-sky-400/40" : ""}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{title}</p>
      <p className="text-3xl font-semibold text-white">{value}</p>
      {helper ? <p className="text-xs text-slate-300">{helper}</p> : null}
    </div>
  );
}
