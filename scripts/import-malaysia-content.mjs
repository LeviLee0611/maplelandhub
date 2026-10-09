// 메랜 2026-10-08 패치 "말레이시아" 지역 반영 + 신규 아이템 "혼돈의 주문서 60%" 드롭처 연결.
//
// 근거: 메이플노트(xn--o80b01o9mlw3kdzc.com) monster_detail 스냅샷
//   scripts/sources/mapleland/maplenote-malaysia-2026-10-09.json  (2026-10-09 수집)
// 패치노트: https://maple.land/board/notices/h0ifyesthgb4e79hecngkcgh
//
// 하는 일 (전부 증분 — 이미 있는 건 건너뛰므로 멱등):
//   1) data/monsters.json          — 말레이시아 필드 14종 + 보스 타르가/스칼리온 3단계×2 + 짜증내는 좀비버섯(2230131) 추가
//   2) data/monster-spawns.json    — 위 몬스터의 출현 맵 row 추가
//   3) data/drop-index.json, data/item-detail-by.json
//        — 신규 몬스터의 드롭 전체 병합
//        — 혼돈의 주문서 60%(2049100) 드롭처 40종: 메이플노트 아이템 페이지에 올라온 몬스터마다 이 쌍만 추가
//   4) data/release-filters.json   — 9420xxx 대역은 blockedMobCodeMin(9000000)에 걸리므로 allowedMobCodes 에 추가
//   5) scripts/sources/planet/divergence-overrides.json — 짜증내는 좀비버섯(2230131)은 9000000 미만이라 플래닛에도
//        노출되는데, planet-helper 스냅샷에 Lv24·HP500·EXP168(=42×4)로 있어 실제 플래닛에 존재한다. chowayo 실측
//        파일엔 없어 플래닛 EXP 가 메랜값(42)으로 나가므로 monsterOverrides 로 168 을 넣는다.
//        말레이시아(9420xxx)는 planet-helper 에 없고 9000000 이상이라 플래닛에선 자동 차단된다.
//
// 보스 HP/EXP 는 메이플노트가 "60.0M"처럼 축약해 보여줘 그대로 환산한 값이다(60,000,000). 원래 딱 떨어지는
// 수치라 오차는 없다고 보지만, 패치노트는 보스 레벨을 "???"로 가려 두었으니 인게임 확인 전까지는 잠정치.
// 메이플노트 코드 8888888(자쿰)은 우리 데이터의 자쿰(3페이즈) 8800002 로 대응시킨다 — 드롭이 거기 달려 있다.
//
// 실행: node scripts/import-malaysia-content.mjs          (드라이런)
//       node scripts/import-malaysia-content.mjs --apply  (적용)
// 적용 후 `node scripts/build-planet-data.mjs` 로 플래닛 동기화.

import fs from "fs/promises";
import path from "path";

const APPLY = process.argv.includes("--apply");
const SNAPSHOT = path.resolve("scripts/sources/mapleland/maplenote-malaysia-2026-10-09.json");
const MONSTERS = path.resolve("data/monsters.json");
const SPAWNS = path.resolve("data/monster-spawns.json");
const DROP_INDEX = path.resolve("data/drop-index.json");
const ITEM_DETAIL_BY = path.resolve("data/item-detail-by.json");
const RELEASE_FILTERS = path.resolve("data/release-filters.json");
const PLANET_OVERRIDES = path.resolve("scripts/sources/planet/divergence-overrides.json");

const CHAOS_SCROLL_ITEM = 2049100;
const MOBCODE_ALIASES = { 8888888: 8800002 }; // 메이플노트 자쿰 → 우리 자쿰(3페이즈)
const BOSS_CODES = new Set([9420542, 9420543, 9420544, 9420547, 9420548, 9420549]);

