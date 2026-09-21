/**
 * 시간의 신전 핑크빈 콘텐츠 몬스터 6종 추가 + 기존 핑크빈(8820001) 누락 스탯 보강 (메이플랜드)
 *
 * - 배경: 2026년 9월 18일(금) 메이플랜드 패치로 보스 <핑크빈>이 "시간의 신전 깊은 곳
 *   (잊혀진 황혼)"에 추가됨(입장 140레벨 이상 / 3인 이상 원정대 / 7일당 2회).
 *   패치노트가 몬스터 7종 추가를 명시하는데 우리 데이터엔 핑크빈 1종만 있었다.
 *   출처: maple.land/board/notices/h3gq7n8pgsmfl4dx2mhodvza (2026-09-17 게시)
 *
 * - 스탯 출처: maplestory.io `GMS/92` 스냅샷(`/mob/{id}`). 이 버전을 고른 근거는
 *   2026-09-21 교차검증 — 우리 데이터에 이미 있는 몬스터 15종으로 GMS/92와 대조해
 *   60/60 필드가 일치했고(DEVLOG 2026-09-14의 "GMS/80~92가 프리빅뱅 포맷" 기록과 일치),
 *   기존 핑크빈(8820001) 행의 level/hp/exp/def/mDef도 GMS/92와 정확히 일치한다.
 *   같은 스냅샷이 같은 콘텐츠를 담고 있음이 확인되므로 나머지 6종도 같은 신뢰도로 본다.
 *
 * - 속성(ele) 디코딩: API의 `elementalAttributes`(예: "F2I3")를 우리 표기로 옮긴다.
 *   letter/digit 의미는 추측하지 않고 우리 데이터로 역산해 확정했다(2026-09-21):
 *     F=불 I=얼음 L=전기 H=성 S=독 / 1=면역 2=반감 3=약점
 *   검증 표본 28종 전원 일치(예: 콜드아이 I2F3 = "얼음 반감","불 약점" / 타우로마시스
 *   S1 = "독 면역" / 블러드붐 F1L1 = "불 면역","전기 면역").
 *   D(암흑)와 P(물리)는 우리 ele 어휘에 대응 항목이 없어 버린다 — 기존 데이터도 그렇게
 *   돼 있다(좀비버섯 H3D2 -> "성 약점"만 저장). P가 물리인 것은 9/18 패치노트의
 *   "핑크빈 몬스터 타격 시 물리공격 반감" 문구로 확인됨.
 *   ※ 따라서 핑크빈의 "물리공격 반감"은 이 데이터셋에 담기지 않는다. 한방컷 계산에
 *      영향이 있는 요소이므로 스키마/계산기 확장은 별건으로 다뤄야 한다(TODO).
 *
 * - needAcc: 기존 데이터의 관례를 따라 eva * 2/15로 채운다(예: 자쿰 eva 12 -> 1.6,
 *   버블링 eva 10 -> 1.33). 이 필드는 현재 UI가 쓰지 않는다 —
 *   `MonsterPanel`이 eva와 캐릭터 레벨로 직접 계산한다(getDisplayedNeedAcc).
 *
 * - 플래닛(`data/planet/monsters.json`)은 건드리지 않는다. 이번 건은 메이플랜드 패치이고,
 *   플래닛에 같은 콘텐츠가 있는지 확인되지 않았다. 필요해지면 별도 판단 후 동기화할 것.
 *
 * 실행: node scripts/add-pinkbean-temple-monsters.mjs          (드라이런 — 기본)
 *       node scripts/add-pinkbean-temple-monsters.mjs --apply  (실제 기록)
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");
const REGION = "보스";
const APPLY = process.argv.includes("--apply");

/** GMS/92 `/mob/{id}` 응답 그대로. ele는 elementalAttributes를 위 규칙으로 옮긴 값. */
const NEW_MONSTERS = [
  { mobCode: 8820002, name: "아리엘", level: 180, hp: 600000000, exp: 20000000,
    acc: 265, eva: 54, def: 1700, mDef: 1980, watk: 1650, matk: 1300,
    ele: ["성 면역", "불 반감", "전기 반감", "얼음 반감"] },            // H1F2L2I2D2
  { mobCode: 8820003, name: "현자 솔로몬", level: 180, hp: 300000000, exp: 3000000,
    acc: 240, eva: 50, def: 1540, mDef: 1810, watk: 1440, matk: 770,
    ele: ["무속성"] },                                                  // (속성 없음)
  { mobCode: 8820004, name: "현자 렉스", level: 180, hp: 300000000, exp: 3000000,
    acc: 250, eva: 51, def: 1580, mDef: 1830, watk: 1480, matk: 750,
    ele: ["무속성"] },                                                  // (속성 없음)
  { mobCode: 8820005, name: "휘긴", level: 180, hp: 450000000, exp: 3500000,
    acc: 255, eva: 52, def: 1600, mDef: 1860, watk: 1580, matk: 900,
    ele: ["불 반감", "얼음 약점"] },                                     // F2I3
  { mobCode: 8820006, name: "무닌", level: 180, hp: 450000000, exp: 3500000,
    acc: 260, eva: 53, def: 1580, mDef: 1880, watk: 1600, matk: 950,
    ele: ["얼음 반감", "불 약점"] },                                     // I2F3
  { mobCode: 8820007, name: "미니빈", level: 150, hp: 303000, exp: 11000,
    acc: 240, eva: 50, def: 1200, mDef: 1200, watk: 700, matk: 800,
    ele: ["독 반감", "얼음 약점", "불 약점"] },                           // S2I3F3
];

