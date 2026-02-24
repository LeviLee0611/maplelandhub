"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type FeedbackRow = Database["public"]["Tables"]["feedback_requests"]["Row"];

const STATUS_LABEL: Record<FeedbackRow["status"], string> = {
  new: "새 문의",
  in_progress: "처리 중",
  done: "완료",
};

const TYPE_LABEL: Record<FeedbackRow["type"], string> = {
  bug: "버그 제보",
  feature: "추가 요청",
  other: "기타 문의",
};

export default function AdminFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FeedbackRow["status"] | "all">("new");

  const statusSummary = useMemo(() => {
    const counts: Record<FeedbackRow["status"], number> = {
      new: 0,
      in_progress: 0,
      done: 0,
    };
    for (const row of rows) counts[row.status] += 1;
    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

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

        const { data: adminRow, error: adminError } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminError) throw adminError;
        if (!adminRow) {
          if (!active) return;
          setAuthorized(false);
          setRows([]);
          return;
        }

        const { data, error: loadError } = await supabase
          .from("feedback_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (loadError) throw loadError;

        if (!active) return;
        setAuthorized(true);
        setRows((data ?? []) as FeedbackRow[]);
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

  async function deleteRow(rowId: string) {
    if (deletingId) return;
    const confirmed = window.confirm("정말 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.");
    if (!confirmed) return;

    setDeletingId(rowId);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase.from("feedback_requests").delete().eq("id", rowId);
      if (deleteError) throw deleteError;
      setRows((prev) => prev.filter((row) => row.id !== rowId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  async function updateStatus(rowId: string, nextStatus: FeedbackRow["status"]) {
    if (savingId || deletingId) return;
    const prevStatus = rows.find((row) => row.id === rowId)?.status;
    if (!prevStatus || prevStatus === nextStatus) return;

    setSavingId(rowId);
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, status: nextStatus } : row)));

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.from("feedback_requests").update({ status: nextStatus }).eq("id", rowId);
      if (updateError) throw updateError;
    } catch (err) {
      setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, status: prevStatus } : row)));
      setError(err instanceof Error ? err.message : "상태 변경에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">문의/요청 관리자</h1>
          <p className="text-sm text-slate-300">운영자 전용 목록입니다. 계정 권한이 없으면 조회할 수 없습니다.</p>
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
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
              {(["new", "in_progress", "done"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                    statusFilter === key
                      ? "border-amber-300/80 bg-amber-400/10 text-amber-100"
                      : "border-[var(--retro-border)] text-slate-200 hover:border-[var(--retro-border-strong)]"
                  }`}
                >
                  {STATUS_LABEL[key]} {statusSummary[key]}건
                </button>
              ))}
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  statusFilter === "all"
                    ? "border-amber-300/80 bg-amber-400/10 text-amber-100"
                    : "border-[var(--retro-border)] text-slate-200 hover:border-[var(--retro-border-strong)]"
                }`}
              >
                전체 {rows.length}건
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {filteredRows.length === 0 ? (
                <p className="text-sm text-slate-300">해당 상태의 문의가 없습니다.</p>
              ) : null}

              {filteredRows.map((row) => (
                <article key={row.id} className="rounded-xl border border-[var(--retro-border)] bg-[var(--retro-cell)] p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="retro-chip">{TYPE_LABEL[row.type]}</span>
                    <span className="retro-chip">{STATUS_LABEL[row.status]}</span>
                    <span>작성일 {new Date(row.created_at).toLocaleString("ko-KR")}</span>
                    <div className="ml-auto flex items-center gap-2">
                      {row.status !== "done" ? (
                        <>
                          {row.status !== "in_progress" ? (
                            <button
                              type="button"
                              onClick={() => updateStatus(row.id, "in_progress")}
                              disabled={savingId === row.id}
                              className="rounded border border-sky-400/70 px-2 py-1 text-[11px] font-semibold text-sky-200 hover:border-sky-300 disabled:opacity-50"
                            >
                              {savingId === row.id ? "처리 중..." : "처리중"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => updateStatus(row.id, "done")}
                            disabled={savingId === row.id}
                            className="rounded border border-emerald-400/70 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:border-emerald-300 disabled:opacity-50"
                          >
                            {savingId === row.id ? "완료 중..." : "완료"}
                          </button>
                        </>
                      ) : null}
                      {row.status === "done" ? (
                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          disabled={deletingId === row.id}
                          className="rounded border border-rose-400/70 px-2 py-1 text-[11px] font-semibold text-rose-200 hover:border-rose-300 disabled:opacity-50"
                        >
                          {deletingId === row.id ? "삭제 중..." : "삭제"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-slate-100">{row.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{row.message}</p>
                  <div className="mt-3 text-xs text-slate-400">
                    <span>연락처: {row.contact || "-"}</span>
                    <span className="ml-3">유저ID: {row.user_id || "-"}</span>
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
