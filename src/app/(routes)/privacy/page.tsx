import type { Metadata } from "next";

const title = "메랜Hub - 개인정보처리방침 | 메이플랜드 계산기";
const description = "메랜Hub의 개인정보 수집 및 이용 원칙을 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

const sections = [
  {
    title: "수집 항목",
    body: "문의/요청에 필요한 최소한의 정보(닉네임, 연락처 등)만 수집하며, 필수 항목 외에는 선택 입력입니다.",
  },
  {
    title: "이용 목적",
    body: "문의 대응, 서비스 개선, 오류 수정 및 운영 공지 전달을 위해 사용합니다.",
  },
  {
    title: "보관 기간",
    body: "문의 처리 완료 후 1년 이내에 파기하며, 법령에 따라 보관해야 하는 경우는 예외로 합니다.",
  },
  {
    title: "쿠키 및 로그",
    body: "서비스 안정성과 분석을 위해 익명 로그와 쿠키가 사용될 수 있습니다.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">정책 안내</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">개인정보처리방침</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          메랜Hub는 개인정보를 최소한으로 수집하고, 이용 목적 달성 후 안전하게 파기합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="glass-panel rounded-2xl px-5 py-5">
            <h2 className="text-base font-semibold text-slate-100">{section.title}</h2>
            <p className="mt-2 text-sm text-slate-200/90">{section.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
