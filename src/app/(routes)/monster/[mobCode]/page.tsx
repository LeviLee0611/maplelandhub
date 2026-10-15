import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MonsterDetailView, { buildMonsterMetadata, type MonsterPageProps } from "@/components/MonsterDetailView";
import { getMonsterDetail, getReleasedMonsterCodes } from "@/lib/data/monster-detail";

/**
 * 메이플랜드 몬스터 상세 페이지 — 검색 유입용 정적 페이지.
 * 본문은 `MonsterDetailView`가 담당하고 여기서는 데이터 모듈과 서버 종류만 고정한다.
 * 플래닛 쪽은 `/planet/monster/[mobCode]`에 있는데 정적이 아니라 edge 동적 라우트다(그쪽 주석 참고).
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return getReleasedMonsterCodes("mapleland").map((mobCode) => ({ mobCode: String(mobCode) }));
}

export async function generateMetadata({ params }: MonsterPageProps): Promise<Metadata> {
  const { mobCode } = await params;
  return buildMonsterMetadata(getMonsterDetail(Number(mobCode), "mapleland"), "mapleland");
}

export default async function MaplelandMonsterPage({ params }: MonsterPageProps) {
  const { mobCode } = await params;
  const detail = getMonsterDetail(Number(mobCode), "mapleland");
  if (!detail) notFound();
  return <MonsterDetailView detail={detail} server="mapleland" />;
}
