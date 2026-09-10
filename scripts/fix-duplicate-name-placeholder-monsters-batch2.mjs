/**
 * 이름 중복 몬스터 "플레이스홀더" 2차 배치 — 53종 스탯 완성.
 *
 * - 배경: 1차 배치(fix-duplicate-name-placeholder-monsters.mjs)에서 예티/다크예티/페페/
 *   다크페페의 "변신/분리" 변종과 이름만 겹치는 별개 보스 4종, 총 10종을 mapledb.kr로
 *   확인·반영했음. 이번엔 73개 "혼합 그룹"(정상 스탯 1개 + acc=0/eva=0/def=mDef=10인
 *   플레이스홀더 1~3개)의 나머지 플레이스홀더 mobCode 84개 전부를 mapledb.kr에서
 *   기계적으로 조회(2026-09-09) — "물리 방어력" 라벨 존재 여부로 실제 몬스터 페이지인지
 *   판별(주의: 이 사이트는 존재하지 않는 mobCode도 홈페이지 폴백을 보여주는데 그 폴백에
 *   우연히 "LEVEL" 문자열이 있어서 단순 LEVEL 존재 여부로는 오탐 발생 — 실제 검증된
 *   테스트로 "물리 방어력" 라벨이 훨씬 신뢰도 높은 판별 기준임을 확인). 84개 중 53개가
 *   실제 몬스터 페이지로 확인됨 — 나머지 31개는 진짜로 mapledb.kr에도 없는 데이터라
 *   순수 더미(몬스터북 카드용 등)로 잠정 결론, 이번엔 손대지 않음.
 *
 * - 스탯 출처: mapledb.kr 원문 그대로(level/hp/exp/eva/needAcc/def/mDef/ele), 자동 파싱
 *   스크립트로 추출 후 육안 검증. acc는 mapledb.kr이 표시 안 하는 항목이라 원칙적으로
 *   0(미확인) — 단, 이미 확인된 "진짜" 형제 몬스터와 사실상 동일 개체로 보이는 그룹
 *   (예티/다크예티/페페/주니어 가고일 계열)은 형제의 acc를 그대로 차용(방어력 등
 *   나머지 스탯이 이미 확인된 개체와 정확히 일치해 근거 있음).
 *
 * 실행: node scripts/fix-duplicate-name-placeholder-monsters-batch2.mjs
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");

// mapledb.kr에서 확인한 값 그대로(level/exp/hp/def/mDef/eva/needAcc/ele).
const RAW_STATS = {
  8190005: { level: 110, exp: 4450, hp: 80000, def: 900, mDef: 600, eva: 38, needAcc: 5.07, ele: ["무속성"] },
  9000001: { level: 35, exp: 0, hp: 800, def: 30, mDef: 60, eva: 10, needAcc: 1.33, ele: ["독 반감"] },
  9000100: { level: 35, exp: 0, hp: 600, def: 50, mDef: 50, eva: 10, needAcc: 1.33, ele: ["불 반감", "얼음 약점"] },
  9000101: { level: 35, exp: 0, hp: 800, def: 30, mDef: 50, eva: 10, needAcc: 1.33, ele: ["무속성"] },
  9000200: { level: 35, exp: 0, hp: 800, def: 50, mDef: 50, eva: 18, needAcc: 2.40, ele: ["무속성"] },
  9000201: { level: 35, exp: 0, hp: 600, def: 30, mDef: 50, eva: 15, needAcc: 2.00, ele: ["성 약점"] },
  9200016: { level: 30, exp: 60, hp: 950, def: 38, mDef: 40, eva: 12, needAcc: 1.60, ele: ["무속성"] },
  9200022: { level: 60, exp: 420, hp: 7200, def: 210, mDef: 225, eva: 30, needAcc: 4.00, ele: ["얼음 반감", "불 약점"] },
  9300006: { level: 34, exp: 280, hp: 4300, def: 95, mDef: 95, eva: 14, needAcc: 1.87, ele: ["무속성"] },
  9300007: { level: 35, exp: 288, hp: 4900, def: 120, mDef: 150, eva: 15, needAcc: 2.00, ele: ["무속성"] },
  9300011: { level: 39, exp: 92, hp: 1920, def: 110, mDef: 130, eva: 18, needAcc: 2.40, ele: ["무속성"] },
  9300018: { level: 1, exp: 1, hp: 8, def: 0, mDef: 0, eva: 0, needAcc: 0, ele: ["무속성"] },
  9300033: { level: 62, exp: 430, hp: 15000, def: 250, mDef: 250, eva: 26, needAcc: 3.47, ele: ["무속성"] },
  9300061: { level: 30, exp: 0, hp: 5000, def: 0, mDef: 0, eva: 0, needAcc: 0, ele: ["무속성"] },
  9300127: { level: 30, exp: 110, hp: 1800, def: 70, mDef: 150, eva: 16, needAcc: 2.13, ele: ["전기 반감"] },
  9300128: { level: 30, exp: 113, hp: 1800, def: 100, mDef: 150, eva: 18, needAcc: 2.40, ele: ["전기 반감"] },
  9300129: { level: 30, exp: 115, hp: 1600, def: 120, mDef: 160, eva: 25, needAcc: 3.33, ele: ["전기 반감"] },
  9300130: { level: 30, exp: 113, hp: 2300, def: 110, mDef: 210, eva: 20, needAcc: 2.67, ele: ["전기 반감"] },
  9300131: { level: 39, exp: 115, hp: 2300, def: 110, mDef: 100, eva: 20, needAcc: 2.67, ele: ["전기 반감"] },
  9300132: { level: 30, exp: 117, hp: 2400, def: 210, mDef: 210, eva: 15, needAcc: 2.00, ele: ["전기 반감"] },
  9300134: { level: 30, exp: 135, hp: 3300, def: 210, mDef: 210, eva: 14, needAcc: 1.87, ele: ["전기 반감"] },
  9300135: { level: 30, exp: 153, hp: 3000, def: 160, mDef: 200, eva: 24, needAcc: 3.20, ele: ["전기 반감"] },
  9500107: { level: 30, exp: 60, hp: 950, def: 38, mDef: 40, eva: 12, needAcc: 1.60, ele: ["무속성"] },
  9500108: { level: 32, exp: 60, hp: 1200, def: 45, mDef: 40, eva: 12, needAcc: 1.60, ele: ["얼음 반감", "불 약점"] },
  9500109: { level: 32, exp: 65, hp: 1000, def: 65, mDef: 75, eva: 13, needAcc: 1.73, ele: ["무속성"] },
  9500110: { level: 35, exp: 72, hp: 1300, def: 100, mDef: 100, eva: 21, needAcc: 2.80, ele: ["성 반감"] },
  9500112: { level: 35, exp: 75, hp: 1400, def: 110, mDef: 100, eva: 18, needAcc: 2.40, ele: ["얼음 반감", "불 약점"] },
  9500113: { level: 36, exp: 77, hp: 1400, def: 95, mDef: 95, eva: 16, needAcc: 2.13, ele: ["무속성"] },
  9500114: { level: 38, exp: 85, hp: 1850, def: 120, mDef: 140, eva: 18, needAcc: 2.40, ele: ["무속성"] },
  9500115: { level: 37, exp: 80, hp: 1950, def: 100, mDef: 200, eva: 18, needAcc: 2.40, ele: ["전기 약점"] },
  9500116: { level: 40, exp: 90, hp: 1800, def: 70, mDef: 70, eva: 25, needAcc: 3.33, ele: ["성 약점"] },
  9500117: { level: 36, exp: 77, hp: 1350, def: 85, mDef: 105, eva: 17, needAcc: 2.27, ele: ["무속성"] },
  9500118: { level: 39, exp: 85, hp: 1900, def: 120, mDef: 130, eva: 17, needAcc: 2.27, ele: ["무속성"] },
  9500119: { level: 39, exp: 92, hp: 1920, def: 110, mDef: 130, eva: 18, needAcc: 2.40, ele: ["무속성"] },
  9500120: { level: 45, exp: 110, hp: 2600, def: 130, mDef: 110, eva: 14, needAcc: 1.87, ele: ["무속성"] },
  9500122: { level: 49, exp: 580, hp: 9000, def: 140, mDef: 250, eva: 25, needAcc: 3.33, ele: ["얼음 반감", "전기 반감", "불 반감", "성 반감"] },
  9500123: { level: 59, exp: 210, hp: 6000, def: 160, mDef: 220, eva: 20, needAcc: 2.67, ele: ["무속성"] },
  9500125: { level: 60, exp: 220, hp: 6000, def: 190, mDef: 220, eva: 22, needAcc: 2.93, ele: ["불 반감", "얼음 약점"] },
  9500126: { level: 64, exp: 250, hp: 7700, def: 200, mDef: 230, eva: 25, needAcc: 3.33, ele: ["얼음 반감", "불 약점"] },
  9500128: { level: 68, exp: 265, hp: 13000, def: 190, mDef: 270, eva: 26, needAcc: 3.47, ele: ["성 약점"] },
  9500129: { level: 70, exp: 270, hp: 15000, def: 250, mDef: 250, eva: 15, needAcc: 2.00, ele: ["독 면역"] },
  9500131: { level: 73, exp: 320, hp: 15500, def: 300, mDef: 320, eva: 28, needAcc: 3.73, ele: ["독 면역", "성 약점"] },
  9500132: { level: 75, exp: 350, hp: 16000, def: 800, mDef: 290, eva: 25, needAcc: 3.33, ele: ["무속성"] },
  9500134: { level: 80, exp: 850, hp: 27000, def: 650, mDef: 520, eva: 28, needAcc: 3.73, ele: ["얼음 반감", "불 약점"] },
  9500136: { level: 98, exp: 2600, hp: 58000, def: 845, mDef: 580, eva: 38, needAcc: 5.07, ele: ["불 반감", "전기 약점"] },
  9500141: { level: 65, exp: 455, hp: 11000, def: 170, mDef: 245, eva: 24, needAcc: 3.20, ele: ["얼음 반감", "불 약점"] },
  9500142: { level: 60, exp: 420, hp: 7200, def: 210, mDef: 225, eva: 30, needAcc: 4.00, ele: ["얼음 반감", "불 약점"] },
  9500161: { level: 80, exp: 850, hp: 27000, def: 650, mDef: 450, eva: 28, needAcc: 3.73, ele: ["독 약점"] },
  9500162: { level: 80, exp: 850, hp: 27000, def: 650, mDef: 450, eva: 28, needAcc: 3.73, ele: ["독 약점"] },
  9500163: { level: 83, exp: 1100, hp: 30000, def: 700, mDef: 465, eva: 27, needAcc: 3.60, ele: ["불 반감", "얼음 약점"] },
  9500164: { level: 88, exp: 1600, hp: 37000, def: 800, mDef: 495, eva: 28, needAcc: 3.73, ele: ["성 약점"] },
  9500165: { level: 88, exp: 1600, hp: 37000, def: 800, mDef: 495, eva: 28, needAcc: 3.73, ele: ["불 반감", "얼음 약점"] },
  9500166: { level: 88, exp: 1600, hp: 37000, def: 800, mDef: 495, eva: 28, needAcc: 3.73, ele: ["얼음 반감", "불 약점"] },
};

// 방어력 등 나머지 스탯이 "진짜" 형제 몬스터와 정확히 일치해 acc를 차용할 근거가 있는 경우만.
const ACC_FROM_SIBLING = {
  9500141: 89,  // 예티(6300000) 계열
  9500128: 96,  // 다크 예티(6400000) 계열
  9200022: 111, // 페페(6130102) 계열
  9500142: 111, // 페페(6130102) 계열
  9300033: 130, // 주니어 가고일(9300026)과 완전히 동일한 스탯
};

async function main() {
  const monstersRaw = await fs.readFile(MONSTERS_PATH, "utf8");
  const monsters = JSON.parse(monstersRaw);

  const lines = [];
  for (const [mobCodeStr, stats] of Object.entries(RAW_STATS)) {
    const mobCode = Number(mobCodeStr);
    const idx = monsters.findIndex((m) => m.mobCode === mobCode);
    if (idx < 0) {
      lines.push(`${mobCode}: 데이터에서 못 찾음, 건너뜀`);
      continue;
    }
    const before = { ...monsters[idx] };
    const acc = ACC_FROM_SIBLING[mobCode] ?? 0;
    monsters[idx] = { ...monsters[idx], ...stats, acc, exist: true };
    lines.push(`${mobCode} (${before.name}): eva ${before.eva}->${eva(monsters[idx])}, def ${before.def}->${monsters[idx].def}, acc ${before.acc}->${monsters[idx].acc}`);
  }

  function eva(m) { return m.eva; }

  await fs.writeFile(MONSTERS_PATH, `${JSON.stringify(monsters, null, 2)}\n`, "utf8");
  console.log(lines.join("\n"));
  console.log(`\n총 ${Object.keys(RAW_STATS).length}종 반영 완료.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
