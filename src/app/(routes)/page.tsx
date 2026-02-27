import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "메랜Hub - 메이플랜드 도구들",
  description: "메이플랜드 계산기와 데이터 도구를 한곳에서 제공합니다.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "메랜Hub - 메이플랜드 도구들",
    description: "메이플랜드 계산기와 데이터 도구를 한곳에서 제공합니다.",
  },
  twitter: {
    title: "메랜Hub - 메이플랜드 도구들",
    description: "메이플랜드 계산기와 데이터 도구를 한곳에서 제공합니다.",
  },
};

const features = [
  {
    title: "N방컷 계산기",
    description: "몬스터를 몇 방에 잡는지 빠르게 계산합니다",
    href: "/calculators/onehit",
    button: "계산기 열기",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-sky-300">
        <path
          fill="currentColor"
          d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm2 3v3h8V5H8Zm0 5v2h2v-2H8Zm0 4v2h2v-2H8Zm4-4v2h2v-2h-2Zm0 4v2h2v-2h-2Zm4-4v6h2v-6h-2Z"
        />
      </svg>
    ),
  },
  {
    title: "피격뎀 계산기",
    description: "몬스터 피격 데미지를 추정합니다",
    href: "/calculator/damage",
    button: "계산기 열기",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-emerald-300">
        <path
          fill="currentColor"
          d="M12 2 4.5 5v6c0 5.25 3.75 9.75 7.5 11 3.75-1.25 7.5-5.75 7.5-11V5L12 2Zm0 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
        />
      </svg>
    ),
  },
  {
    title: "드랍 테이블",
    description: "몬스터/아이템 드랍 정보를 빠르게 검색합니다",
    href: "/drop-table",
    button: "드랍 테이블 열기",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-violet-300">
        <path
          fill="currentColor"
          d="M12 2 3 6v6c0 5.25 3.75 9.75 9 11 5.25-1.25 9-5.75 9-11V6l-9-4Zm-1 6h2v2h-2V8Zm0 4h2v6h-2v-6Z"
        />
      </svg>
    ),
  },
  {
    title: "파티 매칭",
    description: "파티원을 쉽게 모집/탐색하세요",
    href: "/party",
    button: "매칭 보기",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-amber-300">
        <path
          fill="currentColor"
          d="M7 11a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm10 0a3 3 0 1 1 3-3 3 3 0 0 1-3 3ZM4 20v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1H4Zm10 0v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1h-10Z"
        />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <section className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center gap-10 py-8 text-center">
      <div className="glass-panel relative w-full max-w-xl overflow-hidden rounded-3xl px-6 py-7 md:px-8">
        <div className="absolute left-1/2 top-4 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-[11px] font-semibold text-cyan-100/80">
          MapleLand Hub
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
        </div>
        <h1 className="relative z-10 mt-8 inline-flex items-center gap-2 text-3xl font-semibold leading-tight md:text-4xl">
          메랜Hub
          <img
            src="https://maplestory.io/api/gms/62/mob/animated/6130101/move"
            alt="머쉬맘"
            className="slime-float h-10 w-auto"
          />
        </h1>
        <p className="relative z-10 mt-3 text-sm text-slate-200/90 md:text-base">
          메이플랜드 유저를 위한 계산기와 데이터 도구를 제공합니다.
        </p>
      </div>

      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="glass-panel flex h-full flex-col gap-4 rounded-2xl p-6 text-left transition duration-300 hover:scale-[1.02]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">{feature.icon}</div>
            <div>
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-200/90">{feature.description}</p>
            </div>
            <Link href={feature.href} className="btn-ghost mt-auto inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold">
              {feature.button}
            </Link>
          </div>
        ))}
      </div>

      <section className="flex w-full max-w-5xl flex-col gap-4">
        <div className="glass-panel w-full rounded-3xl px-7 py-6 text-sm text-slate-200/90 md:text-base">
          <p>
            주요 유틸리티:
            <Link href="/calculators/onehit" className="ml-2 font-semibold text-sky-200 hover:text-white">
              N방컷 계산기
            </Link>
            ,
            <Link href="/calculator/damage" className="ml-2 font-semibold text-emerald-200 hover:text-white">
              피격뎀 계산기
            </Link>
            ,
            <Link href="/drop-table" className="ml-2 font-semibold text-violet-200 hover:text-white">
              드랍 테이블
            </Link>
            을 바로 이용할 수 있습니다.
          </p>
          <p className="mt-3">
            문의/추가 요청은
            <Link href="/feedback" className="ml-2 font-semibold text-amber-200 hover:text-white">
              문의/요청
            </Link>
            에서 남겨주세요. 작성 내용은 운영자만 확인합니다.
          </p>
        </div>
      </section>

    </section>
  );
}
