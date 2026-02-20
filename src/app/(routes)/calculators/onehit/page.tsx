"use client";

import { useMemo, useState } from "react";
import monsters from "@/data/monsters.json";
import type { Monster } from "@/types/monster";
import { estimateDamagePerHit, estimateHitsToKill, requiredAttackForHits } from "@/lib/calculators";

const typedMonsters = monsters as Monster[];

export default function OneHitCalculatorPage() {
  const [monsterName, setMonsterName] = useState(typedMonsters[0]?.name ?? "");
  const [attack, setAttack] = useState(200);
  const [skillMultiplier, setSkillMultiplier] = useState(100);
  const [targetHits, setTargetHits] = useState(2);

  const selectedMonster = useMemo(
    () => typedMonsters.find((monster) => monster.name === monsterName) ?? typedMonsters[0],
    [monsterName],
  );

  const damagePerHit = estimateDamagePerHit(attack, skillMultiplier, selectedMonster.def);
  const estimatedHits = estimateHitsToKill(selectedMonster.hp, damagePerHit);
  const requiredAttack = requiredAttackForHits(selectedMonster.hp, skillMultiplier, selectedMonster.def, targetHits);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">n방컷 계산기</h1>

      <div className="glass-panel grid gap-4 rounded-2xl p-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-100">몬스터</span>
          <select
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-slate-100 focus:border-sky-300 focus:outline-none"
            value={monsterName}
            onChange={(e) => setMonsterName(e.target.value)}
          >
            {typedMonsters.map((monster) => (
              <option key={monster.mobCode} value={monster.name}>
                {monster.name} (Lv.{monster.level})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-100">내 공격력(평균)</span>
          <input
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-slate-100 focus:border-sky-300 focus:outline-none"
            type="number"
            min={1}
            value={attack}
            onChange={(e) => setAttack(Number(e.target.value))}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-100">스킬 계수(%)</span>
          <input
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-slate-100 focus:border-sky-300 focus:outline-none"
            type="number"
            min={1}
            value={skillMultiplier}
            onChange={(e) => setSkillMultiplier(Number(e.target.value))}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-100">목표 타수(n)</span>
          <input
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-slate-100 focus:border-sky-300 focus:outline-none"
            type="number"
            min={1}
            value={targetHits}
            onChange={(e) => setTargetHits(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="glass-panel rounded-2xl p-4 text-sm">
        <p>몬스터 HP: <strong>{selectedMonster.hp}</strong> / DEF: <strong>{selectedMonster.def}</strong></p>
        <p className="mt-2">예상 1타 데미지: <strong>{damagePerHit}</strong></p>
        <p className="mt-1">예상 타수: <strong>{estimatedHits}타</strong></p>
        <p className="mt-1">{targetHits}타컷 필요 공격력(추정): <strong>{requiredAttack}</strong></p>
        <p className="mt-3 text-xs text-slate-300">MVP 추정식입니다. 실제 오차를 줄이려면 직업/숙련도/최소·최대공격력 분산을 추가하세요.</p>
      </div>
    </section>
  );
}
