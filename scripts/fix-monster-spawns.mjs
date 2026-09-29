// data/monster-spawns.json 의 출현 맵 데이터를 고친다.
//
// 두 가지 문제를 처리한다 (2026-09-29 발견):
//
//   ① map_name 이 맵 이름이 아니라 **레벨 숫자**로 들어간 항목 23건
//      예) 차원의 라츠 → "출현 맵 (1곳) 85", 브라운테니 → "38", 마스터 로보 → "210"
//      map_code 는 정상이라 src/data/mapledb/maps.js 의 name_ko 로 복구할 수 있다.
//      원인은 build-monster-map-locations.mjs 가 mapledb.kr HTML 에서 맵 이름 대신 레벨 칸을
//      집어온 것으로 보인다. 그 스크립트를 다시 돌릴 일이 생기면 파싱부터 고칠 것.
//
//   ② maps 가 빈 배열인 row 327건 중, src/data/mapledb/drops.js 의 spawnsAt 으로 채울 수 있는 것
//      (spawnsAt 보유 58종, 그중 maps.js 로 한글 이름이 붙는 50종)
//      한글 맵 이름을 못 찾은 맵 코드는 **넣지 않는다** — 화면에 영문/숫자가 노출되면 안 된다.
//
// 실행: node scripts/fix-monster-spawns.mjs           (드라이런)
//       node scripts/fix-monster-spawns.mjs --apply   (실제 적용)
//
// 멱등하다 — 이미 고쳐진 항목은 건너뛴다.

import fs from "fs/promises";
import path from "path";
import vm from "vm";

const APPLY = process.argv.includes("--apply");

// ②에서 제외하는 mobCode 대역.
// 9500000~9599999 는 이벤트/특수 몬스터 대역인데, 이 대역의 drops.js spawnsAt 은 GMS 이벤트 배치가
// 섞여 있어 신뢰할 수 없다. 실제로 하프(Lv80)·켄타우로스(Lv88)·황금돼지·킹슬라임이 전부 동일한
// 저레벨 맵 10곳(남쪽숲나무던전1, 헤네시스사냥터1 …)을 가리킨다 — 어제 확인한 "GMS 이벤트 몬스터를
// 한국 마을 여러 곳에 뿌린" 패턴과 같다. 메랜닷컴·메이플노트 쪽 맵 데이터도 비어 있어 교차검증이
// 불가능하므로, 틀린 출현지를 보여주느니 비워두는 쪽을 택했다.
const EXCLUDED_FILL_RANGES = [[9500000, 9599999]];

function isExcludedFromFill(mobCode) {
  return EXCLUDED_FILL_RANGES.some(([lo, hi]) => mobCode >= lo && mobCode <= hi);
}

const SPAWNS = path.resolve("data/monster-spawns.json");
const MAPS_JS = path.resolve("src/data/mapledb/maps.js");
const DROPS_JS = path.resolve("src/data/mapledb/drops.js");
const MONSTERS = path.resolve("data/monsters.json");

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

/** maps.js 는 `var MAPS = [{'code':..,'name_ko':..}]` 형태라 vm 으로 안전하게 평가한다. */
async function loadMapNames() {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(await fs.readFile(MAPS_JS, "utf8"), sandbox);
  const rows = Array.isArray(sandbox.MAPS) ? sandbox.MAPS : [];
  const out = new Map();
  for (const r of rows) {
    const name = String(r.name_ko ?? "").trim();
    if (name) out.set(Number(r.code), name);
  }
  return out;
}

/**
 * drops.js 에서 mobID 별 spawnsAt(맵 코드 배열)을 뽑는다. `1e4` 같은 지수 표기가 섞여 있다.
 *
 * **반드시 해당 몬스터 객체 안에서만 찾아야 한다.** 처음엔 "몬스터 시작 위치부터 6000자 이내의
 * 첫 spawnsAt"으로 찾았는데, 자기 객체에 spawnsAt 이 없는 몬스터는 **뒤쪽 다른 몬스터의 맵**을
 * 가져왔다(외부 리뷰 지적, 2026-09-29). 실제로 에레고스(9300028)가 1,506자 뒤 9300040 의 맵을,
 * 월묘(9300061)가 9300065 의 맵을 물고 와 상세 페이지에 엉뚱한 출현지가 떴다.
 * 그래서 다음 엔트리(`,<mobCode>:{mobID:`)가 시작되는 지점을 객체의 끝으로 보고 그 안에서만 찾는다.
 */
