import { NextResponse } from "next/server";
import dropIndex from "@data/drop-index.json";
import { resolveMonsterDrops, type DropIndexLookup } from "@/lib/drop-table-lookup";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mobCode = Number(searchParams.get("mobCode"));

  if (!Number.isFinite(mobCode) || mobCode <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_mobCode" }, { status: 400 });
  }

  const result = await resolveMonsterDrops(dropIndex as unknown as DropIndexLookup, mobCode);
  if (result.lookupFailed) {
    // 외부 조회 실패를 200 + 빈 배열로 주면 클라이언트가 "드랍 없음"으로 캐시해버린다.
    // 재시도 가능한 오류로 전달한다.
    return NextResponse.json({ ok: false, error: "lookup_failed", ...result }, { status: 502 });
  }
  return NextResponse.json({ ok: true, ...result });
}
