import type { HTMLAttributes, PropsWithChildren } from "react";

type PanelHeaderTone = "green" | "yellow" | "blue";

type PanelHeaderProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & { tone?: PanelHeaderTone }
>;

const toneClasses: Record<PanelHeaderTone, string> = {
  green: "bg-[var(--retro-header-green)]",
  yellow: "bg-[var(--retro-header-yellow)]",
  blue: "bg-[var(--retro-header-blue)]",
};

export function PanelHeader({
  tone = "blue",
  className = "",
  ...props
}: PanelHeaderProps) {
  return (
    <div
      className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] text-[color:var(--retro-text)] border-b border-[var(--retro-border)] ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
