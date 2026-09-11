import { describe, expect, it } from "vitest";
import monstersJson from "@data/monsters.json";
import { resolveSelectedMonster } from "../monsters";
import { filterReleasedMonsters } from "@/lib/release-filter";
import type { Monster } from "@/types/monster";

const released = filterReleasedMonsters(monstersJson as Monster[]);

describe("resolveSelectedMonster", () => {
  it("mobCode가 있으면 동명이몹 중 정확히 그 몬스터를 고른다", () => {
    // 스톤골렘은 이름이 같은데 HP가 4000 / 600으로 다르다. 이름만으로 찾으면 배열 첫 항목인
    // 4000짜리로 흘러가서, 600짜리를 선택할 방법이 아예 없었다.
    const all = released.filter((monster) => monster.name === "스톤골렘");
    expect(all.length).toBeGreaterThan(1);

    for (const monster of all) {
      const resolved = resolveSelectedMonster(released, "스톤골렘", monster.mobCode);
      expect(resolved?.mobCode).toBe(monster.mobCode);
      expect(resolved?.hp).toBe(monster.hp);
    }

    // HP가 실제로 서로 다른지(테스트가 무의미해지지 않았는지) 확인
    expect(new Set(all.map((monster) => monster.hp)).size).toBeGreaterThan(1);
  });

  it("mobCode가 없으면 이름으로 폴백한다 (?mob=이름 링크·구 프리셋 호환)", () => {
    const byName = resolveSelectedMonster(released, "스톤골렘");
    expect(byName?.name).toBe("스톤골렘");
    expect(byName).toEqual(released.find((monster) => monster.name === "스톤골렘"));
  });

  it("mobCode가 목록에 없으면 이름으로 폴백한다", () => {
    const resolved = resolveSelectedMonster(released, "스톤골렘", 99999999);
    expect(resolved?.name).toBe("스톤골렘");
  });

  it("이름이 달라도 mobCode가 우선한다 (링크로 넘어온 값이 정답)", () => {
    const target = released.find((monster) => monster.name === "주니어 스톤볼");
    expect(target).toBeDefined();
    const resolved = resolveSelectedMonster(released, "전혀 다른 이름", target!.mobCode);
    expect(resolved?.mobCode).toBe(target!.mobCode);
  });

  it("이름도 mobCode도 못 찾으면 undefined", () => {
    expect(resolveSelectedMonster(released, "없는몬스터")).toBeUndefined();
    expect(resolveSelectedMonster(released, "없는몬스터", 99999999)).toBeUndefined();
  });

  it("HP가 다른 동명이몹 전부가 mobCode로 정확히 구분된다", () => {
    const byName = new Map<string, Monster[]>();
    for (const monster of released) {
      const list = byName.get(monster.name) ?? [];
      list.push(monster);
      byName.set(monster.name, list);
    }
    const ambiguous = [...byName.values()].filter(
      (list) => list.length > 1 && new Set(list.map((m) => m.hp)).size > 1,
    );
    expect(ambiguous.length).toBeGreaterThan(0);

    for (const list of ambiguous) {
      for (const monster of list) {
        const resolved = resolveSelectedMonster(released, monster.name, monster.mobCode);
        expect(resolved?.mobCode, `${monster.name} ${monster.mobCode}`).toBe(monster.mobCode);
      }
    }
  });
});
