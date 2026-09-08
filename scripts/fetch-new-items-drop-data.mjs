/** itemnote 전체 카테고리에서 신규 아이템/현재 몬스터 드롭을 안전하게 증분 병합한다. */
import fs from "fs/promises";
import path from "path";

const BASE = "https://xn--o80b01o9mlw3kdzc.com";
const DROP_PATH = path.resolve("data/drop-index.json");
const DETAIL_PATH = path.resolve("data/item-detail-by.json");
const MONSTER_PATH = path.resolve("data/monsters.json");
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 4));
const DELAY = Math.max(0, Number(process.env.DELAY_MS ?? 150));
const EQUIP = ["Hat", "Glove", "Shoes", "Overall", "Top", "Bottom", "Shield", "Earrings", "Cape", "Pendant"];
const CATEGORIES = [
  ["무기", ["One-Handed Sword", "Two-Handed Sword", "One-Handed Axe", "Two-Handed Axe", "One-Handed Blunt Weapon", "Two-Handed Blunt", "Spear", "Polearm", "Bow", "Crossbow", "Wand", "Staff", "Dagger", "Claw", "Knuckle", "Gun"]],
  ["공용", [...EQUIP.map((v) => `0-${v}`), "0-Belt"]],
  ["전사", EQUIP.slice(0, 8).map((v) => `1-${v}`)],
  ["마법사", EQUIP.slice(0, 8).map((v) => `2-${v}`)],
  ["궁수", EQUIP.slice(0, 7).map((v) => `4-${v}`)],
  ["도적", EQUIP.slice(0, 8).map((v) => `8-${v}`)],
  ["해적", EQUIP.slice(0, 5).map((v) => `16-${v}`)],
  ["소비", ["Weapon Scroll", "Armor Scroll", "Thrown", "Arrow", "Bullet", "Mastery Book", "Potion", "HPPotion", "MPPotion"]],
];
const categoryCount = CATEGORIES.reduce((sum, [, values]) => sum + values.length, 0);
if (categoryCount !== 72) throw new Error(`itemnote category contract changed: expected 72, got ${categoryCount}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHtml(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "maplelandhub-data-sync/1.0" } });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    } catch (error) {
      if (attempt === retries) throw error;
      await sleep(300 * (attempt + 1));
    }
  }
}

async function pool(values, callback) {
  const results = [], active = new Set();
  for (const value of values) {
    const promise = Promise.resolve().then(() => callback(value));
    results.push(promise); active.add(promise);
    promise.then(() => active.delete(promise), () => active.delete(promise));
    if (active.size >= CONCURRENCY) await Promise.race(active);
  }
  return Promise.all(results);
}

function text(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, " ").trim();
}

function parseItems(html) {
  const output = [];
  for (const match of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const id = Number(match[1].match(/\/item_detail\/(\d+)/i)?.[1]);
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => text(cell[1]));
    const name = cells.at(-1) ?? "";
    if (id > 0 && name) output.push({ id, name });
  }
  return output;
}

function parseDrops(html, validMobs) {
  const output = new Map();
  const links = [...html.matchAll(/<a[^>]*href=["'][^"']*monster_detail\/(\d+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  for (const match of links) {
    const mobId = Number(match[1]);
    const body = match[2];
    if (!validMobs.has(mobId)) continue;
    const raw = Number(body.match(/class=["'][^"']*drop-rate-box[^"']*["'][^>]*>\s*([\d.]+)\s*%?/i)?.[1]);
    const row = { mobId, ...(Number.isFinite(raw) && raw > 0 ? { prob: raw / 100 } : {}) };
    if (!output.has(mobId) || (row.prob ?? 0) > (output.get(mobId).prob ?? 0)) output.set(mobId, row);
  }
  for (const match of links) {
    const mobId = Number(match[1]);
    if (validMobs.has(mobId) && !output.has(mobId)) output.set(mobId, { mobId });
  }
  return [...output.values()].sort((a, b) => a.mobId - b.mobId);
}

function itemMeta({ id, name }) {
  const overallCategory = id >= 1e6 && id < 2e6 ? "Equip" : id >= 2e6 && id < 3e6 ? "Use" : undefined;
  return { id, name, ...(overallCategory ? { typeInfo: { overallCategory } } : {}) };
}

async function main() {
  const [dropIndex, detailBy, monsters] = await Promise.all([
    fs.readFile(DROP_PATH, "utf8").then(JSON.parse), fs.readFile(DETAIL_PATH, "utf8").then(JSON.parse),
    fs.readFile(MONSTER_PATH, "utf8").then(JSON.parse),
  ]);
  const beforeDrop = JSON.stringify(dropIndex), beforeDetail = JSON.stringify(detailBy);
  const existing = new Set((dropIndex.items ?? []).map((item) => item.id));
  const validMobs = new Set(monsters.map((mob) => mob?.mobCode).filter((id) => Number.isInteger(id) && id > 0));
  const collected = new Map();
  console.log(`Collecting ${categoryCount} itemnote categories...`);
  const categoryPairs = CATEGORIES.flatMap(([category, subcategories]) =>
    subcategories.map((subcategory) => ({ category, subcategory })),
  );
  const categoryResults = await pool(categoryPairs, async ({ category, subcategory }) => {
      const url = `${BASE}/itemnote?category=${encodeURIComponent(category)}&subCategory=${encodeURIComponent(subcategory)}`;
      const rows = parseItems(await fetchHtml(url));
      console.log(`  ${category}/${subcategory}: ${rows.length}`);
      return rows;
  });
  for (const rows of categoryResults) {
    rows.forEach((row) => collected.set(row.id, row));
  }
  const missing = [...collected.values()].filter(({ id }) => id > 0 && !existing.has(id)).sort((a, b) => a.id - b.id);
  console.log(`Unique positive IDs: ${collected.size}; missing: ${missing.length}`);
  let done = 0;
  const fetched = await pool(missing, async (item) => {
    await sleep(DELAY);
    const html = await fetchHtml(`${BASE}/item_detail/${item.id}`);
    done += 1;
    if (done % 25 === 0 || done === missing.length) console.log(`  Details: ${done}/${missing.length}`);
    return { item, drops: html ? parseDrops(html, validMobs) : [] };
  });
  dropIndex.items ??= []; dropIndex.dropsByMonsterId ??= {}; dropIndex.monstersByItemId ??= {};
  detailBy.itemsByItemId ??= {};
  let linkedItems = 0, linkedDrops = 0;
  for (const { item, drops } of fetched) {
    dropIndex.items.push(itemMeta(item));
    if (!drops.length) continue;
    linkedItems += 1; linkedDrops += drops.length;
    detailBy.itemsByItemId[String(item.id)] = drops;
    dropIndex.monstersByItemId[String(item.id)] = drops;
    for (const row of drops) {
      const bucket = dropIndex.dropsByMonsterId[String(row.mobId)] ?? [];
      if (!bucket.some((entry) => entry.itemId === item.id)) bucket.push({ itemId: item.id, ...(row.prob ? { prob: row.prob } : {}) });
      dropIndex.dropsByMonsterId[String(row.mobId)] = bucket;
    }
  }
  dropIndex.items.sort((a, b) => String(a.name).localeCompare(String(b.name), "ko"));
  const dropChanged = beforeDrop !== JSON.stringify(dropIndex), detailChanged = beforeDetail !== JSON.stringify(detailBy);
  const now = new Date().toISOString();
  if (dropChanged) { dropIndex.generatedAt = now; await fs.writeFile(DROP_PATH, `${JSON.stringify(dropIndex, null, 2)}\n`); }
  if (detailChanged) { detailBy.generatedAt = now; await fs.writeFile(DETAIL_PATH, `${JSON.stringify(detailBy, null, 2)}\n`); }
  console.log(`Added ${missing.length}; ${linkedItems} items / ${linkedDrops} current-monster links.`);
  console.log(dropChanged || detailChanged ? "Data updated." : "No changes (idempotent)." );
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
