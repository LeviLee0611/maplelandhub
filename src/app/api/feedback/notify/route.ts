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
    const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ ok: true, skipped: "missing_webhook_url" });
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

    const contentLines = [
      "새 문의가 접수되었습니다.",
      `유형: ${TYPE_LABEL[type]}`,
      `제목: ${truncate(title, 200)}`,
      `내용: ${truncate(message.replace(/\s+/g, " "), 800)}`,
      `연락처: ${contact || "-"}`,
      `유저ID: ${userId || "-"}`,
    ];

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: contentLines.join("\n"),
      }),
    });

    if (!discordRes.ok) {
      return NextResponse.json({ ok: false, error: "discord_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "unexpected_error" }, { status: 500 });
  }
}
