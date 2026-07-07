import releaseFiltersJson from "@data/release-filters.json";
import type { Monster } from "@/types/monster";

export type ReleaseFilters = {
  blockedMobCodes?: number[];
  blockedMobCodeMin?: number;
};

export function createReleaseFilterer(filters: ReleaseFilters) {
  const blockedMobCodeSet = new Set<number>((filters.blockedMobCodes ?? []).map((v) => Number(v)));
  const blockedMobCodeMin = Number.isFinite(Number(filters.blockedMobCodeMin))
    ? Number(filters.blockedMobCodeMin)
    : 9_000_000;

  function isReleasedMobCode(mobCode: number | string) {
    const code = Number(mobCode);
    if (!Number.isFinite(code) || code <= 0) return false;
    if (code >= blockedMobCodeMin) return false;
    if (blockedMobCodeSet.has(code)) return false;
    return true;
  }

  function isReleasedMonster(monster: Pick<Monster, "mobCode" | "exist"> | null | undefined) {
    if (!monster) return false;
    if (monster.exist === false) return false;
    return isReleasedMobCode(monster.mobCode);
  }

  function filterReleasedMonsters<T extends Pick<Monster, "mobCode" | "exist">>(monsters: T[]) {
    return monsters.filter((monster) => isReleasedMonster(monster));
  }

  return { isReleasedMobCode, isReleasedMonster, filterReleasedMonsters };
}

const mapleReleaseFilters = releaseFiltersJson as ReleaseFilters;
const mapleReleaseFilterer = createReleaseFilterer(mapleReleaseFilters);

export function isReleasedMobCode(mobCode: number | string) {
  return mapleReleaseFilterer.isReleasedMobCode(mobCode);
}

export function isReleasedMonster(monster: Pick<Monster, "mobCode" | "exist"> | null | undefined) {
  return mapleReleaseFilterer.isReleasedMonster(monster);
}

export function filterReleasedMonsters<T extends Pick<Monster, "mobCode" | "exist">>(monsters: T[]) {
  return mapleReleaseFilterer.filterReleasedMonsters(monsters);
}
