import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MonsterDetailView, { buildMonsterMetadata, type MonsterPageProps } from "@/components/MonsterDetailView";
import { planetMonsterIndex } from "@/lib/data/monster-detail.planet";

/**
 * 메이플 플래닛 몬스터 상세 페이지 — edge 동적 라우트.
 *
 * 9/24에 정적 생성으로 만들었다가 Cloudflare next-on-pages 라우트 상한(프리렌더 페이지당 파일 12개,
 * ~6,300 라우트)에 걸려 뺐던 페이지다. 아이템 페이지(2026-10-13)처럼 `runtime = "edge"` 동적 라우트로
 * 만들면 프리렌더 파일이 없어 그 상한과 무관하다 — 아이템 5,463개가 같은 방식으로 배포됐다.
 * 데이터는 플래닛 전용 모듈만 쓴다(monster-detail.ts 를 import 하면 메랜 분까지 번들에 실린다).
 */
export const runtime = "edge";

function resolve(mobCode: string) {
  const code = Number(mobCode);
  return Number.isInteger(code) && code > 0 ? planetMonsterIndex.getMonsterDetail(code) : null;
}

export async function generateMetadata({ params }: MonsterPageProps): Promise<Metadata> {
  const { mobCode } = await params;
  return buildMonsterMetadata(resolve(mobCode), "planet");
}

export default async function PlanetMonsterPage({ params }: MonsterPageProps) {
  const { mobCode } = await params;
  const detail = resolve(mobCode);
  if (!detail) notFound();
  return <MonsterDetailView detail={detail} server="planet" />;
}
