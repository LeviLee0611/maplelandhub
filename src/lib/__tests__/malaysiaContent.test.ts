import { describe, expect, it } from "vitest";

import { getMonsterDetail, getReleasedMonsterCodes } from "@/lib/data/monster-detail";
import dropIndex from "@data/drop-index.json";

/**
 * 메랜 2026-10-08 패치 "말레이시아" 반영 회귀 테스트 (scripts/import-malaysia-content.mjs).
 * 9420xxx 대역은 release-filter 의 blockedMobCodeMin(9000000)에 걸리므로 allowedMobCodes 에 넣어야
 * 노출된다 — 필터가 재생성되면 조용히 사라질 수 있어 여기서 고정한다.
 */

const FIELD_MONSTERS = [9420527, 9420528, 9420529, 9420530, 9420531, 9420532, 9420533, 9420534, 9420535, 9420536, 9420537, 9420538, 9420539, 9420540];

describe("말레이시아 콘텐츠", () => {
  it("필드 몬스터 14종이 메랜에 노출되고 드롭·맵을 갖는다", () => {
    const released = new Set(getReleasedMonsterCodes("mapleland"));
    for (const code of FIELD_MONSTERS) {
      expect(released.has(code), String(code)).toBe(true);
      const detail = getMonsterDetail(code, "mapleland");
      expect(detail?.drops.length ?? 0, String(code)).toBeGreaterThan(0);
      expect(detail?.maps.length ?? 0, String(code)).toBeGreaterThan(0);
    }
    expect(getMonsterDetail(9420527, "mapleland")?.monster).toMatchObject({ name: "클로로트랩", level: 45, hp: 2600 });
  });

  it("말레이시아는 플래닛엔 없다", () => {
    const released = new Set(getReleasedMonsterCodes("planet"));
    for (const code of FIELD_MONSTERS) expect(released.has(code), String(code)).toBe(false);
  });

  it("혼돈의 주문서 60%의 드롭처가 연결돼 있다", () => {
    const monsters = (dropIndex as { monstersByItemId: Record<string, Array<{ mobId: number }>> }).monstersByItemId["2049100"] ?? [];
    const mobIds = new Set(monsters.map((m) => m.mobId));
    // 패치노트 드롭처 중 대표 몇 종: 발록(기존), 핑크빈, 자쿰(3페이즈), 분노한 타르가, 주니어 네키
    for (const code of [8830000, 8820001, 8800002, 9420544, 2130103]) expect(mobIds.has(code), String(code)).toBe(true);
    expect(monsters.length).toBeGreaterThanOrEqual(35);
  });
});
