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
 * - 2026-09-10 mobCode 재배정: 무루 5종에 처음 붙였던 100130~100134가 드랍 스크래핑 소스
 *   (data/item-detail-by.json)에서 이미 정체불명의 다른 몬스터가 쓰던 번호라, 무루 5종에
 *   스틸 풀 헬름 등 엉뚱한 장비 드랍이 붙는 충돌이 있었음. 어디와도 안 겹치는 9600300~9600304로
 *   재배정. 카탈로그/맵 소스는 여전히 옛 번호를 쓰므로 scripts/sources/mobcode-corrections.json의
 *   identityRemap이 정규 빌드에서 이를 흡수한다(그 파일 주석 참고).
 * - 2026-09-11 EXP 정정: maplestory.io의 프리빅뱅 포맷 스냅샷(GMS/80~92 — 방어력이 절대값으로
 *   나오는 버전, mobId 100130~134/9300383로 직접 조회)에서 관찰된 값과 대조한 결과 level/hp/acc/
 *   eva/def/mDef/watk는 전부 일치했지만 exp만 정확히 4배 차이(예: 무루파 24 vs 스냅샷 6)였음.
 *   원인 추적 결과 이 6종의 원래 소스인 monster-catalog-data.js의 exp 필드가 이미 플래닛 4배
 *   배율이 곱해진 값이었음(2026-07-08 세션에서 556종 중 346종이 "메랜원본×4=catalog"로 검증된
 *   바로 그 특성 — 이 6종은 당시 검증 대상에 없어 놓쳤던 것). 아래 NEW_MONSTERS의 exp는 그
 *   스냅샷 관찰값(1/1/6/9/15/18)으로 정정 — maplestory.io 자체가 메랜의 공식 소스는 아니므로
 *   "메랜이 실제로 이 값을 쓴다"는 확정이 아니라 근거가 가장 튼튼한 추정치라는 점은 유의.
 *   플래닛은 별도 오버라이드 없이 이 값을 그대로 상속한다 — exp 필드는 어느 서버 파일에도
 *   배율을 굽지 않는 게 이 코드베이스의 기존 규칙이라(달팽이 등 일반 몬스터로 확인, 4배는
 *   `scripts/sources/planet/divergence-overrides.json`의 `rateMultipliers.exp`에만 기록),
 *   플래닛에 4배 값을 오버라이드로 남기면 오히려 이 6종만 다른 744종과 다른 규칙을 갖게 됨.
 *
 * 실행: node scripts/add-aran-rien-monsters.mjs
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");
const DROP_INDEX_PATH = path.resolve("data/drop-index.json");

// exp는 maplestory.io 프리빅뱅 포맷 스냅샷(GMS/92, mobId 100130~134/9300383)에서 관찰한 값
// (2026-09-11) — 위 "2026-09-11 EXP 정정" 주석 참고. 나머지 필드는 그 스냅샷과 이미 일치.
const NEW_MONSTERS = [
  { name: "튜토리얼 무루", level: 1, hp: 8, exp: 1, acc: 20, eva: 0, needAcc: 0, def: 0, mDef: 0, ele: ["무속성"], mobCode: 9300383, region: "리엔", watk: 12, matk: 0, exist: true },
  { name: "무루", level: 1, hp: 8, exp: 1, acc: 20, eva: 0, needAcc: 0, def: 0, mDef: 0, ele: ["무속성"], mobCode: 9600300, region: "리엔", watk: 12, matk: 0, exist: true },
  { name: "무루파", level: 3, hp: 28, exp: 6, acc: 30, eva: 0, needAcc: 0, def: 0, mDef: 0, ele: ["무속성"], mobCode: 9600301, region: "리엔", watk: 21, matk: 0, exist: true },
  { name: "무루피아", level: 5, hp: 43, exp: 9, acc: 35, eva: 0, needAcc: 0, def: 3, mDef: 10, ele: ["무속성"], mobCode: 9600302, region: "리엔", watk: 28, matk: 0, exist: true },
  { name: "무루무루", level: 7, hp: 70, exp: 15, acc: 40, eva: 0, needAcc: 0, def: 5, mDef: 20, ele: ["무속성"], mobCode: 9600303, region: "리엔", watk: 36, matk: 0, exist: true },
  { name: "무루쿤", level: 9, hp: 95, exp: 18, acc: 42, eva: 1, needAcc: 0, def: 10, mDef: 15, ele: ["무속성"], mobCode: 9600304, region: "리엔", watk: 48, matk: 0, exist: true },
];

// mobCode -> 드롭 아이템 매핑 (몬스터당 1종, prob 없음)
const DROPS_BY_MOB_CODE = {
  9300383: 4032373,
  9600300: 4000493,
  9600301: 4000494,
  9600302: 4000495,
  9600303: 4000496,
  9600304: 4000497,
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
