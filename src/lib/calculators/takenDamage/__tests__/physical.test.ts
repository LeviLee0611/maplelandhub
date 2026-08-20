import { describe, expect, it } from "vitest";
import { calcPhysicalTakenDamage } from "@/lib/calculators/takenDamage/physical";
import type { CalcContext } from "@/types/takenDamage";

function baseCtx(overrides: Partial<CalcContext> = {}): CalcContext {
  return {
    character: {
      level: 100,
      jobClass: "warrior",
      basicStats: { STR: 100, DEX: 50, INT: 4, LUK: 4 },
      secondaryStats: { PDD: 200, MDD: 0 },
    },
    mob: {
      level: 100,
      templatePADamage: 500,
      templateMADamage: 0,
    },
    ...overrides,
  };
}

describe("calcPhysicalTakenDamage — 기본 성질", () => {
  it("min <= max이고 둘 다 1 이상의 정수", () => {
    const result = calcPhysicalTakenDamage(baseCtx());
    expect(result.min).toBeLessThanOrEqual(result.max);
    expect(result.min).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(result.min)).toBe(true);
    expect(Number.isInteger(result.max)).toBe(true);
  });

  it("몬스터 공격력(templatePADamage)이 높을수록 데미지도 커짐", () => {
    const low = calcPhysicalTakenDamage(baseCtx({ mob: { level: 100, templatePADamage: 300, templateMADamage: 0 } }));
    const high = calcPhysicalTakenDamage(baseCtx({ mob: { level: 100, templatePADamage: 800, templateMADamage: 0 } }));
    expect(high.max).toBeGreaterThan(low.max);
  });

  it("내 물리방어력(PDD)이 높을수록 받는 데미지가 줄어듦", () => {
    const lowPdd = calcPhysicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, secondaryStats: { PDD: 50, MDD: 0 } } }),
    );
    const highPdd = calcPhysicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, secondaryStats: { PDD: 800, MDD: 0 } } }),
    );
    expect(highPdd.max).toBeLessThan(lowPdd.max);
  });
});

describe("calcPhysicalTakenDamage — 임시 버프", () => {
  it("InvinciblePercent 100이면 데미지가 최소치(1)로 떨어짐", () => {
    const result = calcPhysicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { InvinciblePercent: 100 } } }),
    );
    expect(result.min).toBe(1);
    expect(result.max).toBe(1);
  });

  it("InvinciblePercent가 클수록 데미지가 더 줄어듦", () => {
    const some = calcPhysicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { InvinciblePercent: 20 } } }),
    );
    const more = calcPhysicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { InvinciblePercent: 80 } } }),
    );
    expect(more.max).toBeLessThan(some.max);
  });

  it("PddBonus는 secondaryStats.PDD에 더해져 데미지를 줄임", () => {
    const withoutBonus = calcPhysicalTakenDamage(baseCtx());
    const withBonus = calcPhysicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { PddBonus: 500 } } }),
    );
    expect(withBonus.max).toBeLessThan(withoutBonus.max);
  });

  it("PowerUpPercent 200은 최종 데미지를 대략 2배로 스케일(클램프 미적용 구간)", () => {
    const base = calcPhysicalTakenDamage(baseCtx());
    const boosted = calcPhysicalTakenDamage(
      baseCtx({ character: { ...baseCtx().character, tempStats: { PowerUpPercent: 200 } } }),
    );
    expect(boosted.max).toBeCloseTo(base.max * 2, -1); // 소수점 반올림/floor 오차 허용
  });
});

describe("calcPhysicalTakenDamage — 한계치(limits)", () => {
  it("MaxDamage로 최종 데미지가 clamp됨", () => {
    const uncapped = calcPhysicalTakenDamage(baseCtx());
    const capped = calcPhysicalTakenDamage(baseCtx({ limits: { MaxDamage: 100 } }));
    expect(uncapped.max).toBeGreaterThan(100);
    expect(capped.max).toBe(100);
    expect(capped.min).toBe(100);
  });

  it("MaxPad로 몬스터 공격력 자체가 clamp되어 데미지가 줄어듦", () => {
    const uncapped = calcPhysicalTakenDamage(baseCtx({ mob: { level: 100, templatePADamage: 2000, templateMADamage: 0 } }));
    const capped = calcPhysicalTakenDamage(
      baseCtx({ mob: { level: 100, templatePADamage: 2000, templateMADamage: 0 }, limits: { MaxPad: 500 } }),
    );
    expect(capped.max).toBeLessThan(uncapped.max);
  });
});
