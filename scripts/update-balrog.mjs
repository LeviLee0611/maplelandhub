/**
 * 마왕 발록 데이터 업데이트 (메이플랜드)
 *
 * - 배경: 기존 `monsters.json`엔 발록 본체(8830000)만 acc/eva/watk/matk 없이(0/placeholder)
 *   존재했고, 왼손(8830001)/오른손(8830002) 파츠는 아예 없었음. 사용자가 2026-07-16 패치로
 *   "마왕 발록" 원정대(신전의 밑바닥 NPC 무영, 레벨50~200, 6~15인)가 소개된 걸 보고 데이터
 *   전반 업데이트를 요청.
 * - 스탯 출처: maplestory.io KMS API(mob meta) — 8830000/8830001/8830002 세 mobCode 전부
 *   레벨70로 확인됨(공식 KMS 데이터). 커뮤니티 스크래핑 사이트(메이플노트 클래식)가 보여준
 *   "본체 레벨105/팔 레벨60·56"은 그 사이트 자체 태그 오류로 판단(다른 항목들과 달리 이번엔
 *   KMS 공식값과 어긋남) — HP는 3파츠 전부 KMS와 정확히 일치(4.28M/2.64M/3.06M)해서
 *   신뢰도 높은 쪽(KMS)을 채택. acc/eva는 스크랩 사이트에 없어 KMS 원작값(acc49/eva36)을
 *   잠정치로 사용(기존 카오스 자쿰과 동일한 방법론).
 * - 드롭: 본체(8830000) 무기 38종은 기존 유지. 패치노트가 콕 집어 언급한 "발록의 가죽/털가죽
 *   신발"(1072375/1072376, GMS 아이템 메타 확보)을 신규 추가 — 드롭 확률 출처가 없어 prob 필드는
 *   비움(UI "정보 없음"). 팔 2개는 스크랩 사이트 GET 섹션이 비어있어(카오스 시리즈 부위 패턴과
 *   동일) 드롭 연결 안 함.
 * - 신발 TUC(업그레이드 가능 횟수)는 GMS 원본이 6이지만, 메랜 7/16 패치노트가 "6→5회로 조정"을
 *   명시했으므로 5로 반영(메랜 전용 밸런스 변경, GMS 소스보다 패치노트 우선).
 *
 * 실행: node scripts/update-balrog.mjs
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");
const DROP_INDEX_PATH = path.resolve("data/drop-index.json");

const UPDATED_MONSTERS = [
  { name: "발록", level: 70, hp: 4280000, exp: 0, acc: 49, eva: 36, needAcc: 0, def: 25, mDef: 25, ele: ["무속성"], mobCode: 8830000, region: "보스", watk: 580, matk: 583, exist: true },
  { name: "발록(왼손)", level: 70, hp: 2640000, exp: 0, acc: 49, eva: 36, needAcc: 0, def: 25, mDef: 25, ele: ["무속성"], mobCode: 8830001, region: "보스", watk: 589, matk: 565, exist: true },
  { name: "발록(오른손)", level: 70, hp: 3060000, exp: 0, acc: 49, eva: 36, needAcc: 0, def: 25, mDef: 25, ele: ["무속성"], mobCode: 8830002, region: "보스", watk: 606, matk: 607, exist: true },
];

const NEW_ITEMS = [
  {
    id: 1072375,
    name: "발록의 가죽 신발",
    typeInfo: { overallCategory: "Equip", category: "Armor", subCategory: "Shoes", lowItemId: 1070000, highItemId: 1080000 },
    equipGroup: "Shoes",
    meta: {
      only: false,
      equip: {
        reqSTR: 0, reqDEX: 0, reqINT: 0, reqLUK: 0, reqJob: 0, reqLevel: 58, tuc: 5,
        incSTR: 3, incDEX: 3, incINT: 3, incLUK: 3, incPAD: 1, incMAD: 1,
        tradeBlock: true, notSale: true, islot: "So", vslot: "So", vslots: ["So"], islots: ["So"],
      },
      cash: { cash: false },
    },
  },
  {
    id: 1072376,
    name: "발록의 털가죽 신발",
    typeInfo: { overallCategory: "Equip", category: "Armor", subCategory: "Shoes", lowItemId: 1070000, highItemId: 1080000 },
    equipGroup: "Shoes",
    meta: {
      only: false,
      equip: {
        reqSTR: 0, reqDEX: 0, reqINT: 0, reqLUK: 0, reqJob: 0, reqLevel: 68, tuc: 5,
        incSTR: 3, incDEX: 3, incINT: 3, incLUK: 3, incPAD: 1, incMAD: 1,
        tradeBlock: true, notSale: true, islot: "So", vslot: "So", vslots: ["So"], islots: ["So"],
      },
      cash: { cash: false },
    },
  },
];

async function main() {
  const [monstersRaw, dropIndexRaw] = await Promise.all([
    fs.readFile(MONSTERS_PATH, "utf8"),
    fs.readFile(DROP_INDEX_PATH, "utf8"),
  ]);
  const monsters = JSON.parse(monstersRaw);
  const dropIndex = JSON.parse(dropIndexRaw);

  // 1. 몬스터 갱신/추가 (본체 스탯 교체 + 팔 2개 신규 추가)
  const updatedMobCodes = new Set(UPDATED_MONSTERS.map((m) => m.mobCode));
  const mergedMonsters = [...monsters.filter((m) => !updatedMobCodes.has(m.mobCode)), ...UPDATED_MONSTERS];

  // 2. 아이템 메타 추가 (이미 존재하면 교체)
  for (const item of NEW_ITEMS) {
    const idx = dropIndex.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) dropIndex.items[idx] = item;
    else dropIndex.items.push(item);
  }

  // 3. 드롭 연결 — 본체(8830000) 기존 무기 38종 유지 + 신발 2종 추가(확률 미상 → prob 생략)
  const bodyDrops = dropIndex.dropsByMonsterId["8830000"] ?? [];
  const alreadyLinked = new Set(bodyDrops.map((d) => d.itemId));
  const newDrops = NEW_ITEMS.filter((item) => !alreadyLinked.has(item.id)).map((item) => ({ itemId: item.id }));
  dropIndex.dropsByMonsterId["8830000"] = [...bodyDrops, ...newDrops];

  // 4. monstersByItemId 역인덱스 증분 반영
  if (dropIndex.monstersByItemId) {
    for (const item of NEW_ITEMS) {
      const list = dropIndex.monstersByItemId[item.id] ?? [];
      if (!list.includes(8830000)) list.push(8830000);
      dropIndex.monstersByItemId[item.id] = list;
    }
  }

  await fs.writeFile(MONSTERS_PATH, JSON.stringify(mergedMonsters, null, 2), "utf8");
  await fs.writeFile(DROP_INDEX_PATH, JSON.stringify(dropIndex, null, 2), "utf8");

  console.log(`Updated/added ${UPDATED_MONSTERS.length} Balrog monsters (body stat fix + 2 arms).`);
  console.log(`Added ${newDrops.length} new drops (shoes) to 8830000. Body now has ${dropIndex.dropsByMonsterId["8830000"].length} drops.`);
  console.log(`Total monsters.json: ${mergedMonsters.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
