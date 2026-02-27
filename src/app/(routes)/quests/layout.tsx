import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메랜Hub - 메랜 퀘스트",
  description: "NPC별 퀘스트 조건/보상 정보를 검색하고 레벨순으로 확인합니다.",
  alternates: {
    canonical: "/quests",
  },
  openGraph: {
    title: "메랜Hub - 메랜 퀘스트",
    description: "NPC별 퀘스트 조건/보상 정보를 검색하고 레벨순으로 확인합니다.",
  },
  twitter: {
    title: "메랜Hub - 메랜 퀘스트",
    description: "NPC별 퀘스트 조건/보상 정보를 검색하고 레벨순으로 확인합니다.",
  },
};

export default function QuestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
