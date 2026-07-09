// 메이플 플래닛(Planet) 데이터셋 빌드 스크립트.
//
// Planet은 메이플랜드(Mapleland)와 동일한 pre-빅뱅 KMS 1.2.95~98 기반 서버이므로,
// 처음부터 새로 스크래핑하지 않고 이미 빌드된 Mapleland 데이터(data/*.json)를 기반으로
// data/planet/divergence-overrides.json에 기록된 배율/오버라이드만 얹어 data/planet/*.json을 생성한다.
//
// 알려진 Planet vs Mapleland 차이 (자세한 내용은 divergence-overrides.json 주석 참고):
//   - EXP 획득 4배 (+300%)   — 현재 monsters.json에 굽지 않음 (몬스터 고유 스탯 필드라 판단, 계산기 쪽에서 배율 적용)
//   - 드롭률 4배 (+300%)     — drop-index.json / item-detail-by.json의 prob 필드에 직접 반영
//   - 메소 획득 2배 (+100%)  — 몬스터별 기본 메소 필드가 데이터에 없어 배율 config만 기록
//     (버섯의 성/커닝스퀘어/아리안트/마가티아/네오시티 특정 몬스터는 메소 절반 예외 — mesoHalvedMonsterCodes)
//   - 95레벨 미만 몬스터 + 킬러 레벨차 30↑ 시 드롭/메소 보너스 미적용 라이브 패치
//     — drop-index가 정적 데이터라 런타임 계산 로직 없이는 반영 불가. config 노브만 둠 (dropRateLevelException)
//
// 실행: node scripts/build-planet-data.mjs [--force]
//   --force: data/planet/release-filters.json이 이미 있어도 Mapleland 원본으로 덮어씀 (기본은 최초 1회만 복사)

import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

const MAPLELAND_MONSTERS = path.resolve("data/monsters.json");
const MAPLELAND_DROP_INDEX = path.resolve("data/drop-index.json");
const MAPLELAND_ITEM_DETAIL_BY = path.resolve("data/item-detail-by.json");
const MAPLELAND_RELEASE_FILTERS = path.resolve("data/release-filters.json");

const PLANET_DIR = path.resolve("data/planet");
// 손수 관리하는 원천 데이터(빌드 산출물 아님) — data/는 스크립트 산출물 전용이라는 규칙과 분리하기 위해
// scripts/sources/planet/ 아래에 둔다 (data.md 참고).
const PLANET_SOURCES_DIR = path.resolve("scripts/sources/planet");
const OVERRIDES_PATH = path.join(PLANET_SOURCES_DIR, "divergence-overrides.json");
const ATTRIBUTE_DATA_PATH = path.join(PLANET_SOURCES_DIR, "monster-attribute-data.js");
const CATALOG_DATA_PATH = path.join(PLANET_SOURCES_DIR, "monster-catalog-data.js");
const MAP_CATALOG_DATA_PATH = path.join(PLANET_SOURCES_DIR, "map-catalog-data.js");
const CUBE_DATA_PATH = path.join(PLANET_SOURCES_DIR, "cube-data.js");
const OUTPUT_CUBE_INDEX = path.join(PLANET_DIR, "cube-index.json");
const OUTPUT_MONSTERS = path.join(PLANET_DIR, "monsters.json");
const OUTPUT_DROP_INDEX = path.join(PLANET_DIR, "drop-index.json");
const OUTPUT_ITEM_DETAIL_BY = path.join(PLANET_DIR, "item-detail-by.json");
const OUTPUT_RELEASE_FILTERS = path.join(PLANET_DIR, "release-filters.json");

// 영문 소스 데이터셋(scripts/sources/planet/monster-attribute-data.js)의 속성 코드 표기 규칙.
// 예: "I2F3" -> [얼음 반감, 불 약점]. 실제 data/monsters.json의 ele 표기와 대조해 검증됨(충돌 0건, 항상 상위집합).
const ATTRIBUTE_ELEMENT_MAP = { F: "불", I: "얼음", L: "전기", S: "독", H: "성" };
const ATTRIBUTE_STATE_MAP = { 1: "면역", 2: "반감", 3: "약점" };

