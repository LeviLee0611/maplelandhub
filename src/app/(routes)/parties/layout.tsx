import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "파티 매칭 | 매랜Hub",
  description: "메이플랜드 파티 모집글을 검색하고 참여하세요.",
};

export default function PartiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
