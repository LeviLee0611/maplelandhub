/**
 * 발록(마왕 발록) 드롭테이블 보강
 *
 * - 배경: `update-balrog.mjs`로 본체 스탯/팔 2개 추가 후, 사용자가 "발록한테는 주문서 안 나오나?"
 *   질문. 메이플노트 클래식의 발록 GET 섹션 전체를 다시 정밀 스크래핑한 결과 기존에 반영한
 *   38건(무기 37 + 석양의 발록 주문서)에서 다음이 누락돼있었음을 확인:
 *   1) 무기류 58종 중 37종만 반영돼있었음 — maplestory.io KMS 아이템 검색(searchFor=발록)으로
 *      전체 58종(1200000~1599999 범위) 확정, 누락 21종 추가. 전부 동일 확률(0.09%)대인 걸
 *      기존 37종 확률과 대조해 확인.
 *   2) 백의 주문서 1%(2049000, 이미 아이템 카탈로그엔 있었으나 발록 드롭에 미연결) — 0.9%
 *   3) 혼돈의 주문서 60%(2049100, KMS "Chaos Scroll 60%" 범용 버전 — 카탈로그 신규 추가) — 0.05%
 *   4) 발록의 가죽조각(4001261, 카탈로그 신규 추가) — 0.06%
 * - 신발(1072375/1072376) 확률 정정: 이전 커밋에서 0.09%로 넣었으나, 재스크래핑한 전체 GET
 *   표를 보니 같은 항목이 "0.09%"(무기 tier 버킷에 잘못 낀 것으로 추정)와 "0%"(표 맨 끝, 확률
 *   미상 표시로 추정) 두 번 다르게 나옴 — 아이템 단위 상세페이지(item_detail)도 둘 다 "???"로
 *   표시해 확률 불명임을 재확인. 자쿰 나뭇가지 때와 동일하게 prob 필드를 비워 "정보 없음"으로
 *   되돌림(가짜 확률 대신 정직하게 미상 처리).
 *
 * 실행: node scripts/update-balrog-drops.mjs
 */

import fs from "fs/promises";
import path from "path";

const DROP_INDEX_PATH = path.resolve("data/drop-index.json");
const BODY_MOB_CODE = "8830000";

// KMS 공식 검색(searchFor=발록)으로 확정한 무기류 58종 중, 기존 37종에서 빠져있던 21종
const MISSING_WEAPON_ITEM_IDS = [
  1212022, 1212023, 1222022, 1222023, 1232022, 1232023, 1242022, 1242023,
  1342019, 1342020, 1362027, 1362028, 1372051,
  1422042, 1422043, 1442074, 1442075,
  1522052, 1522053, 1532022, 1532023,
];
const WEAPON_PROB = 0.0009; // 0.09%, 기존 37종과 동일 확률대

const NEW_CATALOG_ITEMS = [
  { id: 2049100, name: "혼돈의 주문서 60%" },
  { id: 4001261, name: "발록의 가죽조각" },
];

const EXTRA_DROPS = [
  { itemId: 2049000, prob: 0.009 }, // 백의 주문서 1% (카탈로그엔 이미 존재, 드롭 연결만 추가)
  { itemId: 2049100, prob: 0.0005 }, // 혼돈의 주문서 60%
  { itemId: 4001261, prob: 0.0006 }, // 발록의 가죽조각
];

const SHOE_ITEM_IDS = [1072375, 1072376];

async function main() {
  const dropIndexRaw = await fs.readFile(DROP_INDEX_PATH, "utf8");
  const dropIndex = JSON.parse(dropIndexRaw);

  // 1. 카탈로그에 없는 아이템 메타 추가
  for (const item of NEW_CATALOG_ITEMS) {
    const idx = dropIndex.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) dropIndex.items[idx] = item;
    else dropIndex.items.push(item);
  }

  // 2. 본체 드롭 목록 갱신: 신발 prob 제거(정보 없음) + 누락 무기 21종 + 신규 드롭 3종 추가
  const body = dropIndex.dropsByMonsterId[BODY_MOB_CODE] ?? [];
  const linkedIds = new Set(body.map((d) => d.itemId));

  const fixedBody = body.map((d) =>
    SHOE_ITEM_IDS.includes(d.itemId) ? { itemId: d.itemId } : d,
  );

  const newWeaponDrops = MISSING_WEAPON_ITEM_IDS.filter((id) => !linkedIds.has(id)).map((id) => ({
    itemId: id,
    prob: WEAPON_PROB,
  }));
  const newExtraDrops = EXTRA_DROPS.filter((d) => !linkedIds.has(d.itemId));

  dropIndex.dropsByMonsterId[BODY_MOB_CODE] = [...fixedBody, ...newWeaponDrops, ...newExtraDrops];

  // 3. monstersByItemId 역인덱스 증분 반영
  if (dropIndex.monstersByItemId) {
    for (const drop of [...newWeaponDrops, ...newExtraDrops]) {
      const list = dropIndex.monstersByItemId[drop.itemId] ?? [];
      if (!list.includes(8830000)) list.push(8830000);
      dropIndex.monstersByItemId[drop.itemId] = list;
    }
  }

  await fs.writeFile(DROP_INDEX_PATH, JSON.stringify(dropIndex, null, 2), "utf8");

  console.log(`Added ${newWeaponDrops.length} missing weapon drops.`);
  console.log(`Added ${newExtraDrops.length} scroll/material drops.`);
  console.log(`Reset prob to "unknown" for ${SHOE_ITEM_IDS.length} shoe items.`);
  console.log(`Body (${BODY_MOB_CODE}) now has ${dropIndex.dropsByMonsterId[BODY_MOB_CODE].length} total drops.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
