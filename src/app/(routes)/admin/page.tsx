"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!active) return;
          setAuthorized(false);
          return;
        }

        const { data: adminRow, error: adminError } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminError) throw adminError;
        if (!adminRow) {
          if (!active) return;
          setAuthorized(false);
          return;
        }

        if (!active) return;
        setAuthorized(true);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">관리자 대시보드</h1>
          <p className="text-sm text-slate-300">운영자 전용 기능입니다.</p>
        </header>

        {loading ? (
          <p className="mt-6 text-sm text-slate-300">불러오는 중...</p>
        ) : null}

        {!loading && error ? (
          <p className="mt-6 text-sm text-rose-300">{error}</p>
        ) : null}

        {!loading && authorized === false && !error ? (
          <p className="mt-6 text-sm text-amber-200">관리자 계정이 아닙니다.</p>
        ) : null}

        {!loading && authorized && !error ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Link
              href="/admin/feedback"
              className="glass-panel flex h-full flex-col gap-2 rounded-xl p-4 text-left transition duration-300 hover:scale-[1.01]"
            >
              <div className="text-sm font-semibold text-slate-100">문의/요청 관리</div>
              <p className="text-xs text-slate-300">유저 문의/요청을 확인하고 상태를 변경합니다.</p>
            </Link>
            <Link
              href="/admin/users"
              className="glass-panel flex h-full flex-col gap-2 rounded-xl p-4 text-left transition duration-300 hover:scale-[1.01]"
            >
              <div className="text-sm font-semibold text-slate-100">로그인 유저 데이터</div>
              <p className="text-xs text-slate-300">프로필에 저장된 유저 데이터를 확인합니다.</p>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
