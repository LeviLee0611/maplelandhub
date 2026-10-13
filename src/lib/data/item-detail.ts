import type { Monster } from "@/types/monster";
import { createReleaseFilterer, type ReleaseFilters } from "@/lib/release-filter";

/**
 * 아이템 상세 페이지(`/item/[itemId]`, `/planet/item/[itemId]`)용 서버 전용 데이터 조립.
 *
 * 몬스터 상세(monster-detail.ts)와 짝이 되는 모듈이지만 구조가 다르다 — 이 파일은 **JSON 을 직접
 * import 하지 않는다.** 아이템 페이지는 정적 생성이 아니라 edge 동적 라우트라(아래 참고) 라우트마다
 * 서버 데이터가 워커 번들에 들어간다. 메랜·플래닛 데이터를 한 모듈에서 다 import 하면 두 서버 분이
 * 모든 라우트에 실리므로, 서버별 모듈(item-detail.mapleland.ts / item-detail.planet.ts)이 자기 JSON 만
 * 읽어서 이 팩토리에 넘긴다.
 *
 * 왜 동적 라우트인가: Cloudflare next-on-pages 는 프리렌더 페이지당 파일 12개를 만들고 라우트 ~6,300개를
 * 넘으면 빌드가 죽는다(TODO "배포 한계"). 아이템은 메랜만 2,800개라 정적으로는 못 만든다. edge 동적
 * 라우트는 프리렌더 파일이 없어 이 상한과 무관하다 — API 라우트가 이미 같은 방식으로 돌고 있다.
 *
 * 클라이언트 컴포넌트에서 import 금지(서버 전용).
 */

export type ItemServer = "mapleland" | "planet";

export type ItemTypeInfo = { overallCategory?: string; category?: string; subCategory?: string };
export type ItemEquipMeta = {
  reqLevel?: number;
  reqSTR?: number;
  reqDEX?: number;
  reqINT?: number;
  reqLUK?: number;
  reqJob?: number;
  reqPOP?: number;
  tuc?: number;
  attackSpeed?: number;
  incPAD?: number;
  incMAD?: number;
  incPDD?: number;
  incMDD?: number;
  incSTR?: number;
  incDEX?: number;
  incINT?: number;
  incLUK?: number;
  incMHP?: number;
  incMMP?: number;
  incACC?: number;
  incEVA?: number;
  incSpeed?: number;
  incJump?: number;
  tradeBlock?: boolean;
};
export type ItemMeta = {
  only?: boolean;
  synthetic?: boolean;
  shop?: { price?: number };
  equip?: ItemEquipMeta;
  scroll?: { success?: number; masterLevel?: number };
  consumeSpec?: Record<string, string | number | boolean>;
  cash?: { cash?: boolean };
};
export type ItemRecord = { id: number; name: string; typeInfo?: ItemTypeInfo; equipGroup?: string; meta?: ItemMeta };

type DropRow = { itemId: number; prob?: number };
type SpawnRow = { mob_code: number; maps?: Array<{ map_code: number; map_name: string }> };

export type ItemDropSource = {
  mobCode: number;
  name: string;
  level: number;
  hp: number;
  prob?: number;
  /** 그 몬스터의 출현 맵 중 앞 3곳 — "어디서 파밍하나"에 바로 답하기 위해 */
  maps: string[];
};

export type ItemDetail = {
  item: ItemRecord;
  labels: { overall: string; category: string; subCategory?: string };
  /** 출시 필터를 통과한 몬스터만, 확률 높은 순 */
  sources: ItemDropSource[];
  /** 같은 장비 부위·비슷한 요구 레벨(±10)의 다른 아이템 — 내부 링크용 */
  related: Array<Pick<ItemRecord, "id" | "name"> & { reqLevel?: number }>;
};

export type ItemDetailSources = {
  server: ItemServer;
  monsters: Monster[];
  dropIndex: { items: ItemRecord[]; dropsByMonsterId: Record<string, DropRow[]> };
  spawns: { rows?: SpawnRow[] };
  releaseFilters: ReleaseFilters;
};

