import fs from "fs/promises";
import path from "path";

const INPUT_DIR = path.resolve("data/item-detail-html");
const OUTPUT_PATH = path.resolve("data/item-detail-by.json");

function parseProb(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return undefined;
  const n = Number(text.replace(/[%\s,]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  // BY 박스가 40, 0.01 형태(%)로 내려와서 확률(0~1)로 정규화
  return n > 1 ? n / 100 : n / 100;
}

function parseItemId(html) {
  const m = html.match(/\/item\/(\d+)\/icon/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function parseByRows(html) {
  const rows = [];
  const re = /href="[^"]*monster_detail\/(\d+)"[\s\S]*?<div class="drop-rate-box">\s*([\d.]+)%?\s*<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const mobId = Number(m[1]);
    if (!Number.isFinite(mobId) || mobId <= 0) continue;
    const prob = parseProb(m[2]);
    rows.push({ mobId, ...(typeof prob === "number" ? { prob } : {}) });
  }

  const dedup = new Map();
  for (const row of rows) {
    const prev = dedup.get(row.mobId);
    if (!prev) {
      dedup.set(row.mobId, row);
      continue;
    }
    if ((row.prob ?? 0) > (prev.prob ?? 0)) {
      dedup.set(row.mobId, row);
    }
  }
  return Array.from(dedup.values()).sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0));
}

async function main() {
  let names = [];
  try {
    names = await fs.readdir(INPUT_DIR);
  } catch (err) {
    if (err?.code === "ENOENT") {
      console.log(`Input directory not found: ${INPUT_DIR}`);
      console.log("Create it and put item_detail HTML files, then rerun.");
      return;
    }
    throw err;
  }

  const htmlFiles = names.filter((name) => name.toLowerCase().endsWith(".html"));
  const itemsByItemId = {};

  for (const file of htmlFiles) {
    const filePath = path.join(INPUT_DIR, file);
    const html = await fs.readFile(filePath, "utf8");
    const itemId = parseItemId(html);
    if (!itemId) continue;
    const rows = parseByRows(html);
    if (!rows.length) continue;
    itemsByItemId[String(itemId)] = rows;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "item-detail-by-html",
    itemsByItemId,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${OUTPUT_PATH} with ${Object.keys(itemsByItemId).length} items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
