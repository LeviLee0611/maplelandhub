import type { Monster } from "@/types/monster";
import { createReleaseFilterer, type ReleaseFilters } from "@/lib/release-filter";

/**
 * 몬스터 상세 조립 로직 — **JSON 을 import 하지 않는 팩토리**.
 *
 * 2026-10-15에 monster-detail.ts 에서 분리했다. 플래닛 몬스터 페이지를 edge 동적 라우트로 만들면서
 * (아이템 페이지와 같은 이유 — item-detail.ts 머리 주석) 라우트마다 워커 번들에 서버 데이터가 실리게 됐는데,
 * monster-detail.ts 는 메랜·플래닛 JSON 을 모듈 상단에서 전부 import 해 그걸 쓰는 라우트는 두 서버 분(~9MB)을
 * 다 싣는다. 로직은 여기, JSON 은 서버별 모듈(monster-detail.ts = 메랜+플래닛 묶음, monster-detail.planet.ts =
 * 플래닛만)이 들고 온다.
 */

export type MonsterDrop = {
  itemId: number;
  name: string;
  prob?: number;
  min?: number;
  max?: number;
  category?: string;
};

export type MonsterSpawnMap = {
  mapCode: number;
  mapName: string;
};

export type MonsterDetail = {
  monster: Monster;
  drops: MonsterDrop[];
  maps: MonsterSpawnMap[];
  /** 같은 레벨대(±3) 다른 몬스터 — 내부 링크용 */
  related: Array<Pick<Monster, "mobCode" | "name" | "level">>;
};

export type MonsterServer = "mapleland" | "planet";

type DropRow = { itemId: number; prob?: number; min?: number; max?: number };
type SpawnRow = { mob_code: number; maps?: Array<{ map_code: number; map_name: string }> };

export type MonsterDetailSources = {
  server: MonsterServer;
  monsters: Monster[];
  dropIndex: { items: Array<{ id: number; name: string; typeInfo?: { category?: string } }>; dropsByMonsterId: Record<string, DropRow[]> };
  spawns: { rows?: SpawnRow[] };
  releaseFilters: ReleaseFilters;
};

export function createMonsterDetailIndex(sources: MonsterDetailSources) {
  const monsters = createReleaseFilterer(sources.releaseFilters).filterReleasedMonsters(sources.monsters);
  const itemNameById = new Map<number, { name: string; category?: string }>(
    sources.dropIndex.items.map((item) => [item.id, { name: item.name, category: item.typeInfo?.category }]),
  );
  const dropsByMonsterId = sources.dropIndex.dropsByMonsterId;

  // 출현 맵은 메랜 스크래핑 결과 하나뿐이다. 플래닛은 같은 원작 맵을 쓰므로 공유하되,
  // 플래닛 전용 신규 지역은 이 소스에 없어 비어 있을 수 있다(알려진 한계).
  const mapsByMobCode = new Map<number, MonsterSpawnMap[]>(
    (sources.spawns.rows ?? []).map((row) => [
      row.mob_code,
      (row.maps ?? []).map((m) => ({ mapCode: m.map_code, mapName: m.map_name })),
    ]),
  );

  /**
   * 페이지 대상. 출시 필터를 통과한 몬스터만 — 미출시 몬스터 페이지를 만들면 안 된다.
   * mobCode 는 중복될 수 있다(동명이몹/소환몹, TODO 참고). 상세 조회도 find 로 첫 항목을 쓰므로 일관된다.
   */
  function getReleasedMonsterCodes(): number[] {
    return [...new Set(monsters.map((m) => m.mobCode))];
  }

  function getMonsterDetail(mobCode: number): MonsterDetail | null {
    const monster = monsters.find((m) => m.mobCode === mobCode);
    if (!monster) return null;

    const drops: MonsterDrop[] = (dropsByMonsterId[String(mobCode)] ?? [])
      // 스크래핑 원본에 음수 itemId가 섞여 있다(파싱 실패분). 이름을 못 붙이므로 버린다.
      .filter((row) => row.itemId > 0 && itemNameById.has(row.itemId))
      .map((row) => {
        const item = itemNameById.get(row.itemId)!;
        return { itemId: row.itemId, name: item.name, category: item.category, prob: row.prob, min: row.min, max: row.max };
      })
      // 확률 높은 순. 확률 미상(undefined)은 뒤로.
      .sort((a, b) => (b.prob ?? -1) - (a.prob ?? -1));

    const related = monsters
      .filter((m) => m.mobCode !== mobCode && Math.abs((m.level ?? 0) - (monster.level ?? 0)) <= 3)
      .slice(0, 12)
      .map((m) => ({ mobCode: m.mobCode, name: m.name, level: m.level }));

    return { monster, drops, maps: mapsByMobCode.get(mobCode) ?? [], related };
  }

  /**
   * 검색엔진에 색인시키지 않을 "내용이 없는" 상세 페이지인지.
   *
   * 드롭도 출현 맵도 없는 몬스터가 메랜에 51종 있다 — 자쿰팔, 카오스 혼테일의 부위, 발록의 손 같은
   * **보스의 부위**가 대부분으로, 데이터가 빠진 게 아니라 부위는 원래 드롭이 없는 것들이다.
   * 스탯표만 남아 본문이 400자 수준이라 **검색엔진에만 숨기고 사이트에서는 그대로 보여준다** —
   * HP·방어력이 있어 한방컷·피격뎀 계산기에서는 쓰임새가 있다(2026-10-01 애드센스 심사 대응).
   * 드롭이나 출현 맵이 확보되면 자동으로 false 가 되어 색인 대상으로 돌아온다.
   */
  function isThinMonsterPage(mobCode: number): boolean {
    const detail = getMonsterDetail(mobCode);
    if (!detail) return true;
    return detail.drops.length === 0 && detail.maps.length === 0;
  }

  return { server: sources.server, getReleasedMonsterCodes, getMonsterDetail, isThinMonsterPage };
}

export type MonsterDetailIndex = ReturnType<typeof createMonsterDetailIndex>;
