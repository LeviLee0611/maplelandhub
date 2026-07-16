import { resolveOptionValues, rollCubeResult } from "@/lib/calculators/cubeSimulator";
import { calcBaseDamageFromStats } from "@/lib/calculators/onehit";
import type { CubeOptionEntry, CubeVariant } from "@/types/cube";
import type {
  CubeBuilderCharacter,
  CubeBuilderEquipmentSlot,
  CubeBuilderJobGroup,
  CubeBuilderOptionDelta,
  CubeBuilderSlotOutcome,
} from "@/types/cubeBuilder";

// 이 저장소의 한방컷 계산기(onehit-calculator-client.tsx jobProfile)가 이미 쓰는 배율을 그대로 재사용 —
// 실제 메이플 무기별 배율(검4/활3/단검3.6 등)과는 다르지만, 사이트 내 다른 계산기와의 일관성을 우선함.
const JOB_PROFILE: Record<
  CubeBuilderJobGroup,
  { primary: "str" | "dex" | "int" | "luk"; secondary: "str" | "dex" | "luk"; multiplier: number; isMagic: boolean }
> = {
  전사: { primary: "str", secondary: "dex", multiplier: 4.0, isMagic: false },
  마법사: { primary: "int", secondary: "luk", multiplier: 1.0, isMagic: true },
  궁수: { primary: "dex", secondary: "str", multiplier: 4.0, isMagic: false },
  도적: { primary: "luk", secondary: "dex", multiplier: 4.0, isMagic: false },
};

/**
 * 큐브 옵션 하나(entry)를 "스펙에 영향 주는 델타" 목록으로 분류한다. 스킬 재사용/이동속도/방어력/회복 등
 * 데미지와 무관한 옵션("잡옵")은 빈 배열을 반환 — cubeplanner.kr의 "잡옵" 배지와 같은 개념.
 *
 * 주의: optionType + 변수명만으로는 구분 안 되는 경우가 있음(예: optionType 10의 incDAMr는 "총 데미지"와
 * "보스 공격 시 데미지" 둘 다에 쓰임) — 반드시 text 접두어로 먼저 분기한다. `data/planet/cube-index.json`
 * 전체 유니크 템플릿을 직접 검토해서 만든 분류표(2026-07-16).
 */
export function classifyOption(entry: CubeOptionEntry, itemLevel: number): CubeBuilderOptionDelta[] {
  const values = resolveOptionValues(entry, itemLevel);
  const text = entry.text;

  if (entry.optionType === 0) {
    if (text.startsWith("올스탯")) {
      const percent = text.includes("%");
      const deltas: CubeBuilderOptionDelta[] = [];
      const statKeys: Array<{ stat: "str" | "dex" | "int" | "luk"; varName: string }> = [
        { stat: "str", varName: percent ? "incSTRr" : "incSTR" },
        { stat: "dex", varName: percent ? "incDEXr" : "incDEX" },
        { stat: "int", varName: percent ? "incINTr" : "incINT" },
        { stat: "luk", varName: percent ? "incLUKr" : "incLUK" },
      ];
      for (const { stat, varName } of statKeys) {
        const value = values[varName];
        if (typeof value === "number") deltas.push({ kind: "stat", stat, percent, value });
      }
      return deltas;
    }
    const statMap: Array<{ prefix: string; stat: "str" | "dex" | "int" | "luk" }> = [
      { prefix: "STR", stat: "str" },
      { prefix: "DEX", stat: "dex" },
      { prefix: "INT", stat: "int" },
      { prefix: "LUK", stat: "luk" },
    ];
    for (const { prefix, stat } of statMap) {
      if (!text.startsWith(`${prefix} :`)) continue;
      const percent = text.includes("%");
      const varName = percent ? `inc${prefix}r` : `inc${prefix}`;
      const value = values[varName];
      return typeof value === "number" ? [{ kind: "stat", stat, percent, value }] : [];
    }
    return []; // MaxHP/MaxMP 등 — 잡옵
  }

  if (entry.optionType === 10) {
    if (text.startsWith("보스 공격 시 데미지")) {
      const value = values.incDAMr;
      return typeof value === "number" ? [{ kind: "bossDamage", value }] : [];
    }
    if (text.startsWith("총 데미지")) {
      const value = values.incDAMr;
      return typeof value === "number" ? [{ kind: "totalDamage", value }] : [];
    }
    if (text.startsWith("크리티컬 확률")) {
      const value = values.incCr;
      return typeof value === "number" ? [{ kind: "criticalRate", value }] : [];
    }
    if (text.startsWith("공격력") || text.startsWith("마력")) {
      const percent = text.includes("%");
      const varName = text.startsWith("공격력") ? (percent ? "incPADr" : "incPAD") : percent ? "incMADr" : "incMAD";
      const value = values[varName];
      return typeof value === "number" ? [{ kind: "attack", percent, value }] : [];
    }
    if (text.includes("방어율") && text.includes("무시")) {
      const value = values.ignoreTargetDEF;
      return typeof value === "number" ? [{ kind: "ignoreDefense", value }] : [];
    }
    return []; // HP/MP 회복, 상태이상 부여류 — 잡옵
  }

  if (entry.optionType === 54) {
    if (text.startsWith("크리티컬 최소 데미지") || text.startsWith("크리티컬 최대 데미지")) {
      const value = values.incCriticaldamageMin ?? values.incCriticaldamageMax;
      // min/max를 구분 계산하지 않고 크리티컬 데미지 평균에 더하는 근사치로 취급 — 두 옵션이 동시에 있으면
      // applyDeltas에서 각각 더해지므로 min+max를 합산한 값이 됨(개별 min/max 반영보다 단순화된 근사).
      return typeof value === "number" ? [{ kind: "criticalDamage", value }] : [];
    }
    return []; // HP/MP 회복, 오토스틸, 스킬 사용가능류 — 잡옵
  }

  // optionType 11(방어력/HP%/회복효율), 20(피격무시), 40(회복/드랍률), 51/52/53/55(스킬재사용/이동속도/저항/무적 등)
  // — 전부 공격력 스펙과 무관한 옵션으로 취급.
  return [];
}

