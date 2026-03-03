import fs from "fs/promises";
import path from "path";
import vm from "vm";

const INPUT_PATH = path.resolve("src/data/mapledb/drops.js");
const OUTPUT_PATH = path.resolve("data/drops-parsed.json");

function isDropTable(value) {
  if (!value || typeof value !== "object") return false;
  const sampleKey = Object.keys(value).find((key) => String(Number(key)) === key);
  if (!sampleKey) return false;
  const sample = value[sampleKey];
  return Boolean(sample && typeof sample === "object" && Array.isArray(sample.rewards));
}

function isItemTable(value) {
  if (!value || typeof value !== "object") return false;
  const sampleKey = Object.keys(value).find((key) => String(Number(key)) === key);
  if (!sampleKey) return false;
  const sample = value[sampleKey];
  return Boolean(sample && typeof sample === "object" && sample.typeInfo);
}

async function main() {
  const code = await fs.readFile(INPUT_PATH, "utf8");
  const chunks = [];
  const sandbox = {
    window: {
      webpackJsonp: [],
    },
  };

  sandbox.window.webpackJsonp.push = (chunk) => {
    chunks.push(chunk);
  };

  vm.runInNewContext(code, sandbox, { timeout: 10000 });

  const modules = Object.assign({}, ...chunks.map((chunk) => chunk[1]));
  let dropTable = null;
  let itemTable = null;

  for (const modId of Object.keys(modules)) {
    const modFn = modules[modId];
    if (typeof modFn !== "function") continue;
    const src = modFn.toString();
    const looksLikeDropTable = src.includes("rewards") && src.includes("mobID");
    const looksLikeItemTable = src.includes("typeInfo") && src.includes("overallCategory");
    if (!looksLikeDropTable && !looksLikeItemTable) continue;

    const moduleObj = { exports: {} };
    const requireStub = () => ({});
    try {
      modFn(moduleObj, moduleObj.exports, requireStub);
      if (!dropTable && isDropTable(moduleObj.exports)) {
        dropTable = moduleObj.exports;
      }
      if (!itemTable && isItemTable(moduleObj.exports)) {
        itemTable = moduleObj.exports;
      }
      if (dropTable && itemTable) break;
    } catch {
      // ignore modules that cannot be executed in isolation
    }
  }

  if (!dropTable) {
    throw new Error("Drop table data not found in src/data/mapledb/drops.js");
  }

  if (!itemTable) {
    throw new Error("Item table data not found in src/data/mapledb/drops.js");
  }

  const parsedItems = {};
  for (const [itemId, itemData] of Object.entries(itemTable)) {
    if (!itemData || typeof itemData !== "object") continue;
    parsedItems[itemId] = {
      typeInfo: itemData.typeInfo,
      equipGroup: itemData.equipGroup,
      meta: itemData.meta,
    };
  }

  const parsed = {};
  for (const [mobId, mobData] of Object.entries(dropTable)) {
    if (!mobData || !Array.isArray(mobData.rewards)) continue;
    parsed[mobId] = {
      rewards: mobData.rewards
        .filter((reward) => reward && typeof reward.itemID === "number" && typeof reward.prob === "number")
        .map((reward) => ({
          itemID: reward.itemID,
          prob: reward.prob,
          min: reward.min,
          max: reward.max,
        })),
    };
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    mobs: parsed,
    items: parsedItems,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${OUTPUT_PATH} with ${Object.keys(parsed).length} mobs.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
