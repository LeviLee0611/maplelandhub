import { describe, expect, it } from "vitest";

import { maplelandItemIndex } from "@/lib/data/item-detail.mapleland";
import { planetItemIndex } from "@/lib/data/item-detail.planet";
import { jobLabel, categoryLabels } from "@/lib/data/item-detail";

/**
 * 아이템 상세 페이지 데이터 조립(2026-10-13) 회귀 테스트.
 * 검색 유입용 페이지라 (1) 드랍 몬스터가 출시 필터를 통과한 것만 나오고 (2) 얇은 페이지 판정이
 * sitemap 과 noindex 양쪽에서 같은 함수를 쓰며 (3) 영문 분류가 그대로 새지 않는지를 지킨다.
 */

describe("아이템 상세 데이터", () => {
  it("혼돈의 주문서 60% — 드랍 몬스터가 확률 순으로 나오고 출현 맵이 붙는다", () => {
    const detail = maplelandItemIndex.getItemDetail(2049100);
    expect(detail).not.toBeNull();
    expect(detail!.item.name).toBe("혼돈의 주문서 60%");
    expect(detail!.sources.length).toBeGreaterThanOrEqual(30);
    const probs = detail!.sources.map((s) => s.prob ?? -1);
    expect([...probs].sort((a, b) => b - a)).toEqual(probs);
    expect(detail!.sources.some((s) => s.maps.length > 0)).toBe(true);
    expect(maplelandItemIndex.isThinItemPage(2049100)).toBe(false);
  });

  it("장비 아이템은 스펙 라벨이 한글이고 직업 비트마스크가 풀린다", () => {
    const detail = maplelandItemIndex.getItemDetail(1102024); // 검은색 가이아의 망토
    expect(detail?.labels).toMatchObject({ overall: "장비", category: "방어구", subCategory: "망토" });
    expect(jobLabel(0)).toBe("공용");
    expect(jobLabel(1)).toBe("전사");
    expect(jobLabel(9)).toBe("전사·도적");
    expect(jobLabel(16)).toBe("해적");
  });

  it("분류 표기에 영문이 남지 않는다", () => {
    const offenders: string[] = [];
    for (const id of maplelandItemIndex.getAllItemIds()) {
      const detail = maplelandItemIndex.getItemDetail(id)!;
      for (const v of Object.values(detail.labels)) {
        if (v && /[A-Za-z]/.test(v)) offenders.push(`${id}:${v}`);
      }
    }
    expect(offenders.slice(0, 10)).toEqual([]);
    // 표에 없는 분류가 "기타"로만 뭉개지는 것도 알아차려야 한다 — 새 subCategory 가 생기면 표를 보강할 것
    const unmapped = new Set<string>();
    for (const id of maplelandItemIndex.getAllItemIds()) {
      const d = maplelandItemIndex.getItemDetail(id)!;
      const sub = d.item.typeInfo?.subCategory;
      if (sub && !d.labels.subCategory) unmapped.add(sub);
    }
    expect([...unmapped].sort()).toEqual([]);
  });

  it("음수·synthetic 아이템은 페이지가 없다", () => {
    expect(maplelandItemIndex.getItemDetail(-377653517)).toBeNull();
    expect(maplelandItemIndex.getItemDetail(0)).toBeNull();
  });

  it("미출시 몬스터는 드랍처에 나오지 않는다", () => {
    // 플래닛엔 말레이시아가 없다 — 메랜 전용 몬스터(9420527 클로로트랩)는 플래닛 아이템 페이지에 못 나온다
    for (const id of planetItemIndex.getAllItemIds()) {
      const d = planetItemIndex.getItemDetail(id)!;
      expect(d.sources.some((s) => s.mobCode === 9420527), String(id)).toBe(false);
    }
  });

  it("색인 대상 수가 비정상적으로 줄면 알아차린다", () => {
    const m = maplelandItemIndex.getIndexableItemIds().length;
    const p = planetItemIndex.getIndexableItemIds().length;
    // 2026-10-13 기준 메랜 약 2,900 / 플래닛 약 3,000. 드랍 연결이 통째로 끊기면 급감한다.
    expect(m).toBeGreaterThan(2500);
    expect(p).toBeGreaterThan(2500);
    expect(categoryLabels({ id: 4000000, name: "x" }).overall).toBe("기타");
  });
});
