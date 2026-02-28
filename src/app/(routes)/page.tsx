import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

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
    accent: "from-sky-300/20 via-cyan-300/10 to-transparent",
    ring: "border-sky-200/35 bg-sky-300/15",
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
    accent: "from-emerald-300/20 via-teal-300/10 to-transparent",
    ring: "border-emerald-200/35 bg-emerald-300/15",
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
    accent: "from-indigo-300/20 via-violet-300/10 to-transparent",
    ring: "border-indigo-200/35 bg-indigo-300/15",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-violet-300">
        <path fill="currentColor" d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Zm0 3.5 8 3.5 8-3.5V17l-8 3-8-3v-6Z" />
      </svg>
    ),
  },
  {
    title: "메랜 퀘스트",
    description: "곧 오픈됩니다",
    href: "/quests",
    button: "Coming Soon",
    comingSoon: true,
    accent: "from-cyan-300/20 via-blue-300/10 to-transparent",
    ring: "border-cyan-200/35 bg-cyan-300/15",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-cyan-300">
        <path fill="currentColor" d="M6 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-3 2V6a2 2 0 0 1 1-2Zm3 3h4v2H9V7Zm0 4h4v4H9v-4Z" />
      </svg>
    ),
  },
  {
    title: "파티 매칭",
    description: "곧 오픈됩니다",
    href: "/party",
    button: "Coming Soon",
    comingSoon: true,
    accent: "from-amber-300/20 via-orange-300/10 to-transparent",
    ring: "border-amber-200/35 bg-amber-300/15",
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
          <Image
            src="https://maplestory.io/api/gms/62/mob/animated/6130101/move"
            alt="머쉬맘"
            width={52}
            height={40}
            priority
            unoptimized
            className="slime-float h-10 w-auto"
          />
        </h1>
        <p className="relative z-10 mt-3 text-sm text-slate-200/90 md:text-base">
          메이플랜드 유저를 위한 계산기와 데이터 도구를 제공합니다.
        </p>
      </div>

      <div className="grid w-full max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          feature.comingSoon ? (
            <div
              key={feature.title}
              aria-disabled="true"
              className="glass-panel glass-panel-strong relative overflow-hidden rounded-2xl border border-amber-200/35 bg-amber-300/10 p-4 text-left shadow-[0_18px_30px_rgba(2,6,23,0.42)]"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent}`} />
              <div className="relative flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${feature.ring}`}>{feature.icon}</div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-tight">{feature.title}</h2>
                  <p className="mt-1 text-sm text-slate-200/85">{feature.description}</p>
                  <p className="mt-2 inline-flex items-center rounded-full border border-amber-200/40 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                    Coming Soon
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href={feature.href}
              key={feature.title}
              className="glass-panel glass-panel-strong group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left shadow-[0_18px_30px_rgba(2,6,23,0.42)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/45"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent}`} />
              <div className="relative flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${feature.ring}`}>{feature.icon}</div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-tight">{feature.title}</h2>
                  <p className="mt-1 text-sm text-slate-200/85">{feature.description}</p>
                  <p className="mt-2 text-xs font-semibold text-cyan-100/90 transition group-hover:text-cyan-50">
                    바로가기 →
                  </p>
                </div>
              </div>
            </Link>
          )
        ))}
      </div>

      <section className="flex w-full max-w-6xl flex-col gap-4">
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
            ,
            <span className="ml-2 font-semibold text-cyan-200/80">
              메랜 퀘스트
              <span className="ml-1 rounded-full border border-amber-200/40 px-1.5 py-0.5 text-[10px] uppercase text-amber-100">
                Coming Soon
              </span>
            </span>
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
