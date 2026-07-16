import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "메랜Hub - 메이플 플래닛 도구들",
  description: "메이플 플래닛 계산기와 데이터 도구를 한곳에서 제공합니다.",
  keywords: [
    "메이플 플래닛",
    "메이플플래닛",
    "플래닛",
    "메이플 플래닛 계산기",
    "메이플 플래닛 드랍테이블",
    "메이플 플래닛 큐브",
    "메이플 플래닛 잠재능력",
  ],
  alternates: {
    canonical: "/planet",
  },
  openGraph: {
    title: "메랜Hub - 메이플 플래닛 도구들",
    description: "메이플 플래닛 계산기와 데이터 도구를 한곳에서 제공합니다.",
  },
  twitter: {
    title: "메랜Hub - 메이플 플래닛 도구들",
    description: "메이플 플래닛 계산기와 데이터 도구를 한곳에서 제공합니다.",
  },
};

type Feature = {
  title: string;
  description: string;
  href: string;
  button: string;
  accent: string;
  ring: string;
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: "N방컷 계산기",
    description: "몬스터를 몇 방에 잡는지 빠르게 계산합니다",
    href: "/planet/calculators/onehit",
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
    href: "/planet/calculator/damage",
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
    href: "/planet/drop-table",
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
    title: "큐브 시뮬레이터",
    description: "수상한 큐브 / 미라클 큐브 잠재능력 확률을 시뮬레이션합니다",
    href: "/planet/cube-simulator",
    button: "시뮬레이터 열기",
    accent: "from-amber-300/20 via-orange-300/10 to-transparent",
    ring: "border-amber-200/35 bg-amber-300/15",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-amber-300">
        <path fill="currentColor" d="m12 2 2.9 6.1 6.8 1-5 4.8 1.2 6.7L12 17l-5.9 3.6 1.2-6.7-5-4.8 6.8-1L12 2Z" />
      </svg>
    ),
  },
  {
    title: "큐브 빌더",
    description: "내 캐릭터 스펙 기준으로 어느 부위를 큐브 돌리는 게 효율적인지 계산합니다",
    href: "/planet/cube-builder",
    button: "빌더 열기",
    accent: "from-rose-300/20 via-pink-300/10 to-transparent",
    ring: "border-rose-200/35 bg-rose-300/15",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-rose-300">
        <path fill="currentColor" d="M12 4a8 8 0 1 0 8 8h-3a5 5 0 1 1-5-5V4Z" />
      </svg>
    ),
  },
];

export default function PlanetHomePage() {
  return (
    <section className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center gap-10 py-8 text-center">
      <div className="glass-panel relative w-full max-w-xl overflow-hidden rounded-3xl px-6 py-7 md:px-8">
        <div className="absolute left-1/2 top-4 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-3 py-1 text-[11px] font-semibold text-[color:var(--brand-accent-text)]">
          Maple Planet Hub
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)] shadow-[0_0_10px_var(--brand-accent)]" />
        </div>
        <h1 className="relative z-10 mt-8 inline-flex items-center gap-2 text-3xl font-semibold leading-tight md:text-4xl">
          메랜Hub
          <Image
            src="/favicon.ico"
            alt="메랜Hub 아이콘"
            width={40}
            height={40}
            className="h-10 w-10 rounded"
          />
        </h1>
        <p className="relative z-10 mt-3 text-sm text-slate-200/90 md:text-base">
          메이플 플래닛 유저를 위한 계산기와 데이터 도구를 제공합니다.
        </p>
      </div>

      <div className="w-full max-w-4xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400/80">서버를 선택하세요</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/"
            className="glass-panel glass-panel-strong group relative overflow-hidden rounded-3xl border-2 border-white/10 px-6 py-8 text-center transition duration-300 hover:-translate-y-0.5 hover:border-rose-400/60 hover:shadow-[0_0_28px_rgba(190,18,60,0.22)]"
          >
            <div className="text-4xl">🌲</div>
            <h2 className="mt-3 text-xl font-bold text-slate-100 transition group-hover:text-rose-100">메이플랜드</h2>
            <p className="mt-2 text-sm text-slate-200/80">드랍 테이블 · 계산기 · 퀘스트</p>
            <p className="mt-3 text-xs font-semibold text-rose-200/90 transition group-hover:text-rose-100">바로가기 →</p>
          </Link>
          <div className="glass-panel-strong relative overflow-hidden rounded-3xl border-2 border-[var(--brand-accent-border)] px-6 py-8 text-center shadow-[0_0_28px_var(--brand-accent-soft)]">
            <div className="text-4xl">🪐</div>
            <h2 className="mt-3 text-xl font-bold text-[color:var(--brand-accent-text)]">메이플 플래닛</h2>
            <p className="mt-2 text-sm text-slate-200/80">지금 보고 계신 버전이에요</p>
          </div>
        </div>
      </div>

      <div className="grid w-full max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <Link
            href={feature.href}
            key={feature.title}
            className="glass-panel glass-panel-strong group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left shadow-[0_18px_30px_rgba(2,6,23,0.42)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-accent-border)]"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent}`} />
            <div className="relative flex items-start gap-3">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${feature.ring}`}>{feature.icon}</div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-tight">{feature.title}</h2>
                <p className="mt-1 text-sm text-slate-200/85">{feature.description}</p>
                <p className="mt-2 text-xs font-semibold text-[color:var(--brand-accent-text)] transition group-hover:brightness-125">
                  바로가기 →
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="flex w-full max-w-6xl flex-col gap-4">
        <div className="glass-panel w-full rounded-3xl px-7 py-6 text-sm text-slate-200/90 md:text-base">
          <p>
            메이플 플래닛 유틸리티:
            <Link href="/planet/calculators/onehit" className="ml-2 font-semibold text-sky-200 hover:text-white">
              N방컷 계산기
            </Link>
            ,
            <Link href="/planet/calculator/damage" className="ml-2 font-semibold text-emerald-200 hover:text-white">
              피격뎀 계산기
            </Link>
            ,
            <Link href="/planet/drop-table" className="ml-2 font-semibold text-violet-200 hover:text-white">
              드랍 테이블
            </Link>
            ,
            <Link href="/planet/cube-simulator" className="ml-2 font-semibold text-amber-200 hover:text-white">
              큐브 시뮬레이터
            </Link>
            ,
            <Link href="/planet/cube-builder" className="ml-2 font-semibold text-rose-200 hover:text-white">
              큐브 빌더
            </Link>
            를 바로 이용할 수 있습니다.
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
