import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메랜Hub - 메이플 플래닛 드랍 테이블",
  description: "메이플 플래닛 몬스터와 아이템 드랍 정보를 빠르게 검색합니다.",
  keywords: [
    "메이플 플래닛",
    "메이플플래닛",
    "플래닛",
    "메이플 플래닛 드랍테이블",
    "메이플 플래닛 드랍률",
    "메이플 플래닛 몬스터",
    "메이플 플래닛 아이템",
  ],
  alternates: {
    canonical: "/planet/drop-table",
  },
  openGraph: {
    title: "메랜Hub - 메이플 플래닛 드랍 테이블",
    description: "메이플 플래닛 몬스터와 아이템 드랍 정보를 빠르게 검색합니다.",
  },
  twitter: {
    title: "메랜Hub - 메이플 플래닛 드랍 테이블",
    description: "메이플 플래닛 몬스터와 아이템 드랍 정보를 빠르게 검색합니다.",
  },
};

export default function PlanetDropTableLayout({ children }: { children: React.ReactNode }) {
  return children;
}