/** 기존 핑크빈 행에서 비어 있던 값. def/mDef/hp/exp/level은 이미 GMS/92와 일치해 건드리지 않는다. */
const PINKBEAN_PATCH = {
  mobCode: 8820001,
  watk: 1700,   // 기존 null — 없으면 피격 데미지 계산이 불가능
  matk: 1200,   // 기존 null
  acc: 270,     // 기존 0
  eva: 55,      // 기존 0 — 필요 명중치가 0으로 나오던 원인
  ele: ["성 반감", "불 반감", "얼음 반감"], // 기존 ["무속성"], P2H2F2I2D2에서 P·D 제외
};

const needAccFor = (eva) => Math.round((eva * 2 / 15) * 100) / 100;

function buildRow(m) {
  return {
    name: m.name, level: m.level, hp: m.hp, exp: m.exp,
    acc: m.acc, eva: m.eva, needAcc: needAccFor(m.eva),
    def: m.def, mDef: m.mDef, ele: m.ele,
    mobCode: m.mobCode, region: REGION, watk: m.watk, matk: m.matk, exist: true,
  };
}

async function main() {
  const monsters = JSON.parse(await fs.readFile(MONSTERS_PATH, "utf8"));
  const byCode = new Map(monsters.map((m) => [m.mobCode, m]));

  console.log(`대상 파일: ${MONSTERS_PATH} (현재 ${monsters.length}종)`);
  console.log(APPLY ? "모드: 실제 기록(--apply)\n" : "모드: 드라이런 — 파일을 쓰지 않는다\n");

  console.log("[1] 신규 추가");
  const toAdd = [];
  for (const m of NEW_MONSTERS) {
    if (byCode.has(m.mobCode)) {
      console.log(`  건너뜀 ${m.mobCode} ${m.name}: 이미 존재함`);
      continue;
    }
    const row = buildRow(m);
    toAdd.push(row);
    console.log(`  + ${m.mobCode} ${m.name} Lv${m.level} HP${m.hp.toLocaleString()} ` +
      `물공${m.watk} 마공${m.matk} 물방${m.def} 마방${m.mDef} 명중${m.acc} 회피${m.eva} ${JSON.stringify(m.ele)}`);
  }

  console.log("\n[2] 기존 핑크빈 보강");
  const pb = byCode.get(PINKBEAN_PATCH.mobCode);
  const pbChanges = [];
  if (!pb) {
    console.log(`  경고: ${PINKBEAN_PATCH.mobCode}(핑크빈)를 찾지 못함 — 보강 건너뜀`);
  } else {
    for (const [k, v] of Object.entries(PINKBEAN_PATCH)) {
      if (k === "mobCode") continue;
      const before = pb[k];
      if (JSON.stringify(before) === JSON.stringify(v)) continue;
      pbChanges.push([k, before, v]);
      console.log(`  ${k}: ${JSON.stringify(before)} -> ${JSON.stringify(v)}`);
    }
    const nextNeedAcc = needAccFor(PINKBEAN_PATCH.eva);
    if (pb.needAcc !== nextNeedAcc) {
      pbChanges.push(["needAcc", pb.needAcc, nextNeedAcc]);
      console.log(`  needAcc: ${JSON.stringify(pb.needAcc)} -> ${JSON.stringify(nextNeedAcc)}`);
    }
    if (!pbChanges.length) console.log("  변경 없음");
  }

  console.log(`\n요약: 추가 ${toAdd.length}종, 핑크빈 필드 변경 ${pbChanges.length}건, ` +
    `최종 ${monsters.length + toAdd.length}종`);

  if (!APPLY) {
    console.log("\n드라이런 종료 — 반영하려면 --apply");
    return;
  }

  for (const [k, , v] of pbChanges) pb[k] = v;
  monsters.push(...toAdd);
  await fs.writeFile(MONSTERS_PATH, `${JSON.stringify(monsters, null, 2)}\n`, "utf8");
  console.log("\n기록 완료");
}

main().catch((err) => { console.error(err); process.exit(1); });
