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
import { SpinnerInput } from "@/components/SpinnerInput";
import { getMonsters } from "@/lib/data/monsters";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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
const SPEARMAN_SKILLS = [
  "파워 스트라이크",
  "슬래시 블래스트",
  "스피어 버스터",
  "폴암 버스터",
  "드래곤 로어",
  "새크리파이스",
  "드래곤 쓰레셔 창",
  "드래곤 쓰레셔 폴암",
] as const;
const PAGE_CHARGE_SKILLS = ["플레임 차지", "블리자드 차지", "썬더 차지", "홀리 차지"] as const;
const levelToMultiplier = (level: number) => 1 + Math.max(0, level) / 100;
const PROFILE_STORAGE_KEY = "onehit-calculator-profile-v1";

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
  const [characterAccuracy, setCharacterAccuracy] = useState(0);
  const [totalAttackInput, setTotalAttackInput] = useState(0);
  const [totalMagicInput, setTotalMagicInput] = useState(0);
  const [profileMessage, setProfileMessage] = useState("");
  const [stats, setStats] = useState({ str: 200, dex: 80, int: 4, luk: 30 });
  const [equipment, setEquipment] = useState<EquipmentSlot[]>(equipmentTemplate);

  const [skillName, setSkillName] = useState("기본 공격");
  const [skillLevel, setSkillLevel] = useState(1);
  const [mastery, setMastery] = useState(0.6);
  const [finalDamageMultiplier, setFinalDamageMultiplier] = useState(1.0);
  const [useManualDamage, setUseManualDamage] = useState(false);
  const [weaponType, setWeaponType] = useState("");
  const [sharpEyesLevel, setSharpEyesLevel] = useState(0);
  const [criticalThrowLevel, setCriticalThrowLevel] = useState(0);
  const [criticalShotLevel, setCriticalShotLevel] = useState(0);
  const [shadowPartnerLevel, setShadowPartnerLevel] = useState(0);
  const [passiveMasteryBonus, setPassiveMasteryBonus] = useState(0);
  const [pageChargeSkill, setPageChargeSkill] = useState<(typeof PAGE_CHARGE_SKILLS)[number]>("플레임 차지");
  const [pageChargeLevel, setPageChargeLevel] = useState(0);
  const [berserkLevel, setBerserkLevel] = useState(0);
  const [beholderBerserkBonus, setBeholderBerserkBonus] = useState(0);
  const [beholderBuffBonus, setBeholderBuffBonus] = useState(0);
  const [rushBonus, setRushBonus] = useState(0);
  const [rageBonus, setRageBonus] = useState(0);
  const [comboAttackLevel, setComboAttackLevel] = useState(0);
  const [amplificationLevel, setAmplificationLevel] = useState(0);
  const [ifritBonus, setIfritBonus] = useState(0);
  const [bahamutBonus, setBahamutBonus] = useState(0);
  const [focusBonus, setFocusBonus] = useState(0);
  const [silverHawkBonus, setSilverHawkBonus] = useState(0);
  const [goldenEagleBonus, setGoldenEagleBonus] = useState(0);
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

  const profileSnapshot = useMemo(() => ({
    nickname,
    jobGroup,
    job,
    level,
    characterAccuracy,
    totalAttackInput,
    totalMagicInput,
    stats,
    equipment,
    weaponType,
    monsterName,
  }), [
    nickname,
    jobGroup,
    job,
    level,
    characterAccuracy,
    totalAttackInput,
    totalMagicInput,
    stats,
    equipment,
    weaponType,
    monsterName,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      if (saved.nickname) setNickname(saved.nickname);
      if (saved.jobGroup) setJobGroup(saved.jobGroup);
      if (saved.job) setJob(saved.job);
      if (typeof saved.level === "number") setLevel(saved.level);
      if (typeof saved.characterAccuracy === "number") setCharacterAccuracy(saved.characterAccuracy);
      if (typeof saved.totalAttackInput === "number") setTotalAttackInput(saved.totalAttackInput);
      if (typeof saved.totalMagicInput === "number") setTotalMagicInput(saved.totalMagicInput);
      if (saved.stats) setStats(saved.stats);
      if (Array.isArray(saved.equipment)) setEquipment(saved.equipment);
      if (typeof saved.weaponType === "string") setWeaponType(saved.weaponType);
      if (typeof saved.monsterName === "string") setMonsterName(saved.monsterName);
    } catch {
      // Ignore invalid local profile data
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileSnapshot));
  }, [profileSnapshot]);

  async function saveProfileForLoginUser() {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfileMessage("브라우저 자동저장은 완료되었습니다. 로그인 저장은 /login 후 가능합니다.");
        return;
      }

      window.localStorage.setItem(`${PROFILE_STORAGE_KEY}:${user.id}`, JSON.stringify(profileSnapshot));

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        nickname: nickname || null,
        job: job || null,
        level,
        server: "calculator",
      });

      if (error) {
        setProfileMessage("로그인 저장 중 오류가 발생했습니다.");
        return;
      }

      setProfileMessage("로그인 계정 기준으로 프로필을 저장했습니다.");
    } catch {
      setProfileMessage("저장 중 오류가 발생했습니다.");
    }
  }

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
    if (
      job.includes("스피어맨") ||
      job.includes("드래곤나이트") ||
      job.includes("용기사") ||
      job.includes("다크나이트")
    ) {
      return "스피어맨/드래곤나이트/다크나이트";
    }
    if (job.includes("썬/콜")) return "썬콜";
    if (job.includes("불/독")) return "불독";
    return job;
  }, [job]);

  const isArcherJob = jobGroup === "궁수";
  const isBowmasterJob = job === "헌터/레인저/보우마스터";
  const isMarksmanJob = job === "사수/저격수/신궁";
  const isNightLordJob = job === "어쌔신/허밋/나이트로드";
  const isShadowerJob = job === "시프/시프마스터/섀도어";
  const isSunColJob = job === "위자드/메이지/아크메이지(썬/콜)";
  const isFirePoisonJob = job === "위자드/메이지/아크메이지(불/독)";
  const isClericJob = job === "클레릭/프리스트/비숍";
  const isArchMageJob = isSunColJob || isFirePoisonJob;
  const isHeroJob = job === "파이터/크루세이더/히어로";
  const isPagePaladinJob = job === "페이지/나이트/팔라딘";
  const isSpearmanJob = job === "스피어맨/드래곤나이트/다크나이트";
  const statLabelMap = { str: "STR", dex: "DEX", int: "INT", luk: "LUK" } as const;

  const skillOptions = useMemo(() => {
    if (
      job.includes("스피어맨") ||
      job.includes("드래곤나이트") ||
      job.includes("용기사") ||
      job.includes("다크나이트")
    ) {
      return [...SPEARMAN_SKILLS];
    }

    const mapping = mainSkillMapping as Record<string, string[]>;
    if (mapping[skillKey]) return mapping[skillKey];

    const aliasKey = skillKey
      .replace("드래곤나이트", "용기사")
      .replace("썬/콜", "썬콜")
      .replace("불/독", "불독");
    if (mapping[aliasKey]) return mapping[aliasKey];

    return ["기본 공격"];
  }, [skillKey, job]);

  useEffect(() => {
    setSkillName(skillOptions[0] ?? "기본 공격");
  }, [skillOptions]);

  useEffect(() => {
    console.log(
      "job:",
      job,
      "skillKey:",
      skillKey,
      "skillCount:",
      skillOptions.length,
      "skills:",
      skillOptions.join(", "),
    );
  }, [job, skillKey, skillOptions]);

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
    const byVenom = venomSkill as Record<string, Record<string, { damage?: number; time?: number; prop?: number }>>;

    const activeEntry = bySkillActive[skillName]?.[levelKey];
    const activeEntry2 = bySkillActive2[skillName]?.[levelKey];
    const venomEntry = byVenom[skillName]?.[levelKey];

    const buffPercent = typeof activeEntry === "number"
      ? activeEntry
      : activeEntry?.damage;
    const buffPercent2 = typeof activeEntry2 === "number" ? activeEntry2 : undefined;

    return {
      buffMultiplier: (buffPercent ? buffPercent / 100 : 1) * (buffPercent2 ? buffPercent2 / 100 : 1),
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

  const criticalPassiveEffect = useMemo(() => {
    const byCrit = criticalThrowMapping as Record<string, Record<string, { damage?: number; rate?: number }>>;
    const skill = isNightLordJob ? "크리티컬 스로우" : isArcherJob ? "크리티컬 샷" : null;
    const level = isNightLordJob ? criticalThrowLevel : isArcherJob ? criticalShotLevel : 0;
    if (!skill) return { multiplier: 1, rate: 0, damage: 0 };

    const levelKey = String(Math.min(Math.max(level, 0), 30));
    const entry = byCrit[skill]?.[levelKey];
    if (!entry) return { multiplier: 1, rate: 0, damage: 0 };

    const rateRaw = entry.rate ?? 0;
    const rate = rateRaw <= 1 ? rateRaw : rateRaw / 100;
    const damage = (entry.damage ?? 100) / 100;
    return { multiplier: 1 + rate * (damage - 1), rate, damage };
  }, [isArcherJob, isNightLordJob, criticalShotLevel, criticalThrowLevel]);

  const shadowPartnerEffect = useMemo(() => {
    const bySkillActive = damageMappingActive as Record<string, Record<string, number | { damage?: number; maxCount?: number }>>;
    if (!isNightLordJob) return { multiplier: 1 };
    const levelKey = String(Math.min(Math.max(shadowPartnerLevel, 0), 30));
    const entry = bySkillActive["쉐도우 파트너"]?.[levelKey];
    const damage = typeof entry === "number" ? entry : entry?.damage;
    return { multiplier: damage ? damage / 100 : 1 };
  }, [isNightLordJob, shadowPartnerLevel]);

  const pageChargeEffect = useMemo(() => {
    const bySkillActive = damageMappingActive as Record<string, Record<string, number | { damage?: number; maxCount?: number }>>;
    if (!isPagePaladinJob) return { multiplier: 1 };
    const levelKey = String(Math.min(Math.max(pageChargeLevel, 0), 30));
    const entry = bySkillActive[pageChargeSkill]?.[levelKey];
    const damage = typeof entry === "number" ? entry : entry?.damage;
    return { multiplier: damage ? damage / 100 : 1 };
  }, [isPagePaladinJob, pageChargeLevel, pageChargeSkill]);

  const berserkEffect = useMemo(() => {
    const bySkillActive = damageMappingActive as Record<string, Record<string, number | { damage?: number; maxCount?: number }>>;
    if (!isSpearmanJob) return { multiplier: 1 };
    const levelKey = String(Math.min(Math.max(berserkLevel, 0), 30));
    const entry = bySkillActive["버서크"]?.[levelKey];
    const damage = typeof entry === "number" ? entry : entry?.damage;
    return { multiplier: damage ? damage / 100 : 1 };
  }, [isSpearmanJob, berserkLevel]);

  const heroComboEffect = useMemo(() => {
    const bySkillActive = damageMappingActive as Record<string, Record<string, number | { damage?: number; maxCount?: number }>>;
    if (!isHeroJob) return { multiplier: 1 };
    const levelKey = String(Math.min(Math.max(comboAttackLevel, 0), 30));
    const entry = bySkillActive["콤보 어택"]?.[levelKey];
    const damage = typeof entry === "number" ? entry : entry?.damage;
    return { multiplier: damage ? damage / 100 : 1 };
  }, [isHeroJob, comboAttackLevel]);

  const amplificationEffect = useMemo(() => {
    const bySkillActive = damageMappingActive as Record<string, Record<string, number | { damage?: number; maxCount?: number }>>;
    if (!isArchMageJob) return { multiplier: 1 };
    const levelKey = String(Math.min(Math.max(amplificationLevel, 0), 30));
    const entry = bySkillActive["엠플리피케이션"]?.[levelKey];
    const damage = typeof entry === "number" ? entry : entry?.damage;
    return { multiplier: damage ? damage / 100 : 1 };
  }, [isArchMageJob, amplificationLevel]);

  const damageMultiplier = skillBase ? skillBase.damage / 100 : 1.0;
  const hitsPerAttack = skillBase?.count ?? 1;

  useEffect(() => {
    if (!skillBase) return;
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
    const thiefExtraSecondary = isNightLordJob || isShadowerJob ? main : 0;
    const primaryStat = primaryBase * heroValue;
    const secondaryStat = (secondaryBase + thiefExtraSecondary) * heroValue;
    return { attack, magic, acc, primaryStat, secondaryStat };
  }, [stats, equipmentTotals, level, jobProfile, mapleHeroLevel, isNightLordJob, isShadowerJob]);

  const visibleStatFields = useMemo(() => {
    const primary = jobProfile.primary;
    const secondary = jobProfile.secondary;
    return [primary, secondary] as Array<"str" | "dex" | "int" | "luk">;
  }, [jobProfile]);

  const effectiveCharacterAccuracy = characterAccuracy > 0 ? characterAccuracy : derived.acc;

  const powerScale = useMemo(() => {
    if (jobProfile.primary === "int") {
      if (totalMagicInput > 0 && derived.magic > 0) return totalMagicInput / derived.magic;
      return 1;
    }
    if (totalAttackInput > 0 && derived.attack > 0) return totalAttackInput / derived.attack;
    return 1;
  }, [jobProfile.primary, totalAttackInput, totalMagicInput, derived.attack, derived.magic]);

  const meditationBonus = useMemo(() => {
    const levels = meditation.levels as Array<{ level: number; value: number }>;
    return levels.find((item) => item.level === meditationLevel)?.value ?? 0;
  }, [meditationLevel]);

  const baseDamage = useMemo(() => {
    return calcBaseDamageFromStats({
      primaryStat: derived.primaryStat,
      secondaryStat: derived.secondaryStat,
      weaponAttack: equipmentTotals.atk + (jobProfile.primary === "int" ? meditationBonus : 0),
      statMultiplier: jobProfile.multiplier,
      skillMultiplier: damageMultiplier,
      mastery: Math.min(1, mastery + passiveMasteryBonus / 100),
    });
  }, [
    derived.primaryStat,
    derived.secondaryStat,
    equipmentTotals.atk,
    jobProfile.primary,
    meditationBonus,
    jobProfile.multiplier,
    damageMultiplier,
    mastery,
    passiveMasteryBonus,
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
          statMultiplier: jobProfile.multiplier,
          skillMultiplier: damageMultiplier,
          mastery: Math.min(1, mastery + passiveMasteryBonus / 100),
        },
    finalDamageMultiplier:
      finalDamageMultiplier *
      powerScale *
      skillEffects.buffMultiplier *
      sharpEyesEffect.multiplier *
      criticalPassiveEffect.multiplier *
      shadowPartnerEffect.multiplier *
      pageChargeEffect.multiplier *
      berserkEffect.multiplier *
      levelToMultiplier(beholderBerserkBonus) *
      levelToMultiplier(beholderBuffBonus) *
      (isHeroJob ? levelToMultiplier(rushBonus) : 1) *
      (isHeroJob ? levelToMultiplier(rageBonus) : 1) *
      heroComboEffect.multiplier *
      amplificationEffect.multiplier *
      (isArchMageJob ? levelToMultiplier(ifritBonus) : 1) *
      (isClericJob ? levelToMultiplier(bahamutBonus) : 1) *
      (isBowmasterJob ? levelToMultiplier(focusBonus) : 1) *
      (isBowmasterJob ? levelToMultiplier(silverHawkBonus) : 1) *
      (isMarksmanJob ? levelToMultiplier(goldenEagleBonus) : 1),
    hitsPerSkill: Math.max(1, hitsPerAttack),
    accuracyRate: effectiveAccuracy,
  });

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">N방컷 계산기</h1>
          <p className="text-sm text-slate-300">
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
                  id="char-acc"
                  label="명중치"
                  value={characterAccuracy}
                  min={0}
                  onChange={setCharacterAccuracy}
                  helper="0이면 자동 계산값 사용"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {visibleStatFields.map((field, index) => (
                  <NumberField
                    key={field}
                    id={field}
                    label={`${index === 0 ? "주스탯" : "부스탯"} (${statLabelMap[field]})`}
                    value={stats[field]}
                    min={0}
                    onChange={(value) => setStats({ ...stats, [field]: value })}
                  />
                ))}
              </div>

              <div className={`grid gap-3 ${isNightLordJob || isShadowerJob ? "grid-cols-2" : "grid-cols-1"}`}>
                {jobProfile.primary === "int" ? (
                  <NumberField
                    id="total-magic"
                    label="총 마력"
                    value={totalMagicInput}
                    min={0}
                    onChange={setTotalMagicInput}
                    helper="입력 시 계산에 반영"
                  />
                ) : (
                  <NumberField
                    id="total-attack"
                    label="총 공격력"
                    value={totalAttackInput}
                    min={0}
                    onChange={setTotalAttackInput}
                    helper="입력 시 계산에 반영"
                  />
                )}
                {isNightLordJob || isShadowerJob ? (
                  <NumberField
                    id="thief-str"
                    label="보조 부스탯 (STR)"
                    value={stats.str}
                    min={0}
                    onChange={(value) => setStats({ ...stats, str: value })}
                    helper="도적 계산에서 DEX와 함께 부스탯에 합산"
                  />
                ) : null}
              </div>

              <StatTable
                rows={[
                  jobProfile.primary === "int"
                    ? { label: "마력(임시)", value: totalMagicInput > 0 ? totalMagicInput : derived.magic, highlight: true }
                    : { label: "공격력(임시)", value: totalAttackInput > 0 ? totalAttackInput : derived.attack, highlight: true },
                  { label: "명중치", value: effectiveCharacterAccuracy },
                  { label: "주스탯", value: derived.primaryStat },
                  { label: "부스탯", value: derived.secondaryStat },
                ]}
              />
              <div className="rounded-[8px] border border-[var(--retro-border)] bg-[linear-gradient(180deg,rgba(56,189,248,0.12),rgba(56,189,248,0.03))] p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-[34px] items-center rounded-[6px] border border-cyan-300/70 bg-cyan-300/20 px-3 text-[11px] font-semibold text-cyan-100 shadow-[0_4px_12px_rgba(34,211,238,0.2)] transition duration-150 hover:-translate-y-0.5 hover:bg-cyan-300/30 active:translate-y-0"
                    onClick={saveProfileForLoginUser}
                  >
                    캐릭터 저장
                  </button>
                  <span className="text-[10px] text-[color:var(--retro-text-muted)]">브라우저 자동 저장 + 로그인 저장</span>
                </div>
                {profileMessage ? (
                  <p
                    className={`mt-2 rounded-[6px] border px-2 py-1 text-[10px] ${
                      profileMessage.includes("오류")
                        ? "border-rose-300/50 bg-rose-300/10 text-rose-200"
                        : "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
                    }`}
                  >
                    {profileMessage}
                  </p>
                ) : null}
              </div>
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
            skillOptions={skillOptions}
          />

          <Panel title="패시브/버프 스킬" tone="yellow">
            <div className="space-y-4 text-xs">
              <p className="text-[10px] text-[color:var(--retro-text-muted)]">
                패시브 스킬은 레벨을 입력하면 자동으로 퍼센트 효과로 환산됩니다.
              </p>
              <div className="space-y-2">
                <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                  직업 패시브
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {isNightLordJob ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                        크리티컬 스로우
                      </span>
                      <div className="flex items-center gap-2">
                        <SpinnerInput
                          id="critical-throw"
                          value={criticalThrowLevel}
                          onChange={setCriticalThrowLevel}
                          min={0}
                          max={30}
                          step={1}
                          className="w-24"
                          inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                        />
                        <button
                          type="button"
                          className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                          onClick={() => setCriticalThrowLevel(30)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                      </div>
                    </div>
                  ) : null}

                  {isArcherJob ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                        크리티컬 샷
                      </span>
                      <div className="flex items-center gap-2">
                        <SpinnerInput
                          id="critical-shot"
                          value={criticalShotLevel}
                          onChange={setCriticalShotLevel}
                          min={0}
                          max={30}
                          step={1}
                          className="w-24"
                          inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                        />
                        <button
                          type="button"
                          className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                          onClick={() => setCriticalShotLevel(30)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                      </div>
                    </div>
                  ) : null}

                  {isBowmasterJob ? (
                    <>
                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          집중 레벨
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="focus-bonus"
                            value={focusBonus}
                            onChange={setFocusBonus}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setFocusBonus(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          실버호크 레벨
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="silver-hawk-bonus"
                            value={silverHawkBonus}
                            onChange={setSilverHawkBonus}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setSilverHawkBonus(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {isMarksmanJob ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                        골든이글 레벨
                      </span>
                      <div className="flex items-center gap-2">
                        <SpinnerInput
                          id="golden-eagle-bonus"
                          value={goldenEagleBonus}
                          onChange={setGoldenEagleBonus}
                          min={0}
                          max={30}
                          step={1}
                          className="w-24"
                          inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                        />
                        <button
                          type="button"
                          className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                          onClick={() => setGoldenEagleBonus(30)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                      </div>
                    </div>
                  ) : null}

                  {isNightLordJob ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                        쉐도우 파트너
                      </span>
                      <div className="flex items-center gap-2">
                        <SpinnerInput
                          id="shadow-partner"
                          value={shadowPartnerLevel}
                          onChange={setShadowPartnerLevel}
                          min={0}
                          max={30}
                          step={1}
                          className="w-24"
                          inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                        />
                        <button
                          type="button"
                          className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                          onClick={() => setShadowPartnerLevel(30)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                      </div>
                    </div>
                  ) : null}

                  {isPagePaladinJob ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                        차지 스킬
                      </span>
                      <div className="space-y-2">
                        <select
                          id="page-charge-skill"
                          className="w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          value={pageChargeSkill}
                          onChange={(event) => setPageChargeSkill(event.target.value as (typeof PAGE_CHARGE_SKILLS)[number])}
                        >
                          {PAGE_CHARGE_SKILLS.map((skill) => (
                            <option key={skill} value={skill}>
                              {skill}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="page-charge-level"
                            value={pageChargeLevel}
                            onChange={setPageChargeLevel}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setPageChargeLevel(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isSpearmanJob ? (
                    <>
                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          버서크
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="berserk-level"
                            value={berserkLevel}
                            onChange={setBerserkLevel}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setBerserkLevel(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          비홀더 버서커 레벨
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="beholder-berserk"
                            value={beholderBerserkBonus}
                            onChange={setBeholderBerserkBonus}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setBeholderBerserkBonus(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          비홀더스 버프 레벨
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="beholder-buff"
                            value={beholderBuffBonus}
                            onChange={setBeholderBuffBonus}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setBeholderBuffBonus(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {isHeroJob ? (
                    <>
                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          분노 레벨
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="rage-bonus"
                            value={rageBonus}
                            onChange={setRageBonus}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setRageBonus(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          콤보 어택
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="combo-attack-level"
                            value={comboAttackLevel}
                            onChange={setComboAttackLevel}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setComboAttackLevel(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          돌진 레벨
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="rush-bonus"
                            value={rushBonus}
                            onChange={setRushBonus}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setRushBonus(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {isArchMageJob ? (
                    <>
                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          엠플리피케이션
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="amplification-level"
                            value={amplificationLevel}
                            onChange={setAmplificationLevel}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setAmplificationLevel(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                          엘퀴네스 레벨
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="ifrit-bonus"
                            value={ifritBonus}
                            onChange={setIfritBonus}
                            min={0}
                            max={30}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                            onClick={() => setIfritBonus(30)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {isClericJob ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                        바하뮤트 레벨
                      </span>
                      <div className="flex items-center gap-2">
                        <SpinnerInput
                          id="bahamut-bonus"
                          value={bahamutBonus}
                          onChange={setBahamutBonus}
                          min={0}
                          max={30}
                          step={1}
                          className="w-24"
                          inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                        />
                        <button
                          type="button"
                          className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                          onClick={() => setBahamutBonus(30)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                      {isPagePaladinJob || isSpearmanJob || isBowmasterJob || isMarksmanJob || isHeroJob
                        || isNightLordJob || isShadowerJob
                        ? "무기 마스터리 레벨"
                        : "숙련도 보정 레벨"}
                    </span>
                    <div className="flex items-center gap-2">
                      <SpinnerInput
                        id="passive-mastery"
                        value={passiveMasteryBonus}
                        onChange={setPassiveMasteryBonus}
                        min={0}
                        max={30}
                        step={1}
                        className="w-24"
                        inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                      />
                      <button
                        type="button"
                        className="h-[30px] w-8 border border-[var(--retro-border)] bg-[var(--retro-bg)] text-[10px] text-[color:var(--retro-text-muted)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)] active:translate-y-0"
                        onClick={() => setPassiveMasteryBonus(30)}
                      >
                        M
                      </button>
                      <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                  버프 스킬
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                      샤프 아이즈
                    </span>
                    <div className="flex items-center gap-2">
                      <SpinnerInput
                        id="sharp-eyes"
                        value={sharpEyesLevel}
                        onChange={setSharpEyesLevel}
                        min={0}
                        max={30}
                        step={1}
                        className="w-24"
                        inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
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
                      <SpinnerInput
                        id="maple-hero"
                        value={mapleHeroLevel}
                        onChange={setMapleHeroLevel}
                        min={0}
                        max={30}
                        step={1}
                        className="w-24"
                        inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
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
                  {isArchMageJob ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
                        메디테이션
                      </span>
                      <div className="flex items-center gap-2">
                        <SpinnerInput
                          id="meditation"
                          value={meditationLevel}
                          onChange={setMeditationLevel}
                          min={0}
                          max={20}
                          step={1}
                          className="w-24"
                          inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
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
                  ) : null}
                </div>
              </div>
            </div>
          </Panel>

          <MonsterPanel
            monsters={typedMonsters}
            value={monsterName}
            onChange={setMonsterName}
            selected={selectedMonster}
            characterLevel={level}
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
              min: baseDamage.minDamage * powerScale,
              avg: baseDamage.avgDamage * powerScale,
              max: baseDamage.maxDamage * powerScale,
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
