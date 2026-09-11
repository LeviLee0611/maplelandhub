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

/**
 * 외부(maplestory.io MonsterBook) 조회 결과.
 *
 * `lookupFailed`가 핵심 — 외부 장애를 빈 배열로 뭉개면 호출부가 "확인된 드랍 없음"으로
 * 착각해 영구 캐시하게 된다. "확인했는데 없음"과 "확인 자체를 못 함"은 구분해야 재시도가 가능하다.
 */
type MonsterBookFallback = { drops: DropEntry[]; lookupFailed: boolean };

async function fetchMonsterBookFallback(mobCode: number): Promise<MonsterBookFallback> {
  const rootUrl = `https://maplestory.io/api/wz/KMS/389/String/MonsterBook.img/${mobCode}/reward`;
  try {
    const rootRes = await fetch(rootUrl);
    // 404는 "이 몬스터엔 몬스터북 보상 정보가 없다"는 확정 정보지만, 그 외 응답 실패는 장애로 본다.
    if (rootRes.status === 404) return { drops: [], lookupFailed: false };
    if (!rootRes.ok) return { drops: [], lookupFailed: true };

    const rootJson = (await rootRes.json()) as { children?: unknown[] };
    const children = Array.isArray(rootJson?.children) ? rootJson.children.map((child) => String(child)) : [];
    if (children.length === 0) return { drops: [], lookupFailed: false };

    const results = await Promise.all(
      children.map(async (child) => {
        try {
          const childRes = await fetch(`${rootUrl}/${child}`);
          if (!childRes.ok) return { value: null, failed: true };
          const childJson = (await childRes.json()) as { value?: unknown };
          const value = Number(childJson?.value);
          return { value: Number.isFinite(value) && value > 0 ? value : null, failed: false };
        } catch {
          return { value: null, failed: true };
        }
      }),
    );

    // 항목이 있는데 전부 실패했다면 결과를 신뢰할 수 없다(부분 실패는 얻은 만큼만 반환).
    const allChildrenFailed = results.every((result) => result.failed);
    const uniqueItemIds = Array.from(
      new Set(results.map((result) => result.value).filter((value): value is number => Boolean(value))),
    );
    return {
      drops: uniqueItemIds.map((itemId) => ({ itemId })),
      lookupFailed: allChildrenFailed,
    };
  } catch {
    return { drops: [], lookupFailed: true };
  }
}

export async function resolveMonsterDrops(dropIndex: DropIndexLookup, mobCode: number) {
  const localDrops = dropIndex.dropsByMonsterId[String(mobCode)] ?? [];
  if (localDrops.length > 0) {
    return { source: "local" as const, drops: localDrops, lookupFailed: false };
  }
  const fallback = await fetchMonsterBookFallback(mobCode);
  return { source: "monsterbook" as const, drops: fallback.drops, lookupFailed: fallback.lookupFailed };
}

export function resolveItemMonsters(
  dropIndex: DropIndexLookup,
  itemDetailBy: ItemDetailByLookup,
  itemId: number,
): MonsterDropEntry[] {
  const preferredEntries = itemDetailBy.itemsByItemId?.[String(itemId)] ?? [];
  return preferredEntries.length > 0 ? preferredEntries : (dropIndex.monstersByItemId[String(itemId)] ?? []);
}
