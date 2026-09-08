/**
 * 에델슈타인 몬스터 25종의 드랍 아이템을 monster_detail 페이지에서 직접 수집해
 * drop-index.json/item-detail-by.json에 증분 병합한다(기존 데이터는 건드리지 않음).
 *
 * 사용: node scripts/fetch-edelstein-drops.mjs
 */
import fs from "fs/promises";
import path from "path";

const BASE = "https://xn--o80b01o9mlw3kdzc.com";
const DROP_PATH = path.resolve("data/drop-index.json");
const DETAIL_PATH = path.resolve("data/item-detail-by.json");
const MOB_CODES = [
  150000, 150001, 150002, 1150000, 1150001, 1150002, 2150000, 2150001, 2150002, 2150003,
  3150000, 3150001, 3150002, 6150000, 7150000, 7150001, 7150002, 7150003, 7150004,
  8105000, 8105001, 8105002, 8105003, 8105004, 8105005,
];
const DELAY = 200;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHtml(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "maplelandhub-data-sync/1.0" } });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === retries) throw error;
      await sleep(300 * (attempt + 1));
    }
  }
}

function parseDrops(html) {
  const box = html.match(/<h2>GET<\/h2>([\s\S]*?)<\/main>/i)?.[1] ?? "";
  const output = [];
  for (const block of box.matchAll(/<a[^>]*href=["'][^"']*item_detail\/(\d+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const id = Number(block[1]);
    const inner = block[2];
    const name = inner.match(/<h3>([\s\S]*?)<\/h3>/i)?.[1]?.replace(/&amp;/g, "&").trim();
    const rate = Number(inner.match(/drop-rate-box["']>\s*([\d.]+)\s*%?/i)?.[1]);
    if (id > 0 && name) output.push({ id, name, ...(Number.isFinite(rate) && rate > 0 ? { prob: rate / 100 } : {}) });
  }
  return output;
}

async function main() {
  const [dropIndex, detailBy] = await Promise.all([
    fs.readFile(DROP_PATH, "utf8").then(JSON.parse),
    fs.readFile(DETAIL_PATH, "utf8").then(JSON.parse),
  ]);
  const beforeDrop = JSON.stringify(dropIndex);
  const beforeDetail = JSON.stringify(detailBy);
  const existingItemIds = new Set((dropIndex.items ?? []).map((item) => item.id));

  let linkedMobs = 0;
  let linkedDrops = 0;
  for (const mobId of MOB_CODES) {
    await sleep(DELAY);
    const html = await fetchHtml(`${BASE}/monster_detail/${mobId}`);
    const drops = html ? parseDrops(html) : [];
    console.log(`${mobId}: ${drops.length} drops`);
    if (!drops.length) continue;
    linkedMobs += 1;

    for (const drop of drops) {
      linkedDrops += 1;
      if (!existingItemIds.has(drop.id)) {
        dropIndex.items = dropIndex.items ?? [];
        dropIndex.items.push({ id: drop.id, name: drop.name });
        existingItemIds.add(drop.id);
      }

      const detailBucket = detailBy.itemsByItemId[String(drop.id)] ?? [];
      if (!detailBucket.some((entry) => entry.mobId === mobId)) {
        detailBucket.push({ mobId, ...(drop.prob ? { prob: drop.prob } : {}) });
      }
      detailBy.itemsByItemId[String(drop.id)] = detailBucket;

      dropIndex.monstersByItemId = dropIndex.monstersByItemId ?? {};
      dropIndex.monstersByItemId[String(drop.id)] = detailBucket;

      const dropBucket = dropIndex.dropsByMonsterId[String(mobId)] ?? [];
      if (!dropBucket.some((entry) => entry.itemId === drop.id)) {
        dropBucket.push({ itemId: drop.id, ...(drop.prob ? { prob: drop.prob } : {}) });
      }
      dropIndex.dropsByMonsterId[String(mobId)] = dropBucket;
    }
  }

  dropIndex.items?.sort((a, b) => String(a.name).localeCompare(String(b.name), "ko"));
  const dropChanged = beforeDrop !== JSON.stringify(dropIndex);
  const detailChanged = beforeDetail !== JSON.stringify(detailBy);
  const now = new Date().toISOString();
  if (dropChanged) {
    dropIndex.generatedAt = now;
    await fs.writeFile(DROP_PATH, `${JSON.stringify(dropIndex, null, 2)}\n`);
  }
  if (detailChanged) {
    detailBy.generatedAt = now;
    await fs.writeFile(DETAIL_PATH, `${JSON.stringify(detailBy, null, 2)}\n`);
  }
  console.log(`Linked ${linkedMobs}/${MOB_CODES.length} monsters, ${linkedDrops} drop rows.`);
  console.log(dropChanged || detailChanged ? "Data updated." : "No changes (idempotent).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
