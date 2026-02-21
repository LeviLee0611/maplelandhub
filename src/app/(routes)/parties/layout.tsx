import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메이플랜드 파티 매칭 목록",
  description: "메이플랜드 파티 모집 글을 필터링하고 빠르게 찾아보세요.",
  keywords: ["메이플랜드", "파티 매칭", "파티 모집", "파티원 구하기"],
  alternates: {
    canonical: "/parties",
  },
};

export default function PartiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
