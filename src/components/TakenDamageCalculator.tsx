"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { NumberField } from "@/components/NumberField";
import { MonsterPanel } from "@/components/MonsterPanel";
import { QuickSlots } from "@/components/quick-slots";
import { getMonsters } from "@/lib/data/monsters";
import type { Monster } from "@/types/monster";
import { calcMagicalTakenDamage, calcPhysicalTakenDamage, getStandardPDD } from "@/lib/calculators/takenDamage";
import type { JobClass } from "@/types/takenDamage";

const typedMonsters = (getMonsters() as Monster[]).filter((monster) => monster.exist !== false);
const jobGroups = ["전사", "마법사", "궁수", "도적"] as const;
const jobOptionsByGroup = {
  전사: ["파이터/크루세이더/히어로", "페이지/나이트/팔라딘", "스피어맨/드래곤나이트/다크나이트"],
  마법사: ["위자드/메이지/아크메이지(불/독)", "위자드/메이지/아크메이지(썬/콜)", "클레릭/프리스트/비숍"],
  궁수: ["헌터/레인저/보우마스터", "사수/저격수/신궁"],
  도적: ["어쌔신/허밋/나이트로드", "시프/시프마스터/섀도어"],
} as const;

const MAGIC_GUARD_TABLE = [0, 11, 14, 17, 20, 23, 30, 33, 36, 39, 42, 49, 52, 55, 58, 61, 68, 71, 74, 77, 80];
const INVINCIBLE_TABLE = [0, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const RESIST_BISHOP_TABLE = [0, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50];
const RESIST_ICE_TABLE = [0, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70];
const RESIST_FIRE_TABLE = [0, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70];
const MESO_GUARD_TABLE = [0, 90, 90, 89, 89, 88, 88, 87, 87, 86, 86, 85, 85, 84, 84, 83, 82, 81, 80, 79, 78];
const POWER_GUARD_TABLE = [
  0, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
];
const ACHILLES_TABLE = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150,
];
const MAGIC_ELEMENTS = ["무", "불", "독", "얼음", "전기", "성"] as const;

function pickTableValue(table: number[], level: number) {
  const idx = Math.min(table.length - 1, Math.max(0, Math.round(level)));
  return table[idx] ?? 0;
}

function oneShotLabel(min: number, max: number, maxHp: number) {
  if (min >= Math.max(1, maxHp)) return "100%";
  if (max < Math.max(1, maxHp)) return "0%";
  return "가능";
}

function formatRange(min: number, max: number) {
  if (min === max) return `${min}`;
  return `${min} ~ ${max}`;
}

function getMaxButtonClass(isMax: boolean) {
  return `h-[30px] w-8 border transition duration-150 hover:-translate-y-0.5 active:translate-y-0 ${
    isMax
      ? "border-cyan-300/80 bg-cyan-300/20 text-cyan-100 shadow-[0_4px_10px_rgba(34,211,238,0.18)]"
      : "border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)]"
  }`;
}

function toggleMax(value: number, max: number, setter: (next: number) => void) {
  setter(value === max ? 0 : max);
}

