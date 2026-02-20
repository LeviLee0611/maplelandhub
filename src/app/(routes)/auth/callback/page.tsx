"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertProfileFromUser } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("로그인 처리 중...");

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(`세션 생성 실패: ${error.message}`);
          return;
        }
      }

      await upsertProfileFromUser();
      setMessage("로그인 완료. 이동합니다...");
      router.replace("/parties");
    };

    run();
  }, [router]);

  return <p className="text-sm text-slate-700">{message}</p>;
}
