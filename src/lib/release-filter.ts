import releaseFiltersJson from "@data/release-filters.json";
import type { Monster } from "@/types/monster";

type ReleaseFilters = {
  blockedMobCodes?: number[];
  blockedMobCodeMin?: number;
};

const releaseFilters = releaseFiltersJson as ReleaseFilters;
const blockedMobCodeSet = new Set<number>((releaseFilters.blockedMobCodes ?? []).map((v) => Number(v)));
const blockedMobCodeMin = Number.isFinite(Number(releaseFilters.blockedMobCodeMin))
  ? Number(releaseFilters.blockedMobCodeMin)
  : 9_000_000;

export function isReleasedMobCode(mobCode: number | string) {
  const code = Number(mobCode);
  if (!Number.isFinite(code) || code <= 0) return false;
  if (code >= blockedMobCodeMin) return false;
  if (blockedMobCodeSet.has(code)) return false;
  return true;
}

export function isReleasedMonster(monster: Pick<Monster, "mobCode" | "exist"> | null | undefined) {
  if (!monster) return false;
  if (monster.exist === false) return false;
  return isReleasedMobCode(monster.mobCode);
}

export function filterReleasedMonsters<T extends Pick<Monster, "mobCode" | "exist">>(monsters: T[]) {
  return monsters.filter((monster) => isReleasedMonster(monster));
}
