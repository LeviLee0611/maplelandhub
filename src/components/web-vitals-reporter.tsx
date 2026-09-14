"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

/**
 * 성능 지표 수집기.
 *
 * 운영 지표는 **표준 Web Vitals(next/web-vitals) 하나만** 기준으로 삼는다. 자체
 * PerformanceObserver는 같은 이름의 지표를 다른 정의로 계산하기 때문에(아래 참고) 두 출처를
 * 섞으면 개선 여부를 잘못 판단하게 된다 — 그래서 디버그 모드에서만 돌리고, 지표 이름도
 * 표준 지표와 구분되게 붙인다(2026-09-10 정리).
 */

type ReporterProps = {
  debug?: boolean;
};

/** 최초 페이지 진입 지표인지, 이후 화면 이동(soft navigation) 지표인지 구분 */
type ReportPhase = "initial" | "soft-navigation";

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
  /** 이 리포터가 처음 마운트됐을 때의 경로 — 이 값은 세션 내내 바뀌지 않는다. */
  entryPath?: string;
  /**
   * 보고 시점에 실제로 떠 있던 경로. CLS/INP처럼 페이지 수명 동안 누적되다 나중에(때로는
   * 다른 화면으로 이동한 뒤에) 최종값이 보고되는 지표는, 이 값이 지표가 실제로 측정된 화면과
   * 다를 수 있다 — App Router의 클라이언트 내비게이션은 전체 언로드가 아니라서 web-vitals
   * 라이브러리의 관측이 화면 전환을 가로질러 계속되기 때문. `entryPath`와 함께 봐야
   * "어느 화면 지표인지"를 오판하지 않는다.
   */
  path?: string;
  phase?: ReportPhase;
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
  // pushReport가 pathname에 의존하면 경로가 바뀔 때마다 콜백 참조가 새로 생겨
  // observer가 재등록되고 buffered 항목을 다시 읽는다(중복 보고). 참조를 고정하기 위해
  // 경로는 ref로 읽는다 — Next.js도 보고 콜백 참조 안정화를 권장.
  const pathnameRef = useRef(pathname);
  // 마운트 시점(이 세션 최초 진입) 경로 — 절대 갱신하지 않는다. pathnameRef는 보고 시점의
  // "현재" 경로를 추적하는 것과 역할이 다르다.
  const entryPathRef = useRef(pathname);
  const phaseRef = useRef<ReportPhase>("initial");
  // metric:id -> 마지막으로 보낸 값. 같은 값의 재보고만 걸러내고, 값이 갱신된 후속 보고는
  // 통과시킨다. CLS/INP는 같은 id로 값이 커지며 여러 번 보고되므로, 무조건 첫 보고만 받으면
  // 가장 부정확한 초기값이 남고 최종값이 버려진다.
  const lastSentValueByMetric = useRef<Map<string, number>>(new Map());
  const debugBuffer = useRef<ReportPayload[]>([]);

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      phaseRef.current = "soft-navigation";
    }
  }, [pathname]);

  const pushReport = useCallback(
    (payload: Omit<ReportPayload, "url" | "path" | "timestamp" | "phase">) => {
      const report: ReportPayload = {
        ...payload,
        entryPath: entryPathRef.current,
        path: pathnameRef.current,
        phase: phaseRef.current,
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
    [debug],
  );

  // next/web-vitals의 useReportWebVitals는 넘겨준 콜백 참조를 deps로 삼아 매번
  // onCLS/onFID/onLCP/onINP/onFCP/onTTFB를 다시 등록한다(node_modules/next/dist/client/web-vitals.js
  // 참고). 인라인 함수를 넘기면 렌더될 때마다 재등록돼 관측이 중복 누적된다 — useCallback으로
  // 참조를 고정해야 마운트 시 한 번만 등록된다.
  const handleWebVitalsMetric = useCallback(
    (metric: NextMetric) => {
      const metricKey = `${metric.name}:${metric.id}`;
      const lastValue = lastSentValueByMetric.current.get(metricKey);
      if (lastValue === metric.value) return;
      lastSentValueByMetric.current.set(metricKey, metric.value);

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
    },
    [pushReport],
  );

  useReportWebVitals(handleWebVitalsMetric);

  // 네비게이션 타이밍 분해(dns/tcp/tls/request/response). 표준 Web Vitals가 다루지 않는
  // 정보이고 페이지 로드당 1회뿐이라 항상 수집한다.
  useEffect(() => {
    if (typeof window === "undefined" || typeof performance === "undefined") return;

    const navigationEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (!navigationEntry) return;

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
  }, [pushReport]);

  // 상세 관측은 디버그 세션에서만. 여기서 계산하는 CLS/INP는 공식 정의와 다르므로
  // (CLS: 공식은 세션 구간별 최댓값 / 여기선 단순 누적합, INP: 공식은 상호작용 지연 분포 기반 /
  // 여기선 관측 이벤트 최대 지속시간) 이름을 구분해 운영 지표와 섞이지 않게 한다.
  useEffect(() => {
    if (!debug) return;
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          pushReport({
            source: "performance-observer",
            metric: "DEBUG_FCP",
            value: toMs(entry.startTime),
          });
        }
      }
    });
    paintObserver.observe({ type: "paint", buffered: true });

    const lcpObserver = new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1);
      if (!last) return;
      pushReport({
        source: "performance-observer",
        metric: "DEBUG_LCP",
        value: toMs(last.startTime),
      });
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    let clsSum = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<
        PerformanceEntry & { value?: number; hadRecentInput?: boolean }
      >) {
        if (entry.hadRecentInput) continue;
        clsSum += entry.value ?? 0;
      }
      pushReport({
        source: "performance-observer",
        metric: "DEBUG_CLS_CUMULATIVE_SUM",
        value: Number(clsSum.toFixed(4)),
      });
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    let maxEventDuration = 0;
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<
        PerformanceEntry & { interactionId?: number; duration: number }
      >) {
        if ((entry.interactionId ?? 0) > 0 && entry.duration > maxEventDuration) {
          maxEventDuration = entry.duration;
        }
      }
      if (maxEventDuration > 0) {
        pushReport({
          source: "performance-observer",
          metric: "DEBUG_INP_MAX_EVENT_DURATION",
          value: toMs(maxEventDuration),
        });
      }
    });
    inpObserver.observe({
      type: "event",
      buffered: true,
      durationThreshold: 40,
    } as PerformanceObserverInit & { durationThreshold: number });

    return () => {
      paintObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
      inpObserver.disconnect();
    };
  }, [debug, pushReport]);

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
