import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    webVitalsAttribution: ["CLS", "FCP", "LCP", "INP", "TTFB"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maplestory.io",
        pathname: "/api/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/calculators/taken-damage",
        destination: "/calculator/damage",
        permanent: true,
      },
      // 파티 구인 기능은 완전히 삭제됐다(AGENTS.md Zone C 참고). 구글이 옛 URL을 계속 크롤링해
      // 404 로 잡히므로(2026-10-07 GSC) 홈으로 보낸다.
      { source: "/party", destination: "/", permanent: true },
      { source: "/party/:path*", destination: "/", permanent: true },
      { source: "/parties", destination: "/", permanent: true },
      { source: "/parties/:path*", destination: "/", permanent: true },
      // 2026-10-12 애드센스 재심사 대응: "준비 중" 한 줄짜리 소개 페이지 3개와 내용 없는 더미 2개를 삭제.
      // 구글이 비승인 사유로 명시하는 "제작 중 페이지"·"콘텐츠 불충분"에 정확히 해당했다(DEVLOG 2026-10-12).
      // 기능이 실제로 생기면 그때 페이지를 다시 만든다. 공지/변경 내역은 /announcements 하나로 합친다.
      { source: "/farming-manager", destination: "/calculators", permanent: true },
      { source: "/exp-tracker", destination: "/calculators", permanent: true },
      { source: "/buff-timer", destination: "/calculators", permanent: true },
      { source: "/updates", destination: "/announcements", permanent: true },
      { source: "/changelog", destination: "/announcements", permanent: true },
    ];
  },
};

export default nextConfig;
