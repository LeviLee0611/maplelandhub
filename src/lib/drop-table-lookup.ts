export type DropEntry = {
  itemId: number;
  prob?: number;
  min?: number;
  max?: number;
};

export type MonsterDropEntry = {
  mobId: number;
  prob?: number;
  min?: number;
  max?: number;
};

export type DropIndexLookup = {
  dropsByMonsterId: Record<string, DropEntry[]>;
  monstersByItemId: Record<string, MonsterDropEntry[]>;
};

export type ItemDetailByLookup = {
  itemsByItemId?: Record<string, MonsterDropEntry[]>;
};

async function fetchMonsterBookFallback(mobCode: number): Promise<DropEntry[]> {
  const rootUrl = `https://maplestory.io/api/wz/KMS/389/String/MonsterBook.img/${mobCode}/reward`;
  try {
    const rootRes = await fetch(rootUrl);
    if (!rootRes.ok) return [];
    const rootJson = (await rootRes.json()) as { children?: unknown[] };
    const children = Array.isArray(rootJson?.children) ? rootJson.children.map((child) => String(child)) : [];
    if (children.length === 0) return [];

    const results = await Promise.all(
      children.map(async (child) => {
        try {
          const childRes = await fetch(`${rootUrl}/${child}`);
          if (!childRes.ok) return null;
          const childJson = (await childRes.json()) as { value?: unknown };
          const value = Number(childJson?.value);
          return Number.isFinite(value) && value > 0 ? value : null;
        } catch {
          return null;
        }
      }),
    );
    const uniqueItemIds = Array.from(new Set(results.filter((value): value is number => Boolean(value))));
    return uniqueItemIds.map((itemId) => ({ itemId }));
  } catch {
    return [];
  }
}

export async function resolveMonsterDrops(dropIndex: DropIndexLookup, mobCode: number) {
  const localDrops = dropIndex.dropsByMonsterId[String(mobCode)] ?? [];
  if (localDrops.length > 0) {
    return { source: "local" as const, drops: localDrops };
  }
  const fallbackDrops = await fetchMonsterBookFallback(mobCode);
  return { source: "monsterbook" as const, drops: fallbackDrops };
}

export function resolveItemMonsters(
  dropIndex: DropIndexLookup,
  itemDetailBy: ItemDetailByLookup,
  itemId: number,
): MonsterDropEntry[] {
  const preferredEntries = itemDetailBy.itemsByItemId?.[String(itemId)] ?? [];
  return preferredEntries.length > 0 ? preferredEntries : (dropIndex.monstersByItemId[String(itemId)] ?? []);
}
