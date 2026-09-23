import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNumber } from "@/lib/utils";
import { getMonsterDetail, getReleasedMonsterCodes, type MonsterServer } from "@/lib/data/monster-detail";

/**
 * 몬스터 상세 페이지 — 검색 유입용 정적 페이지.
 *
 * 기존에는 몬스터 정보가 드랍테이블 한 페이지 안에서만 보였고, 몬스터 간 이동도
 * `?mob=이름&mobCode=...` 쿼리스트링이라 검색엔진 눈에는 전부 같은 URL 하나였다.
 * 이 라우트는 몬스터마다 고유 경로를 주어 색인 대상을 1개에서 수백 개로 늘린다.
 *
 * 서버 컴포넌트로만 동작한다(클라이언트 지시어 금지). 데이터는 빌드 시점에 조립돼
 * HTML 텍스트로 나가고, 원본 JSON은 클라이언트로 전송되지 않는다.
 */

export type MonsterPageProps = { params: Promise<{ mobCode: string }> };

export function buildMonsterStaticParams(server: MonsterServer) {
  return getReleasedMonsterCodes(server).map((mobCode) => ({ mobCode: String(mobCode) }));
}

export async function buildMonsterMetadata(params: MonsterPageProps["params"], server: MonsterServer): Promise<Metadata> {
  const { mobCode } = await params;
  const detail = getMonsterDetail(Number(mobCode), server);
  if (!detail) return { title: "몬스터 정보를 찾을 수 없습니다 | 메랜Hub" };

  const label = server === "planet" ? "메이플 플래닛" : "메이플랜드";
  const { monster, drops } = detail;
  const dropNames = drops.slice(0, 5).map((drop) => drop.name).join(", ");
  const description =
    `${label} ${monster.name}(Lv.${monster.level}) 정보 — HP ${formatNumber(monster.hp)}, ` +
    `획득 경험치 ${formatNumber(monster.exp)}, 물리 방어력 ${formatNumber(monster.def)}, ` +
    `회피 ${formatNumber(monster.eva)}.` +
    (dropNames ? ` 드랍 아이템: ${dropNames} 등 ${drops.length}종.` : "");

  return {
    title: `${monster.name} (Lv.${monster.level}) 드랍·스탯 정보 | 메랜Hub`,
    description,
    alternates: { canonical: `${basePath(server)}/monster/${monster.mobCode}` },
    openGraph: {
      title: `${monster.name} (Lv.${monster.level}) 드랍·스탯 정보`,
      description,
      type: "article",
    },
  };
}

function basePath(server: MonsterServer) {
  return server === "planet" ? "/planet" : "";
}

function probLabel(prob?: number) {
  if (typeof prob !== "number" || !Number.isFinite(prob) || prob <= 0) return "정보 없음";
  const percent = prob * 100;
  return percent >= 1 ? `${percent.toFixed(2)}%` : `${percent.toFixed(4)}%`;
}

/** 필요 명중치는 캐릭터 레벨에 따라 달라진다 — 동레벨 기준값을 대표로 보여준다. */
function requiredAccuracyAtSameLevel(eva: number) {
  return Math.max(0, Math.ceil((55 * eva) / 15));
}

