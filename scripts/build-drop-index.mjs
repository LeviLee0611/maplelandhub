import fs from "fs/promises";
import path from "path";
import vm from "vm";

const REGION = "KMS";
const VERSION = "389";
const BASE = "https://maplestory.io/api";
const ITEM_REGION = "GMS";
const ITEM_VERSION = "200";
const KMS_ITEM_REGION = "KMS";
const KMS_ITEM_VERSION = "284";

const MONSTER_SOURCE = path.resolve("data/monsters.json");
const OUTPUT_PATH = path.resolve("data/drop-index.json");
const DROP_TABLE_SOURCE = path.resolve("data/drops-parsed.json");
const ITEM_DETAIL_BY_SOURCE = path.resolve("data/item-detail-by.json");
const MAPLEDB_EQUIP_DATA = path.resolve("src/data/mapledb/equips.js");

const CONCURRENCY = 4;
const ITEM_CONCURRENCY = 6;
const MAX_MOBS = process.env.DROP_MOB_LIMIT ? Number(process.env.DROP_MOB_LIMIT) : null;
const EXCLUDED_DROP_ITEM_IDS = new Set([
  2022157, // 카니발 포인트 1
  2022158, // 카니발 포인트 2
  2022159, // 카니발 포인트 3
  2022160, // 파티 마나엘릭서
  2022161, // 파티 엘릭서
  2022162, // 파티 파워엘릭서
  2022163, // 파티 만병통치약
  2022164, // 작은 어둠의 큐브
  2022165, // 어둠의 큐브
  2022166, // 기절의 구슬
  4001129, // 메이플 코인
  -1634778098, // 마법의 가루(파랑)
  -733023682, // 마법의 가루(빨강)
  -156272759, // 태엽벌레
]);
const EXCLUDED_DROP_ITEM_NAME_PATTERNS = [
  /카니발\s*포인트/i,
  /carnival\s*point/i,
  /파티\s*마나\s*엘릭서/i,
  /파티\s*마나엘릭서/i,
  /파티\s*엘릭서/i,
  /파티\s*파워\s*엘릭서/i,
  /파티\s*파워엘릭서/i,
  /파티\s*만병\s*통치약/i,
  /파티\s*만병통치약/i,
  /마법의\s*가루\s*\([^)]*\)/i,
  /^.+\s+카드$/i,
  /^악의\s*기운$/i,
  /^첫\s*번째\s*작은\s*조각$/i,
  /^메이플\s+(?!고서|코인).+/i,
  /작은\s*어둠의\s*큐브/i,
  /^어둠의\s*큐브$/i,
  /기절의\s*구슬/i,
  /^메이플\s*코인$/i,
  /^태엽벌레$/i,
  /^두손둔기\s*명중(?:률)?\s*주문서\s*\d+%$/i,
  /^방패\s*힘\s*주문서\s*\d+%$/i,
  /^하의\s*점프(?:력)?\s*주문서\s*\d+%$/i,
  /^하의\s*민첩(?:성)?\s*주문서\s*\d+%$/i,
];
const DROP_PROBABILITY_OVERRIDES = new Map([
  ["8141300:-1932128472", 0.008], // 스퀴드 - 신발 민첩성 주문서 60%
  ["8510000:1041123", 0.16079999999999997], // 피아누스(좌) - 블루 루이마리
  ["8510000:1060110", 0.16079999999999997], // 피아누스(좌) - 그린 카날 후드
  ["8510000:1051106", 0.16079999999999997], // 피아누스(좌) - 다크 아네스
  ["8510000:1061122", 0.16079999999999997], // 피아누스(좌) - 다크 아네스 바지
  ["8520000:1041123", 0.16079999999999997], // 피아누스(우) - 블루 루이마리
  ["8520000:1060110", 0.16079999999999997], // 피아누스(우) - 그린 카날 후드
  ["8520000:1051106", 0.16079999999999997], // 피아누스(우) - 다크 아네스
  ["8520000:1061122", 0.16079999999999997], // 피아누스(우) - 다크 아네스 바지
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isExcludedDropItem(itemId, itemName = "") {
  if (EXCLUDED_DROP_ITEM_IDS.has(Number(itemId))) return true;
  return EXCLUDED_DROP_ITEM_NAME_PATTERNS.some((pattern) => pattern.test(String(itemName ?? "")));
}

function getDropProbability(mobId, itemId, fallback) {
  const override = DROP_PROBABILITY_OVERRIDES.get(`${mobId}:${itemId}`);
  if (typeof override === "number") return override;
  return typeof fallback === "number" ? fallback : undefined;
}

function normalizeItemNameForLookup(text) {
  return String(text ?? "")
    .replace(/[’‘`]/g, "'")
    .replace(/민첩성/g, "민첩")
    .replace(/지력성/g, "지력")
    .replace(/명중률/g, "명중")
    .replace(/회피율/g, "회피")
    .replace(/[(){}\[\]'"~!@#$^&*_+=|\\/:;,.?-]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(200 * (attempt + 1));
    }
  }
  return null;
}

async function asyncPool(limit, items, iterator) {
  const ret = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => iterator(item));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

async function fetchRewardItemIds(mobId) {
  const rootUrl = `${BASE}/wz/${REGION}/${VERSION}/String/MonsterBook.img/${mobId}/reward`;
  let node;
  try {
    node = await fetchJson(rootUrl, 1);
  } catch {
    return [];
  }
  const children = node?.children ?? [];
  if (!Array.isArray(children) || children.length === 0) return [];
  const ids = [];
  for (const child of children) {
    const childUrl = `${rootUrl}/${child}`;
    try {
      const childNode = await fetchJson(childUrl, 1);
      if (typeof childNode?.value === "number") {
        ids.push(childNode.value);
      }
    } catch {
      // skip missing entries
    }
  }
  return ids;
}

async function getFallbackVersions(region, excludeVersion, limit = 5) {
  try {
    const list = await fetchJson(`${BASE}/wz`, 1);
    const versions = (list ?? [])
      .filter((entry) => entry.region === region && entry.isReady)
      .map((entry) => entry.mapleVersionId)
      .filter((value) => /^\d+$/.test(String(value)))
      .map((value) => String(value))
      .sort((a, b) => Number(b) - Number(a));
    const filtered = versions.filter((v) => v !== excludeVersion);
    return filtered.slice(0, limit);
  } catch {
    return [];
  }
}

async function fetchItemNameFromRegion(itemId, region, version, fallbackVersions = []) {
  const tryFetch = async (ver) => {
    const url = `${BASE}/${region}/${ver}/item/${itemId}`;
    try {
      const data = await fetchJson(url, 2);
      const name = data?.description?.name ?? data?.name ?? "";
      return name ? { id: itemId, name } : null;
    } catch {
      return null;
    }
  };

  const primary = await tryFetch(version);
  if (primary) return primary;

  for (const version of fallbackVersions) {
    const fallback = await tryFetch(version);
    if (fallback) return fallback;
  }
  return null;
}

async function loadMapleDbItemNames() {
  try {
    const code = await fs.readFile(MAPLEDB_EQUIP_DATA, "utf8");
    const sandbox = {};
    vm.runInNewContext(code, sandbox, { timeout: 10000 });
    const items = Array.isArray(sandbox.EQUIPS)
      ? sandbox.EQUIPS
      : Array.isArray(sandbox.ITEMS)
        ? sandbox.ITEMS
        : [];
    const map = new Map();
    for (const entry of items) {
      if (!entry || typeof entry.code !== "number") continue;
      const name = entry.name_ko || entry.name_en;
      if (name) {
        map.set(entry.code, name);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

async function main() {
  const mapledbNames = await loadMapleDbItemNames();
  const mapledbItemIdsByName = new Map();
  for (const [itemId, name] of mapledbNames.entries()) {
    const rawName = String(name ?? "").trim();
    if (!rawName) continue;
    if (!mapledbItemIdsByName.has(rawName)) mapledbItemIdsByName.set(rawName, itemId);
    const normalizedName = normalizeItemNameForLookup(rawName);
    if (normalizedName && !mapledbItemIdsByName.has(normalizedName)) {
      mapledbItemIdsByName.set(normalizedName, itemId);
    }
  }

  const raw = await fs.readFile(MONSTER_SOURCE, "utf8");
  const monsters = JSON.parse(raw);
  let mobIds = Array.from(
    new Set(monsters.map((monster) => monster?.mobCode).filter((id) => typeof id === "number"))
  );
  if (Number.isFinite(MAX_MOBS) && MAX_MOBS > 0) {
    mobIds = mobIds.slice(0, MAX_MOBS);
  }

  const dropsByMonsterId = {};
  const monstersByItemId = {};
  const itemIds = new Set();
  let itemDetailByApplied = false;

  let dropTable = null;
  let itemTable = null;
  let dropTableSourceName = null;
  try {
    const dropRaw = await fs.readFile(DROP_TABLE_SOURCE, "utf8");
    const parsed = JSON.parse(dropRaw);
    if (parsed?.source === "dropchance-html" && process.env.ALLOW_UNMERGED_DROP_TABLE !== "1") {
      throw new Error(
        "data/drops-parsed.json is unmerged dropchance-html data. Run npm run build:drops-merged before build:drop-index."
      );
    }
    dropTable = parsed?.mobs ?? parsed;
    itemTable = parsed?.items ?? null;
    dropTableSourceName = typeof parsed?.source === "string" ? parsed.source : null;
  } catch {
    dropTable = null;
    itemTable = null;
    dropTableSourceName = null;
  }

  if (dropTable) {
    const resolveDropItemId = (itemId) => {
      if (typeof itemId !== "number" || itemId > 0) return itemId;
      const name = itemTable?.[String(itemId)]?.name;
      const rawName = String(name ?? "").trim();
      if (!rawName) return itemId;
      return mapledbItemIdsByName.get(rawName) ?? mapledbItemIdsByName.get(normalizeItemNameForLookup(rawName)) ?? itemId;
    };

    for (const [mobId, entry] of Object.entries(dropTable)) {
      const rewards = entry?.rewards ?? [];
      if (!Array.isArray(rewards) || rewards.length === 0) continue;
      const mapped = rewards
        .filter((reward) => reward && typeof reward.itemID === "number")
        .filter((reward) => !isExcludedDropItem(reward.itemID, itemTable?.[String(reward.itemID)]?.name))
        .map((reward) => {
          const itemId = resolveDropItemId(reward.itemID);
          return {
            itemId,
            prob: getDropProbability(mobId, itemId, reward.prob),
            min: typeof reward.min === "number" ? reward.min : undefined,
            max: typeof reward.max === "number" ? reward.max : undefined,
          };
        });
      if (mapped.length === 0) continue;
      dropsByMonsterId[mobId] = mapped;
      for (const reward of mapped) {
        itemIds.add(reward.itemId);
        const bucket = monstersByItemId[reward.itemId] ?? [];
        bucket.push({ mobId: Number(mobId), prob: reward.prob, min: reward.min, max: reward.max });
        monstersByItemId[reward.itemId] = bucket;
      }
    }
  } else {
    let processed = 0;
    const rewardLists = await asyncPool(CONCURRENCY, mobIds, async (mobId) => {
      const ids = await fetchRewardItemIds(mobId);
      processed += 1;
      if (processed % 50 === 0 || processed === mobIds.length) {
        console.log(`Fetched rewards: ${processed}/${mobIds.length}`);
      }
      return { mobId, ids };
    });

    for (const { mobId, ids } of rewardLists) {
      if (!ids || ids.length === 0) continue;
      const uniqueIds = Array.from(new Set(ids));
      const filteredIds = uniqueIds.filter((itemId) => !isExcludedDropItem(itemId));
      if (filteredIds.length === 0) continue;
      dropsByMonsterId[mobId] = filteredIds.map((itemId) => ({ itemId }));
      for (const itemId of filteredIds) {
        itemIds.add(itemId);
        const bucket = monstersByItemId[itemId] ?? [];
        bucket.push({ mobId });
        monstersByItemId[itemId] = bucket;
      }
    }
  }

  // item_detail 페이지(BY 섹션) 기반 드랍 정보를 우선 반영
  try {
    const rawBy = await fs.readFile(ITEM_DETAIL_BY_SOURCE, "utf8");
    const parsedBy = JSON.parse(rawBy);
    const byItems = parsedBy?.itemsByItemId ?? {};

    for (const [itemIdText, rows] of Object.entries(byItems)) {
      const itemId = Number(itemIdText);
      if (!Number.isFinite(itemId) || itemId <= 0) continue;
      if (isExcludedDropItem(itemId)) continue;
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const normalizedRows = rows
        .map((row) => {
          const mobId = Number(row?.mobId ?? 0);
          if (!Number.isFinite(mobId) || mobId <= 0) return null;
          const probRaw = Number(row?.prob);
          const prob = Number.isFinite(probRaw) && probRaw > 0 ? probRaw : undefined;
          return { mobId, ...(typeof prob === "number" ? { prob } : {}) };
        })
        .filter(Boolean);

      if (normalizedRows.length === 0) continue;

      // item 기준: BY 데이터를 우선 사용(기존 값 덮어쓰기)
      monstersByItemId[itemId] = normalizedRows.map((row) => ({
        mobId: row.mobId,
        prob: row.prob,
      }));
      itemIds.add(itemId);
      itemDetailByApplied = true;

      // mob 기준: 해당 item의 기존 엔트리를 지우고 BY 데이터로 재기록
      for (const [mobId, rewards] of Object.entries(dropsByMonsterId)) {
        dropsByMonsterId[mobId] = (rewards ?? []).filter((reward) => reward?.itemId !== itemId);
      }
      for (const row of normalizedRows) {
        const mobId = String(row.mobId);
        const bucket = dropsByMonsterId[mobId] ?? [];
        bucket.push({
          itemId,
          prob: row.prob,
        });
        dropsByMonsterId[mobId] = bucket;
      }
    }
  } catch {
    // optional file
  }

  const itemIdList = Array.from(itemIds);
  let itemProcessed = 0;
  let fallbackVersionsPromise = null;
  let kmsFallbackVersionsPromise = null;
  const items = await asyncPool(ITEM_CONCURRENCY, itemIdList, async (itemId) => {
    const meta = itemTable?.[String(itemId)];
    const nameFromMapleDb = mapledbNames.get(itemId);
    const nameFromDropTable = typeof meta?.name === "string" ? meta.name.trim() : "";
    const result =
      nameFromMapleDb
        ? { id: itemId, name: nameFromMapleDb }
        : nameFromDropTable
          ? { id: itemId, name: nameFromDropTable }
          : (await fetchItemNameFromRegion(
              itemId,
              KMS_ITEM_REGION,
              KMS_ITEM_VERSION,
              await (kmsFallbackVersionsPromise ??= getFallbackVersions(KMS_ITEM_REGION, KMS_ITEM_VERSION))
            )) ??
            (await fetchItemNameFromRegion(
              itemId,
              ITEM_REGION,
              ITEM_VERSION,
              await (fallbackVersionsPromise ??= getFallbackVersions(ITEM_REGION, ITEM_VERSION))
            ));
    itemProcessed += 1;
    if (itemProcessed % 100 === 0 || itemProcessed === itemIdList.length) {
      console.log(`Fetched items: ${itemProcessed}/${itemIdList.length}`);
    }
    if (!result || isExcludedDropItem(itemId, result.name)) return null;
    return {
      ...result,
      typeInfo: meta?.typeInfo ?? (itemId >= 1_000_000 && itemId < 2_000_000 ? { overallCategory: "Equip" } : undefined),
      equipGroup: meta?.equipGroup,
      meta: meta?.meta,
    };
  });
  const filteredItems = items.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const validItemIds = new Set(filteredItems.map((item) => item.id));

  for (const [mobId, rewards] of Object.entries(dropsByMonsterId)) {
    const filteredRewards = rewards.filter((reward) => validItemIds.has(reward.itemId));
    if (filteredRewards.length === 0) {
      delete dropsByMonsterId[mobId];
    } else {
      dropsByMonsterId[mobId] = filteredRewards;
    }
  }

  for (const [itemId, mobs] of Object.entries(monstersByItemId)) {
    if (!validItemIds.has(Number(itemId))) {
      delete monstersByItemId[itemId];
      continue;
    }
    if (!Array.isArray(mobs) || mobs.length === 0) {
      delete monstersByItemId[itemId];
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: itemDetailByApplied
      ? `${dropTableSourceName ?? (dropTable ? "drops-parsed" : "monsterbook-reward")}+item-detail-by`
      : (dropTableSourceName ?? (dropTable ? "drops-parsed" : "monsterbook-reward")),
    items: filteredItems,
    dropsByMonsterId,
    monstersByItemId,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${OUTPUT_PATH} with ${filteredItems.length} items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
