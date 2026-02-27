import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 피격 데미지 계산기 설명 | 메이플랜드 계산기";
const description = "피격 데미지 계산기의 적용 방식과 활용 상황을 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/services/damage",
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

export default function DamageInfoPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">계산기 설명</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">피격 데미지 계산기</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          몬스터의 공격을 받을 때 예상되는 피해량을 계산해주는 도구입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">방어/마법 저항 적용 방식</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            물리 방어력과 마법 저항을 각각 적용해 피해 감소량을 계산합니다. 방어 스킬 및 버프도 반영됩니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">유용한 상황</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            고레벨 사냥터 진입 전 생존 가능 여부를 확인할 때, 파티 탱킹 역할을 설계할 때 유용합니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">간단한 계산 공식</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            최종 피해량 = 몬스터 공격력 × (1 - 방어 감소율) × (1 - 저항 감소율)
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">추천 대상</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            생존이 중요한 직업, 고난이도 사냥터를 준비하는 유저에게 적합합니다.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">계산기 바로가기</h2>
        <p className="mt-2 text-sm text-slate-200/90">몬스터와 장비 정보를 입력해 결과를 확인하세요.</p>
        <Link href="/calculator/damage" className="btn-ghost mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold">
          피격 데미지 계산기 열기
        </Link>
      </div>
    </section>
  );
}
