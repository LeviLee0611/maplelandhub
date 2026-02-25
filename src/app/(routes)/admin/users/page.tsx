"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  profile: ProfileRow | null;
};

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const id = row.id?.toLowerCase() ?? "";
      const email = row.email?.toLowerCase() ?? "";
      const nickname = row.profile?.nickname?.toLowerCase() ?? "";
      const job = row.profile?.job?.toLowerCase() ?? "";
      const server = row.profile?.server?.toLowerCase() ?? "";
      return id.includes(q) || email.includes(q) || nickname.includes(q) || job.includes(q) || server.includes(q);
    });
  }, [rows, query]);

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
          setRows([]);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          if (!active) return;
          setAuthorized(false);
          setRows([]);
          return;
        }

        const response = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          if (!active) return;
          setAuthorized(false);
          setRows([]);
          return;
        }

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "데이터를 불러오지 못했습니다.");
        }

        if (!active) return;
        setAuthorized(true);
        setRows((payload.data ?? []) as AdminUserRow[]);
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
          <h1 className="text-2xl font-bold text-slate-100">로그인 유저 데이터</h1>
          <p className="text-sm text-slate-300">프로필에 저장된 유저 데이터입니다.</p>
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
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-300">총 {rows.length}명</div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="닉네임/직업/서버/ID/이메일 검색"
                className="h-[32px] w-full max-w-sm rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
              />
            </div>

            <div className="mt-4 grid gap-3">
              {filteredRows.length === 0 ? (
                <p className="text-sm text-slate-300">조건에 맞는 유저가 없습니다.</p>
              ) : null}

              {filteredRows.map((row) => (
                <article key={row.id} className="rounded-xl border border-[var(--retro-border)] bg-[var(--retro-cell)] p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="retro-chip">{row.profile?.server || "서버 미입력"}</span>
                    <span>레벨: {row.profile?.level ?? "-"}</span>
                    <span>직업: {row.profile?.job || "-"}</span>
                    <span>이메일: {row.email || "-"}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-100">
                    {row.profile?.nickname || "닉네임 미입력"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">ID: {row.id}</div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    가입: {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    최근 로그인: {row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleString() : "-"}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
