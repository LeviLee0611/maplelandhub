import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 드랍 테이블 설명 | 메이플랜드 계산기";
const description = "드랍 테이블의 확률 계산 방식과 데이터 신뢰도를 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/services/drop-table",
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

export default function DropTableInfoPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">드랍 테이블 설명</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">드랍 테이블</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          몬스터별 드랍 아이템과 확률을 정리해 보여주는 페이지입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">몬스터별 드랍 아이템</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            몬스터를 기준으로 드랍 아이템 목록과 확률을 정리합니다. 아이템 검색 시에는 해당 아이템을 드랍하는 몬스터를 보여줍니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">확률 추정 방식</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            드랍은 한 번의 처치가 성공/실패로 나뉘는 베르누이 시행으로 보고, 각 처치에서 독립적으로 확률을 계산합니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">확률 계산 공식</h2>
          <p className="mt-2 text-sm text-slate-200/90">P(k) = C(n, k) · p^k · (1 - p)^(n-k)</p>
          <p className="mt-2 text-sm text-slate-200/90">특정 아이템이 한 번 이상 드랍될 확률: 1 - (1 - p)^n</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">데이터 신뢰도 안내</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            데이터는 공개된 자료와 커뮤니티 검증을 기반으로 하며, 서버/버전에 따라 달라질 수 있습니다.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">드랍 테이블 바로가기</h2>
        <p className="mt-2 text-sm text-slate-200/90">원하는 몬스터나 아이템을 검색해 확률을 확인하세요.</p>
        <Link href="/drop-table" className="btn-ghost mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold">
          드랍 테이블 열기
        </Link>
      </div>
    </section>
  );
}
