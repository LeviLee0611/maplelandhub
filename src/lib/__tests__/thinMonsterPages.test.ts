import { describe, expect, it } from "vitest";

import { getMonsterDetail, getReleasedMonsterCodes, isThinMonsterPage } from "@/lib/data/monster-detail";

/**
 * 내용이 없는 상세 페이지를 검색엔진에서 빼는 규칙의 회귀 테스트 (2026-10-01).
 *
 * 드롭도 출현 맵도 없는 몬스터가 51종 있다 — 자쿰팔, 카오스 혼테일의 부위, 발록의 손 같은
 * 보스 부위가 대부분으로, 데이터 누락이 아니라 원래 드롭이 없는 것들이다. 본문이 스탯표뿐이라
 * 색인되면 "얇은 페이지"로 보이므로 noindex + sitemap 제외 처리했다.
 *
 * 핵심은 **검색엔진에서만 빼고 사이트에서는 살려둔다**는 것이다. HP·방어력이 있어 한방컷·피격뎀
 * 계산기에서 쓰이기 때문에, 데이터 자체를 지우거나 release-filter 로 막으면 안 된다.
 */

describe("얇은 몬스터 페이지 판정", () => {
  it("드롭도 출현 맵도 없으면 얇은 페이지로 본다", () => {
    // 자쿰팔1 — 본체가 드롭을 갖고 팔은 갖지 않는 전형적인 보스 부위
    expect(isThinMonsterPage(8800003, "mapleland")).toBe(true);
    const detail = getMonsterDetail(8800003, "mapleland");
    expect(detail?.drops).toHaveLength(0);
    expect(detail?.maps).toHaveLength(0);
  });

  it("드롭이나 출현 맵이 하나라도 있으면 얇은 페이지가 아니다", () => {
    expect(isThinMonsterPage(100100, "mapleland")).toBe(false); // 달팽이 — 드롭·맵 둘 다 있음
    expect(isThinMonsterPage(3220000, "mapleland")).toBe(false); // 스텀피 — 드롭 52종
  });

  it("얇은 페이지도 데이터 자체는 살아 있어야 한다 (계산기에서 쓰므로)", () => {
    const detail = getMonsterDetail(8800003, "mapleland");
    expect(detail).not.toBeNull();
    expect(detail!.monster.hp).toBeGreaterThan(0);
    expect(detail!.monster.level).toBeGreaterThan(0);
  });

  it("없는 몬스터는 얇은 페이지로 처리한다", () => {
    expect(isThinMonsterPage(-1, "mapleland")).toBe(true);
  });

  it("얇은 페이지 비율이 비정상적으로 커지면 알아차릴 수 있어야 한다", () => {
    const codes = getReleasedMonsterCodes("mapleland");
    const thin = codes.filter((c) => isThinMonsterPage(c, "mapleland"));
    // 2026-10-01 기준 603종 중 51종. 데이터가 깨져 드롭 연결이 통째로 끊기면 이 수가 급증한다.
    expect(thin.length).toBeGreaterThan(0);
    expect(thin.length).toBeLessThan(codes.length * 0.2);
  });
});
