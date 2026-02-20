import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-10">
      <div className="glass-panel rounded-3xl px-6 py-10 md:px-10">
        <div className="fade-up grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
              계산기 · 파티 매칭 · 몬스터 정보
            </span>
            <h1 className="display mt-4 text-3xl font-semibold leading-tight md:text-4xl">
              매랜Hub, 메이플랜드 유저를 위한
              <br />
              계산과 파티의 기준점.
            </h1>
            <p className="mt-4 text-sm text-slate-200/90 md:text-base">
              계산기는 로그인 없이 바로 사용하고, 파티 글 작성/신청/수락/거절 같은 행동부터 로그인으로 보호합니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/calculators/onehit" className="btn-primary rounded-full px-5 py-2 text-sm font-semibold">
                n방컷 계산기 열기
              </Link>
              <Link href="/parties" className="btn-ghost rounded-full px-5 py-2 text-sm font-semibold">
                파티 매칭 보기
              </Link>
            </div>
          </div>
          <div className="glass-panel-strong rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Today&apos;s Focus</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">SEO 유입 계산기</span>
                <span className="text-emerald-300">활성</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200">파티 모집글</span>
                <span className="text-sky-300">열림</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200">로그인 보호</span>
                <span className="text-amber-300">행동만</span>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              추천 플로우: 계산기 사용 → 파티 모집글 확인 → 로그인 후 참여.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/calculators/onehit" className="glass-panel fade-up rounded-2xl p-5 hover:border-white/30">
          <h2 className="text-lg font-semibold">n방컷 계산기</h2>
          <p className="mt-2 text-sm text-slate-200/90">몬스터 HP/방어력을 기반으로 예상 타수를 계산합니다.</p>
        </Link>
        <Link href="/calculators/taken-damage" className="glass-panel fade-up-delay rounded-2xl p-5 hover:border-white/30">
          <h2 className="text-lg font-semibold">피격 데미지 계산기</h2>
          <p className="mt-2 text-sm text-slate-200/90">방어력과 감소율을 고려한 피해를 추정합니다.</p>
        </Link>
        <Link href="/parties" className="glass-panel fade-up rounded-2xl p-5 hover:border-white/30">
          <h2 className="text-lg font-semibold">파티 매칭</h2>
          <p className="mt-2 text-sm text-slate-200/90">모집글 검색/보기는 비로그인, 행동은 로그인 후 가능합니다.</p>
        </Link>
      </div>
    </section>
  );
}
