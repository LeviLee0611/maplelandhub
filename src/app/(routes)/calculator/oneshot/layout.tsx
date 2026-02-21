import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메이플랜드 한방컷 계산기",
  description: "한방컷 계산기로 이동합니다",
};

export default function OneShotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
