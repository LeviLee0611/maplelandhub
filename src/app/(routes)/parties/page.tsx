"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PartyCard } from "@/components/party-card";
import type { Post } from "@/types/party";

export default function PartiesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [server, setServer] = useState("");
  const [purpose, setPurpose] = useState("");
  const [minLevel, setMinLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(300);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("bump_at", { ascending: false })
        .limit(100);

      if (error) {
        setErrorText(error.message);
        return;
      }

      setPosts((data ?? []) as Post[]);
    };

    loadPosts();
  }, []);

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const serverMatch = !server || post.server.toLowerCase().includes(server.toLowerCase());
        const purposeMatch = !purpose || post.purpose.toLowerCase().includes(purpose.toLowerCase());
        const levelMatch = post.level_min <= maxLevel && post.level_max >= minLevel;
        return serverMatch && purposeMatch && levelMatch;
      }),
    [posts, server, purpose, minLevel, maxLevel],
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">파티 매칭</h1>
        <Link href="/parties/new" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          파티 글 작성
        </Link>
      </div>

      <div className="glass-panel grid gap-3 rounded-2xl p-4 md:grid-cols-4">
        <input
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-sky-300 focus:outline-none"
          placeholder="서버"
          value={server}
          onChange={(e) => setServer(e.target.value)}
        />
        <input
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-sky-300 focus:outline-none"
          placeholder="목적"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
        <input
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-sky-300 focus:outline-none"
          type="number"
          placeholder="최소 레벨"
          value={minLevel}
          onChange={(e) => setMinLevel(Number(e.target.value))}
        />
        <input
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-sky-300 focus:outline-none"
          type="number"
          placeholder="최대 레벨"
          value={maxLevel}
          onChange={(e) => setMaxLevel(Number(e.target.value))}
        />
      </div>

      {errorText && <p className="text-sm text-rose-300">목록 로딩 실패: {errorText}</p>}

      <div className="grid gap-3">
        {filteredPosts.length === 0 ? (
          <p className="glass-panel rounded-2xl p-4 text-sm text-slate-200/90">조건에 맞는 모집글이 없습니다.</p>
        ) : (
          filteredPosts.map((post) => <PartyCard key={post.id} post={post} />)
        )}
      </div>
    </section>
  );
}
