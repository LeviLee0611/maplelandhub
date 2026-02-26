import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
