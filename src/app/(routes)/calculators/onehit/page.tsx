"use client";

import { useEffect, useMemo, useState } from "react";
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
import { calcBaseDamageFromStats, calcOneHit } from "@/lib/calculators/onehit";
import { clampNumber } from "@/lib/utils";
import mainSkillMapping from "@data/skills/mainSkillMapping.json";
import weaponMapping from "@data/skills/weaponMapping.json";
import range20 from "@data/skills/range20.json";
import range30 from "@data/skills/range30.json";
import damageMapping from "@data/skills/damageMapping.json";
import damageMappingActive from "@data/skills/damageMappingActive.json";
import damageMappingActive2 from "@data/skills/damageMappingActive2.json";
import criticalThrowMapping from "@data/skills/criticalThrowMapping.json";
import sharpEyesMapping from "@data/skills/sharpEyesMapping.json";
import venomSkill from "@data/skills/venomSkill.json";
import mapleHero from "@data/skills/mapleHero.json";
import meditation from "@data/skills/meditation.json";

const typedMonsters = getMonsters() as Monster[];
const jobGroups = ["전사", "마법사", "궁수", "도적", "해적"] as const;

const jobOptionsByGroup = {
  전사: [
    "파이터/크루세이더/히어로",
    "페이지/나이트/팔라딘",
    "스피어맨/드래곤나이트/다크나이트",
  ],
  마법사: [
    "위자드/메이지/아크메이지(불/독)",
    "위자드/메이지/아크메이지(썬/콜)",
    "클레릭/프리스트/비숍",
  ],
  궁수: ["헌터/레인저/보우마스터", "사수/저격수/신궁"],
  도적: ["어쌔신/허밋/나이트로드", "시프/시프마스터/섀도어"],
  해적: ["인파이터/버커니어/바이퍼", "건슬링거/발키리/캡틴"],
} as const;

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
  const [jobGroup, setJobGroup] = useState<(typeof jobGroups)[number]>(jobGroups[0]);
  const [job, setJob] = useState<string>(jobOptionsByGroup[jobGroup][0]);
  const [level, setLevel] = useState(70);
  const [stats, setStats] = useState({ str: 200, dex: 80, int: 4, luk: 30 });
  const [equipment, setEquipment] = useState<EquipmentSlot[]>(equipmentTemplate);

  const [skillName, setSkillName] = useState("기본 공격");
  const [skillLevel, setSkillLevel] = useState(1);
  const [hitsPerAttack, setHitsPerAttack] = useState(1);
  const [damageMultiplier, setDamageMultiplier] = useState(1.0);
  const [statMultiplier, setStatMultiplier] = useState(4.0);
  const [mastery, setMastery] = useState(0.6);
  const [finalDamageMultiplier, setFinalDamageMultiplier] = useState(1.0);
  const [useManualDamage, setUseManualDamage] = useState(false);
  const [weaponType, setWeaponType] = useState("");
  const [sharpEyesLevel, setSharpEyesLevel] = useState(0);
  const [mapleHeroLevel, setMapleHeroLevel] = useState(0);
  const [meditationLevel, setMeditationLevel] = useState(0);

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

  const jobProfile = useMemo(() => {
    const profiles = {
      "파이터/크루세이더/히어로": { primary: "str", secondary: "dex", multiplier: 4.0, mastery: 0.6 },
      "페이지/나이트/팔라딘": { primary: "str", secondary: "dex", multiplier: 4.0, mastery: 0.6 },
      "스피어맨/드래곤나이트/다크나이트": { primary: "str", secondary: "dex", multiplier: 4.0, mastery: 0.6 },
      "위자드/메이지/아크메이지(불/독)": { primary: "int", secondary: "luk", multiplier: 1.0, mastery: 0.6 },
      "위자드/메이지/아크메이지(썬/콜)": { primary: "int", secondary: "luk", multiplier: 1.0, mastery: 0.6 },
      "클레릭/프리스트/비숍": { primary: "int", secondary: "luk", multiplier: 1.0, mastery: 0.6 },
      "헌터/레인저/보우마스터": { primary: "dex", secondary: "str", multiplier: 4.0, mastery: 0.6 },
      "사수/저격수/신궁": { primary: "dex", secondary: "str", multiplier: 4.0, mastery: 0.6 },
      "어쌔신/허밋/나이트로드": { primary: "luk", secondary: "dex", multiplier: 4.0, mastery: 0.6 },
      "시프/시프마스터/섀도어": { primary: "luk", secondary: "dex", multiplier: 4.0, mastery: 0.6 },
      "인파이터/버커니어/바이퍼": { primary: "str", secondary: "dex", multiplier: 4.0, mastery: 0.6 },
      "건슬링거/발키리/캡틴": { primary: "dex", secondary: "str", multiplier: 4.0, mastery: 0.6 },
    } as const;
    return (
      profiles[job as keyof typeof profiles] ??
      profiles["파이터/크루세이더/히어로"]
    );
  }, [job]);

  useEffect(() => {
    const nextJob = jobOptionsByGroup[jobGroup][0];
    setJob(nextJob);
  }, [jobGroup]);

  const skillKey = useMemo(() => {
    if (job.includes("드래곤나이트")) return "스피어맨/용기사/다크나이트";
    if (job.includes("썬/콜")) return "썬콜";
    if (job.includes("불/독")) return "불독";
    return job;
  }, [job]);

  const skillOptions = useMemo(() => {
    const mapping = mainSkillMapping as Record<string, string[]>;
    return mapping[skillKey] ?? ["기본 공격"];
  }, [skillKey]);

  useEffect(() => {
    setSkillName(skillOptions[0] ?? "기본 공격");
  }, [skillOptions]);

  const weaponOptions = useMemo(() => {
    const mapping = weaponMapping as Record<string, string[]>;
    return mapping[skillKey] ?? [];
  }, [skillKey]);

  useEffect(() => {
    setWeaponType(weaponOptions[0] ?? "");
  }, [weaponOptions]);

  const skillLevelMax = useMemo(() => {
    const set20 = new Set(range20 as string[]);
    const set30 = new Set(range30 as string[]);
    if (set20.has(skillName)) return 20;
    if (set30.has(skillName)) return 30;
    return 30;
  }, [skillName]);

  const skillBase = useMemo(() => {
    const bySkill = damageMapping as Record<string, Record<string, number | { damage?: number; count?: number; mastery?: number; rate?: number; critDMG?: number; critRate?: number }>>;
    const bySkillActive = damageMappingActive as Record<string, Record<string, number | { damage?: number; maxCount?: number }>>;
    const bySkillActive2 = damageMappingActive2 as Record<string, Record<string, number>>;
    const byCrit = criticalThrowMapping as Record<string, Record<string, { damage?: number; rate?: number }>>;
    const bySharp = sharpEyesMapping as Record<string, Record<string, { damage?: number; rate?: number }>>;
    const byVenom = venomSkill as Record<string, Record<string, { damage?: number; time?: number; prop?: number }>>;

    const levelKey = String(Math.min(Math.max(skillLevel, 0), skillLevelMax));
    const entry =
      bySkill[skillName]?.[levelKey] ??
      bySkillActive[skillName]?.[levelKey] ??
      bySkillActive2[skillName]?.[levelKey] ??
      byCrit[skillName]?.[levelKey] ??
      bySharp[skillName]?.[levelKey] ??
      byVenom[skillName]?.[levelKey];

    if (!entry) return null;
    if (typeof entry === "number") {
      return { damage: entry, count: 1, mastery: undefined };
    }
    return {
      damage: entry.damage ?? 100,
      count: entry.count ?? 1,
      mastery: entry.mastery,
    };
  }, [skillName, skillLevel, skillLevelMax]);

  const skillEffects = useMemo(() => {
    const levelKey = String(Math.min(Math.max(skillLevel, 0), skillLevelMax));
    const bySkillActive = damageMappingActive as Record<string, Record<string, number | { damage?: number; maxCount?: number }>>;
    const bySkillActive2 = damageMappingActive2 as Record<string, Record<string, number>>;
    const byCrit = criticalThrowMapping as Record<string, Record<string, { damage?: number; rate?: number }>>;
    const byVenom = venomSkill as Record<string, Record<string, { damage?: number; time?: number; prop?: number }>>;

    const activeEntry = bySkillActive[skillName]?.[levelKey];
    const activeEntry2 = bySkillActive2[skillName]?.[levelKey];
    const critEntry = byCrit[skillName]?.[levelKey];
    const venomEntry = byVenom[skillName]?.[levelKey];

    const buffPercent = typeof activeEntry === "number"
      ? activeEntry
      : activeEntry?.damage;
    const buffPercent2 = typeof activeEntry2 === "number" ? activeEntry2 : undefined;

    const critDamage = critEntry?.damage;
    const critRateRaw = critEntry?.rate;

    const critRate = typeof critRateRaw === "number"
      ? (critRateRaw <= 1 ? critRateRaw : critRateRaw / 100)
      : 0;
    const critMultiplier = typeof critDamage === "number" ? critDamage / 100 : 1;
    const expectedCritMultiplier = 1 + critRate * (critMultiplier - 1);

    return {
      buffMultiplier: (buffPercent ? buffPercent / 100 : 1) * (buffPercent2 ? buffPercent2 / 100 : 1),
      expectedCritMultiplier,
      venom: venomEntry ?? null,
    };
  }, [skillName, skillLevel, skillLevelMax]);

  const sharpEyesEffect = useMemo(() => {
    const bySharp = sharpEyesMapping as Record<string, Record<string, { damage?: number; rate?: number }>>;
    const levelKey = String(Math.min(Math.max(sharpEyesLevel, 0), 30));
    const sharpEntry = bySharp["샤프 아이즈"]?.[levelKey];
    if (!sharpEntry) return { multiplier: 1, rate: 0, damage: 0 };
    const rate = typeof sharpEntry.rate === "number" ? sharpEntry.rate / 100 : 0;
    const damage = typeof sharpEntry.damage === "number" ? sharpEntry.damage / 100 : 1;
    return { multiplier: 1 + rate * (damage - 1), rate, damage };
  }, [sharpEyesLevel]);

  useEffect(() => {
    if (!skillBase) return;
    setDamageMultiplier(skillBase.damage / 100);
    setHitsPerAttack(skillBase.count ?? 1);
    if (typeof skillBase.mastery === "number") {
      setMastery(skillBase.mastery);
    }
  }, [skillBase]);

  useEffect(() => {
    if (skillLevel > skillLevelMax) {
      setSkillLevel(skillLevelMax);
    }
  }, [skillLevel, skillLevelMax]);

  useEffect(() => {
    setStatMultiplier(jobProfile.multiplier);
    setMastery(jobProfile.mastery);
  }, [jobProfile]);

  const derived = useMemo(() => {
    const main = stats.str + equipmentTotals.str;
    const dex = stats.dex + equipmentTotals.dex;
    const intel = stats.int + equipmentTotals.int;
    const luk = stats.luk + equipmentTotals.luk;
    const heroLevels = mapleHero.levels as Array<{ level: number; value: number }>;
    const heroValue = heroLevels.find((item) => item.level === mapleHeroLevel)?.value ?? 1;
    const attack = Math.floor(main * 2 + dex * 0.5 + equipmentTotals.atk);
    const magic = Math.floor(intel * 2 + luk * 0.5 + equipmentTotals.atk);
    const acc = Math.floor(dex * 0.8 + level * 0.5 + equipmentTotals.acc);
    const primaryBase = jobProfile.primary === "str" ? main : jobProfile.primary === "dex" ? dex : jobProfile.primary === "int" ? intel : luk;
    const secondaryBase = jobProfile.secondary === "str" ? main : jobProfile.secondary === "dex" ? dex : luk;
    const primaryStat = primaryBase * heroValue;
    const secondaryStat = secondaryBase * heroValue;
    return { attack, magic, acc, primaryStat, secondaryStat };
  }, [stats, equipmentTotals, level, jobProfile, mapleHeroLevel]);

  const meditationBonus = useMemo(() => {
    const levels = meditation.levels as Array<{ level: number; value: number }>;
    return levels.find((item) => item.level === meditationLevel)?.value ?? 0;
  }, [meditationLevel]);

  const baseDamage = useMemo(() => {
    return calcBaseDamageFromStats({
      primaryStat: derived.primaryStat,
      secondaryStat: derived.secondaryStat,
      weaponAttack: equipmentTotals.atk + (jobProfile.primary === "int" ? meditationBonus : 0),
      statMultiplier,
      skillMultiplier: damageMultiplier,
      mastery,
    });
  }, [
    derived.primaryStat,
    derived.secondaryStat,
    equipmentTotals.atk,
    jobProfile.primary,
    meditationBonus,
    statMultiplier,
    damageMultiplier,
    mastery,
  ]);

  const effectiveAccuracy = applyAccuracy ? clampNumber(accuracyPercent, 0, 100) / 100 : 1;
  const result = calcOneHit({
    monsterHp: selectedMonster?.hp ?? 1,
    avgDamage: useManualDamage ? avgDamage : undefined,
    minDamage: useManualDamage ? minDamage : undefined,
    maxDamage: useManualDamage ? maxDamage : undefined,
    statDamage: useManualDamage
      ? undefined
      : {
          primaryStat: derived.primaryStat,
          secondaryStat: derived.secondaryStat,
          weaponAttack: equipmentTotals.atk + (jobProfile.primary === "int" ? meditationBonus : 0),
          statMultiplier,
          skillMultiplier: damageMultiplier,
          mastery,
        },
    finalDamageMultiplier:
      finalDamageMultiplier *
      skillEffects.buffMultiplier *
      skillEffects.expectedCritMultiplier *
      sharpEyesEffect.multiplier,
    hitsPerSkill: Math.max(1, hitsPerAttack),
    accuracyRate: effectiveAccuracy,
  });

  return (
    <section className="space-y-6 text-[color:var(--retro-text)]">
      <div className="border border-[var(--retro-border-strong)] bg-[var(--retro-bg)] px-4 py-6 shadow-[0_2px_0_rgba(15,23,42,0.08)] md:px-6">
        <header className="space-y-2 border border-[var(--retro-border)] bg-[var(--retro-header-blue)] px-3 py-2">
          <h1 className="text-xl font-semibold">N방컷 계산기</h1>
          <p className="text-xs text-[color:var(--retro-text-muted)]">
            메이플랜드 캐릭터 스탯 창 느낌으로 입력하고, 몬스터 N방컷을 계산합니다.
          </p>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Panel title="캐릭터 정보" tone="blue">
              <div className="space-y-3 text-xs">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                    닉네임
                  </span>
                  <input
                    className="w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="선택"
                  />
                </label>
                <SelectField
                  id="job-group"
                  label="직업군"
                  value={jobGroup}
                  onChange={(value) => setJobGroup(value as (typeof jobGroups)[number])}
                  options={jobGroups.map((item) => ({ label: item, value: item }))}
                />
                <SelectField
                  id="job"
                  label="직업"
                  value={job}
                  onChange={setJob}
                  options={jobOptionsByGroup[jobGroup].map((item) => ({ label: item, value: item }))}
                />
                <SelectField
                  id="weapon-type"
                  label="무기"
                  value={weaponType}
                  onChange={setWeaponType}
                  options={weaponOptions.map((item) => ({ label: item, value: item }))}
                />
                <NumberField id="char-level" label="레벨" value={level} min={1} onChange={setLevel} />
                <NumberField
                  id="stat-multiplier"
                  label="직업 계수"
                  value={statMultiplier}
                  min={0.1}
                  step={0.1}
                  onChange={setStatMultiplier}
                  helper="직업/무기 계수"
                />
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
                  { label: "주스탯", value: derived.primaryStat },
                  { label: "부스탯", value: derived.secondaryStat },
                ]}
              />
            </div>
          </Panel>

          <Panel title="장비 정보" tone="yellow">
            <EquipmentTable slots={equipment} onChange={setEquipment} />
          </Panel>
        </div>

        <div className="space-y-6">
          <SkillPanel
            skillName={skillName}
            onSkillChange={setSkillName}
            skillLevel={skillLevel}
            onSkillLevelChange={setSkillLevel}
            skillLevelMax={skillLevelMax}
            onSkillLevelMax={() => setSkillLevel(skillLevelMax)}
            hitsPerAttack={hitsPerAttack}
            onHitsChange={setHitsPerAttack}
            damageMultiplier={damageMultiplier}
            onMultiplierChange={setDamageMultiplier}
            skillOptions={skillOptions}
          />

          <Panel title="버프 옵션" tone="yellow">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                  샤프 아이즈
                </span>
                <div className="flex items-center gap-2">
                  <input
                    id="sharp-eyes"
                    className="w-14 rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                    type="number"
                    min={0}
                    max={30}
                    step={1}
                    value={Number.isFinite(sharpEyesLevel) ? sharpEyesLevel : 0}
                    onChange={(event) => setSharpEyesLevel(Number(event.target.value) || 0)}
                  />
                  <button
                    type="button"
                    className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                    onClick={() => setSharpEyesLevel(30)}
                  >
                    M
                  </button>
                  <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                  메이플 용사
                </span>
                <div className="flex items-center gap-2">
                  <input
                    id="maple-hero"
                    className="w-14 rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                    type="number"
                    min={0}
                    max={30}
                    step={1}
                    value={Number.isFinite(mapleHeroLevel) ? mapleHeroLevel : 0}
                    onChange={(event) => setMapleHeroLevel(Number(event.target.value) || 0)}
                  />
                  <button
                    type="button"
                    className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                    onClick={() => setMapleHeroLevel(30)}
                  >
                    M
                  </button>
                  <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                  메디테이션
                </span>
                <div className="flex items-center gap-2">
                  <input
                    id="meditation"
                    className="w-14 rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                    type="number"
                    min={0}
                    max={20}
                    step={1}
                    value={Number.isFinite(meditationLevel) ? meditationLevel : 0}
                    onChange={(event) => setMeditationLevel(Number(event.target.value) || 0)}
                  />
                  <button
                    type="button"
                    className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                    onClick={() => setMeditationLevel(20)}
                  >
                    M
                  </button>
                  <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 20</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="숙련도" tone="blue">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <NumberField
                id="mastery"
                label="숙련도(0~1)"
                value={mastery}
                min={0}
                max={1}
                step={0.05}
                onChange={setMastery}
              />
              <NumberField
                id="weapon-attack"
                label="무기 공격력"
                value={equipmentTotals.atk}
                min={0}
                onChange={(value) =>
                  setEquipment((prev) =>
                    prev.map((slot) => (slot.id === "weapon" ? { ...slot, atk: value } : slot)),
                  )
                }
                helper="장비 합계와 연동"
              />
            </div>
          </Panel>

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
            useManualDamage={useManualDamage}
            onToggleManualDamage={() => setUseManualDamage((prev) => !prev)}
            baseDamage={{
              min: baseDamage.minDamage,
              avg: baseDamage.avgDamage,
              max: baseDamage.maxDamage,
            }}
            finalDamageMultiplier={finalDamageMultiplier}
            onFinalDamageMultiplierChange={setFinalDamageMultiplier}
            result={result}
            showFormula={showFormula}
            onToggleFormula={() => setShowFormula((prev) => !prev)}
          />
        </div>
        </div>
      </div>
    </section>
  );
}
