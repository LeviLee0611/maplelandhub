import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "피격 데미지 계산기 | 매랜Hub",
  description: "방어력과 감소율 기준으로 피격 데미지를 추정합니다.",
};

export default function TakenDamageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
