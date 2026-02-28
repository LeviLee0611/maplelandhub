import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 확률의 비밀 (TM) | 메이플랜드 계산기";
const description = "드랍 확률과 계산 방식에 대한 메랜Hub의 철학과 접근 방식을 소개합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/probability-secret",
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

export default function ProbabilitySecretPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">확률의 비밀 (TM)</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">확률의 비밀 (TM)</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          메랜Hub는 복잡한 수식을 숨기지 않고, 누구나 이해할 수 있도록 확률을 풀어 설명합니다.
          드랍 확률은 한 번의 사냥이 얼마나 가치 있는지 판단하는 핵심 지표입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">투명한 계산</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            확률은 베르누이 시행을 기반으로 설명하며, 결과는 퍼센트와 분수 형태로 함께 제공합니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">신뢰도 안내</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            데이터 출처와 버전 차이를 함께 표기해, 정보의 신뢰도를 스스로 판단할 수 있게 합니다.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">더 알아보기</h2>
        <p className="mt-2 text-sm text-slate-200/90">
          드랍 확률 계산이 궁금하다면 드랍 테이블 설명 페이지를 참고하세요.
        </p>
        <Link href="/services/drop-table" className="btn-ghost mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold">
          드랍 테이블 설명 보기
        </Link>
      </div>
    </section>
  );
}
