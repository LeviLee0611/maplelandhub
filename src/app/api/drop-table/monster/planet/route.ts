import { NextResponse } from "next/server";
import dropIndex from "@data/planet/drop-index.json";
import { resolveMonsterDrops, type DropIndexLookup } from "@/lib/drop-table-lookup";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mobCode = Number(searchParams.get("mobCode"));

  if (!Number.isFinite(mobCode) || mobCode <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_mobCode" }, { status: 400 });
  }

  const result = await resolveMonsterDrops(dropIndex as unknown as DropIndexLookup, mobCode);
  return NextResponse.json({ ok: true, ...result });
}
