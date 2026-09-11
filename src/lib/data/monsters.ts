import monsters from "@data/monsters.json";
import planetMonsters from "@data/planet/monsters.json";
import planetReleaseFiltersJson from "@data/planet/release-filters.json";
import type { Monster } from "@/types/monster";
import { createReleaseFilterer, filterReleasedMonsters, type ReleaseFilters } from "@/lib/release-filter";

export type MonsterProvider = {
  list: () => Monster[];
};

const staticProvider: MonsterProvider = {
  list: () => monsters as Monster[],
};

let activeProvider: MonsterProvider = staticProvider;

export function setMonsterProvider(provider: MonsterProvider) {
  activeProvider = provider;
}

export function getMonsters() {
  return filterReleasedMonsters(activeProvider.list());
}

const planetReleaseFilterer = createReleaseFilterer(planetReleaseFiltersJson as ReleaseFilters);

export function getPlanetMonsters() {
  return planetReleaseFilterer.filterReleasedMonsters(planetMonsters as Monster[]);
}

/**
 * 이름 + (있으면) mobCode로 몬스터 하나를 확정한다.
 *
 * 이름만으로 찾으면 동명이몹에서 배열 첫 항목으로 흘러간다 — 출시분 기준 52개 이름이 중복이고
 * 그중 19개는 HP까지 다르다(스톤골렘 4000 vs 600, 주니어 스톤볼 600 vs 8 등). 목록에서 고르거나
 * 링크로 mobCode가 넘어온 경우엔 그걸 우선한다. mobCode가 없거나 목록에 없으면 이름으로 폴백한다
 * (URL의 ?mob=이름, 예전에 저장된 프리셋 등 mobCode가 없는 경로를 지원해야 하므로).
 */
export function resolveSelectedMonster(
  monsters: Monster[],
  name: string,
  mobCode?: number | null,
): Monster | undefined {
  if (mobCode != null) {
    const byCode = monsters.find((monster) => monster.mobCode === mobCode);
    if (byCode) return byCode;
  }
  return monsters.find((monster) => monster.name === name);
}
