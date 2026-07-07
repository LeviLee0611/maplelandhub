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
