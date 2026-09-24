import type { MetadataRoute } from "next";
import { getReleasedMonsterCodes } from "@/lib/data/monster-detail";

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
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/changelog`,
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
      url: `${baseUrl}/login`,
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
      url: `${baseUrl}/buff-timer`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/calculators`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/exp-tracker`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/farming-manager`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date(),
    },
    // 몬스터 상세 페이지. 출시 필터를 통과한 몬스터만 정적 생성되므로 같은 소스를 쓴다
    // (`generateStaticParams`와 어긋나면 sitemap이 404를 가리키게 된다).
    ...getReleasedMonsterCodes("mapleland").map((mobCode) => ({
      url: `${baseUrl}/monster/${mobCode}`,
      lastModified: new Date(),
    })),
    ...getReleasedMonsterCodes("planet").map((mobCode) => ({
      url: `${baseUrl}/planet/monster/${mobCode}`,
      lastModified: new Date(),
    })),
  ];
}
