import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

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

type Feature = {
  title: string;
  description: string;
  href: string;
  button: string;
  accent: string;
  ring: string;
  icon: ReactNode;
  comingSoon?: boolean;
};

const features: Feature[] = [
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
    description: "퀘스트 데이터와 조건/보상을 확인합니다",
    href: "/quests",
    button: "퀘스트 열기",
    accent: "from-cyan-300/20 via-blue-300/10 to-transparent",
    ring: "border-cyan-200/35 bg-cyan-300/15",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-cyan-300">
        <path fill="currentColor" d="M6 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-3 2V6a2 2 0 0 1 1-2Zm3 3h4v2H9V7Zm0 4h4v4H9v-4Z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <section className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center gap-10 py-8 text-center">
      <div className="glass-panel relative w-full max-w-xl overflow-hidden rounded-3xl px-6 py-7 md:px-8">
        <div className="absolute left-1/2 top-4 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-[11px] font-semibold text-rose-100/80">
          MapleLand Hub
          <span className="h-1.5 w-1.5 rounded-full bg-rose-300/80 shadow-[0_0_10px_rgba(190,18,60,0.85)]" />
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
          메이플랜드 유저를 위한 계산기와 데이터 도구를 제공합니다.
        </p>
      </div>

      <div className="w-full max-w-4xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400/80">서버를 선택하세요</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass-panel-strong relative overflow-hidden rounded-3xl border-2 border-rose-400/60 px-6 py-8 text-center shadow-[0_0_28px_rgba(190,18,60,0.22)]">
            <div className="text-4xl">🌲</div>
            <h2 className="mt-3 text-xl font-bold text-rose-100">메이플랜드</h2>
            <p className="mt-2 text-sm text-slate-200/80">지금 보고 계신 버전이에요</p>
          </div>
          <Link
            href="/planet"
            className="glass-panel glass-panel-strong group relative overflow-hidden rounded-3xl border-2 border-white/10 px-6 py-8 text-center transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/60 hover:shadow-[0_0_28px_rgba(245,158,11,0.22)]"
          >
            <div className="text-4xl">🪐</div>
            <h2 className="mt-3 text-xl font-bold text-slate-100 transition group-hover:text-amber-200">메이플 플래닛</h2>
            <p className="mt-2 text-sm text-slate-200/80">드랍 테이블 · 계산기 · 큐브 시뮬레이터</p>
            <p className="mt-3 text-xs font-semibold text-amber-200/90 transition group-hover:text-amber-100">
              바로가기 →
            </p>
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) =>
          feature.comingSoon ? (
            <div
              key={feature.title}
              className="glass-panel glass-panel-strong relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left opacity-80"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent}`} />
              <div className="relative flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${feature.ring}`}>{feature.icon}</div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-tight">{feature.title}</h2>
                  <p className="mt-1 text-sm text-slate-200/85">{feature.description}</p>
                  <p className="mt-2 text-xs font-semibold text-amber-100/90">Coming Soon</p>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href={feature.href}
              key={feature.title}
              className="glass-panel glass-panel-strong group relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left shadow-[0_18px_30px_rgba(2,6,23,0.42)] transition duration-300 hover:-translate-y-0.5 hover:border-rose-300/45"
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
          ),
        )}
      </div>

      {/*
        사이트가 무엇이고 데이터를 어떻게 다루는지 설명하는 본문.
        도구 사이트는 화면 대부분이 입력창과 표라 방문자도 검색엔진도 "여기가 뭘 하는 곳인지"를
        알기 어렵다. 실제로 하는 일(다중 소스 교차검증, 패치 추적, 서버별 분리)을 적어둔다.
      */}
      <section className="w-full max-w-6xl text-left">
        <div className="glass-panel rounded-3xl px-7 py-7">
          <h2 className="text-lg font-semibold text-slate-100 md:text-xl">메랜Hub는 어떤 사이트인가요?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200/90 md:text-base">
            메랜Hub는 <strong className="text-slate-100">메이플랜드</strong>와{" "}
            <strong className="text-slate-100">메이플 플래닛</strong> 두 서버의 몬스터·아이템·퀘스트 데이터를 모아
            계산기와 검색 도구로 제공하는 팬메이드 사이트입니다. 사냥터를 고르거나 장비를 맞출 때 매번 여러 사이트를
            오가며 수치를 찾아야 했던 과정을, 한 화면에서 끝낼 수 있도록 만들었습니다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-200/90 md:text-base">
            두 서버는 같은 원작을 기반으로 하지만 각자 밸런스 패치를 해오면서 스킬 수치, 획득 경험치, 드랍률이
            조금씩 달라졌습니다. 그래서 서버를 선택하면 그 서버 기준의 값만 보여주고, 차이가 확인된 부분은{" "}
            <Link href="/mapleland-vs-planet" className="font-semibold text-sky-200 hover:text-white">
              메랜 vs 플래닛 차이
            </Link>{" "}
            페이지에 따로 정리해 두었습니다.
          </p>

          <h3 className="mt-6 text-base font-semibold text-slate-100">제공하는 도구</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-slate-200/90 md:text-base">
            <li>
              <strong className="text-slate-100">N방컷 계산기</strong> — 내 공격력과 스킬로 특정 몬스터를 몇 대에
              잡는지 계산합니다. 몬스터 방어력과 스킬 데미지%를 반영하므로, 사냥터를 옮기기 전에 한 방에 잡히는지
              미리 확인할 수 있습니다.
            </li>
            <li>
              <strong className="text-slate-100">피격 데미지 계산기</strong> — 몬스터에게 맞았을 때 받는 피해를
              추정합니다. 물리 방어력과 마법 저항을 적용해 계산하므로 장비를 바꿀 때 생존력 변화를 가늠할 수 있습니다.
            </li>
            <li>
              <strong className="text-slate-100">드랍 테이블</strong> — 몬스터로 아이템을 찾거나, 반대로 아이템으로
              그걸 떨구는 몬스터를 역으로 찾는 양방향 검색을 지원합니다.
            </li>
            <li>
              <strong className="text-slate-100">퀘스트</strong> — NPC별 퀘스트의 수행 조건과 보상을 정리했고,
              진행 상황을 체크해 둘 수 있습니다.
            </li>
          </ul>

          <h3 className="mt-6 text-base font-semibold text-slate-100">데이터는 이렇게 모읍니다</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-200/90 md:text-base">
            몬스터 스탯과 아이템 정보는 공개 게임 데이터(maplestory.io)를 기준으로 삼고, 여기에 각 서버의{" "}
            <strong className="text-slate-100">공식 패치노트</strong>를 추적해 변경 사항을 반영합니다. 한 곳의 값만
            믿지 않고 여러 커뮤니티 데이터베이스와 대조해 어긋나는 항목을 찾아내며, 서로 다를 때는 어느 쪽이 맞는지
            확인될 때까지 섣불리 고치지 않습니다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-200/90 md:text-base">
            다만 <strong className="text-slate-100">드랍 확률은 게임 내부 수치가 공개되지 않아</strong> 외부에서
            수집한 값을 정리한 것입니다. 실제와 다를 수 있고, 확인되지 않은 항목은 임의로 채우지 않고{" "}
            <em className="not-italic text-slate-100">&ldquo;정보 없음&rdquo;</em>으로 표시합니다. 잘못된 값을
            발견하시면 문의로 알려주시면 확인 후 반영합니다.
          </p>
        </div>
      </section>

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
            <Link href="/quests" className="ml-2 font-semibold text-cyan-200 hover:text-white">
              메랜 퀘스트
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

      <footer className="mt-4 flex w-full max-w-6xl flex-col items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-400/80">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>메랜Hub v1.0</span>
          <Link href="/about" className="hover:text-slate-200">
            사이트 소개
          </Link>
          <Link href="/guide" className="hover:text-slate-200">
            사용방법
          </Link>
          <Link href="/mapleland-vs-planet" className="hover:text-slate-200">
            메랜 vs 플래닛 차이
          </Link>
          <Link href="/privacy" className="hover:text-slate-200">
            개인정보처리방침
          </Link>
          <Link href="/feedback" className="hover:text-slate-200">
            문의/요청
          </Link>
        </div>
        <p>본 사이트는 메이플랜드 공식 서비스가 아닌 팬메이드 유틸리티입니다.</p>
      </footer>

    </section>
  );
}
