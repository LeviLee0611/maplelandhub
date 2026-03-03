import fs from "node:fs";
import path from "node:path";

const INPUT_DIR = path.resolve(process.argv[2] ?? "data/raw/monster-detail-html");
const OUTPUT_PATH = path.resolve(process.argv[3] ?? "data/monster-spawns.json");

function walkHtmlFiles(rootDir) {
  const out = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.html?$/i.test(entry.name)) continue;
      out.push(full);
    }
  }

  return out.sort((a, b) => a.localeCompare(b, "en"));
}

function decodeHtmlEntities(text) {
  return String(text ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function stripTags(text) {
  return decodeHtmlEntities(String(text ?? "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractMobId(html, filePath) {
  const fromAnimated = html.match(/\/mob\/animated\/(\d+)\//i)?.[1];
  if (fromAnimated) return Number(fromAnimated);

  const fromTitle = html.match(/monster_detail\/(\d+)/i)?.[1];
  if (fromTitle) return Number(fromTitle);

  const fromFileName = path.basename(filePath).match(/(\d+)/)?.[1];
  if (fromFileName) return Number(fromFileName);

  return null;
}

function extractMobName(html) {
  const title = html.match(/<h2[^>]*>\s*([^<]+?)\s*<\/h2>/i)?.[1];
  if (title) return stripTags(title);
  return "";
}

function extractSpawnMaps(html) {
  const spawnBox = html.match(/<div[^>]*class="[^"]*spawn-box[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";
  if (!spawnBox) return [];

  const result = [];
  const seen = new Set();
  const linkRegex = /<a[^>]*href="[^"]*map_detail\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;

  let m;
  while ((m = linkRegex.exec(spawnBox)) !== null) {
    const mapId = String(m[1] ?? "").trim();
    if (!mapId) continue;

    const mapName = stripTags(m[2] ?? "");
    if (!mapName) continue;

    const key = `${mapId}::${mapName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      mapId,
      mapName,
    });
  }

  return result;
}

function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`Input directory not found: ${INPUT_DIR}`);
    process.exit(1);
  }

  const files = walkHtmlFiles(INPUT_DIR);
  if (files.length === 0) {
    console.error(`No .html files found in: ${INPUT_DIR}`);
    process.exit(1);
  }

  const mobMap = new Map();

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const mobId = extractMobId(html, file);
    if (!mobId || !Number.isFinite(mobId)) continue;

    const mobName = extractMobName(html);
    const maps = extractSpawnMaps(html);
    if (maps.length === 0) continue;

    const existing = mobMap.get(mobId) ?? {
      mobId,
      mobName: mobName || "",
      maps: [],
      sources: [],
    };

    if (!existing.mobName && mobName) {
      existing.mobName = mobName;
    }

    const localSeen = new Set(existing.maps.map((v) => `${v.mapId}::${v.mapName}`));
    for (const map of maps) {
      const key = `${map.mapId}::${map.mapName}`;
      if (localSeen.has(key)) continue;
      localSeen.add(key);
      existing.maps.push(map);
    }

    existing.sources.push(path.relative(process.cwd(), file));
    existing.maps.sort((a, b) => Number(a.mapId) - Number(b.mapId));
    existing.sources = Array.from(new Set(existing.sources)).sort((a, b) => a.localeCompare(b, "en"));
    mobMap.set(mobId, existing);
  }

  const rows = Array.from(mobMap.values()).sort((a, b) => a.mobId - b.mobId);
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "monster_detail html spawn-box anchors",
    inputDir: path.relative(process.cwd(), INPUT_DIR),
    fileCount: files.length,
    mobCount: rows.length,
    rows,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Parsed files: ${files.length}`);
  console.log(`Mob rows: ${rows.length}`);
  console.log(`Wrote: ${OUTPUT_PATH}`);
}

main();
