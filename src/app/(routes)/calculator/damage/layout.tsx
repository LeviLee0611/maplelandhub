import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메랜Hub - 피격 데미지 계산기",
  description: "메이플랜드 피격 데미지를 추정합니다",
  alternates: {
    canonical: "/calculator/damage",
  },
  openGraph: {
    title: "메랜Hub - 피격 데미지 계산기",
    description: "메이플랜드 피격 데미지를 추정합니다",
  },
  twitter: {
    title: "메랜Hub - 피격 데미지 계산기",
    description: "메이플랜드 피격 데미지를 추정합니다",
  },
};

export default function DamageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
