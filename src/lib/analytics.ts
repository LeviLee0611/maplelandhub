type GAEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * GA4로 커스텀 이벤트를 보낸다. 프로덕션에서만 <GoogleAnalytics/>가 gtag를 주입하므로
 * 개발 환경/광고차단 등으로 gtag가 없으면 조용히 no-op.
 * 자유 텍스트(검색어 원문 등)는 절대 params에 넣지 말 것 — 길이/카운트/고정값(enum)만 전달.
 */
export function trackEvent(name: string, params?: GAEventParams) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
