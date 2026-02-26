import Image from "next/image";
import { Panel } from "@/components/Panel";
import { MonsterSelect } from "@/components/MonsterSelect";
import { getMobAnimatedUrl } from "@/lib/maplestory-io";
import type { Monster } from "@/types/monster";
import { formatNumber } from "@/lib/utils";

type MonsterPanelProps = {
  monsters: Monster[];
  value: string;
  onChange: (value: string) => void;
  selected: Monster | undefined;
  characterLevel: number;
};

function getDisplayedNeedAcc(monster: Monster | undefined, characterLevel: number) {
  if (!monster) return 0;
  const eva = monster.eva ?? 0;
  const monsterLevel = monster.level ?? 0;
  const diffLevel = Math.max(0, monsterLevel - characterLevel);
  const requiredAcc = Math.ceil((55 + (diffLevel * 2)) * eva / 15);
  return Math.max(0, requiredAcc);
}

export function MonsterPanel({
  monsters,
  value,
  onChange,
  selected,
  characterLevel,
}: MonsterPanelProps) {
  const requiredAcc = getDisplayedNeedAcc(selected, characterLevel);

  return (
    <Panel title="몬스터 정보" tone="blue">
      <div className="space-y-3">
        <MonsterSelect monsters={monsters} value={value} onChange={onChange} />

        <div className="grid gap-3 border border-[var(--retro-border)] bg-[var(--retro-cell)] p-3 text-xs text-[color:var(--retro-text)] md:grid-cols-[72px_1fr]">
          <div className="flex h-[72px] w-[72px] items-center justify-center border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)]">
            {selected?.mobCode ? (
              <Image
                src={getMobAnimatedUrl(selected.mobCode)}
                alt={selected.name}
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
                unoptimized
              />
            ) : (
              "이미지 없음"
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{selected?.name ?? "몬스터를 검색해 선택하세요"}</span>
              <span className="text-[11px] text-[color:var(--retro-text-muted)]">Lv. {selected?.level ?? "-"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>HP {formatNumber(selected?.hp ?? 0)}</div>
              <div>물리 방어력 {formatNumber(selected?.def ?? 0)}</div>
              <div>회피 수치 {formatNumber(selected?.eva ?? 0)}</div>
              <div>필요 명중치 (현재 레벨 기준) {formatNumber(requiredAcc)}</div>
              <div>마법 방어력 {formatNumber(selected?.mDef ?? 0)}</div>
              <div>획득 경험치 {formatNumber(selected?.exp ?? 0)}</div>
              <div>속성 {selected?.ele?.join(", ") ?? "없음"}</div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
