import monsters from "@data/monsters.json";
import type { Monster } from "@/types/monster";
import { filterReleasedMonsters } from "@/lib/release-filter";

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
