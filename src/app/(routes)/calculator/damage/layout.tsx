import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메이플랜드 피격 데미지 계산기",
  description: "메이플랜드 피격 데미지를 추정합니다",
};

export default function DamageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
