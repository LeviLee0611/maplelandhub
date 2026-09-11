import type { SyntheticEvent } from "react";

const REGION = "KMS";
const VERSION = "389";
const BASE_URL = `https://maplestory.io/api/${REGION}/${VERSION}`;
const ITEM_BASE_URL = "https://maplestory.io/api/GMS/200";
const FALLBACK_VERSIONS = [
  { region: "kms", version: "284" },
  { region: "gms", version: "92" },
  { region: "gms", version: "200" },
  { region: "gms", version: "255" },
  { region: "jms", version: "419" },
] as const;

type MapleIoImageType = "mob" | "item" | "map" | "npc" | "quest";

// 개별 부위(머리/팔/다리 등)를 하나로 합쳐 보여주는 "집계용" 몬스터 카드는
// maplestory.io에 전용 아이콘/렌더가 없어(혼테일 8810018 계열은 실제 mobId지만
// 미등록, 자쿰 8888889/8888890 등은 공식 mobId 자체가 아님) 전신 이미지를 직접 대체한다.
// 출처: 인벤 메이플스토리 몬스터 도감(static.inven.co.kr) — 혼테일은 세 얼굴이 모두 보이는
// 몬스터북 컷, 자쿰은 본체+주먹이 함께 보이는 컷을 사용.
const MOB_ICON_STATIC_OVERRIDES: Record<number, string> = {
  8810018: "/images/monsters/horntail-full.png", // 혼테일 (본체)
  8810118: "/images/monsters/horntail-full.png", // 카오스 혼테일 (통합 카드)
  8888889: "/images/monsters/zakum-full.png", // 카오스 자쿰 (통합 카드)
};

// 우리 데이터의 mobCode엔 icon/animated/render 전부 1x1 빈 PNG(실질적으로 이미지 없음)만
// 내려오는데, maplestory.io 자체 DB엔 같은 몬스터가 다른 mobId로 등록돼 있어 그쪽엔 실제
// 이미지가 있는 경우(2026-09-10 확인) — 정적 파일 대신 조회용 mobId만 바꿔 API를 그대로 재사용.
const MOB_ICON_ID_ALIASES: Record<number, number> = {
  8220036: 9300004, // 미믹(폐광) — maplestory.io엔 이 mobId로만 아이콘/렌더 등록됨
};

// 기본 버전(gms/100)엔 아이콘이 없고 특정 버전에만 있는 몬스터. 지정하지 않으면 폴백 체인을
// 순서대로 타느라 성공할 때까지 빈 이미지가 보인다(무루 계열은 4번째 요청에서야 성공).
// 출처: `node scripts/check-mob-icons.mjs` 실측(2026-09-10, 출시 500종 중 이 6종만 해당).
const MOB_ICON_PREFERRED_VERSION: Record<number, { region: string; version: string }> = {
  2600622: { region: "kms", version: "284" }, // 알리샤르
  9600300: { region: "gms", version: "200" }, // 무루
  9600301: { region: "gms", version: "200" }, // 무루파
  9600302: { region: "gms", version: "200" }, // 무루피아
  9600303: { region: "gms", version: "200" }, // 무루무루
  9600304: { region: "gms", version: "200" }, // 무루쿤
};

function resolveStaticOverride(mobCode: number | string) {
  return MOB_ICON_STATIC_OVERRIDES[Number(mobCode)];
}

function resolveIconAlias(mobCode: number | string) {
  return MOB_ICON_ID_ALIASES[Number(mobCode)] ?? mobCode;
}

export function getMobIconUrl(mobCode: number | string) {
  const staticOverride = resolveStaticOverride(mobCode);
  if (staticOverride) return staticOverride;

  const lookupCode = resolveIconAlias(mobCode);
  const preferred = MOB_ICON_PREFERRED_VERSION[Number(mobCode)];
  const { region, version } = preferred ?? { region: "gms", version: "100" };
  return `https://maplestory.io/api/${region}/${version}/mob/${lookupCode}/icon`;
}

export function getMobAnimatedUrl(mobCode: number | string, action: "move" | "stand" = "move") {
  return (
    resolveStaticOverride(mobCode) ??
    `https://maplestory.io/api/gms/200/mob/animated/${resolveIconAlias(mobCode)}/${action}`
  );
}

export function getMobRenderUrl(mobCode: number | string, action: "stand" | "move" = "stand") {
  const renderBase = "https://maplestory.io/api/GMS/62";
  return resolveStaticOverride(mobCode) ?? `${renderBase}/mob/${resolveIconAlias(mobCode)}/render/${action}`;
}

export function getNpcIconUrl(npcId: number | string) {
  return `https://maplestory.io/api/gms/62/npc/${npcId}/icon`;
}

export function getItemIconUrl(itemId: number | string, resize = 2) {
  const suffix = resize ? `?resize=${resize}` : "";
  return `${ITEM_BASE_URL}/item/${itemId}/icon${suffix}`;
}

export function getItemIconCandidateUrls(itemId: number | string, resize = 2) {
  const suffix = resize ? `?resize=${resize}` : "";
  return [
    `${ITEM_BASE_URL}/item/${itemId}/icon${suffix}`,
    `https://maplestory.io/api/KMS/284/item/${itemId}/icon${suffix}`,
    `https://maplestory.io/api/GMS/92/item/${itemId}/icon${suffix}`,
    `https://maplestory.io/api/GMS/255/item/${itemId}/icon${suffix}`,
    `https://maplestory.io/api/JMS/419/item/${itemId}/icon${suffix}`,
  ];
}

export function getSkillIconUrl(skillId: number | string) {
  return `${BASE_URL}/skill/${skillId}/icon`;
}

function buildFallbackUrl(imgType: MapleIoImageType, code: string, retryCount: number) {
  const next = FALLBACK_VERSIONS[retryCount - 1];
  if (!next) return null;

  const resolvedCode = imgType === "mob" ? resolveIconAlias(code) : code;
  const codePath = encodeURIComponent(String(resolvedCode));
  if (imgType === "map") {
    return `https://maplestory.io/api/${next.region}/${next.version}/map/${codePath}/minimap?resize=2`;
  }
  return `https://maplestory.io/api/${next.region}/${next.version}/${imgType}/${codePath}/icon?resize=2`;
}

// 모든 후보가 실패했을 때 보여줄 대체 이미지. 그냥 두면 브라우저 기본 "깨진 이미지"가 노출된다.
// 외부 요청 없이 항상 그려지도록 인라인 SVG data URI를 쓴다.
const EXHAUSTED_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'>" +
      "<rect width='32' height='32' rx='4' fill='rgba(148,163,184,0.15)' stroke='rgba(148,163,184,0.35)' stroke-dasharray='3 2'/>" +
      "<text x='16' y='21' font-size='13' text-anchor='middle' fill='rgb(148,163,184)'>?</text>" +
      "</svg>",
  );

export function handleMapleIoImageError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  imgType: MapleIoImageType,
) {
  const img = event.currentTarget;
  // 대체 이미지까지 실패로 들어온 경우 무한 루프를 막는다.
  if (img.dataset.mapleExhausted === "true") return;

  const code = img.getAttribute("data-maple-code");
  if (!code) return;

  const currentRetry = Number(img.getAttribute("data-maple-retry") ?? "0");
  const nextRetry = currentRetry + 1;
  img.setAttribute("data-maple-retry", String(nextRetry));

  const nextUrl = buildFallbackUrl(imgType, code, nextRetry);
  if (nextUrl) {
    img.src = nextUrl;
    return;
  }

  img.dataset.mapleExhausted = "true";
  img.src = EXHAUSTED_PLACEHOLDER;
}
