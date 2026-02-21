import Link from "next/link";

const features = [
  {
    title: "원샷 계산기",
    description: "몬스터를 몇 타에 잡는지 계산합니다",
    href: "/calculator/oneshot",
    button: "계산기 열기",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-sky-300">
        <path
          fill="currentColor"
          d="M4 5h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7l-3 3V6a1 1 0 0 1 1-1Zm3 4h10v2H7V9Zm0 4h6v2H7v-2Z"
        />
      </svg>
    ),
  },
  {
    title: "피격 데미지 계산기",
    description: "몬스터 피격 데미지를 추정합니다",
    href: "/calculator/damage",
    button: "계산기 열기",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-emerald-300">
        <path
          fill="currentColor"
          d="M12 2 4.5 5v6c0 5.25 3.75 9.75 7.5 11 3.75-1.25 7.5-5.75 7.5-11V5L12 2Zm0 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
        />
      </svg>
    ),
  },
  {
    title: "파티 매칭",
    description: "파티원을 쉽게 모집/탐색하세요",
    href: "/party",
    button: "매칭 보기",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-amber-300">
        <path
          fill="currentColor"
          d="M7 11a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm10 0a3 3 0 1 1 3-3 3 3 0 0 1-3 3ZM4 20v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1H4Zm10 0v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1h-10Z"
        />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-10 text-center">
      <div className="glass-panel w-full max-w-3xl rounded-3xl px-6 py-10 md:px-12">
        <h1 className="display text-4xl font-semibold md:text-5xl">메이플랜드허브</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">메이플랜드 유틸리티 & 파티 매칭 플랫폼</p>
      </div>

      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="glass-panel flex h-full flex-col gap-4 rounded-2xl p-6 text-left transition duration-300 hover:scale-[1.02]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">{feature.icon}</div>
            <div>
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-200/90">{feature.description}</p>
            </div>
            <Link href={feature.href} className="btn-ghost mt-auto inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold">
              {feature.button}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
