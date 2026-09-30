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
 *
 * `partial`은 별도 상태 — 항목 일부만 실패했을 때(예: 10개 중 9개 실패, 1개 성공) `lookupFailed`는
 * false(결과가 아예 없는 건 아니므로)지만, 그 1개만으로 "이 몬스터의 드랍은 이게 전부"라고
 * 확정해선 안 된다. 얻은 만큼은 보여주되, 완전한 결과가 아니라는 걸 호출부가 알아야 재조회 여지를
 * 남길 수 있다.
 */
type MonsterBookFallback = { drops: DropEntry[]; lookupFailed: boolean; partial: boolean };

async function fetchMonsterBookFallback(mobCode: number): Promise<MonsterBookFallback> {
  const rootUrl = `https://maplestory.io/api/wz/KMS/389/String/MonsterBook.img/${mobCode}/reward`;
  try {
    const rootRes = await fetch(rootUrl);
    // 404는 "이 몬스터엔 몬스터북 보상 정보가 없다"는 확정 정보지만, 그 외 응답 실패는 장애로 본다.
    if (rootRes.status === 404) return { drops: [], lookupFailed: false, partial: false };
    if (!rootRes.ok) return { drops: [], lookupFailed: true, partial: false };

    const rootJson = (await rootRes.json()) as { children?: unknown[] };
    const children = Array.isArray(rootJson?.children) ? rootJson.children.map((child) => String(child)) : [];
    if (children.length === 0) return { drops: [], lookupFailed: false, partial: false };

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

    // 항목이 있는데 전부 실패했다면 결과를 신뢰할 수 없다. 일부만 실패했으면 얻은 만큼은
    // 반환하되 partial로 표시 — 호출부가 "이게 전부"라고 영구 캐시하지 않도록.
    const allChildrenFailed = results.every((result) => result.failed);
    const someChildrenFailed = results.some((result) => result.failed);
    const uniqueItemIds = Array.from(
      new Set(results.map((result) => result.value).filter((value): value is number => Boolean(value))),
    );
    return {
      drops: uniqueItemIds.map((itemId) => ({ itemId })),
      lookupFailed: allChildrenFailed,
      partial: !allChildrenFailed && someChildrenFailed,
    };
  } catch {
    return { drops: [], lookupFailed: true, partial: false };
  }
}

export async function resolveMonsterDrops(dropIndex: DropIndexLookup, mobCode: number) {
  const localDrops = dropIndex.dropsByMonsterId[String(mobCode)] ?? [];
  if (localDrops.length > 0) {
    return { source: "local" as const, drops: localDrops, lookupFailed: false, partial: false };
  }
  const fallback = await fetchMonsterBookFallback(mobCode);
  return {
    source: "monsterbook" as const,
    drops: fallback.drops,
    lookupFailed: fallback.lookupFailed,
    partial: fallback.partial,
  };
}

/**
 * 드롭 역인덱스 항목을 `{ mobId, ... }` 형태로 맞춘다.
 *
 * 일부 항목이 객체가 아니라 **mobId 숫자 하나**로 들어있다 — 발록·카오스 혼테일 드롭을 넣은
 * 일회성 스크립트(`update-balrog-drops.mjs` 등)가 형식을 지키지 않은 탓이다. 이 상태로 내보내면
 * 호출부가 `entry.mobId`에서 undefined 를 받고, `Number.isFinite` 필터에 걸려 **해당 몬스터가
 * 목록에서 통째로 사라진다**. 실제로 62개 아이템(발록 장비 전종, 카오스 혼테일의 목걸이 등)의
 * "이 아이템을 드롭하는 몬스터"가 비어 있었다(2026-09-30 발견).
 *
 * 데이터는 따로 정정했지만, 같은 형식으로 데이터를 넣는 일회성 스크립트가 앞으로도 쓰일 수 있어
 * 소비 지점에서도 방어한다.
 */
function normalizeMonsterEntries(entries: unknown): MonsterDropEntry[] {
  if (!Array.isArray(entries)) return [];
  const out: MonsterDropEntry[] = [];
  for (const entry of entries) {
    if (typeof entry === "number") {
      if (Number.isFinite(entry) && entry > 0) out.push({ mobId: entry });
      continue;
    }
    if (entry && typeof entry === "object") out.push(entry as MonsterDropEntry);
  }
  return out;
}

export function resolveItemMonsters(
  dropIndex: DropIndexLookup,
  itemDetailBy: ItemDetailByLookup,
  itemId: number,
): MonsterDropEntry[] {
  const preferredEntries = normalizeMonsterEntries(itemDetailBy.itemsByItemId?.[String(itemId)]);
  if (preferredEntries.length > 0) return preferredEntries;
  return normalizeMonsterEntries(dropIndex.monstersByItemId[String(itemId)]);
}
