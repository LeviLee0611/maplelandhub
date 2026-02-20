import Link from "next/link";
import type { Post } from "@/types/party";

export function PartyCard({ post }: { post: Post }) {
  return (
    <Link href={`/parties/${post.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{post.purpose}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{post.status}</span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{post.server} · {post.hunt_area}</p>
      <p className="mt-1 text-sm text-slate-700">레벨 {post.level_min} - {post.level_max}</p>
      <p className="mt-1 text-sm text-slate-700">{post.slots_filled} / {post.slots_total} 명</p>
    </Link>
  );
}
