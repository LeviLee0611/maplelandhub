// 영문으로 남아 있던 아이템/몬스터/퀘스트 이름을 한글명으로 고치고,
// 한국 서버(메이플랜드/메이플 플래닛)에 존재하지 않는 GMS 전용 아이템을 드롭에서 제거한다.
//
// 왜 일회성 스크립트인가:
//   `npm run build:drop-index`로 data/drop-index.json을 통째로 재생성하면 과거 일회성 스크립트들
//   (update-balrog-drops / add-chaos-horntail 등)이 얹어둔 보정분이 전부 날아간다.
//   실제로 2026-09-28에 재빌드를 시도했다가 한글 아이템 669종이 사라지고 금쇄봉 -> "Aluminum Bat",
//   바이올렛 아이젠 -> "Violet Snowshoes"처럼 **새 영문이 생기는** 역행까지 확인해 롤백했다.
//   그래서 data.md에 적힌 "일회성 스크립트로 프로그래매틱하게 수정" 패턴을 따른다.
//   (build-drop-index.mjs 쪽에도 같은 소스를 물려뒀으므로, 언젠가 전체 재빌드를 하게 되면 그때는 자동 반영된다.)
//
// 근거 데이터:
//   scripts/sources/item-korean-names.json  — itemId -> 한글명 (메이플노트 클래식 출처)
//   scripts/sources/gms-only-items.json     — 한국 서버 미존재 GMS 전용 아이템 id
//   scripts/sources/monster-korean-names.json — mobCode -> 한글명
//
// 실행: node scripts/fix-english-names.mjs           (드라이런 — 무엇이 바뀌는지만 출력)
//       node scripts/fix-english-names.mjs --apply   (실제 파일 수정)
//
// 이 스크립트는 멱등하다 — 이미 한글로 바뀐 항목은 건너뛰므로 여러 번 실행해도 안전하다.
// 적용 후에는 반드시 `node scripts/build-planet-data.mjs`로 플래닛 쪽을 동기화할 것.

import fs from "fs/promises";
import path from "path";

const APPLY = process.argv.includes("--apply");

const DROP_INDEX = path.resolve("data/drop-index.json");
const MONSTERS = path.resolve("data/monsters.json");
const QUESTS = path.resolve("data/quests.json");
const QUEST_DETAIL = path.resolve("src/data/mapledb/questdetail.js");

const ITEM_NAMES_SRC = path.resolve("scripts/sources/item-korean-names.json");
const GMS_ONLY_SRC = path.resolve("scripts/sources/gms-only-items.json");
const MOB_NAMES_SRC = path.resolve("scripts/sources/monster-korean-names.json");