export function applyDeltas(character: CubeBuilderCharacter, deltas: CubeBuilderOptionDelta[]): CubeBuilderCharacter {
  const next = { ...character };
  for (const delta of deltas) {
    switch (delta.kind) {
      case "stat":
        next[delta.stat] = delta.percent ? next[delta.stat] * (1 + delta.value / 100) : next[delta.stat] + delta.value;
        break;
      case "attack":
        next.attack = delta.percent ? next.attack * (1 + delta.value / 100) : next.attack + delta.value;
        break;
      case "criticalRate":
        next.criticalRate = Math.min(100, next.criticalRate + delta.value);
        break;
      case "criticalDamage":
        next.criticalDamage = next.criticalDamage + delta.value;
        break;
      case "bossDamage":
        next.bossDamagePercent = next.bossDamagePercent + delta.value;
        break;
      case "totalDamage":
        next.totalDamagePercent = next.totalDamagePercent + delta.value;
        break;
      case "ignoreDefense":
        next.ignoreDefensePercent = Math.min(100, next.ignoreDefensePercent + delta.value);
        break;
    }
  }
  return next;
}

/**
 * applyDeltas의 역연산 — 캐릭터 입력값은 "현재 총 스탯"(이 슬롯의 잠재 효과가 이미 포함된 값)이라고
 * 가정하기 때문에(cubeplanner.kr과 동일 관례: "S창 시트값 그대로, 잠재 효과 이미 포함"), 이 슬롯의
 * 가치/재굴림 비교를 하려면 먼저 이 슬롯이 기여한 만큼을 baseline에서 빼야 한다 — 안 그러면 현재 낀
 * 잠재 효과가 baseline과 "새로 더한 값" 양쪽에 이중으로 반영돼서 비교 자체가 틀어진다.
 * 델타 적용 순서와 정확히 반대로 되돌린다(퍼센트+플랫이 섞여 있으면 순서가 결과에 영향을 주므로).
 */
function removeDeltas(character: CubeBuilderCharacter, deltas: CubeBuilderOptionDelta[]): CubeBuilderCharacter {
  const next = { ...character };
  for (const delta of [...deltas].reverse()) {
    switch (delta.kind) {
      case "stat":
        next[delta.stat] = delta.percent ? next[delta.stat] / (1 + delta.value / 100) : next[delta.stat] - delta.value;
        break;
      case "attack":
        next.attack = delta.percent ? next.attack / (1 + delta.value / 100) : next.attack - delta.value;
        break;
      case "criticalRate":
        next.criticalRate = Math.max(0, next.criticalRate - delta.value);
        break;
      case "criticalDamage":
        next.criticalDamage = next.criticalDamage - delta.value;
        break;
      case "bossDamage":
        next.bossDamagePercent = next.bossDamagePercent - delta.value;
        break;
      case "totalDamage":
        next.totalDamagePercent = next.totalDamagePercent - delta.value;
        break;
      case "ignoreDefense":
        next.ignoreDefensePercent = Math.max(0, next.ignoreDefensePercent - delta.value);
        break;
    }
  }
  return next;
}

/**
 * 캐릭터 스탯을 단일 "파워" 스칼라로 환산한다 — 절대값 자체는 의미 없고, 두 캐릭터(또는 옵션 적용 전/후)의
 * 상대적 비교(% 증가량)에만 사용한다. `onehit.ts`의 프리빅뱅 표준 공식(calcBaseDamageFromStats)을 그대로
 * 재사용하고, 몬스터 방어 감산은 min/max 평균 계수로 단순화했다(onehit.ts는 min/max를 따로 계산하지만
 * 여기선 스킬 무관 평균 파워 하나만 필요하기 때문).
 */
