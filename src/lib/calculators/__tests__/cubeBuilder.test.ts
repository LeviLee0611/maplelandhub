import { describe, expect, it } from "vitest";
import {
  applyDeltas,
  classifyOption,
  computeCharacterPower,
  computeSlotValue,
  simulateSlotOutcome,
} from "@/lib/calculators/cubeBuilder";
import { calcBaseDamageFromStats } from "@/lib/calculators/onehit";
import type { CubeOptionEntry } from "@/types/cube";
import type { CubeBuilderCharacter, CubeBuilderEquipmentSlot } from "@/types/cubeBuilder";

function makeEntry(overrides: Partial<CubeOptionEntry> = {}): CubeOptionEntry {
  return {
    id: 1,
    grade: 0,
    weight: 20,
    optionType: 0,
    reqLevel: 0,
    text: "STR : +#incSTR",
    level: { "1": { incSTR: 5 } },
    ...overrides,
  };
}

function makeCharacter(overrides: Partial<CubeBuilderCharacter> = {}): CubeBuilderCharacter {
  return {
    jobGroup: "전사",
    str: 500,
    dex: 120,
    int: 20,
    luk: 50,
    attack: 200,
    mastery: 0.6,
    criticalRate: 0,
    criticalDamage: 0,
    bossDamageEnabled: false,
    bossDamagePercent: 0,
    totalDamagePercent: 0,
    ignoreDefensePercent: 0,
    monsterDefense: 0,
    ...overrides,
  };
}

describe("classifyOption", () => {
  it("classifies flat STR", () => {
    const entry = makeEntry({ text: "STR : +#incSTR", level: { "1": { incSTR: 5 } } });
    expect(classifyOption(entry, 10)).toEqual([{ kind: "stat", stat: "str", percent: false, value: 5 }]);
  });

  it("classifies percent STR", () => {
    const entry = makeEntry({ text: "STR : +#incSTRr%", level: { "1": { incSTRr: 3 } } });
    expect(classifyOption(entry, 10)).toEqual([{ kind: "stat", stat: "str", percent: true, value: 3 }]);
  });

  it("classifies 올스탯 flat into 4 deltas", () => {
    const entry = makeEntry({
      text: "올스탯 : +#incSTR",
      level: { "1": { incSTR: 2, incDEX: 2, incINT: 2, incLUK: 2 } },
    });
    const deltas = classifyOption(entry, 10);
    expect(deltas).toHaveLength(4);
    expect(deltas).toContainEqual({ kind: "stat", stat: "str", percent: false, value: 2 });
    expect(deltas).toContainEqual({ kind: "stat", stat: "luk", percent: false, value: 2 });
  });

  it("distinguishes 총 데미지 from 보스 공격 시 데미지 despite sharing the incDAMr var name", () => {
    const total = makeEntry({ optionType: 10, text: "총 데미지 : +#incDAMr%", level: { "1": { incDAMr: 3 } } });
    const boss = makeEntry({ optionType: 10, text: "보스 공격 시 데미지 : +#incDAMr%", level: { "1": { incDAMr: 30 } } });
    expect(classifyOption(total, 10)).toEqual([{ kind: "totalDamage", value: 3 }]);
    expect(classifyOption(boss, 10)).toEqual([{ kind: "bossDamage", value: 30 }]);
  });

  it("classifies 공격력 flat/percent and 몬스터 방어율 무시", () => {
    const atk = makeEntry({ optionType: 10, text: "공격력 : +#incPAD", level: { "1": { incPAD: 12 } } });
    const atkPct = makeEntry({ optionType: 10, text: "공격력 : +#incPADr%", level: { "1": { incPADr: 5 } } });
    const ignoreDef = makeEntry({
      optionType: 10,
      text: "공격 시 몬스터의 방어율 #ignoreTargetDEF% 무시",
      level: { "1": { ignoreTargetDEF: 10 } },
    });
    expect(classifyOption(atk, 10)).toEqual([{ kind: "attack", percent: false, value: 12 }]);
    expect(classifyOption(atkPct, 10)).toEqual([{ kind: "attack", percent: true, value: 5 }]);
    expect(classifyOption(ignoreDef, 10)).toEqual([{ kind: "ignoreDefense", value: 10 }]);
  });

  it("classifies critical rate and critical min/max damage", () => {
    const critRate = makeEntry({ optionType: 10, text: "크리티컬 확률 : +#incCr%", level: { "1": { incCr: 4 } } });
    const critDmgMin = makeEntry({
      optionType: 54,
      text: "크리티컬 최소 데미지 : +#incCriticaldamageMin%",
      level: { "1": { incCriticaldamageMin: 6 } },
    });
    expect(classifyOption(critRate, 10)).toEqual([{ kind: "criticalRate", value: 4 }]);
    expect(classifyOption(critDmgMin, 10)).toEqual([{ kind: "criticalDamage", value: 6 }]);
  });

  it("returns no deltas for junk options (defense, HP recovery, skill-usable)", () => {
    const defense = makeEntry({ optionType: 11, text: "물리방어력 : +#incPDD", level: { "1": { incPDD: 20 } } });
    const recovery = makeEntry({
      optionType: 10,
      text: "공격 시 #prop% 확률로 #HP의 HP 회복",
      level: { "1": { prop: 5, HP: 100 } },
    });
    const skill = makeEntry({ optionType: 51, text: "<쓸만한 미스틱 도어> 스킬 사용 가능", level: { "1": { level: 1 } } });
    expect(classifyOption(defense, 10)).toEqual([]);
    expect(classifyOption(recovery, 10)).toEqual([]);
    expect(classifyOption(skill, 10)).toEqual([]);
  });
});

