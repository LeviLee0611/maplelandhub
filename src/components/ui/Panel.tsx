import type { HTMLAttributes, PropsWithChildren } from "react";

type PanelProps = PropsWithChildren<HTMLAttributes<HTMLElement>>;

export function Panel({ className = "", ...props }: PanelProps) {
  return (
    <section
      className={`bg-[var(--retro-bg)] border border-[var(--retro-border-strong)] shadow-[0_1px_0_rgba(15,23,42,0.04)] ${className}`}
      {...props}
    />
  );
}
