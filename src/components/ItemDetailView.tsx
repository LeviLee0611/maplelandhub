import type { Metadata } from "next";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { getItemIconUrl } from "@/lib/maplestory-io";
import { jobLabel, type ItemDetail, type ItemDetailIndex, type ItemEquipMeta, type ItemServer } from "@/lib/data/item-detail";

/**
 * 아이템 상세 페이지 — 검색 유입용. 몬스터 상세(MonsterDetailView)와 짝.
 *
 * 왜 만들었나(2026-10-13): GA 28일 기준 이벤트 1위가 drop_table_search 6.5만 건인데, 그 검색 하나하나가
 * URL 없이 드랍 테이블 한 페이지 안에서 끝나 검색엔진·북마크·공유 어디에도 남지 않았다. 유입의 96%가
 * 검색인 사이트에서 색인 가능한 페이지가 73개뿐인 게 정체의 직접 원인이라, 아이템마다 고유 경로를 준다.
 *
 * 서버 컴포넌트 전용. 데이터는 서버별 인덱스(item-detail.mapleland.ts / .planet.ts)가 조립한 결과만 받는다.
 */

export type ItemPageProps = { params: Promise<{ itemId: string }> };

function basePath(server: ItemServer) {
  return server === "planet" ? "/planet" : "";
}

function serverLabel(server: ItemServer) {
  return server === "planet" ? "메이플 플래닛" : "메이플랜드";
}

function probLabel(prob?: number) {
  if (typeof prob !== "number" || !Number.isFinite(prob) || prob <= 0) return "정보 없음";
  const percent = prob * 100;
  return percent >= 1 ? `${percent.toFixed(2)}%` : `${percent.toFixed(4)}%`;
}

// 몬스터 상세 페이지는 두 서버 모두 있다(플래닛은 2026-10-15 edge 동적 라우트로 복구).
function monsterHref(server: ItemServer, mobCode: number) {
  return `${basePath(server)}/monster/${mobCode}`;
}

const EQUIP_INC_LABELS: Array<[keyof ItemEquipMeta, string]> = [
  ["incPAD", "공격력"],
  ["incMAD", "마력"],
  ["incSTR", "STR"],
  ["incDEX", "DEX"],
  ["incINT", "INT"],
  ["incLUK", "LUK"],
  ["incPDD", "물리 방어력"],
  ["incMDD", "마법 방어력"],
  ["incMHP", "최대 HP"],
  ["incMMP", "최대 MP"],
  ["incACC", "명중치"],
  ["incEVA", "회피치"],
  ["incSpeed", "이동속도"],
  ["incJump", "점프력"],
];

const CONSUME_LABELS: Record<string, string> = {
  hp: "HP 회복",
  mp: "MP 회복",
  hpR: "HP 회복(%)",
  mpR: "MP 회복(%)",
  pad: "공격력",
  mad: "마력",
  pdd: "물리 방어력",
  mdd: "마법 방어력",
  acc: "명중치",
  eva: "회피치",
  speed: "이동속도",
  jump: "점프력",
  time: "지속시간",
};

function consumeRows(spec: Record<string, string | number | boolean> | undefined): Array<[string, string]> {
  if (!spec) return [];
  const rows: Array<[string, string]> = [];
  for (const [key, label] of Object.entries(CONSUME_LABELS)) {
    const raw = spec[key];
    if (raw === undefined || raw === null || raw === "" || raw === false) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value === 0) continue;
    if (key === "time") rows.push([label, `${Math.round(value / 1000 / 60)}분`]);
    else if (key.endsWith("R")) rows.push([label, `${value}%`]);
    else rows.push([label, `+${formatNumber(value)}`]);
  }
  const cures = ["poison", "seal", "darkness", "weakness", "curse"].filter((k) => spec[k]);
  if (cures.length) rows.push(["상태이상 해제", cures.map((k) => ({ poison: "중독", seal: "봉인", darkness: "암흑", weakness: "허약", curse: "저주" })[k]).join(", ")]);
  return rows;
}

