"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FormState = {
  server: string;
  purpose: string;
  hunt_area: string;
  level_min: number;
  level_max: number;
  slots_total: number;
};

const initialForm: FormState = {
  server: "",
  purpose: "사냥",
  hunt_area: "",
  level_min: 1,
  level_max: 300,
  slots_total: 6,
};

export default function NewPartyPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const requireLogin = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    };

    requireLogin();
  }, [router]);

  const submit = async () => {
    setErrorText("");

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        ...form,
        slots_filled: 1,
        status: "open",
        bump_at: nowIso,
      })
      .select("id")
      .single();

    if (error) {
      setErrorText(error.message);
      return;
    }

    router.push(`/parties/${data.id}`);
  };

  if (loading) {
    return <p className="text-sm text-slate-700">로그인 확인 중...</p>;
  }

  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h1 className="text-2xl font-bold">파티 글 작성</h1>

      <div className="grid gap-3">
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="서버"
          value={form.server}
          onChange={(e) => setForm((prev) => ({ ...prev, server: e.target.value }))}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="목적 (예: 사냥/보스/퀘스트)"
          value={form.purpose}
          onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="사냥터"
          value={form.hunt_area}
          onChange={(e) => setForm((prev) => ({ ...prev, hunt_area: e.target.value }))}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          type="number"
          min={1}
          placeholder="최소 레벨"
          value={form.level_min}
          onChange={(e) => setForm((prev) => ({ ...prev, level_min: Number(e.target.value) }))}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          type="number"
          min={1}
          placeholder="최대 레벨"
          value={form.level_max}
          onChange={(e) => setForm((prev) => ({ ...prev, level_max: Number(e.target.value) }))}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          type="number"
          min={2}
          max={6}
          placeholder="최대 인원"
          value={form.slots_total}
          onChange={(e) => setForm((prev) => ({ ...prev, slots_total: Number(e.target.value) }))}
        />
      </div>

      {errorText && <p className="text-sm text-red-600">작성 실패: {errorText}</p>}

      <button type="button" className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700" onClick={submit}>
        등록
      </button>
    </section>
  );
}
