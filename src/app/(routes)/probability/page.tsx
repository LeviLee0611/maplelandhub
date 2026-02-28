import type { Metadata } from "next";

const title = "메랜Hub - 확률의 비밀 (TM) | 메이플랜드 계산기";
const description = "드랍 확률과 계산 방식에 대한 메랜Hub의 접근을 설명합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/probability",
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

export default function ProbabilityPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">확률의 비밀 (TM)</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          메랜Hub는 확률 계산 과정을 투명하게 공개하며, 실제 사냥에서 체감할 수 있는 형태로 설명합니다.
        </p>
        <p className="mt-2 text-sm text-slate-200/80">
          드랍 테이블과 확률 계산 페이지를 함께 확인하면 더 정확한 전략을 세울 수 있습니다.
        </p>
      </div>
    </section>
  );
}
