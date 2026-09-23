import monstersJson from "@data/monsters.json";
import dropIndexJson from "@data/drop-index.json";
import monsterSpawnsJson from "@data/monster-spawns.json";
import planetMonstersJson from "@data/planet/monsters.json";
import planetDropIndexJson from "@data/planet/drop-index.json";
import planetReleaseFiltersJson from "@data/planet/release-filters.json";
import type { Monster } from "@/types/monster";
import { createReleaseFilterer, filterReleasedMonsters, type ReleaseFilters } from "@/lib/release-filter";

/**
 * 몬스터 상세 페이지(`/monster/[mobCode]`)용 서버 전용 데이터 조립.
 *
 * 이 모듈은 절대 클라이언트 컴포넌트에서 import하지 말 것 — monsters.json(235KB)과
 * drop-index.json(3.8MB)을 직접 읽으므로 클라이언트 번들에 딸려 들어간다.
 * (2026-09-11에 계산기 4개 페이지로 몬스터 JSON 154KB가 새어 들어간 전례가 있다 —
 *  `src/lib/monster-resolver.ts` 주석 참고.) 상세 페이지는 서버에서 정적 생성되므로
 * 조립 결과가 HTML 텍스트로만 나가고 JSON 자체는 전송되지 않는다.
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

type DropRow = { itemId: number; prob?: number; min?: number; max?: number };
type SpawnRow = { mob_code: number; maps?: Array<{ map_code: number; map_name: string }> };

export type MonsterServer = "mapleland" | "planet";

type DropIndexShape = {
  items: Array<{ id: number; name: string; typeInfo?: { category?: string } }>;
  dropsByMonsterId: Record<string, DropRow[]>;
};

function buildIndex(monsters: Monster[], dropIndex: DropIndexShape) {
  return {
    monsters,
    itemNameById: new Map<number, { name: string; category?: string }>(
      dropIndex.items.map((item) => [item.id, { name: item.name, category: item.typeInfo?.category }]),
    ),
    dropsByMonsterId: dropIndex.dropsByMonsterId,
  };
}

const planetFilterer = createReleaseFilterer(planetReleaseFiltersJson as ReleaseFilters);

const indexes: Record<MonsterServer, ReturnType<typeof buildIndex>> = {
  mapleland: buildIndex(
    filterReleasedMonsters(monstersJson as Monster[]),
    dropIndexJson as unknown as DropIndexShape,
  ),
  planet: buildIndex(
    planetFilterer.filterReleasedMonsters(planetMonstersJson as Monster[]),
    planetDropIndexJson as unknown as DropIndexShape,
  ),
};

// 출현 맵은 메랜 스크래핑 결과 하나뿐이다. 플래닛은 같은 원작 맵을 쓰므로 공유하되,
// 플래닛 전용 신규 지역은 이 소스에 없어 비어 있을 수 있다(알려진 한계).
const mapsByMobCode = new Map<number, MonsterSpawnMap[]>(
  ((monsterSpawnsJson as { rows?: SpawnRow[] }).rows ?? []).map((row) => [
    row.mob_code,
    (row.maps ?? []).map((m) => ({ mapCode: m.map_code, mapName: m.map_name })),
  ]),
);

/**
 * 정적 생성 대상. 출시 필터를 통과한 몬스터만 — 미출시 몬스터 페이지를 만들면 안 된다.
 *
 * mobCode는 중복될 수 있다(출시분 500종 중 고유 코드는 496개 — 동명이몹/소환몹이 같은 코드를
 * 공유하는 기존 데이터 문제, TODO의 동명이몹 항목 참고). generateStaticParams가 같은 param을
 * 두 번 돌려주면 안 되므로 여기서 중복을 제거한다. 상세 조회도 find로 첫 항목을 쓰므로 일관된다.
 */
export function getReleasedMonsterCodes(server: MonsterServer = "mapleland"): number[] {
  return [...new Set(indexes[server].monsters.map((m) => m.mobCode))];
}

export function getMonsterDetail(mobCode: number, server: MonsterServer = "mapleland"): MonsterDetail | null {
  const { monsters, itemNameById, dropsByMonsterId } = indexes[server];
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
