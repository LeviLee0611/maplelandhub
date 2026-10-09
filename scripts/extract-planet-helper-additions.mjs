// planet-helper.com 스냅샷에서 "우리 플래닛 드롭 데이터에 없는 드롭"을 뽑아
// scripts/sources/planet/planet-helper-drop-additions.json 근거 파일을 만든다.
//
// 배경(2026-10-05 전수 대조, DEVLOG 참고): planet-helper 몬스터 755종을 긁어 우리 플래닛 537종과
// 대조한 결과 EXP 88%·드롭 확률 70%가 정확히 일치했다 — 플래닛 원본(빅뱅 전 KMS)과 같은 출처다.
// 반면 우리 드롭은 메랜 스크래핑 기반이라 플래닛 전용 드롭(지우개·깃털·플래닛 리밸런스 전리품 등)이
// 비어 있었고, 노출 몬스터 55종은 드롭이 아예 0개였다.
//
// 포함 규칙 (하나라도 어긋나면 제외):
//   - 플래닛 release-filter 를 통과해 노출 중인 몬스터
//   - 우리 dropsByMonsterId 에 없는 (몬스터, 아이템) 쌍
//   - planet-helper 가 "후보(비공식 후보 드랍률, KMS 원본 확정 아님)" 표시를 붙이지 않은 것
//   - 몬스터 카드(4030012) 제외 — 플래닛 카드 시스템 아이템이라 드롭표에 넣을 성격이 아니다
//     (카드 시스템 지원 여부 자체가 미결정, TODO 참고)
//
// 확률은 planet-helper 표시값(%)을 그대로 쓴다. 공통 쌍 70%가 우리 prob 와 일치했으므로
// 이 값은 이미 플래닛 배율이 반영된 최종값이다 — build-planet-data 의 dropRate 배율을 또 곱하면 안 된다.
//
// 실행: node scripts/extract-planet-helper-additions.mjs          (드라이런, 요약만)
//       node scripts/extract-planet-helper-additions.mjs --write  (근거 파일 생성)
// 적용은 build-planet-data.mjs 가 한다 (applyDropAdditions). 이 스크립트는 산출물을 건드리지 않는다.

import fs from "fs/promises";
import path from "path";

const WRITE = process.argv.includes("--write");
const SNAPSHOT = path.resolve("scripts/state/planet-helper-monsters-2026-10-05.json");
const PLANET_MONSTERS = path.resolve("data/planet/monsters.json");
// 비교 기준은 플래닛 산출물이 아니라 **메랜 베이스**다. 플래닛 drop-index 는 이 스크립트의 산출물을 이미
// 얹은 결과라, 그걸 기준으로 비교하면 "전부 있음"이 되어 근거 파일이 비어버린다(2026-10-09 실제로 발생).
// 플래닛 베이스의 (몬스터, 아이템) 쌍은 메랜 베이스와 같고 prob 만 ×4 이므로 존재 여부는 메랜 쪽으로 본다.
const BASE_DROP_INDEX = path.resolve("data/drop-index.json");
const PLANET_RELEASE_FILTERS = path.resolve("data/planet/release-filters.json");
const OUTPUT = path.resolve("scripts/sources/planet/planet-helper-drop-additions.json");

const EXCLUDED_ITEM_IDS = new Set([4030012]); // 몬스터 카드
const OVERALL_BY_PREFIX = { 1: "Equip", 2: "Use", 3: "Setup", 4: "Etc", 5: "Cash" };

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

function isReleased(filters, mobCode) {
  const blocked = new Set(filters.blockedMobCodes ?? []);
  const allowed = new Set(filters.allowedMobCodes ?? []);
  const min = filters.blockedMobCodeMin ?? Number.POSITIVE_INFINITY;
  return allowed.has(mobCode) || (!blocked.has(mobCode) && mobCode < min);
}

