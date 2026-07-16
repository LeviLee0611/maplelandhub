import { describe, expect, it } from "vitest";
import { classifyOption } from "@/lib/calculators/cubeBuilder";
import cubeIndexJson from "@data/planet/cube-index.json";
import type { CubeIndexData } from "@/types/cube";

// classifyOption이 실제 데이터 전체(수상한+미라클, 317개 엔트리)에 대해 빠짐없이/틀림없이 분류하는지
// 자동으로 감사한다. cube-data.js가 나중에 바뀌어도(예: 주간 패치 체크 에이전트가 신규 옵션 추가) 이
// 테스트가 "분류표에 없는 새 텍스트 패턴"을 잡아준다.
const cubeData = cubeIndexJson as unknown as CubeIndexData;
const allEntries = [...cubeData.suspicious, ...cubeData.miracle];

// 실제로 데미지/스펙에 영향을 줄 법한 키워드가 텍스트에 있는데 분류 결과가 빈 배열(잡옵 취급)이면
// 분류표 누락일 가능성이 높다 — 다만 이 키워드들은 "그 자체론 스펙 무관"인 옵션에도 등장할 수 있어서
// (예: "공격 시 X% 확률로 몬스터 방어율 무시" 같은 확률부 옵션은 우리도 반영하지만, "공격 시 X% 확률로
// HP 회복"처럼 "공격"이 들어가되 무관한 것도 있음) 화이트리스트가 아니라 수동 검토용 신호로만 쓴다.
const SUSPICIOUS_KEYWORDS = ["데미지", "공격력", "마력", "크리티컬", "방어율"];

describe("classifyOption — 실데이터 감사(2026-07-16)", () => {
  it("모든 317개 엔트리를 예외 없이 분류한다(크래시 없음)", () => {
    expect(allEntries.length).toBe(317);
    for (const entry of allEntries) {
      expect(() => classifyOption(entry, 150)).not.toThrow();
    }
  });

  it("데미지/스펙 관련 키워드가 있는데 잡옵으로 분류된 텍스트가 없다(분류표 누락 감지)", () => {
    // "받는 데미지를 무시/경감"하는 방어형 프록은 "데미지"라는 단어가 들어가지만 공격력 스펙과 무관 —
    // 실제로 검토 완료된 잡옵이라 오탐(false positive) 방지용으로 명시적으로 제외한다(2026-07-16 검증).
    const KNOWN_DEFENSIVE_JUNK = ["피격 시", "무시"];
    const missed: string[] = [];
    for (const entry of allEntries) {
      const deltas = classifyOption(entry, 150);
      if (deltas.length > 0) continue;
      const hasKeyword = SUSPICIOUS_KEYWORDS.some((kw) => entry.text.includes(kw));
      const isKnownDefensiveJunk = KNOWN_DEFENSIVE_JUNK.every((kw) => entry.text.includes(kw));
      if (hasKeyword && !isKnownDefensiveJunk) missed.push(`optionType=${entry.optionType} text="${entry.text}"`);
    }
    expect(missed, `분류표 누락 의심 항목:\n${missed.join("\n")}`).toEqual([]);
  });

  it("분류된 델타의 value가 전부 유한한 숫자다(값 매핑 실수 감지)", () => {
    const bad: string[] = [];
    for (const entry of allEntries) {
      for (const delta of classifyOption(entry, 150)) {
        if (!Number.isFinite(delta.value)) {
          bad.push(`id=${entry.id} text="${entry.text}" kind=${delta.kind} value=${delta.value}`);
        }
      }
    }
    expect(bad, `비정상 값:\n${bad.join("\n")}`).toEqual([]);
  });

  it("스탯(stat) 델타는 실제 STR/DEX/INT/LUK 텍스트와 일치하는 stat 필드를 가진다", () => {
    const mismatches: string[] = [];
    const prefixToStat: Record<string, string> = { STR: "str", DEX: "dex", INT: "int", LUK: "luk" };
    for (const entry of allEntries) {
      for (const delta of classifyOption(entry, 150)) {
        if (delta.kind !== "stat") continue;
        if (entry.text.startsWith("올스탯")) continue; // 4개 다 나오는 게 정상
        const expectedPrefix = Object.keys(prefixToStat).find((p) => entry.text.startsWith(`${p} :`));
        if (expectedPrefix && prefixToStat[expectedPrefix] !== delta.stat) {
          mismatches.push(`id=${entry.id} text="${entry.text}" got stat=${delta.stat}, expected=${prefixToStat[expectedPrefix]}`);
        }
      }
    }
    expect(mismatches, `스탯 매핑 불일치:\n${mismatches.join("\n")}`).toEqual([]);
  });

  it("보스뎀/총뎀 엔트리가 텍스트 접두어와 정확히 일치하는 kind로 분류된다", () => {
    const mismatches: string[] = [];
    for (const entry of allEntries) {
      const deltas = classifyOption(entry, 150);
      const bossDelta = deltas.find((d) => d.kind === "bossDamage");
      const totalDelta = deltas.find((d) => d.kind === "totalDamage");
      if (entry.text.startsWith("보스 공격 시 데미지") && !bossDelta) {
        mismatches.push(`id=${entry.id} "${entry.text}" 는 보스뎀이어야 하는데 아님`);
      }
      if (entry.text.startsWith("총 데미지") && !totalDelta) {
        mismatches.push(`id=${entry.id} "${entry.text}" 는 총뎀이어야 하는데 아님`);
      }
    }
    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });
});
