import { Panel } from "@/components/Panel";
import { NumberField } from "@/components/NumberField";
import { SelectField } from "@/components/SelectField";

type SkillPanelProps = {
  skillName: string;
  onSkillChange: (value: string) => void;
  skillLevel: number;
  onSkillLevelChange: (value: number) => void;
  skillLevelMax: number;
  onSkillLevelMax: () => void;
  hitsPerAttack: number;
  onHitsChange: (value: number) => void;
  damageMultiplier: number;
  onMultiplierChange: (value: number) => void;
  skillOptions: string[];
};

export function SkillPanel({
  skillName,
  onSkillChange,
  skillLevel,
  onSkillLevelChange,
  skillLevelMax,
  onSkillLevelMax,
  hitsPerAttack,
  onHitsChange,
  damageMultiplier,
  onMultiplierChange,
  skillOptions,
}: SkillPanelProps) {
  return (
    <Panel
      title="스킬 정보"
      tone="yellow"
      actions={
        <div className="flex items-center gap-2">
          <span className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-2 py-0.5 text-[10px] text-[color:var(--retro-text-muted)]">
            타수 {hitsPerAttack}
          </span>
          <span className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-2 py-0.5 text-[10px] text-[color:var(--retro-text-muted)]">
            계수 {damageMultiplier.toFixed(2)}
          </span>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
            스킬 선택
          </span>
          <SelectField
            id="skill-select"
            label=""
            value={skillName}
            onChange={onSkillChange}
            options={skillOptions.map((option) => ({ label: option, value: option }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 text-xs">
            <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
              스킬 레벨
            </span>
            <div className="flex items-center gap-2">
              <input
                id="skill-level"
                className="w-14 rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                type="number"
                min={0}
                max={skillLevelMax}
                step={1}
                value={Number.isFinite(skillLevel) ? skillLevel : 0}
                onChange={(event) => onSkillLevelChange(Number(event.target.value) || 0)}
              />
              <button
                type="button"
                className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                onClick={onSkillLevelMax}
              >
                M
              </button>
              <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 {skillLevelMax}</span>
            </div>
          </div>
          <NumberField
            id="hits-per-attack"
            label="타수"
            value={hitsPerAttack}
            min={1}
            step={1}
            onChange={onHitsChange}
          />
        </div>

        <NumberField
          id="damage-multiplier"
          label="데미지 계수(배율)"
          value={damageMultiplier}
          min={0.1}
          step={0.05}
          onChange={onMultiplierChange}
          helper="예: 1.2 = 120%"
        />
      </div>
    </Panel>
  );
}