describe("computeCharacterPower", () => {
  it("matches calcBaseDamageFromStats for a physical warrior with no multipliers", () => {
    const character = makeCharacter();
    const expected = calcBaseDamageFromStats({
      primaryStat: character.str,
      secondaryStat: character.dex,
      weaponAttack: character.attack,
      statMultiplier: 4.0,
      mastery: character.mastery,
      isMagic: false,
    }).avgDamage;
    expect(computeCharacterPower(character)).toBeCloseTo(expected, 5);
  });

  it("increases power when critical rate/damage are added", () => {
    const base = makeCharacter();
    const withCrit = makeCharacter({ criticalRate: 50, criticalDamage: 40 });
    expect(computeCharacterPower(withCrit)).toBeGreaterThan(computeCharacterPower(base));
  });

  it("only applies boss damage% when bossDamageEnabled is true", () => {
    const off = makeCharacter({ bossDamagePercent: 50, bossDamageEnabled: false });
    const on = makeCharacter({ bossDamagePercent: 50, bossDamageEnabled: true });
    const baseline = makeCharacter();
    expect(computeCharacterPower(off)).toBeCloseTo(computeCharacterPower(baseline), 5);
    expect(computeCharacterPower(on)).toBeCloseTo(computeCharacterPower(baseline) * 1.5, 5);
  });

  it("reduces power as monster defense increases, and ignoreDefensePercent offsets it", () => {
    const noDef = makeCharacter({ monsterDefense: 0 });
    const withDef = makeCharacter({ monsterDefense: 1000 });
    const withDefIgnored = makeCharacter({ monsterDefense: 1000, ignoreDefensePercent: 100 });
    expect(computeCharacterPower(withDef)).toBeLessThan(computeCharacterPower(noDef));
    expect(computeCharacterPower(withDefIgnored)).toBeCloseTo(computeCharacterPower(noDef), 5);
  });
});

describe("applyDeltas", () => {
  it("adds flat stat and multiplies percent stat", () => {
    const character = makeCharacter({ str: 100 });
    const next = applyDeltas(character, [
      { kind: "stat", stat: "str", percent: false, value: 10 },
      { kind: "stat", stat: "str", percent: true, value: 5 },
    ]);
    expect(next.str).toBeCloseTo(110 * 1.05, 5);
  });

  it("accumulates bossDamage/totalDamage/ignoreDefense deltas", () => {
    const character = makeCharacter();
    const next = applyDeltas(character, [
      { kind: "bossDamage", value: 30 },
      { kind: "totalDamage", value: 3 },
      { kind: "ignoreDefense", value: 10 },
    ]);
    expect(next.bossDamagePercent).toBe(30);
    expect(next.totalDamagePercent).toBe(3);
    expect(next.ignoreDefensePercent).toBe(10);
  });
});

