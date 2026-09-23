import type { Metadata } from "next";
import MonsterDetailView, {
  buildMonsterMetadata,
  buildMonsterStaticParams,
  type MonsterPageProps,
} from "@/components/MonsterDetailView";

/**
 * 메이플 플래닛 몬스터 상세 페이지.
 * 메랜과 스탯이 다른 몬스터가 있어(EXP 배율 등) 같은 mobCode라도 별도 페이지로 만든다.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return buildMonsterStaticParams("planet");
}

export function generateMetadata({ params }: MonsterPageProps): Promise<Metadata> {
  return buildMonsterMetadata(params, "planet");
}

export default function PlanetMonsterPage({ params }: MonsterPageProps) {
  return <MonsterDetailView params={params} server="planet" />;
}
