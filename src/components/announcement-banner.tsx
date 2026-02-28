import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AnnouncementRow = {
  id: string;
  title: string;
  category: "notice" | "update";
  published_at: string;
  is_pinned: boolean | null;
};

const CATEGORY_LABEL: Record<AnnouncementRow["category"], string> = {
  notice: "공지",
  update: "업데이트",
};

const getLatestAnnouncement = unstable_cache(
  async () => {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("announcements")
      .select("id,title,category,published_at,is_pinned")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(1);

    return (data?.[0] as AnnouncementRow | undefined) ?? null;
  },
  ["latest-announcement-banner"],
  { revalidate: 60 },
);

export async function AnnouncementBanner() {
  const item = await getLatestAnnouncement();
  if (!item) return null;

  return (
    <div className="banner-soft border-b border-[var(--nav-border)] bg-[linear-gradient(90deg,rgba(12,20,38,0.9),rgba(8,16,32,0.95))]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-xs text-[color:var(--retro-text)]">
        <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
          {CATEGORY_LABEL[item.category]}
        </span>
        <Link
          href="/announcements"
          className="inline-flex max-w-[70%] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[11px] text-slate-200 hover:border-white/20 hover:bg-white/10"
        >
          <span className="truncate">{item.title}</span>
          <span className="text-[10px] text-cyan-100/70">열기</span>
        </Link>
        <Link
          href="/announcements"
          className="ml-auto inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-0.5 text-[11px] text-cyan-100/80 hover:border-cyan-200/60 hover:text-cyan-100"
        >
          전체 보기 →
        </Link>
      </div>
    </div>
  );
}
