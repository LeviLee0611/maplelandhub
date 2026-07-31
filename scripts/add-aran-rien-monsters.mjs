/**
 * 아란-리엔 튜토리얼/초반 몬스터 6종 추가 (메이플랜드)
 *
 * - 배경: 이전 세션에서 카탈로그(data/planet/monsters.json, monster-catalog-data.js 유래) 값과
 *   maplestory.io KMS/389 라이브 API 값이 불일치해 중단됨. 검토 결과 카탈로그 값을 채택하기로
 *   확정 — 이 서버들(메이플랜드/메이플플래닛)은 프리빅뱅(KMS 1.2.9x) 기반인데, 카탈로그 값은
 *   레벨별 명중(acc) 스케일링·물리몹 matk=0 등 프리빅뱅 특징과 일치하는 반면, KMS/389 라이브 값은
 *   포스트빅뱅 재조정(명중 스케일링 소실, 물리몹에도 마공 부여) 특징을 보여 시대가 맞지 않음.
 *   카탈로그 값은 이미 data/planet/monsters.json에 배포돼있어 일관성도 있음.
 * - 리엔은 메랜 원본(data/monsters.json)에 아직 없는 신규 지역이라 region: "리엔"으로 통일
 *   (기존 region 필드는 "엘나스" 등 광역 지역명 컨벤션 — 구체적 맵 이름은 별도 관리 안 함).
 * - 드롭: 몬스터당 전용 아이템 1종("~의 털뭉치")만 연결. 확률 출처가 없어 prob 필드는 비움
 *   (UI에서 "정보 없음" 표시). 아이템 메타는 maplestory.io KMS/389 API로 이름 확인 후 등록.
 *
 * 실행: node scripts/add-aran-rien-monsters.mjs
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");
const DROP_INDEX_PATH = path.resolve("data/drop-index.json");

const NEW_MONSTERS = [
  { name: "튜토리얼 무루", level: 1, hp: 8, exp: 4, acc: 20, eva: 0, needAcc: 0, def: 0, mDef: 0, ele: ["무속성"], mobCode: 9300383, region: "리엔", watk: 12, matk: 0, exist: true },
  { name: "무루", level: 1, hp: 8, exp: 4, acc: 20, eva: 0, needAcc: 0, def: 0, mDef: 0, ele: ["무속성"], mobCode: 100130, region: "리엔", watk: 12, matk: 0, exist: true },
  { name: "무루파", level: 3, hp: 28, exp: 24, acc: 30, eva: 0, needAcc: 0, def: 0, mDef: 0, ele: ["무속성"], mobCode: 100131, region: "리엔", watk: 21, matk: 0, exist: true },
  { name: "무루피아", level: 5, hp: 43, exp: 36, acc: 35, eva: 0, needAcc: 0, def: 3, mDef: 10, ele: ["무속성"], mobCode: 100132, region: "리엔", watk: 28, matk: 0, exist: true },
  { name: "무루무루", level: 7, hp: 70, exp: 60, acc: 40, eva: 0, needAcc: 0, def: 5, mDef: 20, ele: ["무속성"], mobCode: 100133, region: "리엔", watk: 36, matk: 0, exist: true },
  { name: "무루쿤", level: 9, hp: 95, exp: 72, acc: 42, eva: 1, needAcc: 0, def: 10, mDef: 15, ele: ["무속성"], mobCode: 100134, region: "리엔", watk: 48, matk: 0, exist: true },
];

// mobCode -> 드롭 아이템 매핑 (몬스터당 1종, prob 없음)
const DROPS_BY_MOB_CODE = {
  9300383: 4032373,
  100130: 4000493,
  100131: 4000494,
  100132: 4000495,
  100133: 4000496,
  100134: 4000497,
};

// maplestory.io KMS/389 API로 확인한 아이템 메타 (이름 일치 확인 완료)
const NEW_ITEMS = [
  { id: 4032373, name: "튜토리얼 무루의 털뭉치", typeInfo: { overallCategory: "Etc", category: "Other", subCategory: "Quest Item", lowItemId: 4030000, highItemId: 4040000 }, meta: { only: false, shop: { price: 1 } } },
  { id: 4000493, name: "무루의 털뭉치", typeInfo: { overallCategory: "Etc", category: "Other", subCategory: "Monster Drop", lowItemId: 4000000, highItemId: 4010000 }, meta: { only: false, shop: { price: 1 } } },
  { id: 4000494, name: "무루파의 털뭉치", typeInfo: { overallCategory: "Etc", category: "Other", subCategory: "Monster Drop", lowItemId: 4000000, highItemId: 4010000 }, meta: { only: false, shop: { price: 1 } } },
  { id: 4000495, name: "무루피아의 털뭉치", typeInfo: { overallCategory: "Etc", category: "Other", subCategory: "Monster Drop", lowItemId: 4000000, highItemId: 4010000 }, meta: { only: false, shop: { price: 1 } } },
  { id: 4000496, name: "무루무루의 털뭉치", typeInfo: { overallCategory: "Etc", category: "Other", subCategory: "Monster Drop", lowItemId: 4000000, highItemId: 4010000 }, meta: { only: false, shop: { price: 1 } } },
  { id: 4000497, name: "무루쿤의 털뭉치", typeInfo: { overallCategory: "Etc", category: "Other", subCategory: "Monster Drop", lowItemId: 4000000, highItemId: 4010000 }, meta: { only: false, shop: { price: 1 } } },
];

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
  for (const item of NEW_ITEMS) {
    const idx = dropIndex.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) dropIndex.items[idx] = item;
    else dropIndex.items.push(item);
  }

  // 3. 드롭 연결 (dropsByMonsterId) — prob 없음
  for (const [mobCodeStr, itemId] of Object.entries(DROPS_BY_MOB_CODE)) {
    dropIndex.dropsByMonsterId[mobCodeStr] = [{ itemId }];
  }

  // 4. monstersByItemId 역인덱스 증분 반영 ({ mobId, prob? } 객체 형태 — 기존 스크립트들의
  //    raw-number push 버그를 반복하지 않도록 정확한 스키마로 채움)
  if (dropIndex.monstersByItemId) {
    for (const [mobCodeStr, itemId] of Object.entries(DROPS_BY_MOB_CODE)) {
      const mobId = Number(mobCodeStr);
      const list = dropIndex.monstersByItemId[itemId] ?? [];
      if (!list.some((entry) => entry && typeof entry === "object" && entry.mobId === mobId)) {
        list.push({ mobId });
      }
      dropIndex.monstersByItemId[itemId] = list;
    }
  }

  await fs.writeFile(MONSTERS_PATH, JSON.stringify(mergedMonsters, null, 2), "utf8");
  await fs.writeFile(DROP_INDEX_PATH, JSON.stringify(dropIndex, null, 2), "utf8");

  console.log(`Added ${NEW_MONSTERS.length} Aran/Rien monsters.`);
  console.log(`Added ${NEW_ITEMS.length} item catalog entries.`);
  console.log(`Linked ${Object.keys(DROPS_BY_MOB_CODE).length} drops (no prob).`);
  console.log(`Total monsters.json: ${mergedMonsters.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
