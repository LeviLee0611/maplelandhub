export type PerfMetricReport = {
  source: "next-web-vitals" | "performance-observer";
  metric: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
  navigationType?: string;
  url?: string;
  path?: string;
  /** 최초 페이지 진입 지표인지, 이후 화면 이동 지표인지 — 둘을 섞어 보면 판단이 흐려진다. */
  phase?: "initial" | "soft-navigation";
  timestamp?: number;
  attribution?: unknown;
  details?: Record<string, unknown>;
};

export type StoredPerfReport = PerfMetricReport & {
  receivedAt: string;
  userAgent?: string;
  ip?: string;
};

const MAX_REPORTS = 20;
const reports: StoredPerfReport[] = [];

export function addPerfReport(report: StoredPerfReport) {
  reports.push(report);
  if (reports.length > MAX_REPORTS) {
    reports.splice(0, reports.length - MAX_REPORTS);
  }
}

export function getRecentPerfReports() {
  return [...reports];
}
