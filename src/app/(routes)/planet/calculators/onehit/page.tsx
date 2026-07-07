import type { Metadata } from "next";
import { getPlanetMonsters } from "@/lib/data/monsters";
import { OneHitCalculatorClient } from "@/app/(routes)/calculators/onehit/onehit-calculator-client";
import { PlanetBadge } from "@/components/PlanetBadge";

export const metadata: Metadata = {
  title: "메랜Hub - 메이플 플래닛 한방컷 계산기 (N방컷 계산기)",
  description: "메이플 플래닛 몬스터 HP와 데미지로 한방컷 확률과 N방컷을 빠르게 계산합니다.",
  keywords: [
    "메이플 플래닛",
    "메이플플래닛",
    "플래닛",
    "메이플 플래닛 계산기",
    "메이플 플래닛 한방컷",
    "메이플 플래닛 N방컷",
    "메이플 플래닛 원킬",
  ],
  alternates: {
    canonical: "/planet/calculators/onehit",
  },
  openGraph: {
    title: "메랜Hub - 메이플 플래닛 한방컷 계산기 (N방컷 계산기)",
    description: "메이플 플래닛 몬스터 HP와 데미지로 한방컷 확률과 N방컷을 빠르게 계산합니다.",
  },
  twitter: {
    title: "메랜Hub - 메이플 플래닛 한방컷 계산기 (N방컷 계산기)",
    description: "메이플 플래닛 몬스터 HP와 데미지로 한방컷 확률과 N방컷을 빠르게 계산합니다.",
  },
};

export default function PlanetOneHitCalculatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "메이플 플래닛 한방컷 계산기",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: "메이플 플래닛 몬스터 HP와 데미지로 한방컷 확률과 N방컷을 빠르게 계산합니다.",
    url: "https://maplelandhub.com/planet/calculators/onehit",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PlanetBadge />
      <OneHitCalculatorClient monsters={getPlanetMonsters()} server="planet" />
    </>
  );
}
