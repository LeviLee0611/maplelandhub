const REGION = "KMS";
const VERSION = "389";
const BASE_URL = `https://maplestory.io/api/${REGION}/${VERSION}`;
const ITEM_BASE_URL = "https://maplestory.io/api/GMS/200";

export function getMobIconUrl(mobCode: number | string) {
  return `${BASE_URL}/mob/${mobCode}/icon`;
}

export function getMobAnimatedUrl(mobCode: number | string, action: "move" | "stand" = "move") {
  return `${BASE_URL}/mob/animated/${mobCode}/${action}`;
}

export function getMobRenderUrl(mobCode: number | string, action: "stand" | "move" = "stand") {
  const renderBase = "https://maplestory.io/api/GMS/62";
  return `${renderBase}/mob/${mobCode}/render/${action}`;
}

export function getItemIconUrl(itemId: number | string, resize = 2) {
  const suffix = resize ? `?resize=${resize}` : "";
  return `${ITEM_BASE_URL}/item/${itemId}/icon${suffix}`;
}

export function getSkillIconUrl(skillId: number | string) {
  return `${BASE_URL}/skill/${skillId}/icon`;
}
