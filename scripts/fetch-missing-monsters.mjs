import fs from "fs/promises";
import path from "path";

const DROP_INDEX = path.resolve("data/drop-index.json");
const MONSTERS_OUT = path.resolve("data/monsters.json");
const CONCURRENCY = 4;
const DELAY_MS = 100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "maplelandhub/1.0" } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i >= retries) return null;
      await sleep(300 * (i + 1));
    }
  }
  return null;
}

async function fetchMobData(mobId) {
  const kms = await fetchJson(`https://maplestory.io/api/KMS/389/mob/${mobId}`);
  if (kms) return kms;
  return fetchJson(`https://maplestory.io/api/GMS/200/mob/${mobId}`);
}

function mapToSchema(data, mobId) {
  if (!data) return null;
  const name = data.description?.name || data.name;
  if (!name) return null;
  const meta = data.meta ?? {};
  const id = String(mobId);
  const isLikelyBoss = id.startsWith("8") && Number(mobId) >= 8100000;
  return {
    name,
    level: meta.level ?? 1,
    hp: meta.maxHP ?? 1,
    exp: meta.exp ?? 0,
    acc: 0,
    eva: 0,
    needAcc: 0,
    def: meta.physicalDefenseRate ?? 0,
    mDef: meta.magicDefenseRate ?? 0,
    ele: ["무속성"],
    mobCode: Number(mobId),
    region: isLikelyBoss ? "보스" : "기타",
    exist: true,
  };
}

async function asyncPool(limit, items, fn) {
  const ret = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) await Promise.race(executing);
  }
  return Promise.all(ret);
}

async function main() {
  const [dropIndexRaw, monstersRaw] = await Promise.all([
    fs.readFile(DROP_INDEX, "utf8"),
    fs.readFile(MONSTERS_OUT, "utf8"),
  ]);

  const dropIndex = JSON.parse(dropIndexRaw);
  const monsters = JSON.parse(monstersRaw);

  const knownIds = new Set(monsters.map((m) => m.mobCode));
  const defaultStatIds = new Set(
    monsters.filter((m) => m.level === 1 && m.hp === 1).map((m) => m.mobCode)
  );
  const allDropMobIds = Object.keys(dropIndex.dropsByMonsterId).map(Number);
  const missingIds = allDropMobIds.filter((id) => !knownIds.has(id) || defaultStatIds.has(id));

  console.log(`Known: ${knownIds.size}, Drop-index mobs: ${allDropMobIds.length}, Missing: ${allDropMobIds.filter((id) => !knownIds.has(id)).length}, Needs update (level:1 hp:1): ${defaultStatIds.size}`);

  let fetched = 0;
  let added = 0;
  const newMonsters = [];

  await asyncPool(CONCURRENCY, missingIds, async (mobId) => {
    await sleep(DELAY_MS);
    const data = await fetchMobData(mobId);
    const entry = mapToSchema(data, mobId);
    fetched++;
    if (fetched % 50 === 0) console.log(`  Progress: ${fetched}/${missingIds.length}`);
    if (entry) {
      newMonsters.push(entry);
      added++;
    }
  });

  const updatedIds = new Set(newMonsters.map((m) => m.mobCode));
  const merged = [...monsters.filter((m) => !updatedIds.has(m.mobCode)), ...newMonsters];
  await fs.writeFile(MONSTERS_OUT, JSON.stringify(merged, null, 2), "utf8");

  console.log(`\nAdded ${added} new monsters (${missingIds.length - added} had no API data).`);
  console.log("Sample added:");
  newMonsters
    .sort((a, b) => b.hp - a.hp)
    .slice(0, 10)
    .forEach((m) => console.log(`  ${m.mobCode} ${m.name} (Lv${m.level}, HP:${m.hp})`));
  console.log(`\nTotal monsters.json: ${merged.length}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
