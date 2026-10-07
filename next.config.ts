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
    ];
  },
};

export default nextConfig;