// 기존 items[] 의 typeInfo 범위(lowItemId~highItemId)로 신규 아이템의 분류를 추론한다.
function buildTypeInfoResolver(items) {
  const ranges = new Map();
  for (const item of items) {
    const ti = item.typeInfo;
    if (ti && typeof ti.lowItemId === "number" && typeof ti.highItemId === "number") {
      ranges.set(`${ti.lowItemId}-${ti.highItemId}`, ti);
    }
  }
  const list = [...ranges.values()].sort((a, b) => (a.highItemId - a.lowItemId) - (b.highItemId - b.lowItemId));
  return (itemId) => list.find((ti) => ti.lowItemId <= itemId && itemId < ti.highItemId) ?? null;
}

async function main() {
  const [snapshot, monsters, dropIndex, filters] = await Promise.all([
    readJson(SNAPSHOT),
    readJson(PLANET_MONSTERS),
    readJson(BASE_DROP_INDEX),
    readJson(PLANET_RELEASE_FILTERS),
  ]);
  const ours = new Map(monsters.map((m) => [m.mobCode, m]));
  const knownItems = new Map(dropIndex.items.map((it) => [it.id, it]));
  const resolveTypeInfo = buildTypeInfoResolver(dropIndex.items);

  const drops = {};
  const newItems = {};
  const stats = { monsters: 0, pairs: 0, skippedCandidate: 0, skippedCard: 0, skippedNoProb: 0, typeInfoMissing: [] };

  for (const [code, ph] of Object.entries(snapshot)) {
    const mobCode = Number(code);
    if (!ours.has(mobCode) || !isReleased(filters, mobCode)) continue;
    const have = new Set((dropIndex.dropsByMonsterId[code] ?? []).map((d) => d.itemId));
    const added = [];
    for (const d of ph.drops ?? []) {
      if (have.has(d.itemId)) continue;
      if (d.candidate) { stats.skippedCandidate++; continue; }
      if (EXCLUDED_ITEM_IDS.has(d.itemId)) { stats.skippedCard++; continue; }
      if (typeof d.prob !== "number" || !(d.prob > 0)) { stats.skippedNoProb++; continue; }
      added.push({ itemId: d.itemId, prob: Number((d.prob / 100).toPrecision(6)), name: d.name });
      if (!knownItems.has(d.itemId) && !newItems[d.itemId]) {
        let typeInfo = resolveTypeInfo(d.itemId);
        if (!typeInfo) {
          // 범위 추론이 안 되면 ID 첫 자리로 대분류만 둔다 (기존 items 에도 대분류만 있는 항목이 있다).
          stats.typeInfoMissing.push(`${d.itemId} ${d.name}`);
          typeInfo = { overallCategory: OVERALL_BY_PREFIX[String(d.itemId)[0]] ?? "Etc" };
        }
        newItems[d.itemId] = { id: d.itemId, name: d.name, typeInfo };
      }
      have.add(d.itemId);
    }
    if (added.length > 0) {
      drops[code] = { _name: ours.get(mobCode).name, drops: added };
      stats.monsters++;
      stats.pairs += added.length;
    }
  }

  console.log(`모드: ${WRITE ? "WRITE" : "DRY-RUN"}`);
  console.log(`추가 드롭 ${stats.pairs}건 / 몬스터 ${stats.monsters}종 / 신규 아이템 ${Object.keys(newItems).length}종`);
  console.log(`제외 — 후보 ${stats.skippedCandidate}, 몬스터 카드 ${stats.skippedCard}, 확률 없음 ${stats.skippedNoProb}`);
  if (stats.typeInfoMissing.length > 0) {
    console.log(`typeInfo 추론 실패 ${stats.typeInfoMissing.length}건:`, stats.typeInfoMissing.slice(0, 20));
  }
  if (!WRITE) return;

  const out = {
    _source: "https://planet-helper.com/monsters/{mobCode} (2026-10-05 수집, scripts/state/planet-helper-monsters-2026-10-05.json)",
    _generatedBy: "scripts/extract-planet-helper-additions.mjs",
    _rule:
      "노출 몬스터 + 우리 데이터에 없는 쌍 + planet-helper '후보' 미표시 + 몬스터 카드 제외. prob 는 플래닛 최종값(배율 적용 금지).",
    _note: "손수 수정해도 된다. 재생성하면 손수 고친 내용이 사라지므로 재생성 전 diff 확인.",
    items: newItems,
    dropsByMonsterId: drops,
  };
  await fs.writeFile(OUTPUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
