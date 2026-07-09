import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메랜Hub - 문의/요청",
  description: "메랜Hub 버그 제보, 기능 추가 요청, 기타 문의를 남길 수 있습니다.",
  alternates: {
    canonical: "/feedback",
  },
  openGraph: {
    title: "메랜Hub - 문의/요청",
    description: "메랜Hub 버그 제보, 기능 추가 요청, 기타 문의를 남길 수 있습니다.",
  },
  twitter: {
    title: "메랜Hub - 문의/요청",
    description: "메랜Hub 버그 제보, 기능 추가 요청, 기타 문의를 남길 수 있습니다.",
  },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
