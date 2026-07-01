import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메랜Hub - 메랜/매랜 한방컷 계산기 (N방컷 계산기)",
  description: "메랜/매랜(메이플랜드) 몬스터 HP와 데미지로 한방컷 확률과 N방컷을 빠르게 계산합니다.",
  keywords: [
    "메이플랜드",
    "메랜",
    "매랜",
    "메랜 계산기",
    "매랜 계산기",
    "한방컷계산기",
    "한방컷 계산기",
    "메랜 한방컷계산기",
    "매랜 한방컷계산기",
    "N방컷 계산기",
    "n방컷",
    "원킬",
    "데미지 계산기",
  ],
  alternates: {
    canonical: "/calculators/onehit",
  },
  openGraph: {
    title: "메랜Hub - 메랜/매랜 한방컷 계산기 (N방컷 계산기)",
    description: "메랜/매랜(메이플랜드) 몬스터 HP와 데미지로 한방컷 확률과 N방컷을 빠르게 계산합니다.",
  },
  twitter: {
    title: "메랜Hub - 메랜/매랜 한방컷 계산기 (N방컷 계산기)",
    description: "메랜/매랜(메이플랜드) 몬스터 HP와 데미지로 한방컷 확률과 N방컷을 빠르게 계산합니다.",
  },
};

export default function OneHitLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "메이플랜드(메랜/매랜) 한방컷 계산기",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: "메랜/매랜(메이플랜드) 몬스터 HP와 데미지로 한방컷 확률과 N방컷을 빠르게 계산합니다.",
    url: "https://maplelandhub.com/calculators/onehit",
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
