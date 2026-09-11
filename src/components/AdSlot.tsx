/**
 * 광고 슬롯.
 *
 * 현재는 **자리 표시용 플레이스홀더**만 렌더한다(실제 애드센스 코드 미연결) — 배치를 눈으로
 * 확인하고 확정한 뒤에 실제 광고를 붙이기 위함. 운영 빌드(`NODE_ENV === "production"`)에서는
 * 아무것도 렌더하지 않는다 — 실사용자에게 "광고 자리 (미연결)" 박스를 보여줄 이유가 없고,
 * 실제 애드센스 단위로 교체하기 전까지는 계속 이 상태로 둔다. 로컬 `next dev`에서만 보인다.
 *
 * 높이를 항상 고정으로 잡아두는 게 중요하다. 광고가 로드된 뒤에 높이가 잡히면 그만큼 콘텐츠가
 * 밀려나 CLS(레이아웃 이동)가 발생하는데, 이게 광고 도입 시 성능 지표가 무너지는 가장 흔한 원인이다.
 * 실제 애드센스로 교체할 때도 이 고정 높이 컨테이너는 그대로 유지할 것.
 */

type AdSlotProps = {
  /** 어느 자리인지 — 확정 후 실제 광고 단위를 매핑할 때 식별자로 쓴다. */
  slot: string;
  /** horizontal: 가로형(반응형 폭). vertical: 세로형(고정 폭). */
  variant?: "horizontal" | "vertical";
  className?: string;
};

const VARIANT_STYLE = {
  horizontal: { minHeight: 100, label: "가로형 (반응형)" },
  vertical: { minHeight: 600, label: "세로형 160×600" },
} as const;

export function AdSlot({ slot, variant = "horizontal", className = "" }: AdSlotProps) {
  if (process.env.NODE_ENV === "production") return null;

  const { minHeight, label } = VARIANT_STYLE[variant];

  return (
    <div
      className={`flex items-center justify-center rounded-[10px] border border-dashed border-white/20 bg-white/[0.03] text-center ${
        variant === "vertical" ? "w-[160px] shrink-0" : "w-full"
      } ${className}`}
      style={{ minHeight }}
      aria-hidden="true"
    >
      <div className="px-3 py-4">
        <div className="text-[11px] font-semibold text-[color:var(--retro-text-muted)]">광고 자리 (미연결)</div>
        <div className="mt-1 text-[10px] text-[color:var(--retro-text-muted)]/70">
          {slot} · {label}
        </div>
      </div>
    </div>
  );
}
