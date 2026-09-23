import type { Metadata } from "next";
import MonsterDetailView, {
  buildMonsterMetadata,
  buildMonsterStaticParams,
  type MonsterPageProps,
} from "@/components/MonsterDetailView";

/**
 * 메이플랜드 몬스터 상세 페이지 — 검색 유입용 정적 페이지.
 * 본문은 `MonsterDetailView`가 담당하고 여기서는 서버 종류만 고정한다.
 * 플래닛 쪽은 `/planet/monster/[mobCode]`에 같은 구조로 있다.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return buildMonsterStaticParams("mapleland");
}

export function generateMetadata({ params }: MonsterPageProps): Promise<Metadata> {
  return buildMonsterMetadata(params, "mapleland");
}

export default function MaplelandMonsterPage({ params }: MonsterPageProps) {
  return <MonsterDetailView params={params} server="mapleland" />;
}
