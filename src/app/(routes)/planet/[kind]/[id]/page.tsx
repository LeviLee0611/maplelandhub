import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItemDetailView, { buildItemMetadata } from "@/components/ItemDetailView";
import MonsterDetailView, { buildMonsterMetadata } from "@/components/MonsterDetailView";
import { planetItemIndex } from "@/lib/data/item-detail.planet";
import { planetMonsterIndex } from "@/lib/data/monster-detail.planet";

/**
 * 메이플 플래닛 상세 페이지 — `/planet/item/[id]` 와 `/planet/monster/[id]` 를 **함수 하나**로.
 *
 * 두 라우트를 따로 두면 Cloudflare next-on-pages 가 edge 함수를 둘 만들고 각각 플래닛 JSON(4MB)을
 * 복사해 실어, Pages Functions 번들 합계 한도(25 MiB)를 넘긴다(2026-10-15 배포 실패, 28.9 MiB).
 * 동적 세그먼트 `[kind]` 로 합치면 플래닛 데이터가 한 번만 실린다. 공개 URL 은 그대로다.
 *
 * `/planet/calculators/onehit`, `/planet/drop-table` 같은 정적 라우트가 먼저 매칭되므로 이 라우트는
 * 그 외의 `/planet/{kind}/{id}` 만 받는다. 모르는 kind 는 404.
 *
 * edge 동적 라우트인 이유(프리렌더 라우트 상한)는 /item/[itemId] 와 monster-detail-core.ts 주석 참고.
 */
export const runtime = "edge";

type Params = { params: Promise<{ kind: string; id: string }> };

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { kind, id } = await params;
  const code = parseId(id);
  if (kind === "item") {
    return buildItemMetadata(Promise.resolve({ itemId: String(code ?? 0) }), planetItemIndex);
  }
  if (kind === "monster") {
    return buildMonsterMetadata(code ? planetMonsterIndex.getMonsterDetail(code) : null, "planet");
  }
  return { title: "페이지를 찾을 수 없습니다 | 메랜Hub" };
}

export default async function PlanetDetailPage({ params }: Params) {
  const { kind, id } = await params;
  const code = parseId(id);
  if (!code) notFound();

  if (kind === "item") {
    const detail = planetItemIndex.getItemDetail(code);
    if (!detail) notFound();
    return <ItemDetailView detail={detail} server="planet" />;
  }
  if (kind === "monster") {
    const detail = planetMonsterIndex.getMonsterDetail(code);
    if (!detail) notFound();
    return <MonsterDetailView detail={detail} server="planet" />;
  }
  notFound();
}
