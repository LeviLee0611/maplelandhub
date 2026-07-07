import type { Metadata } from "next";
import { TakenDamageCalculator } from "@/components/TakenDamageCalculator";
import { getPlanetMonsters } from "@/lib/data/monsters";
import { PlanetBadge } from "@/components/PlanetBadge";

export const metadata: Metadata = {
  title: "메랜Hub - 메이플 플래닛 피격 데미지 계산기",
  description: "메이플 플래닛 피격 데미지를 추정합니다",
  keywords: [
    "메이플 플래닛",
    "메이플플래닛",
    "플래닛",
    "메이플 플래닛 계산기",
    "메이플 플래닛 피격뎀",
    "메이플 플래닛 데미지 계산기",
  ],
  alternates: {
    canonical: "/planet/calculator/damage",
  },
  openGraph: {
    title: "메랜Hub - 메이플 플래닛 피격 데미지 계산기",
    description: "메이플 플래닛 피격 데미지를 추정합니다",
  },
  twitter: {
    title: "메랜Hub - 메이플 플래닛 피격 데미지 계산기",
    description: "메이플 플래닛 피격 데미지를 추정합니다",
  },
};

export default function PlanetDamageCalculatorPage() {
  return (
    <>
      <PlanetBadge />
      <TakenDamageCalculator monsters={getPlanetMonsters()} server="planet" />
    </>
  );
}
