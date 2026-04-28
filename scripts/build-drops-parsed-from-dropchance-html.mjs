import fs from "fs/promises";
import path from "path";

const INPUT_PATH = path.resolve("data/dropchance");
const MONSTER_SOURCE = path.resolve("data/monsters.json");
const ITEM_SOURCE = path.resolve("data/drop-index.json");
const OUTPUT_PATH = path.resolve("data/drops-parsed.json");
const REPORT_PATH = path.resolve("data/dropchance-report.json");

const MONSTER_ALIAS_MAP = {
  깨비: ["깨비(변신 전)", "깨비(변신 후)"],
  피아누스: ["피아누스(좌)", "피아누스(우)"],
  "폐쇄된 연구실의 호문": ["호문"],
};
const EXCLUDED_ITEM_NAME_PATTERNS = [
  /마법의\s*가루\s*\([^)]*\)/i,
  /^.+\s+카드$/i,
  /^악의\s*기운$/i,
  /^첫\s*번째\s*작은\s*조각$/i,
  /^메이플\s+(?!고서|코인).+/i,
  /^하의\s*점프(?:력)?\s*주문서\s*\d+%$/i,
  /^하의\s*민첩(?:성)?\s*주문서\s*\d+%$/i,
];

function createSyntheticItemId(name) {
  let hash = 2166136261;
  const normalized = normalizeName(name);
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const positive = (hash >>> 0) % 2000000000;
  return -(positive + 1);
}