// ── 분류 한글 표기 ───────────────────────────────────────────────────────────────
// 원본(maplestory.io)의 영문 분류를 그대로 노출하면 "영어 이름 절대 금지" 원칙에 어긋난다.
// 표에 없는 값은 영문 그대로 두지 않고 "기타"로 뭉뚱그린다.
const OVERALL_LABELS: Record<string, string> = { Equip: "장비", Use: "소비", Etc: "기타", Setup: "설치", Cash: "캐시" };
const CATEGORY_LABELS: Record<string, string> = {
  Armor: "방어구",
  Accessory: "장신구",
  "One-Handed Weapon": "한손 무기",
  "Two-Handed Weapon": "두손 무기",
  "Secondary Weapon": "보조 무기",
  "Armor Scroll": "방어구 주문서",
  "Weapon Scroll": "무기 주문서",
  "Character Modification": "캐릭터 강화",
  Consumable: "소비 아이템",
  Crafting: "제작 재료",
  Projectile: "투사체",
  Other: "기타",
  Chair: "의자",
};
const SUBCATEGORY_LABELS: Record<string, string> = {
  Cap: "모자",
  Coat: "상의",
  Pants: "하의",
  Longcoat: "한벌옷",
  Shoes: "신발",
  Glove: "장갑",
  Cape: "망토",
  Shield: "방패",
  Earrings: "귀고리",
  "Face Accessory": "얼굴 장식",
  "Eye Decoration": "눈 장식",
  Pendant: "펜던트",
  Belt: "허리띠",
  Ring: "반지",
  "One-Handed Sword": "한손검",
  "One-Handed Axe": "한손도끼",
  "One-Handed Blunt Weapon": "한손둔기",
  Dagger: "단검",
  Wand: "완드",
  Staff: "스태프",
  "Two-Handed Sword": "두손검",
  "Two-Handed Axe": "두손도끼",
  "Two-Handed Blunt": "두손둔기",
  Spear: "창",
  Polearm: "폴암",
  Bow: "활",
  Crossbow: "석궁",
  Claw: "아대",
  Knuckle: "너클",
  Gun: "건",
  "Mastery Book": "마스터리북",
  "Monster Drop": "몬스터 드랍",
  Book: "책",
  Arrow: "화살",
  "Throwing Star": "표창",
  Bullet: "총알",
  Consumable: "소비",
  Scroll: "주문서",
  Potion: "물약",
  Food: "음식",
  Ore: "원석",
  Mineral: "광물",
  Jewel: "보석",
  Crystal: "크리스탈",
  Other: "기타",
  // 아래는 실데이터에서 실제로 나오는 표기들(itemDetail.test.ts 가 누락을 잡는다)
  Bottom: "하의",
  Bottomwear: "하의",
  Top: "상의",
  Topwear: "상의",
  Overall: "한벌옷",
  Hat: "모자",
  Helmet: "투구",
  Gloves: "장갑",
  "One-Handed BW": "한손둔기",
  "Two-Handed BW": "두손둔기",
  "Pole Arm": "폴암",
  "Crossbow Bolt": "석궁 화살",
  Thrown: "표창",
  "Event Item": "이벤트 아이템",
  "Food and Drink": "음식",
  "Status Cure": "상태이상 치료",
  "Teleport Item": "이동 아이템",
  "Quest Item": "퀘스트 아이템",
  Maker: "제작",
  "Mineral Ore": "광물 원석",
  "Mineral Processed": "광물 주괴",
  "Rare Ore": "보석 원석",
  "Rare Processed  Ore": "가공 보석",
  Pet: "펫",
};

// reqJob 은 비트마스크다: 1 전사, 2 마법사, 4 궁수, 8 도적, 16 해적. 0 은 공용.
const JOB_BITS: Array<[number, string]> = [
  [1, "전사"],
  [2, "마법사"],
  [4, "궁수"],
  [8, "도적"],
  [16, "해적"],
];
export function jobLabel(reqJob?: number): string {
  if (!reqJob) return "공용";
  const names = JOB_BITS.filter(([bit]) => (reqJob & bit) !== 0).map(([, name]) => name);
  return names.length ? names.join("·") : "공용";
}

export function categoryLabels(item: ItemRecord) {
  const ti = item.typeInfo ?? {};
  const overall = OVERALL_LABELS[ti.overallCategory ?? ""] ?? inferOverallFromId(item.id);
  const category = CATEGORY_LABELS[ti.category ?? ""] ?? (ti.category ? "기타" : overall);
  const subCategory = ti.subCategory ? (SUBCATEGORY_LABELS[ti.subCategory] ?? undefined) : undefined;
  return { overall, category, subCategory };
}

function inferOverallFromId(itemId: number) {
  const head = String(itemId)[0];
  return head === "1" ? "장비" : head === "2" ? "소비" : head === "3" ? "설치" : head === "4" ? "기타" : head === "5" ? "캐시" : "기타";
}

