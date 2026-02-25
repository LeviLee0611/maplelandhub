"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PartyCard } from "@/components/party-card";
import type { Post } from "@/types/party";

export default function PartiesPage() {
  const isComingSoon = true;
  const [posts, setPosts] = useState<Post[]>([]);
  const [server, setServer] = useState("");
  const [purpose, setPurpose] = useState("");
  const [minLevel, setMinLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(300);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (isComingSoon) return;
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

  if (isComingSoon) {
    return (
      <section className="min-h-[calc(100vh-6rem)] space-y-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">파티 매칭</h1>
            <p className="mt-1 text-sm text-slate-200/90">메이플랜드 파티 모집 글을 한 곳에서 빠르게 찾아보세요.</p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-400">
            개발 중
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="text-sm font-semibold text-amber-200">COMING SOON</div>
          <p className="mt-2 text-sm text-slate-200/90">파티 매칭 기능은 현재 개발 중입니다. 조금만 기다려주세요.</p>
          <p className="mt-2 text-xs text-slate-400">요청사항은 문의/요청에 남겨주시면 빠르게 반영하겠습니다.</p>
          <Link href="/feedback" className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs text-slate-100 hover:border-white/40">
            문의/요청 남기기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-6rem)] space-y-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">파티 매칭</h1>
          <p className="mt-1 text-sm text-slate-200/90">메이플랜드 파티 모집 글을 한 곳에서 빠르게 찾아보세요.</p>
        </div>
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
