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

function resolveStaticOverride(mobCode: number | string) {
  return MOB_ICON_STATIC_OVERRIDES[Number(mobCode)];
}

export function getMobIconUrl(mobCode: number | string) {
  return resolveStaticOverride(mobCode) ?? `https://maplestory.io/api/gms/100/mob/${mobCode}/icon`;
}

export function getMobAnimatedUrl(mobCode: number | string, action: "move" | "stand" = "move") {
  return resolveStaticOverride(mobCode) ?? `https://maplestory.io/api/gms/200/mob/animated/${mobCode}/${action}`;
}

export function getMobAnimatedFallbackUrl(mobCode: number | string, action: "stand" | "move" = "stand") {
  return resolveStaticOverride(mobCode) ?? `https://maplestory.io/api/gms/200/mob/animated/${mobCode}/${action}`;
}

export function getMobRenderUrl(mobCode: number | string, action: "stand" | "move" = "stand") {
  const renderBase = "https://maplestory.io/api/GMS/62";
  return resolveStaticOverride(mobCode) ?? `${renderBase}/mob/${mobCode}/render/${action}`;
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

  const codePath = encodeURIComponent(code);
  if (imgType === "map") {
    return `https://maplestory.io/api/${next.region}/${next.version}/map/${codePath}/minimap?resize=2`;
  }
  return `https://maplestory.io/api/${next.region}/${next.version}/${imgType}/${codePath}/icon?resize=2`;
}

export function handleMapleIoImageError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  imgType: MapleIoImageType,
) {
  const img = event.currentTarget;
  const code = img.getAttribute("data-maple-code");
  if (!code) return;

  const currentRetry = Number(img.getAttribute("data-maple-retry") ?? "0");
  const nextRetry = currentRetry + 1;
  img.setAttribute("data-maple-retry", String(nextRetry));

  const nextUrl = buildFallbackUrl(imgType, code, nextRetry);
  if (nextUrl) {
    img.src = nextUrl;
  }
}
