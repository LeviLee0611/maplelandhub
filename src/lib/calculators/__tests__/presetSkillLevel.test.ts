import { describe, expect, it } from "vitest";
import { normalizePresetSkillLevel } from "../onehit";

// 서버별 정령의 축복 상한 (onehit-calculator-client.tsx의 SPIRIT_BLESSING_BY_SERVER와 동일)
const SPIRIT_MAX = { mapleland: 20, planet: 22 };

describe("normalizePresetSkillLevel", () => {
  it("옛 상한(200) 시절 저장값을 현재 서버 상한으로 잘라낸다", () => {
    expect(normalizePresetSkillLevel(200, SPIRIT_MAX.planet)).toBe(22);
    expect(normalizePresetSkillLevel(200, SPIRIT_MAX.mapleland)).toBe(20);
    expect(normalizePresetSkillLevel(150, SPIRIT_MAX.planet)).toBe(22);
  });

  it("정상 범위 값은 그대로 둔다", () => {
    expect(normalizePresetSkillLevel(0, SPIRIT_MAX.planet)).toBe(0);
    expect(normalizePresetSkillLevel(11, SPIRIT_MAX.planet)).toBe(11);
    expect(normalizePresetSkillLevel(22, SPIRIT_MAX.planet)).toBe(22);
  });

  it("음수는 0으로 올린다", () => {
    expect(normalizePresetSkillLevel(-1, SPIRIT_MAX.planet)).toBe(0);
    expect(normalizePresetSkillLevel(-9999, SPIRIT_MAX.planet)).toBe(0);
  });

  it("소수는 내림해 정수 스킬 레벨로 만든다", () => {
    expect(normalizePresetSkillLevel(10.9, SPIRIT_MAX.planet)).toBe(10);
    expect(normalizePresetSkillLevel(0.5, SPIRIT_MAX.planet)).toBe(0);
    expect(normalizePresetSkillLevel(22.9, SPIRIT_MAX.planet)).toBe(22);
  });

  it("숫자가 아니거나 유효하지 않은 값은 0으로 처리한다", () => {
    expect(normalizePresetSkillLevel(undefined, SPIRIT_MAX.planet)).toBe(0);
    expect(normalizePresetSkillLevel(null, SPIRIT_MAX.planet)).toBe(0);
    expect(normalizePresetSkillLevel("22", SPIRIT_MAX.planet)).toBe(0);
    expect(normalizePresetSkillLevel(NaN, SPIRIT_MAX.planet)).toBe(0);
    expect(normalizePresetSkillLevel(Infinity, SPIRIT_MAX.planet)).toBe(0);
  });

  it("해당 서버가 지원하지 않는 버프(상한 undefined)는 0으로 처리한다", () => {
    // 여제의 축복은 메랜엔 없음 — 저장값이 남아있어도 계산에 들어가지 않아야 한다.
    expect(normalizePresetSkillLevel(12, undefined)).toBe(0);
    expect(normalizePresetSkillLevel(200, undefined)).toBe(0);
  });
});
