import type { Metadata } from "next";

const title = "메랜Hub - 경험치 측정 | 메이플랜드 계산기";
const description = "경험치 측정 도구에 대한 간단한 소개 페이지입니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/exp-tracker",
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

export default function ExpTrackerPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">경험치 측정</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          사냥 효율과 레벨업 속도를 분석할 수 있도록 경험치 측정 기능을 준비 중입니다.
        </p>
        <p className="mt-2 text-sm text-slate-200/80">
          전투 로그와 사냥 기록을 연동해 더 정확한 성장 분석을 제공할 예정입니다.
        </p>
      </div>
    </section>
  );
}
