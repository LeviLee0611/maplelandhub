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
  result,
  showFormula,
  onToggleFormula,
}: ResultPanelProps) {
  return (
    <Panel
      title="Result"
      actions={
        <button
          type="button"
          className="rounded-full border border-white/15 px-3 py-1 text-[10px] text-slate-200 hover:border-sky-300/60"
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

        <div className="grid gap-3 md:grid-cols-3">
          <NumberField id="avgDamage" label="평균 데미지" value={avgDamage} min={1} onChange={onAvgDamageChange} />
          <NumberField id="minDamage" label="최소 데미지" value={minDamage} min={1} onChange={onMinDamageChange} />
          <NumberField id="maxDamage" label="최대 데미지" value={maxDamage} min={1} onChange={onMaxDamageChange} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-400"
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
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-slate-300">
            <p>n방컷 = ceil(HP / (평균 데미지 × 타수 × 명중률))</p>
            <p className="mt-1">스킬 1회 평균 데미지: {formatNumber(result.damagePerSkill.avg)}</p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