const HANGUL = /[가-힣]/;

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function writeJson(p, data) {
  if (!APPLY) return;
  await fs.writeFile(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const log = [];
function note(line) {
  log.push(line);
  console.log(line);
}

async function main() {
  const itemNames = (await readJson(ITEM_NAMES_SRC)).names ?? {};
  const gmsOnly = new Set((await readJson(GMS_ONLY_SRC)).itemIds ?? []);
  const mobNames = (await readJson(MOB_NAMES_SRC)).names ?? {};

  note(`모드: ${APPLY ? "APPLY (파일 수정)" : "DRY-RUN (미리보기)"}`);
  note(`소스: 아이템 한글명 ${Object.keys(itemNames).length}건 / GMS 전용 제외 ${gmsOnly.size}건 / 몬스터 한글명 ${Object.keys(mobNames).length}건`);

  // ---------- 1) drop-index.json: 아이템 이름 교체 + GMS 전용 제거 ----------
  const di = await readJson(DROP_INDEX);
  const beforeItems = di.items.length;

  let renamed = 0;
  for (const it of di.items) {
    const ko = itemNames[String(it.id)];
    if (ko && it.name !== ko) {
      note(`  [아이템명] ${it.id} "${it.name}" -> "${ko}"`);
      it.name = ko;
      renamed++;
    }
  }

  const removedItems = di.items.filter((it) => gmsOnly.has(it.id));
  di.items = di.items.filter((it) => !gmsOnly.has(it.id));

  let removedRefs = 0;
  for (const [mobId, rewards] of Object.entries(di.dropsByMonsterId)) {
    const kept = rewards.filter((r) => !gmsOnly.has(r.itemId));
    removedRefs += rewards.length - kept.length;
    if (kept.length === 0) delete di.dropsByMonsterId[mobId];
    else di.dropsByMonsterId[mobId] = kept;
  }
  let removedIndex = 0;
  for (const itemId of Object.keys(di.monstersByItemId)) {
    if (gmsOnly.has(Number(itemId))) {
      delete di.monstersByItemId[itemId];
      removedIndex++;
    }
  }
  note(`[drop-index] 이름 교체 ${renamed}건 / GMS 전용 아이템 제거 ${removedItems.length}건 (items ${beforeItems} -> ${di.items.length})`);
  note(`[drop-index] 몬스터별 드롭 참조 ${removedRefs}건, 역인덱스 ${removedIndex}건 제거`);

  const leftoverEnglish = di.items.filter((it) => it.name && !HANGUL.test(it.name) && /[A-Za-z]{2}/.test(it.name));
  note(`[drop-index] 남은 영문 아이템: ${leftoverEnglish.length}건${leftoverEnglish.length ? " -> " + leftoverEnglish.map((x) => `${x.id}:${x.name}`).join(", ") : ""}`);

  // ---------- 2) monsters.json: 몬스터 이름 교체 ----------
  const mons = await readJson(MONSTERS);
  let mobRenamed = 0;
  for (const m of mons) {
    const ko = mobNames[String(m.mobCode)];
    if (ko && m.name !== ko) {
      note(`  [몬스터명] ${m.mobCode} "${m.name}" -> "${ko}"`);
      m.name = ko;
      mobRenamed++;
    }
  }
  const leftoverMobs = mons.filter((m) => m.name && !HANGUL.test(m.name) && /[A-Za-z]{2}/.test(m.name));
  note(`[monsters] 이름 교체 ${mobRenamed}건 / 남은 영문 몬스터 ${leftoverMobs.length}종 (전부 release-filter 비노출分)`);

  // ---------- 3) quests.json: 처치 대상 몬스터 이름 ----------
  const quests = await readJson(QUESTS);
  const questList = Array.isArray(quests) ? quests : quests.quests;
  let questFixed = 0;
  for (const q of questList) {
    for (const key of ["start", "complete"]) {
      for (const mob of q?.requirements?.[key]?.mobs ?? []) {
        const ko = mobNames[String(mob.id)];
        // 이미 한글이면 건드리지 않는다 — 여기서 고치려는 건 '영문 노출'이지 표기 통일이 아니다
        // (예: "간부 A" vs "간부A"처럼 공백만 다른 경우까지 바꾸면 불필요한 diff가 생긴다)
        if (ko && mob.name !== ko && !HANGUL.test(mob.name ?? "")) {
          note(`  [퀘스트몹] ${q.name}: "${mob.name}" -> "${ko}"`);
          mob.name = ko;
          questFixed++;
        }
      }
    }
  }
  note(`[quests] 처치 대상 이름 교체 ${questFixed}건`);

  // ---------- 4) questdetail.js: 보상 아이템/몹 이름 (문자열 치환) ----------
  let qd = await fs.readFile(QUEST_DETAIL, "utf8");
  const qdBefore = qd;
  let qdFixed = 0;
  const qdReplacements = [];
  for (const [id, ko] of Object.entries(itemNames)) {
    // {"id":1002418,...,"name":"Newspaper Hat"} 형태에서 해당 id의 name만 바꾼다
    const re = new RegExp(`("id":${id},(?:[^{}]*?))"name":"([^"]*)"`, "g");
    qd = qd.replace(re, (whole, head, cur) => {
      if (cur === ko || HANGUL.test(cur)) return whole;
      qdReplacements.push(`${id} "${cur}" -> "${ko}"`);
      qdFixed++;
      return `${head}"name":"${ko}"`;
    });
  }
  for (const [code, ko] of Object.entries(mobNames)) {
    const re = new RegExp(`("id":"${code}",(?:[^{}]*?))"name":"([^"]*)"`, "g");
    qd = qd.replace(re, (whole, head, cur) => {
      if (cur === ko || HANGUL.test(cur)) return whole;
      qdReplacements.push(`${code} "${cur}" -> "${ko}"`);
      qdFixed++;
      return `${head}"name":"${ko}"`;
    });
  }
  for (const r of qdReplacements) note(`  [퀘스트상세] ${r}`);
  note(`[questdetail.js] 이름 교체 ${qdFixed}건`);

  // ---------- 저장 ----------
  await writeJson(DROP_INDEX, di);
  await writeJson(MONSTERS, mons);
  await writeJson(QUESTS, quests);
  if (APPLY && qd !== qdBefore) await fs.writeFile(QUEST_DETAIL, qd, "utf8");

  note("");
  note(
    APPLY
      ? "적용 완료. 이제 `node scripts/build-planet-data.mjs`로 플래닛 데이터를 동기화할 것."
      : "드라이런이라 아무 파일도 건드리지 않았다. 실제 적용은 --apply 플래그를 붙일 것.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