export function computeCharacterPower(character: CubeBuilderCharacter): number {
  const profile = JOB_PROFILE[character.jobGroup];
  const primaryStat = character[profile.primary];
  const secondaryStat = character[profile.secondary];

  const { avgDamage } = calcBaseDamageFromStats({
    primaryStat,
    secondaryStat,
    weaponAttack: character.attack,
    statMultiplier: profile.multiplier,
    mastery: character.mastery,
    isMagic: profile.isMagic,
  });

  const effectiveDefense = character.monsterDefense * (1 - character.ignoreDefensePercent / 100);
  // 물리: onehit.ts의 min(/6)·max(/5) 평균, 마법: min(*0.6)·max(*0.5) 평균 계수를 그대로 씀.
  const defenseFactor = profile.isMagic ? 0.55 : (1 / 5 + 1 / 6) / 2;
  const afterDefense = Math.max(0, avgDamage - effectiveDefense * defenseFactor);

  const critMultiplier = 1 + (character.criticalRate / 100) * (character.criticalDamage / 100);
  const bossMultiplier = character.bossDamageEnabled ? 1 + character.bossDamagePercent / 100 : 1;
  const totalDamageMultiplier = 1 + character.totalDamagePercent / 100;

  return afterDefense * critMultiplier * bossMultiplier * totalDamageMultiplier;
}

function slotDeltas(slot: CubeBuilderEquipmentSlot, pool: CubeOptionEntry[], itemLevel: number): CubeBuilderOptionDelta[] {
  const deltas: CubeBuilderOptionDelta[] = [];
  for (const id of slot.potentialIds) {
    if (id === null) continue;
    const entry = pool.find((option) => option.id === id);
    if (!entry) continue;
    deltas.push(...classifyOption(entry, itemLevel));
  }
  return deltas;
}

/** 슬롯의 현재 3줄 잠재가 캐릭터 파워를 몇 % 올려주고 있는지. */
export function computeSlotValue(character: CubeBuilderCharacter, slot: CubeBuilderEquipmentSlot, pool: CubeOptionEntry[], itemLevel: number): number {
  const currentDeltas = slotDeltas(slot, pool, itemLevel);
  const baselineWithoutSlot = removeDeltas(character, currentDeltas);
  const basePower = computeCharacterPower(baselineWithoutSlot);
  if (basePower <= 0) return 0;
  const currentPower = computeCharacterPower(character);
  return ((currentPower - basePower) / basePower) * 100;
}

/**
 * 슬롯을 큐브 한 번 돌렸을 때: 지금보다 좋아질 확률, +0.5% 스펙 얻으려면 평균 몇 개 필요한지.
 * 몬테카를로(기존 rollCubeResult를 반복 호출) — cubeplanner.kr도 동일하게 "5,000번 시뮬" 방식이라
 * 방법론이 일치함. 이미 검증된 폐쇄형 확률 함수(estimateOptionOdds 등)는 "특정 옵션 하나"를 겨냥한
 * 계산이라 이 용도(임의 3줄 조합의 파워 분포)와는 목적이 달라 재사용하지 않음.
 */
export function simulateSlotOutcome(
  character: CubeBuilderCharacter,
  slot: CubeBuilderEquipmentSlot,
  pool: CubeOptionEntry[],
  cubeType: CubeVariant,
  itemLevel: number,
  trials = 5000,
): CubeBuilderSlotOutcome {
  const currentDeltas = slotDeltas(slot, pool, itemLevel);
  const baselineWithoutSlot = removeDeltas(character, currentDeltas);
  const basePower = computeCharacterPower(baselineWithoutSlot);
  const currentPower = computeCharacterPower(character);
  const currentValue = basePower > 0 ? ((currentPower - basePower) / basePower) * 100 : 0;

  if (basePower <= 0 || pool.length === 0) {
    return { currentPowerPercent: currentValue, upgradeChance: 0, avgCubesPerHalfPercent: Infinity };
  }

  const poolById = new Map(pool.map((entry) => [entry.id, entry]));
  let improvedCount = 0;
  let cubesFor05 = 0;
  let reached05Count = 0;

  for (let i = 0; i < trials; i += 1) {
    const rolled = rollCubeResult(pool, itemLevel, cubeType);
    const deltas: CubeBuilderOptionDelta[] = [];
    for (const line of rolled.lines) {
      const entry = poolById.get(line.entryId);
      if (entry) deltas.push(...classifyOption(entry, itemLevel));
    }
    // 새로 뽑은 3줄은 기존 슬롯 잠재를 대체하는 것이므로, "이 슬롯을 뺀 baseline" 위에 새 델타만 얹어서 비교한다
    // (기존 잠재 위에 또 얹으면 기존 것과 이중으로 반영됨).
    const rolledCharacter = applyDeltas(baselineWithoutSlot, deltas);
    const rolledPower = computeCharacterPower(rolledCharacter);
    const rolledValue = ((rolledPower - basePower) / basePower) * 100;

    if (rolledValue > currentValue) improvedCount += 1;
    if (rolledValue - currentValue >= 0.5) reached05Count += 1;
  }

  const upgradeChance = improvedCount / trials;
  const reach05Rate = reached05Count / trials;
  cubesFor05 = reach05Rate > 0 ? 1 / reach05Rate : Infinity;

  return { currentPowerPercent: currentValue, upgradeChance, avgCubesPerHalfPercent: cubesFor05 };
}
