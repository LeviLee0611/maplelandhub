import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 퀘스트 섹션 설명 | 메이플랜드 도구";
const description = "NPC별 퀘스트 조건/보상 검색, 레벨순 정렬, 선행퀘/반복퀘 표기 기능을 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/services/quests",
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

export default function QuestsInfoPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">데이터 섹션 설명</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">메랜 퀘스트</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          NPC별 퀘스트를 월드 공통 기준으로 정리하고, 조건/보상/선행 여부를 한 화면에서 확인합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">정렬 기준</h2>
          <p className="mt-2 text-sm text-slate-200/90">레벨 오름차순 정렬 후 동일 레벨은 퀘스트명 기준으로 정렬합니다.</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">검색 범위</h2>
          <p className="mt-2 text-sm text-slate-200/90">퀘스트명, NPC명, 보상 아이템명으로 통합 검색할 수 있습니다.</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">퀘스트 상태 표기</h2>
          <p className="mt-2 text-sm text-slate-200/90">반복 퀘스트 여부와 선행 퀘스트 목록을 명확하게 표시합니다.</p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">월드 기준</h2>
          <p className="mt-2 text-sm text-slate-200/90">현재는 모든 월드 공통 데이터로 노출됩니다.</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">퀘스트 섹션 바로가기</h2>
        <p className="mt-2 text-sm text-slate-200/90">검색과 정렬은 퀘스트 페이지에서 바로 사용할 수 있습니다.</p>
        <Link href="/quests" className="btn-ghost mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold">
          퀘스트 섹션 열기
        </Link>
      </div>
    </section>
  );
}
