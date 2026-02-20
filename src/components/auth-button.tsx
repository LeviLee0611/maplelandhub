"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type UserState = { id: string; email?: string } | null;

export function AuthButton() {
  const [user, setUser] = useState<UserState>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser ? { id: currentUser.id, email: currentUser.email } : null);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <Link href="/login" className="rounded-md border border-slate-400 px-3 py-1 text-sm hover:bg-slate-100">
        로그인
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="rounded-md border border-slate-400 px-3 py-1 text-sm hover:bg-slate-100"
      onClick={async () => {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
    >
      로그아웃
    </button>
  );
}
