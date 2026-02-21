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
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-100">몬스터</span>
      <input
        className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-slate-100 focus:border-emerald-300 focus:outline-none"
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
      <p className="text-[10px] text-slate-400">이름을 입력하면 자동 완성됩니다.</p>
    </label>
  );
}
