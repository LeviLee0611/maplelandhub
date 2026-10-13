import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItemDetailView, { buildItemMetadata, type ItemPageProps } from "@/components/ItemDetailView";
import { planetItemIndex } from "@/lib/data/item-detail.planet";

/**
 * 메이플 플래닛 아이템 상세 페이지 — edge 동적 라우트. 구조는 /item/[itemId] 와 같고 데이터 인덱스만 다르다.
 * 플래닛 몬스터 상세 페이지는 아직 없어 몬스터 링크는 드랍 테이블로 간다(ItemDetailView.monsterHref).
 */
export const runtime = "edge";

export function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  return buildItemMetadata(params, planetItemIndex);
}

export default async function PlanetItemPage({ params }: ItemPageProps) {
  const { itemId } = await params;
  const id = Number(itemId);
  const detail = Number.isInteger(id) && id > 0 ? planetItemIndex.getItemDetail(id) : null;
  if (!detail) notFound();
  return <ItemDetailView detail={detail} server="planet" />;
}
