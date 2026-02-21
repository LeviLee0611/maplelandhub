import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메이플랜드 한방컷 계산기",
  description: "몬스터 HP와 데미지로 한방컷(n방컷)을 빠르게 계산합니다.",
  keywords: ["메이플랜드", "한방컷 계산기", "n방컷", "원킬", "데미지 계산기"],
  alternates: {
    canonical: "/calculators/onehit",
  },
};

export default function OneHitLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "메이플랜드 한방컷 계산기",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: "몬스터 HP와 데미지로 한방컷(n방컷)을 빠르게 계산합니다.",
    url: "https://maplelandhub.pages.dev/calculators/onehit",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
