import { describe, expect, it } from "vitest";

import monsters from "@data/monsters.json";
import dropIndex from "@data/drop-index.json";
import releaseFilters from "@data/release-filters.json";
import planetMonsters from "@data/planet/monsters.json";
import planetDropIndex from "@data/planet/drop-index.json";
import planetReleaseFilters from "@data/planet/release-filters.json";
import quests from "@data/quests.json";

/**
 * 한국어 서비스인데 화면에 영문 이름이 노출되던 문제(2026-09-28)의 회귀 테스트.
 *
 * 왜 생겼나: 드롭/몬스터 원본이 GMS 기반이라, 빅뱅 때 삭제돼 KMS에 대응 항목이 없는
 * 아이템·몬스터는 이름 조회가 GMS 영문까지 폴백해 영문이 그대로 박혔다.
 * 크림슨 발록·파풀라투스·천구 같은 인기 보스의 드롭 목록에 "Balrog Claw" 같은 게 떠 있었다.
 *
 * 여기서 막는 것: **유저에게 보이는** 이름에 영문이 섞이는 것.
 * release-filter로 걸러져 화면에 나오지 않는 몬스터(한국 서버에 아예 없는 GMS 이벤트 몹)는
 * 한글명 자체가 존재하지 않으므로 대상에서 제외한다 — 그것까지 강제하면 이름을 지어내야 한다.
 */

const HANGUL = /[가-힣]/;
const LATIN_WORD = /[A-Za-z]{2}/;

/**
 * 영문 이름이 허용되는 예외 — **게임 내 명칭 자체가 영문인 경우만** 넣는다.
 *
 * 9400546 `I.AM.ROBOT` (마스테리아/산비탈): 독립 소스 6곳(메이플노트 클래식, chowayo, maplab,
 * mapledb, maplestory.io 한국 리전 16개 버전, 메랜닷컴)을 전부 확인했는데 한 곳도 한글명을 갖고
 * 있지 않다. 특히 메랜닷컴·메이플노트는 같은 목록의 일렉트로펀트·부머는 한글로 쓰면서 이것만
 * 영문으로 둔다 — 번역 누락이 아니라 원래 이름이 영문이라는 뜻이다. 조사 경위는
 * TODO.md > "플래닛 데이터 정합성" 절 참고.
 *
 * 여기 추가하려면 "한글명을 못 찾았다"가 아니라 "게임에서 영문으로 표기된다"는 근거가 있어야 한다.
 */
const ALLOWED_ENGLISH_MOB_CODES = new Set<number>([9400546]);

/** 한글이 하나도 없으면서 영문 낱말이 있는 이름 = 미번역으로 본다. */
function isUntranslated(name: unknown): boolean {
  if (typeof name !== "string" || !name.trim()) return false;
  if (HANGUL.test(name)) return false;
  return LATIN_WORD.test(name);
}

type Filters = {
  blockedMobCodes?: number[];
  blockedMobCodeMin?: number;
  allowedMobCodes?: number[];
};

function makeIsReleased(filters: Filters) {
  const blocked = new Set(filters.blockedMobCodes ?? []);
  const allowed = new Set(filters.allowedMobCodes ?? []);
  const min = filters.blockedMobCodeMin;
  return (mobCode: number) => {
    if (blocked.has(mobCode)) return false;
    if (typeof min === "number" && mobCode >= min && !allowed.has(mobCode)) return false;
    return true;
  };
}

type Monster = { mobCode: number; name: string };
type DropIndex = {
  items: Array<{ id: number; name: string }>;
  monstersByItemId: Record<string, Array<{ mobId: number }>>;
};

const servers: Array<{ label: string; monsters: Monster[]; dropIndex: DropIndex; filters: Filters }> = [
  {
    label: "메이플랜드",
    monsters: monsters as Monster[],
    dropIndex: dropIndex as unknown as DropIndex,
    filters: releaseFilters as Filters,
  },
  {
    label: "메이플 플래닛",
    monsters: planetMonsters as Monster[],
    dropIndex: planetDropIndex as unknown as DropIndex,
    filters: planetReleaseFilters as Filters,
  },
];

describe.each(servers)("$label — 화면에 노출되는 이름에 영문이 없어야 한다", ({ monsters: mobs, dropIndex: di, filters }) => {
  const isReleased = makeIsReleased(filters);

  it("드롭 아이템 이름이 전부 한글이다", () => {
    const offenders = di.items
      .filter((item) => isUntranslated(item.name))
      .map((item) => `${item.id}: ${item.name}`);
    expect(offenders).toEqual([]);
  });

  it("노출되는 몬스터의 이름이 전부 한글이다", () => {
    const offenders = mobs
      .filter((m) => isReleased(m.mobCode) && isUntranslated(m.name) && !ALLOWED_ENGLISH_MOB_CODES.has(m.mobCode))
      .map((m) => `${m.mobCode}: ${m.name}`);
    expect(offenders).toEqual([]);
  });

  it("노출되는 몬스터가 드롭하는 아이템 이름이 전부 한글이다", () => {
    const offenders: string[] = [];
    for (const item of di.items) {
      if (!isUntranslated(item.name)) continue;
      const droppers = di.monstersByItemId[String(item.id)] ?? [];
      if (droppers.some((d) => isReleased(d.mobId))) offenders.push(`${item.id}: ${item.name}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("퀘스트 데이터에 영문 이름이 없어야 한다", () => {
  it("퀘스트 처치 대상 몬스터 이름이 전부 한글이다", () => {
    const list = (Array.isArray(quests) ? quests : (quests as { quests: unknown[] }).quests) as Array<{
      name?: string;
      requirements?: Record<string, { mobs?: Array<{ id: number; name: string }> }>;
    }>;
    const offenders: string[] = [];
    for (const quest of list) {
      for (const phase of Object.values(quest.requirements ?? {})) {
        for (const mob of phase?.mobs ?? []) {
          if (isUntranslated(mob.name)) offenders.push(`${quest.name} / ${mob.id}: ${mob.name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
