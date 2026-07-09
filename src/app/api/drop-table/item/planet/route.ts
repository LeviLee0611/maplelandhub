import { NextResponse } from "next/server";
import dropIndex from "@data/planet/drop-index.json";
import itemDetailBy from "@data/planet/item-detail-by.json";
import { resolveItemMonsters, type DropIndexLookup, type ItemDetailByLookup } from "@/lib/drop-table-lookup";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = Number(searchParams.get("itemId"));

  if (!Number.isFinite(itemId) || itemId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_itemId" }, { status: 400 });
  }

  const monsters = resolveItemMonsters(
    dropIndex as unknown as DropIndexLookup,
    itemDetailBy as unknown as ItemDetailByLookup,
    itemId,
  );
  return NextResponse.json({ ok: true, monsters });
}
