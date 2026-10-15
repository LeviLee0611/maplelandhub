import { describe, expect, it } from "vitest";

import { planetMonsterIndex } from "@/lib/data/monster-detail.planet";
import { getMonsterDetail, getReleasedMonsterCodes, isThinMonsterPage } from "@/lib/data/monster-detail";

/**
 * 플래닛 몬스터 상세(2026-10-15 복구, edge 동적 라우트) 회귀 테스트.
 * 플래닛 전용 모듈(monster-detail.planet.ts)과 묶음 모듈(monster-detail.ts)의 플래닛 결과가 같아야 한다 —
 * 둘이 갈라지면 sitemap(묶음)과 실제 페이지(전용)가 다른 몬스터를 가리킨다.
 */

describe("플래닛 몬스터 상세", () => {
  it("전용 모듈과 묶음 모듈이 같은 몬스터 집합을 돌려준다", () => {
    expect(planetMonsterIndex.getReleasedMonsterCodes()).toEqual(getReleasedMonsterCodes("planet"));
  });

  it("머쉬맘이 플래닛 드랍(planet-helper 보강분 포함)과 함께 나온다", () => {
    // 쇼와마을(9400xxx)은 플래닛 release-filter 에서 9000000 이상이라 막혀 있다 — 여기선 머쉬맘으로 본다.
    const detail = planetMonsterIndex.getMonsterDetail(6130101);
    expect(detail?.monster).toMatchObject({ name: "머쉬맘", level: 60 });
    expect(detail?.drops.length ?? 0).toBeGreaterThan(10);
    expect(detail).toEqual(getMonsterDetail(6130101, "planet"));
  });

  it("메랜 전용 몬스터(말레이시아)는 플래닛 페이지가 없다", () => {
    expect(planetMonsterIndex.getMonsterDetail(9420527)).toBeNull();
  });

  it("얇은 페이지 판정이 두 모듈에서 일치한다", () => {
    for (const code of planetMonsterIndex.getReleasedMonsterCodes().slice(0, 200)) {
      expect(planetMonsterIndex.isThinMonsterPage(code), String(code)).toBe(isThinMonsterPage(code, "planet"));
    }
  });
});
