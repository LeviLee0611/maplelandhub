import fs from "fs";
import path from "path";
import vm from "vm";

const rawPath = path.resolve("data/raw/monsters.raw.ts");
const outPath = path.resolve("data/monsters.json");

const rawText = fs.readFileSync(rawPath, "utf8");
const start = rawText.indexOf("{");
const end = rawText.lastIndexOf("}");

if (start === -1 || end === -1 || end <= start) {
  throw new Error("Could not locate object literal in monsters.raw.ts");
}

const objectLiteral = rawText.slice(start, end + 1);
const context = {};
const monstersByRegion = vm.runInNewContext(`(${objectLiteral})`, context);

function stripHtml(value) {
  return String(value ?? "").replace(/<[^>]*>/g, "").trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

const normalized = [];

for (const [region, list] of Object.entries(monstersByRegion)) {
  if (!Array.isArray(list)) continue;

  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;

    const name = stripHtml(entry.name);
    const mobCode = toNumber(entry.mobCode);

    // Skip section headers or invalid rows
    if (!mobCode || name.length === 0) continue;

    const eleList = [];
    const ele = stripHtml(entry.ele);
    const ele2 = stripHtml(entry.ele2);
    if (ele) eleList.push(ele);
    if (ele2) eleList.push(ele2);

    const normalizedEntry = {
      name,
      level: toNumber(entry.level) ?? 1,
      hp: toNumber(entry.hp) ?? 1,
      exp: toNumber(entry.exp) ?? 0,
      acc: toNumber(entry.acc) ?? 0,
      eva: toNumber(entry.eva) ?? 0,
      needAcc: toNumber(entry.needAcc) ?? 0,
      def: toNumber(entry.def) ?? 0,
      mDef: toNumber(entry.mDef) ?? 0,
      ele: eleList.length ? eleList : ["무속성"],
      mobCode,
      region,
    };

    const watk = toNumber(entry.watk);
    const matk = toNumber(entry.matk);
    const exist = entry.exist;

    if (watk !== undefined) normalizedEntry.watk = watk;
    if (matk !== undefined) normalizedEntry.matk = matk;
    if (typeof exist === "boolean") normalizedEntry.exist = exist;

    normalized.push(normalizedEntry);
  }
}

fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2));
console.log(`Wrote ${normalized.length} monsters to ${outPath}`);
