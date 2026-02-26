import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메랜Hub - N방컷 계산기",
  description: "N방컷 계산기로 이동합니다",
  openGraph: {
    title: "메랜Hub - N방컷 계산기",
    description: "N방컷 계산기로 이동합니다",
  },
  twitter: {
    title: "메랜Hub - N방컷 계산기",
    description: "N방컷 계산기로 이동합니다",
  },
};

export default function OneShotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
