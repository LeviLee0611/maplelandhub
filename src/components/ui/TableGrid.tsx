import type { CSSProperties, HTMLAttributes, PropsWithChildren } from "react";

type TableGridProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & { columns?: number }
>;

export function TableGrid({
  columns = 2,
  className = "",
  style,
  ...props
}: TableGridProps) {
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    ...style,
  };

  return (
    <div
      className={`grid border-t border-l border-[var(--retro-border)] text-xs ${className}`}
      style={gridStyle}
      {...props}
    />
  );
}
