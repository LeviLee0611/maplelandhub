import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 사이트 소개 | 메이플랜드 계산기";
const description = "메랜Hub의 목적과 제공 기능을 간단히 소개합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/about",
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

export default function AboutPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">메랜Hub 소개</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">사이트 소개</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          메랜Hub는 메이플랜드 플레이어들이 필요한 계산과 데이터를 한 번에 확인할 수 있도록 만든 허브입니다.
          복잡한 공식 대신 필요한 정보만 빠르게 확인할 수 있게 구성했습니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">핵심 기능</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            N방컷 계산기, 피격 데미지 계산기, 드랍 테이블 검색을 통해 사냥 준비에 필요한 정보를 한눈에 제공합니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">운영 방향</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            데이터 신뢰도와 사용성을 최우선으로 삼고, 빠른 업데이트와 개선을 목표로 합니다.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">바로가기</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/calculators/onehit" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            N방컷 계산기
          </Link>
          <Link href="/calculator/damage" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            피격 데미지 계산기
          </Link>
          <Link href="/drop-table" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            드랍 테이블
          </Link>
        </div>
      </div>
    </section>
  );
}
