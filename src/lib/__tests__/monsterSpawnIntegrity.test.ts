import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import spawns from "@data/monster-spawns.json";
import monsters from "@data/monsters.json";

/**
 * 출현 맵 데이터 정합성 회귀 테스트 (2026-09-29).
 *
 * 왜 필요한가: `fix-monster-spawns.mjs`가 처음엔 "몬스터 시작 위치부터 6000자 이내의 첫 spawnsAt"으로
 * 맵을 찾았는데, 자기 객체에 `spawnsAt`이 없는 몬스터는 **뒤쪽 다른 몬스터의 맵**을 가져갔다.
 * 에레고스가 9300040의 맵을, 월묘가 9300065의 맵을 물고 와 상세 페이지에 엉뚱한 출현지가 떴고,
 * 37종 중 22종이 그렇게 오염됐는데도 **기존 테스트는 전부 통과했다**(외부 리뷰가 잡아냄).
 *
 * 그래서 "맵이 그 몬스터 자신의 것인지"를 직접 검사한다. 원본(`drops.js`)에 자기 `spawnsAt`이 있는
 * 몬스터라면, 저장된 맵 코드는 그 목록 안에 있어야 한다.
 */

const DROPS_JS = path.resolve(process.cwd(), "src/data/mapledb/drops.js");
const dropsSource = fs.readFileSync(DROPS_JS, "utf8");

/**
 * `drops.js`가 아니라 손수 관리 소스에서 출현 맵을 채운 몬스터들 (마스테리아 등).
 * 이들은 원본에 `spawnsAt`이 없는 게 정상이므로 "원본 대조" 검사에서 제외한다.
 * 이 화이트리스트에 없으면서 원본에 `spawnsAt`이 없는데 맵이 채워져 있다면,
 * 그건 다른 몬스터의 맵을 잘못 물고 온 것이다 — 바로 그 오염을 잡으려는 것이다.
 */
const MANUAL_SPAWN_SOURCES = [
  "scripts/sources/masteria-content.json",
  "scripts/sources/overseas-content.json",
  "scripts/sources/groupa-remainder-content.json",
  // 메랜닷컴 map_map_mobs 에서 채운 것 — drops.js 보다 정확한 경우가 있다.
  // 예: 머리없는 기수를 drops.js 는 682000001(GMS 할로윈 배치)로, 메랜닷컴은 610010xxx(마스테리아)로 준다.
  // 이 몬스터의 소속은 마스테리아가 맞으므로 원본 대조 검사에서 뺀다.
  "scripts/sources/itshim-spawn-maps.json",
];
const manuallyFilled = new Set<number>();
for (const rel of MANUAL_SPAWN_SOURCES) {
  const p = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  const doc = JSON.parse(fs.readFileSync(p, "utf8")) as { spawns?: Record<string, unknown> };
  for (const code of Object.keys(doc.spawns ?? {})) manuallyFilled.add(Number(code));
}

type SpawnRow = { mob_code: number; mob_name?: string; maps?: Array<{ map_code: number; map_name: string }> };
const rows = (spawns as { rows: SpawnRow[] }).rows;
const nameByCode = new Map((monsters as Array<{ mobCode: number; name: string }>).map((m) => [m.mobCode, m.name]));

/**
 * 해당 몬스터 **객체 안에서만** spawnsAt을 읽는다 — 다음 엔트리(`,<code>:{mobID:`)가 객체의 끝.
 * null = drops.js에 그 몬스터가 아예 없음(다른 출처에서 채운 것이므로 이 검사 대상 아님).
 * []   = 있지만 spawnsAt이 없음.
 */
function ownSpawnsAt(mobCode: number): number[] | null {
  const head = new RegExp(`\\b${mobCode}:\\{mobID:${mobCode}\\b`).exec(dropsSource);
  if (!head) return null;
  const nextEntry = /,\d{4,9}:\{mobID:/g;
  nextEntry.lastIndex = head.index + head[0].length;
  const next = nextEntry.exec(dropsSource);
  const body = dropsSource.slice(head.index, next ? next.index : dropsSource.length);
  const key = body.indexOf("spawnsAt:[");
  if (key < 0) return [];
  const end = body.indexOf("]", key);
  if (end < 0) return [];
  return body
    .slice(key + "spawnsAt:[".length, end)
    .split(",")
    .map((t) => Number(t.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

describe("출현 맵 데이터 정합성", () => {
  it("저장된 출현 맵은 그 몬스터 자신의 spawnsAt 안에 있어야 한다 (다른 몬스터 맵 오염 방지)", () => {
    const offenders: string[] = [];
    for (const row of rows) {
      const maps = row.maps ?? [];
      if (maps.length === 0) continue;
      if (manuallyFilled.has(row.mob_code)) continue; // 손수 관리 소스에서 채운 것은 원본 대조 대상 아님
      const own = ownSpawnsAt(row.mob_code);
      if (own === null) continue; // drops.js에 아예 없는 몬스터
      const label = `${row.mob_code} ${nameByCode.get(row.mob_code) ?? row.mob_name ?? "?"}`;

      // 원본에 spawnsAt이 없는데 맵이 채워져 있다 = 다른 몬스터 맵을 물고 온 것
      if (own.length === 0) {
        offenders.push(`${label}: 원본에 spawnsAt이 없는데 맵 ${maps.map((m) => m.map_code).join(",")} 가 채워져 있음`);
        continue;
      }

      const ownSet = new Set(own);
      const strays = maps.filter((m) => !ownSet.has(m.map_code));
      if (strays.length === maps.length) {
        offenders.push(`${label}: 저장 ${maps.map((m) => m.map_code).join(",")} / 실제 ${own.join(",")}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * map_name 에 맵 이름이 아니라 다른 칸 값이 들어간 경우.
   * 숫자(레벨)만 검사했더니 **속성 문자열**이 들어간 33건을 놓쳤다 —
   * 여신 탑의 주니어 샐리온이 "불 반감, 얼음 약점", 바이킹이 "불 반감, 전기 약점"으로 떴다.
   * 두 패턴을 함께 본다.
   */
  it("map_name 이 맵 이름 대신 숫자(레벨)나 속성 문자열로 들어가 있으면 안 된다", () => {
    const LEVEL_ONLY = /^\d+$/;
    const ELEMENT_WORD = /(불|얼음|전기|독|성|암흑|물리)\s*(반감|약점|면역)/;
    const offenders: string[] = [];
    for (const row of rows) {
      for (const m of row.maps ?? []) {
        const name = String(m.map_name ?? "").trim();
        if (LEVEL_ONLY.test(name) || ELEMENT_WORD.test(name)) {
          offenders.push(`${row.mob_code} ${nameByCode.get(row.mob_code) ?? "?"}: map ${m.map_code} = "${name}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("출현 맵 이름에 한글이 없는 항목이 없어야 한다 (영문 맵 이름 노출 방지)", () => {
    const offenders: string[] = [];
    for (const row of rows) {
      for (const m of row.maps ?? []) {
        const name = String(m.map_name ?? "");
        if (name && !/[가-힣]/.test(name)) {
          offenders.push(`${row.mob_code}: map ${m.map_code} = "${name}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("집계 필드(withMaps/withoutMaps)가 실제 rows 와 맞아야 한다", () => {
    const doc = spawns as { rows: SpawnRow[]; withMaps?: number; withoutMaps?: number };
    const withMaps = rows.filter((r) => (r.maps ?? []).length > 0).length;
    expect(doc.withMaps).toBe(withMaps);
    expect(doc.withoutMaps).toBe(rows.length - withMaps);
  });
});
