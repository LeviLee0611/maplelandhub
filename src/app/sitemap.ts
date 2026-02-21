import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maplelandhub.pages.dev";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/calculator/oneshot`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/calculator/damage`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/party`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/parties`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
    },
  ];
}
