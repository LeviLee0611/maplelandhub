"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Application, Post } from "@/types/party";

export default function PartyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isAuthor, setIsAuthor] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const load = async () => {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: postData, error: postError } = await supabase.from("posts").select("*").eq("id", postId).single();

    if (postError) {
      setErrorText(postError.message);
      return;
    }

    const typedPost = postData as Post;
    setPost(typedPost);

    const author = Boolean(user?.id && typedPost.author_id === user.id);
    setIsAuthor(author);

    if (author || user) {
      const { data: appsData } = await supabase.from("applications").select("*").eq("post_id", postId).order("created_at", { ascending: false });
      setApplications((appsData ?? []) as Application[]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const apply = async () => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      post_id: postId,
      applicant_id: user.id,
      message: applyMessage,
      status: "pending",
    });

    if (error) {
      setErrorText(error.message);
      return;
    }

    setApplyMessage("");
    await load();
  };

  const updateApplication = async (applicationId: string, status: "accepted" | "rejected") => {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.from("applications").update({ status }).eq("id", applicationId);
    if (error) {
      setErrorText(error.message);
      return;
    }

    const { count } = await supabase.from("applications").select("id", { count: "exact", head: true }).eq("post_id", postId).eq("status", "accepted");

    if (post) {
      const acceptedCount = Math.max(0, count ?? 0);
      const slotsFilled = Math.min(post.slots_total, 1 + acceptedCount);
      const postStatus = slotsFilled >= post.slots_total ? "closed" : "open";

      await supabase.from("posts").update({ slots_filled: slotsFilled, status: postStatus }).eq("id", postId);
    }

    await load();
  };

  if (!post) {
    return <p className="text-sm text-slate-200/90">로딩 중...</p>;
  }

  return (
    <section className="space-y-4">
      <div className="glass-panel rounded-2xl p-5">
        <h1 className="text-2xl font-bold">{post.purpose}</h1>
        <p className="mt-2 text-slate-200/90">서버: {post.server}</p>
        <p className="text-slate-200/90">사냥터: {post.hunt_area}</p>
        <p className="text-slate-200/90">레벨: {post.level_min} - {post.level_max}</p>
        <p className="text-slate-200/90">인원: {post.slots_filled}/{post.slots_total}</p>
        <p className="text-slate-200/90">상태: {post.status}</p>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <h2 className="text-lg font-semibold">신청하기</h2>
        <textarea
          className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-slate-100 focus:border-sky-300 focus:outline-none"
          rows={3}
          placeholder="간단한 자기소개/직업/레벨"
          value={applyMessage}
          onChange={(e) => setApplyMessage(e.target.value)}
        />
        <button type="button" className="btn-primary mt-3 rounded-md px-4 py-2 text-sm font-semibold" onClick={apply}>
          신청
        </button>
      </div>

      {isAuthor && (
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg font-semibold">신청 관리</h2>
          <div className="mt-3 space-y-3">
            {applications.length === 0 ? (
              <p className="text-sm text-slate-200/90">신청이 없습니다.</p>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="rounded-md border border-white/15 bg-white/5 p-3">
                  <p className="text-sm text-slate-100">{application.message || "(메시지 없음)"}</p>
                  <p className="mt-1 text-xs text-slate-300">상태: {application.status}</p>
                  {application.status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-emerald-500/80 px-3 py-1 text-sm text-white hover:bg-emerald-500"
                        onClick={() => updateApplication(application.id, "accepted")}
                      >
                        수락
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-rose-500/80 px-3 py-1 text-sm text-white hover:bg-rose-500"
                        onClick={() => updateApplication(application.id, "rejected")}
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {errorText && <p className="text-sm text-rose-300">오류: {errorText}</p>}
    </section>
  );
}
