"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function DiscordIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 256 199" className="h-5 w-5 fill-current">
      <path d="M216.856 16.596c-16.92-7.987-35.06-13.77-53.91-16.596-2.32 4.113-4.94 9.579-6.77 13.93-20.23-3.054-40.27-3.054-60.1 0-1.83-4.35-4.5-9.817-6.85-13.93-18.85 2.826-37.01 8.61-53.95 16.596C7.77 57.917-1.88 98.5.07 138.52c18.18 13.35 35.79 21.45 53.11 26.74 4.27-5.79 8.08-11.95 11.39-18.4-6.2-2.35-12.12-5.24-17.75-8.6 1.49-1.09 2.94-2.2 4.34-3.32 34.17 15.89 71.24 15.89 105.03 0 1.41 1.12 2.85 2.23 4.35 3.32-5.64 3.37-11.56 6.26-17.77 8.62 3.31 6.45 7.12 12.6 11.41 18.39 17.32-5.29 34.94-13.39 53.12-26.74 2.29-46.36-3.9-86.7-35.9-121.924ZM85.47 135.38c-10.16 0-18.53-9.29-18.53-20.7 0-11.41 8.2-20.7 18.53-20.7 10.32 0 18.7 9.29 18.53 20.7 0 11.41-8.2 20.7-18.53 20.7Zm85.06 0c-10.16 0-18.53-9.29-18.53-20.7 0-11.41 8.2-20.7 18.53-20.7 10.32 0 18.7 9.29 18.53 20.7 0 11.41-8.2 20.7-18.53 20.7Z" />
    </svg>
  );
}

async function signIn(provider: "discord" | "google") {
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback`;
  await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
}

export default function LoginPage() {
  return (
    <section className="glass-panel mx-auto max-w-md space-y-4 rounded-2xl p-6">
      <h1 className="text-2xl font-bold">로그인</h1>
      <p className="text-sm text-slate-200/90">파티 글 작성/신청/수락/거절은 로그인 후 가능합니다.</p>
      <button
        type="button"
        className="btn-primary flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
        onClick={() => signIn("discord")}
      >
        <DiscordIcon />
        Discord로 로그인
      </button>
      <button
        type="button"
        className="btn-ghost w-full rounded-md px-4 py-2 text-sm font-semibold"
        onClick={() => signIn("google")}
      >
        Google로 로그인(선택)
      </button>
    </section>
  );
}
