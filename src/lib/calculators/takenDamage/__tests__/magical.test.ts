import { describe, expect, it } from "vitest";
import { calcMagicalTakenDamage } from "@/lib/calculators/takenDamage/magical";
import type { CalcContext } from "@/types/takenDamage";

function baseCtx(overrides: Partial<CalcContext> = {}): CalcContext {
  return {
    character: {
      level: 100,
      jobClass: "thief",
      basicStats: { STR: 50, DEX: 50, INT: 50, LUK: 100 },
      secondaryStats: { PDD: 0, MDD: 200 },
    },
    mob: {
      level: 100,
      templatePADamage: 0,
      templateMADamage: 500,
    },
    ...overrides,
  };
}

describe("calcMagicalTakenDamage — 기본 성질", () => {
  it("min <= max이고 둘 다 1 이상의 정수", () => {
    const result = calcMagicalTakenDamage(baseCtx());
    expect(result.min).toBeLessThanOrEqual(result.max);
    expect(result.min).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(result.min)).toBe(true);
    expect(Number.isInteger(result.max)).toBe(true);
  });

  it("몬스터 마법공격력(templateMADamage)이 높을수록 데미지도 커짐", () => {
    const low = calcMagicalTakenDamage(baseCtx({ mob: { level: 100, templatePADamage: 0, templateMADamage: 300 } }));
    const high = calcMagicalTakenDamage(baseCtx({ mob: { level: 100, templatePADamage: 0, templateMADamage: 800 } }));
    expect(high.max).toBeGreaterThan(low.max);
  });

  it("내 마법방어력(MDD)이 높을수록 받는 데미지가 줄어듦", () => {
    const lowMdd = calcMagicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, secondaryStats: { PDD: 0, MDD: 50 } } }),
    );
    const highMdd = calcMagicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, secondaryStats: { PDD: 0, MDD: 800 } } }),
    );
    expect(highMdd.max).toBeLessThan(lowMdd.max);
  });

  it("마법사(magician)는 동일 스탯에서 다른 직업보다 보정 계수가 커서 데미지가 더 낮음", () => {
    const magician = calcMagicalTakenDamage(baseCtx({ character: { ...baseCtx().character, jobClass: "magician" } }));
    const thief = calcMagicalTakenDamage(baseCtx({ character: { ...baseCtx().character, jobClass: "thief" } }));
    expect(magician.max).toBeLessThan(thief.max);
  });
});

describe("calcMagicalTakenDamage — 임시 버프", () => {
  it("InvinciblePercent 100이면 데미지가 최소치(1)로 떨어짐", () => {
    const result = calcMagicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { InvinciblePercent: 100 } } }),
    );
    expect(result.min).toBe(1);
    expect(result.max).toBe(1);
  });

  it("ResistPercent가 클수록 데미지가 더 줄어듦", () => {
    const some = calcMagicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { ResistPercent: 20 } } }),
    );
    const more = calcMagicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { ResistPercent: 80 } } }),
    );
    expect(more.max).toBeLessThan(some.max);
  });

  it("MddBonus는 secondaryStats.MDD에 더해져 데미지를 줄임", () => {
    const withoutBonus = calcMagicalTakenDamage(baseCtx());
    const withBonus = calcMagicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { MddBonus: 500 } } }),
    );
    expect(withBonus.max).toBeLessThan(withoutBonus.max);
  });

  it("PowerUpPercent 200은 최종 데미지를 대략 2배로 스케일(클램프 미적용 구간)", () => {
    const base = calcMagicalTakenDamage(baseCtx());
    const boosted = calcMagicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { PowerUpPercent: 200 } } }),
    );
    expect(boosted.max).toBeCloseTo(base.max * 2, -1);
  });
});

describe("calcMagicalTakenDamage — 한계치(limits)", () => {
  it("MaxDamage로 최종 데미지가 clamp됨", () => {
    const uncapped = calcMagicalTakenDamage(baseCtx());
    const capped = calcMagicalTakenDamage(baseCtx({ limits: { MaxDamage: 50 } }));
    expect(uncapped.max).toBeGreaterThan(50);
    expect(capped.max).toBe(50);
    expect(capped.min).toBe(50);
  });

  it("MaxMad로 몬스터 마법공격력 자체가 clamp되어 데미지가 줄어듦", () => {
    const uncapped = calcMagicalTakenDamage(baseCtx({ mob: { level: 100, templatePADamage: 0, templateMADamage: 2000 } }));
    const capped = calcMagicalTakenDamage(
      baseCtx({ mob: { level: 100, templatePADamage: 0, templateMADamage: 2000 }, limits: { MaxMad: 500 } }),
    );
    expect(capped.max).toBeLessThan(uncapped.max);
  });
});
