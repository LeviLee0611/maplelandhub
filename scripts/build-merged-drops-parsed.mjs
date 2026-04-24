import fs from "fs/promises";
import path from "path";
import vm from "vm";

const PREFERRED_PATH = path.resolve("data/drops-parsed.json");
const LEGACY_JS_PATH = path.resolve("src/data/mapledb/drops.js");
const OUTPUT_PATH = path.resolve("data/drops-parsed.json");
const REPORT_PATH = path.resolve("data/drops-merge-report.json");

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

async function loadLegacyFromWebpack() {
  const code = await fs.readFile(LEGACY_JS_PATH, "utf8");
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
      // ignore modules that cannot execute standalone
    }
  }

  if (!dropTable || !itemTable) {
    throw new Error("Legacy drop/item tables not found in src/data/mapledb/drops.js");
  }

  const mobs = {};
  for (const [mobId, mobData] of Object.entries(dropTable)) {
    if (!mobData || !Array.isArray(mobData.rewards)) continue;
    mobs[mobId] = {
      rewards: mobData.rewards
        .filter((reward) => reward && typeof reward.itemID === "number")
        .map((reward) => ({
          itemID: reward.itemID,
          prob: typeof reward.prob === "number" ? reward.prob : undefined,
          min: typeof reward.min === "number" ? reward.min : undefined,
          max: typeof reward.max === "number" ? reward.max : undefined,
        })),
    };
  }

  const items = {};
  for (const [itemId, itemData] of Object.entries(itemTable)) {
    if (!itemData || typeof itemData !== "object") continue;
    items[itemId] = {
      name: itemData.name,
      typeInfo: itemData.typeInfo,
      equipGroup: itemData.equipGroup,
      meta: itemData.meta,
    };
  }

  return { mobs, items };
}

function mergeRewardLists(preferredRewards = [], legacyRewards = []) {
  const byItemId = new Map();

  for (const reward of legacyRewards) {
    if (!reward || typeof reward.itemID !== "number") continue;
    byItemId.set(reward.itemID, {
      itemID: reward.itemID,
      prob: reward.prob,
      min: reward.min,
      max: reward.max,
    });
  }

  for (const reward of preferredRewards) {
    if (!reward || typeof reward.itemID !== "number") continue;
    byItemId.set(reward.itemID, {
      itemID: reward.itemID,
      prob: reward.prob,
      min: reward.min,
      max: reward.max,
    });
  }

  return [...byItemId.values()].sort((a, b) => {
    const aProb = typeof a.prob === "number" ? a.prob : -1;
    const bProb = typeof b.prob === "number" ? b.prob : -1;
    if (bProb !== aProb) return bProb - aProb;
    return a.itemID - b.itemID;
  });
}

async function main() {
  const preferredRaw = await fs.readFile(PREFERRED_PATH, "utf8");
  const preferred = JSON.parse(preferredRaw);
  const legacy = await loadLegacyFromWebpack();

  const mobIds = Array.from(new Set([...Object.keys(legacy.mobs), ...Object.keys(preferred.mobs ?? {})])).sort(
    (a, b) => Number(a) - Number(b)
  );

  const mergedMobs = {};
  let legacyOnlyRewardCount = 0;
  let preferredRewardCount = 0;

  for (const mobId of mobIds) {
    const preferredRewards = preferred.mobs?.[mobId]?.rewards ?? [];
    const legacyRewards = legacy.mobs?.[mobId]?.rewards ?? [];
    const mergedRewards = mergeRewardLists(preferredRewards, legacyRewards);
    if (mergedRewards.length === 0) continue;
    mergedMobs[mobId] = { rewards: mergedRewards };
    preferredRewardCount += preferredRewards.length;
    legacyOnlyRewardCount += mergedRewards.filter(
      (reward) => !preferredRewards.some((preferredReward) => preferredReward.itemID === reward.itemID)
    ).length;
  }

  const mergedItems = { ...(legacy.items ?? {}) };
  for (const [itemId, item] of Object.entries(preferred.items ?? {})) {
    mergedItems[itemId] = {
      ...(mergedItems[itemId] ?? {}),
      ...item,
      meta: {
        ...(mergedItems[itemId]?.meta ?? {}),
        ...(item?.meta ?? {}),
      },
    };
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "dropchance-html+legacy-mapledb",
    inputSources: {
      preferred: path.relative(process.cwd(), PREFERRED_PATH),
      legacy: path.relative(process.cwd(), LEGACY_JS_PATH),
    },
    mobs: mergedMobs,
    items: mergedItems,
  };

  const report = {
    generatedAt: payload.generatedAt,
    source: payload.source,
    mobCount: Object.keys(mergedMobs).length,
    itemCount: Object.keys(mergedItems).length,
    preferredRewardCount,
    legacyOnlyRewardCount,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log(`Wrote ${OUTPUT_PATH} with ${Object.keys(mergedMobs).length} mobs.`);
  console.log(`Wrote ${REPORT_PATH}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
