import { describe, expect, it, vi } from "vitest";
import {
  estimateCombinedOptionOdds,
  estimateGradeUpExpectedUses,
  estimateOptionOdds,
  levelBracket,
  rollCubeResult,
  rollOverallGrade,
} from "@/lib/calculators/cubeSimulator";
import type { CubeOptionEntry } from "@/types/cube";

function makeLevelTable(valueForBracket: (bracket: number) => number): Record<string, Record<string, number>> {
  const table: Record<string, Record<string, number>> = {};
  for (let i = 1; i <= 20; i += 1) {
    table[String(i)] = { incSTR: valueForBracket(i) };
  }
  return table;
}

function makeEntry(overrides: Partial<CubeOptionEntry> = {}): CubeOptionEntry {
  return {
    id: 1,
    grade: 0,
    weight: 20,
    optionType: 0,
    reqLevel: 0,
    text: "STR : +#incSTR",
    level: makeLevelTable((bracket) => bracket),
    ...overrides,
  };
}

// 등급별로 엔트리가 정확히 1개씩만 있는 풀 — pickWeighted가 항상 그 등급의 유일한 옵션을 고르므로,
// 테스트에서 Math.random을 목(mock)해도 "이탈 확률" 판정에만 영향을 주도록 격리한다.
function makeGradedPool(): CubeOptionEntry[] {
  return [0, 1, 2, 3, 4].map((grade) => makeEntry({ id: grade + 1, grade, text: `등급${grade} : +#incSTR` }));
}

describe("levelBracket", () => {
  it("maps item level 1-10 to bracket 1", () => {
    expect(levelBracket(1)).toBe("1");
    expect(levelBracket(10)).toBe("1");
  });

  it("maps item level 11-20 to bracket 2", () => {
    expect(levelBracket(11)).toBe("2");
    expect(levelBracket(20)).toBe("2");
  });

  it("maps item level 101 to bracket 11", () => {
    expect(levelBracket(101)).toBe("11");
  });

  it("clamps at bracket 20 for level 191 and above", () => {
    expect(levelBracket(191)).toBe("20");
    expect(levelBracket(200)).toBe("20");
    expect(levelBracket(250)).toBe("20");
  });

  it("clamps at bracket 1 for level 0 or below", () => {
    expect(levelBracket(0)).toBe("1");
  });
});

describe("rollOverallGrade", () => {
  it("stays at rare when every escalation roll fails", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(rollOverallGrade()).toBe(1);
    randomSpy.mockRestore();
  });

  it("escalates all the way to legendary when every escalation roll succeeds", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    expect(rollOverallGrade()).toBe(4);
    randomSpy.mockRestore();
  });

  it("stops at epic when only the first escalation roll succeeds", () => {
    const randomSpy = vi.spyOn(Math, "random")
      .mockReturnValueOnce(0) // 레어 -> 에픽 성공
      .mockReturnValueOnce(0.99); // 에픽 -> 유니크 실패
    expect(rollOverallGrade()).toBe(2);
    randomSpy.mockRestore();
  });
});

describe("rollCubeResult", () => {
  it("always sets the first line's grade to the overall grade", () => {
    const pool = makeGradedPool();
    const result = rollCubeResult(pool, 70, "suspicious", 4);
    expect(result.overallGrade).toBe(4);
    expect(result.lines[0]?.grade).toBe(4);
  });

  it("drops the 2nd/3rd line one tier when the deviation roll fails", () => {
    const pool = makeGradedPool();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99); // 이탈 실패 -> 한 단계 낮은 등급
    const result = rollCubeResult(pool, 70, "suspicious", 3);
    randomSpy.mockRestore();

    expect(result.lines[0]?.grade).toBe(3);
    expect(result.lines[1]?.grade).toBe(2);
    expect(result.lines[2]?.grade).toBe(2);
  });

  it("keeps the 2nd/3rd line at the overall grade when the deviation roll succeeds", () => {
    const pool = makeGradedPool();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0); // 이탈 성공 -> 표기 등급 유지
    const result = rollCubeResult(pool, 70, "suspicious", 3);
    randomSpy.mockRestore();

    expect(result.lines[1]?.grade).toBe(3);
    expect(result.lines[2]?.grade).toBe(3);
  });

  it("uses the same deviation chance for both cube types (공식 확인: 수상한=미라클)", () => {
    const pool = makeGradedPool();
    // 두 큐브 모두 2번째줄 이탈확률이 10%로 동일 — 0.15는 둘 다 이탈 실패(한 단계 하락)해야 함
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.15);
    const suspicious = rollCubeResult(pool, 70, "suspicious", 3);
    const miracle = rollCubeResult(pool, 70, "miracle", 3);
    randomSpy.mockRestore();

    expect(suspicious.lines[1]?.grade).toBe(2);
    expect(miracle.lines[1]?.grade).toBe(2);
  });

  it("keeps every line at grade 0 when the overall grade is normal (no lower tier exists)", () => {
    const pool = makeGradedPool();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);
    const result = rollCubeResult(pool, 70, "suspicious", 0);
    randomSpy.mockRestore();

    expect(result.lines.every((line) => line.grade === 0)).toBe(true);
  });

  it("returns an empty lines array for an empty pool", () => {
    const result = rollCubeResult([], 70, "suspicious", 2);
    expect(result.lines).toEqual([]);
    expect(result.overallGrade).toBe(2);
  });

  it("picks a random overall grade when no fixed grade is given", () => {
    const pool = makeGradedPool();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99); // 모든 상승 실패 -> 레어(1) 고정
    const result = rollCubeResult(pool, 70, "suspicious");
    randomSpy.mockRestore();

    expect(result.overallGrade).toBe(1);
  });
});

