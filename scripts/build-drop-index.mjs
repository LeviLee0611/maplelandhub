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
    dropTable = parsed?.mobs ?? parsed;
    itemTable = parsed?.items ?? null;
    dropTableSourceName = typeof parsed?.source === "string" ? parsed.source : null;
  } catch {
    dropTable = null;
    itemTable = null;
    dropTableSourceName = null;
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

  // item_detail 페이지(BY 섹션) 기반 드랍 정보를 우선 반영
  try {
    const rawBy = await fs.readFile(ITEM_DETAIL_BY_SOURCE, "utf8");
    const parsedBy = JSON.parse(rawBy);
    const byItems = parsedBy?.itemsByItemId ?? {};

    for (const [itemIdText, rows] of Object.entries(byItems)) {
      const itemId = Number(itemIdText);
      if (!Number.isFinite(itemId) || itemId <= 0) continue;
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
    if (!result) return null;
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