function decodeAttributeCode(eStr) {
  if (!eStr) return [];
  const codes = eStr.match(/[A-Z]\d/g) ?? [];
  return codes.map((code) => `${ATTRIBUTE_ELEMENT_MAP[code[0]] ?? code[0]} ${ATTRIBUTE_STATE_MAP[code[1]] ?? code[1]}`);
}

// scripts/sources/planet/monster-attribute-data.js (있으면)를 읽어 mobCode로 매칭되는 몬스터의 ele 필드를 보강한다.
// 파일이 없으면 조용히 건너뜀 — 선택적 보강 데이터이므로 필수 아님.
async function applyAttributeData(monsters, attributeDataPath) {
  if (!(await pathExists(attributeDataPath))) return monsters;

  const moduleUrl = pathToFileURL(attributeDataPath).href;
  const { MONSTER_ATTRIBUTE_DATA, MONSTER_ATTRIBUTE_META } = await import(moduleUrl);
  const attributeByMobCode = MONSTER_ATTRIBUTE_DATA ?? {};

  const monstersByCode = new Map(monsters.map((m) => [m.mobCode, m]));
  let matched = 0;
  const unmatched = [];
  for (const [codeStr, attr] of Object.entries(attributeByMobCode)) {
    const mobCode = Number(codeStr);
    if (!monstersByCode.has(mobCode)) {
      unmatched.push(`${mobCode}(${attr?.n ?? "?"})`);
      continue;
    }
    matched++;
  }

  const result = monsters.map((monster) => {
    const attr = attributeByMobCode[String(monster.mobCode)];
    if (!attr) return monster;
    const decoded = decodeAttributeCode(attr.e);
    return { ...monster, ele: decoded.length > 0 ? decoded : ["무속성"] };
  });

  console.log(
    `[monster-attribute-data] 소스: ${MONSTER_ATTRIBUTE_META?.source ?? "?"} — ${matched}종 매칭, ${unmatched.length}종 미매칭(신규 몬스터 후보, 별도 확인 필요)`,
  );
  if (unmatched.length > 0) {
    console.log(`[monster-attribute-data] 미매칭 mobCode: ${unmatched.join(", ")}`);
  }

  return result;
}

const CATALOG_FIELD_MAP = {
  hp: "hp",
  exp: "exp",
  level: "level",
  accuracy: "acc",
  avoid: "eva",
  physicalDamage: "watk",
  magicDamage: "matk",
  physicalDefense: "def",
  magicDefense: "mDef",
};

// scripts/sources/planet/monster-catalog-data.js (있으면)를 읽어, 메랜 원본에 없는 mobCode만
// Planet 전용 신규 몬스터로 변환한다. 이미 존재하는 mobCode는 건드리지 않음(별도 검증 없이
// 대량 덮어쓰기하지 않기 위함 — exp는 이미 Planet 4배가 반영된 값으로 보이나 몬스터별 편차가 있어
// 기존 항목 자동 교체는 하지 않음, monsterOverrides로 개별 확인 후 반영 권장).
async function applyCatalogData(monsters, catalogDataPath, attributeDataPath) {
  if (!(await pathExists(catalogDataPath))) return monsters;

  const catalogUrl = pathToFileURL(catalogDataPath).href;
  const { MONSTER_CATALOG_DATA } = await import(catalogUrl);
  const catalogEntries = (MONSTER_CATALOG_DATA ?? []).filter((m) => m && m.hp > 0);

  let attributeByMobCode = {};
  if (await pathExists(attributeDataPath)) {
    const attrUrl = pathToFileURL(attributeDataPath).href;
    const { MONSTER_ATTRIBUTE_DATA } = await import(attrUrl);
    attributeByMobCode = MONSTER_ATTRIBUTE_DATA ?? {};
  }

  const existingMobCodes = new Set(monsters.map((m) => m.mobCode));
  const newEntries = [];
  let skippedExisting = 0;
  for (const entry of catalogEntries) {
    if (existingMobCodes.has(entry.id)) {
      skippedExisting++;
      continue;
    }
    const monster = { name: entry.name, mobCode: entry.id, ele: ["무속성"], needAcc: 0 };
    for (const [catalogKey, monsterKey] of Object.entries(CATALOG_FIELD_MAP)) {
      monster[monsterKey] = typeof entry[catalogKey] === "number" ? entry[catalogKey] : 0;
    }
    const attr = attributeByMobCode[String(entry.id)];
    if (attr?.e) {
      const decoded = decodeAttributeCode(attr.e);
      if (decoded.length > 0) monster.ele = decoded;
    }
    newEntries.push(monster);
    existingMobCodes.add(entry.id);
  }

  console.log(
    `[monster-catalog-data] ${catalogEntries.length}종 중 ${skippedExisting}종은 이미 존재(건드리지 않음), ${newEntries.length}종 신규 추가`,
  );

  return [...monsters, ...newEntries];
}

