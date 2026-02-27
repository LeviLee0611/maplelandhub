import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 문의하기 | 메이플랜드 계산기";
const description = "문의 및 제안을 남길 수 있는 채널을 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/contact",
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

export default function ContactPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">문의하기</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">문의하기</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          버그 제보, 기능 요청, 협업 문의는 아래 채널을 이용해주세요. 운영진이 확인 후 순차적으로 답변합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">문의/요청 폼</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            간단한 제안이나 버그 제보는 문의 폼을 통해 남겨주세요.
          </p>
          <Link href="/feedback" className="btn-ghost mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold">
            문의 폼 열기
          </Link>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">운영진 이메일</h2>
          <p className="mt-2 text-sm text-slate-200/90">민감한 문의나 긴 설명이 필요할 때 이메일로 연락 주세요.</p>
          <p className="mt-3 text-sm font-semibold text-slate-100">support@maplelandhub.com</p>
        </div>
      </div>
    </section>
  );
}
