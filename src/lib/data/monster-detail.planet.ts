import planetMonstersJson from "@data/planet/monsters.json";
import planetDropIndexJson from "@data/planet/drop-index.json";
import monsterSpawnsJson from "@data/monster-spawns.json";
import planetReleaseFiltersJson from "@data/planet/release-filters.json";
import type { Monster } from "@/types/monster";
import { createMonsterDetailIndex, type MonsterDetailSources } from "@/lib/data/monster-detail-core";

/**
 * 메이플 플래닛 몬스터 상세 인덱스 — 플래닛 JSON 만 import 한다.
 * `/planet/monster/[mobCode]` edge 동적 라우트 전용(이유는 monster-detail-core.ts 머리 주석).
 */
export const planetMonsterIndex = createMonsterDetailIndex({
  server: "planet",
  monsters: planetMonstersJson as Monster[],
  dropIndex: planetDropIndexJson as unknown as MonsterDetailSources["dropIndex"],
  spawns: monsterSpawnsJson as MonsterDetailSources["spawns"],
  releaseFilters: planetReleaseFiltersJson as MonsterDetailSources["releaseFilters"],
});