// scripts/sources/planet/map-catalog-data.js (있으면)를 읽어, 몬스터의 구체적 출현 맵(map 필드, 현재 어떤 몬스터도
// 채워져 있지 않음)을 보강한다. 한 몬스터가 여러 맵에 출현할 수 있으므로 스폰 수(count)가 가장 많은
// 맵을 대표 맵으로 채택한다. region 필드(광역 지역명, 이미 전량 채워져 있음)는 건드리지 않는다.
async function applyMapCatalogData(monsters, mapCatalogDataPath) {
  if (!(await pathExists(mapCatalogDataPath))) return monsters;

  const moduleUrl = pathToFileURL(mapCatalogDataPath).href;
  const { MAP_CATALOG_META, MAP_CATALOG_DATA } = await import(moduleUrl);

  // mobCode -> 가장 스폰 수가 많은 맵 이름
  const bestMapByMobCode = new Map();
  for (const map of MAP_CATALOG_DATA ?? []) {
    for (const mob of map.mobs ?? []) {
      const current = bestMapByMobCode.get(mob.id);
      if (!current || mob.count > current.count) {
        bestMapByMobCode.set(mob.id, { name: map.name, count: mob.count });
      }
    }
  }

  let matched = 0;
  const result = monsters.map((monster) => {
    const best = bestMapByMobCode.get(monster.mobCode);
    if (!best) return monster;
    matched++;
    return { ...monster, map: best.name };
  });

  console.log(`[map-catalog-data] 소스: ${MAP_CATALOG_META?.source ?? "?"} — ${matched}종 몬스터의 map 필드 보강`);

  return result;
}

