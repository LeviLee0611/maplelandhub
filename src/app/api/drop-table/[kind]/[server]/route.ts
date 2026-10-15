import { NextResponse } from "next/server";
import dropIndex from "@data/drop-index.json";
import itemDetailBy from "@data/item-detail-by.json";
import planetDropIndex from "@data/planet/drop-index.json";
import planetItemDetailBy from "@data/planet/item-detail-by.json";
import {
  resolveItemMonsters,
  resolveMonsterDrops,
  type DropIndexLookup,
  type ItemDetailByLookup,
} from "@/lib/drop-table-lookup";

/**
 * 드랍 테이블 조회 API — `/api/drop-table/{item|monster}/{mapleland|planet}` 네 경로를 함수 하나로.
 *
 * 2026-10-15까지는 경로마다 파일이 따로 있었는데(4개), Cloudflare next-on-pages 는 edge 라우트마다
 * 워커 함수를 따로 만들고 **각 함수가 import 한 JSON 을 통째로 복사해 싣는다**. 네 함수가 같은
 * drop-index 를 2.3~2.7MB 씩 들고 가서 Pages Functions 번들 한도(25 MiB)를 넘겼다(플래닛 몬스터
 * 페이지 추가 직후 28.9 MiB 로 배포 실패). 동적 세그먼트 하나로 합치면 두 서버 분이 한 번만 실린다.
 * URL 은 그대로다 — 클라이언트(DropTable.tsx)는 손대지 않았다.
 *
 * 라우트 수를 늘릴 때 기억할 것: 프리렌더 라우트 상한(~6,300)과 별개로 **edge 함수 번들 합계 25 MiB**
 * 한도가 있다. 큰 JSON 을 쓰는 edge 라우트는 함수를 합쳐야지 늘리면 안 된다.
 */
export const runtime = "edge";

type Server = "mapleland" | "planet";
type Params = { params: Promise<{ kind: string; server: string }> };

const DATA: Record<Server, { dropIndex: DropIndexLookup; itemDetailBy: ItemDetailByLookup }> = {
  mapleland: {
    dropIndex: dropIndex as unknown as DropIndexLookup,
    itemDetailBy: itemDetailBy as unknown as ItemDetailByLookup,
  },
  planet: {
    dropIndex: planetDropIndex as unknown as DropIndexLookup,
    itemDetailBy: planetItemDetailBy as unknown as ItemDetailByLookup,
  },
};

function isServer(value: string): value is Server {
  return value === "mapleland" || value === "planet";
}

export async function GET(request: Request, { params }: Params) {
  const { kind, server } = await params;
  if (!isServer(server) || (kind !== "item" && kind !== "monster")) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  const data = DATA[server];
  const { searchParams } = new URL(request.url);

  if (kind === "item") {
    const itemId = Number(searchParams.get("itemId"));
    if (!Number.isFinite(itemId) || itemId <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_itemId" }, { status: 400 });
    }
    const monsters = resolveItemMonsters(data.dropIndex, data.itemDetailBy, itemId);
    return NextResponse.json({ ok: true, monsters });
  }

  const mobCode = Number(searchParams.get("mobCode"));
  if (!Number.isFinite(mobCode) || mobCode <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_mobCode" }, { status: 400 });
  }
  const result = await resolveMonsterDrops(data.dropIndex, mobCode);
  if (result.lookupFailed) {
    // 외부 조회 실패를 200 + 빈 배열로 주면 클라이언트가 "드랍 없음"으로 캐시해버린다.
    // 재시도 가능한 오류로 전달한다.
    return NextResponse.json({ ok: false, error: "lookup_failed", ...result }, { status: 502 });
  }
  return NextResponse.json({ ok: true, ...result });
}
