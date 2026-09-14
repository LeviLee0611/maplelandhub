export type PerfMetricReport = {
  source: "next-web-vitals" | "performance-observer";
  metric: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
  navigationType?: string;
  url?: string;
  /** 리포터가 마운트된(세션 최초 진입) 경로 — 세션 내내 고정. */
  entryPath?: string;
  /** 보고 시점에 실제로 떠 있던 경로. entryPath와 다르면 지표가 다른 화면에서 측정을
   * 시작해 이 화면에서 끝났을 수 있다는 뜻 — 어느 화면 지표인지 단정하지 말 것. */
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
