import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - N방컷 계산기 설명 | 메이플랜드 계산기";
const description = "N방컷 계산기의 계산 방식과 사용 대상, 활용 시나리오를 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/services/onehit",
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

export default function OneHitInfoPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">계산기 설명</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">N방컷 계산기</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          몬스터를 몇 번 공격해야 처치할 수 있는지(N방컷)를 계산해주는 도구입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">무엇을 계산하나요?</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            캐릭터 공격력, 스킬 계수, 버프와 몬스터 방어력을 고려해 평균 피해량과 N방컷을 계산합니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">계산 방식 개요</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            평균 데미지를 기준으로 몬스터 HP를 나누어 필요한 공격 횟수를 추정합니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">누가 사용하면 좋을까요?</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            사냥터 선택, 장비 교체, 버프 효율을 빠르게 검증하고 싶은 유저에게 적합합니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">예시 사용 시나리오</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            “검은 켄타우로스를 3방컷으로 만들 수 있을까?” 같은 질문에 즉시 답을 제공합니다.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">계산기 바로가기</h2>
        <p className="mt-2 text-sm text-slate-200/90">실제 수치 입력은 계산기에서 진행합니다.</p>
        <Link href="/calculators/onehit" className="btn-ghost mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold">
          N방컷 계산기 열기
        </Link>
      </div>
    </section>
  );
}
