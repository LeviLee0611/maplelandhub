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
    ];
  },
};

export default nextConfig;
