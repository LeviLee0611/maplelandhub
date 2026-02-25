import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AnnouncementWriteButton } from "@/components/announcement-write-button";

export const runtime = "edge";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  category: "notice" | "update";
  published_at: string;
  is_pinned: boolean | null;
};

const CATEGORY_LABEL: Record<AnnouncementRow["category"], string> = {
  notice: "공지",
  update: "업데이트",
};

export default async function AnnouncementsPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("announcements")
    .select("id,title,body,category,published_at,is_pinned")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as AnnouncementRow[];

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">공지/업데이트</h1>
            <p className="text-sm text-slate-300">
              서비스 운영 및 업데이트 내역을 공유합니다.
            </p>
          </div>
          <AnnouncementWriteButton />
        </header>

        {rows.length === 0 ? (
          <p className="mt-6 text-sm text-slate-300">아직 등록된 공지가 없습니다.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {rows.map((row) => (
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
                    {new Date(row.published_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-100">{row.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200/90">{row.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
