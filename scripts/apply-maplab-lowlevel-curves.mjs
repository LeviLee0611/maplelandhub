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

/**
 * A군 — 6/19 패치노트가 마스터 데미지%를 명시한 스킬. 그 수치를 검문소로 쓴다.
 * maplab 마스터가 이 값과 다르면 그 소스가 낡은 것이므로 건너뛴다.
 */
const OFFICIAL_MASTER = {
  "돌진": 140,
  "어썰터": 500,
  "파이어 버너": 190,
  "쿨링 이펙트": 160,
  "래피드 파이어": 200,
  "아이언 에로우": 200,
};

/**
 * B군 — 2026-08-14 메랜 마법사 밸런스 패치 대상.
 *
 * **A군보다 근거가 약하다.** 패치노트가 "기본 공격력이 향상되었습니다"라고만 적고 수치를
 * 주지 않아(`maple.land/board/notices/pzx6wmuz4h4slkbvklaojerw`) A군처럼 공식 값과 대조할
 * 검문소가 없다. 대신 **maplab 마스터값이 우리 저장 마스터값과 정확히 같은지**를 검문소로 쓴다 —
 * 마스터가 일치하는데 하위 레벨만 다르다는 것은 "기본 공격력만 올린" 패치 서술과 맞아떨어지고,
 * 어제(2026-09-22) A군 6종에서 확인된 패턴과 동일하다.
 *
 * 매직 컴포지션은 제외했다: 우리는 (불독)/(썬콜)로 나눠 갖고 있는데 maplab엔 통합된
 * "매직 컴포지션" 하나뿐이라 어느 쪽에 대응하는지 확정할 수 없다.
 */
const MASTER_MATCH_ONLY = ["파이어 데몬", "아이스 데몬", "메테오"];

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

/**
 * 블록 안의 레벨별 값을 읽는다. 두 가지 포맷이 섞여 있다:
 *   "1": 72                                   (숫자형)
 *   "1": { damage: 62, count: 1, mastery: 0.15 }  (객체형 — 타수·숙련도를 함께 가짐)
 * 객체형은 damage만 뽑고, 쓰기도 damage 숫자만 교체한다. count·mastery를 건드리면 안 된다.
 */
function parseLevels(text) {
  const inner = text.slice(text.indexOf("{") + 1, text.lastIndexOf("}"));
  const out = {};
  for (const m of inner.matchAll(/"(\d+)"\s*:\s*(\{[^}]*\}|[\d.]+)/g)) {
    const level = Number(m[1]);
    const raw = m[2];
    if (raw.startsWith("{")) {
      const d = /damage\s*:\s*([\d.]+)/.exec(raw);
      if (d) out[level] = { value: Number(d[1]), object: true, text: raw };
    } else {
      out[level] = { value: Number(raw), object: false, text: raw };
    }
  }
  return out;
}

/** 한 레벨 항목의 damage(또는 숫자)만 새 값으로 바꾼 문자열을 돌려준다. */
function rewriteEntry(entry, nextValue) {
  if (!entry.object) return String(nextValue);
  return entry.text.replace(/damage\s*:\s*[\d.]+/, `damage: ${nextValue}`);
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

  const plan = [
    ...Object.entries(OFFICIAL_MASTER).map(([name, master]) => ({ name, officialMaster: master, group: "A(공식 대조)" })),
    ...MASTER_MATCH_ONLY.map((name) => ({ name, officialMaster: null, group: "B(마스터 일치만)" })),
  ];

  for (const { name, officialMaster, group } of plan) {
    const entry = byName.get(name);
    if (!entry) { console.log(`건너뜀 ${name}: maplab에 없음`); continue; }

    const lv = new Map((entry.levels ?? []).map((x) => [x.lv, x]));
    const masterLv = Math.max(...lv.keys());
    const master = lv.get(masterLv);

    // A군 검문소: maplab 마스터가 공식 패치노트와 다르면 그 스킬은 손대지 않는다.
    if (officialMaster !== null && master?.power !== officialMaster) {
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
    const currentMaster = current[masterLv]?.value;
    const expectedMaster = officialMaster ?? master?.power;
    if (currentMaster !== expectedMaster) {
      const basis = officialMaster !== null ? "공식" : "maplab 마스터";
      console.log(`건너뜀 ${name}: 우리 마스터 ${currentMaster} != ${basis} ${expectedMaster} — 먼저 확인 필요`);
      continue;
    }

    const diffs = [];
    const next = {};
    for (const level of Object.keys(current).map(Number).sort((a, b) => a - b)) {
      if (level >= masterLv) continue;            // 마스터는 공식 근거로 이미 맞다
      const src = lv.get(level);
      if (!src || typeof src.power !== "number") continue;
      if ((src.hits ?? 1) !== 1) continue;
      if (current[level].value !== src.power) {
        diffs.push([level, current[level].value, src.power]);
        next[level] = src.power;
      }
    }

    if (!diffs.length) { console.log(`변경 없음 ${name}`); continue; }

    changedSkills++;
    changedLevels += diffs.length;
    console.log(`${name} [${group}]: ${diffs.length}개 레벨 변경 (마스터 ${masterLv}=${expectedMaster} 유지)`);
    console.log(`   ${diffs.slice(0, 4).map(([l, a, b]) => `Lv${l} ${a}->${b}`).join(", ")}${diffs.length > 4 ? ` … Lv${diffs.at(-1)[0]} ${diffs.at(-1)[1]}->${diffs.at(-1)[2]}` : ""}`);

    // 원문 포맷(객체형의 count·mastery 포함)을 유지하려고 항목 단위로만 갈아끼운다.
    const body = Object.keys(current).map(Number).sort((a, b) => a - b)
      .map((l) => `"${l}": ${rewriteEntry(current[l], next[l] ?? current[l].value)}`)
      .join(", ");
    source = source.slice(0, block.start) + `    "${name}": { ${body} }` + source.slice(block.end);
  }

  console.log(`\n요약: 스킬 ${changedSkills}종, 레벨 ${changedLevels}개 변경`);
  if (!APPLY) { console.log("\n드라이런 종료 — 반영하려면 --apply"); return; }
  await fs.writeFile(RAW_PATH, source, "utf8");
  console.log("\n기록 완료 — 이어서 `node scripts/normalize-skills.mjs` 실행 필요");
}

main().catch((err) => { console.error(err); process.exit(1); });
