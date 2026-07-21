import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메랜Hub - 문의/요청",
  description: "메랜Hub 버그 제보, 기능 추가 요청, 기타 문의를 남길 수 있습니다.",
  alternates: {
    // /contact("문의하기")와 사실상 같은 목적의 페이지라 구글이 중복으로 판단해 자체적으로
    // 표준 URL을 고르던 문제(GSC: "사용자가 선택한 표준이 없는 중복 페이지") -> /contact를
    // 표준으로 명시 지정해 명확히 함.
    canonical: "/contact",
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
