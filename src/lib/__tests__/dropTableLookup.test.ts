import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveMonsterDrops, type DropIndexLookup } from "../drop-table-lookup";

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
  });

  it("일부만 실패하면 얻은 만큼 반환하고 실패로 표시하지 않는다", async () => {
    mockFetch((url) => {
      if (url.endsWith("/reward")) return { body: { children: ["0", "1"] } };
      if (url.endsWith("/0")) return { body: { value: 4000493 } };
      return { status: 503 };
    });

    const result = await resolveMonsterDrops(emptyIndex, 100);

    expect(result.drops).toEqual([{ itemId: 4000493 }]);
    expect(result.lookupFailed).toBe(false);
  });
});
