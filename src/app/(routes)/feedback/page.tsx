"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RequestType = "bug" | "feature" | "other";

export default function FeedbackPage() {
  const [type, setType] = useState<RequestType>("feature");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const canSubmit = title.trim().length > 1 && message.trim().length > 4;

  async function submitFeedback() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setStatus("");

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        type,
        title: title.trim(),
        message: message.trim(),
        contact: contact.trim() || null,
        is_public: false,
        user_id: user?.id ?? null,
      };

      const { error } = await supabase.from("feedback_requests").insert(payload);
      if (error) throw error;

      // Discord 알림은 부가 기능이므로 실패해도 접수 자체는 성공 처리
      try {
        await fetch("/api/feedback/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: payload.type,
            title: payload.title,
            message: payload.message,
            contact: payload.contact,
            userId: payload.user_id,
          }),
        });
      } catch {
        // no-op
      }

      setStatus("문의가 접수되었습니다. 운영자만 확인 가능합니다.");
      setTitle("");
      setMessage("");
      setContact("");
    } catch {
      setStatus("접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">문의/요청</h1>
          <p className="text-sm text-slate-300">버그, 개선 요청, 기능 제안을 남겨주세요. 작성 내용은 운영자만 확인합니다.</p>
        </header>

        <div className="mt-6 grid gap-4">
          <label className="space-y-1 text-xs">
            <span className="retro-chip">유형</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as RequestType)}
              className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-2 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
            >
              <option value="feature">추가 요청</option>
              <option value="bug">버그 제보</option>
              <option value="other">기타 문의</option>
            </select>
          </label>

          <label className="space-y-1 text-xs">
            <span className="retro-chip">제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-2 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
              placeholder="예: 비숍 힐 계산식 개선 요청"
            />
          </label>

          <label className="space-y-1 text-xs">
            <span className="retro-chip">내용</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-2 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
              placeholder="원하는 동작/문제 재현 방법/기대 결과를 적어주세요."
            />
          </label>

          <label className="space-y-1 text-xs">
            <span className="retro-chip">연락처 (선택)</span>
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-2 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
              placeholder="디스코드/이메일 등"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canSubmit || saving}
              onClick={submitFeedback}
              className="rounded border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-3 py-2 text-xs font-semibold text-[color:var(--retro-text)] hover:border-[var(--retro-border-strong)] disabled:opacity-50"
            >
              {saving ? "접수 중..." : "문의 접수"}
            </button>
            {status ? <span className="text-xs text-[color:var(--retro-text-muted)]">{status}</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
