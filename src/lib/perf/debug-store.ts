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
