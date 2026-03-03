import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const NPC_SOURCE_PATH = path.resolve("src/data/mapledb/npcs.js");
const OUTPUT_PATH = path.resolve("data/npc-locations.json");
const BASE_URL = "https://mapledb.kr/search.php";
const CONCURRENCY = Number(process.env.NPC_MAP_CONCURRENCY ?? 6);
const LIMIT = Number(process.env.NPC_MAP_LIMIT ?? 0);
const CODE_FILTER = String(process.env.NPC_MAP_CODES ?? "")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);

function loadNpcRows() {
  const source = fs.readFileSync(NPC_SOURCE_PATH, "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const rows = Array.isArray(sandbox.NPCS) ? sandbox.NPCS : [];
  return rows
    .map((row) => ({
      code: Number(row.code),
      name_ko: String(row.name_ko ?? "").trim(),
      name_en: String(row.name_en ?? "").trim(),
    }))
    .filter((row) => Number.isFinite(row.code) && row.code > 0);
}

function decodeHtmlEntities(input) {
  return input
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseNpcName(html) {
  const match = html.match(/<span class="text-bold fs-5 m-0">\s*([^<]+?)\s*<\/span>/);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function parseNpcNameEn(html) {
  const match = html.match(/<span class="color-gray fs-2 m-0">\s*([^<]+?)\s*<\/span>/);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function parseNpcMaps(html) {
  const maps = [];
  const seen = new Set();
  const regex =
    /<a class="search-page-add-content-box"[^>]*href="(?:https:\/\/mapledb\.kr)?\/?search\.php\?q=(\d+)&t=map"[^>]*>[\s\S]*?(?:<h4[^>]*>\s*([^<]+?)\s*<\/h4>|<img[^>]*alt="([^"]+?)\s*이미지"[^>]*>)/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const mapCode = Number(match[1]);
    if (!Number.isFinite(mapCode)) continue;
    if (seen.has(mapCode)) continue;
    seen.add(mapCode);

    maps.push({
      map_code: mapCode,
      map_name: decodeHtmlEntities(String(match[2] ?? match[3] ?? "").trim()),
    });
  }

  return maps;
}

async function fetchNpcPage(code) {
  const url = `${BASE_URL}?q=${encodeURIComponent(String(code))}&t=npc`;
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

async function runWorker(queue, results, errors) {
  while (queue.length > 0) {
    const row = queue.shift();
    if (!row) return;

    try {
      const html = await fetchNpcPage(row.code);
      const npcName = parseNpcName(html) ?? row.name_ko;
      const npcNameEn = parseNpcNameEn(html) ?? row.name_en;
      const maps = parseNpcMaps(html);
      results.push({
        npc_code: row.code,
        npc_name: npcName,
        npc_name_en: npcNameEn,
        maps,
      });
    } catch (error) {
      errors.push({
        npc_code: row.code,
        npc_name: row.name_ko,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function main() {
  const allRows = loadNpcRows();
  const filteredRows = CODE_FILTER.length
    ? allRows.filter((row) => CODE_FILTER.includes(row.code))
    : allRows;
  const rows = LIMIT > 0 ? filteredRows.slice(0, LIMIT) : filteredRows;
  const queue = [...rows];
  const results = [];
  const errors = [];

  console.log(
    `NPC rows: ${rows.length}, concurrency: ${CONCURRENCY}${CODE_FILTER.length ? `, filteredCodes=${CODE_FILTER.length}` : ""}`,
  );

  const workers = Array.from({ length: Math.max(1, CONCURRENCY) }, () =>
    runWorker(queue, results, errors),
  );
  await Promise.all(workers);

  results.sort((a, b) => a.npc_code - b.npc_code);
  errors.sort((a, b) => a.npc_code - b.npc_code);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "mapledb.kr search.php?t=npc",
    count: results.length,
    withMaps: results.filter((row) => row.maps.length > 0).length,
    withoutMaps: results.filter((row) => row.maps.length === 0).length,
    errorCount: errors.length,
    rows: results,
    errors,
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `Done. wrote ${OUTPUT_PATH}\nwithMaps=${payload.withMaps} withoutMaps=${payload.withoutMaps} errors=${payload.errorCount}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