export function TakenDamageCalculator() {
  const [level, setLevel] = useState(120);
  const [maxHp, setMaxHp] = useState(6000);
  const [jobGroup, setJobGroup] = useState<(typeof jobGroups)[number]>("전사");
  const [job, setJob] = useState<string>(jobOptionsByGroup.전사[0]);
  const [stats, setStats] = useState({ str: 500, dex: 120, int: 20, luk: 50, wdef: 450, mdef: 280 });
  const [monsterName, setMonsterName] = useState(typedMonsters[0]?.name ?? "");
  const [magicElement, setMagicElement] = useState<(typeof MAGIC_ELEMENTS)[number]>("무");
  const [mobParam] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("mob");
  });

  useEffect(() => {
    if (mobParam) setMonsterName(mobParam);
  }, [mobParam]);

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
      magicElement,
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
      magicElement,
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
    if (!mobParam && typeof snapshot.monsterName === "string") setMonsterName(snapshot.monsterName);
    if (typeof snapshot.magicElement === "string" && MAGIC_ELEMENTS.includes(snapshot.magicElement as (typeof MAGIC_ELEMENTS)[number])) {
      setMagicElement(snapshot.magicElement as (typeof MAGIC_ELEMENTS)[number]);
    }
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

  const magicGuard = pickTableValue(MAGIC_GUARD_TABLE, magicGuardLevel);
  const invincible = jobGroup === "마법사" ? pickTableValue(INVINCIBLE_TABLE, invincibleLevel) : 0;
  const thiefMesoGuard = pickTableValue(MESO_GUARD_TABLE, mesoGuardLevel);
  const isBishop = job.includes("비숍");
  const isSunCol = job.includes("썬/콜");
  const isFirePoison = job.includes("불/독");

  const achillesReduce = jobGroup === "전사" ? pickTableValue(ACHILLES_TABLE, achillesLevel) / 10 : 0;
  const powerGuardReduce = jobGroup === "전사" ? pickTableValue(POWER_GUARD_TABLE, powerGuardLevel) : 0;
  const mesoGuardReduce = jobGroup === "도적" ? Math.max(0, 100 - thiefMesoGuard) : 0;

  const physicalMultiplierPercent =
    (1 - achillesReduce / 100) *
    (1 - powerGuardReduce / 100) *
    (1 - mesoGuardReduce / 100) *
    100;

  const magicalMultiplierPercent = (1 - achillesReduce / 100) * 100;

  const resistancePercent = useMemo(() => {
    if (jobGroup !== "마법사" || resistanceLevel <= 0) return 0;
    if (magicElement === "무") return 0;
    if (isBishop) return pickTableValue(RESIST_BISHOP_TABLE, resistanceLevel);
    if (isSunCol && (magicElement === "얼음" || magicElement === "전기")) {
      return pickTableValue(RESIST_ICE_TABLE, resistanceLevel);
    }
    if (isFirePoison && (magicElement === "불" || magicElement === "독")) {
      return pickTableValue(RESIST_FIRE_TABLE, resistanceLevel);
    }
    return 0;
  }, [jobGroup, resistanceLevel, magicElement, isBishop, isSunCol, isFirePoison]);

  const jobClass: JobClass =
    jobGroup === "전사"
      ? "warrior"
      : jobGroup === "마법사"
        ? "magician"
        : jobGroup === "궁수"
          ? "archer"
          : jobGroup === "도적"
            ? "thief"
            : "beginner";

  const physicalRange = useMemo(
    () =>
      calcPhysicalTakenDamage({
        character: {
          level,
          jobClass,
          basicStats: { STR: stats.str, DEX: stats.dex, INT: stats.int, LUK: stats.luk },
          secondaryStats: { PDD: stats.wdef, MDD: stats.mdef },
          tempStats: {
            InvinciblePercent: invincible,
            MesoGuard: jobGroup === "도적" && mesoGuardLevel > 0,
            ResistPercent: resistancePercent,
            PowerUpPercent: physicalMultiplierPercent,
          },
        },
        mob: {
          level: selectedMonster?.level ?? 1,
          templatePADamage: monsterWatk,
          templateMADamage: monsterMatk,
        },
      }),
    [
      level,
      jobClass,
      stats.str,
      stats.dex,
      stats.int,
      stats.luk,
      stats.wdef,
      stats.mdef,
      invincible,
      jobGroup,
      mesoGuardLevel,
      achillesReduce,
      powerGuardReduce,
      mesoGuardReduce,
      selectedMonster?.level,
      monsterWatk,
      monsterMatk,
    ],
  );

  const magicalRange = useMemo(
    () =>
      calcMagicalTakenDamage({
        character: {
          level,
          jobClass,
          basicStats: { STR: stats.str, DEX: stats.dex, INT: stats.int, LUK: stats.luk },
          secondaryStats: { PDD: stats.wdef, MDD: stats.mdef },
          tempStats: {
            InvinciblePercent: invincible,
            MesoGuard: jobGroup === "도적" && mesoGuardLevel > 0,
            ResistPercent: resistancePercent,
            PowerUpPercent: magicalMultiplierPercent,
          },
        },
        mob: {
          level: selectedMonster?.level ?? 1,
          templatePADamage: monsterWatk,
          templateMADamage: monsterMatk,
        },
      }),
    [
      level,
      jobClass,
      stats.str,
      stats.dex,
      stats.int,
      stats.luk,
      stats.wdef,
      stats.mdef,
      invincible,
      jobGroup,
      mesoGuardLevel,
      resistancePercent,
      achillesReduce,
      selectedMonster?.level,
      monsterWatk,
      monsterMatk,
    ],
  );

  const magePhysicalHp = useMemo(() => {
    if (jobGroup !== "마법사") return { min: physicalRange.min, max: physicalRange.max };
    const hpMin = Math.max(1, Math.floor(physicalRange.min * (1 - magicGuard / 100)));
    const hpMax = Math.max(1, Math.floor(physicalRange.max * (1 - magicGuard / 100)));
    return { min: hpMin, max: hpMax };
  }, [jobGroup, physicalRange.min, physicalRange.max, magicGuard]);

  const magePhysicalMp = useMemo(() => {
    if (jobGroup !== "마법사") return { min: 0, max: 0 };
    const mpMin = Math.max(0, Math.floor(physicalRange.min * (magicGuard / 100)));
    const mpMax = Math.max(0, Math.floor(physicalRange.max * (magicGuard / 100)));
    return { min: mpMin, max: mpMax };
  }, [jobGroup, physicalRange.min, physicalRange.max, magicGuard]);

  const mageMagicalHp = useMemo(() => {
    if (magicalRange.max <= 0) return { min: 0, max: 0 };
    if (jobGroup !== "마법사") return { min: magicalRange.min, max: magicalRange.max };
    const hpMin = Math.max(1, Math.floor(magicalRange.min * (1 - magicGuard / 100)));
    const hpMax = Math.max(1, Math.floor(magicalRange.max * (1 - magicGuard / 100)));
    return { min: hpMin, max: hpMax };
  }, [jobGroup, magicalRange.min, magicalRange.max, magicGuard]);

  const mageMagicalMp = useMemo(() => {
    if (jobGroup !== "마법사" || magicalRange.max <= 0) return { min: 0, max: 0 };
    const mpMin = Math.max(0, Math.floor(magicalRange.min * (magicGuard / 100)));
    const mpMax = Math.max(0, Math.floor(magicalRange.max * (magicGuard / 100)));
    return { min: mpMin, max: mpMax };
  }, [jobGroup, magicalRange.min, magicalRange.max, magicGuard]);

  const physicalOneShotChance = useMemo(() => {
    const hpMin = jobGroup === "마법사" ? magePhysicalHp.min : physicalRange.min;
    const hpMax = jobGroup === "마법사" ? magePhysicalHp.max : physicalRange.max;
    return oneShotLabel(hpMin, hpMax, maxHp);
  }, [jobGroup, magePhysicalHp.min, magePhysicalHp.max, physicalRange.min, physicalRange.max, maxHp]);

  const magicalOneShotChance = useMemo(() => {
    if (monsterMatk <= 0) return null;
    const hpMin = jobGroup === "마법사" ? mageMagicalHp.min : magicalRange.min;
    const hpMax = jobGroup === "마법사" ? mageMagicalHp.max : magicalRange.max;
    return oneShotLabel(hpMin, hpMax, maxHp);
  }, [monsterMatk, jobGroup, mageMagicalHp.min, mageMagicalHp.max, magicalRange.min, magicalRange.max, maxHp]);

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

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs text-slate-200/90">
          <h2 className="text-sm font-semibold text-slate-100">계산기 소개</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {[
              "직업별 방어력 반영",
              "마법 피해 계산",
              "생존 시뮬레이션",
            ].map((text) => (
              <div
                key={text}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-emerald-200/60 hover:bg-white/10"
              >
                <h3 className="text-[12px] font-semibold text-slate-100">{text}</h3>
              </div>
            ))}
          </div>
        </section>

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
                    <div className="flex items-end gap-2">
                      <NumberField id="achilles" label="아킬레스 Lv" value={achillesLevel} min={0} max={30} onChange={setAchillesLevel} />
                      <button
                        type="button"
                        className={getMaxButtonClass(achillesLevel === 30)}
                        onClick={() => toggleMax(achillesLevel, 30, setAchillesLevel)}
                      >
                        M
                      </button>
                    </div>
                    <div className="flex items-end gap-2">
                      <NumberField id="power-guard" label="파워가드 Lv" value={powerGuardLevel} min={0} max={30} onChange={setPowerGuardLevel} />
                      <button
                        type="button"
                        className={getMaxButtonClass(powerGuardLevel === 30)}
                        onClick={() => toggleMax(powerGuardLevel, 30, setPowerGuardLevel)}
                      >
                        M
                      </button>
                    </div>
                  </div>
                ) : null}

                {jobGroup === "마법사" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-end gap-2">
                      <NumberField id="magic-guard" label="매직 가드 Lv" value={magicGuardLevel} min={0} max={20} onChange={setMagicGuardLevel} />
                      <button
                        type="button"
                        className={getMaxButtonClass(magicGuardLevel === 20)}
                        onClick={() => toggleMax(magicGuardLevel, 20, setMagicGuardLevel)}
                      >
                        M
                      </button>
                    </div>
                    <div className="flex items-end gap-2">
                      <NumberField id="invincible" label="인빈서블 Lv" value={invincibleLevel} min={0} max={20} onChange={setInvincibleLevel} />
                      <button
                        type="button"
                        className={getMaxButtonClass(invincibleLevel === 20)}
                        onClick={() => toggleMax(invincibleLevel, 20, setInvincibleLevel)}
                      >
                        M
                      </button>
                    </div>
                    <div className="flex items-end gap-2">
                      <NumberField id="resistance" label="엘리멘트 레지스턴스 Lv" value={resistanceLevel} min={0} max={20} onChange={setResistanceLevel} />
                      <button
                        type="button"
                        className={getMaxButtonClass(resistanceLevel === 20)}
                        onClick={() => toggleMax(resistanceLevel, 20, setResistanceLevel)}
                      >
                        M
                      </button>
                    </div>
                    <label className="space-y-1">
                      <span className="text-xs text-slate-300">마법 공격 속성</span>
                      <select
                        className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-sm text-slate-100 focus:border-[var(--retro-border-strong)] focus:outline-none"
                        value={magicElement}
                        onChange={(event) => setMagicElement(event.target.value as (typeof MAGIC_ELEMENTS)[number])}
                      >
                        {MAGIC_ELEMENTS.map((element) => (
                          <option key={element} value={element}>
                            {element}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                {jobGroup === "궁수" ? <p className="text-[11px] text-[color:var(--retro-text-muted)]">궁수는 피격 감소 스킬이 없습니다.</p> : null}

                {jobGroup === "도적" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-end gap-2">
                      <NumberField id="meso-guard" label="메소 가드 Lv" value={mesoGuardLevel} min={0} max={20} onChange={setMesoGuardLevel} />
                      <button
                        type="button"
                        className={getMaxButtonClass(mesoGuardLevel === 20)}
                        onClick={() => toggleMax(mesoGuardLevel, 20, setMesoGuardLevel)}
                      >
                        M
                      </button>
                    </div>
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
                  <div className="text-base font-semibold">
                    {jobGroup === "마법사"
                      ? `${formatRange(magePhysicalHp.min, magePhysicalHp.max)} (HP)`
                      : formatRange(physicalRange.min, physicalRange.max)}
                  </div>
                  <div className="mt-1 text-[10px] text-[color:var(--retro-text-muted)]">
                    한 방 사망 확률: {physicalOneShotChance}
                  </div>
                </div>

                <div className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
                  <div className="text-[10px] text-[color:var(--retro-text-muted)]">마법 공격 피격</div>
                  <div className="text-base font-semibold">
                    {monsterMatk > 0
                      ? (jobGroup === "마법사"
                        ? `${formatRange(mageMagicalHp.min, mageMagicalHp.max)} (HP)`
                        : formatRange(magicalRange.min, magicalRange.max))
                      : "마법공격 안함"}
                  </div>
                  <div className="mt-1 text-[10px] text-[color:var(--retro-text-muted)]">
                    한 방 사망 확률: {magicalOneShotChance === null ? "마법공격 안함" : magicalOneShotChance}
                  </div>
                </div>

                <details className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
                  <summary className="cursor-pointer text-[11px] font-semibold">상세 계산 보기</summary>
                  <div className="mt-2 space-y-1 text-[11px] text-[color:var(--retro-text-muted)]">
                    <p>몬스터 물공/마공: {monsterWatk} / {monsterMatk}</p>
                    <p>몬스터 물공/마공: {monsterWatk} / {monsterMatk}</p>
                    <p>기준 PDD: {getStandardPDD(jobClass, level)}</p>
                    <p>랜덤 범위: 물리 0.8~0.85 / 마법 0.75~0.8</p>
                    {jobGroup === "마법사" && magicGuard > 0 ? (
                      <p>매직 가드 분배: HP {(100 - magicGuard).toFixed(1)}% / MP {magicGuard.toFixed(1)}%</p>
                    ) : null}
                    {jobGroup === "도적" && thiefMesoGuard > 0 ? (
                      <p>메소 가드 분배: HP {(100 - thiefMesoGuard).toFixed(1)}% / 메소 {thiefMesoGuard.toFixed(1)}%</p>
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
