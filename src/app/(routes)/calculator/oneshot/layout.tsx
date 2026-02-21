import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메이플랜드 원샷 데미지 계산기",
  description: "메이플랜드 원샷 데미지를 계산합니다",
};

export default function OneShotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
