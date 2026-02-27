import type { Metadata } from "next";

const title = "메랜Hub - 업데이트 내역 | 메이플랜드 계산기";
const description = "메랜Hub 업데이트 기록을 확인하세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/updates",
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

const updates = [
  {
    date: "2026-02-26",
    title: "드랍 테이블 UI 개선",
    detail: "확률 표시 방식과 카드 레이아웃을 개선하고, 검색 UX를 강화했습니다.",
  },
  {
    date: "2026-02-20",
    title: "계산기 입력 UX 개선",
    detail: "몬스터 자동 선택 및 주요 입력 흐름을 정리했습니다.",
  },
  {
    date: "2026-02-10",
    title: "초기 공개",
    detail: "N방컷/피격 데미지 계산기 및 드랍 테이블을 공개했습니다.",
  },
];

export default function UpdatesPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">업데이트</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">업데이트 내역</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          최근 변경 사항을 정리했습니다. 최신 기능과 개선 사항을 확인하세요.
        </p>
      </div>

      <div className="grid gap-4">
        {updates.map((update) => (
          <div key={update.title} className="glass-panel rounded-2xl px-5 py-5">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-200/60">{update.date}</div>
            <h2 className="mt-2 text-base font-semibold text-slate-100">{update.title}</h2>
            <p className="mt-2 text-sm text-slate-200/90">{update.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
