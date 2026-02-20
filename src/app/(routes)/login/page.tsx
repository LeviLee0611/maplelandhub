"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function signIn(provider: "discord" | "google") {
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback`;
  await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
}

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold">로그인</h1>
      <p className="text-sm text-slate-700">파티 글 작성/신청/수락/거절은 로그인 후 가능합니다.</p>
      <button
        type="button"
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        onClick={() => signIn("discord")}
      >
        Discord로 로그인
      </button>
      <button
        type="button"
        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 hover:bg-slate-100"
        onClick={() => signIn("google")}
      >
        Google로 로그인(선택)
      </button>
    </section>
  );
}