// 메이플노트 "불속성반감" → 우리 "불 반감". "무효"는 우리 표기로 "면역".
function toOurElement(label) {
  if (label === "무속성") return "무속성";
  const m = label.match(/^(불|얼음|전기|독|성)속성(반감|약점|무효|면역)$/);
  if (!m) throw new Error(`알 수 없는 속성 표기: ${label}`);
  return `${m[1]} ${m[2] === "무효" ? "면역" : m[2]}`;
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}
async function writeJson(p, data) {
  if (!APPLY) return;
  await fs.writeFile(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const snap = await readJson(SNAPSHOT);
  const [monsters, spawns, dropIndex, detailBy, filters, planetOverrides] = await Promise.all([
    readJson(MONSTERS), readJson(SPAWNS), readJson(DROP_INDEX), readJson(ITEM_DETAIL_BY),
    readJson(RELEASE_FILTERS), readJson(PLANET_OVERRIDES),
  ]);
  console.log(`모드: ${APPLY ? "APPLY" : "DRY-RUN"}`);

  const byCode = new Map(monsters.map((m) => [m.mobCode, m]));
  const zombieMushroomRegion = byCode.get(2230101)?.region ?? "기타";

  // 1) 몬스터
  let addedMonsters = 0;
  for (const raw of Object.values(snap.malaysia)) {
    if (byCode.has(raw.mobCode)) { console.log(`  건너뜀(이미 있음): ${raw.mobCode} ${raw.name}`); continue; }
    const monster = {
      name: raw.name,
      level: raw.level,
      hp: raw.hp,
      exp: raw.exp,
      acc: 0,
      eva: 0,
      needAcc: raw.needAcc ?? 0,
      def: raw.def ?? 0,
      mDef: raw.mDef ?? 0,
      ele: raw.ele.map(toOurElement),
      mobCode: raw.mobCode,
      region: raw.mobCode === 2230131 ? zombieMushroomRegion : BOSS_CODES.has(raw.mobCode) ? "보스" : "말레이시아",
      watk: raw.watk ?? 0,
      matk: raw.matk ?? 0,
      exist: true,
      ...(raw.maps[0] ? { map: raw.maps[0].name } : {}),
    };
    monsters.push(monster);
    byCode.set(monster.mobCode, monster);
    addedMonsters++;
    console.log(`  + ${monster.mobCode} ${monster.name} Lv${monster.level} HP${monster.hp} EXP${monster.exp} ${monster.ele.join(",")} 맵${raw.maps.length} 드롭${raw.drops.length}`);
  }

  // 2) 출현 맵
  const rowByCode = new Map(spawns.rows.map((r) => [Number(r.mob_code), r]));
  let addedRows = 0;
  for (const raw of Object.values(snap.malaysia)) {
    if (rowByCode.has(raw.mobCode)) continue;
    spawns.rows.push({
      mob_code: raw.mobCode,
      mob_name: raw.name,
      mob_name_en: "",
      maps: raw.maps.map((m) => ({ map_code: m.mapId, map_name: m.name })),
    });
    addedRows++;
  }
  spawns.rows.sort((a, b) => Number(a.mob_code) - Number(b.mob_code));
  spawns.count = spawns.rows.length;
  spawns.withMaps = spawns.rows.filter((r) => r.maps?.length).length;
  spawns.withoutMaps = spawns.rows.length - spawns.withMaps;

  // 3) 드롭 (fetch-edelstein-drops.mjs 와 같은 증분 병합 방식)
  const existingItemIds = new Set(dropIndex.items.map((it) => it.id));
  let addedPairs = 0;
  let addedItems = 0;
  function link(mobId, itemId, name, prob) {
    if (!existingItemIds.has(itemId)) {
      dropIndex.items.push({ id: itemId, name });
      existingItemIds.add(itemId);
      addedItems++;
    }
    const dropBucket = dropIndex.dropsByMonsterId[String(mobId)] ?? [];
    if (dropBucket.some((e) => e && e.itemId === itemId)) return;
    dropBucket.push({ itemId, ...(prob ? { prob } : {}) });
    dropIndex.dropsByMonsterId[String(mobId)] = dropBucket;
    const detailBucket = detailBy.itemsByItemId[String(itemId)] ?? [];
    if (!detailBucket.some((e) => e && e.mobId === mobId)) detailBucket.push({ mobId, ...(prob ? { prob } : {}) });
    detailBy.itemsByItemId[String(itemId)] = detailBucket;
    const reverse = dropIndex.monstersByItemId[String(itemId)] ?? [];
    if (!reverse.some((e) => e && e.mobId === mobId)) reverse.push({ mobId, ...(prob ? { prob } : {}) });
    dropIndex.monstersByItemId[String(itemId)] = reverse;
    addedPairs++;
  }
  for (const raw of Object.values(snap.malaysia)) {
    for (const d of raw.drops) link(raw.mobCode, d.itemId, d.name, d.prob ?? undefined);
  }
  const chaosName = dropIndex.items.find((it) => it.id === CHAOS_SCROLL_ITEM)?.name ?? "혼돈의 주문서 60%";
  const chaosMissing = [];
  for (const [codeKey, info] of Object.entries(snap.chaosScroll)) {
    const mobId = MOBCODE_ALIASES[Number(codeKey)] ?? Number(codeKey);
    if (!byCode.has(mobId)) { chaosMissing.push(`${codeKey} ${info.name}`); continue; }
    if (typeof info.prob !== "number") continue;
    link(mobId, CHAOS_SCROLL_ITEM, chaosName, info.prob);
  }
  dropIndex.items.sort((a, b) => String(a.name).localeCompare(String(b.name), "ko"));
  if (chaosMissing.length) console.log(`  혼돈의 주문서 드롭처 중 우리 데이터에 없는 몬스터(건너뜀): ${chaosMissing.join(", ")}`);

  // 4) 메랜 노출
  const allowed = new Set(filters.allowedMobCodes);
  const toAllow = Object.values(snap.malaysia).map((r) => r.mobCode).filter((c) => c >= filters.blockedMobCodeMin && !allowed.has(c));
  filters.allowedMobCodes = [...allowed, ...toAllow].sort((a, b) => a - b);

  // 5) 플래닛 EXP (짜증내는 좀비버섯)
  let planetOverrideAdded = 0;
  if (!planetOverrides.monsterOverrides["2230131"]) {
    planetOverrides.monsterOverrides["2230131"] = {
      _source: "planet-helper.com/monsters/2230131 (2026-10-05 수집) — Lv24·HP500·EXP168(=42×4). 메랜 10/08 패치로 추가된 몬스터를 2026-10-09 메이플노트에서 가져오며 플래닛 EXP 만 여기서 보정.",
      exp: 168,
    };
    planetOverrideAdded = 1;
  }

  console.log(`몬스터 +${addedMonsters} / 출현 맵 row +${addedRows} / 드롭 쌍 +${addedPairs} / 신규 아이템 +${addedItems} / 메랜 allowed +${toAllow.length} / 플래닛 exp override +${planetOverrideAdded}`);

  if (addedPairs > 0) {
    const now = new Date().toISOString();
    dropIndex.generatedAt = now;
    detailBy.generatedAt = now;
  }
  await Promise.all([
    writeJson(MONSTERS, monsters),
    writeJson(SPAWNS, spawns),
    writeJson(DROP_INDEX, dropIndex),
    writeJson(ITEM_DETAIL_BY, detailBy),
    writeJson(RELEASE_FILTERS, filters),
    writeJson(PLANET_OVERRIDES, planetOverrides),
  ]);
  if (APPLY) console.log("적용 완료. 이어서 node scripts/build-planet-data.mjs 를 실행할 것.");
}

main().catch((e) => { console.error(e); process.exit(1); });
