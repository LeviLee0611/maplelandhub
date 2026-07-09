import type { QuestBoardProps } from "@/components/QuestBoard";
import type { QuestData } from "@/types/quest";

type RawItemDetailBy = { itemsByItemId?: Record<string, Array<{ mobId: number; prob?: number }>> };
type RawDropIndex = { monstersByItemId?: Record<string, Array<{ mobId: number; prob?: number }>> };
type RawNpcLocations = { rows?: Array<{ npc_code?: number; maps?: Array<{ map_name?: string }> }> };
type RawMonsterSpawns = { rows?: Array<{ mob_code?: number; mob_name?: string; maps?: Array<{ map_name?: string }> }> };

export type SlimQuestBoardData = Pick<
  QuestBoardProps,
  "monsterData" | "dropIndexData" | "itemDetailByData" | "monsterSpawnsData" | "npcLocationsData"
>;

/**
 * QuestBoard("use client")는 703개 퀘스트 전체를 동시에 검색/필터링해야 해서 DropTable처럼
 * 온디맨드 fetch로 나눌 수 없다 — 대신 퀘스트 데이터가 실제로 참조하는 아이템/NPC/몬스터 id만
 * 서버에서 미리 골라 원본 JSON(수 MB)보다 훨씬 작은 버전을 만들어 한 번에 전달한다.
 *
 * itemDropMonstersByItemId(QuestBoard.tsx)는 보상 아이템이 아니라 퀘스트 완료 시 제출하는
 * 수집 아이템(quest.requirements.complete.items)의 드랍처 표시에 쓰이므로, referencedItemIds는
 * 보상템과 수집템을 모두 포함해야 한다 — 하나만 모으면 다른 쪽 드랍 정보가 통째로 빠진다.
 */
export function buildSlimQuestBoardData(
  quests: QuestData["quests"],
  monsters: QuestBoardProps["monsterData"],
  dropIndex: unknown,
  itemDetailBy: unknown,
  npcLocations: unknown,
  monsterSpawns: unknown,
): SlimQuestBoardData {
  const rawDropIndex = dropIndex as RawDropIndex;
  const rawItemDetailBy = itemDetailBy as RawItemDetailBy;
  const rawNpcLocations = npcLocations as RawNpcLocations;
  const rawMonsterSpawns = monsterSpawns as RawMonsterSpawns;

  const referencedItemIds = new Set<number>();
  const neededMobIds = new Set<number>();
  for (const quest of quests) {
    for (const item of quest.rewards?.items ?? []) {
      if (item?.id) referencedItemIds.add(Number(item.id));
    }
    for (const item of quest.requirements?.complete?.items ?? []) {
      if (item?.id) referencedItemIds.add(Number(item.id));
    }
    for (const mob of quest.requirements?.complete?.mobs ?? []) {
      if (mob?.id) neededMobIds.add(Number(mob.id));
    }
  }

  const questNpcIds = new Set<number>(quests.map((quest) => quest.npcId));

  const slimItemsByItemId: Record<string, Array<{ mobId: number; prob?: number }>> = {};
  const slimMonstersByItemId: Record<string, Array<{ mobId: number; prob?: number }>> = {};

  for (const itemId of referencedItemIds) {
    const key = String(itemId);
    const preferred = rawItemDetailBy.itemsByItemId?.[key];
    if (preferred?.length) {
      slimItemsByItemId[key] = preferred;
      for (const entry of preferred) if (entry?.mobId) neededMobIds.add(Number(entry.mobId));
      continue;
    }
    const fallback = rawDropIndex.monstersByItemId?.[key];
    if (fallback?.length) {
      slimMonstersByItemId[key] = fallback;
      for (const entry of fallback) if (entry?.mobId) neededMobIds.add(Number(entry.mobId));
    }
  }

  return {
    monsterData: monsters.filter((monster) => neededMobIds.has(Number(monster.mobCode))),
    dropIndexData: { monstersByItemId: slimMonstersByItemId },
    itemDetailByData: { itemsByItemId: slimItemsByItemId },
    monsterSpawnsData: {
      rows: (rawMonsterSpawns.rows ?? []).filter((row) => neededMobIds.has(Number(row?.mob_code ?? 0))),
    },
    npcLocationsData: {
      rows: (rawNpcLocations.rows ?? []).filter((row) => questNpcIds.has(Number(row?.npc_code ?? 0))),
    },
  };
}
