import type { Metadata } from "next";

const title = "메랜Hub - 버프 타이머 | 메이플랜드 계산기";
const description = "버프 타이머 기능에 대한 간단한 소개 페이지입니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/buff-timer",
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

export default function BuffTimerPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">버프 타이머</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          버프 지속 시간을 한눈에 관리할 수 있도록 준비 중인 기능입니다.
        </p>
        <p className="mt-2 text-sm text-slate-200/80">
          출시 후에는 여러 버프를 동시에 추적하고 알림을 받을 수 있게 구성할 예정입니다.
        </p>
      </div>
    </section>
  );
}
