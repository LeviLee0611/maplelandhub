import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// mobCode 재배정(무루 5종 100130~100134 -> 9600300~9600304, 2026-09-10)이 재빌드 후에도
// 유지되는지 검사하는 데이터 무결성 테스트. 옛 mobCode가 카탈로그/맵/드랍 소스를 통해
// 다시 흘러들어오면 여기서 잡힌다.
const corrections = JSON.parse(
  readFileSync(path.resolve("scripts/sources/mobcode-corrections.json"), "utf8"),
);

const SERVERS = [
  {
    label: "mapleland",
    monsters: JSON.parse(readFileSync(path.resolve("data/monsters.json"), "utf8")),
    dropIndex: JSON.parse(readFileSync(path.resolve("data/drop-index.json"), "utf8")),
    releaseFilters: JSON.parse(readFileSync(path.resolve("data/release-filters.json"), "utf8")),
  },
  {
    label: "planet",
    monsters: JSON.parse(readFileSync(path.resolve("data/planet/monsters.json"), "utf8")),
    dropIndex: JSON.parse(readFileSync(path.resolve("data/planet/drop-index.json"), "utf8")),
    releaseFilters: JSON.parse(readFileSync(path.resolve("data/planet/release-filters.json"), "utf8")),
  },
];

const oldMobCodes = Object.keys(corrections.identityRemap).map(Number);
const newMobCodes = Object.values(corrections.identityRemap).map(Number);

describe.each(SERVERS)("mobCode 보정 무결성 ($label)", ({ monsters, dropIndex, releaseFilters }) => {
  it("재배정된 mobCode의 몬스터가 정확히 1개씩 존재한다", () => {
    for (const mobCode of newMobCodes) {
      const found = monsters.filter((monster) => monster.mobCode === mobCode);
      expect(found, `mobCode ${mobCode}`).toHaveLength(1);
    }
  });

  it("옛 mobCode가 다시 유입되지 않았다", () => {
    const leaked = oldMobCodes.filter((mobCode) =>
      monsters.some((monster) => monster.mobCode === mobCode),
    );
    expect(leaked).toEqual([]);
  });

  it("옛 mobCode에 드랍이 남아있지 않다", () => {
    for (const mobCode of oldMobCodes) {
      expect(dropIndex.dropsByMonsterId[mobCode], `mobCode ${mobCode}`).toBeUndefined();
    }
    const reverseLeaks = Object.entries(dropIndex.monstersByItemId ?? {})
      .filter(([, droppers]) => (droppers ?? []).some((row) => oldMobCodes.includes(Number(row.mobId))))
      .map(([itemId]) => itemId);
    expect(reverseLeaks).toEqual([]);
  });

  it("manualDrops의 드랍이 그대로 연결돼 있다", () => {
    for (const [mobCodeText, expectedDrops] of Object.entries(corrections.manualDrops)) {
      const actual = dropIndex.dropsByMonsterId[mobCodeText] ?? [];
      const actualItemIds = actual.map((reward) => reward.itemId).sort();
      const expectedItemIds = expectedDrops.map((drop) => drop.itemId).sort();
      expect(actualItemIds, `mobCode ${mobCodeText}`).toEqual(expectedItemIds);
    }
  });

  it("manualDrops가 가리키는 아이템이 아이템 목록에 있다", () => {
    const itemIds = new Set((dropIndex.items ?? []).map((item) => item.id));
    for (const drops of Object.values(corrections.manualDrops)) {
      for (const drop of drops) {
        expect(itemIds.has(drop.itemId), `itemId ${drop.itemId}`).toBe(true);
      }
    }
  });

  it("재배정된 mobCode가 출시 필터를 통과한다", () => {
    // 9,000,000 이상은 기본 차단이라 allowedMobCodes에 명시돼 있어야 노출된다.
    const allowed = new Set(releaseFilters.allowedMobCodes ?? []);
    const blockedMin = releaseFilters.blockedMobCodeMin ?? Infinity;
    for (const mobCode of newMobCodes) {
      if (mobCode >= blockedMin) {
        expect(allowed.has(mobCode), `mobCode ${mobCode} allowedMobCodes 누락`).toBe(true);
      }
    }
  });
});

describe("mobCode 보정 소스 자체 검증", () => {
  it("보정 목록이 비어있지 않다(비면 위 검사들이 무의미하게 통과함)", () => {
    expect(oldMobCodes.length).toBeGreaterThan(0);
    expect(Object.keys(corrections.manualDrops ?? {}).length).toBeGreaterThan(0);
  });

  it("identityRemap의 대상 mobCode와 옛 mobCode가 겹치지 않는다", () => {
    const overlap = newMobCodes.filter((code) => oldMobCodes.includes(code));
    expect(overlap).toEqual([]);
  });

  it("드랍 소스 무시 목록이 identityRemap의 옛 mobCode를 모두 포함한다", () => {
    // 충돌 mobCode의 드랍은 같은 몬스터의 것이 아니므로 전부 폐기돼야 한다.
    const ignored = new Set((corrections.dropSourceIgnoredMobCodes ?? []).map(Number));
    const missing = oldMobCodes.filter((code) => !ignored.has(code));
    expect(missing).toEqual([]);
  });
});
