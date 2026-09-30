// drop-index.json 의 역인덱스(monstersByItemId) 형식 오류를 정정한다.
//
// 문제: 항목이 `{ mobId, prob }` 객체여야 하는데 **mobId 숫자 하나**로 들어간 게 84건 있었다.
// 발록(8830000)·카오스 혼테일(8810118) 드롭을 넣은 일회성 스크립트가 형식을 지키지 않은 탓이다.
// 이 상태면 화면에서 `entry.mobId`가 undefined 가 되고 `Number.isFinite` 필터에 걸려
// **해당 몬스터가 목록에서 사라진다** — 실제로 62개 아이템(발록 장비 전종, 카오스 혼테일의 목걸이)의
// "이 아이템을 드롭하는 몬스터"가 비어 있었다(2026-09-30 발견).
//
// 정방향(dropsByMonsterId)에는 제대로 들어있으므로 거기서 prob/min/max 를 되살려 붙인다.
//
// 실행: node scripts/fix-drop-index-shape.mjs           (드라이런)
//       node scripts/fix-drop-index-shape.mjs --apply   (실제 적용)
//
// 멱등하다. 메랜 원본을 고친 뒤 `node scripts/build-planet-data.mjs` 로 플래닛까지 동기화할 것.

import fs from "fs/promises";
import path from "path";

const APPLY = process.argv.includes("--apply");
const DROP_INDEX = path.resolve("data/drop-index.json");

async function main() {
  const di = JSON.parse(await fs.readFile(DROP_INDEX, "utf8"));
  const itemName = new Map(di.items.map((it) => [it.id, it.name]));

  // 정방향에서 (mobId, itemId) -> 보상 상세 를 만들어 둔다
  const forward = new Map();
  for (const [mobId, rewards] of Object.entries(di.dropsByMonsterId)) {
    for (const r of rewards ?? []) {
      forward.set(`${mobId}:${r.itemId}`, r);
    }
  }

  console.log(`모드: ${APPLY ? "APPLY (파일 수정)" : "DRY-RUN (미리보기)"}`);

  let fixed = 0;
  let withProb = 0;
  const touchedItems = new Set();
  for (const [itemId, entries] of Object.entries(di.monstersByItemId)) {
    if (!Array.isArray(entries)) continue;
    let changed = false;
    const next = entries.map((entry) => {
      if (typeof entry !== "number") return entry;
      const mobId = entry;
      const src = forward.get(`${mobId}:${itemId}`);
      const rebuilt = { mobId };
      if (src && typeof src.prob === "number") {
        rebuilt.prob = src.prob;
        withProb++;
      }
      if (src && typeof src.min === "number") rebuilt.min = src.min;
      if (src && typeof src.max === "number") rebuilt.max = src.max;
      changed = true;
      fixed++;
      touchedItems.add(itemId);
      return rebuilt;
    });
    if (changed) di.monstersByItemId[itemId] = next;
  }

  console.log(`\n[역인덱스 형식 정정] ${fixed}건 (아이템 ${touchedItems.size}종) — 그중 정방향에서 prob 복구 ${withProb}건`);
  for (const itemId of [...touchedItems].slice(0, 12)) {
    console.log(`   ${itemId} ${itemName.get(Number(itemId)) ?? "?"}`);
  }
  if (touchedItems.size > 12) console.log(`   ...외 ${touchedItems.size - 12}종`);

  // 남은 비정상 항목이 없는지 확인
  const leftover = [];
  for (const [itemId, entries] of Object.entries(di.monstersByItemId)) {
    for (const e of entries ?? []) {
      if (!e || typeof e !== "object") leftover.push(itemId);
    }
  }
  console.log(`정정 후 남은 비-객체 항목: ${leftover.length}건`);

  if (APPLY) {
    await fs.writeFile(DROP_INDEX, `${JSON.stringify(di, null, 2)}\n`, "utf8");
    console.log("\n적용 완료. `node scripts/build-planet-data.mjs` 로 플래닛 동기화할 것.");
  } else {
    console.log("\n드라이런이라 파일을 건드리지 않았다. 적용하려면 --apply 를 붙일 것.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