export default async function MonsterDetailView({ params, server }: MonsterPageProps & { server: MonsterServer }) {
  const { mobCode } = await params;
  const detail = getMonsterDetail(Number(mobCode), server);
  if (!detail) notFound();

  const { monster, drops, maps, related } = detail;
  const needAcc = requiredAccuracyAtSameLevel(monster.eva ?? 0);
  const elements = monster.ele?.filter((entry) => entry && entry !== "무속성") ?? [];
  const base = basePath(server);
  const serverLabel = server === "planet" ? "메이플 플래닛" : "메이플랜드";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${monster.name} (Lv.${monster.level}) 드랍·스탯 정보`,
    about: { "@type": "Thing", name: monster.name },
    isPartOf: { "@type": "WebSite", name: "메랜Hub" },
  };

  const statRows: Array<[string, string]> = [
    ["레벨", formatNumber(monster.level)],
    ["HP", formatNumber(monster.hp)],
    ["획득 경험치", formatNumber(monster.exp)],
    ["물리 공격력", monster.watk != null ? formatNumber(monster.watk) : "정보 없음"],
    ["마법 공격력", monster.matk != null ? formatNumber(monster.matk) : "정보 없음"],
    ["물리 방어력", formatNumber(monster.def)],
    ["마법 방어력", formatNumber(monster.mDef)],
    ["회피 수치", formatNumber(monster.eva)],
    ["명중 수치", formatNumber(monster.acc)],
    ["속성", elements.length ? elements.join(", ") : "무속성"],
    ["출현 지역", monster.region ?? "정보 없음"],
  ];

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 text-[color:var(--retro-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-xs text-[color:var(--retro-text-muted)]">
        <Link href="/" className="hover:underline">메랜Hub</Link>
        <span className="mx-1">›</span>
        <Link href={`${base}/drop-table`} className="hover:underline">드랍 테이블</Link>
        <span className="mx-1">›</span>
        <span>{monster.name}</span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          {monster.name} <span className="text-base font-normal">(Lv.{monster.level})</span>
        </h1>
        <p className="text-sm text-[color:var(--retro-text-muted)]">
          {serverLabel} <strong>{monster.name}</strong>는 레벨 {monster.level} 몬스터로, HP {formatNumber(monster.hp)},
          획득 경험치 {formatNumber(monster.exp)}입니다. 물리 방어력은 {formatNumber(monster.def)}, 마법 방어력은{" "}
          {formatNumber(monster.mDef)}이며 회피 수치는 {formatNumber(monster.eva)}입니다.
          {monster.eva ? ` 동레벨 캐릭터 기준 필요 명중치는 약 ${formatNumber(needAcc)}입니다.` : ""}
          {elements.length ? ` 속성은 ${elements.join(", ")}입니다.` : ""}
        </p>
      </header>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">스탯</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <tbody>
              {statRows.map(([label, value]) => (
                <tr key={label} className="border-b border-[var(--retro-border)]">
                  <th scope="row" className="w-40 py-1.5 text-left font-medium text-[color:var(--retro-text-muted)]">
                    {label}
                  </th>
                  <td className="py-1.5">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">
          드랍 아이템{drops.length ? ` (${drops.length}종)` : ""}
        </h2>
        {drops.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--retro-border)] text-left text-[color:var(--retro-text-muted)]">
                  <th scope="col" className="py-1.5">아이템</th>
                  <th scope="col" className="py-1.5">분류</th>
                  <th scope="col" className="py-1.5">드랍 확률</th>
                </tr>
              </thead>
              <tbody>
                {drops.map((drop) => (
                  <tr key={drop.itemId} className="border-b border-[var(--retro-border)]">
                    <td className="py-1.5">{drop.name}</td>
                    <td className="py-1.5 text-[color:var(--retro-text-muted)]">{drop.category ?? "-"}</td>
                    <td className="py-1.5">{probLabel(drop.prob)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[color:var(--retro-text-muted)]">확인된 드랍 아이템 정보가 없습니다.</p>
        )}
      </section>

      {maps.length ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">출현 맵 ({maps.length}곳)</h2>
          <p className="text-sm text-[color:var(--retro-text-muted)]">{maps.map((entry) => entry.mapName).join(", ")}</p>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">이 몬스터로 계산하기</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={`${base}/calculators/onehit?mob=${encodeURIComponent(monster.name)}&mobCode=${monster.mobCode}`}
            className="rounded-[10px] border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-3 py-2 font-semibold text-[color:var(--brand-accent-text)]"
          >
            {monster.name} N방컷 계산기
          </Link>
          <Link
            href={`${base}/calculator/damage?mob=${encodeURIComponent(monster.name)}&mobCode=${monster.mobCode}`}
            className="rounded-[10px] border border-[var(--brand-accent-2-border)] bg-[var(--brand-accent-2-soft)] px-3 py-2 font-semibold text-[color:var(--brand-accent-2-text)]"
          >
            {monster.name} 피격 데미지 계산기
          </Link>
        </div>
      </section>

      {related.length ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">비슷한 레벨의 몬스터</h2>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {related.map((entry) => (
              <li key={entry.mobCode}>
                <Link href={`${base}/monster/${entry.mobCode}`} className="hover:underline">
                  {entry.name} (Lv.{entry.level})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-xs text-[color:var(--retro-text-muted)]">
        전체 몬스터와 아이템은 <Link href={`${base}/drop-table`} className="hover:underline">드랍 테이블</Link>에서 검색할 수 있습니다.
      </p>
    </article>
  );
}
