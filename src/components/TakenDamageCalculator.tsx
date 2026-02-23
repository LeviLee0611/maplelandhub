"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { NumberField } from "@/components/NumberField";
import { MonsterPanel } from "@/components/MonsterPanel";
import { QuickSlots } from "@/components/quick-slots";
import { getMonsters } from "@/lib/data/monsters";
import type { Monster } from "@/types/monster";

const typedMonsters = (getMonsters() as Monster[]).filter((monster) => monster.exist !== false);
const jobGroups = ["전사", "마법사", "궁수", "도적"] as const;
const jobOptionsByGroup = {
  전사: ["파이터/크루세이더/히어로", "페이지/나이트/팔라딘", "스피어맨/드래곤나이트/다크나이트"],
  마법사: ["위자드/메이지/아크메이지(불/독)", "위자드/메이지/아크메이지(썬/콜)", "클레릭/프리스트/비숍"],
  궁수: ["헌터/레인저/보우마스터", "사수/저격수/신궁"],
  도적: ["어쌔신/허밋/나이트로드", "시프/시프마스터/섀도어"],
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function percent(level: number, ratio: number, max: number) {
  return clamp(level * ratio, 0, max);
}

function calcFinalDamage(baseDamage: number, reductionPercent: number) {
  return Math.max(1, Math.floor(baseDamage * (1 - clamp(reductionPercent, 0, 95) / 100)));
}

export function TakenDamageCalculator() {
  const [level, setLevel] = useState(120);
  const [maxHp, setMaxHp] = useState(6000);
  const [jobGroup, setJobGroup] = useState<(typeof jobGroups)[number]>("전사");
  const [job, setJob] = useState<string>(jobOptionsByGroup.전사[0]);
  const [stats, setStats] = useState({ str: 500, dex: 120, int: 20, luk: 50, wdef: 450, mdef: 280 });
  const [monsterName, setMonsterName] = useState(typedMonsters[0]?.name ?? "");

  const [achillesLevel, setAchillesLevel] = useState(0);
  const [powerGuardLevel, setPowerGuardLevel] = useState(0);

  const [magicGuardLevel, setMagicGuardLevel] = useState(0);
  const [invincibleLevel, setInvincibleLevel] = useState(0);
  const [resistanceLevel, setResistanceLevel] = useState(0);

  const [mesoGuardLevel, setMesoGuardLevel] = useState(0);

  const quickSnapshot = useMemo(
    () => ({
      level,
      maxHp,
      jobGroup,
      job,
      stats,
      monsterName,
      achillesLevel,
      powerGuardLevel,
      magicGuardLevel,
      invincibleLevel,
      resistanceLevel,
      mesoGuardLevel,
    }),
    [
      level,
      maxHp,
      jobGroup,
      job,
      stats,
      monsterName,
      achillesLevel,
      powerGuardLevel,
      magicGuardLevel,
      invincibleLevel,
      resistanceLevel,
      mesoGuardLevel,
    ],
  );

  function applyQuickSnapshot(snapshot: typeof quickSnapshot) {
    if (!snapshot) return;
    if (typeof snapshot.level === "number") setLevel(snapshot.level);
    if (typeof snapshot.maxHp === "number") setMaxHp(snapshot.maxHp);
    if (snapshot.jobGroup && jobGroups.includes(snapshot.jobGroup)) {
      setJobGroup(snapshot.jobGroup);
      setTimeout(() => {
        if (typeof snapshot.job === "string") setJob(snapshot.job);
      }, 0);
    }
    if (snapshot.stats) setStats(snapshot.stats);
    if (typeof snapshot.monsterName === "string") setMonsterName(snapshot.monsterName);
    if (typeof snapshot.achillesLevel === "number") setAchillesLevel(snapshot.achillesLevel);
    if (typeof snapshot.powerGuardLevel === "number") setPowerGuardLevel(snapshot.powerGuardLevel);
    if (typeof snapshot.magicGuardLevel === "number") setMagicGuardLevel(snapshot.magicGuardLevel);
    if (typeof snapshot.invincibleLevel === "number") setInvincibleLevel(snapshot.invincibleLevel);
    if (typeof snapshot.resistanceLevel === "number") setResistanceLevel(snapshot.resistanceLevel);
    if (typeof snapshot.mesoGuardLevel === "number") setMesoGuardLevel(snapshot.mesoGuardLevel);
  }

  const selectedMonster = useMemo(
    () => typedMonsters.find((monster) => monster.name === monsterName) ?? typedMonsters[0],
    [monsterName],
  );

  const monsterWatk = Math.max(0, selectedMonster?.watk ?? 0);
  const monsterMatk = Math.max(0, selectedMonster?.matk ?? 0);

  const basePhysical = Math.max(1, monsterWatk - stats.wdef * 0.45);
  const baseMagical = monsterMatk > 0 ? Math.max(1, monsterMatk - stats.mdef * 0.45) : 0;

  const warriorReductions = useMemo(() => {
    const achilles = percent(achillesLevel, 0.5, 15);
    const powerGuard = percent(powerGuardLevel, 40 / 30, 40);
    return {
      physical: achilles + powerGuard,
      magical: achilles,
      achilles,
      powerGuard,
    };
  }, [achillesLevel, powerGuardLevel]);

  const mageReductions = useMemo(() => {
    const invincible = percent(invincibleLevel, 1.5, 30);
    const resistance = percent(resistanceLevel, 2, 40);
    const magicGuard = magicGuardLevel > 0 ? clamp(50 + magicGuardLevel * 1.5, 0, 80) : 0;
    return {
      physical: invincible,
      magical: resistance,
      invincible,
      resistance,
      magicGuard,
    };
  }, [invincibleLevel, resistanceLevel, magicGuardLevel]);

  const thiefMesoGuard = mesoGuardLevel > 0 ? 50 : 0;

  const reductionSummary = useMemo(() => {
    if (jobGroup === "전사") return warriorReductions;
    if (jobGroup === "마법사") return mageReductions;
    if (jobGroup === "도적") return { physical: thiefMesoGuard, magical: thiefMesoGuard };
    return { physical: 0, magical: 0 };
  }, [jobGroup, warriorReductions, mageReductions, thiefMesoGuard]);

  const reducedPhysical = calcFinalDamage(basePhysical, reductionSummary.physical);
  const reducedMagical = baseMagical > 0 ? calcFinalDamage(baseMagical, reductionSummary.magical) : 0;

  const magePhysicalHp = useMemo(() => {
    if (jobGroup !== "마법사") return reducedPhysical;
    const hpPart = reducedPhysical * (1 - mageReductions.magicGuard / 100);
    return Math.max(1, Math.floor(hpPart));
  }, [jobGroup, reducedPhysical, mageReductions.magicGuard]);

  const magePhysicalMp = useMemo(() => {
    if (jobGroup !== "마법사") return 0;
    return Math.max(0, Math.floor(reducedPhysical * (mageReductions.magicGuard / 100)));
  }, [jobGroup, reducedPhysical, mageReductions.magicGuard]);

  const mageMagicalHp = useMemo(() => {
    if (reducedMagical <= 0) return 0;
    if (jobGroup !== "마법사") return reducedMagical;
    const hpPart = reducedMagical * (1 - mageReductions.magicGuard / 100);
    return Math.max(1, Math.floor(hpPart));
  }, [jobGroup, reducedMagical, mageReductions.magicGuard]);

  const mageMagicalMp = useMemo(() => {
    if (jobGroup !== "마법사" || reducedMagical <= 0) return 0;
    return Math.max(0, Math.floor(reducedMagical * (mageReductions.magicGuard / 100)));
  }, [jobGroup, reducedMagical, mageReductions.magicGuard]);

  const physicalOneShotChance = useMemo(() => {
    const hpDamage = jobGroup === "마법사" ? magePhysicalHp : reducedPhysical;
    return hpDamage >= Math.max(1, maxHp) ? 100 : 0;
  }, [jobGroup, magePhysicalHp, reducedPhysical, maxHp]);

  const magicalOneShotChance = useMemo(() => {
    if (monsterMatk <= 0) return null;
    const hpDamage = jobGroup === "마법사" ? mageMagicalHp : reducedMagical;
    return hpDamage >= Math.max(1, maxHp) ? 100 : 0;
  }, [monsterMatk, jobGroup, mageMagicalHp, reducedMagical, maxHp]);

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">피격 데미지 계산기</h1>
          <p className="text-sm text-slate-300">직업별 피격 감소 스킬을 반영해 물리/마법 피격량을 계산합니다.</p>
          <p className="text-xs text-amber-200/90">
            일부 몬스터의 마법 공격력 데이터는 원작과 차이가 있을 수 있어 결과값에 오차가 발생할 수 있습니다.
          </p>
        </header>

        <div className="mt-4">
          <QuickSlots
            storageKey="mlh-quickslots-takendamage-v1"
            getSnapshot={() => quickSnapshot}
            applySnapshot={applyQuickSnapshot}
            title="빠른 저장 (피격 데미지)"
            preview={(data) => `${data.job} / Lv.${data.level} / ${data.monsterName}`}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Panel title="캐릭터 정보" tone="blue">
              <div className="space-y-3 text-xs">
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="retro-chip">직업군</span>
                    <select
                      className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                      value={jobGroup}
                      onChange={(event) => {
                        const nextGroup = event.target.value as (typeof jobGroups)[number];
                        setJobGroup(nextGroup);
                        setJob(jobOptionsByGroup[nextGroup][0]);
                      }}
                    >
                      {jobGroups.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="retro-chip">직업</span>
                    <select
                      className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                      value={job}
                      onChange={(event) => setJob(event.target.value)}
                    >
                      {jobOptionsByGroup[jobGroup].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <NumberField id="td-level" label="레벨" value={level} min={1} onChange={setLevel} />
                <NumberField id="td-max-hp" label="최대 HP" value={maxHp} min={1} onChange={setMaxHp} />

                <div className="retro-subsection space-y-2">
                  <div className="retro-section-title">스탯 입력</div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField id="td-str" label="STR" value={stats.str} min={0} onChange={(v) => setStats({ ...stats, str: v })} />
                    <NumberField id="td-dex" label="DEX" value={stats.dex} min={0} onChange={(v) => setStats({ ...stats, dex: v })} />
                    <NumberField id="td-int" label="INT" value={stats.int} min={0} onChange={(v) => setStats({ ...stats, int: v })} />
                    <NumberField id="td-luk" label="LUK" value={stats.luk} min={0} onChange={(v) => setStats({ ...stats, luk: v })} />
                    <NumberField id="td-wdef" label="물리 방어력" value={stats.wdef} min={0} onChange={(v) => setStats({ ...stats, wdef: v })} />
                    <NumberField id="td-mdef" label="마법 방어력" value={stats.mdef} min={0} onChange={(v) => setStats({ ...stats, mdef: v })} />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="피격 스킬" tone="yellow">
              <div className="space-y-2 text-xs">
                {jobGroup === "전사" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField id="achilles" label="아킬레스 Lv" value={achillesLevel} min={0} max={30} onChange={setAchillesLevel} />
                    <NumberField id="power-guard" label="파워가드 Lv" value={powerGuardLevel} min={0} max={30} onChange={setPowerGuardLevel} />
                  </div>
                ) : null}

                {jobGroup === "마법사" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField id="magic-guard" label="매직 가드 Lv" value={magicGuardLevel} min={0} max={20} onChange={setMagicGuardLevel} />
                    <NumberField id="invincible" label="인빈서블 Lv" value={invincibleLevel} min={0} max={20} onChange={setInvincibleLevel} />
                    <NumberField id="resistance" label="엘리멘트 레지스턴스 Lv" value={resistanceLevel} min={0} max={20} onChange={setResistanceLevel} />
                  </div>
                ) : null}

                {jobGroup === "궁수" ? <p className="text-[11px] text-[color:var(--retro-text-muted)]">궁수는 피격 감소 스킬이 없습니다.</p> : null}

                {jobGroup === "도적" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField id="meso-guard" label="메소 가드 Lv" value={mesoGuardLevel} min={0} max={20} onChange={setMesoGuardLevel} />
                  </div>
                ) : null}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <MonsterPanel
              monsters={typedMonsters}
              value={monsterName}
              onChange={setMonsterName}
              selected={selectedMonster}
              characterLevel={level}
            />

            <Panel title="결과" tone="green">
              <div className="space-y-3 text-xs">
                <div className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
                  <div className="text-[10px] text-[color:var(--retro-text-muted)]">물리 공격 피격</div>
                  <div className="text-base font-semibold">{jobGroup === "마법사" ? `${magePhysicalHp} (HP), ${magePhysicalMp} (MP)` : reducedPhysical}</div>
                  <div className="mt-1 text-[10px] text-[color:var(--retro-text-muted)]">
                    한 방 사망 확률: {physicalOneShotChance.toFixed(2)}%
                  </div>
                </div>

                <div className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
                  <div className="text-[10px] text-[color:var(--retro-text-muted)]">마법 공격 피격</div>
                  <div className="text-base font-semibold">
                    {monsterMatk > 0
                      ? (jobGroup === "마법사" ? `${mageMagicalHp} (HP), ${mageMagicalMp} (MP)` : reducedMagical)
                      : "마법 공격 없음"}
                  </div>
                  <div className="mt-1 text-[10px] text-[color:var(--retro-text-muted)]">
                    한 방 사망 확률: {magicalOneShotChance === null ? "마법 공격 없음" : `${magicalOneShotChance.toFixed(2)}%`}
                  </div>
                </div>

                <details className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
                  <summary className="cursor-pointer text-[11px] font-semibold">상세 계산 보기</summary>
                  <div className="mt-2 space-y-1 text-[11px] text-[color:var(--retro-text-muted)]">
                    <p>몬스터 물공/마공: {monsterWatk} / {monsterMatk}</p>
                    <p>기본 물리 데미지: max(1, {monsterWatk} - {stats.wdef} × 0.45) = {Math.floor(basePhysical)}</p>
                    {monsterMatk > 0 ? (
                      <p>기본 마법 데미지: max(1, {monsterMatk} - {stats.mdef} × 0.45) = {Math.floor(baseMagical)}</p>
                    ) : null}
                    <p>물리 감소율: {reductionSummary.physical.toFixed(1)}%</p>
                    {monsterMatk > 0 ? <p>마법 감소율: {reductionSummary.magical.toFixed(1)}%</p> : null}
                    {jobGroup === "마법사" && mageReductions.magicGuard > 0 ? (
                      <p>매직 가드 분배: HP {(100 - mageReductions.magicGuard).toFixed(1)}% / MP {mageReductions.magicGuard.toFixed(1)}%</p>
                    ) : null}
                  </div>
                </details>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
