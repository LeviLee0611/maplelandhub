import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

function usage() {
  console.log("Usage: node scripts/import-quests-from-turbopack.mjs <input-file> [output-file]");
}

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "data/quests.json";

if (!inputPath) {
  usage();
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");
const parseCall = raw.match(/JSON\.parse\((['"`])([\s\S]*?)\1\)/);

if (!parseCall) {
  console.error("Could not find JSON.parse('...') payload in input.");
  process.exit(1);
}

const quote = parseCall[1];
const literalBody = parseCall[2];

let jsonText = "";
try {
  jsonText = vm.runInNewContext(`${quote}${literalBody}${quote}`);
} catch (error) {
  console.error("Failed to decode JSON.parse string literal.");
  console.error(error);
  process.exit(1);
}

let bundles = [];
try {
  bundles = JSON.parse(jsonText);
} catch (error) {
  console.error("Failed to parse decoded JSON text.");
  console.error(error);
  process.exit(1);
}

if (!Array.isArray(bundles)) {
  console.error("Expected decoded JSON root to be an array.");
  process.exit(1);
}

const questNameById = new Map();
const worldNameById = new Map();
for (const bundle of bundles) {
  for (const q of bundle?.questList ?? []) {
    if (q?.questId && q?.questName && !questNameById.has(q.questId)) {
      questNameById.set(q.questId, q.questName);
    }
  }
}

function pickWorldName(bundle, quest) {
  const candidates = [
    quest?.questData?.region,
    quest?.questData?.mapName,
    quest?.questData?.areaName,
    bundle?.startAreaName,
    quest?.startAreaName,
  ];

  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim();
    if (text) return normalizeWorldName(text);
  }

  return "기타";
}

function normalizeWorldName(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "기타";

  const [headRaw, ...tailParts] = text.split(":");
  const head = String(headRaw ?? "").trim();
  const tail = tailParts.join(":").trim();

  if (!tail) {
    if (head.includes(",")) return head.split(",")[0].trim();
    return head || text;
  }

  // 사냥터/필드 계열 prefix 는 세부 맵명을 월드명으로 사용
  const fieldPrefixes = new Set([
    "던전",
    "빅토리아로드",
    "스카이로드",
    "루더스호수",
    "아쿠아로드",
    "미나르숲",
    "지구방위본부",
    "엘나스산맥",
    "엘나스 산맥",
    "[일본]카에데성",
    "[일본] [일본] 쇼와 마을",
    "기타",
  ]);

  if (fieldPrefixes.has(head)) return tail;
  if (head.includes(",")) {
    return head.split(",")[0].trim();
  }
  return head;
}

const npcs = new Map();
const quests = [];
const seen = new Set();

for (const bundle of bundles) {
  for (const q of bundle?.questList ?? []) {
    const questData = q?.questData ?? {};
    const requirementToStart = q?.requirementToStart ?? {};
    const requirementToComplete = questData?.requirementToComplete ?? {};
    const reward = questData?.reward ?? {};

    const id = Number(q?.questId);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);

    const worldName = pickWorldName(bundle, q);
    const worldId = worldName;
    worldNameById.set(worldId, worldName);

    const npcId = Number(questData?.npcId ?? requirementToStart?.npcId ?? 0) || 0;
    const npcName = String(questData?.npcName ?? "").trim();
    if (npcId > 0) {
      if (!npcs.has(npcId)) {
        npcs.set(npcId, npcName || `NPC #${npcId}`);
      }
    }

    const prerequisites = (requirementToStart?.quests ?? [])
      .filter((p) => Number.isFinite(Number(p?.id)))
      .map((p) => {
        const questId = Number(p.id);
        return {
          questId,
          name: questNameById.get(questId) ?? `#${questId}`,
        };
      });

    const completeItems = (requirementToComplete?.items ?? [])
      .map((item) => ({
        id: Number(item?.id),
        name: String(item?.name ?? `#${item?.id}`),
        count: Number(item?.count ?? 0),
        source: String(item?.area ?? "").trim() || undefined,
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0 && Number.isFinite(item.count) && item.count > 0);

    const completeMobs = (requirementToComplete?.mobs ?? [])
      .map((mob) => ({
        id: Number(mob?.id),
        name: String(mob?.name ?? `#${mob?.id}`),
        quantity: Number(mob?.quantity ?? 0),
        area: String(mob?.area ?? "").trim() || undefined,
      }))
      .filter((mob) => mob.name && (Number.isFinite(mob.id) || Number.isFinite(mob.quantity)));

    const tips = Array.isArray(questData?.tip) ? questData.tip : [];
    const recommendedAreas = tips
      .map((tip) => String(tip?.recommendedAreas ?? "").trim())
      .filter(Boolean)
      .join(" / ");
    const notes = tips
      .map((tip) => String(tip?.description ?? "").trim())
      .filter(Boolean);

    const rewardItems = (reward?.items ?? [])
      .map((item) => ({
        id: Number(item?.id),
        name: String(item?.name ?? `#${item?.id}`),
        count: Number(item?.count ?? 0),
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0 && Number.isFinite(item.count) && item.count > 0);

    const levelFromQuest = Number(q?.levelMinimum ?? 0);
    const levelFromStart = Number(requirementToStart?.levelMinimum ?? 0);
    const levelFromBundle = Number(bundle?.bundleMinimumLevel ?? 0);
    const levelMin = Math.max(levelFromQuest, levelFromStart, levelFromBundle, 1);

    const quest = {
      id,
      name: String(q?.questName ?? `#${id}`),
      worldId,
      npcId,
      repeatable: Boolean(q?.questFlags?.isRepeatable),
      levelMin,
      prerequisites,
      requirements: {
        start: {
          levelMin,
          jobs: Array.isArray(requirementToStart?.jobs) ? requirementToStart.jobs.map((v) => Number(v)).filter(Number.isFinite) : [],
        },
        complete: {
          items: completeItems,
          mobs: completeMobs,
        },
      },
      rewards: {
        exp: Number(questData?.exp ?? 0) || 0,
        meso: Number(reward?.meso ?? 0) || 0,
        items: rewardItems,
      },
      guide: {
        recommendedAreas: recommendedAreas || undefined,
        notes: notes.length > 0 ? notes : undefined,
      },
    };

    quests.push(quest);
  }
}

quests.sort((a, b) => {
  if (a.levelMin !== b.levelMin) return a.levelMin - b.levelMin;
  return a.name.localeCompare(b.name, "ko");
});

const output = {
  generatedAt: new Date().toISOString(),
  source: "turbopack-dump-import",
  worlds: [...worldNameById.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko")),
  npcs: [...npcs.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko")),
  quests,
};

const outDir = path.dirname(outputPath);
if (outDir && outDir !== ".") {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Imported ${quests.length} quests from ${bundles.length} bundles.`);
console.log(`Output: ${outputPath}`);
