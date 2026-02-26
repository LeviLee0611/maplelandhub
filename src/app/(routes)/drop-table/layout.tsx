import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메랜Hub - 드랍 테이블",
  description: "몬스터와 아이템 드랍 정보를 빠르게 검색합니다.",
  alternates: {
    canonical: "/drop-table",
  },
  openGraph: {
    title: "메랜Hub - 드랍 테이블",
    description: "몬스터와 아이템 드랍 정보를 빠르게 검색합니다.",
  },
  twitter: {
    title: "메랜Hub - 드랍 테이블",
    description: "몬스터와 아이템 드랍 정보를 빠르게 검색합니다.",
  },
};

export default function DropTableLayout({ children }: { children: React.ReactNode }) {
  return children;
}
