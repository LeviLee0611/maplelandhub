import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">메이플랜드 유저를 위한 계산기 + 파티 매칭</h1>
        <p className="mt-2 text-slate-700">
          계산기는 로그인 없이 즉시 사용하고, 파티 글 작성/신청/수락/거절 같은 행동부터 로그인 후 사용할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/calculators/onehit" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400">
          <h2 className="font-semibold">n방컷 계산기</h2>
          <p className="mt-2 text-sm text-slate-700">몬스터 HP/방어력 기준으로 예상 타수를 계산합니다.</p>
        </Link>
        <Link href="/calculators/taken-damage" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400">
          <h2 className="font-semibold">피격 데미지 계산기</h2>
          <p className="mt-2 text-sm text-slate-700">방어력과 감소율 기준으로 피격 데미지를 추정합니다.</p>
        </Link>
        <Link href="/parties" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400">
          <h2 className="font-semibold">파티 매칭</h2>
          <p className="mt-2 text-sm text-slate-700">모집글 검색/보기는 비로그인, 행동은 로그인 후 가능합니다.</p>
        </Link>
      </div>
    </section>
  );
}
