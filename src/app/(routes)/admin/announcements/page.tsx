"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
type AnnouncementInsert = Database["public"]["Tables"]["announcements"]["Insert"];

const CATEGORY_LABEL: Record<AnnouncementRow["category"], string> = {
  notice: "공지",
  update: "업데이트",
};

export default function AdminAnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementRow["category"]>("notice");
  const [isPinned, setIsPinned] = useState(false);

  const canSubmit = useMemo(() => title.trim().length > 0 && body.trim().length > 0, [title, body]);

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

        const { data, error: loadError } = await supabase
          .from("announcements")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("published_at", { ascending: false });

        if (loadError) throw loadError;
        if (!active) return;
        setAuthorized(true);
        setRows((data ?? []) as AnnouncementRow[]);
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

  async function createAnnouncement() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const payload: AnnouncementInsert = {
        title: title.trim(),
        body: body.trim(),
        category,
        is_pinned: isPinned,
        published_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from("announcements")
        .insert(payload)
        .select("*")
        .single();

      if (insertError) throw insertError;
      setRows((prev) => [data as AnnouncementRow, ...prev]);
      setTitle("");
      setBody("");
      setIsPinned(false);
      setCategory("notice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAnnouncement(id: string) {
    if (deletingId) return;
    const confirmed = window.confirm("정말 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.");
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase.from("announcements").delete().eq("id", id);
      if (deleteError) throw deleteError;
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">공지/업데이트 관리</h1>
          <p className="text-sm text-slate-300">관리자만 작성할 수 있습니다.</p>
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
            <div className="mt-6 space-y-3 rounded-xl border border-[var(--retro-border)] bg-[var(--retro-cell)] p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs text-slate-300">제목</span>
                  <input
                    className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-sm text-slate-100 focus:border-[var(--retro-border-strong)] focus:outline-none"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="공지 제목"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-slate-300">종류</span>
                  <select
                    className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-sm text-slate-100 focus:border-[var(--retro-border-strong)] focus:outline-none"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as AnnouncementRow["category"])}
                  >
                    <option value="notice">공지</option>
                    <option value="update">업데이트</option>
                  </select>
                </label>
              </div>
              <label className="space-y-1">
                <span className="text-xs text-slate-300">내용</span>
                <textarea
                  className="min-h-[120px] w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-bg)] px-3 py-2 text-sm text-slate-100 focus:border-[var(--retro-border-strong)] focus:outline-none"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="업데이트 내용 또는 공지 사항"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(event) => setIsPinned(event.target.checked)}
                />
                상단 고정
              </label>
              <div>
                <button
                  type="button"
                  onClick={createAnnouncement}
                  disabled={!canSubmit || saving}
                  className="rounded-md border border-cyan-300/50 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-200/70 disabled:opacity-40"
                >
                  {saving ? "등록 중..." : "공지 등록"}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {rows.length === 0 ? (
                <p className="text-sm text-slate-300">등록된 공지가 없습니다.</p>
              ) : (
                rows.map((row) => (
                  <article key={row.id} className="rounded-xl border border-[var(--retro-border)] bg-[var(--retro-cell)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                        {CATEGORY_LABEL[row.category]}
                      </span>
                      {row.is_pinned ? (
                        <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                          상단 고정
                        </span>
                      ) : null}
                      <span className="text-[11px] text-slate-400">
                        {row.published_at ? new Date(row.published_at).toLocaleDateString("ko-KR") : "-"}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(row.id)}
                        disabled={deletingId === row.id}
                        className="ml-auto rounded border border-rose-300/50 bg-rose-300/10 px-2 py-0.5 text-[11px] text-rose-100 hover:border-rose-200/70 disabled:opacity-40"
                      >
                        {deletingId === row.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-100">{row.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200/90">{row.body}</p>
                  </article>
                ))
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
