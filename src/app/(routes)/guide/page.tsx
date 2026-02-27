import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 사용방법 (필독) | 메이플랜드 계산기";
const description = "메랜Hub를 효율적으로 사용하는 방법과 필수 확인 사항을 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/guide",
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

const steps = [
  {
    title: "1. 계산기 선택",
    body: "N방컷, 피격 데미지, 드랍 테이블 중 필요한 도구를 선택합니다.",
  },
  {
    title: "2. 몬스터/아이템 검색",
    body: "검색창에서 원하는 몬스터 혹은 아이템을 검색하고, 결과를 클릭합니다.",
  },
  {
    title: "3. 값 입력",
    body: "캐릭터 스펙/버프/장비 정보를 입력해 계산 정확도를 높입니다.",
  },
  {
    title: "4. 결과 확인",
    body: "확률과 계산 결과를 확인하고 사냥 루트를 최적화합니다.",
  },
];

export default function GuidePage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">사용방법</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">사용방법 (필독)</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          메랜Hub의 계산 결과는 입력값에 따라 달라집니다. 아래 순서대로 사용하면 더 정확한 결과를 얻을 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <div key={step.title} className="glass-panel rounded-2xl px-5 py-5">
            <h2 className="text-base font-semibold text-slate-100">{step.title}</h2>
            <p className="mt-2 text-sm text-slate-200/90">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">도움이 필요하신가요?</h2>
        <p className="mt-2 text-sm text-slate-200/90">
          오류 제보나 기능 제안은 <Link href="/contact" className="font-semibold text-sky-200 hover:text-white">문의하기</Link>에서 남겨주세요.
        </p>
      </div>
    </section>
  );
}
