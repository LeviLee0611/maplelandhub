/**
 * 길드대항전(샤레니안) 신규 몬스터 5종 추가 — 다크 머슬스톤, 사자석상 A/B, 기사석상 A/B (메이플랜드)
 *
 * - 배경: 2026-08-21 패치로 "재추가"된 길드대항전(빅뱅 이전 원작 콘텐츠) 몬스터 14종 중
 *   9종(악마 슬라임/머슬스톤/마스터 머슬스톤/퍼펫골렘/미스트 나이트/블랙 나이트/가고일/
 *   주니어 가고일/에레고스, mobCode 9300019~9300028 중 일부)은 이미 완전한 스탯으로
 *   data/monsters.json에 들어있었으나(출처 불명, 아마 mapledb.kr), 나머지 5종은 미확보 상태로
 *   TODO.md에 남아있었음. mobCode가 9300019~9300028 구간에 몰려있고 9300021만 비어있는 걸
 *   보고 "다크 머슬스톤=9300021"로 추정, mapledb.kr에서 9300021/9300029~9300032를 직접
 *   조회해 5종 전부 확인함(2026-09-09).
 * - 스탯 출처: mapledb.kr(메랜디비) 직접 조회, 명중률(acc)은 사이트에 표시 안 됨(0 처리 —
 *   이 데이터셋 전반의 기존 acc 공백 패턴과 동일, 근거 없이 추정하지 않음).
 *   사자석상 A/B, 기사석상 A/B는 각각 HP만 다르고 나머지 스탯(def/mDef/eva/needAcc)이
 *   완전히 동일 — namu.wiki 스니펫("A와 B는 스킬과 체력만 다르다")과 일치해 신뢰도 확인.
 *   다크 머슬스톤은 레벨200/HP9,999,999/방어1,999/회피999처럼 극단적으로 둥근 수치인데,
 *   "신념의 방"(길드대항전 던전 내 특정 방)에 배치된 것으로 봐서 실제로 잡으라고 만든
 *   몬스터가 아니라 진행을 막는 장애물/벽 몬스터일 가능성이 높음 — mapledb.kr 원문 그대로
 *   반영(추정치 아님, 사이트 표시값 그대로).
 * - watk/matk: mapledb.kr 페이지에 물리/마법 데미지 항목 자체가 없어 0 유지(미확인).
 * - 드롭 데이터는 이번 스코프 밖(TODO.md에 별도 항목으로 유지).
 *
 * 실행: node scripts/add-sharenian-statue-monsters.mjs
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");
const REGION = "샤레니안";
const FIVE_ELEMENT_RESIST = ["얼음 반감", "불 반감", "전기 반감", "성 반감", "독 반감"];

const NEW_MONSTERS = [
  {
    name: "다크 머슬스톤",
    level: 200,
    hp: 9999999,
    exp: 0,
    acc: 0,
    eva: 999,
    needAcc: 999,
    def: 1999,
    mDef: 1999,
    ele: FIVE_ELEMENT_RESIST,
    mobCode: 9300021,
    region: REGION,
    watk: 0,
    matk: 0,
    exist: true,
  },
  {
    name: "사자석상 A",
    level: 99,
    hp: 1000000,
    exp: 0,
    acc: 0,
    eva: 13,
    needAcc: 210,
    def: 800,
    mDef: 850,
    ele: FIVE_ELEMENT_RESIST,
    mobCode: 9300029,
    region: REGION,
    watk: 0,
    matk: 0,
    exist: true,
  },
  {
    name: "사자석상 B",
    level: 99,
    hp: 800000,
    exp: 0,
    acc: 0,
    eva: 13,
    needAcc: 210,
    def: 800,
    mDef: 850,
    ele: FIVE_ELEMENT_RESIST,
    mobCode: 9300030,
    region: REGION,
    watk: 0,
    matk: 0,
    exist: true,
  },
  {
    name: "기사석상 A",
    level: 100,
    hp: 900000,
    exp: 0,
    acc: 0,
    eva: 14,
    needAcc: 210,
    def: 950,
    mDef: 920,
    ele: FIVE_ELEMENT_RESIST,
    mobCode: 9300031,
    region: REGION,
    watk: 0,
    matk: 0,
    exist: true,
  },
  {
    name: "기사석상 B",
    level: 100,
    hp: 900000,
    exp: 0,
    acc: 0,
    eva: 14,
    needAcc: 210,
    def: 950,
    mDef: 920,
    ele: FIVE_ELEMENT_RESIST,
    mobCode: 9300032,
    region: REGION,
    watk: 0,
    matk: 0,
    exist: true,
  },
];

async function main() {
  const monstersRaw = await fs.readFile(MONSTERS_PATH, "utf8");
  const monsters = JSON.parse(monstersRaw);

  const existingCodes = new Set(monsters.map((m) => m.mobCode));
  const toAdd = NEW_MONSTERS.filter((m) => !existingCodes.has(m.mobCode));
  const skipped = NEW_MONSTERS.filter((m) => existingCodes.has(m.mobCode));

  if (skipped.length) {
    console.log(`이미 존재해 건너뜀: ${skipped.map((m) => `${m.name}(${m.mobCode})`).join(", ")}`);
  }
  if (!toAdd.length) {
    console.log("추가할 몬스터가 없습니다(전부 이미 존재).");
    return;
  }

  monsters.push(...toAdd);
  await fs.writeFile(MONSTERS_PATH, `${JSON.stringify(monsters, null, 2)}\n`, "utf8");

  console.log(`추가 완료: ${toAdd.map((m) => `${m.name}(${m.mobCode})`).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
