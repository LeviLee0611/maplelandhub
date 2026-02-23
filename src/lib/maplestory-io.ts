const REGION = "GMS";
const VERSION = "255";
const BASE_URL = `https://maplestory.io/api/${REGION}/${VERSION}`;

export function getMobIconUrl(mobCode: number | string) {
  return `${BASE_URL}/mob/${mobCode}/icon`;
}

export function getSkillIconUrl(skillId: number | string) {
  return `${BASE_URL}/skill/${skillId}/icon`;
}
