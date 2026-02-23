import type { ChangeEvent } from "react";
import type { Monster } from "@/types/monster";

const listId = "monster-list";

type MonsterSelectProps = {
  monsters: Monster[];
  value: string;
  onChange: (value: string) => void;
};

export function MonsterSelect({ monsters, value, onChange }: MonsterSelectProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label className="space-y-1 text-xs">
      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
        몬스터
      </span>
      <input
        className="w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
        list={listId}
        value={value}
        onChange={handleChange}
        placeholder="몬스터 이름을 검색하세요"
      />
      <datalist id={listId}>
        {monsters.map((monster) => (
          <option key={monster.mobCode} value={monster.name}>
            {monster.name} (Lv.{monster.level})
          </option>
        ))}
      </datalist>
      <p className="text-[10px] text-[color:var(--retro-text-muted)]">이름을 입력하면 자동 완성됩니다.</p>
    </label>
  );
}
