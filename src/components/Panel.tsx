import type { ReactNode } from "react";

const basePanelClass =
  "rounded-xl border border-white/10 bg-[rgba(18,24,36,0.92)] shadow-[0_10px_30px_rgba(3,7,18,0.45)]";

type PanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
};

export function Panel({ title, children, className, actions }: PanelProps) {
  return (
    <section className={`${basePanelClass} ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200">{title}</h2>
        {actions ? <div className="text-xs text-slate-300">{actions}</div> : null}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}
