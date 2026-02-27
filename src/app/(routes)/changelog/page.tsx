import type { Metadata } from "next";

const title = "메랜Hub - 업데이트 내역 | 메이플랜드 계산기";
const description = "메랜Hub의 업데이트 기록을 간단히 확인할 수 있습니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/changelog",
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

export default function ChangelogPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">업데이트 내역</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          메랜Hub의 주요 업데이트와 개선 사항을 기록합니다. 최신 기능은 공지에서 함께 확인할 수 있습니다.
        </p>
        <p className="mt-2 text-sm text-slate-200/80">
          버전/기능 변경 내역은 지속적으로 추가됩니다.
        </p>
      </div>
    </section>
  );
}
