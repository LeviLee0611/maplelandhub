import { describe, expect, it } from "vitest";

import { getMonsterDetail } from "@/lib/data/monster-detail";
import planetDropIndex from "@data/planet/drop-index.json";
import planetMonsters from "@data/planet/monsters.json";
import additions from "../../../scripts/sources/planet/planet-helper-drop-additions.json";

/**
 * planet-helper.com 드롭 보강(2026-10-06) 회귀 테스트.
 *
 * 근거 파일 scripts/sources/planet/planet-helper-drop-additions.json 을 build-planet-data.mjs 가
 * dropRate 배율 **뒤**에 얹는다. 여기서 지키는 것:
 *   - 근거 파일의 쌍이 산출물에 그대로 들어가 있다 (빌드 순서가 바뀌어 배율이 또 곱해지면 prob 가 달라진다)
 *   - 몬스터 카드(4030012)는 드롭표에 들어가지 않는다 (플래닛 카드 시스템 아이템, 지원 여부 미결정)
 *   - 드롭이 0개였던 레드 슬라임(7120103) 같은 몬스터가 상세 페이지에서 드롭을 갖는다
 *   - 쇼와마을 스탯이 빅뱅 전 값으로 바뀌어 있다 (이전엔 빅뱅 후 GMS 값 Lv166~170 이었다)
 */

type DropEntry = { itemId: number; prob?: number };
type Additions = { dropsByMonsterId: Record<string, { drops: Array<{ itemId: number; prob: number }> }> };

describe("planet-helper 드롭 보강", () => {
  const byMonster = (planetDropIndex as { dropsByMonsterId: Record<string, DropEntry[]> }).dropsByMonsterId;
  const source = (additions as Additions).dropsByMonsterId;

  it("근거 파일의 모든 쌍이 배율 없이 그대로 들어가 있다", () => {
    const missing: string[] = [];
    for (const [mobCode, group] of Object.entries(source)) {
      const have = new Map((byMonster[mobCode] ?? []).map((d) => [d.itemId, d.prob]));
      for (const d of group.drops) {
        const prob = have.get(d.itemId);
        if (prob === undefined || Math.abs(prob - Math.min(1, d.prob)) > 1e-9) missing.push(`${mobCode}/${d.itemId}`);
      }
    }
    expect(missing.slice(0, 10)).toEqual([]);
    expect(Object.keys(source).length).toBeGreaterThan(300);
  });

  it("몬스터 카드는 드롭표에 없다", () => {
    const offenders = Object.entries(byMonster).filter(([, drops]) => drops.some((d) => d.itemId === 4030012));
    expect(offenders.map(([code]) => code)).toEqual([]);
  });

  it("드롭이 비어 있던 레드 슬라임이 상세 페이지에서 드롭을 갖는다", () => {
    const detail = getMonsterDetail(7120103, "planet");
    expect(detail).not.toBeNull();
    // planet-helper 에는 54개가 있지만 49개가 "후보" 표시라 규칙대로 5개만 들어간다.
    expect(detail!.drops.length).toBeGreaterThanOrEqual(5);
    expect(detail!.drops.some((d) => d.name === "레드슬라임의 액체")).toBe(true);
  });

  it("쇼와마을 스탯이 빅뱅 전 값이다", () => {
    const byCode = new Map((planetMonsters as Array<{ mobCode: number; level: number; hp: number }>).map((m) => [m.mobCode, m]));
    expect(byCode.get(9400122)).toMatchObject({ level: 95, hp: 85000 }); // 두목
    expect(byCode.get(9400100)).toMatchObject({ level: 120, hp: 90000 }); // 수하A
    expect(byCode.get(9400121)).toMatchObject({ level: 130, hp: 75000000 }); // 여두목
  });
});
