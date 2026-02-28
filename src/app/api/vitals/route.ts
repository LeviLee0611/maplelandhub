import { NextResponse } from "next/server";
import { addPerfReport, getRecentPerfReports, type PerfMetricReport } from "@/lib/perf/debug-store";

export const runtime = "edge";

function isPerfDebugEnabled() {
  return process.env.PERF_DEBUG === "1";
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") ?? undefined;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeReport(input: unknown): PerfMetricReport | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const source = raw.source;
  const metric = raw.metric;
  const value = toNumber(raw.value);

  if ((source !== "next-web-vitals" && source !== "performance-observer") || typeof metric !== "string" || value === undefined) {
    return null;
  }

  const normalized: PerfMetricReport = {
    source,
    metric,
    value,
    rating:
      raw.rating === "good" || raw.rating === "needs-improvement" || raw.rating === "poor"
        ? raw.rating
        : undefined,
    delta: toNumber(raw.delta),
    id: typeof raw.id === "string" ? raw.id : undefined,
    navigationType: typeof raw.navigationType === "string" ? raw.navigationType : undefined,
    url: typeof raw.url === "string" ? raw.url : undefined,
    path: typeof raw.path === "string" ? raw.path : undefined,
    timestamp: toNumber(raw.timestamp),
    attribution: raw.attribution,
    details: raw.details && typeof raw.details === "object" ? (raw.details as Record<string, unknown>) : undefined,
  };

  return normalized;
}

export async function POST(request: Request) {
  try {
    const report = normalizeReport(await request.json());
    if (!report) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const stored = {
      ...report,
      receivedAt: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") ?? undefined,
      ip: getClientIp(request),
    };

    addPerfReport(stored);
    console.log(
      JSON.stringify({
        type: "web_vitals",
        report: stored,
      }),
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "unexpected_error" }, { status: 500 });
  }
}

export async function GET() {
  if (!isPerfDebugEnabled()) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    reports: getRecentPerfReports(),
  });
}
