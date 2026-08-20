import { describe, expect, it } from "vitest";
import {
  applyDropRateMultiplierToItemDetailBy,
  applyDropRateMultiplierToRewardMap,
  applyItemOverrides,
  applyMonsterOverrides,
  appendNewMonsters,
  clampProbability,
  decodeAttributeCode,
} from "../build-planet-data.mjs";

describe("decodeAttributeCode", () => {
  it("decodes element+state codes into 한글 라벨", () => {
    expect(decodeAttributeCode("I2F3")).toEqual(["얼음 반감", "불 약점"]);
  });

  it("빈 문자열/undefined는 빈 배열", () => {
    expect(decodeAttributeCode("")).toEqual([]);
    expect(decodeAttributeCode(undefined)).toEqual([]);
  });
});

describe("clampProbability", () => {
  it("0~1 범위로 clamp", () => {
    expect(clampProbability(-0.5)).toBe(0);
    expect(clampProbability(1.5)).toBe(1);
    expect(clampProbability(0.42)).toBe(0.42);
  });

  it("숫자가 아니면 그대로 반환", () => {
    expect(clampProbability(undefined)).toBeUndefined();
    expect(clampProbability("x")).toBe("x");
  });
});

describe("applyDropRateMultiplierToRewardMap / applyDropRateMultiplierToItemDetailBy", () => {
  it("prob에 배율을 곱하고 1.0을 넘지 않게 clamp", () => {
    const rewardMap = {
      "1000": [{ itemId: 1, prob: 0.1 }, { itemId: 2, prob: 0.5 }],
    };
    const result = applyDropRateMultiplierToRewardMap(rewardMap, 4);
    expect(result["1000"][0].prob).toBe(0.4);
    expect(result["1000"][1].prob).toBe(1); // 0.5*4=2.0 -> clamp 1
  });

  it("prob 필드가 없는 항목은 그대로 통과", () => {
    const rewardMap = { "1000": [{ itemId: 1 }] };
    const result = applyDropRateMultiplierToRewardMap(rewardMap, 4);
    expect(result["1000"][0]).toEqual({ itemId: 1 });
  });

  it("itemsByItemId에도 동일하게 배율 반영", () => {
    const itemDetailBy = { itemsByItemId: { "2000": [{ mobId: 1, prob: 0.2 }] }, source: "mapleland" };
    const result = applyDropRateMultiplierToItemDetailBy(itemDetailBy, 4);
    expect(result.itemsByItemId["2000"][0].prob).toBe(0.8);
  });
});

describe("applyMonsterOverrides — `_`-prefix 필드 leak 방지 회귀 테스트", () => {
  const monsters = [{ mobCode: 1, name: "테스트몹", hp: 100, exp: 10 }];

  it("override 필드는 반영되지만 `_`로 시작하는 메타 필드는 결과에 남지 않아야 함", () => {
    const overrides = {
      1: { _source: "어떤 근거 설명", exp: 999 },
    };
    const result = applyMonsterOverrides(monsters, overrides);
    expect(result[0].exp).toBe(999);
    expect(result[0]).not.toHaveProperty("_source");
  });

  it("오버라이드가 없는 몬스터는 그대로 유지", () => {
    const result = applyMonsterOverrides(monsters, { 999: { exp: 1 } });
    expect(result[0]).toEqual(monsters[0]);
  });

  it("monsterOverrides가 비어있으면 원본 배열을 그대로 반환", () => {
    expect(applyMonsterOverrides(monsters, {})).toBe(monsters);
  });
});

describe("appendNewMonsters — `_`-prefix 필드 leak 방지 + 검증 로직", () => {
  const REQUIRED = { name: "무루", level: 1, hp: 1, exp: 1, acc: 0, eva: 0, needAcc: 0, def: 0, mDef: 0, ele: ["무속성"] };

  it("정상 항목은 추가되고 `_source` 같은 메타 필드는 결과에서 빠짐", () => {
    const entry = { ...REQUIRED, mobCode: 100130, _source: "출처 설명" };
    const result = appendNewMonsters([], [entry]);
    expect(result).toHaveLength(1);
    expect(result[0].mobCode).toBe(100130);
    expect(result[0]).not.toHaveProperty("_source");
  });

  it("_example 템플릿 항목은 건너뜀", () => {
    const result = appendNewMonsters([], [{ _example: true, mobCode: 1 }]);
    expect(result).toHaveLength(0);
  });

  it("필수 필드가 빠진 항목은 건너뜀", () => {
    const result = appendNewMonsters([], [{ name: "누락몹", mobCode: 999 }]);
    expect(result).toHaveLength(0);
  });

  it("이미 존재하는 mobCode는 건너뜀(덮어쓰기는 monsterOverrides 몫)", () => {
    const existing = [{ mobCode: 100130, name: "기존몹" }];
    const entry = { ...REQUIRED, mobCode: 100130, name: "새 이름 시도" };
    const result = appendNewMonsters(existing, [entry]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("기존몹");
  });
});

describe("applyItemOverrides", () => {
  it("itemId로 매칭되는 필드를 덮어씀", () => {
    const items = [{ id: 5, name: "구 아이템" }];
    const result = applyItemOverrides(items, { 5: { name: "신 아이템" } });
    expect(result[0].name).toBe("신 아이템");
  });

  it("매칭 안 되면 원본 유지", () => {
    const items = [{ id: 5, name: "구 아이템" }];
    const result = applyItemOverrides(items, { 999: { name: "무관" } });
    expect(result[0].name).toBe("구 아이템");
  });
});