export async function buildItemMetadata(params: ItemPageProps["params"], index: ItemDetailIndex): Promise<Metadata> {
  const { itemId } = await params;
  const detail = index.getItemDetail(Number(itemId));
  if (!detail) return { title: "아이템 정보를 찾을 수 없습니다 | 메랜Hub" };

  const { item, sources, labels } = detail;
  const label = serverLabel(index.server);
  // 동명이몹(페페 ×2 등)은 설명문에서 한 번만 — 목록 표에는 둘 다 나온다
  const top = [...new Map(sources.map((s) => [s.name, s])).values()].slice(0, 4).map((s) => `${s.name}(Lv.${s.level})`).join(", ");
  const reqLevel = item.meta?.equip?.reqLevel;
  const description =
    `${label} ${item.name} 드랍 몬스터와 확률` +
    (sources.length ? ` — ${top} 등 ${sources.length}종.` : " — 확인된 드랍 몬스터 정보가 없습니다.") +
    (typeof reqLevel === "number" && reqLevel > 0 ? ` 착용 레벨 ${reqLevel}, 분류 ${labels.subCategory ?? labels.category}.` : ` 분류 ${labels.subCategory ?? labels.category}.`);

  const thin = index.isThinItemPage(item.id);
  return {
    title: `${item.name} 드랍 몬스터·획득처 | ${label} 메랜Hub`,
    description,
    alternates: { canonical: `${basePath(index.server)}/item/${item.id}` },
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title: `${item.name} 드랍 몬스터·획득처`, description, type: "article" },
  };
}

