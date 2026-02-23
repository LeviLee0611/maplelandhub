import { Panel } from "@/components/Panel";
import { NumberField } from "@/components/NumberField";
import { ResultCard } from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import type { OneHitResult } from "@/lib/calculators/onehit";

type ResultPanelProps = {
  avgDamage: number;
  minDamage: number;
  maxDamage: number;
  onAvgDamageChange: (value: number) => void;
  onMinDamageChange: (value: number) => void;
  onMaxDamageChange: (value: number) => void;
  accuracyPercent: number;
  onAccuracyChange: (value: number) => void;
  applyAccuracy: boolean;
  onApplyAccuracyChange: (value: boolean) => void;
  useManualDamage: boolean;
  onToggleManualDamage: () => void;
  baseDamage?: {
    min: number;
    avg: number;
    max: number;
  };
  finalDamageMultiplier: number;
  onFinalDamageMultiplierChange: (value: number) => void;
  result: OneHitResult;
  showFormula: boolean;
  onToggleFormula: () => void;
};

export function ResultPanel({
  avgDamage,
  minDamage,
  maxDamage,
  onAvgDamageChange,
  onMinDamageChange,
  onMaxDamageChange,
  accuracyPercent,
  onAccuracyChange,
  applyAccuracy,
  onApplyAccuracyChange,
  useManualDamage,
  onToggleManualDamage,
  baseDamage,
  finalDamageMultiplier,
  onFinalDamageMultiplierChange,
  result,
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
        <div className="grid gap-3 md:grid-cols-3">
          <ResultCard title="최소" value={`${result.hitsToKill.min}방`} helper="최대 데미지 기준" />
          <ResultCard title="평균" value={`${result.hitsToKill.avg}방`} helper="평균 데미지 기준" highlight />
          <ResultCard title="최대" value={`${result.hitsToKill.max}방`} helper="최소 데미지 기준" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[color:var(--retro-text)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[color:var(--retro-text)]"
              checked={useManualDamage}
              onChange={() => onToggleManualDamage()}
            />
            데미지 직접 입력
          </label>
          <div className="w-32">
            <NumberField
              id="final-multiplier"
              label="최종 배율"
              value={finalDamageMultiplier}
              min={0.1}
              step={0.05}
              onChange={onFinalDamageMultiplierChange}
              helper="방어/속성/버프"
            />
          </div>
        </div>

        {useManualDamage ? (
          <div className="grid gap-3 md:grid-cols-3">
            <NumberField id="avgDamage" label="평균 데미지" value={avgDamage} min={1} onChange={onAvgDamageChange} />
            <NumberField id="minDamage" label="최소 데미지" value={minDamage} min={1} onChange={onMinDamageChange} />
            <NumberField id="maxDamage" label="최대 데미지" value={maxDamage} min={1} onChange={onMaxDamageChange} />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2 text-xs">
              <div className="text-[10px] text-[color:var(--retro-text-muted)]">기본 최소</div>
              <div className="text-sm font-semibold text-[color:var(--retro-text)]">{Math.round(baseDamage?.min ?? 0)}</div>
            </div>
            <div className="border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2 text-xs">
              <div className="text-[10px] text-[color:var(--retro-text-muted)]">기본 평균</div>
              <div className="text-sm font-semibold text-[color:var(--retro-text)]">{Math.round(baseDamage?.avg ?? 0)}</div>
            </div>
            <div className="border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2 text-xs">
              <div className="text-[10px] text-[color:var(--retro-text-muted)]">기본 최대</div>
              <div className="text-sm font-semibold text-[color:var(--retro-text)]">{Math.round(baseDamage?.max ?? 0)}</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[color:var(--retro-text)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[color:var(--retro-text)]"
              checked={applyAccuracy}
              onChange={(event) => onApplyAccuracyChange(event.target.checked)}
            />
            명중 보정 적용
          </label>
          <div className="w-32">
            <NumberField
              id="accuracyPercent"
              label="명중률(%)"
              value={accuracyPercent}
              min={0}
              max={100}
              step={1}
              onChange={onAccuracyChange}
            />
          </div>
        </div>

        {showFormula ? (
          <div className="border border-[var(--retro-border)] bg-[var(--retro-cell)] p-3 text-[11px] text-[color:var(--retro-text-muted)]">
            <p>N방컷 = ceil(HP / (평균 데미지 × 타수 × 명중률))</p>
            <p className="mt-1">스킬 1회 평균 데미지: {formatNumber(result.damagePerSkill.avg)}</p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
