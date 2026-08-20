import { describe, expect, it } from "vitest";
import { getStandardPDD, STANDARD_PDD } from "@/lib/calculators/takenDamage/standardPdd";

describe("getStandardPDD", () => {
  it("정확히 일치하는 레벨은 테이블 값을 그대로 반환", () => {
    expect(getStandardPDD("warrior", 100)).toBe(STANDARD_PDD.warrior[100]);
    expect(getStandardPDD("magician", 30)).toBe(STANDARD_PDD.magician[30]);
  });

  it("테이블에 없는 레벨은 그 아래로 가장 가까운 브라켓 값을 사용", () => {
    // warrior 테이블: ...95:446, 100:494 — 96~99는 95 브라켓
    expect(getStandardPDD("warrior", 99)).toBe(STANDARD_PDD.warrior[95]);
    expect(getStandardPDD("warrior", 96)).toBe(STANDARD_PDD.warrior[95]);
  });

  it("테이블 최고 레벨을 넘어서면 최고 브라켓 값을 그대로 유지", () => {
    expect(getStandardPDD("warrior", 200)).toBe(STANDARD_PDD.warrior[100]);
  });

  it("테이블의 최저 레벨보다 낮으면 최저 브라켓 값으로 폴백", () => {
    // beginner 최저 키가 1 — 0 이하 레벨 입력해도 1번 브라켓 값 사용
    expect(getStandardPDD("beginner", 0)).toBe(STANDARD_PDD.beginner[1]);
  });

  it("직업별로 서로 다른 테이블을 참조", () => {
    expect(getStandardPDD("archer", 10)).toBe(STANDARD_PDD.archer[10]);
    expect(getStandardPDD("thief", 10)).toBe(STANDARD_PDD.thief[10]);
    expect(getStandardPDD("archer", 10)).not.toBe(getStandardPDD("thief", 10));
  });
});
