"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

type ReporterProps = {
  debug?: boolean;
};

type ReportPayload = {
  source: "next-web-vitals" | "performance-observer";
  metric: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
  navigationType?: string;
  attribution?: unknown;
  timestamp?: number;
  url?: string;
  path?: string;
  details?: Record<string, unknown>;
};

type NextMetric = {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating?: "good" | "needs-improvement" | "poor";
  navigationType?: string;
  attribution?: unknown;
};

const VITALS_ENDPOINT = "/api/vitals";

function sendReport(payload: ReportPayload) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(VITALS_ENDPOINT, blob);
    return;
  }

  void fetch(VITALS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

function toMs(duration: number) {
  return Number(duration.toFixed(2));
}

export function WebVitalsReporter({ debug = false }: ReporterProps) {
  const pathname = usePathname();
  const seenMetricIds = useRef<Set<string>>(new Set());
  const debugBuffer = useRef<ReportPayload[]>([]);

  const pushReport = useCallback(
    (payload: Omit<ReportPayload, "url" | "path" | "timestamp">) => {
      const report: ReportPayload = {
        ...payload,
        path: pathname,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        timestamp: Date.now(),
      };

      sendReport(report);

      if (debug) {
        debugBuffer.current.push(report);
        if (debugBuffer.current.length > 20) {
          debugBuffer.current.shift();
        }
      }
    },
    [debug, pathname],
  );

  useReportWebVitals((metric: NextMetric) => {
    const metricKey = `${metric.name}:${metric.id}`;
    if (seenMetricIds.current.has(metricKey)) return;
    seenMetricIds.current.add(metricKey);

    pushReport({
      source: "next-web-vitals",
      metric: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating: metric.rating,
      navigationType: metric.navigationType,
      attribution: metric.attribution,
    });
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

    let maxInp = 0;

    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          pushReport({
            source: "performance-observer",
            metric: "FCP",
            value: toMs(entry.startTime),
          });
        }
      }
    });
    paintObserver.observe({ type: "paint", buffered: true });

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries.at(-1);
      if (!last) return;
      pushReport({
        source: "performance-observer",
        metric: "LCP",
        value: toMs(last.startTime),
      });
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
        if (entry.hadRecentInput) continue;
        clsValue += entry.value ?? 0;
      }
      pushReport({
        source: "performance-observer",
        metric: "CLS",
        value: Number(clsValue.toFixed(4)),
      });
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { interactionId?: number; duration: number }>) {
        if ((entry.interactionId ?? 0) > 0 && entry.duration > maxInp) {
          maxInp = entry.duration;
        }
      }
      if (maxInp > 0) {
        pushReport({
          source: "performance-observer",
          metric: "INP",
          value: toMs(maxInp),
        });
      }
    });
    inpObserver.observe({
      type: "event",
      buffered: true,
      durationThreshold: 40,
    } as PerformanceObserverInit & { durationThreshold: number });

    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigationEntry) {
      pushReport({
        source: "performance-observer",
        metric: "TTFB",
        value: toMs(navigationEntry.responseStart),
      });
      pushReport({
        source: "performance-observer",
        metric: "NAVIGATION_TIMING",
        value: toMs(navigationEntry.duration),
        details: {
          dns: toMs(navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart),
          tcp: toMs(navigationEntry.connectEnd - navigationEntry.connectStart),
          tls:
            navigationEntry.secureConnectionStart > 0
              ? toMs(navigationEntry.connectEnd - navigationEntry.secureConnectionStart)
              : 0,
          request: toMs(navigationEntry.responseStart - navigationEntry.requestStart),
          response: toMs(navigationEntry.responseEnd - navigationEntry.responseStart),
          domInteractive: toMs(navigationEntry.domInteractive),
          domComplete: toMs(navigationEntry.domComplete),
          loadEventEnd: toMs(navigationEntry.loadEventEnd),
        },
      });
    }

    return () => {
      paintObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
      inpObserver.disconnect();
    };
  }, [pushReport]);

  useEffect(() => {
    if (!debug) return;

    const printSummary = () => {
      if (debugBuffer.current.length === 0) return;
      const latest = [...debugBuffer.current]
        .slice(-8)
        .map((item) => `${item.metric}=${item.value}`)
        .join(", ");
      console.info("[PERF_DEBUG] vitals:", latest);
    };

    const timer = window.setInterval(printSummary, 10000);
    printSummary();
    return () => window.clearInterval(timer);
  }, [debug]);

  return null;
}
