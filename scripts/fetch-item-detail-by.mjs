import fs from "fs/promises";
import path from "path";

const DROP_INDEX_SOURCE = path.resolve("data/drop-index.json");
const DROPS_PARSED_SOURCE = path.resolve("data/drops-parsed.json");
const OUTPUT_PATH = path.resolve("data/item-detail-by.json");
const BASE_URL = "https://xn--o80b01o9mlw3kdzc.com/item_detail";
const CONCURRENCY = Number(process.env.ITEM_DETAIL_CONCURRENCY ?? 3);
const LIMIT = process.env.ITEM_DETAIL_LIMIT ? Number(process.env.ITEM_DETAIL_LIMIT) : null;
const REQUEST_DELAY_MS = Number(process.env.ITEM_DETAIL_DELAY_MS ?? 120);
const ITEM_DETAIL_IDS = String(process.env.ITEM_DETAIL_IDS ?? "")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseProb(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return undefined;
  const n = Number(text.replace(/[%\s,]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n / 100;
}

function parseByRows(html) {
  const rows = [];
  const re = /href="[^"]*monster_detail\/(\d+)"[\s\S]*?<div class="drop-rate-box">\s*([\d.]+)%?\s*<\/div>/g;
  let match;

  while ((match = re.exec(html)) !== null) {
    const mobId = Number(match[1]);
    if (!Number.isFinite(mobId) || mobId <= 0) continue;
    const prob = parseProb(match[2]);
    rows.push({ mobId, ...(typeof prob === "number" ? { prob } : {}) });
  }

  const deduped = new Map();
  for (const row of rows) {
    const previous = deduped.get(row.mobId);
    if (!previous || (row.prob ?? 0) > (previous.prob ?? 0)) {
      deduped.set(row.mobId, row);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0));
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function loadItemIds() {
  if (ITEM_DETAIL_IDS.length > 0) return ITEM_DETAIL_IDS;

  const ids = new Set();
  const dropIndex = await readJson(DROP_INDEX_SOURCE, null);
  for (const item of dropIndex?.items ?? []) {
    if (typeof item?.id === "number" && item.id > 0) ids.add(item.id);
  }

  const dropsParsed = await readJson(DROPS_PARSED_SOURCE, null);
  for (const itemId of Object.keys(dropsParsed?.items ?? {})) {
    const id = Number(itemId);
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }

  const sorted = Array.from(ids).sort((a, b) => a - b);
  return Number.isFinite(LIMIT) && LIMIT > 0 ? sorted.slice(0, LIMIT) : sorted;
}

async function fetchItemRows(itemId) {
  const url = `${BASE_URL}/${itemId}`;
  const res = await fetch(url, {
    headers: {
      "user-agent": "maplelandhub-data-sync/1.0",
    },
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  const html = await res.text();
  return parseByRows(html);
}

async function asyncPool(limit, items, iterator) {
  const ret = [];
  const executing = new Set();
  for (const item of items) {
    const promise = Promise.resolve().then(() => iterator(item));
    ret.push(promise);
    executing.add(promise);
    const clean = () => executing.delete(promise);
    promise.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

async function main() {
  const itemIds = await loadItemIds();
  const previous = await readJson(OUTPUT_PATH, {});
  const itemsByItemId = { ...(previous?.itemsByItemId ?? {}) };
  let processed = 0;
  let found = 0;

  await asyncPool(Math.max(1, CONCURRENCY), itemIds, async (itemId) => {
    await sleep(REQUEST_DELAY_MS);
    try {
      const rows = await fetchItemRows(itemId);
      if (rows.length > 0) {
        itemsByItemId[String(itemId)] = rows;
        found += 1;
      }
    } catch (err) {
      console.warn(`Skipped ${itemId}: ${err?.message ?? err}`);
    } finally {
      processed += 1;
      if (processed % 50 === 0 || processed === itemIds.length) {
        console.log(`Fetched item details: ${processed}/${itemIds.length}, found ${found}`);
      }
    }
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "maple-note-item-detail",
    sourceUrl: BASE_URL,
    itemsByItemId,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${OUTPUT_PATH} with ${Object.keys(itemsByItemId).length} items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
