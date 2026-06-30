import { NextResponse } from "next/server";

export const runtime = "edge";

type NotifyPayload = {
  type: "bug" | "feature" | "other";
  title: string;
  message: string;
  contact?: string | null;
  userId?: string | null;
};

const TYPE_LABEL: Record<NotifyPayload["type"], string> = {
  bug: "버그 제보",
  feature: "추가 요청",
  other: "기타 문의",
};

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!apiKey || !adminEmail) {
      console.error("[feedback/notify] 환경변수 누락: RESEND_API_KEY 또는 ADMIN_EMAIL 미설정으로 알림 전송 생략");
      return NextResponse.json({ ok: true, skipped: "missing_config" });
    }

    const raw = (await req.json()) as NotifyPayload;
    const type = raw?.type;
    const title = String(raw?.title ?? "").trim();
    const message = String(raw?.message ?? "").trim();
    const contact = raw?.contact ? String(raw.contact).trim() : "";
    const userId = raw?.userId ? String(raw.userId).trim() : "";

    if (!type || !(type in TYPE_LABEL) || title.length < 2 || message.length < 5) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const bodyLines = [
      `유형: ${TYPE_LABEL[type]}`,
      `제목: ${truncate(title, 200)}`,
      "",
      `내용:`,
      truncate(message, 2000),
      "",
      `연락처: ${contact || "-"}`,
      `유저ID: ${userId || "-"}`,
    ];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "메랜Hub <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `[메랜Hub] 새 문의: ${truncate(title, 60)} (${TYPE_LABEL[type]})`,
        text: bodyLines.join("\n"),
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "unexpected_error" }, { status: 500 });
  }
}
