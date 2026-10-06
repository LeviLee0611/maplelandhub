import { describe, expect, it } from "vitest";

import mainSkillMapping from "@data/skills/mainSkillMapping.json";
import weaponMapping from "@data/skills/weaponMapping.json";
import damageMapping from "@data/skills/damageMapping.json";
import damageMappingActive from "@data/skills/damageMappingActive.json";
import criticalThrowMapping from "@data/skills/criticalThrowMapping.json";
import range20 from "@data/skills/range20.json";
import range30 from "@data/skills/range30.json";

/**
 * 에반(2026-10-01 메이플 플래닛 출시) 스킬 데이터 회귀 테스트.
 *
 * 공개된 수치가 **마스터 레벨뿐**이라는 게 이 직업의 특수성이다. 계산기는 그래서
 * "damageMapping 의 레벨 키가 마스터 하나뿐"인 스킬의 레벨 입력을 잠근다. 이 테스트는
 * 그 전제가 깨지지 않는지 — 즉 마스터 레벨 키가 range20/range30 과 어긋나지 않는지 —
 * 지킨다. 어긋나면 계산기가 빈 lookup을 하고 결과가 통째로 사라진다.
 *
 * 수치 출처: 플래닛 공식 패치노트 https://mapleplanet.co.kr/news/updates/733
 */

const EVAN_SKILLS = [
  "매직 미사일",
  "파이어 서클",
  "라이트닝 볼트",
  "아이스 브레스",
  "매직 플레어",
  "드래곤 쓰러스트",
  "브레스",
  "킬링 윙",
  "어스퀘이크",
  "고스트 레터링",
  "일루전",
  "플레임 휠",
  "블레이즈",
  "다크포그",
] as const;

// 패치노트의 "기본 공격력" / "최대 공격력"(차징 스킬) 값과 타수.
const EXPECTED: Record<string, { level: 20 | 30; damage: number; count: number }> = {
  "매직 미사일": { level: 20, damage: 40, count: 2 },
  "파이어 서클": { level: 20, damage: 55, count: 1 },
  "라이트닝 볼트": { level: 20, damage: 95, count: 1 },
  "아이스 브레스": { level: 20, damage: 110, count: 1 },
  "매직 플레어": { level: 20, damage: 120, count: 1 },
  "드래곤 쓰러스트": { level: 20, damage: 130, count: 1 },
  "브레스": { level: 20, damage: 180, count: 1 },
  "킬링 윙": { level: 20, damage: 150, count: 1 },
  "어스퀘이크": { level: 20, damage: 110, count: 1 },
  "고스트 레터링": { level: 20, damage: 120, count: 1 },
  "일루전": { level: 30, damage: 95, count: 4 },
  "플레임 휠": { level: 30, damage: 200, count: 1 },
  "블레이즈": { level: 30, damage: 210, count: 1 },
  "다크포그": { level: 30, damage: 750, count: 1 },
};

type DamageEntry = { damage?: number; count?: number; mastery?: number };

describe("에반 스킬 데이터", () => {
  const skills = (mainSkillMapping as Record<string, string[]>)["에반"];
  const damage = damageMapping as Record<string, Record<string, number | DamageEntry>>;

  it("직업과 무기가 등록돼 있다", () => {
    expect(skills).toEqual([...EVAN_SKILLS]);
    expect((weaponMapping as Record<string, string[]>)["에반"]).toEqual(["완드", "스태프"]);
  });

  it("14종 전부 패치노트 수치·타수와 일치한다", () => {
    for (const name of EVAN_SKILLS) {
      const expected = EXPECTED[name];
      const entry = damage[name]?.[String(expected.level)] as DamageEntry | undefined;
      expect(entry, name).toBeDefined();
      expect(entry!.damage, name).toBe(expected.damage);
      expect(entry!.count ?? 1, name).toBe(expected.count);
      expect(entry!.mastery, name).toBe(0.6);
    }
  });

  it("마스터 레벨 키가 range20/range30 판정과 일치한다", () => {
    // 계산기의 skillLevelMax 는 이 두 집합으로 결정된다. 여기서 어긋나면 레벨 잠금이
    // 엉뚱한 레벨을 가리켜 lookup 이 비고 결과가 사라진다.
    const set20 = new Set(range20 as string[]);
    const set30 = new Set(range30 as string[]);
    for (const name of EVAN_SKILLS) {
      const expected = EXPECTED[name];
      expect(expected.level === 20 ? set20.has(name) : set30.has(name), name).toBe(true);
      expect(Object.keys(damage[name]), name).toEqual([String(expected.level)]);
    }
  });

  it("마스터 전용 잠금 대상은 에반 스킬뿐이다", () => {
    // 잠금 판정이 다른 직업 스킬까지 잡아먹으면 레벨 입력이 통째로 막힌다.
    const set20 = new Set(range20 as string[]);
    const set30 = new Set(range30 as string[]);
    const maxOf = (name: string) =>
      name === "어드밴스드 차지" ? 10 : set20.has(name) ? 20 : set30.has(name) ? 30 : 30;
    const locked = Object.entries(damage)
      .filter(([name, levels]) => Object.keys(levels).length === 1 && Object.keys(levels)[0] === String(maxOf(name)))
      .map(([name]) => name);
    expect(locked.sort()).toEqual([...EVAN_SKILLS].sort());
  });

  it("보조 패시브는 마스터 레벨 값만 들어있다", () => {
    const amp = (damageMappingActive as Record<string, unknown>)["매직 엠플리피케이션"];
    expect(amp).toEqual({ "0": 100, "15": 135 });

    const crit = (criticalThrowMapping as Record<string, Record<string, { damage?: number; rate?: number }>>)["크리티컬 매직"];
    expect(crit?.["15"]).toEqual({ damage: 150, rate: 0.3 });
    expect(crit?.["0"]).toEqual({ damage: 100, rate: 0 });
  });
});
