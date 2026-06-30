/**
 * 메이플노트 itemnote에서 고레벨(70+) 장비/주문서 아이템 ID를 수집하고,
 * 기존 drop-index.json에 없는 신규 아이템의 드롭 데이터를 item-detail-by.json에 추가합니다.
 *
 * 용도: 시그너스 기사단 업데이트 후 신규 장비/스크롤 추가
 * 실행: node scripts/fetch-new-items-drop-data.mjs
 */

import fs from "fs/promises";
import path from "path";

const BASE_SITE = "https://xn--o80b01o9mlw3kdzc.com";
const DROP_INDEX_SOURCE = path.resolve("data/drop-index.json");
const ITEM_DETAIL_BY_PATH = path.resolve("data/item-detail-by.json");
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 4);
const REQUEST_DELAY_MS = Number(process.env.DELAY_MS ?? 150);
const MIN_LEVEL = Number(process.env.MIN_LEVEL ?? 70);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "maplelandhub-data-sync/1.0" },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(300 * (attempt + 1));
    }
  }
  return null;
}

async function asyncPool(limit, items, fn) {
  const ret = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) await Promise.race(executing);
  }
  return Promise.all(ret);
}

function parseItemRows(html) {
  const items = [];
  // Match table rows: optional leading level cell, then item_detail link
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const idRe = /\/item_detail\/(\d+)/;
  const levelRe = /^\s*<td[^>]*>\s*(\d+)\s*<\/td>/;
  let match;
  while ((match = rowRe.exec(html)) !== null) {
    const rowHtml = match[1];
    const idMatch = idRe.exec(rowHtml);
    if (!idMatch) continue;
    const id = Number(idMatch[1]);
    if (!id) continue;
    const levelMatch = levelRe.exec(rowHtml);
    const level = levelMatch ? Number(levelMatch[1]) : 0;
    items.push({ id, level });
  }
  return items;
}

function parseByRows(html) {
  const rows = [];
  const re = /href="[^"]*monster_detail\/(\d+)"[\s\S]*?<div class="drop-rate-box"[^>]*>\s*([\d.]+)%?\s*<\/div>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    const mobId = Number(match[1]);
    const prob = Number(match[2]) / 100;
    if (mobId > 0 && prob > 0) rows.push({ mobId, prob });
  }
  const deduped = new Map();
  for (const row of rows) {
    const prev = deduped.get(row.mobId);
    if (!prev || row.prob > (prev.prob ?? 0)) deduped.set(row.mobId, row);
  }
  return Array.from(deduped.values()).sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0));
}

const CATEGORIES = [
  { cat: "전사", subcats: ["1-Hat", "1-Glove", "1-Shoes", "1-Overall", "1-Top", "1-Bottom", "1-Shield", "1-Earrings"] },
  { cat: "마법사", subcats: ["2-Hat", "2-Glove", "2-Shoes", "2-Overall", "2-Top", "2-Bottom", "2-Earrings"] },
  { cat: "궁수", subcats: ["4-Hat", "4-Glove", "4-Shoes", "4-Overall", "4-Top", "4-Bottom", "4-Earrings"] },
  { cat: "도적", subcats: ["8-Hat", "8-Glove", "8-Shoes", "8-Overall", "8-Top", "8-Bottom", "8-Earrings"] },
  { cat: "해적", subcats: ["16-Hat", "16-Glove", "16-Shoes", "16-Overall", "16-Top", "16-Bottom"] },
  {
    cat: "무기",
    subcats: [
      "One-Handed Sword", "Two-Handed Sword", "One-Handed Axe", "Two-Handed Axe",
      "One-Handed Blunt Weapon", "Two-Handed Blunt", "Spear", "Polearm",
      "Bow", "Crossbow", "Wand", "Staff", "Dagger", "Claw", "Knuckle", "Gun",
    ],
  },
  { cat: "소비", subcats: ["Weapon Scroll", "Armor Scroll", "Mastery Book"] },
  { cat: "공용", subcats: ["0-Cape", "0-Pendant", "0-Earrings", "0-Shield"] },
];

async function fetchCategoryItemIds(cat, subcat) {
  const url = `${BASE_SITE}/itemnote?category=${encodeURIComponent(cat)}&subCategory=${encodeURIComponent(subcat)}`;
  const html = await fetchHtml(url);
  if (!html) return [];
  const items = parseItemRows(html);
  if (cat === "소비") return items.map((i) => i.id);
  return items.filter((i) => i.level >= MIN_LEVEL).map((i) => i.id);
}

async function main() {
  // 1. Load existing item IDs
  const dropIndexRaw = await fs.readFile(DROP_INDEX_SOURCE, "utf8").catch(() => "{}");
  const dropIndex = JSON.parse(dropIndexRaw);
  const existingIds = new Set((dropIndex.items ?? []).map((i) => i.id));

  const detailByRaw = await fs.readFile(ITEM_DETAIL_BY_PATH, "utf8").catch(() => "{}");
  const detailBy = JSON.parse(detailByRaw);
  const itemsByItemId = { ...(detailBy.itemsByItemId ?? {}) };
  const alreadyFetched = new Set(Object.keys(itemsByItemId).map(Number));

  // 2. Collect all high-level item IDs from itemnote
  console.log("Collecting item IDs from itemnote...");
  const collectedIds = new Set();
  for (const { cat, subcats } of CATEGORIES) {
    for (const subcat of subcats) {
      await sleep(100);
      const ids = await fetchCategoryItemIds(cat, subcat);
      for (const id of ids) collectedIds.add(id);
      console.log(`  ${cat}/${subcat}: ${ids.length} items`);
    }
  }
  console.log(`Total collected: ${collectedIds.size} items`);

  // 3. Filter to new items (not in drop-index AND not already fetched)
  const newIds = Array.from(collectedIds).filter(
    (id) => !existingIds.has(id) && !alreadyFetched.has(id)
  );
  console.log(`New items to fetch: ${newIds.length}`);

  // 4. Fetch item_detail pages for new items
  let processed = 0;
  let found = 0;

  await asyncPool(CONCURRENCY, newIds, async (itemId) => {
    await sleep(REQUEST_DELAY_MS);
    try {
      const html = await fetchHtml(`${BASE_SITE}/item_detail/${itemId}`);
      if (!html) { processed++; return; }
      const rows = parseByRows(html);
      if (rows.length > 0) {
        itemsByItemId[String(itemId)] = rows;
        found++;
      }
    } catch (err) {
      console.warn(`  Skipped ${itemId}: ${err?.message}`);
    } finally {
      processed++;
      if (processed % 50 === 0 || processed === newIds.length) {
        console.log(`  Fetched: ${processed}/${newIds.length}, with drops: ${found}`);
      }
    }
  });

  // 5. Save updated item-detail-by.json
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "maple-note-item-detail",
    sourceUrl: `${BASE_SITE}/item_detail`,
    itemsByItemId,
  };
  await fs.writeFile(ITEM_DETAIL_BY_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(`\nSaved item-detail-by.json with ${Object.keys(itemsByItemId).length} total items (+${found} new with drops).`);
  console.log("Next: npm run build:drop-index");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
