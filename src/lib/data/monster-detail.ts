import monstersJson from "@data/monsters.json";
import dropIndexJson from "@data/drop-index.json";
import monsterSpawnsJson from "@data/monster-spawns.json";
import releaseFiltersJson from "@data/release-filters.json";
import planetMonstersJson from "@data/planet/monsters.json";
import planetDropIndexJson from "@data/planet/drop-index.json";
import planetReleaseFiltersJson from "@data/planet/release-filters.json";
import type { Monster } from "@/types/monster";
import { createMonsterDetailIndex, type MonsterDetail, type MonsterDetailSources, type MonsterServer } from "@/lib/data/monster-detail-core";

export type { MonsterDetail, MonsterDrop, MonsterSpawnMap, MonsterServer } from "@/lib/data/monster-detail-core";

/**
 * 몬스터 상세 — **메랜·플래닛 두 서버를 모두 읽는 묶음 모듈.**
 *
 * 빌드 시점에만 쓰는 곳(sitemap, 정적 생성되는 메랜 몬스터 페이지, 테스트)에서 import 한다.
 * **edge 동적 라우트에서는 import 하지 말 것** — 두 서버 JSON(~9MB)이 워커 번들에 통째로 실린다.
 * 플래닛 edge 라우트는 monster-detail.planet.ts 를 쓴다. 조립 로직은 monster-detail-core.ts.
 *
 * 클라이언트 컴포넌트에서도 import 금지(2026-09-11에 계산기 4개 페이지로 몬스터 JSON 154KB 가 새어 들어간
 * 전례 — `src/lib/monster-resolver.ts` 주석 참고).
 */

const indexes: Record<MonsterServer, ReturnType<typeof createMonsterDetailIndex>> = {
  mapleland: createMonsterDetailIndex({
    server: "mapleland",
    monsters: monstersJson as Monster[],
    dropIndex: dropIndexJson as unknown as MonsterDetailSources["dropIndex"],
    spawns: monsterSpawnsJson as MonsterDetailSources["spawns"],
    releaseFilters: releaseFiltersJson as MonsterDetailSources["releaseFilters"],
  }),
  planet: createMonsterDetailIndex({
    server: "planet",
    monsters: planetMonstersJson as Monster[],
    dropIndex: planetDropIndexJson as unknown as MonsterDetailSources["dropIndex"],
    spawns: monsterSpawnsJson as MonsterDetailSources["spawns"],
    releaseFilters: planetReleaseFiltersJson as MonsterDetailSources["releaseFilters"],
  }),
};

export function getReleasedMonsterCodes(server: MonsterServer = "mapleland"): number[] {
  return indexes[server].getReleasedMonsterCodes();
}

export function getMonsterDetail(mobCode: number, server: MonsterServer = "mapleland"): MonsterDetail | null {
  return indexes[server].getMonsterDetail(mobCode);
}

export function isThinMonsterPage(mobCode: number, server: MonsterServer = "mapleland"): boolean {
  return indexes[server].isThinMonsterPage(mobCode);
}
