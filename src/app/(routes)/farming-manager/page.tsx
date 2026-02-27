import type { Metadata } from "next";

const title = "메랜Hub - 파밍 매니저 | 메이플랜드 계산기";
const description = "파밍 매니저 기능에 대한 간단한 소개 페이지입니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/farming-manager",
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

export default function FarmingManagerPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">파밍 매니저</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          드랍 테이블과 연계해 파밍 루트를 관리하는 기능을 준비 중입니다.
        </p>
        <p className="mt-2 text-sm text-slate-200/80">
          효율적인 파밍 전략과 목표 아이템 관리 기능을 제공할 예정입니다.
        </p>
      </div>
    </section>
  );
}