describe("computeSlotValue", () => {
  it("returns 0 for an empty slot", () => {
    const character = makeCharacter();
    const slot: CubeBuilderEquipmentSlot = { slotKey: "반지1", grade: 0, potentialIds: [null, null, null] };
    expect(computeSlotValue(character, slot, [], 10)).toBe(0);
  });

  it("returns a positive % for a slot with a beneficial flat STR option", () => {
    const character = makeCharacter();
    const pool = [makeEntry({ id: 1, text: "STR : +#incSTR", level: { "1": { incSTR: 50 } } })];
    const slot: CubeBuilderEquipmentSlot = { slotKey: "반지1", grade: 0, potentialIds: [1, null, null] };
    expect(computeSlotValue(character, slot, pool, 10)).toBeGreaterThan(0);
  });

  it("returns 0 for a slot filled only with junk options", () => {
    const character = makeCharacter();
    const pool = [makeEntry({ id: 1, optionType: 11, text: "물리방어력 : +#incPDD", level: { "1": { incPDD: 999 } } })];
    const slot: CubeBuilderEquipmentSlot = { slotKey: "반지1", grade: 0, potentialIds: [1, null, null] };
    expect(computeSlotValue(character, slot, pool, 10)).toBe(0);
  });

  it("does not double-count the slot's own current potential (regression)", () => {
    // 캐릭터 입력값(str: 550)은 이미 이 슬롯의 STR+50을 포함한 "현재 총합"이라고 가정 — 슬롯 가치는
    // baseline(550)에서 그 슬롯의 기여분(50)을 뺀 500과 비교해야지, 550 위에 50을 또 얹어 600과 비교하면 안 된다.
    const character = makeCharacter({ str: 550 });
    const pool = [makeEntry({ id: 1, text: "STR : +#incSTR", level: { "1": { incSTR: 50 } } })];
    const slot: CubeBuilderEquipmentSlot = { slotKey: "반지1", grade: 0, potentialIds: [1, null, null] };

    const basePower = computeCharacterPower(makeCharacter({ str: 500 }));
    const currentPower = computeCharacterPower(character);
    const expected = ((currentPower - basePower) / basePower) * 100;

    expect(computeSlotValue(character, slot, pool, 10)).toBeCloseTo(expected, 5);
  });
});

describe("simulateSlotOutcome", () => {
  it("reports 0% upgrade chance when the pool only contains the option already equipped", () => {
    const character = makeCharacter();
    const entry = makeEntry({ id: 1, grade: 0, text: "STR : +#incSTR", level: { "1": { incSTR: 5 } } });
    const pool = [entry];
    const slot: CubeBuilderEquipmentSlot = { slotKey: "반지1", grade: 0, potentialIds: [1, 1, 1] };
    const outcome = simulateSlotOutcome(character, slot, pool, "suspicious", 10, 200);
    expect(outcome.upgradeChance).toBe(0);
  });

  it("reports ~100% upgrade chance when the pool only contains a strictly better option", () => {
    const character = makeCharacter();
    const weak = makeEntry({ id: 1, grade: 0, weight: 1, text: "STR : +#incSTR", level: { "1": { incSTR: 1 } } });
    const strong = makeEntry({ id: 2, grade: 0, weight: 1, text: "STR : +#incSTR", level: { "1": { incSTR: 500 } } });
    const pool = [weak, strong];
    const slot: CubeBuilderEquipmentSlot = { slotKey: "반지1", grade: 0, potentialIds: [1, null, null] };
    const outcome = simulateSlotOutcome(character, slot, pool, "suspicious", 10, 2000);
    // 3줄 중 최소 1줄이 strong일 확률이 매우 높음(줄마다 독립 50%에 가까움) — 완전 100%는 아니지만 충분히 높아야 함
    expect(outcome.upgradeChance).toBeGreaterThan(0.8);
  });
});
