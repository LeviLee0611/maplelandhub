// 마스테리아(뉴 리프 시티 / 크림슨우드) 지역 22종을 사이트에 노출시킨다.
//
// 배경: 이 지역은 메랜에서 실제 서비스 중인데 우리 release-filter(blockedMobCodeMin=9000000)에
// 걸려 22종이 통째로 비노출이었다(2026-09-28 메랜닷컴 대조로 발견). 이름·레벨·HP가 메랜닷컴과
// 전부 일치하고 아이콘도 22/22 정상이라 필터만 풀면 되는 상태다.
//
// 하는 일 두 가지:
//   1) data/release-filters.json 의 allowedMobCodes 에 22종 추가
//   2) data/monster-spawns.json 에 출현 맵 보강 (10종 — 나머지는 원본에 스폰 정보가 없음)
//
// 근거 데이터는 scripts/sources/masteria-content.json 에 출처와 함께 들어있다.
//
// 실행: node scripts/open-masteria-content.mjs                    (드라이런, 기본 소스 전부)
//       node scripts/open-masteria-content.mjs --apply            (실제 적용)
//       node scripts/open-masteria-content.mjs <소스.json> [...]  (특정 소스만)
//
// 소스를 여러 개 받는다 — 지역을 하나씩 열 때마다 scripts/sources/ 에 근거 파일을 추가하고
// 아래 DEFAULT_SOURCES 에 등록하면, 이 스크립트 하나로 누적 관리된다.
//
// 멱등하다 — 이미 반영된 항목은 건너뛰므로 여러 번 돌려도 안전하다.
// 적용 후 `node scripts/build-planet-data.mjs` 로 플래닛 쪽을 동기화할 것.
// (단, 플래닛에도 해당 지역이 있는지는 별도 확인이 필요해 플래닛 필터는 이 스크립트가 건드리지 않는다.)

import fs from "fs/promises";
import path from "path";

const APPLY = process.argv.includes("--apply");

const DEFAULT_SOURCES = [
  "scripts/sources/masteria-content.json", // 마스테리아 22종 (2026-09-29 적용)
  "scripts/sources/overseas-content.json", // 해외여행(대만/중국/태국) + 파퀘 + 마가티아 35종 (2026-09-29 적용)
  "scripts/sources/groupa-remainder-content.json", // groupA 잔여 중 메이플노트 수록+레벨일치 49종 (2026-09-30)
  "scripts/sources/itshim-spawn-maps.json", // 메랜닷컴 map_map_mobs 로 채운 출현 맵 65종 (2026-09-30, 개방 대상은 없음)
];