function readSpawnsAt(dropsSource, mobCode) {
  const head = new RegExp(`\\b${mobCode}:\\{mobID:${mobCode}\\b`).exec(dropsSource);
  if (!head) return [];
  const start = head.index;

  // 다음 몬스터 엔트리가 시작되는 곳 = 이 몬스터 객체의 끝
  const nextEntry = /,\d{4,9}:\{mobID:/g;
  nextEntry.lastIndex = start + head[0].length;
  const next = nextEntry.exec(dropsSource);
  const body = dropsSource.slice(start, next ? next.index : dropsSource.length);

  const key = body.indexOf("spawnsAt:[");
  if (key < 0) return []; // 이 몬스터는 출현 맵 정보가 없다
  const end = body.indexOf("]", key);
  if (end < 0) return [];
  return body
    .slice(key + "spawnsAt:[".length, end)
    .split(",")
    .map((t) => Number(t.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function main() {
  const doc = await readJson(SPAWNS);
  const mapNames = await loadMapNames();
  const dropsSource = await fs.readFile(DROPS_JS, "utf8");
  const monsters = await readJson(MONSTERS);
  const nameByCode = new Map(monsters.map((m) => [m.mobCode, m.name]));

  console.log(`모드: ${APPLY ? "APPLY (파일 수정)" : "DRY-RUN (미리보기)"}`);
  console.log(`맵 사전 ${mapNames.size}개 / spawn row ${doc.rows.length}건`);

  // ---------- ① 숫자로 깨진 map_name 복구 ----------
  let renamed = 0;
  const unrecoverable = [];
  for (const row of doc.rows) {
    for (const m of row.maps ?? []) {
      if (!/^\d+$/.test(String(m.map_name ?? "").trim())) continue;
      const real = mapNames.get(m.map_code);
      if (!real) {
        unrecoverable.push([row.mob_code, m.map_code]);
        continue;
      }
      console.log(`   [이름복구] ${row.mob_code} ${nameByCode.get(row.mob_code) ?? "?"}: "${m.map_name}" -> "${real}"`);
      m.map_name = real;
      renamed++;
    }
  }
  console.log(`\n[① map_name 복구] ${renamed}건${unrecoverable.length ? ` / 복구 불가 ${unrecoverable.length}건 ${JSON.stringify(unrecoverable)}` : ""}`);

  // ---------- ② 빈 maps 를 drops.js spawnsAt 으로 보강 ----------
  let filled = 0;
  let skippedNoSpawn = 0;
  let skippedNoName = 0;
  let skippedExcluded = 0;
  for (const row of doc.rows) {
    if ((row.maps ?? []).length > 0) continue;
    if (isExcludedFromFill(row.mob_code)) {
      skippedExcluded++;
      continue;
    }
    const codes = readSpawnsAt(dropsSource, row.mob_code);
    if (codes.length === 0) {
      skippedNoSpawn++;
      continue;
    }
    const seen = new Set();
    const maps = [];
    for (const code of codes) {
      const name = mapNames.get(code);
      if (!name || seen.has(code)) continue; // 한글 이름 없는 맵은 넣지 않는다
      seen.add(code);
      maps.push({ map_code: code, map_name: name });
    }
    if (maps.length === 0) {
      skippedNoName++;
      continue;
    }
    row.maps = maps;
    filled++;
    console.log(`   [맵보강] ${row.mob_code} ${nameByCode.get(row.mob_code) ?? "?"} -> ${maps.map((m) => m.map_name).join(", ")}`);
  }
  console.log(
    `\n[② 빈 maps 보강] ${filled}종 채움 (spawnsAt 없음 ${skippedNoSpawn}종, 한글 맵이름 없음 ${skippedNoName}종, ` +
      `신뢰 못할 대역 제외 ${skippedExcluded}종은 그대로 둠)`,
  );

  // ---------- 집계 갱신 ----------
  doc.withMaps = doc.rows.filter((r) => (r.maps ?? []).length > 0).length;
  doc.withoutMaps = doc.rows.length - doc.withMaps;
  console.log(`\n출현 맵 보유 ${doc.withMaps}종 / 미보유 ${doc.withoutMaps}종`);

  if (APPLY) {
    await fs.writeFile(SPAWNS, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    console.log("\n적용 완료.");
  } else {
    console.log("\n드라이런이라 파일을 건드리지 않았다. 적용하려면 --apply 를 붙일 것.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
