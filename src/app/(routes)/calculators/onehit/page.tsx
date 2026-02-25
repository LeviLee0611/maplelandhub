"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { SkillPanel } from "@/components/SkillPanel";
import { MonsterPanel } from "@/components/MonsterPanel";
import { ResultPanel } from "@/components/ResultPanel";
import { NumberField } from "@/components/NumberField";
import { SpinnerInput } from "@/components/SpinnerInput";
import { QuickSlots } from "@/components/quick-slots";
import { getMonsters } from "@/lib/data/monsters";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Monster } from "@/types/monster";
import { calcBaseDamageFromStats, calcOneHit } from "@/lib/calculators/onehit";
import mainSkillMapping from "@data/skills/mainSkillMapping.json";
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
import rage from "@data/skills/rage.json";

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
type AttackElement = "무" | "불" | "얼음" | "전기" | "독" | "성";

function readLegacyNumber(snapshot: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = snapshot[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readLegacyString(snapshot: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

function inferAttackElement(skillName: string): AttackElement {
  const normalized = String(skillName ?? "").trim();
  if (/(힐|홀리|샤이닝|엔젤|헤븐|제네시스)/.test(normalized)) return "성";
  if (/(포이즌|독)/.test(normalized)) return "독";
  if (/(썬더|라이트닝|전기)/.test(normalized)) return "전기";
  if (/(아이스|콜드|블리자드|얼음)/.test(normalized)) return "얼음";
  if (/(파이어|플레임|불|화염|메테오)/.test(normalized)) return "불";
  return "무";
}

function normalizeMonsterElements(monster: Monster | undefined) {
  return (monster?.ele ?? []).map((item) =>
    String(item).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
  );
}

function getElementMultiplier(
  element: AttackElement,
  monster: Monster | undefined,
  opts?: { isPageCharge: boolean; pageChargeSkill: string; pageChargeLevel: number; skillName?: string; skillLevel?: number },
) {
  if (!monster || element === "무") return 1;

  const props = normalizeMonsterElements(monster);
  const isImmune = props.includes(`${element} 면역`);
  if (isImmune) return 0;

  let weakMultiplier = 1.5;
  let resistMultiplier = 0.5;

  if (opts?.isPageCharge && opts.pageChargeLevel > 0) {
    const isHolyCharge = opts.pageChargeSkill === "홀리 차지";
    const level = opts.pageChargeLevel;
    weakMultiplier = (isHolyCharge ? 120 + level * 1.5 : 105 + level * 1.5) / 100;
    resistMultiplier = Math.max(0, (isHolyCharge ? 80 - level * 1.5 : 95 - level * 1.5) / 100);
  }

  if (opts?.skillName && /(파이어 샷|아이스 샷)/.test(opts.skillName) && (opts.skillLevel ?? 0) > 0) {
    const level = opts.skillLevel ?? 0;
    weakMultiplier = (110 + level * 0.5) / 100;
    resistMultiplier = Math.max(0, (90 - level * 0.5) / 100);
  }

  const isMagicComposition = opts?.skillName?.includes("매직 컴포지션");
  if (props.includes(`${element} 반감`)) {
    const base = resistMultiplier;
    return isMagicComposition ? 1 - (1 - base) / 2 : base;
  }
  if (props.includes(`${element} 약점`)) {
    const base = weakMultiplier;
    return isMagicComposition ? 1 + (base - 1) / 2 : base;
  }
  return 1;
}

function getBishopHealBonus(skillName: string, isClericJob: boolean, monster: Monster | undefined) {
  if (!isClericJob) return 1;
  const normalizedSkill = String(skillName ?? "").trim();
  if (normalizedSkill !== "힐") return 1;
  const props = normalizeMonsterElements(monster);
  // Legacy expectation: Heal against holy-weak monsters gets +150% damage.
  return props.includes("성 약점") ? 2.5 : 1;
}

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

const QUICK_SLOT_COUNT = 6;

type QuickSlotRecord<T> = {
  data: T;
} | null;

export default function OneHitCalculatorPage() {
  const [nickname, setNickname] = useState("");
  const [jobGroup, setJobGroup] = useState<(typeof jobGroups)[number]>(jobGroups[0]);
  const [job, setJob] = useState<string>(jobOptionsByGroup[jobGroup][0]);
  const [level, setLevel] = useState(70);
  const [characterAccuracy, setCharacterAccuracy] = useState(0);
  const [weaponAttackInput, setWeaponAttackInput] = useState(0);
  const [totalAttackInput, setTotalAttackInput] = useState(0);
  const [totalMagicInput, setTotalMagicInput] = useState(0);
  const [profileMessage, setProfileMessage] = useState("");
  const [stats, setStats] = useState({ str: 200, dex: 80, int: 4, luk: 30 });
  const [weaponType, setWeaponType] = useState("");
  const [weaponMotion, setWeaponMotion] = useState<"자동" | "베기" | "찌르기">("자동");
  const [arrowType, setArrowType] = useState("");
  const [starType, setStarType] = useState("");
  const [gloveAttackBonus, setGloveAttackBonus] = useState(0);
  const [stackableConsumableAttackBonus, setStackableConsumableAttackBonus] = useState(0);
  const [exclusiveConsumableAttackBonus, setExclusiveConsumableAttackBonus] = useState(0);

  const [skillName, setSkillName] = useState("기본 공격");
  const [skillLevel, setSkillLevel] = useState(1);
  const [mastery, setMastery] = useState(0.6);
  const [sharpEyesLevel, setSharpEyesLevel] = useState(0);
  const [criticalThrowLevel, setCriticalThrowLevel] = useState(0);
  const [criticalShotLevel, setCriticalShotLevel] = useState(0);
  const [shadowPartnerLevel, setShadowPartnerLevel] = useState(0);
  const [passiveMasteryBonus, setPassiveMasteryBonus] = useState(0);
  const [healTargetCount, setHealTargetCount] = useState(1);
  const [comboCounter, setComboCounter] = useState(1);
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

  const [monsterName, setMonsterName] = useState("달팽이");
  const [showFormula, setShowFormula] = useState(false);

  const getMaxButtonClass = (isMax: boolean) =>
    `h-[30px] w-8 border transition duration-150 hover:-translate-y-0.5 active:translate-y-0 ${
      isMax
        ? "border-cyan-300/80 bg-cyan-300/20 text-cyan-100 shadow-[0_4px_10px_rgba(34,211,238,0.18)]"
        : "border-[var(--retro-border)] bg-[var(--retro-bg)] text-[color:var(--retro-text-muted)] hover:border-[var(--retro-border-strong)] hover:text-[color:var(--retro-text)]"
    }`;

  const toggleMax = (value: number, max: number, setter: (next: number) => void) => {
    setter(value === max ? 0 : max);
  };

  const selectedMonster = useMemo(
    () => typedMonsters.find((monster) => monster.name === monsterName),
    [monsterName],
  );

  const profileSnapshot = useMemo(() => ({
    nickname,
    jobGroup,
    job,
    level,
    characterAccuracy,
    weaponAttackInput,
    totalAttackInput,
    totalMagicInput,
    stats,
    weaponType,
    weaponMotion,
    arrowType,
    starType,
    gloveAttackBonus,
    stackableConsumableAttackBonus,
    exclusiveConsumableAttackBonus,
    monsterName,
    healTargetCount,
    comboCounter,
  }), [
    nickname,
    jobGroup,
    job,
    level,
    characterAccuracy,
    weaponAttackInput,
    totalAttackInput,
    totalMagicInput,
    stats,
    weaponType,
    weaponMotion,
    arrowType,
    starType,
    gloveAttackBonus,
    stackableConsumableAttackBonus,
    exclusiveConsumableAttackBonus,
    monsterName,
    healTargetCount,
    comboCounter,
  ]);

  const quickSnapshot = useMemo(
    () => ({
      nickname,
      jobGroup,
      job,
      level,
      characterAccuracy,
      weaponAttackInput,
      totalAttackInput,
      totalMagicInput,
      stats,
      weaponType,
      weaponMotion,
      arrowType,
      starType,
      gloveAttackBonus,
      stackableConsumableAttackBonus,
      exclusiveConsumableAttackBonus,
      skillName,
      skillLevel,
      mastery,
      sharpEyesLevel,
      criticalThrowLevel,
      criticalShotLevel,
      shadowPartnerLevel,
      passiveMasteryBonus,
      healTargetCount,
      comboCounter,
      pageChargeSkill,
      pageChargeLevel,
      berserkLevel,
      beholderBerserkBonus,
      beholderBuffBonus,
      rushBonus,
      rageBonus,
      comboAttackLevel,
      amplificationLevel,
      ifritBonus,
      bahamutBonus,
      focusBonus,
      silverHawkBonus,
      goldenEagleBonus,
      mapleHeroLevel,
      meditationLevel,
      monsterName,
    }),
    [
      nickname,
      jobGroup,
      job,
      level,
      characterAccuracy,
      weaponAttackInput,
      totalAttackInput,
      totalMagicInput,
      stats,
      weaponType,
      weaponMotion,
      arrowType,
      starType,
      gloveAttackBonus,
      stackableConsumableAttackBonus,
      exclusiveConsumableAttackBonus,
      skillName,
      skillLevel,
      mastery,
      sharpEyesLevel,
      criticalThrowLevel,
      criticalShotLevel,
      shadowPartnerLevel,
      passiveMasteryBonus,
      healTargetCount,
      comboCounter,
      pageChargeSkill,
      pageChargeLevel,
      berserkLevel,
      beholderBerserkBonus,
      beholderBuffBonus,
      rushBonus,
      rageBonus,
      comboAttackLevel,
      amplificationLevel,
      ifritBonus,
      bahamutBonus,
      focusBonus,
      silverHawkBonus,
      goldenEagleBonus,
      mapleHeroLevel,
      meditationLevel,
      monsterName,
    ],
  );

  type QuickSnapshot = typeof quickSnapshot;
  const [presetSlots, setPresetSlots] = useState<Array<QuickSlotRecord<QuickSnapshot>> | null>(null);

  function applyQuickSnapshot(snapshot: typeof quickSnapshot) {
    if (!snapshot) return;
    if (typeof snapshot.nickname === "string") setNickname(snapshot.nickname);
    if (snapshot.jobGroup && jobGroups.includes(snapshot.jobGroup)) {
      setJobGroup(snapshot.jobGroup);
      setTimeout(() => {
        if (typeof snapshot.job === "string") setJob(snapshot.job);
      }, 0);
    }
    if (typeof snapshot.level === "number") setLevel(snapshot.level);
    if (typeof snapshot.characterAccuracy === "number") setCharacterAccuracy(snapshot.characterAccuracy);
    if (typeof snapshot.weaponType === "string") setWeaponType(snapshot.weaponType);
    if (typeof snapshot.weaponMotion === "string") {
      setWeaponMotion(snapshot.weaponMotion as "자동" | "베기" | "찌르기");
    }
    const legacyWeaponAttack = readLegacyNumber(snapshot as Record<string, unknown>, [
      "weaponAttackInput",
      "attackOptionTotal",
      "weaponAttack",
    ]);
    if (legacyWeaponAttack !== null) setWeaponAttackInput(legacyWeaponAttack);
    const legacyArrow = readLegacyString(snapshot as Record<string, unknown>, [
      "arrowType",
      "attackOption5",
    ]);
    if (legacyArrow !== null) setArrowType(legacyArrow);
    const legacyStar = readLegacyString(snapshot as Record<string, unknown>, [
      "starType",
      "attackOption7",
    ]);
    if (legacyStar !== null) setStarType(legacyStar);
    const legacyAttack = readLegacyNumber(snapshot as Record<string, unknown>, [
      "totalAttackInput",
      "totalAttack",
      "attack",
    ]);
    if (legacyAttack !== null) setTotalAttackInput(legacyAttack);
    const legacyMagic = readLegacyNumber(snapshot as Record<string, unknown>, [
      "totalMagicInput",
      "MattackOptionTotal",
      "totalMagic",
      "mattack",
      "magic",
    ]);
    if (legacyMagic !== null) setTotalMagicInput(legacyMagic);
    if (snapshot.stats) setStats(snapshot.stats);
    if (typeof snapshot.gloveAttackBonus === "number") setGloveAttackBonus(snapshot.gloveAttackBonus);
    if (typeof snapshot.stackableConsumableAttackBonus === "number") {
      setStackableConsumableAttackBonus(snapshot.stackableConsumableAttackBonus);
    }
    if (typeof snapshot.exclusiveConsumableAttackBonus === "number") {
      setExclusiveConsumableAttackBonus(snapshot.exclusiveConsumableAttackBonus);
    }
    if (typeof snapshot.skillName === "string") setSkillName(snapshot.skillName);
    if (typeof snapshot.skillLevel === "number") setSkillLevel(snapshot.skillLevel);
    if (typeof snapshot.mastery === "number") setMastery(snapshot.mastery);
    if (typeof snapshot.sharpEyesLevel === "number") setSharpEyesLevel(snapshot.sharpEyesLevel);
    if (typeof snapshot.criticalThrowLevel === "number") setCriticalThrowLevel(snapshot.criticalThrowLevel);
    if (typeof snapshot.criticalShotLevel === "number") setCriticalShotLevel(snapshot.criticalShotLevel);
    if (typeof snapshot.shadowPartnerLevel === "number") setShadowPartnerLevel(snapshot.shadowPartnerLevel);
    if (typeof snapshot.passiveMasteryBonus === "number") setPassiveMasteryBonus(snapshot.passiveMasteryBonus);
    if (typeof snapshot.healTargetCount === "number") setHealTargetCount(snapshot.healTargetCount);
    if (typeof snapshot.comboCounter === "number") setComboCounter(snapshot.comboCounter);
    if (typeof snapshot.pageChargeSkill === "string") setPageChargeSkill(snapshot.pageChargeSkill as (typeof PAGE_CHARGE_SKILLS)[number]);
    if (typeof snapshot.pageChargeLevel === "number") setPageChargeLevel(snapshot.pageChargeLevel);
    if (typeof snapshot.berserkLevel === "number") setBerserkLevel(snapshot.berserkLevel);
    if (typeof snapshot.beholderBerserkBonus === "number") setBeholderBerserkBonus(snapshot.beholderBerserkBonus);
    if (typeof snapshot.beholderBuffBonus === "number") setBeholderBuffBonus(snapshot.beholderBuffBonus);
    if (typeof snapshot.rushBonus === "number") setRushBonus(snapshot.rushBonus);
    if (typeof snapshot.rageBonus === "number") setRageBonus(snapshot.rageBonus);
    if (typeof snapshot.comboAttackLevel === "number") setComboAttackLevel(snapshot.comboAttackLevel);
    if (typeof snapshot.amplificationLevel === "number") setAmplificationLevel(snapshot.amplificationLevel);
    if (typeof snapshot.ifritBonus === "number") setIfritBonus(snapshot.ifritBonus);
    if (typeof snapshot.bahamutBonus === "number") setBahamutBonus(snapshot.bahamutBonus);
    if (typeof snapshot.focusBonus === "number") setFocusBonus(snapshot.focusBonus);
    if (typeof snapshot.silverHawkBonus === "number") setSilverHawkBonus(snapshot.silverHawkBonus);
    if (typeof snapshot.goldenEagleBonus === "number") setGoldenEagleBonus(snapshot.goldenEagleBonus);
    if (typeof snapshot.mapleHeroLevel === "number") setMapleHeroLevel(snapshot.mapleHeroLevel);
    if (typeof snapshot.meditationLevel === "number") setMeditationLevel(snapshot.meditationLevel);
    if (typeof snapshot.monsterName === "string") setMonsterName(snapshot.monsterName);
  }

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
      if (typeof saved.weaponType === "string") setWeaponType(saved.weaponType);
      if (typeof saved.weaponMotion === "string") {
        setWeaponMotion(saved.weaponMotion as "자동" | "베기" | "찌르기");
      }
      const legacyWeaponAttack = readLegacyNumber(saved as Record<string, unknown>, [
        "weaponAttackInput",
        "attackOptionTotal",
        "weaponAttack",
      ]);
      if (legacyWeaponAttack !== null) setWeaponAttackInput(legacyWeaponAttack);
      const legacyArrow = readLegacyString(saved as Record<string, unknown>, [
        "arrowType",
        "attackOption5",
      ]);
      if (legacyArrow !== null) setArrowType(legacyArrow);
      const legacyStar = readLegacyString(saved as Record<string, unknown>, [
        "starType",
        "attackOption7",
      ]);
      if (legacyStar !== null) setStarType(legacyStar);
      const legacyAttack = readLegacyNumber(saved as Record<string, unknown>, [
        "totalAttackInput",
        "totalAttack",
        "attack",
      ]);
      if (legacyAttack !== null) setTotalAttackInput(legacyAttack);
      const legacyMagic = readLegacyNumber(saved as Record<string, unknown>, [
        "totalMagicInput",
        "MattackOptionTotal",
        "totalMagic",
        "mattack",
        "magic",
      ]);
      if (legacyMagic !== null) setTotalMagicInput(legacyMagic);
      if (saved.stats) setStats(saved.stats);
      if (typeof saved.gloveAttackBonus === "number") setGloveAttackBonus(saved.gloveAttackBonus);
      if (typeof saved.stackableConsumableAttackBonus === "number") {
        setStackableConsumableAttackBonus(saved.stackableConsumableAttackBonus);
      }
      if (typeof saved.exclusiveConsumableAttackBonus === "number") {
        setExclusiveConsumableAttackBonus(saved.exclusiveConsumableAttackBonus);
      }
      if (typeof saved.consumableAttackBonus === "number") {
        setExclusiveConsumableAttackBonus(saved.consumableAttackBonus);
      }
      if (typeof saved.healTargetCount === "number") setHealTargetCount(saved.healTargetCount);
      if (typeof saved.comboCounter === "number") setComboCounter(saved.comboCounter);
      if (typeof saved.monsterName === "string") setMonsterName(saved.monsterName);
    } catch {
      // Ignore invalid local profile data
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileSnapshot));
  }, [profileSnapshot]);

  useEffect(() => {
    let active = true;

    async function loadPresetSlots() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !active) return;

        const { data, error } = await supabase
          .from("character_presets")
          .select("name,data")
          .eq("user_id", user.id)
          .eq("calculator", "onehit");

        if (error || !active) return;

        const nextSlots: Array<QuickSlotRecord<QuickSnapshot>> = Array.from(
          { length: QUICK_SLOT_COUNT },
          () => null,
        );

        let defaultPreset: QuickSnapshot | null = null;

        (data ?? []).forEach((row) => {
          if (row.name === "default") {
            defaultPreset = row.data as QuickSnapshot;
            nextSlots[0] = { data: row.data as QuickSnapshot };
            return;
          }
          const match = /^slot-(\d+)$/i.exec(row.name);
          if (!match) return;
          const index = Number.parseInt(match[1], 10) - 1;
          if (Number.isNaN(index) || index < 0 || index >= QUICK_SLOT_COUNT) return;
          nextSlots[index] = { data: row.data as QuickSnapshot };
        });

        setPresetSlots(nextSlots);
        if (defaultPreset) {
          applyQuickSnapshot(defaultPreset);
        }
      } catch {
        // Ignore preset load failures
      }
    }

    loadPresetSlots();
    return () => {
      active = false;
    };
  }, []);

  const handleQuickSlotSave = async (index: number, data: QuickSnapshot) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const presetName = index === 0 ? "default" : `slot-${index + 1}`;
      const { error } = await supabase
        .from("character_presets")
        .upsert(
          {
            user_id: user.id,
            calculator: "onehit",
            name: presetName,
            data,
          },
          { onConflict: "user_id,calculator,name" },
        );

      if (error) {
        setProfileMessage("프리셋 저장 중 오류가 발생했습니다.");
        return;
      }

      setPresetSlots((prev) => {
        const next =
          prev ??
          Array.from({ length: QUICK_SLOT_COUNT }, () => null);
        const updated = [...next];
        updated[index] = { data };
        return updated;
      });
    } catch {
      setProfileMessage("프리셋 저장 중 오류가 발생했습니다.");
    }
  };

  const handleQuickSlotDelete = async (index: number) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const presetName = index === 0 ? "default" : `slot-${index + 1}`;
      const { error } = await supabase
        .from("character_presets")
        .delete()
        .eq("user_id", user.id)
        .eq("calculator", "onehit")
        .eq("name", presetName);

      if (error) {
        setProfileMessage("프리셋 삭제 중 오류가 발생했습니다.");
        return;
      }

      setPresetSlots((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        next[index] = null;
        return next;
      });
    } catch {
      setProfileMessage("프리셋 삭제 중 오류가 발생했습니다.");
    }
  };

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

      const { error: presetError } = await supabase
        .from("character_presets")
        .upsert(
          {
            user_id: user.id,
            calculator: "onehit",
            name: "default",
            data: quickSnapshot,
          },
          { onConflict: "user_id,calculator,name" },
        );

      if (presetError) {
        setProfileMessage("프리셋 저장 중 오류가 발생했습니다.");
        return;
      }

      setPresetSlots((prev) => {
        const next =
          prev ??
          Array.from({ length: QUICK_SLOT_COUNT }, () => null);
        const updated = [...next];
        updated[0] = { data: quickSnapshot };
        return updated;
      });

      setProfileMessage("로그인 계정 기준으로 프로필과 빠른저장 Default에 저장했습니다.");
    } catch {
      setProfileMessage("저장 중 오류가 발생했습니다.");
    }
  }

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

  useEffect(() => {
    if (jobGroup === "마법사" && passiveMasteryBonus !== 0) {
      setPassiveMasteryBonus(0);
    }
  }, [jobGroup, passiveMasteryBonus]);

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
  const weaponTypesByGroup = useMemo(() => {
    if (jobGroup === "전사") {
      return [
        "한손검",
        "두손검",
        "한손도끼",
        "두손도끼",
        "한손둔기",
        "두손둔기",
        "창",
        "폴암",
      ];
    }
    if (jobGroup === "궁수") return ["활", "석궁"];
    if (jobGroup === "도적") return ["단검", "아대"];
    if (jobGroup === "해적") return ["너클", "건"];
    return [];
  }, [jobGroup]);

  useEffect(() => {
    if (job === "어쌔신/허밋/나이트로드") {
      setWeaponType("아대");
    } else if (job === "시프/시프마스터/섀도어") {
      setWeaponType("단검");
    }
  }, [job]);

  const isWeaponLocked = job === "어쌔신/허밋/나이트로드" || job === "시프/시프마스터/섀도어";

  const weaponNeedsMotion = useMemo(
    () => ["한손도끼", "두손도끼", "한손둔기", "두손둔기", "폴암", "창"].includes(weaponType),
    [weaponType],
  );

  useEffect(() => {
    if (!weaponNeedsMotion) return;
    setWeaponMotion((prev) => (prev === "자동" || prev === "베기" || prev === "찌르기" ? prev : "자동"));
  }, [weaponNeedsMotion]);

  const arrowAttackBonus = useMemo(() => {
    if (!isArcherJob) return 0;
    switch (arrowType) {
      case "일반화살":
        return 0;
      case "청동화살":
        return 1;
      case "강철화살":
        return 2;
      case "빨간화살":
      case "다이아화살":
        return 4;
      default:
        return 0;
    }
  }, [arrowType, isArcherJob]);

  const starAttackBonus = useMemo(() => {
    if (!isNightLordJob) return 0;
    switch (starType) {
      case "수비표창":
        return 15;
      case "눈덩이":
      case "월비표창":
        return 17;
      case "목비표창":
      case "나무팽이":
        return 19;
      case "금비표창":
      case "고드름":
      case "메이플표창":
        return 21;
      case "토비표창":
        return 23;
      case "뇌전수리검":
        return 25;
      case "일비표창":
      case "화비표창":
        return 27;
      case "절제된분노":
        return 29;
      default:
        return 0;
    }
  }, [starType, isNightLordJob]);

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

  const criticalRate = useMemo(() => {
    return Math.max(criticalPassiveEffect.rate, sharpEyesEffect.rate);
  }, [criticalPassiveEffect.rate, sharpEyesEffect.rate]);

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
    if (!isHeroJob || comboAttackLevel <= 0) return { multiplier: 1 };
    const levelKey = String(Math.min(Math.max(comboAttackLevel, 0), 30));
    const comboEntry = bySkillActive["콤보 어택"]?.[levelKey];
    const advEntry = bySkillActive["어드밴스드 콤보 어택"]?.[levelKey];
    const comboPercent = typeof comboEntry === "number" ? comboEntry : comboEntry?.damage ?? 0;
    const advPercent = typeof advEntry === "number" ? advEntry : advEntry?.damage ?? comboPercent;

    const counter = Math.max(1, Math.min(10, comboCounter));
    if (counter <= 5) {
      const percent = (comboPercent - 100) + (counter - 1) * (comboAttackLevel / 6);
      return { multiplier: percent > 0 ? percent / 100 : 1 };
    }

    const percent = (advPercent - 80) + (counter - 5) * 4;
    return { multiplier: percent > 0 ? percent / 100 : 1 };
  }, [isHeroJob, comboAttackLevel, comboCounter]);

  const comboFinisherMultiplier = useMemo(() => {
    if (!isHeroJob || comboCounter <= 0) return 1;
    if (!(skillName.includes("패닉") || skillName.includes("코마"))) return 1;
    const counter = Math.max(1, Math.min(10, comboCounter));
    if (counter === 1) return 1;
    if (counter === 2) return 1.2;
    if (counter === 3) return 1.54;
    if (counter === 4) return 2;
    return 2.5;
  }, [isHeroJob, comboCounter, skillName]);

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

  const criticalDamageMultiplier = (() => {
    const skillPercent = damageMultiplier * 100;
    if (skillPercent <= 0) return 1;
    const baseCritPercent = criticalPassiveEffect.damage > 0 ? criticalPassiveEffect.damage * 100 : 100;
    const sharpExtra = sharpEyesLevel > 0 ? 140 : 0;
    return (skillPercent + baseCritPercent + sharpExtra - 100) / skillPercent;
  })();

  const criticalAverageMultiplier = 1 + criticalRate * (criticalDamageMultiplier - 1);

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
    const main = stats.str;
    const dex = stats.dex;
    const intel = stats.int;
    const luk = stats.luk;
    const heroLevels = mapleHero.levels as Array<{ level: number; value: number }>;
    const heroValue = heroLevels.find((item) => item.level === mapleHeroLevel)?.value ?? 1;
    const attack = Math.floor(main * 2 + dex * 0.5);
    const magic = Math.floor(intel * 2 + luk * 0.5);
    const accuracyBase = (() => {
      if (jobGroup === "전사" || jobGroup === "마법사") return dex * 0.8 + luk * 0.5;
      if (job === "인파이터/버커니어/바이퍼") return dex * 0.9 + luk * 0.3;
      if (jobGroup === "궁수" || jobGroup === "도적" || job === "건슬링거/발키리/캡틴") {
        return dex * 0.6 + luk * 0.3;
      }
      return dex * 0.8 + luk * 0.5;
    })();
    const acc = Math.floor(accuracyBase + characterAccuracy);
    const primaryBase = jobProfile.primary === "str" ? main : jobProfile.primary === "dex" ? dex : jobProfile.primary === "int" ? intel : luk;
    const secondaryBase = jobProfile.secondary === "str" ? main : jobProfile.secondary === "dex" ? dex : luk;
    const thiefExtraSecondary = isNightLordJob || isShadowerJob ? main : 0;
    const primaryStat = primaryBase * heroValue;
    const secondaryStat = (secondaryBase + thiefExtraSecondary) * heroValue;
    return { attack, magic, acc, primaryStat, secondaryStat };
  }, [
    stats,
    level,
    jobProfile,
    mapleHeroLevel,
    isNightLordJob,
    isShadowerJob,
    jobGroup,
    job,
    characterAccuracy,
  ]);

  const visibleStatFields = useMemo(() => {
    const primary = jobProfile.primary;
    const secondary = jobProfile.secondary;
    return [primary, secondary] as Array<"str" | "dex" | "int" | "luk">;
  }, [jobProfile]);

  const meditationBonus = useMemo(() => {
    const levels = meditation.levels as Array<{ level: number; value: number }>;
    return levels.find((item) => item.level === meditationLevel)?.value ?? 0;
  }, [meditationLevel]);

  const rageAttackBonus = useMemo(() => {
    if (!isHeroJob) return 0;
    const levels = rage.levels as Array<{ level: number; value: number }>;
    return levels.find((item) => item.level === rageBonus)?.value ?? 0;
  }, [isHeroJob, rageBonus]);

  const effectiveConsumableAttackBonus = useMemo(() => {
    const exclusive = isHeroJob && rageAttackBonus > 0 ? 0 : exclusiveConsumableAttackBonus;
    return stackableConsumableAttackBonus + exclusive;
  }, [isHeroJob, rageAttackBonus, stackableConsumableAttackBonus, exclusiveConsumableAttackBonus]);

  const weaponAttack = useMemo(() => {
    if (jobProfile.primary === "int") {
      if (totalMagicInput > 0) return totalMagicInput + meditationBonus;
      return derived.magic + meditationBonus;
    }
    if (weaponAttackInput > 0) {
      return (
        weaponAttackInput +
        arrowAttackBonus +
        starAttackBonus +
        gloveAttackBonus +
        effectiveConsumableAttackBonus +
        rageAttackBonus
      );
    }
    if (totalAttackInput > 0) return totalAttackInput + rageAttackBonus;
    return derived.attack + rageAttackBonus;
  }, [
    jobProfile.primary,
    totalMagicInput,
    weaponAttackInput,
    totalAttackInput,
    derived.attack,
    derived.magic,
    meditationBonus,
    arrowAttackBonus,
    starAttackBonus,
    gloveAttackBonus,
    effectiveConsumableAttackBonus,
    rageAttackBonus,
  ]);

  const weaponConstants = useMemo(() => {
    if (jobProfile.primary === "int") {
      return { min: 1, max: 1 };
    }

    switch (weaponType) {
      case "한손도끼":
      case "한손둔기":
        return { min: 3.2, max: 4.4 };
      case "두손도끼":
      case "두손둔기":
        return { min: 3.4, max: 4.8 };
      case "폴암":
      case "창":
        return { min: 3.0, max: 5.0 };
      case "한손검":
        return { min: 4.0, max: 4.0 };
      case "두손검":
        return { min: 4.6, max: 4.6 };
      case "너클":
        return { min: 4.8, max: 4.8 };
      case "활":
        return { min: 3.4, max: 3.4 };
      case "석궁":
      case "단검":
      case "아대":
      case "건":
        return { min: 3.6, max: 3.6 };
      default:
        return { min: jobProfile.multiplier, max: jobProfile.multiplier };
    }
  }, [jobProfile.primary, jobProfile.multiplier, weaponType]);

  const weaponMotionConstants = useMemo(() => {
    if (!weaponNeedsMotion) return null;
    const isSpear = weaponType === "창";
    const isPolearm = weaponType === "폴암";
    if (isSpear) {
      return { slash: weaponConstants.min, thrust: weaponConstants.max };
    }
    if (isPolearm) {
      return { slash: weaponConstants.max, thrust: weaponConstants.min };
    }
    return { slash: weaponConstants.max, thrust: weaponConstants.min };
  }, [weaponNeedsMotion, weaponType, weaponConstants]);

  const weaponMultiplierRange = useMemo(() => {
    if (!weaponNeedsMotion || !weaponMotionConstants) return weaponConstants;
    if (weaponMotion === "베기") {
      return { min: weaponMotionConstants.slash, max: weaponMotionConstants.slash };
    }
    if (weaponMotion === "찌르기") {
      return { min: weaponMotionConstants.thrust, max: weaponMotionConstants.thrust };
    }
    return {
      min: Math.min(weaponMotionConstants.slash, weaponMotionConstants.thrust),
      max: Math.max(weaponMotionConstants.slash, weaponMotionConstants.thrust),
    };
  }, [weaponNeedsMotion, weaponConstants, weaponMotion, weaponMotionConstants]);

  const passiveMasteryRate = jobGroup === "마법사" ? 0 : passiveMasteryBonus / 100;
  const effectiveMastery = jobProfile.primary === "int"
    ? Math.min(1, mastery)
    : Math.min(1, (passiveMasteryBonus > 0 ? mastery : 0.1) + passiveMasteryRate);

  const baseDamageRange = useMemo(() => {
    return calcBaseDamageFromStats({
      primaryStat: derived.primaryStat,
      secondaryStat: derived.secondaryStat,
      weaponAttack,
      minStatMultiplier: weaponMultiplierRange.min,
      maxStatMultiplier: weaponMultiplierRange.max,
      statMultiplier: jobProfile.multiplier,
      skillMultiplier: jobProfile.primary === "int" ? damageMultiplier : 1,
      mastery: effectiveMastery,
      isMagic: jobProfile.primary === "int",
    });
  }, [
    derived.primaryStat,
    derived.secondaryStat,
    weaponAttack,
    weaponMultiplierRange.min,
    weaponMultiplierRange.max,
    jobProfile.multiplier,
    damageMultiplier,
    effectiveMastery,
    jobProfile.primary,
  ]);

  const motionWeightedAvgDamage = useMemo(() => {
    if (!weaponNeedsMotion || weaponMotion !== "자동" || !weaponMotionConstants) return null;
    const isSpearFamily = weaponType === "창" || weaponType === "폴암";
    const slashWeight = isSpearFamily ? 2 : 3;
    const thrustWeight = isSpearFamily ? 2 : 1;
    const total = slashWeight + thrustWeight;
    const weightedConstant =
      (weaponMotionConstants.slash * slashWeight + weaponMotionConstants.thrust * thrustWeight) / total;
    const masteryFactor = (0.9 * effectiveMastery + 1) / 2;
    const skillMul = jobProfile.primary === "int" ? damageMultiplier : 1;
    return ((derived.primaryStat * weightedConstant * masteryFactor + derived.secondaryStat) * weaponAttack * skillMul) / 100;
  }, [
    weaponNeedsMotion,
    weaponMotion,
    weaponMotionConstants,
    derived.primaryStat,
    derived.secondaryStat,
    weaponAttack,
    jobProfile.primary,
    damageMultiplier,
    effectiveMastery,
    weaponType,
  ]);

  const motionDamageRanges = useMemo(() => {
    if (!weaponNeedsMotion || weaponMotion !== "자동" || !weaponMotionConstants) return null;
    const baseSlash = calcBaseDamageFromStats({
      primaryStat: derived.primaryStat,
      secondaryStat: derived.secondaryStat,
      weaponAttack,
      minStatMultiplier: weaponMotionConstants.slash,
      maxStatMultiplier: weaponMotionConstants.slash,
      statMultiplier: jobProfile.multiplier,
      skillMultiplier: jobProfile.primary === "int" ? damageMultiplier : 1,
      mastery: effectiveMastery,
      isMagic: jobProfile.primary === "int",
    });
    const baseThrust = calcBaseDamageFromStats({
      primaryStat: derived.primaryStat,
      secondaryStat: derived.secondaryStat,
      weaponAttack,
      minStatMultiplier: weaponMotionConstants.thrust,
      maxStatMultiplier: weaponMotionConstants.thrust,
      statMultiplier: jobProfile.multiplier,
      skillMultiplier: jobProfile.primary === "int" ? damageMultiplier : 1,
      mastery: effectiveMastery,
      isMagic: jobProfile.primary === "int",
    });
    return { slash: baseSlash, thrust: baseThrust };
  }, [
    weaponNeedsMotion,
    weaponMotion,
    weaponMotionConstants,
    derived.primaryStat,
    derived.secondaryStat,
    weaponAttack,
    jobProfile.multiplier,
    jobProfile.primary,
    damageMultiplier,
    effectiveMastery,
  ]);

  const baseDamage = useMemo(() => {
    if (motionWeightedAvgDamage === null) return baseDamageRange;
    return { ...baseDamageRange, avgDamage: motionWeightedAvgDamage };
  }, [baseDamageRange, motionWeightedAvgDamage]);

  const attackElement = useMemo<AttackElement>(() => {
    if (isPagePaladinJob && pageChargeLevel > 0) {
      if (pageChargeSkill === "플레임 차지") return "불";
      if (pageChargeSkill === "블리자드 차지") return "얼음";
      if (pageChargeSkill === "썬더 차지") return "전기";
      if (pageChargeSkill === "홀리 차지") return "성";
    }
    return inferAttackElement(skillName);
  }, [isPagePaladinJob, pageChargeLevel, pageChargeSkill, skillName]);

  const elementMultiplier = useMemo(() => {
    return getElementMultiplier(attackElement, selectedMonster, {
      isPageCharge: isPagePaladinJob,
      pageChargeSkill,
      pageChargeLevel,
      skillName,
      skillLevel,
    });
  }, [attackElement, selectedMonster, isPagePaladinJob, pageChargeSkill, pageChargeLevel, skillName, skillLevel]);

  const bishopHealBonus = useMemo(
    () => getBishopHealBonus(skillName, isClericJob, selectedMonster),
    [skillName, isClericJob, selectedMonster],
  );

  const finalDamageMultiplier = useMemo(
    () =>
      skillEffects.buffMultiplier *
      (skillName === "힐" ? 1 : criticalAverageMultiplier) *
      shadowPartnerEffect.multiplier *
      pageChargeEffect.multiplier *
      berserkEffect.multiplier *
      levelToMultiplier(beholderBerserkBonus) *
      levelToMultiplier(beholderBuffBonus) *
      (isHeroJob ? levelToMultiplier(rushBonus) : 1) *
      heroComboEffect.multiplier *
      comboFinisherMultiplier *
      amplificationEffect.multiplier *
      (isArchMageJob ? levelToMultiplier(ifritBonus) : 1) *
      (isClericJob ? levelToMultiplier(bahamutBonus) : 1) *
      (isBowmasterJob ? levelToMultiplier(focusBonus) : 1) *
      (isBowmasterJob ? levelToMultiplier(silverHawkBonus) : 1) *
      (isMarksmanJob ? levelToMultiplier(goldenEagleBonus) : 1) *
      (skillName === "힐" ? 1 : elementMultiplier) *
      (skillName === "힐" ? 1 : bishopHealBonus),
    [
      skillEffects.buffMultiplier,
      criticalAverageMultiplier,
      shadowPartnerEffect.multiplier,
      pageChargeEffect.multiplier,
      berserkEffect.multiplier,
      beholderBerserkBonus,
      beholderBuffBonus,
      isHeroJob,
      rushBonus,
      heroComboEffect.multiplier,
      comboFinisherMultiplier,
      amplificationEffect.multiplier,
      isArchMageJob,
      ifritBonus,
      isClericJob,
      bahamutBonus,
      isBowmasterJob,
      focusBonus,
      silverHawkBonus,
      isMarksmanJob,
      goldenEagleBonus,
      elementMultiplier,
      bishopHealBonus,
      skillName,
    ],
  );

  const specialBaseDamage = useMemo(() => {
    const str = stats.str;
    const dex = stats.dex;
    const luk = stats.luk;
    const intel = stats.int;
    const atk = weaponAttack;
    const skillMul = damageMultiplier;

    if (skillName === "럭키 세븐" || skillName === "트리플 스로우") {
      return {
        min: (luk * 2.5) * atk / 100,
        max: (luk * 5) * atk / 100,
        skillMultiplier: skillMul,
        isMagic: false,
        ignoreDefense: false,
      };
    }

    if (skillName === "드래곤 로어") {
      return {
        min: ((str * 4 * 0.9 * effectiveMastery + dex) * atk) / 100,
        max: ((str * 4 + dex) * atk) / 100,
        skillMultiplier: skillMul,
        isMagic: false,
        ignoreDefense: false,
      };
    }

    if (skillName === "베놈") {
      return {
        min: ((8.0 * (str + luk) + dex * 2) / 100) * skillMul,
        max: ((18.5 * (str + luk) + dex * 2) / 100) * skillMul,
        skillMultiplier: 1,
        isMagic: false,
        ignoreDefense: true,
      };
    }

    if (skillName === "힐") {
      const healCoeffMap: Record<number, number> = {
        1: 4.0,
        2: 3.166,
        3: 2.75,
        4: 2.5,
        5: 2.333,
      };
      const coeff = healCoeffMap[healTargetCount] ?? 6.5;
      const levelMultiplier = skillLevel * 0.1;
      const baseMin = ((intel * 0.3 + luk) * (atk / 1000)) * coeff * levelMultiplier;
      const baseMax = ((intel * 1.2 + luk) * (atk / 1000)) * coeff * levelMultiplier;
      const mdef = selectedMonster?.mDef ?? 0;
      return {
        min: baseMin - mdef * 0.6,
        max: baseMax - mdef * 0.5,
        skillMultiplier: 1,
        isMagic: true,
        ignoreDefense: true,
      };
    }

    if ([
      "피닉스",
      "프리져",
      "실버 호크",
      "골든 이글",
      "옥토퍼스",
      "가비오타",
    ].includes(skillName)) {
      return {
        min: (dex * 2.5 * 0.7 + str) * skillMul,
        max: (dex * 2.5 + str) * skillMul,
        skillMultiplier: 1,
        isMagic: false,
        ignoreDefense: true,
      };
    }

    return null;
  }, [stats, weaponAttack, damageMultiplier, skillName, effectiveMastery, healTargetCount, skillLevel, selectedMonster]);

  const result = calcOneHit({
    monsterHp: selectedMonster?.hp ?? 1,
    monsterLevel: selectedMonster?.level ?? 0,
    characterLevel: level,
    monsterDef: selectedMonster?.def ?? 0,
    monsterMDef: selectedMonster?.mDef ?? 0,
    isMagic: jobProfile.primary === "int" || specialBaseDamage?.isMagic,
    statDamage: {
      primaryStat: derived.primaryStat,
      secondaryStat: derived.secondaryStat,
      weaponAttack,
      statMultiplier: jobProfile.multiplier,
      skillMultiplier: jobProfile.primary === "int" ? damageMultiplier : 1,
      mastery: effectiveMastery,
      minStatMultiplier: weaponMultiplierRange.min,
      maxStatMultiplier: weaponMultiplierRange.max,
      isMagic: jobProfile.primary === "int",
    },
    minDamage: specialBaseDamage?.min,
    maxDamage: specialBaseDamage?.max,
    avgDamage: specialBaseDamage
      ? (specialBaseDamage.min + specialBaseDamage.max) / 2
      : motionWeightedAvgDamage ?? undefined,
    finalDamageMultiplier,
    skillMultiplier: specialBaseDamage?.skillMultiplier ?? (jobProfile.primary === "int" ? 1 : damageMultiplier),
    ignoreDefense: specialBaseDamage?.ignoreDefense,
    hitsPerSkill: Math.max(1, hitsPerAttack),
    accuracyRate: 1,
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

        <div className="mt-4">
          <QuickSlots
            storageKey="mlh-quickslots-onehit-v1"
            getSnapshot={() => quickSnapshot}
            applySnapshot={applyQuickSnapshot}
            title="빠른 저장 (N방컷)"
            preview={(data) => `${data.nickname || "캐릭터"} / ${data.job} / Lv.${data.level} / ${data.monsterName || "몬스터 선택"}`}
            slotCount={QUICK_SLOT_COUNT}
            slotsOverride={presetSlots}
            onSaveSlot={handleQuickSlotSave}
            onDeleteSlot={handleQuickSlotDelete}
            slotName={(index) => (index === 0 ? "Default" : `슬롯 ${index + 1}`)}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Panel title="캐릭터 정보" tone="blue">
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="retro-section-title">기본 설정</div>
                    <div className="retro-section-hint">핵심 입력</div>
                  </div>
                  <div className="grid gap-2">
                    <label className="space-y-1">
                      <span className="retro-chip">
                        닉네임
                      </span>
                      <input
                        className="h-[30px] w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 text-xs text-[color:var(--retro-text)] transition duration-150 placeholder:text-slate-400/70 focus:border-cyan-300/60 focus:outline-none focus:ring-1 focus:ring-cyan-300/30"
                        value={nickname}
                        onChange={(event) => setNickname(event.target.value)}
                        placeholder="선택"
                      />
                    </label>
                    <div className="grid gap-2 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="retro-chip">직업군</span>
                        <select
                          id="job-group"
                          className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          value={jobGroup}
                          onChange={(event) => setJobGroup(event.target.value as (typeof jobGroups)[number])}
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
                          id="job"
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
                      {jobGroup !== "마법사" ? (
                        <label className="space-y-1">
                          <span className="retro-chip">무기 타입</span>
                          <select
                            className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                            value={weaponType}
                            onChange={(event) => setWeaponType(event.target.value)}
                            disabled={isWeaponLocked}
                          >
                            <option value="">무기 선택</option>
                            {weaponTypesByGroup.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      {jobGroup !== "마법사" && weaponNeedsMotion ? (
                        <label className="space-y-1">
                          <span className="retro-chip">공격 모션</span>
                          <select
                            className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                            value={weaponMotion}
                            onChange={(event) => setWeaponMotion(event.target.value as "자동" | "베기" | "찌르기")}
                          >
                            <option value="자동">자동(확률)</option>
                            <option value="베기">베기</option>
                            <option value="찌르기">찌르기</option>
                          </select>
                        </label>
                      ) : null}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <NumberField
                          id="char-level"
                          label="레벨"
                          value={level}
                          min={1}
                          onChange={setLevel}
                        />
                      </div>
                      <div>
                        <NumberField
                          id="char-acc"
                          label="명중치"
                          value={characterAccuracy}
                          min={0}
                          onChange={setCharacterAccuracy}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="retro-subsection space-y-2">
                  <div className="retro-section-title">스탯 입력</div>
                  <div className="grid grid-cols-2 gap-2">
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
                    {jobProfile.primary === "int" ? (
                      <NumberField
                        id="total-magic"
                        label="마력"
                        value={totalMagicInput}
                        min={0}
                        onChange={setTotalMagicInput}
                        helper="총 마력 입력 시 계산에 반영"
                      />
                    ) : (
                      <>
                        <div className="col-span-full grid gap-2 md:grid-cols-2">
                          <NumberField
                            id="weapon-attack"
                            label="무기 공격력"
                            value={weaponAttackInput}
                            min={0}
                            onChange={setWeaponAttackInput}
                            helper="무기 공격력 입력 시 우선 적용"
                          />
                          <NumberField
                            id="glove-attack"
                            label="장갑 공격력"
                            value={gloveAttackBonus}
                            min={0}
                            onChange={setGloveAttackBonus}
                            helper="무기 공격력 입력 시에만 추가 반영"
                          />
                        </div>
                        <div className="col-span-full grid gap-2 md:grid-cols-2">
                          <NumberField
                            id="consumable-attack-stackable"
                            label="도핑(중복 가능)"
                            value={stackableConsumableAttackBonus}
                            min={0}
                            onChange={setStackableConsumableAttackBonus}
                            helper="중복 가능한 물약 합산"
                          />
                          <NumberField
                            id="consumable-attack-exclusive"
                            label="도핑(중복 불가)"
                            value={exclusiveConsumableAttackBonus}
                            min={0}
                            onChange={setExclusiveConsumableAttackBonus}
                            helper={
                              isHeroJob
                                ? "분노 사용 시 중첩 불가 도핑은 무효"
                                : "중복 불가 도핑 중 1개만 적용"
                            }
                          />
                        </div>
                        {isArcherJob ? (
                          <label className="space-y-1">
                            <span className="retro-chip">화살</span>
                            <select
                              id="arrow-type"
                              className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                              value={arrowType}
                              onChange={(event) => setArrowType(event.target.value)}
                            >
                              <option value="">선택 안함</option>
                              <option value="일반화살">일반 화살</option>
                              <option value="청동화살">청동 화살</option>
                              <option value="강철화살">강철 화살</option>
                              <option value="빨간화살">빨간 화살</option>
                              <option value="다이아화살">다이아 화살</option>
                            </select>
                          </label>
                        ) : null}
                        {isNightLordJob ? (
                          <label className="space-y-1">
                            <span className="retro-chip">표창</span>
                            <select
                              id="star-type"
                              className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                              value={starType}
                              onChange={(event) => setStarType(event.target.value)}
                            >
                              <option value="">선택 안함</option>
                              <option value="수비표창">수비표창</option>
                              <option value="눈덩이">눈덩이</option>
                              <option value="월비표창">월비표창</option>
                              <option value="목비표창">목비표창</option>
                              <option value="나무팽이">나무팽이</option>
                              <option value="금비표창">금비표창</option>
                              <option value="고드름">고드름</option>
                              <option value="메이플표창">메이플표창</option>
                              <option value="토비표창">토비표창</option>
                              <option value="뇌전수리검">뇌전수리검</option>
                              <option value="일비표창">일비표창</option>
                              <option value="화비표창">화비표창</option>
                              <option value="절제된분노">절제된 분노</option>
                            </select>
                          </label>
                        ) : null}
                      </>
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
                </div>

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
          >
            {skillName === "힐" ? (
              <div className="space-y-1 text-xs">
                <span className="retro-chip">힐 타겟 수</span>
                <div className="flex items-center gap-2">
                  <SpinnerInput
                    id="heal-target-count"
                    value={healTargetCount}
                    onChange={(value) => setHealTargetCount(Math.max(1, Math.min(6, value)))}
                    min={1}
                    max={6}
                    step={1}
                    compact
                    className="w-full"
                    inputClassName="retro-number h-[30px] w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                  />
                  <span className="text-[10px] text-[color:var(--retro-text-muted)]">1~6</span>
                </div>
              </div>
            ) : null}
            {skillName.includes("패닉") || skillName.includes("코마") || skillName.includes("콤보") ? (
              <div className="space-y-1 text-xs">
                <span className="retro-chip">콤보 카운터</span>
                <div className="flex items-center gap-2">
                  <SpinnerInput
                    id="combo-counter"
                    value={comboCounter}
                    onChange={(value) => setComboCounter(Math.max(1, Math.min(10, value)))}
                    min={1}
                    max={10}
                    step={1}
                    compact
                    className="w-full"
                    inputClassName="retro-number h-[30px] w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                  />
                  <span className="text-[10px] text-[color:var(--retro-text-muted)]">1~10</span>
                </div>
              </div>
            ) : null}
          </SkillPanel>

          <Panel title="패시브/버프 스킬" tone="yellow">
            <div className="space-y-4 text-xs">
              <p className="text-[10px] text-[color:var(--retro-text-muted)]">
                패시브 스킬은 레벨을 입력하면 자동으로 퍼센트 효과로 환산됩니다.
              </p>
              <div className="retro-subsection space-y-2">
                <div className="flex justify-end">
                  <span className="retro-section-hint">레벨 입력 기반 자동 환산</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {isNightLordJob ? (
                    <div className="space-y-1">
                      <span className="retro-chip">
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
                          className={getMaxButtonClass(criticalThrowLevel === 30)}
                          onClick={() => toggleMax(criticalThrowLevel, 30, setCriticalThrowLevel)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                      </div>
                    </div>
                  ) : null}

                  {isArcherJob ? (
                    <div className="space-y-1">
                      <span className="retro-chip">
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
                          className={getMaxButtonClass(criticalShotLevel === 30)}
                          onClick={() => toggleMax(criticalShotLevel, 30, setCriticalShotLevel)}
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
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(focusBonus === 30)}
                            onClick={() => toggleMax(focusBonus, 30, setFocusBonus)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(silverHawkBonus === 30)}
                            onClick={() => toggleMax(silverHawkBonus, 30, setSilverHawkBonus)}
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
                      <span className="retro-chip">
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
                          className={getMaxButtonClass(goldenEagleBonus === 30)}
                          onClick={() => toggleMax(goldenEagleBonus, 30, setGoldenEagleBonus)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                      </div>
                    </div>
                  ) : null}

                  {isNightLordJob ? (
                    <div className="space-y-1">
                      <span className="retro-chip">
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
                          className={getMaxButtonClass(shadowPartnerLevel === 30)}
                          onClick={() => toggleMax(shadowPartnerLevel, 30, setShadowPartnerLevel)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                      </div>
                    </div>
                  ) : null}

                  {isPagePaladinJob ? (
                    <div className="space-y-1">
                      <span className="retro-chip">
                        차지 스킬
                      </span>
                      <div className="space-y-2">
                        <select
                          id="page-charge-skill"
                          className="w-full max-w-[150px] rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
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
                            className={getMaxButtonClass(pageChargeLevel === 30)}
                            onClick={() => toggleMax(pageChargeLevel, 30, setPageChargeLevel)}
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
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(berserkLevel === 30)}
                            onClick={() => toggleMax(berserkLevel, 30, setBerserkLevel)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(beholderBerserkBonus === 30)}
                            onClick={() => toggleMax(beholderBerserkBonus, 30, setBeholderBerserkBonus)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(beholderBuffBonus === 30)}
                            onClick={() => toggleMax(beholderBuffBonus, 30, setBeholderBuffBonus)}
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
                        <span className="retro-chip">
                          분노 레벨
                        </span>
                        <div className="flex items-center gap-2">
                          <SpinnerInput
                            id="rage-bonus"
                            value={rageBonus}
                            onChange={setRageBonus}
                            min={0}
                            max={20}
                            step={1}
                            className="w-24"
                            inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                          />
                          <button
                            type="button"
                            className={getMaxButtonClass(rageBonus === 20)}
                            onClick={() => toggleMax(rageBonus, 20, setRageBonus)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 20</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(comboAttackLevel === 30)}
                            onClick={() => toggleMax(comboAttackLevel, 30, setComboAttackLevel)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(rushBonus === 30)}
                            onClick={() => toggleMax(rushBonus, 30, setRushBonus)}
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
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(amplificationLevel === 30)}
                            onClick={() => toggleMax(amplificationLevel, 30, setAmplificationLevel)}
                          >
                            M
                          </button>
                          <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="retro-chip">
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
                            className={getMaxButtonClass(ifritBonus === 30)}
                            onClick={() => toggleMax(ifritBonus, 30, setIfritBonus)}
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
                      <span className="retro-chip">
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
                          className={getMaxButtonClass(bahamutBonus === 30)}
                          onClick={() => toggleMax(bahamutBonus, 30, setBahamutBonus)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                      </div>
                    </div>
                  ) : null}

                  {jobGroup !== "마법사" ? (
                    <div className="space-y-1">
                      <span className="retro-chip">
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
                          max={20}
                          step={1}
                          className="w-24"
                          inputClassName="retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                        />
                        <button
                          type="button"
                          className={getMaxButtonClass(passiveMasteryBonus === 20)}
                          onClick={() => toggleMax(passiveMasteryBonus, 20, setPassiveMasteryBonus)}
                        >
                          M
                        </button>
                        <span className="text-[10px] text-[color:var(--retro-text-muted)]">레벨=퍼센트</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="retro-chip">
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
                        className={getMaxButtonClass(sharpEyesLevel === 30)}
                        onClick={() => toggleMax(sharpEyesLevel, 30, setSharpEyesLevel)}
                      >
                        M
                      </button>
                      <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="retro-chip">
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
                        className={getMaxButtonClass(mapleHeroLevel === 30)}
                        onClick={() => toggleMax(mapleHeroLevel, 30, setMapleHeroLevel)}
                      >
                        M
                      </button>
                      <span className="text-[10px] text-[color:var(--retro-text-muted)]">최대 30</span>
                    </div>
                  </div>
                  {isArchMageJob ? (
                    <div className="space-y-1">
                      <span className="retro-chip">
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
                          className={getMaxButtonClass(meditationLevel === 20)}
                          onClick={() => toggleMax(meditationLevel, 20, setMeditationLevel)}
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
          </div>

          <div className="space-y-6">
          <MonsterPanel
            monsters={typedMonsters}
            value={monsterName}
            onChange={setMonsterName}
            selected={selectedMonster}
            characterLevel={level}
          />
          </div>

          <div className="space-y-6">
          <ResultPanel
            baseDamage={{
              min: baseDamage.minDamage * finalDamageMultiplier,
              avg: baseDamage.avgDamage * finalDamageMultiplier,
              max: baseDamage.maxDamage * finalDamageMultiplier,
            }}
            motionDamageRanges={motionDamageRanges ? {
              slash: {
                min: motionDamageRanges.slash.minDamage * finalDamageMultiplier,
                avg: motionDamageRanges.slash.avgDamage * finalDamageMultiplier,
                max: motionDamageRanges.slash.maxDamage * finalDamageMultiplier,
              },
              thrust: {
                min: motionDamageRanges.thrust.minDamage * finalDamageMultiplier,
                avg: motionDamageRanges.thrust.avgDamage * finalDamageMultiplier,
                max: motionDamageRanges.thrust.maxDamage * finalDamageMultiplier,
              },
            } : undefined}
            result={result}
            elementMultiplier={elementMultiplier}
            bishopHealBonus={bishopHealBonus}
            criticalDamageMultiplier={criticalDamageMultiplier}
            criticalRate={criticalRate}
            showFormula={showFormula}
            onToggleFormula={() => setShowFormula((prev) => !prev)}
          />
          </div>
        </div>
      </div>
    </section>
  );
}
