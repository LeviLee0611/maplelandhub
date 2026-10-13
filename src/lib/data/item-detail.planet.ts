import planetMonstersJson from "@data/planet/monsters.json";
import planetDropIndexJson from "@data/planet/drop-index.json";
import monsterSpawnsJson from "@data/monster-spawns.json";
import planetReleaseFiltersJson from "@data/planet/release-filters.json";
import type { Monster } from "@/types/monster";
import { createItemDetailIndex, type ItemDetailSources } from "@/lib/data/item-detail";

/**
 * 메이플 플래닛 아이템 상세 인덱스. 플래닛 JSON 만 import 한다 — 이유는 item-detail.ts 머리 주석.
 * 출현 맵은 메랜 스크래핑 결과를 공유한다(monster-detail.ts 와 같은 알려진 한계).
 */
export const planetItemIndex = createItemDetailIndex({
  server: "planet",
  monsters: planetMonstersJson as Monster[],
  dropIndex: planetDropIndexJson as unknown as ItemDetailSources["dropIndex"],
  spawns: monsterSpawnsJson as ItemDetailSources["spawns"],
  releaseFilters: planetReleaseFiltersJson as ItemDetailSources["releaseFilters"],
});
