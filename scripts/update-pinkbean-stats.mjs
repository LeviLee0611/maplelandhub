/**
 * 핑크빈(8820001) 데이터 정정 (메이플랜드)
 *
 * - 배경: TODO.md에 "핑크빈 EXP 미해결"로 3자 불일치(조아요 5,000만 vs catalog 2억 vs
 *   메랜 원본×4배율 2,516만)가 기록돼있었음. 2026-08-20 재조사 결과, 불일치의 원인이
 *   메랜 원본(`data/monsters.json`) 자체가 낡은 값이었기 때문으로 확인됨.
 * - 스탯 출처: 메랜 전용 사이트 3곳 교차검증 — maplelandzzul.gg, 메이플노트 클래식
 *   (xn--o80b01o9mlw3kdzc.com), 웹 검색 종합(인벤 등)이 전부 EXP 5,000만·물리방어 1,700·
 *   마법방어 1,930으로 일치(기존 저장값: EXP 629만·방어 70/70). HP(21억)는 기존값과
 *   정확히 일치해 같은 몬스터를 가리키는 게 확실함. 우리 자체 드롭테이블에도 핑크빈
 *   드롭 78종(리버스 등급 장비 포함)이 이미 존재해 "출시 전" 몬스터가 아니라 라이브
 *   콘텐츠임도 확인(namu.wiki 검색 스니펫의 "출시 예정" 표기는 오래된 리비전으로 판단).
 * - 근거 보강: 수정된 메랜 원본 EXP(5,000만)에 플래닛 표준 4배율
 *   (`scripts/sources/planet/divergence-overrides.json`의 `rateMultipliers.exp`)을 적용하면
 *   5,000만×4=2억 — TODO에 있던 catalog 값(2억)과 정확히 일치. 우연으로 보기엔 너무 정확해
 *   "메랜 원본이 낡았고 catalog가 처음부터 맞았다"는 결론에 신뢰도를 더함.
 * - acc/eva는 이번 조사에서 확실한 소스를 못 찾아 기존값(0/0) 유지 — 근거 없는 수치는
 *   추정하지 않는다는 원칙(data.md) 그대로 적용.
 *
 * 실행: node scripts/update-pinkbean-stats.mjs
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");
const MOB_CODE = 8820001;

const PATCH = {
  exp: 50000000,
  def: 1700,
  mDef: 1930,
};

async function main() {
  const monstersRaw = await fs.readFile(MONSTERS_PATH, "utf8");
  const monsters = JSON.parse(monstersRaw);

  const idx = monsters.findIndex((m) => m.mobCode === MOB_CODE);
  if (idx < 0) {
    throw new Error(`mobCode ${MOB_CODE}(핑크빈)를 data/monsters.json에서 찾지 못함`);
  }

  const before = { ...monsters[idx] };
  monsters[idx] = { ...monsters[idx], ...PATCH };

  await fs.writeFile(MONSTERS_PATH, JSON.stringify(monsters, null, 2), "utf8");

  console.log("핑크빈(8820001) 정정 완료:");
  console.log(`  exp: ${before.exp} -> ${monsters[idx].exp}`);
  console.log(`  def: ${before.def} -> ${monsters[idx].def}`);
  console.log(`  mDef: ${before.mDef} -> ${monsters[idx].mDef}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
