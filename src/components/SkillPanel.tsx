import { Panel } from "@/components/Panel";
import { SpinnerInput } from "@/components/SpinnerInput";

type SkillPanelProps = {
  skillName: string;
  onSkillChange: (value: string) => void;
  skillLevel: number;
  onSkillLevelChange: (value: number) => void;
  skillLevelMax: number;
  onSkillLevelMax: () => void;
  skillOptions: string[];
};

export function SkillPanel({
  skillName,
  onSkillChange,
  skillLevel,
  onSkillLevelChange,
  skillLevelMax,
  onSkillLevelMax,
  skillOptions,
}: SkillPanelProps) {
  return (
    <Panel title="액티브 스킬" tone="yellow">
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
            공격 스킬 선택 ({skillOptions.length})
          </span>
          <select
            id="skill-select"
            className="w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
            value={skillName}
            onChange={(event) => onSkillChange(event.target.value)}
          >
            {skillOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 text-xs">
            <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
              스킬 레벨
            </span>
            <div className="flex items-center gap-2">
              <SpinnerInput
                id="skill-level"
                value={skillLevel}
                onChange={onSkillLevelChange}
                min={0}
                max={skillLevelMax}
                step={1}
                className="w-24"
                inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
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
        </div>
      </div>
    </Panel>
  );
}
