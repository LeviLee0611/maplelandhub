import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveItemMonsters, resolveMonsterDrops, type DropIndexLookup } from "../drop-table-lookup";

const emptyIndex: DropIndexLookup = { dropsByMonsterId: {}, monstersByItemId: {} };

function mockFetch(handler: (url: string) => { status?: number; body?: unknown } | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => {
      const result = handler(String(input));
      if (result instanceof Error) throw result;
      const status = result.status ?? 200;
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => result.body,
      };
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveMonsterDrops — 외부 조회 실패와 '드랍 없음' 구분", () => {
  it("로컬 드랍이 있으면 외부 조회 없이 반환한다", async () => {
    const index: DropIndexLookup = {
      dropsByMonsterId: { "100": [{ itemId: 4000493 }] },
      monstersByItemId: {},
    };
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await resolveMonsterDrops(index, 100);

    expect(result.source).toBe("local");
    expect(result.drops).toEqual([{ itemId: 4000493 }]);
    expect(result.lookupFailed).toBe(false);
    expect(result.partial).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("404는 '확인된 드랍 없음'이지 실패가 아니다", async () => {
    mockFetch(() => ({ status: 404 }));

    const result = await resolveMonsterDrops(emptyIndex, 100);

    expect(result.drops).toEqual([]);
    expect(result.lookupFailed).toBe(false);
  });

  it("응답은 왔지만 보상 항목이 없으면 '확인된 드랍 없음'", async () => {
    mockFetch(() => ({ body: { children: [] } }));

    const result = await resolveMonsterDrops(emptyIndex, 100);

    expect(result.drops).toEqual([]);
    expect(result.lookupFailed).toBe(false);
  });

  it("외부 서버 오류(500)는 조회 실패로 표시한다", async () => {
    mockFetch(() => ({ status: 500 }));

    const result = await resolveMonsterDrops(emptyIndex, 100);

    expect(result.drops).toEqual([]);
    expect(result.lookupFailed).toBe(true);
  });

  it("네트워크 예외도 조회 실패로 표시한다", async () => {
    mockFetch(() => new Error("network down"));

    const result = await resolveMonsterDrops(emptyIndex, 100);

    expect(result.drops).toEqual([]);
    expect(result.lookupFailed).toBe(true);
  });

  it("보상 항목이 있는데 개별 조회가 전부 실패하면 결과를 신뢰하지 않는다", async () => {
    mockFetch((url) => (url.endsWith("/reward") ? { body: { children: ["0", "1"] } } : { status: 503 }));

    const result = await resolveMonsterDrops(emptyIndex, 100);

    expect(result.drops).toEqual([]);
    expect(result.lookupFailed).toBe(true);
  });

  it("정상 조회 시 중복 없이 아이템을 반환한다", async () => {
    mockFetch((url) => {
      if (url.endsWith("/reward")) return { body: { children: ["0", "1", "2"] } };
      if (url.endsWith("/0")) return { body: { value: 4000493 } };
      if (url.endsWith("/1")) return { body: { value: 4000493 } };
      return { body: { value: 4000494 } };
    });

    const result = await resolveMonsterDrops(emptyIndex, 100);

    expect(result.source).toBe("monsterbook");
    expect(result.drops).toEqual([{ itemId: 4000493 }, { itemId: 4000494 }]);
    expect(result.lookupFailed).toBe(false);
    expect(result.partial).toBe(false);
  });

  it("일부만 실패하면 얻은 만큼 반환하되 partial로 표시한다(완전한 결과로 오인하면 안 됨)", async () => {
    mockFetch((url) => {
      if (url.endsWith("/reward")) return { body: { children: ["0", "1"] } };
      if (url.endsWith("/0")) return { body: { value: 4000493 } };
      return { status: 503 };
    });

    const result = await resolveMonsterDrops(emptyIndex, 100);

    expect(result.drops).toEqual([{ itemId: 4000493 }]);
    expect(result.lookupFailed).toBe(false);
    expect(result.partial).toBe(true);
  });
});

describe("resolveItemMonsters — 역인덱스 형식 방어", () => {
  const itemDetailBy = { itemsByItemId: {} };

  /**
   * 일부 역인덱스 항목이 `{ mobId }` 객체가 아니라 **숫자 하나**로 들어있었다.
   * 발록·카오스 혼테일 드롭을 넣은 일회성 스크립트가 형식을 지키지 않은 탓으로,
   * 그대로 두면 화면에서 `entry.mobId`가 undefined 가 되고 `Number.isFinite` 필터에 걸려
   * 62개 아이템의 "이 아이템을 드롭하는 몬스터"가 통째로 비어 있었다(2026-09-30).
   */
  it("mobId 숫자만 든 항목을 {mobId} 객체로 정규화한다", () => {
    const index = {
      dropsByMonsterId: {},
      monstersByItemId: { "1072375": [8830000, { mobId: 8150000, prob: 0.01 }] },
    } as unknown as DropIndexLookup;
    const result = resolveItemMonsters(index, itemDetailBy, 1072375);
    expect(result).toEqual([{ mobId: 8830000 }, { mobId: 8150000, prob: 0.01 }]);
    expect(result.every((e) => Number.isFinite(e.mobId) && e.mobId > 0)).toBe(true);
  });

  it("0 이하이거나 숫자가 아닌 쓰레기 항목은 버린다", () => {
    const index = {
      dropsByMonsterId: {},
      monstersByItemId: { "1": [0, -5, null, "x", { mobId: 100100 }] },
    } as unknown as DropIndexLookup;
    expect(resolveItemMonsters(index, itemDetailBy, 1)).toEqual([{ mobId: 100100 }]);
  });

  it("itemDetailBy 우선 경로에도 같은 정규화가 적용된다", () => {
    const index = { dropsByMonsterId: {}, monstersByItemId: {} } as unknown as DropIndexLookup;
    // 타입에 맞지 않는 실제 데이터 모양을 일부러 넣는 테스트라 캐스트한다
    const detail = { itemsByItemId: { "1": [8830000] } } as unknown as Parameters<typeof resolveItemMonsters>[1];
    expect(resolveItemMonsters(index, detail, 1)).toEqual([{ mobId: 8830000 }]);
  });

  it("실데이터의 역인덱스에는 비-객체 항목이 남아 있으면 안 된다", async () => {
    const dropIndex = (await import("@data/drop-index.json")).default as unknown as {
      monstersByItemId: Record<string, unknown[]>;
    };
    const offenders: string[] = [];
    for (const [itemId, entries] of Object.entries(dropIndex.monstersByItemId)) {
      for (const e of entries ?? []) {
        if (!e || typeof e !== "object") offenders.push(`${itemId}: ${JSON.stringify(e)}`);
      }
    }
    expect(offenders.slice(0, 10)).toEqual([]);
  });
});
