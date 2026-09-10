/**
 * 이름 중복 몬스터 중 "플레이스홀더"로 오인했던 10종을 실제 스탯으로 채움.
 *
 * - 배경: 드롭 데이터 정확도 조사(2026-09-09) 중 `data/monsters.json`에 이름이 같은
 *   몬스터가 90개나 중복돼있고, 그중 73개 그룹이 "정상 스탯 1개 + acc=0/eva=0/
 *   def=mDef=10인 플레이스홀더 1~3개" 패턴임을 발견. 처음엔 이 플레이스홀더들을
 *   전부 몬스터북 카드용 더미 데이터로 추정했으나, 예티 사례(6300001/6300002)를
 *   mapledb.kr에서 직접 조회해보니 실제로는 "Transformed Yeti"/"Separated Yeti"라는
 *   진짜 별개 몬스터(예티&페페 스토리 관련 퀘스트 몬스터로 추정)였고, 우리 쪽에서
 *   스탯을 아예 못 채워서 acc/eva/def/mDef가 0으로 비어있었던 것뿐이었음이 확인됨.
 *   같은 방식으로 다크 예티/페페/다크 페페의 "변신/분리" 변종 4개, 그리고 이름은
 *   같지만 완전히 다른 콘텐츠인 파이어독(Bain)/마스터 소울테니/데스테니/
 *   G.팬텀워치 4개도 전부 mapledb.kr에 실존하는 완전한 스탯을 가진 몬스터로 확인됨.
 *   (나머지 63개 "혼합" 그룹은 이번에 확인 안 함 — 진짜 몬스터북 카드 더미일 가능성이
 *   높지만 전수 검증은 안 했으므로 그대로 둠, TODO.md 참고)
 *
 * - 스탯 출처: mapledb.kr(메랜디비) 직접 조회(2026-09-09). def/mDef/eva/needAcc는
 *   전부 원문 그대로. acc는 mapledb.kr이 표시하지 않는 항목이라(이 사이트 전반의
 *   공백 패턴) — 예티/다크예티/페페/다크페페 6종은 스탯이 완전히 동일한 "진짜"
 *   형제 몬스터(예: 6300000)의 기존 acc값을 그대로 사용(같은 개체의 다른 상태라
 *   acc도 같을 것으로 추정 — def/mDef/eva/needAcc가 전부 정확히 일치해 신뢰도 높음).
 *   파이어독/마스터소울테니/데스테니/G.팬텀워치 4종은 형제가 없어(이름만 같은 별개
 *   콘텐츠) acc 추정 근거가 없으므로 0 유지(근거 없이 추정하지 않음).
 *
 * 실행: node scripts/fix-duplicate-name-placeholder-monsters.mjs
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");

const PATCHES = {
  // 예티 스토리 관련(엘나스) — "진짜" 형제: 6300000(예티,acc89)/6400000(다크예티,acc96)/
  // 6130102(페페,acc111)/6230200(다크페페,acc114)에서 acc/watk/matk/region 차용.
  6300001: { // 예티 (Transformed Yeti)
    level: 65, hp: 11000, exp: 390, acc: 89, eva: 24, needAcc: 3.2,
    def: 170, mDef: 245, ele: ["얼음 반감", "불 약점"], region: "엘나스", watk: 182, matk: 270,
  },
  6300002: { // 예티 (Separated Yeti)
    level: 65, hp: 11000, exp: 455, acc: 89, eva: 24, needAcc: 3.2,
    def: 170, mDef: 245, ele: ["얼음 반감", "불 약점"], region: "엘나스", watk: 182, matk: 270,
  },
  6400001: { // 다크 예티 (Transformed Dark Yeti)
    level: 68, hp: 13000, exp: 445, acc: 96, eva: 26, needAcc: 3.47,
    def: 190, mDef: 270, ele: ["성 약점"], region: "엘나스", watk: 210, matk: 290,
  },
  6400002: { // 다크 예티 (Separated Dark Yeti)
    level: 68, hp: 13000, exp: 715, acc: 96, eva: 26, needAcc: 3.47,
    def: 190, mDef: 270, ele: ["성 약점"], region: "엘나스", watk: 210, matk: 290,
  },
  6130103: { // 페페 (Pepe)
    level: 60, hp: 7200, exp: 220, acc: 111, eva: 30, needAcc: 4,
    def: 210, mDef: 225, ele: ["얼음 반감", "불 약점"], region: "엘나스", watk: 167, matk: 0,
  },
  6230201: { // 다크 페페 (Separated Dark Pepe)
    level: 64, hp: 7800, exp: 700, acc: 114, eva: 31, needAcc: 4.13,
    def: 220, mDef: 240, ele: ["성 약점"], region: "엘나스", watk: 177, matk: 0,
  },
  // 이름만 같은 완전히 다른 콘텐츠 — acc 추정 근거 없어 0 유지.
  9500138: { // 파이어독 (Bain)
    level: 90, hp: 45000, exp: 1800, acc: 0, eva: 38, needAcc: 5.07,
    def: 835, mDef: 505, ele: ["불 반감", "얼음 약점"],
  },
  9500127: { // 마스터 소울테니 (Master Soul Teddy)
    level: 67, hp: 11000, exp: 265, acc: 0, eva: 27, needAcc: 3.60,
    def: 210, mDef: 250, ele: ["전기 반감", "얼음 면역", "성 약점"],
  },
  9500135: { // 데스테니 (Death Teddy)
    level: 85, hp: 32000, exp: 1300, acc: 0, eva: 27, needAcc: 3.60,
    def: 700, mDef: 465, ele: ["성 약점", "불 약점"],
  },
  9500137: { // G.팬텀워치 (G. Phantom Watch)
    level: 95, hp: 53000, exp: 2800, acc: 0, eva: 37, needAcc: 4.93,
    def: 835, mDef: 530, ele: ["성 약점", "불 약점", "얼음 면역"],
  },
};

async function main() {
  const monstersRaw = await fs.readFile(MONSTERS_PATH, "utf8");
  const monsters = JSON.parse(monstersRaw);

  const results = [];
  for (const [mobCodeStr, patch] of Object.entries(PATCHES)) {
    const mobCode = Number(mobCodeStr);
    const idx = monsters.findIndex((m) => m.mobCode === mobCode);
    if (idx < 0) {
      results.push(`${mobCode}: 데이터에서 못 찾음, 건너뜀`);
      continue;
    }
    const before = { ...monsters[idx] };
    monsters[idx] = { ...monsters[idx], ...patch, exist: true };
    results.push(`${mobCode} (${before.name}): eva ${before.eva}->${monsters[idx].eva}, def ${before.def}->${monsters[idx].def}, mDef ${before.mDef}->${monsters[idx].mDef}`);
  }

  await fs.writeFile(MONSTERS_PATH, `${JSON.stringify(monsters, null, 2)}\n`, "utf8");
  console.log(results.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