const sourceArgs = process.argv.slice(2).filter((a) => a.endsWith(".json"));
const SOURCES = (sourceArgs.length > 0 ? sourceArgs : DEFAULT_SOURCES).map((p) => path.resolve(p));
const RELEASE_FILTERS = path.resolve("data/release-filters.json");
const MONSTER_SPAWNS = path.resolve("data/monster-spawns.json");
const MONSTERS = path.resolve("data/monsters.json");

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function writeJson(p, data) {
  if (!APPLY) return;
  await fs.writeFile(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const monsters = await readJson(MONSTERS);
  const byCode = new Map(monsters.map((m) => [m.mobCode, m]));

  console.log(`모드: ${APPLY ? "APPLY (파일 수정)" : "DRY-RUN (미리보기)"}`);

  // 여러 소스 파일을 하나로 합친다 (없는 파일은 건너뜀 — 아직 안 만든 지역이 있을 수 있다)
  const src = { unblockMobCodes: [], spawns: {} };
  for (const p of SOURCES) {
    let one;
    try {
      one = await readJson(p);
    } catch {
      console.log(`  (소스 없음, 건너뜀) ${path.relative(process.cwd(), p)}`);
      continue;
    }
    console.log(`  소스: ${path.relative(process.cwd(), p)} — ${(one.unblockMobCodes ?? []).length}종, 수집 ${one._collectedAt ?? "?"}`);
    src.unblockMobCodes.push(...(one.unblockMobCodes ?? []));
    Object.assign(src.spawns, one.spawns ?? {});
  }
  src.unblockMobCodes = [...new Set(src.unblockMobCodes)];

  // ---------- 1) release-filters.json ----------
  const filters = await readJson(RELEASE_FILTERS);
  const allowed = new Set(filters.allowedMobCodes ?? []);
  const beforeCount = allowed.size;

  const added = [];
  const unknown = [];
  for (const code of src.unblockMobCodes ?? []) {
    if (!byCode.has(code)) {
      unknown.push(code);
      continue;
    }
    if (!allowed.has(code)) {
      allowed.add(code);
      added.push(code);
    }
  }
  if (unknown.length > 0) {
    console.warn(`[경고] data/monsters.json 에 없는 mobCode ${unknown.length}건 건너뜀: ${unknown.join(", ")}`);
  }
  filters.allowedMobCodes = [...allowed].sort((a, b) => a - b);

  // blockedMobCodes 에 명시적으로 막혀 있는 것도 풀어야 실제로 노출된다.
  // (스텀피 3220000 — 파일 최초 생성 때부터 막혀 있었는데 커밋에 사유가 없었고,
  //  GMS/92·메이플노트·메랜닷컴 셋 다 우리 데이터와 일치해 근거 없는 차단으로 판단했다.)
  const blockedBefore = (filters.blockedMobCodes ?? []).length;
  const unblockSet = new Set(src.unblockMobCodes);
  const stillBlocked = (filters.blockedMobCodes ?? []).filter((code) => {
    if (!unblockSet.has(code)) return true;
    const m = byCode.get(code);
    console.log(`   - blockedMobCodes 에서 해제: ${code} ${m?.name ?? "?"}`);
    return false;
  });
  filters.blockedMobCodes = stillBlocked;
  if (blockedBefore !== stillBlocked.length) {
    console.log(`[release-filters] blockedMobCodes ${blockedBefore} -> ${stillBlocked.length}`);
  }

  console.log(`\n[release-filters] allowedMobCodes ${beforeCount} -> ${filters.allowedMobCodes.length} (신규 ${added.length}종)`);
  for (const code of added) {
    const m = byCode.get(code);
    console.log(`   + ${code} ${m.name} (Lv${m.level}, ${m.region ?? "-"})`);
  }

  // ---------- 2) monster-spawns.json ----------
  const spawnsDoc = await readJson(MONSTER_SPAWNS);
  const rows = spawnsDoc.rows ?? [];
  const rowByCode = new Map(rows.map((r) => [r.mob_code, r]));

  let spawnAdded = 0;
  let spawnSkipped = 0;
  for (const [codeStr, maps] of Object.entries(src.spawns ?? {})) {
    const code = Number(codeStr);
    const m = byCode.get(code);
    if (!m) continue;
    // row 자체는 있는데 maps 가 빈 경우가 많다(784행 중 다수). 예전엔 row 존재만 보고 건너뛰어서
    // 스텀피의 출현 맵 3곳이 소스에 있는데도 반영되지 않았다 — 비어 있으면 채운다.
    const existing = rowByCode.get(code);
    if (existing) {
      if ((existing.maps ?? []).length > 0) {
        spawnSkipped++;
        continue;
      }
      existing.maps = maps.map((x) => ({ map_code: x.map_code, map_name: x.map_name }));
      spawnAdded++;
      console.log(`   + 스폰(기존 row 보강) ${code} ${m.name} -> ${maps.map((x) => x.map_name).join(", ")}`);
      continue;
    }
    rows.push({
      mob_code: code,
      mob_name: m.name,
      mob_name_en: m.name_en ?? "",
      maps: maps.map((x) => ({ map_code: x.map_code, map_name: x.map_name })),
    });
    spawnAdded++;
    console.log(`   + 스폰 ${code} ${m.name} -> ${maps.map((x) => x.map_name).join(", ")}`);
  }
  rows.sort((a, b) => a.mob_code - b.mob_code);
  spawnsDoc.rows = rows;
  spawnsDoc.count = rows.length;
  spawnsDoc.withMaps = rows.filter((r) => (r.maps ?? []).length > 0).length;
  spawnsDoc.withoutMaps = rows.length - spawnsDoc.withMaps;

  console.log(`\n[monster-spawns] rows ${rows.length}건 (신규 ${spawnAdded}, 이미 있음 ${spawnSkipped})`);

  // ---------- 결과 확인 ----------
  const nowVisible = src.unblockMobCodes.filter((c) => allowed.has(c)).length;
  console.log(`\n노출 대상 ${src.unblockMobCodes.length}종 중 ${nowVisible}종이 allowedMobCodes 에 포함됨`);

  await writeJson(RELEASE_FILTERS, filters);
  await writeJson(MONSTER_SPAWNS, spawnsDoc);

  console.log(
    APPLY
      ? "\n적용 완료. `node scripts/build-planet-data.mjs` 로 플래닛 동기화 후 로컬에서 확인할 것."
      : "\n드라이런이라 아무 파일도 건드리지 않았다. 적용하려면 --apply 를 붙일 것.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
