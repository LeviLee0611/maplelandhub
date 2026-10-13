import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ItemDetailView, { buildItemMetadata, type ItemPageProps } from "@/components/ItemDetailView";
import { maplelandItemIndex } from "@/lib/data/item-detail.mapleland";

/**
 * 메이플랜드 아이템 상세 페이지 — edge 동적 라우트.
 *
 * 정적 생성(generateStaticParams)을 일부러 쓰지 않는다. 아이템이 2,800개라 프리렌더하면 Cloudflare
 * next-on-pages 의 라우트 상한(~6,300)을 바로 넘긴다(TODO "배포 한계"). next-on-pages 는 동적 라우트에
 * `runtime = "edge"` 가 필수다 — API 라우트와 같은 방식.
 */
export const runtime = "edge";

export function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  return buildItemMetadata(params, maplelandItemIndex);
}

export default async function MaplelandItemPage({ params }: ItemPageProps) {
  const { itemId } = await params;
  const id = Number(itemId);
  const detail = Number.isInteger(id) && id > 0 ? maplelandItemIndex.getItemDetail(id) : null;
  if (!detail) notFound();
  return <ItemDetailView detail={detail} server="mapleland" />;
}
