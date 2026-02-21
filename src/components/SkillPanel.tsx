import { Panel } from "@/components/Panel";
import { NumberField } from "@/components/NumberField";
import { SelectField } from "@/components/SelectField";

type SkillPanelProps = {
  skillName: string;
  onSkillChange: (value: string) => void;
  skillLevel: number;
  onSkillLevelChange: (value: number) => void;
  hitsPerAttack: number;
  onHitsChange: (value: number) => void;
  damageMultiplier: number;
  onMultiplierChange: (value: number) => void;
};

const skillOptions = ["기본 공격", "주력 스킬", "보조 스킬"];

export function SkillPanel({
  skillName,
  onSkillChange,
  skillLevel,
  onSkillLevelChange,
  hitsPerAttack,
  onHitsChange,
  damageMultiplier,
  onMultiplierChange,
}: SkillPanelProps) {
  return (
    <Panel
      title="Skills"
      actions={
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-200">
            타수 {hitsPerAttack}
          </span>
          <span className="rounded-full bg-sky-400/15 px-2 py-1 text-[10px] text-sky-200">
            계수 {damageMultiplier.toFixed(2)}
          </span>
        </div>
      }
    >
      <div className="space-y-3">
        <SelectField
          id="skill-select"
          label="스킬 선택"
          value={skillName}
          onChange={onSkillChange}
          options={skillOptions.map((option) => ({ label: option, value: option }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="skill-level"
            label="스킬 레벨"
            value={skillLevel}
            min={0}
            step={1}
            onChange={onSkillLevelChange}
          />
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
