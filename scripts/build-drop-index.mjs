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
const MAPLEDB_ITEM_DATA = path.resolve("src/data/mapledb/item_data.js");

const CONCURRENCY = 4;
const ITEM_CONCURRENCY = 6;
const MAX_MOBS = process.env.DROP_MOB_LIMIT ? Number(process.env.DROP_MOB_LIMIT) : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const code = await fs.readFile(MAPLEDB_ITEM_DATA, "utf8");
    const sandbox = {};
    vm.runInNewContext(code, sandbox, { timeout: 10000 });
    const items = Array.isArray(sandbox.ITEMS) ? sandbox.ITEMS : [];
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

  let dropTable = null;
  let itemTable = null;
  try {
    const dropRaw = await fs.readFile(DROP_TABLE_SOURCE, "utf8");
    const parsed = JSON.parse(dropRaw);
    dropTable = parsed?.mobs ?? parsed;
    itemTable = parsed?.items ?? null;
  } catch {
    dropTable = null;
    itemTable = null;
  }

  if (dropTable) {
    for (const [mobId, entry] of Object.entries(dropTable)) {
      const rewards = entry?.rewards ?? [];
      if (!Array.isArray(rewards) || rewards.length === 0) continue;
      const mapped = rewards
        .filter((reward) => reward && typeof reward.itemID === "number")
        .map((reward) => ({
          itemId: reward.itemID,
          prob: typeof reward.prob === "number" ? reward.prob : undefined,
          min: typeof reward.min === "number" ? reward.min : undefined,
          max: typeof reward.max === "number" ? reward.max : undefined,
        }));
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
      dropsByMonsterId[mobId] = uniqueIds.map((itemId) => ({ itemId }));
      for (const itemId of uniqueIds) {
        itemIds.add(itemId);
        const bucket = monstersByItemId[itemId] ?? [];
        bucket.push({ mobId });
        monstersByItemId[itemId] = bucket;
      }
    }
  }

  const itemIdList = Array.from(itemIds);
  let itemProcessed = 0;
  const fallbackVersions = await getFallbackVersions(ITEM_REGION, ITEM_VERSION);
  const kmsFallbackVersions = await getFallbackVersions(KMS_ITEM_REGION, KMS_ITEM_VERSION);
  const items = await asyncPool(ITEM_CONCURRENCY, itemIdList, async (itemId) => {
    const nameFromMapleDb = mapledbNames.get(itemId);
    const result =
      nameFromMapleDb
        ? { id: itemId, name: nameFromMapleDb }
        : (await fetchItemNameFromRegion(itemId, KMS_ITEM_REGION, KMS_ITEM_VERSION, kmsFallbackVersions)) ??
          (await fetchItemNameFromRegion(itemId, ITEM_REGION, ITEM_VERSION, fallbackVersions));
    itemProcessed += 1;
    if (itemProcessed % 100 === 0 || itemProcessed === itemIdList.length) {
      console.log(`Fetched items: ${itemProcessed}/${itemIdList.length}`);
    }
    if (!result) return null;
    const meta = itemTable?.[String(itemId)];
    return {
      ...result,
      typeInfo: meta?.typeInfo,
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
    source: dropTable ? "drops-parsed" : "monsterbook-reward",
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
