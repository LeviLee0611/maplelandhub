/**
 * 메랜 스킬 6종의 레벨 1~29 곡선을 6/19 패치 기준으로 정정
 *
 * - 배경: 2026-06-19 "Mapleland 2.0" 패치가 스킬 기준선을 1.2.35 -> 1.2.89(모험가의 귀환)로
 *   재조정했다. 당시 패치노트는 **마스터 레벨 값만** 명시해서, `data.md`의 원칙대로
 *   "마스터만 교체, 하위 레벨은 곡선 형태를 알 수 없어 그대로 유지"로 반영했다.
 *   그런데 2026-09-21 maplab.kr에서 레벨별 곡선을 확보해 대조하니, 이 패치는 마스터만이
 *   아니라 **곡선 전체**를 바꾼 것이었다. 즉 하위 레벨이 낡은 채로 남아 있었다.
 *
 * - 소스: `https://api.maplab.kr/api/skill-stats` (메랜). 스킬 ID가 키이고 `levels[]`에
 *   레벨별 `power`(데미지%)/`hits`(타수)가 1~마스터 전 구간 들어 있다. `?mapleType=planet`으로
 *   플래닛 데이터도 따로 내려온다.
 *
 * - 채택 기준(중요): maplab은 3자 소스이고 **균일하게 최신이 아니다** — 블래스트(580 vs 공식
 *   600)·백스핀 블로우·인비지블샷·윈드 샷은 6/19를 아직 반영 안 했다. 그래서 통째로 덮어쓰지
 *   않고, **maplab의 마스터값이 6/19 공식 패치노트와 일치하는 스킬만** 곡선을 채택한다.
 *   `data.md`가 이미 쓰는 "패치노트 값과 대조해 신뢰도 판단" 방법론과 같다.
 *   아래 6종이 그 조건을 만족하며, 스크립트가 실행 시점에 이 조건을 다시 검사한다.
 *
 * - 마스터(30) 값은 이미 공식 근거로 맞으므로 건드리지 않는다. 1~29만 교체한다.
 *
 * 실행: node scripts/apply-maplab-lowlevel-curves.mjs          (드라이런 — 기본)
 *       node scripts/apply-maplab-lowlevel-curves.mjs --apply  (실제 기록)
 *       반영 후 반드시 `node scripts/normalize-skills.mjs`로 data/skills/*.json 재생성
 */

import fs from "fs/promises";
import path from "path";

const RAW_PATH = path.resolve("data/raw/skills.raw.ts");
const API = "https://api.maplab.kr/api/skill-stats";
const APPLY = process.argv.includes("--apply");

/** 6/19 패치노트가 명시한 마스터 데미지%. 채택 전 maplab 값과 대조하는 검문소. */
const OFFICIAL_MASTER = {
  "돌진": 140,
  "어썰터": 500,
  "파이어 버너": 190,
  "쿨링 이펙트": 160,
  "래피드 파이어": 200,
  "아이언 에로우": 200,
};

function findBlock(source, name) {
  // 정규식을 쓰지 않는다 — 스킬 이름에 메타문자가 없고, 이스케이프를 다루다 조용히 어긋나는
  // 쪽이 더 위험하다. 여는 중괄호부터 짝을 세어 블록 끝을 찾는다.
  const needle = '"' + name + '":';
  const at = source.indexOf(needle);
  if (at < 0) return null;
  const lineStart = source.lastIndexOf("\n", at) + 1;
  const open = source.indexOf("{", at);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return { start: lineStart, end: i + 1, text: source.slice(lineStart, i + 1) };
    }
  }
  return null;
}

function parseLevels(text) {
  const inner = text.slice(text.indexOf("{") + 1, text.lastIndexOf("}"));
  const out = {};
  for (const piece of inner.split(",")) {
    const at = piece.indexOf(":");
    if (at < 0) continue;
    const key = Number(piece.slice(0, at).trim().replaceAll('"', ""));
    const value = Number(piece.slice(at + 1).trim());
    if (Number.isFinite(key) && Number.isFinite(value)) out[key] = value;
  }
  return out;
}

