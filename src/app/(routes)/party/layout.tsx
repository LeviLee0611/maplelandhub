import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메이플랜드 파티 매칭",
  description: "메이플랜드 파티원을 쉽게 찾고 모집하세요",
};

export default function PartyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
