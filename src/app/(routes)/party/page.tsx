export default function PartyComingSoonPage() {
  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)] lg:space-y-7">
      <header className="glass-panel rounded-3xl px-6 py-6 text-left lg:px-8 lg:py-8">
        <h1 className="display text-4xl font-semibold md:text-5xl lg:text-6xl">파티 매칭</h1>
        <p className="mt-3 text-base text-slate-200/90 md:text-lg lg:text-xl">Coming Soon</p>
      </header>

      <div className="glass-panel rounded-2xl border border-amber-200/30 px-5 py-5 text-sm text-slate-200/90 md:text-base lg:px-6 lg:py-6 lg:text-lg">
        파티 매칭 기능은 현재 준비 중입니다. 정식 오픈 전까지는 이용할 수 없습니다.
      </div>
    </section>
  );
}
