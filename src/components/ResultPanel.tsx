import { Panel } from "@/components/Panel";
import { formatNumber } from "@/lib/utils";
import type { OneHitResult } from "@/lib/calculators/onehit";

type ResultPanelProps = {
  baseDamage?: {
    min: number;
    avg: number;
    max: number;
  };
  result: OneHitResult;
  elementMultiplier?: number;
  bishopHealBonus?: number;
  showFormula: boolean;
  onToggleFormula: () => void;
};

export function ResultPanel({
  baseDamage,
  result,
  elementMultiplier = 1,
  bishopHealBonus = 1,
  showFormula,
  onToggleFormula,
}: ResultPanelProps) {
  return (
    <Panel
      title="결과"
      tone="green"
      actions={
        <button
          type="button"
          className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-2 py-0.5 text-[10px] text-[color:var(--retro-text-muted)] hover:border-[var(--retro-border-strong)]"
          onClick={onToggleFormula}
        >
          계산식 {showFormula ? "숨김" : "보기"}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
          <div className="text-[10px] text-[color:var(--retro-text-muted)]">한방컷 확률</div>
          <div className="text-lg font-semibold text-[color:var(--retro-text)]">
            {result.oneShotChance.toFixed(2)}%
          </div>
          <div className="mt-1 text-[11px] text-[color:var(--retro-text-muted)]">
            {result.oneShotChance >= 100 ? "현재 설정으로 한방컷 가능" : "현재 설정으로 한방컷 불가"}
          </div>
          {result.oneShotChance < 100 ? (
            <div className="mt-1 text-[11px] text-[color:var(--retro-text-muted)]">
              예상 N방컷: {result.hitsToKill.min} ~ {result.hitsToKill.max} (평균 {result.hitsToKill.avg}방)
            </div>
          ) : null}
          <div className="mt-1 text-[10px] text-[color:var(--retro-text-muted)]">
            한방컷 공격력: {formatNumber(result.oneShotAttack)}
          </div>
        </div>

        <details className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-[color:var(--retro-text)]">
            상세 데미지 보기
          </summary>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <div className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-xs">
              <div className="text-[10px] text-[color:var(--retro-text-muted)]">기본 최소</div>
              <div className="text-sm font-semibold text-[color:var(--retro-text)]">{Math.round(baseDamage?.min ?? 0)}</div>
            </div>
            <div className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-xs">
              <div className="text-[10px] text-[color:var(--retro-text-muted)]">기본 평균</div>
              <div className="text-sm font-semibold text-[color:var(--retro-text)]">{Math.round(baseDamage?.avg ?? 0)}</div>
            </div>
            <div className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-xs">
              <div className="text-[10px] text-[color:var(--retro-text-muted)]">기본 최대</div>
              <div className="text-sm font-semibold text-[color:var(--retro-text)]">{Math.round(baseDamage?.max ?? 0)}</div>
            </div>
          </div>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <div className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-xs">
              <div className="text-[10px] text-[color:var(--retro-text-muted)]">속성 배율</div>
              <div className="text-sm font-semibold text-[color:var(--retro-text)]">{elementMultiplier.toFixed(2)}x</div>
            </div>
            <div className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-xs">
              <div className="text-[10px] text-[color:var(--retro-text-muted)]">비숍 힐 추가 배율</div>
              <div className="text-sm font-semibold text-[color:var(--retro-text)]">{bishopHealBonus.toFixed(2)}x</div>
            </div>
          </div>
        </details>

        {showFormula ? (
          <div className="border border-[var(--retro-border)] bg-[var(--retro-cell)] p-3 text-[11px] text-[color:var(--retro-text-muted)]">
            <p>N방컷 = ceil(HP / (평균 데미지 × 타수))</p>
            <p className="mt-1">스킬 1회 평균 데미지: {formatNumber(result.damagePerSkill.avg)}</p>
            <p className="mt-1">한방컷 판정: 최대 데미지 × 타수 ≥ 몬스터 HP</p>
            <p className="mt-1">최종 속성 계수: {elementMultiplier.toFixed(2)} × {bishopHealBonus.toFixed(2)}</p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