export default function ItemDetailView({ detail, server }: { detail: ItemDetail; server: ItemServer }) {
  const { item, labels, sources, related } = detail;
  const base = basePath(server);
  const label = serverLabel(server);
  const equip = item.meta?.equip;
  const scroll = item.meta?.scroll;
  const price = item.meta?.shop?.price;
  const consume = consumeRows(item.meta?.consumeSpec);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${item.name} 드랍 몬스터·획득처`,
    about: { "@type": "Thing", name: item.name },
    isPartOf: { "@type": "WebSite", name: "메랜Hub" },
  };

  const specRows: Array<[string, string]> = [];
  specRows.push(["분류", [labels.overall, labels.category, labels.subCategory].filter(Boolean).join(" › ")]);
  if (equip) {
    if (typeof equip.reqLevel === "number") specRows.push(["착용 레벨", String(equip.reqLevel)]);
    specRows.push(["착용 직업", jobLabel(equip.reqJob)]);
    const reqs = [
      equip.reqSTR ? `STR ${equip.reqSTR}` : null,
      equip.reqDEX ? `DEX ${equip.reqDEX}` : null,
      equip.reqINT ? `INT ${equip.reqINT}` : null,
      equip.reqLUK ? `LUK ${equip.reqLUK}` : null,
      equip.reqPOP ? `인기도 ${equip.reqPOP}` : null,
    ].filter(Boolean);
    if (reqs.length) specRows.push(["요구 스탯", reqs.join(", ")]);
    for (const [key, name] of EQUIP_INC_LABELS) {
      const v = equip[key];
      if (typeof v === "number" && v !== 0) specRows.push([name, `+${formatNumber(v)}`]);
    }
    if (typeof equip.tuc === "number") specRows.push(["업그레이드 횟수", String(equip.tuc)]);
    if (typeof equip.attackSpeed === "number") specRows.push(["공격 속도", String(equip.attackSpeed)]);
  }
  if (scroll) {
    if (typeof scroll.success === "number") specRows.push(["성공 확률", `${scroll.success}%`]);
    if (typeof scroll.masterLevel === "number") specRows.push(["마스터 레벨", String(scroll.masterLevel)]);
  }
  for (const row of consume) specRows.push(row);
  if (typeof price === "number" && price > 1) specRows.push(["상점 판매가", `${formatNumber(price)} 메소`]);
  if (item.meta?.only) specRows.push(["소지 제한", "1개"]);
  if (equip?.tradeBlock) specRows.push(["거래", "불가"]);

  const topSource = sources[0];

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 text-[color:var(--retro-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-xs text-[color:var(--retro-text-muted)]">
        <Link href="/" className="hover:underline">메랜Hub</Link>
        <span className="mx-1">›</span>
        <Link href={`${base}/drop-table`} className="hover:underline">드랍 테이블</Link>
        <span className="mx-1">›</span>
        <span>{item.name}</span>
      </nav>

      <header className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- maplestory.io 외부 아이콘, 서버 컴포넌트라 onError 폴백 없이 1차 URL 만 쓴다 */}
        <img src={getItemIconUrl(item.id)} alt="" width={48} height={48} loading="lazy" className="mt-1 h-12 w-12 shrink-0 object-contain" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-sm text-[color:var(--retro-text-muted)]">
            {label}에서 <strong>{item.name}</strong>
            {sources.length
              ? ` 드랍 몬스터는 ${sources.length}종입니다.` +
                (topSource ? ` 확률이 가장 높은 곳은 ${topSource.name}(Lv.${topSource.level})${topSource.maps[0] ? `, ${topSource.maps[0]}` : ""}입니다.` : "")
              : " 드랍 몬스터 정보는 아직 확인되지 않았습니다."}
            {labels.subCategory ? ` 분류는 ${labels.subCategory}입니다.` : ""}
          </p>
        </div>
      </header>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">아이템 정보</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <tbody>
              {specRows.map(([k, v]) => (
                <tr key={k} className="border-b border-[var(--retro-border)]">
                  <th scope="row" className="w-40 py-1.5 text-left font-medium text-[color:var(--retro-text-muted)]">{k}</th>
                  <td className="py-1.5">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">드랍 몬스터{sources.length ? ` (${sources.length}종)` : ""}</h2>
        {sources.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--retro-border)] text-left text-[color:var(--retro-text-muted)]">
                  <th scope="col" className="py-1.5">몬스터</th>
                  <th scope="col" className="py-1.5">레벨</th>
                  <th scope="col" className="py-1.5">HP</th>
                  <th scope="col" className="py-1.5">드랍 확률</th>
                  <th scope="col" className="py-1.5">출현 맵</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.mobCode} className="border-b border-[var(--retro-border)]">
                    <td className="py-1.5">
                      <Link href={monsterHref(server, s.mobCode)} className="hover:underline">{s.name}</Link>
                    </td>
                    <td className="py-1.5">{s.level}</td>
                    <td className="py-1.5">{formatNumber(s.hp)}</td>
                    <td className="py-1.5">{probLabel(s.prob)}</td>
                    <td className="py-1.5 text-[color:var(--retro-text-muted)]">{s.maps.length ? s.maps.join(", ") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[color:var(--retro-text-muted)]">
            확인된 드랍 몬스터 정보가 없습니다. 퀘스트 보상이나 상점 판매 아이템일 수 있습니다.
          </p>
        )}
      </section>

      {related.length ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">비슷한 레벨의 {labels.subCategory ?? labels.category}</h2>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`${base}/item/${r.id}`} className="hover:underline">
                  {r.name}
                  {typeof r.reqLevel === "number" ? ` (Lv.${r.reqLevel})` : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-xs text-[color:var(--retro-text-muted)]">
        드랍 확률은 공개된 데이터와 커뮤니티 데이터베이스를 대조한 추정치입니다 — 기준은{" "}
        <Link href="/probability" className="hover:underline">확률의 비밀</Link>에 적어두었습니다. 전체 몬스터와 아이템은{" "}
        <Link href={`${base}/drop-table`} className="hover:underline">드랍 테이블</Link>에서 검색할 수 있습니다.
      </p>
    </article>
  );
}
