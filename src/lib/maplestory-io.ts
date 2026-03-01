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

export function getMobIconUrl(mobCode: number | string) {
  return `${BASE_URL}/mob/${mobCode}/icon`;
}

export function getMobAnimatedUrl(mobCode: number | string, action: "move" | "stand" = "move") {
  return `${BASE_URL}/mob/animated/${mobCode}/${action}`;
}

export function getMobAnimatedFallbackUrl(mobCode: number | string, action: "stand" | "move" = "stand") {
  return `https://maplestory.io/api/gms/200/mob/animated/${mobCode}/${action}`;
}

export function getMobRenderUrl(mobCode: number | string, action: "stand" | "move" = "stand") {
  const renderBase = "https://maplestory.io/api/GMS/62";
  return `${renderBase}/mob/${mobCode}/render/${action}`;
}

export function getNpcIconUrl(npcId: number | string) {
  return `https://maplestory.io/api/gms/62/npc/${npcId}/icon`;
}

export function getItemIconUrl(itemId: number | string, resize = 2) {
  const suffix = resize ? `?resize=${resize}` : "";
  return `${ITEM_BASE_URL}/item/${itemId}/icon${suffix}`;
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
