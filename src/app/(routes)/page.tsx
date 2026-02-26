import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "메랜Hub - 메이플랜드 도구들",
  description: "N방컷 계산기 등 메이플랜드 유틸리티를 빠르게 제공합니다.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "메랜Hub - 메이플랜드 도구들",
    description: "N방컷 계산기 등 메이플랜드 유틸리티를 빠르게 제공합니다.",
  },
  twitter: {
    title: "메랜Hub - 메이플랜드 도구들",
    description: "N방컷 계산기 등 메이플랜드 유틸리티를 빠르게 제공합니다.",
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
      <div className="glass-panel w-full max-w-3xl rounded-3xl px-6 py-10 md:px-12">
        <h1 className="display text-4xl font-semibold leading-tight md:text-5xl">
          메랜
          <br />
          Hub
        </h1>
        <p className="mt-4 text-sm text-slate-200/90 md:text-base">
          메랜Hub는 메이플랜드 유저를 위한 데이터 기반 계산기 플랫폼입니다.
          <br />
          N방컷 계산기, 피격 데미지 계산기, 드랍 확률 분석 기능을 제공합니다.
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

      <div className="glass-panel w-full max-w-4xl rounded-2xl px-6 py-5 text-sm text-slate-200/90">
        <p>
          핵심 유틸리티:
          <Link href="/calculators/onehit" className="ml-2 font-semibold text-sky-200 hover:text-white">
            N방컷 계산기
          </Link>
          ,
          <Link href="/party" className="ml-2 font-semibold text-emerald-200 hover:text-white">
            파티 매칭
          </Link>
          을 바로 이용할 수 있습니다.
        </p>
        <p className="mt-2">
          문의/추가 요청은
          <Link href="/feedback" className="ml-2 font-semibold text-amber-200 hover:text-white">
            문의/요청
          </Link>
          에서 남겨주세요. 작성 내용은 운영자만 확인합니다.
        </p>
      </div>

      <section className="flex w-full max-w-5xl justify-end">
        <div className="glass-panel w-full max-w-md rounded-2xl px-5 py-4 text-left">
          <h2 className="text-sm font-semibold text-slate-100">사이트 안내</h2>
          <div className="mt-3 grid gap-2">
            {[
              {
                title: "N방컷 계산기",
                description: "한방컷 확률과 기대 처치 수를 분석합니다.",
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-sky-300">
                    <path
                      fill="currentColor"
                      d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 3v2h10V7H7Zm0 4v2h6v-2H7Zm0 4v2h4v-2H7Z"
                    />
                  </svg>
                ),
              },
              {
                title: "피격뎀 계산기",
                description: "직업별 방어력과 마법 피해를 계산합니다.",
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-emerald-300">
                    <path fill="currentColor" d="M12 3 4 6v6c0 5.25 3.75 9.75 8 11 4.25-1.25 8-5.75 8-11V6l-8-3Z" />
                  </svg>
                ),
              },
              {
                title: "드랍 테이블",
                description: "몬스터/아이템 드랍 정보를 빠르게 확인합니다.",
                icon: (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-violet-300">
                    <path fill="currentColor" d="M12 2 3 6v6c0 5.25 3.75 9.75 9 11 5.25-1.25 9-5.75 9-11V6l-9-4Zm-1 6h2v6h-2V8Zm0 8h2v2h-2v-2Z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200/90 transition hover:border-cyan-200/50 hover:bg-white/10"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="text-[12px] font-semibold text-slate-100">{item.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-200/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
