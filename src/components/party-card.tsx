import Link from "next/link";
import type { Post } from "@/types/party";

export function PartyCard({ post }: { post: Post }) {
  return (
    <Link href={`/parties/${post.id}`} className="glass-panel block rounded-2xl p-4 hover:border-white/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{post.purpose}</h3>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">{post.status}</span>
      </div>
      <p className="mt-2 text-sm text-slate-200/90">{post.server} · {post.hunt_area}</p>
      <p className="mt-1 text-sm text-slate-200/90">레벨 {post.level_min} - {post.level_max}</p>
      <p className="mt-1 text-sm text-slate-200/90">{post.slots_filled} / {post.slots_total} 명</p>
    </Link>
  );
}
