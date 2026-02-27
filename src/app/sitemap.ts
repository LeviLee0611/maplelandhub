import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maplelandhub.pages.dev";
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
