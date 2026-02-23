import type { HTMLAttributes, PropsWithChildren } from "react";

type CellProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function LabelCell({ className = "", ...props }: CellProps) {
  return (
    <div
      className={`border-r border-b border-[var(--retro-border)] bg-[var(--retro-label)] px-2.5 py-2 text-[11px] font-medium text-white ${className}`}
      {...props}
    />
  );
}

export function ValueCell({ className = "", ...props }: CellProps) {
  return (
    <div
      className={`border-r border-b border-[var(--retro-border)] bg-[var(--retro-cell)] px-2.5 py-2 text-right text-[12px] font-medium text-[color:var(--retro-text)] ${className}`}
      {...props}
    />
  );
}

export function ValueCellMuted({ className = "", ...props }: CellProps) {
  return (
    <div
      className={`border-r border-b border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2.5 py-2 text-right text-[12px] font-medium text-[color:var(--retro-text)] ${className}`}
      {...props}
    />
  );
}
