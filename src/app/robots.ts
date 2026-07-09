import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maplelandhub.com";
  const baseUrl = rawBaseUrl.trim().replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/callback", "/admin", "/admin/*", "/ui/demo"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
