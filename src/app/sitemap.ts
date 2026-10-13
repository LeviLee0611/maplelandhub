import type { MetadataRoute } from "next";
import { getReleasedMonsterCodes, isThinMonsterPage } from "@/lib/data/monster-detail";
import { maplelandItemIndex } from "@/lib/data/item-detail.mapleland";
import { planetItemIndex } from "@/lib/data/item-detail.planet";

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maplelandhub.com";
  const baseUrl = rawBaseUrl.trim().replace(/\/$/, "");

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/calculators/onehit`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/calculator/damage`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/drop-table`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/quests`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/mapleland-vs-planet`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/announcements`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/probability`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/services/onehit`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/services/damage`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/services/drop-table`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/services/quests`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/planet`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/planet/drop-table`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/planet/calculator/damage`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/planet/calculators/onehit`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/planet/cube-simulator`,
      lastModified: new Date(),
    },
    // 누락돼 있던 공개 라우트(2026-09-23 보완).
    // 의도적 제외: /probability-secret, /ui/demo, 그리고 /planet/cube-builder —
    // 큐브 빌더는 노출 중단 상태로 페이지 자체가 robots noindex다(2026-09-24 Codex 지적).
    // noindex 페이지를 sitemap에 넣으면 서로 모순된 신호를 보내게 된다.
    {
      url: `${baseUrl}/calculators`,
      lastModified: new Date(),
    },
    // 2026-10-07 GSC 색인 보고서 보고 뺀 것:
    // - /feedback — canonical 이 /contact 를 가리키므로 사이트맵에 넣으면 신호가 엇갈린다
    //   ("적절한 표준 태그가 포함된 대체 페이지"로 잡힘). cube-builder 와 같은 이유.
    // - /login — 로그인 버튼뿐인 페이지. 색인 요청할 내용이 없다.
    // - /farming-manager, /exp-tracker, /buff-timer, /updates, /changelog — 2026-10-12 페이지 자체를 삭제하고
    //   리다이렉트로 돌렸다(next.config.ts). "준비 중" 안내·빈 더미 페이지는 애드센스 비승인 사유다.
    // 몬스터 상세 페이지. 출시 필터를 통과한 몬스터만 정적 생성되므로 같은 소스를 쓴다
    // (`generateStaticParams`와 어긋나면 sitemap이 404를 가리키게 된다).
    // 플래닛 몬스터 상세는 뺐다 — 메랜+플래닛 1,056개를 프리렌더하면 Next 16이 페이지당 파일
    // 12개를 만들어 라우트가 13,500개가 되고, @cloudflare/next-on-pages가 라우팅 매니페스트를
    // 만들다 "Invalid string length"로 빌드에 실패한다(2026-09-24 실측). 메랜만 유지한다.
    // 드롭도 출현 맵도 없는 몬스터(보스 부위 등 51종)는 뺀다 — 페이지에 noindex 를 주는 것과
    // 짝을 맞춰야 한다. sitemap 으로 색인을 요청해놓고 페이지에서 거부하면 신호가 엇갈린다.
    ...getReleasedMonsterCodes("mapleland")
      .filter((mobCode) => !isThinMonsterPage(mobCode, "mapleland"))
      .map((mobCode) => ({
        url: `${baseUrl}/monster/${mobCode}`,
        lastModified: new Date(),
      })),
    // 아이템 상세(2026-10-13). edge 동적 라우트라 프리렌더 라우트 상한과 무관해 플래닛도 넣는다.
    // 드랍 몬스터도 스펙도 없는 아이템은 noindex 와 짝을 맞춰 뺀다(isThinItemPage).
    ...maplelandItemIndex.getIndexableItemIds().map((itemId) => ({
      url: `${baseUrl}/item/${itemId}`,
      lastModified: new Date(),
    })),
    ...planetItemIndex.getIndexableItemIds().map((itemId) => ({
      url: `${baseUrl}/planet/item/${itemId}`,
      lastModified: new Date(),
    })),
  ];
}
