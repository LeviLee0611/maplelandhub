import type { ReactNode } from "react";

type PanelTone = "green" | "yellow" | "blue";

const basePanelClass =
  "retro-panel border border-[var(--retro-border-strong)] bg-[var(--retro-bg)] shadow-[0_1px_0_rgba(15,23,42,0.04)]";

const toneClasses: Record<PanelTone, string> = {
  green: "retro-panel-header-tone-green",
  yellow: "retro-panel-header-tone-yellow",
  blue: "retro-panel-header-tone-blue",
};

type PanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  tone?: PanelTone;
};

export function Panel({ title, children, className, actions, tone = "blue" }: PanelProps) {
  return (
    <section className={`${basePanelClass} retro-panel-tone-${tone} ${className ?? ""}`}>
      <div
        className={`retro-panel-header flex items-center justify-between border-b border-[var(--retro-border)] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[color:var(--retro-text)] ${toneClasses[tone]}`}
      >
        <h2 className="retro-panel-title">{title}</h2>
        {actions ? <div className="text-[11px] text-[color:var(--retro-text-muted)]">{actions}</div> : null}
      </div>
      <div className="retro-panel-body px-3 py-3">{children}</div>
    </section>
  );
}