describe("estimateOptionOdds", () => {
  it("returns null when the target entry id doesn't exist in the pool", () => {
    const pool = makeGradedPool();
    expect(estimateOptionOdds(pool, 70, "suspicious", 9999)).toBeNull();
  });

  it("gives a near-certain probability for a rare-grade option (line 1 covers it 94% of the time alone)", () => {
    const pool = makeGradedPool();
    const rareEntry = pool.find((entry) => entry.grade === 1)!;
    const odds = estimateOptionOdds(pool, 70, "suspicious", rareEntry.id)!;

    expect(odds.probabilityPerUse).toBeCloseTo(0.99886108, 6);
    expect(odds.expectedUses).toBeCloseTo(1.00114, 4);
  });

  it("gives a very low probability for a legendary-grade option (only reachable via a 0.0000324% overall roll)", () => {
    const pool = makeGradedPool();
    const legendaryEntry = pool.find((entry) => entry.grade === 4)!;
    const odds = estimateOptionOdds(pool, 70, "suspicious", legendaryEntry.id)!;

    expect(odds.probabilityPerUse).toBeCloseTo(0.00000324, 8);
    expect(odds.expectedUses).toBeCloseTo(308_641.98, 0);
  });

  it("scales down probability proportionally to the option's own weight share within its grade", () => {
    const heavy = makeEntry({ id: 10, grade: 1, weight: 20 });
    const light = makeEntry({ id: 11, grade: 1, weight: 20 });
    const pool = [heavy, light];

    const heavyOdds = estimateOptionOdds(pool, 70, "suspicious", heavy.id)!;
    // 같은 등급 안에 가중치가 동일한 옵션이 2개 있으므로, 등급 내 선택 확률은 각각 50%.
    expect(heavyOdds.probabilityPerUse).toBeCloseTo(0.53828747, 6);
  });

  it("returns 0 probability for an option whose reqLevel isn't met, even when other options at that grade are eligible", () => {
    // 회귀 테스트: withinGradeProb 분자가 target.weight를 그대로 쓰면서 target이 실제로는
    // eligiblePoolAtGrade 후보에서 빠져 있는데도 0이 아닌 확률을 내던 버그.
    const tooHighLevel = makeEntry({ id: 20, grade: 1, weight: 20, reqLevel: 100, text: "레벨 제한 옵션" });
    const alwaysEligible = makeEntry({ id: 21, grade: 1, weight: 20, reqLevel: 0, text: "기본 옵션" });
    const pool = [tooHighLevel, alwaysEligible];

    const odds = estimateOptionOdds(pool, 70, "suspicious", tooHighLevel.id)!;
    expect(odds.probabilityPerUse).toBeCloseTo(0, 10);
  });
});