function decodeHtmlEntities(text) {
  return String(text ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");
}

function stripTags(text) {
  return decodeHtmlEntities(String(text ?? "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(text) {
  return stripTags(text)
    .replace(/[’‘`]/g, "'")
    .replace(/민첩성/g, "민첩")
    .replace(/명중률/g, "명중")
    .replace(/점프 주문서/g, "점프력 주문서")
    .replace(/이동속도 주문서/g, "이동속도 주문서")
    .replace(/마나 엘릭서/g, "마나엘릭서")
    .replace(/파워 엘릭서/g, "파워엘릭서")
    .replace(/지력성/g, "지력")
    .replace(/명중치/g, "명중")
    .replace(/회피치/g, "회피")
    .replace(/[(){}\[\]'"~!@#$^&*_+=|\\/:;,.?-]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function parseProb(text) {
  const value = Number(String(text ?? "").replace(/[%\s,]/g, ""));
  if (!Number.isFinite(value) || value < 0) return undefined;
  return value / 100;
}

function isExcludedItemName(itemName) {
  const text = String(itemName ?? "").trim();
  return EXCLUDED_ITEM_NAME_PATTERNS.some((pattern) => pattern.test(text));
}

function buildLookup(rows, keyField) {
  const lookup = new Map();
  for (const row of rows) {
    const raw = String(row?.[keyField] ?? "").trim();
    const normalized = normalizeName(raw);
    if (!normalized) continue;
    const bucket = lookup.get(normalized) ?? [];
    bucket.push(row);
    lookup.set(normalized, bucket);
  }
  return lookup;
}

function pickSingleMatch(lookup, name, keyField) {
  const normalized = normalizeName(name);
  if (!normalized) return { match: null, reason: "blank" };

  const matches = lookup.get(normalized) ?? [];
  if (matches.length === 0) return { match: null, reason: "missing" };
  if (matches.length === 1) return { match: matches[0], reason: "exact" };

  const exact = matches.find((entry) => String(entry?.[keyField] ?? "").trim() === String(name ?? "").trim());
  if (exact) return { match: exact, reason: "exact-raw" };

  return {
    match: [...matches].sort((a, b) => {
      const aKey = Number(a?.id ?? a?.mobCode ?? 0);
      const bKey = Number(b?.id ?? b?.mobCode ?? 0);
      return aKey - bKey;
    })[0],
    reason: "ambiguous-first",
  };
}

function uniqueBy(rows, keyFn) {
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    const key = keyFn(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function pickMonsterMatches(lookup, name) {
  const raw = String(name ?? "").trim();
  if (!raw) return { matches: [], reason: "blank" };

  const aliasTargets = MONSTER_ALIAS_MAP[raw] ?? [];
  const aliasMatches = uniqueBy(
    aliasTargets.flatMap((target) => lookup.get(normalizeName(target)) ?? []),
    (row) => row.mobCode
  );
  if (aliasMatches.length > 0) {
    return { matches: aliasMatches, reason: "alias" };
  }

  const exact = pickSingleMatch(lookup, raw, "name");
  if (exact.match?.mobCode) {
    return { matches: [exact.match], reason: exact.reason };
  }

  const derivedNames = [];
  const suffixMatch = raw.match(/의\s+(.+)$/);
  if (suffixMatch?.[1]) {
    derivedNames.push(suffixMatch[1].trim());
  }
  const parenStripped = raw.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (parenStripped && parenStripped !== raw) {
    derivedNames.push(parenStripped);
  }

  for (const derived of derivedNames) {
    const picked = pickSingleMatch(lookup, derived, "name");
    if (picked.match?.mobCode) {
      return { matches: [picked.match], reason: `derived:${derived}` };
    }
  }

  return { matches: [], reason: exact.reason };
}

function extractTableRows(html) {
  const articleIndex = html.indexOf("tt_article_useless_p_margin contents_style");
  const markerIndex = html.indexOf("몬스터 이름", articleIndex === -1 ? 0 : articleIndex);
  if (markerIndex === -1) {
    throw new Error("Drop table marker not found in input HTML.");
  }

  const tableStart = html.lastIndexOf("<table", markerIndex);
  const tableEnd = html.indexOf("</table>", markerIndex);
  if (tableStart === -1 || tableEnd === -1) {
    throw new Error("Drop table HTML not found.");
  }

  const tableHtml = html.slice(tableStart, tableEnd + "</table>".length);
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cellMatches = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    if (cellMatches.length < 3) continue;

    const cells = cellMatches.slice(0, 3).map((cell) => stripTags(cell[1]));
    if (cells[0] === "몬스터 이름" && cells[1] === "아이템 이름") continue;

    rows.push({
      mobName: cells[0],
      itemName: cells[1],
      probText: cells[2],
    });
  }

  return rows;
}

function buildDrops(rows, monsters, items) {
  const monsterLookup = buildLookup(monsters, "name");
  const itemLookup = buildLookup(items, "name");

  const dropsByMobId = new Map();
  const matchedItems = new Map();
  const syntheticItems = new Map();
  const unmatchedMonsters = [];
  const unmatchedItems = [];
  const skippedRows = [];

  for (const row of rows) {
    const prob = parseProb(row.probText);
    if (typeof prob !== "number") {
      skippedRows.push({ ...row, reason: "invalid-prob" });
      continue;
    }

    if (!String(row.itemName ?? "").trim()) {
      skippedRows.push({ ...row, reason: "blank-item" });
      continue;
    }
    if (isExcludedItemName(row.itemName)) {
      continue;
    }

    const monsterPick = pickMonsterMatches(monsterLookup, row.mobName);
    if (monsterPick.matches.length === 0) {
      unmatchedMonsters.push({ ...row, reason: monsterPick.reason });
      continue;
    }

    const itemPick = pickSingleMatch(itemLookup, row.itemName, "name");
    const resolvedItem = itemPick.match?.id
      ? itemPick.match
      : (() => {
          const syntheticId = createSyntheticItemId(row.itemName);
          const synthetic =
            syntheticItems.get(syntheticId) ??
            {
              id: syntheticId,
              name: row.itemName,
              meta: {
                synthetic: true,
              },
            };
          syntheticItems.set(syntheticId, synthetic);
          return synthetic;
        })();

    if (!itemPick.match?.id) {
      unmatchedItems.push({
        ...row,
        syntheticItemId: resolvedItem.id,
        mobCodes: monsterPick.matches.map((match) => match.mobCode),
        reason: itemPick.reason,
      });
    }

    for (const monster of monsterPick.matches) {
      const mobId = String(monster.mobCode);
      const current = dropsByMobId.get(mobId) ?? new Map();
      const previous = current.get(resolvedItem.id);
      if (!previous || prob > previous.prob) {
        current.set(resolvedItem.id, {
          itemID: resolvedItem.id,
          prob,
          min: 1,
          max: 1,
        });
      }
      dropsByMobId.set(mobId, current);
    }
    matchedItems.set(String(resolvedItem.id), resolvedItem);
  }

  const mobs = {};
  for (const [mobId, rewards] of [...dropsByMobId.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    mobs[mobId] = {
      rewards: [...rewards.values()].sort((a, b) => {
        if (b.prob !== a.prob) return b.prob - a.prob;
        return a.itemID - b.itemID;
      }),
    };
  }

  const itemMap = {};
  for (const [itemId, item] of [...matchedItems.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    itemMap[itemId] = {
      name: item.name,
      typeInfo: item.typeInfo,
      equipGroup: item.equipGroup,
      meta: item.meta,
    };
  }

  return {
    mobs,
    items: itemMap,
    report: {
      totalRows: rows.length,
      matchedRows: Object.values(mobs).reduce((sum, entry) => sum + entry.rewards.length, 0),
      matchedMobCount: Object.keys(mobs).length,
      matchedItemCount: Object.keys(itemMap).length,
      syntheticItemCount: syntheticItems.size,
      unmatchedMonsterCount: unmatchedMonsters.length,
      unmatchedItemCount: unmatchedItems.length,
      skippedRowCount: skippedRows.length,
      unmatchedMonsters,
      unmatchedItems,
      skippedRows,
    },
  };
}

async function main() {
  const [html, monstersRaw, itemIndexRaw] = await Promise.all([
    fs.readFile(INPUT_PATH, "utf8"),
    fs.readFile(MONSTER_SOURCE, "utf8"),
    fs.readFile(ITEM_SOURCE, "utf8"),
  ]);

  const monsters = JSON.parse(monstersRaw);
  const itemIndex = JSON.parse(itemIndexRaw);
  const items = Array.isArray(itemIndex?.items) ? itemIndex.items : [];

  const rows = extractTableRows(html);
  const parsed = buildDrops(rows, monsters, items);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "dropchance-html",
    inputPath: path.relative(process.cwd(), INPUT_PATH),
    mobs: parsed.mobs,
    items: parsed.items,
  };

  const report = {
    generatedAt: payload.generatedAt,
    source: payload.source,
    inputPath: payload.inputPath,
    ...parsed.report,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log(`Wrote ${OUTPUT_PATH} with ${Object.keys(payload.mobs).length} mobs.`);
  console.log(`Wrote ${REPORT_PATH}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
