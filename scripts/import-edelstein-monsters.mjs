/**
 * Import the Battle Mage/Edelstein monster list supplied as a Maple Note HTML
 * snapshot and link each monster to its spawn maps.
 *
 * Usage:
 *   node scripts/import-edelstein-monsters.mjs [monsternote-html] [detail-html-dir]
 *
 * The optional detail directory is a folder of `<mobCode>.html` monster detail
 * snapshots. When it is omitted, stats already present in monsters.json are
 * retained, which keeps subsequent runs idempotent and offline-friendly.
 */

import fs from "node:fs";
import path from "node:path";

const NOTE_PATH = path.resolve(process.argv[2] ?? "monsternote");
const DETAIL_DIR = process.argv[3] ? path.resolve(process.argv[3]) : null;
const MONSTERS_PATH = path.resolve("data/monsters.json");
const SPAWNS_PATH = path.resolve("data/monster-spawns.json");

const REGION = "에델슈타인";

// Maple Note mapnote?mapClass=에델슈타인 snapshot, 2026-09-08.
const SPAWNS_BY_MOB = {
  150000: [[310020000, "에델슈타인 공원1"]],
  150001: [[310020100, "에델슈타인 공원2"]],
  150002: [[310020200, "에델슈타인 공원3"]],
  1150000: [[310030000, "에델슈타인 산책로1"]],
  1150001: [[310030100, "에델슈타인 산책로2"]],
  1150002: [[310030110, "뱀 나오는 길"]],
  2150000: [[310030200, "에델슈타인 산책로3"]],
  2150001: [[310030300, "에델슈타인 산책로4"]],
  2150002: [[310030310, "가로등길"]],
  2150003: [[310040000, "광산 가는 길1"]],
  3150000: [[310040100, "광산 가는 길2"]],
  3150001: [[310040300, "바위길"]],
  3150002: [[310040400, "광석길"]],
  6150000: [[310050200, "갱도 입구1"], [310050300, "갱도 입구2"]],
  7150000: [[310050500, "갱도1"]],
  7150001: [[310050600, "갱도2"]],
  7150002: [[310050700, "갱도3"]],
  7150003: [[310050510, "너구리 소굴"]],
  7150004: [[310050800, "갱도4"]],
  8105000: [[310050520, "위험한 너구리 소굴"]],
  8105001: [[310060200, "방어 시스템 연구소1"], [310060210, "방어 시스템 연구소2"]],
  8105002: [[310060210, "방어 시스템 연구소2"], [310060220, "방어 시스템 연구소3"]],
  8105003: [[310060100, "안드로이드 연구소1"], [310060110, "안드로이드 연구소2"]],
  8105004: [[310060110, "안드로이드 연구소2"], [310060120, "안드로이드 연구소3"]],
  8105005: [[310060300, "깊은 갱도"]],
};

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCompactNumber(value) {
  const text = stripTags(value).replaceAll(",", "");
  const match = text.match(/^([\d.]+)\s*(만|억)?$/);
  if (!match) return 0;
  const multiplier = match[2] === "억" ? 100_000_000 : match[2] === "만" ? 10_000 : 1;
  return Math.round(Number(match[1]) * multiplier);
}

function parseElementNames(html) {
  const names = [...html.matchAll(/class="ele-name">\s*([^<]+?)\s*<\/div>/gi)]
    .map((match) => stripTags(match[1]));
  return names.length ? [...new Set(names)] : ["무속성"];
}

function parseNote(html) {
  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/i)?.[1];
  if (!tbody) throw new Error(`Monster table not found in ${NOTE_PATH}`);

  return [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].map((rowMatch) => {
    const row = rowMatch[1];
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    const mobCode = Number(row.match(/monster_detail\/(\d+)/i)?.[1]);
    if (!mobCode || cells.length < 7) return null;
    return {
      name: stripTags(cells[2]),
      level: parseCompactNumber(cells[0]),
      hp: parseCompactNumber(cells[3]),
      exp: parseCompactNumber(cells[4]),
      ele: parseElementNames(cells[6]),
      mobCode,
    };
  }).filter(Boolean);
}