async function main() {
  const res = await fetch(API, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`maplab API 응답 ${res.status}`);
  const skills = (await res.json()).skills ?? {};
  const byName = new Map();
  for (const entry of Object.values(skills)) {
    if (entry?.name && !byName.has(entry.name)) byName.set(entry.name, entry);
  }

  let source = await fs.readFile(RAW_PATH, "utf8");
  console.log(APPLY ? "모드: 실제 기록(--apply)\n" : "모드: 드라이런 — 파일을 쓰지 않는다\n");

  let changedSkills = 0;
  let changedLevels = 0;

  for (const [name, officialMaster] of Object.entries(OFFICIAL_MASTER)) {
    const entry = byName.get(name);
    if (!entry) { console.log(`건너뜀 ${name}: maplab에 없음`); continue; }

    const lv = new Map((entry.levels ?? []).map((x) => [x.lv, x]));
    const masterLv = Math.max(...lv.keys());
    const master = lv.get(masterLv);

    // 검문소: maplab 마스터가 공식 패치노트와 다르면 그 스킬은 손대지 않는다.
    if (master?.power !== officialMaster) {
      console.log(`건너뜀 ${name}: maplab 마스터 ${master?.power} != 공식 ${officialMaster} (이 소스가 낡음)`);
      continue;
    }
    // 타수가 있는 스킬은 이 스크립트의 단순 숫자 포맷으로 표현할 수 없다.
    if ((master.hits ?? 1) !== 1) {
      console.log(`건너뜀 ${name}: 타수 ${master.hits} — 숫자 포맷으로 표현 불가, 수동 확인 필요`);
      continue;
    }

    const block = findBlock(source, name);
    if (!block) { console.log(`건너뜀 ${name}: raw 소스에서 블록을 찾지 못함`); continue; }

    const current = parseLevels(block.text);
    const currentMaster = current[masterLv];
    if (currentMaster !== officialMaster) {
      console.log(`건너뜀 ${name}: 우리 마스터 ${currentMaster} != 공식 ${officialMaster} — 먼저 확인 필요`);
      continue;
    }

    const diffs = [];
    const next = { ...current };
    for (const level of Object.keys(current).map(Number).sort((a, b) => a - b)) {
      if (level >= masterLv) continue;            // 마스터는 공식 근거로 이미 맞다
      const src = lv.get(level);
      if (!src || typeof src.power !== "number") continue;
      if ((src.hits ?? 1) !== 1) continue;
      if (current[level] !== src.power) {
        diffs.push([level, current[level], src.power]);
        next[level] = src.power;
      }
    }

    if (!diffs.length) { console.log(`변경 없음 ${name}`); continue; }

    changedSkills++;
    changedLevels += diffs.length;
    console.log(`${name}: ${diffs.length}개 레벨 변경 (마스터 ${masterLv}=${officialMaster} 유지)`);
    console.log(`   ${diffs.slice(0, 4).map(([l, a, b]) => `Lv${l} ${a}->${b}`).join(", ")}${diffs.length > 4 ? ` … Lv${diffs.at(-1)[0]} ${diffs.at(-1)[1]}->${diffs.at(-1)[2]}` : ""}`);

    const body = Object.keys(next).map(Number).sort((a, b) => a - b)
      .map((l) => `"${l}": ${next[l]}`).join(", ");
    source = source.slice(0, block.start) + `    "${name}": { ${body} }` + source.slice(block.end);
  }

  console.log(`\n요약: 스킬 ${changedSkills}종, 레벨 ${changedLevels}개 변경`);
  if (!APPLY) { console.log("\n드라이런 종료 — 반영하려면 --apply"); return; }
  await fs.writeFile(RAW_PATH, source, "utf8");
  console.log("\n기록 완료 — 이어서 `node scripts/normalize-skills.mjs` 실행 필요");
}

main().catch((err) => { console.error(err); process.exit(1); });
