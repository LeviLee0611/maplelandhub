"use client";

import { useState } from "react";
import { estimateTakenDamage } from "@/lib/calculators";

export default function TakenDamageCalculatorPage() {
  const [monsterAttack, setMonsterAttack] = useState(180);
  const [playerDefense, setPlayerDefense] = useState(60);
  const [reductionRate, setReductionRate] = useState(0);

  const takenDamage = estimateTakenDamage(monsterAttack, playerDefense, reductionRate);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">피격 데미지 계산기</h1>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">몬스터 공격력</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="number"
            min={1}
            value={monsterAttack}
            onChange={(e) => setMonsterAttack(Number(e.target.value))}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">내 방어력</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="number"
            min={0}
            value={playerDefense}
            onChange={(e) => setPlayerDefense(Number(e.target.value))}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">추가 피해감소율(%)</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="number"
            min={0}
            max={90}
            value={reductionRate}
            onChange={(e) => setReductionRate(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p>예상 피격 데미지: <strong>{takenDamage}</strong></p>
        <p className="mt-3 text-xs text-slate-600">MVP 추정식: (몬스터 공격력 - 방어력 계수 반영) 후 추가 감소율 적용.</p>
      </div>
    </section>
  );
}
