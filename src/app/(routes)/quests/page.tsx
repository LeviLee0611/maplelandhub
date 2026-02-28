export default function QuestsPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="glass-panel glass-panel-strong w-full rounded-3xl border border-white/10 px-8 py-12">
        <p className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-100">
          Coming Soon
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-100 md:text-4xl">메랜 퀘스트</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          퀘스트 데이터 검수와 UI 마무리 작업 중입니다.
          <br />
          곧 정식 오픈 예정입니다.
        </p>
      </div>
    </section>
  );
}
