"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { StatTable } from "@/components/StatTable";
import { EquipmentTable, type EquipmentSlot } from "@/components/EquipmentTable";
import { SkillPanel } from "@/components/SkillPanel";
import { MonsterPanel } from "@/components/MonsterPanel";
import { ResultPanel } from "@/components/ResultPanel";
import { NumberField } from "@/components/NumberField";
import { SelectField } from "@/components/SelectField";
import { getMonsters } from "@/lib/data/monsters";
import type { Monster } from "@/types/monster";
import { calcOneHit } from "@/lib/calculators/onehit";
import { clampNumber } from "@/lib/utils";

const typedMonsters = getMonsters() as Monster[];
const jobs = ["전사", "마법사", "궁수", "도적", "해적"];

const equipmentTemplate: EquipmentSlot[] = [
  { id: "hat", name: "모자", str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
  { id: "top", name: "상의", str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
  { id: "bottom", name: "하의", str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
  { id: "glove", name: "장갑", str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
  { id: "shoe", name: "신발", str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
  { id: "cape", name: "망토", str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
  { id: "weapon", name: "무기", str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
  { id: "shield", name: "방패", str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
];

export default function OneHitCalculatorPage() {
  const [nickname, setNickname] = useState("");
  const [job, setJob] = useState(jobs[0]);
  const [level, setLevel] = useState(70);
  const [stats, setStats] = useState({ str: 200, dex: 80, int: 4, luk: 30 });
  const [equipment, setEquipment] = useState<EquipmentSlot[]>(equipmentTemplate);

  const [skillName, setSkillName] = useState("기본 공격");
  const [skillLevel, setSkillLevel] = useState(1);
  const [hitsPerAttack, setHitsPerAttack] = useState(1);
  const [damageMultiplier, setDamageMultiplier] = useState(1.0);

  const [monsterName, setMonsterName] = useState(typedMonsters[0]?.name ?? "");
  const [avgDamage, setAvgDamage] = useState(800);
  const [minDamage, setMinDamage] = useState(650);
  const [maxDamage, setMaxDamage] = useState(1100);
  const [applyAccuracy, setApplyAccuracy] = useState(false);
  const [accuracyPercent, setAccuracyPercent] = useState(100);
  const [showFormula, setShowFormula] = useState(false);

  const selectedMonster = useMemo(
    () => typedMonsters.find((monster) => monster.name === monsterName) ?? typedMonsters[0],
    [monsterName],
  );

  const equipmentTotals = useMemo(() => {
    return equipment.reduce(
      (acc, slot) => ({
        str: acc.str + slot.str,
        dex: acc.dex + slot.dex,
        int: acc.int + slot.int,
        luk: acc.luk + slot.luk,
        atk: acc.atk + slot.atk,
        acc: acc.acc + slot.acc,
      }),
      { str: 0, dex: 0, int: 0, luk: 0, atk: 0, acc: 0 },
    );
  }, [equipment]);

  const derived = useMemo(() => {
    const main = stats.str + equipmentTotals.str;
    const dex = stats.dex + equipmentTotals.dex;
    const intel = stats.int + equipmentTotals.int;
    const luk = stats.luk + equipmentTotals.luk;
    const attack = Math.floor(main * 2 + dex * 0.5 + equipmentTotals.atk);
    const magic = Math.floor(intel * 2 + luk * 0.5 + equipmentTotals.atk);
    const acc = Math.floor(dex * 0.8 + level * 0.5 + equipmentTotals.acc);
    const eva = Math.floor(luk * 0.5 + dex * 0.2 + level * 0.3);
    return { attack, magic, acc, eva };
  }, [stats, equipmentTotals, level]);

  const effectiveAccuracy = applyAccuracy ? clampNumber(accuracyPercent, 0, 100) / 100 : 1;
  const result = calcOneHit({
    monsterHp: selectedMonster?.hp ?? 1,
    avgDamage: avgDamage * damageMultiplier,
    minDamage: minDamage * damageMultiplier,
    maxDamage: maxDamage * damageMultiplier,
    hitsPerSkill: Math.max(1, hitsPerAttack),
    accuracyRate: effectiveAccuracy,
  });

  return (
    <section className="space-y-6 text-slate-100">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">한방컷(n방컷) 계산기</h1>
        <p className="text-xs text-slate-300">
          메이플랜드 캐릭터 스탯 창 느낌으로 입력하고, 몬스터 한방컷을 계산합니다.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Character Info">
            <div className="space-y-3 text-xs">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-slate-300">닉네임</span>
                  <input
                    className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-slate-100 focus:border-amber-300 focus:outline-none"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="선택"
                  />
                </label>
                <SelectField
                  id="job"
                  label="직업"
                  value={job}
                  onChange={setJob}
                  options={jobs.map((item) => ({ label: item, value: item }))}
                />
                <NumberField id="char-level" label="레벨" value={level} min={1} onChange={setLevel} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField id="str" label="STR" value={stats.str} min={0} onChange={(value) => setStats({ ...stats, str: value })} />
                <NumberField id="dex" label="DEX" value={stats.dex} min={0} onChange={(value) => setStats({ ...stats, dex: value })} />
                <NumberField id="int" label="INT" value={stats.int} min={0} onChange={(value) => setStats({ ...stats, int: value })} />
                <NumberField id="luk" label="LUK" value={stats.luk} min={0} onChange={(value) => setStats({ ...stats, luk: value })} />
              </div>

              <StatTable
                rows={[
                  { label: "공격력(임시)", value: derived.attack, highlight: true },
                  { label: "마력(임시)", value: derived.magic },
                  { label: "회피율(EVA)", value: derived.eva },
                ]}
              />
            </div>
          </Panel>

          <Panel title="Equipment">
            <EquipmentTable slots={equipment} onChange={setEquipment} />
          </Panel>
        </div>

        <div className="space-y-6">
          <SkillPanel
            skillName={skillName}
            onSkillChange={setSkillName}
            skillLevel={skillLevel}
            onSkillLevelChange={setSkillLevel}
            hitsPerAttack={hitsPerAttack}
            onHitsChange={setHitsPerAttack}
            damageMultiplier={damageMultiplier}
            onMultiplierChange={setDamageMultiplier}
          />

          <MonsterPanel
            monsters={typedMonsters}
            value={monsterName}
            onChange={setMonsterName}
            selected={selectedMonster}
          />

          <ResultPanel
            avgDamage={avgDamage}
            minDamage={minDamage}
            maxDamage={maxDamage}
            onAvgDamageChange={setAvgDamage}
            onMinDamageChange={setMinDamage}
            onMaxDamageChange={setMaxDamage}
            accuracyPercent={accuracyPercent}
            onAccuracyChange={setAccuracyPercent}
            applyAccuracy={applyAccuracy}
            onApplyAccuracyChange={setApplyAccuracy}
            result={result}
            showFormula={showFormula}
            onToggleFormula={() => setShowFormula((prev) => !prev)}
          />
        </div>
      </div>
    </section>
  );
}