function parseLabeledNumber(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return parseCompactNumber(html.match(new RegExp(`${escaped}\\s*:\\s*([^<]+)`, "i"))?.[1]);
}

function parseDetail(mobCode) {
  if (!DETAIL_DIR) return null;
  const file = path.join(DETAIL_DIR, `${mobCode}.html`);
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, "utf8");
  return {
    watk: parseLabeledNumber(html, "물리 데미지"),
    matk: parseLabeledNumber(html, "마법 데미지"),
    def: parseLabeledNumber(html, "물리 방어력"),
    mDef: parseLabeledNumber(html, "마법 방어력"),
    needAcc: parseCompactNumber(html.match(/필요 명중\s*:\s*([^<]+)/i)?.[1]),
  };
}

function main() {
  if (!fs.existsSync(NOTE_PATH)) throw new Error(`Input not found: ${NOTE_PATH}`);
  const imported = parseNote(fs.readFileSync(NOTE_PATH, "utf8"));
  const expectedCodes = new Set(Object.keys(SPAWNS_BY_MOB).map(Number));
  if (imported.length !== expectedCodes.size || imported.some((monster) => !expectedCodes.has(monster.mobCode))) {
    throw new Error(`Expected ${expectedCodes.size} Edelstein monsters, parsed ${imported.length}`);
  }

  const monsters = JSON.parse(fs.readFileSync(MONSTERS_PATH, "utf8"));
  const existingByCode = new Map(monsters.map((monster) => [monster.mobCode, monster]));
  const replacements = imported.map((monster) => {
    const existing = existingByCode.get(monster.mobCode) ?? {};
    const detail = parseDetail(monster.mobCode) ?? {};
    return {
      name: monster.name,
      level: monster.level,
      hp: monster.hp,
      exp: monster.exp,
      acc: existing.acc ?? 0,
      eva: existing.eva ?? 0,
      needAcc: detail.needAcc ?? existing.needAcc ?? 0,
      def: detail.def ?? existing.def ?? 0,
      mDef: detail.mDef ?? existing.mDef ?? 0,
      ele: monster.ele,
      mobCode: monster.mobCode,
      region: REGION,
      watk: detail.watk ?? existing.watk ?? 0,
      matk: detail.matk ?? existing.matk ?? 0,
      exist: true,
    };
  });

  const replacementCodes = new Set(replacements.map((monster) => monster.mobCode));
  const replacementByCode = new Map(replacements.map((monster) => [monster.mobCode, monster]));
  const merged = monsters.map((monster) => replacementByCode.get(monster.mobCode) ?? monster);
  const existingCodes = new Set(monsters.map((monster) => monster.mobCode));
  merged.push(...replacements.filter((monster) => !existingCodes.has(monster.mobCode)));
  fs.writeFileSync(MONSTERS_PATH, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  const spawns = JSON.parse(fs.readFileSync(SPAWNS_PATH, "utf8"));
  const rows = (spawns.rows ?? []).filter((row) => !replacementCodes.has(Number(row.mob_code)));
  for (const monster of replacements) {
    rows.push({
      mob_code: monster.mobCode,
      mob_name: monster.name,
      mob_name_en: "",
      maps: SPAWNS_BY_MOB[monster.mobCode].map(([map_code, map_name]) => ({ map_code, map_name })),
    });
  }
  rows.sort((a, b) => Number(a.mob_code) - Number(b.mob_code));
  spawns.rows = rows;
  spawns.count = rows.length;
  spawns.withMaps = rows.filter((row) => row.maps?.length).length;
  spawns.withoutMaps = rows.length - spawns.withMaps;
  const sourceParts = String(spawns.source ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!sourceParts.includes("Maple Note Edelstein snapshot")) {
    sourceParts.push("Maple Note Edelstein snapshot");
  }
  spawns.source = sourceParts.join("; ");
  fs.writeFileSync(SPAWNS_PATH, `${JSON.stringify(spawns, null, 2)}\n`, "utf8");

  console.log(`Imported ${replacements.length} Edelstein monsters.`);
  console.log(`Linked ${replacements.reduce((sum, monster) => sum + SPAWNS_BY_MOB[monster.mobCode].length, 0)} monster/map pairs.`);
}

main();