const FORCE_RELEASE_FILTERS = process.argv.includes("--force");

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// generatedAt만 바뀌고 나머지 내용이 동일하면 파일을 건드리지 않는다 — 매 실행마다 timestamp만
// 바뀌는 diff가 쌓여 리뷰 노이즈가 커지는 것을 방지 (내용이 실제로 바뀐 경우에만 generatedAt 갱신).
async function writeJsonIfChanged(filePath, data) {
  const { generatedAt: _newGeneratedAt, ...newRest } = data;
  if (await pathExists(filePath)) {
    const existing = await readJson(filePath);
    const { generatedAt: _oldGeneratedAt, ...existingRest } = existing;
    if (JSON.stringify(existingRest) === JSON.stringify(newRest)) {
      console.log(`Skipped ${filePath} (내용 변경 없음, generatedAt 유지)`);
      return false;
    }
  }
  await writeJson(filePath, data);
  return true;
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function clampProbability(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
  if (value < 0) return 0;
  return Math.min(1, value);
}

// dropsByMonsterId / monstersByItemId 공통 형태: { [key: string]: Array<{ itemId?, mobId?, prob?, min?, max? }> }
function applyDropRateMultiplierToRewardMap(rewardMap, multiplier) {
  const result = {};
  for (const [key, rewards] of Object.entries(rewardMap ?? {})) {
    result[key] = (rewards ?? []).map((reward) => {
      if (!reward || typeof reward.prob !== "number") return reward;
      return { ...reward, prob: clampProbability(reward.prob * multiplier) };
    });
  }
  return result;
}

// item-detail-by.json: { itemsByItemId: { [itemId: string]: Array<{ mobId, prob }> } }
function applyDropRateMultiplierToItemDetailBy(itemDetailBy, multiplier) {
  const itemsByItemId = applyDropRateMultiplierToRewardMap(itemDetailBy?.itemsByItemId, multiplier);
  return { ...itemDetailBy, itemsByItemId };
}

function applyMonsterOverrides(monsters, monsterOverrides) {
  if (!monsterOverrides || Object.keys(monsterOverrides).length === 0) return monsters;
  return monsters.map((monster) => {
    const rawOverride = monsterOverrides[String(monster.mobCode)];
    if (!rawOverride || typeof rawOverride !== "object") return monster;
    const override = Object.fromEntries(Object.entries(rawOverride).filter(([key]) => !key.startsWith("_")));
    return { ...monster, ...override };
  });
}

const REQUIRED_MONSTER_FIELDS = ["name", "level", "hp", "exp", "acc", "eva", "needAcc", "def", "mDef", "ele", "mobCode"];

// Mapleland 베이스에 아예 존재하지 않는 Planet 전용 신규 몬스터(카오스 자쿰, 핑크빈 서브페이즈 등)를 추가한다.
// 이미 존재하는 mobCode면 건너뛴다 (덮어쓰기는 monsterOverrides가 담당).
function appendNewMonsters(monsters, newMonsters) {
  if (!Array.isArray(newMonsters) || newMonsters.length === 0) return monsters;
  const existingMobCodes = new Set(monsters.map((m) => m.mobCode));
  const toAppend = [];
  for (const entry of newMonsters) {
    if (!entry || typeof entry !== "object") continue;
    if (entry._example) continue; // 템플릿 예시 항목은 건너뜀
    const missing = REQUIRED_MONSTER_FIELDS.filter((field) => entry[field] === undefined);
    if (missing.length > 0) {
      console.warn(`[newMonsters] 건너뜀 (필수 필드 누락: ${missing.join(", ")}):`, entry.name ?? entry.mobCode);
      continue;
    }
    if (existingMobCodes.has(entry.mobCode)) {
      console.warn(`[newMonsters] 건너뜀 (mobCode ${entry.mobCode} 이미 존재, monsterOverrides 사용할 것):`, entry.name);
      continue;
    }
    const monster = Object.fromEntries(Object.entries(entry).filter(([key]) => !key.startsWith("_")));
    toAppend.push(monster);
    existingMobCodes.add(entry.mobCode);
  }
  return [...monsters, ...toAppend];
}

function applyItemOverrides(items, itemOverrides) {
  if (!itemOverrides || Object.keys(itemOverrides).length === 0) return items;
  return items.map((item) => {
    const override = itemOverrides[String(item.id)];
    if (!override || typeof override !== "object") return item;
    return { ...item, ...override };
  });
}

// scripts/sources/planet/cube-data.js (있으면)를 읽어 큐브 시뮬레이터용 data/planet/cube-index.json을 생성한다.
// 원본 출처: 메이플 플래닛 공식 홈페이지(mapleplanet.co.kr/Cube). Mapleland에는 잠재능력/큐브 시스템 자체가
// 없으므로 Planet 전용 데이터 — Mapleland 쪽 변환은 필요 없음.
async function buildCubeIndex(cubeDataPath) {
  if (!(await pathExists(cubeDataPath))) return null;
  const moduleUrl = pathToFileURL(cubeDataPath).href;
  const { SOURCE_META, SUSPICIOUS_DATA, MIRACLE_DATA } = await import(moduleUrl);
  return {
    generatedAt: new Date().toISOString(),
    source: SOURCE_META?.source ?? "https://mapleplanet.co.kr/Cube",
    capturedAt: SOURCE_META?.capturedAt ?? null,
    suspicious: SUSPICIOUS_DATA ?? [],
    miracle: MIRACLE_DATA ?? [],
  };
}

async function main() {
  const [monsters, dropIndex, itemDetailBy, overrides] = await Promise.all([
    readJson(MAPLELAND_MONSTERS),
    readJson(MAPLELAND_DROP_INDEX),
    readJson(MAPLELAND_ITEM_DETAIL_BY),
    readJson(OVERRIDES_PATH),
  ]);

  const dropRateMultiplier =
    typeof overrides?.rateMultipliers?.dropRate === "number" ? overrides.rateMultipliers.dropRate : 1;
  const monsterOverrides = overrides?.monsterOverrides ?? {};
  const itemOverrides = overrides?.itemOverrides ?? {};
  const newMonsters = overrides?.newMonsters ?? [];

  // 1) monsters.json: 속성(ele) 보강 -> 카탈로그의 신규 몬스터 추가 -> 출현 맵(map) 보강
  //    -> 몬스터 오버라이드 적용 -> divergence-overrides.json의 신규 몬스터 추가
  //    (exp/meso 배율은 굽지 않음 — 위 헤더 주석 참고. 단, 카탈로그의 exp는 이미 Planet 4배가 반영된 값으로 보임)
  const monstersWithAttributes = await applyAttributeData(monsters, ATTRIBUTE_DATA_PATH);
  const monstersWithCatalog = await applyCatalogData(monstersWithAttributes, CATALOG_DATA_PATH, ATTRIBUTE_DATA_PATH);
  const monstersWithMaps = await applyMapCatalogData(monstersWithCatalog, MAP_CATALOG_DATA_PATH);
  const planetMonsters = appendNewMonsters(applyMonsterOverrides(monstersWithMaps, monsterOverrides), newMonsters);

  // 2) drop-index.json: dropRate 배율을 dropsByMonsterId/monstersByItemId의 prob에 반영 + itemOverrides
  const planetDropIndex = {
    ...dropIndex,
    generatedAt: new Date().toISOString(),
    source: `${dropIndex.source ?? "mapleland"}+planet-divergence`,
    items: applyItemOverrides(dropIndex.items ?? [], itemOverrides),
    dropsByMonsterId: applyDropRateMultiplierToRewardMap(dropIndex.dropsByMonsterId, dropRateMultiplier),
    monstersByItemId: applyDropRateMultiplierToRewardMap(dropIndex.monstersByItemId, dropRateMultiplier),
  };

  // 3) item-detail-by.json: 동일한 dropRate 배율을 itemsByItemId의 prob에 반영 (drop-index와 일관성 유지)
  const planetItemDetailBy = {
    ...applyDropRateMultiplierToItemDetailBy(itemDetailBy, dropRateMultiplier),
    generatedAt: new Date().toISOString(),
    source: `${itemDetailBy.source ?? "mapleland"}+planet-divergence`,
  };

  const cubeIndex = await buildCubeIndex(CUBE_DATA_PATH);

  const [, dropIndexWritten, itemDetailByWritten, cubeIndexWritten] = await Promise.all([
    writeJson(OUTPUT_MONSTERS, planetMonsters),
    writeJsonIfChanged(OUTPUT_DROP_INDEX, planetDropIndex),
    writeJsonIfChanged(OUTPUT_ITEM_DETAIL_BY, planetItemDetailBy),
    ...(cubeIndex ? [writeJsonIfChanged(OUTPUT_CUBE_INDEX, cubeIndex)] : []),
  ]);

  console.log(`Wrote ${OUTPUT_MONSTERS} (${planetMonsters.length} monsters, +${newMonsters.length} new entries requested)`);
  if (dropIndexWritten) {
    console.log(`Wrote ${OUTPUT_DROP_INDEX} (${planetDropIndex.items.length} items, dropRate x${dropRateMultiplier})`);
  }
  if (itemDetailByWritten) {
    console.log(`Wrote ${OUTPUT_ITEM_DETAIL_BY}`);
  }
  if (cubeIndex && cubeIndexWritten) {
    console.log(`Wrote ${OUTPUT_CUBE_INDEX} (${cubeIndex.suspicious.length} suspicious, ${cubeIndex.miracle.length} miracle options)`);
  }

  // 4) release-filters.json: 최초 1회만 Mapleland 원본을 복사 (Planet 쪽 커스터마이징을 덮어쓰지 않기 위함)
  const releaseFiltersAlreadyExists = await pathExists(OUTPUT_RELEASE_FILTERS);
  if (releaseFiltersAlreadyExists && !FORCE_RELEASE_FILTERS) {
    console.log(`Skipped ${OUTPUT_RELEASE_FILTERS} (already exists — pass --force to overwrite)`);
  } else {
    const releaseFilters = await readJson(MAPLELAND_RELEASE_FILTERS);
    await writeJson(OUTPUT_RELEASE_FILTERS, {
      ...releaseFilters,
      _comment:
        "TODO: Mapleland의 release-filters.json을 초기값으로 복사한 것. Planet은 패치 속도가 다른 별도 서버이므로 " +
        "실제 미출시 콘텐츠 경계가 다를 수 있음 — 수동 검토 및 조정 필요.",
    });
    console.log(`Wrote ${OUTPUT_RELEASE_FILTERS} (copied from Mapleland release-filters.json)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
