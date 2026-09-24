/**
 * 애드센스 스크립트.
 *
 * 자동 광고는 이 스크립트 하나만 있으면 되고, 실제 배치는 애드센스 계정 설정이 정한다
 * (2026-09-24 설정: 오버레이 = 앵커 하단만 + 사이드 레일, 모바일 전면광고 OFF /
 *  인페이지 유지 / 계산기·드랍테이블은 "제외된 페이지"로 자동 광고 대상에서 뺌).
 *
 * `<Script>` 대신 순수 `<script>`를 쓴다 — React 19가 `async` 스크립트를 SSR 단계에서 `<head>`로
 * 끌어올려 주기 때문에 **초기 HTML에 그대로 박힌다**. 애드센스 사이트 소유권 확인이 이 스니펫을
 * 찾는 방식이라 초기 HTML에 있어야 안전하다. next/script의 `afterInteractive`는 하이드레이션
 * 이후에 주입돼 초기 HTML에는 없다.
 *
 * GA와 같은 가드: 환경변수가 없거나 개발 환경이면 렌더하지 않는다. 로컬 `next dev`에서 광고를
 * 띄울 이유가 없고, 검증되지 않은 트래픽을 애드센스에 보내지 않기 위함이다.
 * 확인하려면 `npm run build && npm start`로 운영 빌드를 돌릴 것.
 */

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export function GoogleAdsense() {
  if (!ADSENSE_CLIENT_ID || process.env.NODE_ENV !== "production") return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}
