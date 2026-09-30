// 데이터 위생 정리 — 전수 감사(2026-09-30)에서 나온 자잘한 오류를 고친다.
//
//   ① 같은 몬스터가 같은 아이템을 두 번 드롭하는 중복 항목
//      피아누스 좌/우(8510000·8520000)에서 8건. prob 은 같고 한쪽만 min/max 를 갖고 있어,
//      정보가 더 많은 쪽을 남기고 나머지를 지운다. 드롭 목록에 같은 아이템이 두 줄로 보이던 문제.
//      (DEVLOG 2026-07-21 의 "카오스 혼테일 목걸이 중복 드랍"과 같은 성격 — 일회성 스크립트 재실행 흔적)
//
//   ② 몬스터 이름 앞뒤 공백
//      "데비존의 늙은 도라지 ", "데비존의 더 사나운 크루 " 처럼 꼬리 공백이 붙어 있으면
//      이름 기반 검색·정렬이 어긋난다.
//
// 실행: node scripts/fix-data-hygiene.mjs           (드라이런)
//       node scripts/fix-data-hygiene.mjs --apply   (실제 적용)
//
// 멱등하다. 적용 후 `node scripts/build-planet-data.mjs` 로 플래닛까지 동기화할 것.

import fs from "fs/promises";
import path from "path";

const APPLY = process.argv.includes("--apply");
const DROP_INDEX = path.resolve("data/drop-index.json");
const MONSTERS = path.resolve("data/monsters.json");

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

/** 정보가 더 많은 쪽(min/max/prob 을 더 가진 쪽)을 남긴다. */
function richness(entry) {
  return ["prob", "min", "max"].filter((k) => entry[k] !== undefined).length;
}

async function main() {
  console.log(`모드: ${APPLY ? "APPLY (파일 수정)" : "DRY-RUN (미리보기)"}`);

  // ── ① 중복 드롭 제거
  const di = await readJson(DROP_INDEX);
  const itemName = new Map(di.items.map((it) => [it.id, it.name]));
  let removed = 0;
  for (const [mobId, rewards] of Object.entries(di.dropsByMonsterId)) {
    if (!Array.isArray(rewards)) continue;
    const best = new Map();
    for (const r of rewards) {
      const prev = best.get(r.itemId);
      if (!prev || richness(r) > richness(prev)) best.set(r.itemId, r);
    }
    if (best.size === rewards.length) continue;
    const dropped = rewards.length - best.size;
    removed += dropped;
    console.log(`   [중복드롭] ${mobId}: ${rewards.length} -> ${best.size}종`);
    for (const r of rewards) {
      const kept = best.get(r.itemId);
      if (kept !== r) console.log(`        - ${r.itemId} ${itemName.get(r.itemId) ?? "?"}`);
    }
    // 원래 순서를 유지한다 (드롭 목록 정렬이 바뀌지 않도록)
    di.dropsByMonsterId[mobId] = rewards.filter((r) => best.get(r.itemId) === r);
  }
  console.log(`\n[① 중복 드롭 제거] ${removed}건`);

  // ── ①-2 prob 이 0 인 드롭에서 prob 필드 제거
  // 게임에 확률 0%인 드롭은 없다 — 원본에 값이 없어 0으로 들어온 것이다.
  // 필드를 지우면 화면이 "정보 없음"으로 표시한다(0.00% 라고 단정하지 않도록).
  let zeroed = 0;
  for (const [mobId, rewards] of Object.entries(di.dropsByMonsterId)) {
    for (const r of rewards ?? []) {
      if (r.prob === 0) {
        delete r.prob;
        zeroed++;
        console.log(`   [prob=0 제거] ${mobId} -> ${r.itemId} ${itemName.get(r.itemId) ?? "?"}`);
      }
    }
  }
  for (const entries of Object.values(di.monstersByItemId)) {
    for (const e of entries ?? []) {
      if (e && typeof e === "object" && e.prob === 0) {
        delete e.prob;
        zeroed++;
      }
    }
  }
  console.log(`\n[①-2 prob=0 제거] ${zeroed}건`);

  // ── ② 몬스터 이름 공백 정리
  const monsters = await readJson(MONSTERS);
  let trimmed = 0;
  for (const m of monsters) {
    if (typeof m.name !== "string") continue;
    const t = m.name.trim();
    if (t === m.name) continue;
    console.log(`   [이름공백] ${m.mobCode}: ${JSON.stringify(m.name)} -> ${JSON.stringify(t)}`);
    m.name = t;
    trimmed++;
  }
  console.log(`\n[② 이름 앞뒤 공백 정리] ${trimmed}건`);

  if (APPLY) {
    await fs.writeFile(DROP_INDEX, `${JSON.stringify(di, null, 2)}\n`, "utf8");
    await fs.writeFile(MONSTERS, `${JSON.stringify(monsters, null, 2)}\n`, "utf8");
    console.log("\n적용 완료. `node scripts/build-planet-data.mjs` 로 플래닛 동기화할 것.");
  } else {
    console.log("\n드라이런이라 파일을 건드리지 않았다. 적용하려면 --apply 를 붙일 것.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
