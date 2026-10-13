import monstersJson from "@data/monsters.json";
import dropIndexJson from "@data/drop-index.json";
import monsterSpawnsJson from "@data/monster-spawns.json";
import releaseFiltersJson from "@data/release-filters.json";
import type { Monster } from "@/types/monster";
import { createItemDetailIndex, type ItemDetailSources } from "@/lib/data/item-detail";

/**
 * 메이플랜드 아이템 상세 인덱스. 메랜 JSON 만 import 한다 — 이유는 item-detail.ts 머리 주석.
 * 서버 전용(edge 라우트·sitemap). 클라이언트 컴포넌트에서 import 금지.
 */
export const maplelandItemIndex = createItemDetailIndex({
  server: "mapleland",
  monsters: monstersJson as Monster[],
  dropIndex: dropIndexJson as unknown as ItemDetailSources["dropIndex"],
  spawns: monsterSpawnsJson as ItemDetailSources["spawns"],
  releaseFilters: releaseFiltersJson as ItemDetailSources["releaseFilters"],
});