describe("estimateCombinedOptionOdds", () => {
  it("returns null when any target entry id doesn't exist in the pool", () => {
    const pool = makeGradedPool();
    const rareEntry = pool.find((entry) => entry.grade === 1)!;
    expect(estimateCombinedOptionOdds(pool, 70, "suspicious", [rareEntry.id, 9999])).toBeNull();
  });

  it("falls back to the single-option probability when only one target is given", () => {
    const pool = makeGradedPool();
    const rareEntry = pool.find((entry) => entry.grade === 1)!;
    const single = estimateOptionOdds(pool, 70, "suspicious", rareEntry.id)!;
    const combined = estimateCombinedOptionOdds(pool, 70, "suspicious", [rareEntry.id])!;

    expect(combined.combinedProbabilityPerUse).toBeCloseTo(single.probabilityPerUse, 10);
    expect(combined.perOptionProbability.get(rareEntry.id)).toBeCloseTo(single.probabilityPerUse, 10);
  });

  it("computes the joint probability of two distinct-grade options appearing together in one use", () => {
    const pool = makeGradedPool();
    const normalEntry = pool.find((entry) => entry.grade === 0)!;
    const rareEntry = pool.find((entry) => entry.grade === 1)!;
    const combined = estimateCombinedOptionOdds(pool, 70, "suspicious", [rareEntry.id, normalEntry.id])!;

    expect(combined.combinedProbabilityPerUse).toBeCloseTo(0.93906, 5);
    expect(combined.expectedUses).toBeCloseTo(1.06489, 4);
  });

  it("computes the joint probability for three targets, two of which share a grade and split its weight", () => {
    const first = makeEntry({ id: 30, grade: 0, weight: 20, text: "일반 A" });
    const second = makeEntry({ id: 31, grade: 0, weight: 20, text: "일반 B" });
    const third = makeEntry({ id: 32, grade: 1, weight: 20, text: "레어 A" });
    const pool = [first, second, third];

    const combined = estimateCombinedOptionOdds(pool, 70, "suspicious", [first.id, second.id, third.id])!;
    expect(combined.combinedProbabilityPerUse).toBeCloseTo(0.41877, 5);
    expect(combined.expectedUses).toBeCloseTo(2.38795, 4);
  });

  it("gives a much smaller, sane expected value when fixedOverallGrade assumes the grade is already reached", () => {
    // 레전드리 등급 옵션을 고르면(등급업 확률까지 섞여) 기댓값이 천문학적으로 커지는데,
    // "이미 레전드리라고 가정"하면 등급 내 옵션 재설정 비용만 남아 훨씬 현실적인 숫자가 나와야 한다.
    const pool = makeGradedPool();
    const legendaryEntry = pool.find((entry) => entry.grade === 4)!;

    const fromScratch = estimateOptionOdds(pool, 70, "suspicious", legendaryEntry.id)!;
    const alreadyLegendary = estimateOptionOdds(pool, 70, "suspicious", legendaryEntry.id, 4)!;

    expect(alreadyLegendary.probabilityPerUse).toBeCloseTo(1, 10);
    expect(alreadyLegendary.expectedUses).toBeCloseTo(1, 6);
    expect(alreadyLegendary.expectedUses).toBeLessThan(fromScratch.expectedUses);
  });

  it("applies fixedOverallGrade to estimateCombinedOptionOdds the same way", () => {
    const pool = makeGradedPool();
    const normalEntry = pool.find((entry) => entry.grade === 0)!;
    const rareEntry = pool.find((entry) => entry.grade === 1)!;

    const combined = estimateCombinedOptionOdds(pool, 70, "suspicious", [rareEntry.id, normalEntry.id], 1)!;
    // og가 1로 고정되면 1번째 줄은 항상 레어(target 중 하나)와 일치하므로 확률이 사실상 1에 가까워야 한다.
    expect(combined.combinedProbabilityPerUse).toBeGreaterThan(0.9);
  });

  it("treats the same entry id chosen twice as requiring that option on at least 2 of the 3 lines", () => {
    const pool = makeGradedPool();
    const rareEntry = pool.find((entry) => entry.grade === 1)!;

    // og를 1(레어)로 고정 — 1번째 줄은 항상 일치(확률 1), 2번째 줄은 0.1, 3번째 줄은 0.01로 일치.
    // "2줄 이상 일치" = 1 - P(2번째, 3번째 둘 다 실패) = 1 - 0.9*0.99 = 0.109.
    const combined = estimateCombinedOptionOdds(pool, 70, "suspicious", [rareEntry.id, rareEntry.id], 1)!;

    expect(combined.combinedProbabilityPerUse).toBeCloseTo(0.109, 6);
    expect(combined.perOptionProbability.get(rareEntry.id)).toBeCloseTo(0.109, 6);
    // 예전의 Set 기반 중복 제거였다면 "1줄 이상 일치"(사실상 1에 가까움)로 잘못 계산됐을 값과는 확연히 다름.
    expect(combined.combinedProbabilityPerUse).toBeLessThan(0.9);
  });
});

describe("estimateGradeUpExpectedUses", () => {
  it("sums the reciprocal of each step's probability from rare all the way to legendary", () => {
    const expected = 1 / 0.06 + 1 / 0.018 + 1 / 0.003;
    expect(estimateGradeUpExpectedUses(1, 4)).toBeCloseTo(expected, 6);
  });

  it("only counts the remaining steps when starting from a higher grade", () => {
    expect(estimateGradeUpExpectedUses(3, 4)).toBeCloseTo(1 / 0.003, 6);
    expect(estimateGradeUpExpectedUses(2, 4)).toBeCloseTo(1 / 0.018 + 1 / 0.003, 6);
  });

  it("returns 0 when already at the target grade", () => {
    expect(estimateGradeUpExpectedUses(4, 4)).toBe(0);
  });
});
