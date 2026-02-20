import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "n방컷 계산기 | 매랜Hub",
  description: "몬스터 HP/방어력 기준으로 예상 타수를 계산합니다.",
};

export default function OneHitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