// ── 조립 ────────────────────────────────────────────────────────────────────────
export function createItemDetailIndex(sources: ItemDetailSources) {
  const filterer = createReleaseFilterer(sources.releaseFilters);
  const monsters = filterer.filterReleasedMonsters(sources.monsters);
  const monsterByCode = new Map<number, Monster>();
  for (const m of monsters) if (!monsterByCode.has(m.mobCode)) monsterByCode.set(m.mobCode, m);

  const itemById = new Map<number, ItemRecord>();
  for (const it of sources.dropIndex.items) {
    // 음수 id 는 파싱 실패분(마스터리북 해시), synthetic 은 드랍표 전용 가짜 항목 — 페이지를 만들지 않는다.
    if (typeof it.id !== "number" || it.id <= 0 || it.meta?.synthetic) continue;
    if (!itemById.has(it.id)) itemById.set(it.id, it);
  }

  // 정방향(몬스터→아이템)에서 역방향을 직접 만든다. monstersByItemId 는 과거에 모양이 깨진 적이 있어
  // (bare integer, 2026-09-30) 소스로 쓰지 않는다. 출시 필터를 통과한 몬스터만 센다.
  const sourcesByItemId = new Map<number, Array<{ mobCode: number; prob?: number }>>();
  for (const [mobKey, rows] of Object.entries(sources.dropIndex.dropsByMonsterId)) {
    const mobCode = Number(mobKey);
    if (!monsterByCode.has(mobCode)) continue;
    for (const row of rows ?? []) {
      if (!row || typeof row.itemId !== "number") continue;
      const list = sourcesByItemId.get(row.itemId) ?? [];
      if (!list.some((e) => e.mobCode === mobCode)) list.push({ mobCode, prob: row.prob });
      sourcesByItemId.set(row.itemId, list);
    }
  }

  const mapsByMobCode = new Map<number, string[]>(
    (sources.spawns.rows ?? []).map((row) => [row.mob_code, (row.maps ?? []).map((m) => m.map_name)]),
  );

  // 관련 아이템 인덱스: 장비 부위별로 요구 레벨 순 정렬
  const byEquipGroup = new Map<string, Array<{ id: number; name: string; reqLevel: number }>>();
  for (const it of itemById.values()) {
    const group = it.equipGroup;
    const reqLevel = it.meta?.equip?.reqLevel;
    if (!group || typeof reqLevel !== "number") continue;
    const list = byEquipGroup.get(group) ?? [];
    list.push({ id: it.id, name: it.name, reqLevel });
    byEquipGroup.set(group, list);
  }
  for (const list of byEquipGroup.values()) list.sort((a, b) => a.reqLevel - b.reqLevel || a.id - b.id);

  function getItemDetail(itemId: number): ItemDetail | null {
    const item = itemById.get(itemId);
    if (!item) return null;
    const sourceRows = (sourcesByItemId.get(itemId) ?? [])
      .map((e) => {
        const m = monsterByCode.get(e.mobCode)!;
        return { mobCode: m.mobCode, name: m.name, level: m.level, hp: m.hp, prob: e.prob, maps: (mapsByMobCode.get(m.mobCode) ?? []).slice(0, 3) };
      })
      .sort((a, b) => (b.prob ?? -1) - (a.prob ?? -1) || a.level - b.level);

    const reqLevel = item.meta?.equip?.reqLevel;
    const related =
      item.equipGroup && typeof reqLevel === "number"
        ? (byEquipGroup.get(item.equipGroup) ?? [])
            .filter((e) => e.id !== item.id && Math.abs(e.reqLevel - reqLevel) <= 10)
            .slice(0, 12)
        : [];

    return { item, labels: categoryLabels(item), sources: sourceRows, related };
  }

  /**
   * 검색엔진에 색인시키지 않을 "내용이 없는" 아이템 페이지인지.
   * 드랍 몬스터도 없고 장비/주문서/소비 스펙도 없으면 이름과 분류뿐이라 본문이 없다.
   * 몬스터 쪽 isThinMonsterPage 와 같은 원칙 — 사이트에선 보여주되 sitemap·색인에서 뺀다.
   */
  function isThinItemPage(itemId: number): boolean {
    const detail = getItemDetail(itemId);
    if (!detail) return true;
    const meta = detail.item.meta ?? {};
    const hasSpec = Boolean(meta.equip?.reqLevel !== undefined && Object.keys(meta.equip ?? {}).some((k) => k.startsWith("inc")))
      || Boolean(meta.scroll) || Boolean(meta.consumeSpec);
    return detail.sources.length === 0 && !hasSpec;
  }

  /** sitemap 용 — 페이지가 있고 얇지 않은 아이템 id 전부 */
  function getIndexableItemIds(): number[] {
    return [...itemById.keys()].filter((id) => !isThinItemPage(id)).sort((a, b) => a - b);
  }

  function getAllItemIds(): number[] {
    return [...itemById.keys()];
  }

  return { server: sources.server, getItemDetail, isThinItemPage, getIndexableItemIds, getAllItemIds };
}

export type ItemDetailIndex = ReturnType<typeof createItemDetailIndex>;
