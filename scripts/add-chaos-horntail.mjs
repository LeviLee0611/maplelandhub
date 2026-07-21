/**
 * 카오스 혼테일 추가 (메이플랜드)
 *
 * - 스탯 출처: maplestory.io KMS API (mob meta) — 혼테일은 기존 몬스터(8810018/8810003)의
 *   KMS 수치가 이미 메랜 실측치와 정확히 일치함을 확인(자쿰과 달리 레벨 스케일링 차이 없음).
 * - 드롭 출처: 메이플노트 클래식 사이트엔 카오스 혼테일 전용 드롭 데이터가 없어(통합 카드/부위
 *   페이지 전부 GET 섹션 비어있음), 일반 혼테일(8810018 본체 + 8810003 머리B) 드롭을 그대로 재사용.
 *   단, "혼테일의 목걸이"(1122000)는 실제 게임에서 이지/노멀 전용, "카오스 혼테일의 목걸이"(1122076)는
 *   카오스 전용으로 서로 배타적임을 웹 검색으로 확인 — 카오스 쪽엔 정규 목걸이를 제외하고 카오스
 *   목걸이만 부여함. 카오스 목걸이는 신규 확정 아이템으로 추가하되 확률 소스가 없어 prob 필드는
 *   비움(UI에서 "정보 없음" 표시).
 *
 * 실행: node scripts/add-chaos-horntail.mjs
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");
const DROP_INDEX_PATH = path.resolve("data/drop-index.json");

const NEW_MONSTERS = [
  { name: "카오스 혼테일의 왼쪽 머리", level: 160, hp: 1650000000, exp: 389281, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810100, region: "보스", watk: 20900, matk: 7700, exist: true },
  { name: "카오스 혼테일의 오른쪽 머리", level: 160, hp: 1650000000, exp: 389281, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810101, region: "보스", watk: 20900, matk: 7700, exist: true },
  { name: "카오스 혼테일의 머리 A", level: 160, hp: 1650000000, exp: 1112232, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810102, region: "보스", watk: 20900, matk: 7700, exist: true },
  { name: "카오스 혼테일의 머리 B", level: 160, hp: 1950000000, exp: 2302117, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810103, region: "보스", watk: 24500, matk: 8100, exist: true },
  { name: "카오스 혼테일의 머리 C", level: 160, hp: 1650000000, exp: 1112232, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810104, region: "보스", watk: 20900, matk: 7700, exist: true },
  { name: "카오스 혼테일의 왼손", level: 160, hp: 1150000000, exp: 775192, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810105, region: "보스", watk: 10600, matk: 3100, exist: true },
  { name: "카오스 혼테일의 오른손", level: 160, hp: 1150000000, exp: 775192, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810106, region: "보스", watk: 10600, matk: 3100, exist: true },
  { name: "카오스 혼테일의 날개", level: 160, hp: 1350000000, exp: 910008, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810107, region: "보스", watk: 10100, matk: 3400, exist: true },
  { name: "카오스 혼테일의 다리", level: 160, hp: 650000000, exp: 438152, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810108, region: "보스", watk: 15500, matk: 3600, exist: true },
  { name: "카오스 혼테일의 꼬리", level: 160, hp: 450000000, exp: 269632, acc: 650, eva: 169, needAcc: 0, def: 50, mDef: 50, ele: ["무속성"], mobCode: 8810109, region: "보스", watk: 25900, matk: 3700, exist: true },
  { name: "카오스 혼테일", level: 160, hp: 2000000000, exp: 0, acc: 650, eva: 169, needAcc: 0, def: 25, mDef: 25, ele: ["무속성"], mobCode: 8810118, region: "보스", watk: 5812, matk: 5590, exist: true },
];

const NEW_ITEM = {
  id: 1122076,
  name: "카오스 혼테일의 목걸이",
  typeInfo: { overallCategory: "Equip", category: "Accessory", subCategory: "Pendant", lowItemId: 1120000, highItemId: 1130000 },
  equipGroup: "Accessory",
  meta: {
    only: false,
    equip: {
      reqSTR: 0, reqDEX: 0, reqINT: 0, reqLUK: 0, reqJob: 0, reqLevel: 120, tuc: 3,
      incSTR: 10, incDEX: 10, incINT: 10, incLUK: 10, incPAD: 2, incMAD: 2, incPDD: 140, incMDD: 140, incEVA: 32,
      tradeBlock: true, islot: "Pe", vslot: "Pe", vslots: ["Pe"], islots: ["Pe"],
    },
    cash: { cash: false },
    shop: { price: 150000 },
  },
};

async function main() {
  const [monstersRaw, dropIndexRaw] = await Promise.all([
    fs.readFile(MONSTERS_PATH, "utf8"),
    fs.readFile(DROP_INDEX_PATH, "utf8"),
  ]);
  const monsters = JSON.parse(monstersRaw);
  const dropIndex = JSON.parse(dropIndexRaw);

  // 1. 몬스터 추가 (이미 존재하면 교체)
  const newMobCodes = new Set(NEW_MONSTERS.map((m) => m.mobCode));
  const mergedMonsters = [...monsters.filter((m) => !newMobCodes.has(m.mobCode)), ...NEW_MONSTERS];

  // 2. 아이템 메타 추가 (이미 존재하면 교체)
  const existingItemIdx = dropIndex.items.findIndex((i) => i.id === NEW_ITEM.id);
  if (existingItemIdx >= 0) dropIndex.items[existingItemIdx] = NEW_ITEM;
  else dropIndex.items.push(NEW_ITEM);

  // 3. 드롭 연결
  //   - 일반 혼테일 본체(8810018) 드롭 -> 카오스 혼테일 통합 카드(8810118)에 재사용 (단, 이지/노멀 전용인
  //     정규 목걸이 1122000은 제외) + 카오스 전용 목걸이 추가
  //   - 일반 혼테일 머리B(8810003) 드롭 -> 카오스 혼테일 머리B(8810103)에 재사용
  const REGULAR_NECKLACE_ID = 1122000;
  const bodyDrops = (dropIndex.dropsByMonsterId["8810018"] ?? []).filter((d) => d.itemId !== REGULAR_NECKLACE_ID);
  const headBDrops = dropIndex.dropsByMonsterId["8810003"] ?? [];

  dropIndex.dropsByMonsterId["8810118"] = [...bodyDrops, { itemId: NEW_ITEM.id }];
  dropIndex.dropsByMonsterId["8810103"] = [...headBDrops];

  // 4. monstersByItemId 재계산 없이 증분 반영 (해당 필드가 있을 경우)
  if (dropIndex.monstersByItemId) {
    // 이전 실행에서 잘못 붙은 8810118 <-> 정규 목걸이(1122000) 역인덱스 정리
    const staleNecklaceList = dropIndex.monstersByItemId[REGULAR_NECKLACE_ID];
    if (Array.isArray(staleNecklaceList)) {
      dropIndex.monstersByItemId[REGULAR_NECKLACE_ID] = staleNecklaceList.filter((id) => id !== 8810118);
    }
    for (const drop of bodyDrops) {
      const list = dropIndex.monstersByItemId[drop.itemId] ?? [];
      if (!list.includes(8810118)) list.push(8810118);
      dropIndex.monstersByItemId[drop.itemId] = list;
    }
    for (const drop of headBDrops) {
      const list = dropIndex.monstersByItemId[drop.itemId] ?? [];
      if (!list.includes(8810103)) list.push(8810103);
      dropIndex.monstersByItemId[drop.itemId] = list;
    }
    const necklaceList = dropIndex.monstersByItemId[NEW_ITEM.id] ?? [];
    if (!necklaceList.includes(8810118)) necklaceList.push(8810118);
    dropIndex.monstersByItemId[NEW_ITEM.id] = necklaceList;
  }

  await fs.writeFile(MONSTERS_PATH, JSON.stringify(mergedMonsters, null, 2), "utf8");
  await fs.writeFile(DROP_INDEX_PATH, JSON.stringify(dropIndex, null, 2), "utf8");

  console.log(`Added ${NEW_MONSTERS.length} Chaos Horntail monsters.`);
  console.log(`Attached ${bodyDrops.length + 1} drops to 8810118 (body+necklace), ${headBDrops.length} drops to 8810103 (headB).`);
  console.log(`Total monsters.json: ${mergedMonsters.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
