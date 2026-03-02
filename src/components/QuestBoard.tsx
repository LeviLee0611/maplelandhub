"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { getItemIconUrl, getMobIconUrl, getNpcIconUrl, handleMapleIoImageError } from "@/lib/maplestory-io";
import { isReleasedMobCode } from "@/lib/release-filter";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import questJson from "@data/quests.json";
import type { Quest, QuestData } from "@/types/quest";
import monstersJson from "@data/monsters.json";
import dropIndexJson from "@data/drop-index.json";
import itemDetailByJson from "@data/item-detail-by.json";
import npcLocationsJson from "@data/npc-locations.json";

type RewardTypeFilter = "all" | "exp" | "meso" | "item";
type RewardItemTypeFilter = "all" | "scroll" | "equip" | "etc";

const data = questJson as QuestData;
const monsterData = monstersJson as Array<{
  name: string;
  mobCode: number;
  region?: string;
  map?: string;
  exist?: boolean;
}>;
const dropIndexData = dropIndexJson as {
  monstersByItemId?: Record<string, Array<{ mobId: number; prob?: number }>>;
};
const itemDetailByData = itemDetailByJson as {
  itemsByItemId?: Record<string, Array<{ mobId: number; prob?: number }>>;
};
const npcLocationsData = npcLocationsJson as {
  rows?: Array<{
    npc_code?: number;
    maps?: Array<{
      map_name?: string;
    }>;
  }>;
};

type QuestTrackerRow = Database["public"]["Tables"]["quest_trackers"]["Row"];
type TrackerMapValue = Pick<QuestTrackerRow, "id" | "quest_id" | "is_completed">;
const INITIAL_VISIBLE_COUNT = 10;

function normalizeQuery(text: string) {
  return text.toLowerCase().replace(/\s+/g, "");
}

function getSearchKeys(raw: string) {
  const base = String(raw ?? "").trim();
  if (!base) return [];
  const normalized = normalizeQuery(base);
  const tokens = base.split(/\s+/).filter(Boolean);
  const initials = tokens.map((token) => token[0]).join("");
  const firstTwoChars = tokens.map((token) => token.slice(0, 2)).join("");
  return Array.from(new Set([normalized, normalizeQuery(initials), normalizeQuery(firstTwoChars)]));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getRewardItemGroup(itemId: number, itemName: string) {
  const name = String(itemName ?? "").toLowerCase();
  if (name.includes("주문서") || name.includes("scroll")) return "scroll";
  if (itemId >= 1_000_000 && itemId < 2_000_000) return "equip";
  return "etc";
}

function isUnreleasedArea(text?: string) {
  return String(text ?? "").includes("노틸러스");
}

function toDisplayMapName(raw?: string) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (!text.includes(":")) return text;
  const right = text.split(":").pop()?.trim();
  return right || text;
}

function getWorldGroup(worldName?: string, npcName?: string) {
  const npc = String(npcName ?? "").trim();
  if (npc.includes("스피루나")) return "오르비스";
  if (npc.includes("엘마")) return "오르비스";
  if (npc.includes("태공")) return "아쿠아리움";

  const text = String(worldName ?? "").trim();
  if (!text) return "기타";
  if (
    text.includes("빅토리아") ||
    text.includes("헤네시스") ||
    text.includes("엘리니아") ||
    text.includes("페리온") ||
    text.includes("커닝") ||
    text.includes("슬리피") ||
    text.includes("리스항구") ||
    text.includes("플로리나") ||
    text.includes("골렘의사원") ||
    text.includes("동쪽바위산") ||
    text.includes("북쪽숲") ||
    text.includes("히든스트리트") ||
    text.includes("워닝스트리트") ||
    text.includes("개미굴") ||
    text.includes("이블아이의굴") ||
    text.includes("깊은숲") ||
    text.includes("회복사우나실")
  ) {
    return "빅토리아";
  }
  if (
    text.includes("루디브리엄") ||
    text.includes("루더스호수") ||
    text.includes("시계탑") ||
    text.includes("에오스탑") ||
    text.includes("핼리오스탑")
  ) {
    return "루디브리움";
  }
  if (text.includes("오르비스") || text.includes("스카이로드")) return "오르비스";
  if (text.includes("리프레") || text.includes("미나르숲")) return "리프레";
  if (text.includes("생명의 동굴") || text.includes("와이번의 협곡")) return "리프레";
  if (text.includes("엘나스") || text.includes("폐광")) return "엘나스";
  if (text.includes("차디찬벌판") || text.includes("눈 덮인 고래섬") || text.includes("눈의정령")) return "엘나스";
  if (text.includes("아쿠아")) return "아쿠아리움";
  if (text.includes("무릉") || text.includes("백초마을") || text.includes("옹달샘")) return "무릉도원";
  if (text.includes("아랫마을") || text.includes("노파의집") || text.includes("태공의 나룻배") || text.includes("요괴의 숲") || text.includes("깊은 산 흉가")) return "아랫마을";
  if (text.includes("아리안트")) return "아리안트";
  if (
    text.includes("쿨란초원") ||
    text.includes("로스웰초원") ||
    text.includes("두 그루의 야자수") ||
    text.includes("구름공원") ||
    text.includes("유적발굴단 캠프")
  ) {
    return "아리안트";
  }
  if (text.includes("마가티아") || text.includes("알카드노") || text.includes("제뉴미스트")) return "마가티아";
  if (text.includes("시간의 신전")) return "시간의 신전";
  if (text.includes("지구방위본부") || text.includes("격납고") || text.includes("사령실") || text.includes("통제구역")) return "지구방위본부";
  if (text.includes("엘리쟈의 정원")) return "오르비스";
  if (text.includes("또다른입구")) return "엘나스";
  if (text.includes("뉴 리프 시티") || text.includes("마스테리아")) return "마스테리아";
  if (text.includes("해외여행")) return "해외여행";
  if (text.includes("버섯신사") || text.includes("[일본]") || text.includes("쇼와")) return "일본";
  if (text.includes("대만")) return "대만";
  if (text.includes("태국")) return "태국";
  if (text.includes("중국")) return "중국";
  return "기타";
}

function collectQuestMapNames(quest: Quest, fallbackWorldName: string) {
  const mapNames = new Set<string>();
  const questAny = quest as Quest & {
    mapName?: string;
    requirements?: Quest["requirements"] & {
      start?: Quest["requirements"]["start"] & { mapName?: string };
      complete?: Quest["requirements"]["complete"] & { mapName?: string };
    };
  };

  const add = (raw?: string) => {
    const text = toDisplayMapName(raw);
    if (!text) return;
    if (isUnreleasedArea(text)) return;
    mapNames.add(text);
  };

  // 실제 퀘스트 맵명 우선
  add(questAny.requirements?.complete?.mapName);
  add(questAny.mapName);
  add(questAny.requirements?.start?.mapName);

  for (const mob of quest.requirements.complete?.mobs ?? []) {
    add(mob.area);
  }

  for (const item of quest.requirements.complete?.items ?? []) {
    add(item.source);
  }

  const guideAreas = String(quest.guide?.recommendedAreas ?? "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
  for (const area of guideAreas) {
    add(area);
  }

  // 맵명을 못 찾았을 때만 월드명으로 fallback
  if (mapNames.size === 0) {
    add(fallbackWorldName);
  }

  return [...mapNames];
}

function collectNpcMapNames(
  quest: Quest,
  fallbackWorldName: string,
  npcMapNamesByNpcId: Map<number, string[]>,
) {
  const mapNames = new Set<string>();
  const questAny = quest as Quest & {
    mapName?: string;
    requirements?: Quest["requirements"] & {
      start?: Quest["requirements"]["start"] & { mapName?: string };
    };
  };

  const add = (raw?: string) => {
    const text = toDisplayMapName(raw);
    if (!text) return;
    if (isUnreleasedArea(text)) return;
    mapNames.add(text);
  };

  for (const mapName of npcMapNamesByNpcId.get(quest.npcId) ?? []) {
    add(mapName);
  }

  add(questAny.mapName);
  add(questAny.requirements?.start?.mapName);

  if (mapNames.size === 0) add(fallbackWorldName);
  return [...mapNames];
}

export function QuestBoard() {
  const [query, setQuery] = useState("");
  const [selectedWorldGroup, setSelectedWorldGroup] = useState("all");
  const [maxLevel, setMaxLevel] = useState("");
  const [rewardTypeFilter, setRewardTypeFilter] = useState<RewardTypeFilter>("all");
  const [rewardItemTypeFilter, setRewardItemTypeFilter] = useState<RewardItemTypeFilter>("all");
  const [showTrackedOnly, setShowTrackedOnly] = useState(false);
  const [highlightedQuestId, setHighlightedQuestId] = useState<number | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [trackerByQuestId, setTrackerByQuestId] = useState<Map<number, TrackerMapValue>>(new Map());
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [pendingQuestIds, setPendingQuestIds] = useState<Record<number, boolean>>({});
  const [syncError, setSyncError] = useState<string | null>(null);
  const [openedMobInfoKey, setOpenedMobInfoKey] = useState<string | null>(null);

  const npcMap = useMemo(() => new Map(data.npcs.map((npc) => [npc.id, npc.name])), []);
  const npcMapNamesByNpcId = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const row of npcLocationsData.rows ?? []) {
      const npcId = Number(row?.npc_code ?? 0);
      if (!Number.isFinite(npcId) || npcId <= 0) continue;
      const names = new Set<string>();
      for (const mapRow of row?.maps ?? []) {
        const mapName = toDisplayMapName(mapRow?.map_name);
        if (!mapName) continue;
        if (isUnreleasedArea(mapName)) continue;
        names.add(mapName);
      }
      if (!names.size) continue;
      map.set(npcId, [...names]);
    }
    return map;
  }, []);
  const worldMap = useMemo(() => new Map(data.worlds.map((world) => [world.id, world.name])), []);
  const questNameById = useMemo(() => new Map(data.quests.map((quest) => [quest.id, quest.name])), []);
  const monsterInfoByMobCode = useMemo(() => {
    const map = new Map<number, { name: string; region?: string; map?: string; exist: boolean }>();
    for (const monster of monsterData) {
      const mobCode = Number(monster.mobCode);
      if (!Number.isFinite(mobCode) || mobCode <= 0) continue;
      map.set(mobCode, {
        name: String(monster.name ?? "").trim(),
        region: String(monster.region ?? "").trim() || undefined,
        map: String(monster.map ?? "").trim() || undefined,
        exist: monster.exist !== false,
      });
    }
    return map;
  }, []);
  const monsterInfoByName = useMemo(() => {
    const map = new Map<string, { name: string; mobCode: number; region?: string; map?: string }>();
    for (const monster of monsterData) {
      const name = String(monster.name ?? "").trim();
      const mobCode = Number(monster.mobCode);
      if (!name) continue;
      map.set(name, {
        name,
        mobCode: Number.isFinite(mobCode) ? mobCode : 0,
        region: String(monster.region ?? "").trim() || undefined,
        map: String(monster.map ?? "").trim() || undefined,
      });
    }
    return map;
  }, []);
  const itemDropMonstersByItemId = useMemo(() => {
    const map = new Map<number, Array<{ mobId: number; name: string; region?: string; prob?: number }>>();
    const resolveItemEntry = (
      entries?: Array<{ mobId: number; prob?: number }>
    ) => {
      return (entries ?? [])
        .map((entry) => {
          const mobId = Number(entry?.mobId ?? 0);
          if (!isReleasedMobCode(mobId)) return null;
          const info = monsterInfoByMobCode.get(mobId);
          if (!info?.name || info.exist === false) return null;
          return {
            mobId,
            name: info.name,
            region: info.region,
            prob: typeof entry?.prob === "number" ? entry.prob : undefined,
          };
        })
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
    };

    // item_detail BY 데이터를 우선 반영
    for (const [itemIdText, entries] of Object.entries(itemDetailByData.itemsByItemId ?? {})) {
      const itemId = Number(itemIdText);
      if (!Number.isFinite(itemId) || itemId <= 0) continue;
      const resolved = resolveItemEntry(entries);
      if (!resolved.length) continue;
      map.set(itemId, resolved);
    }

    for (const [itemIdText, entries] of Object.entries(dropIndexData.monstersByItemId ?? {})) {
      const itemId = Number(itemIdText);
      if (!Number.isFinite(itemId) || itemId <= 0) continue;
      if (map.has(itemId)) continue;

      const resolved = resolveItemEntry(entries);

      // 같은 몬스터가 중복 기록된 경우 확률이 큰 값 하나만 사용
      const dedupedByMobId = new Map<number, { mobId: number; name: string; region?: string; prob?: number }>();
      for (const row of resolved) {
        const prev = dedupedByMobId.get(row.mobId);
        if (!prev) {
          dedupedByMobId.set(row.mobId, row);
          continue;
        }
        if ((row.prob ?? 0) > (prev.prob ?? 0)) {
          dedupedByMobId.set(row.mobId, row);
        }
      }

      const unique = Array.from(dedupedByMobId.values())
        .sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0));

      map.set(itemId, unique);
    }

    return map;
  }, [monsterInfoByMobCode]);

  const maxLevelValue = useMemo(() => {
    const parsed = Number(maxLevel);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [maxLevel]);

  const trackedQuestCount = trackerByQuestId.size;
  const completedQuestCount = useMemo(() => {
    let count = 0;
    for (const tracked of trackerByQuestId.values()) {
      if (tracked.is_completed) count += 1;
    }
    return count;
  }, [trackerByQuestId]);

  const setQuestPending = useCallback((questId: number, pending: boolean) => {
    setPendingQuestIds((prev) => {
      const next = { ...prev };
      if (pending) next[questId] = true;
      else delete next[questId];
      return next;
    });
  }, []);

  const loadTrackers = useCallback(async (uid: string) => {
    setTrackerLoading(true);
    setSyncError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: rows, error } = await supabase
        .from("quest_trackers")
        .select("id, quest_id, is_completed")
        .eq("user_id", uid);

      if (error) throw error;

      const nextMap = new Map<number, TrackerMapValue>();
      for (const row of rows ?? []) {
        nextMap.set(Number(row.quest_id), {
          id: row.id,
          quest_id: Number(row.quest_id),
          is_completed: Boolean(row.is_completed),
        });
      }
      setTrackerByQuestId(nextMap);
    } catch {
      setSyncError("내 퀘스트 동기화에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setTrackerLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    const syncUserAndTrackers = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      const nextUserId = user?.id ?? null;
      setUserId(nextUserId);

      if (!nextUserId) {
        setTrackerByQuestId(new Map());
        setTrackerLoading(false);
        return;
      }

      void loadTrackers(nextUserId);
    };

    void syncUserAndTrackers();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      setUserId(nextUserId);

      if (!nextUserId) {
        setTrackerByQuestId(new Map());
        setTrackerLoading(false);
        return;
      }

      void loadTrackers(nextUserId);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadTrackers]);

  const filteredQuests = useMemo(() => {
    const keyword = normalizeQuery(query);

    const rows = [...data.quests]
      .filter((quest) => {
        const worldName = worldMap.get(quest.worldId) ?? quest.worldId;
        const npcName = npcMap.get(quest.npcId) ?? "";
        if (isUnreleasedArea(worldName)) return false;
        if (selectedWorldGroup !== "all" && getWorldGroup(worldName, npcName) !== selectedWorldGroup) return false;
        if (maxLevelValue !== null && quest.levelMin > maxLevelValue) return false;

        const isTracked = trackerByQuestId.has(quest.id);
        if (showTrackedOnly && !isTracked) return false;

        const hasRewardExp = (quest.rewards.exp ?? 0) > 0;
        const hasRewardMeso = (quest.rewards.meso ?? 0) > 0;
        const hasRewardItems = (quest.rewards.items ?? []).length > 0;
        const rewardItemGroups = (quest.rewards.items ?? []).map((item) => getRewardItemGroup(Number(item.id), item.name));

        if (rewardTypeFilter === "exp" && !hasRewardExp) return false;
        if (rewardTypeFilter === "meso" && !hasRewardMeso) return false;
        if (rewardTypeFilter === "item" && !hasRewardItems) return false;

        if (rewardTypeFilter === "item" && rewardItemTypeFilter !== "all") {
          if (!rewardItemGroups.includes(rewardItemTypeFilter)) return false;
        }

        if (!keyword) return true;
        const rewardNames = (quest.rewards.items ?? []).map((item) => item.name).join(" ");
        const keys = [
          ...getSearchKeys(quest.name),
          ...getSearchKeys(npcName),
          ...getSearchKeys(rewardNames),
          ...getSearchKeys(String(quest.id)),
        ];
        return keys.some((key) => key.includes(keyword));
      })
      .sort((a, b) => {
        const aTracked = trackerByQuestId.has(a.id) ? 0 : 1;
        const bTracked = trackerByQuestId.has(b.id) ? 0 : 1;
        if (aTracked !== bTracked) return aTracked - bTracked;

        if (a.levelMin !== b.levelMin) return a.levelMin - b.levelMin;
        return a.name.localeCompare(b.name, "ko");
      });

    return rows;
  }, [maxLevelValue, npcMap, query, rewardItemTypeFilter, rewardTypeFilter, selectedWorldGroup, showTrackedOnly, trackerByQuestId, worldMap]);

  const displayedQuests = useMemo(() => {
    const hasKeyword = normalizeQuery(query).length > 0;
    if (hasKeyword) return filteredQuests;
    return filteredQuests.slice(0, INITIAL_VISIBLE_COUNT);
  }, [filteredQuests, query]);
  const isSearchMode = useMemo(() => normalizeQuery(query).length > 0, [query]);

  const worldGroupOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const quest of data.quests) {
      const worldName = worldMap.get(quest.worldId) ?? quest.worldId;
      if (isUnreleasedArea(worldName)) continue;

      const npcName = npcMap.get(quest.npcId) ?? "";
      const group = getWorldGroup(worldName, npcName);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }

    const order = [
      "빅토리아",
      "오르비스",
      "루디브리움",
      "리프레",
      "엘나스",
      "아쿠아리움",
      "아랫마을",
      "지구방위본부",
      "무릉도원",
      "아리안트",
      "마가티아",
      "시간의 신전",
      "마스테리아",
      "해외여행",
      "일본",
      "대만",
      "태국",
      "중국",
      "기타",
    ];

    return [...counts.entries()].sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [npcMap, worldMap]);
  const mobAreasById = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const quest of data.quests) {
      for (const mob of quest.requirements.complete?.mobs ?? []) {
        const mobId = Number(mob.id ?? 0);
        const area = String(mob.area ?? "").trim();
        if (!Number.isFinite(mobId) || mobId <= 0 || !area) continue;
        if (!map.has(mobId)) map.set(mobId, new Set());
        map.get(mobId)?.add(area);
      }
    }
    return map;
  }, []);
  const mobAreasByName = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const quest of data.quests) {
      for (const mob of quest.requirements.complete?.mobs ?? []) {
        const mobName = String(mob.name ?? "").trim();
        const area = String(mob.area ?? "").trim();
        if (!mobName || !area) continue;
        if (!map.has(mobName)) map.set(mobName, new Set());
        map.get(mobName)?.add(area);
      }
    }
    return map;
  }, []);

  const handleToggleTracked = useCallback(
    async (questId: number) => {
      if (!userId) {
        window.location.href = "/login";
        return;
      }

      setSyncError(null);
      setQuestPending(questId, true);

      const tracked = trackerByQuestId.get(questId);
      const supabase = getSupabaseBrowserClient();

      try {
        if (tracked) {
          const { error } = await supabase.from("quest_trackers").delete().eq("id", tracked.id);
          if (error) throw error;

          setTrackerByQuestId((prev) => {
            const next = new Map(prev);
            next.delete(questId);
            return next;
          });
          return;
        }

        const { data: upserted, error } = await supabase
          .from("quest_trackers")
          .upsert(
            {
              user_id: userId,
              quest_id: questId,
              is_completed: false,
            },
            { onConflict: "user_id,quest_id" },
          )
          .select("id, quest_id, is_completed")
          .single();

        if (error) throw error;

        setTrackerByQuestId((prev) => {
          const next = new Map(prev);
          next.set(questId, {
            id: upserted.id,
            quest_id: Number(upserted.quest_id),
            is_completed: Boolean(upserted.is_completed),
          });
          return next;
        });
      } catch {
        setSyncError("내 퀘스트 저장 중 오류가 발생했습니다.");
      } finally {
        setQuestPending(questId, false);
      }
    },
    [trackerByQuestId, setQuestPending, userId],
  );

  const handleToggleCompleted = useCallback(
    async (questId: number, nextChecked: boolean) => {
      if (!userId) {
        window.location.href = "/login?next=/quests";
        return;
      }

      const tracked = trackerByQuestId.get(questId);
      setSyncError(null);
      setQuestPending(questId, true);

      const supabase = getSupabaseBrowserClient();

      try {
        if (!tracked) {
          if (!nextChecked) return;

          const { data: upserted, error } = await supabase
            .from("quest_trackers")
            .upsert(
              {
                user_id: userId,
                quest_id: questId,
                is_completed: true,
              },
              { onConflict: "user_id,quest_id" },
            )
            .select("id, quest_id, is_completed")
            .single();

          if (error) throw error;

          setTrackerByQuestId((prev) => {
            const next = new Map(prev);
            next.set(questId, {
              id: upserted.id,
              quest_id: Number(upserted.quest_id),
              is_completed: Boolean(upserted.is_completed),
            });
            return next;
          });
          return;
        }

        const { error } = await supabase
          .from("quest_trackers")
          .update({ is_completed: nextChecked })
          .eq("id", tracked.id);

        if (error) throw error;

        setTrackerByQuestId((prev) => {
          const next = new Map(prev);
          next.set(questId, {
            ...tracked,
            is_completed: nextChecked,
          });
          return next;
        });
      } catch {
        setSyncError("완료 상태 저장 중 오류가 발생했습니다.");
      } finally {
        setQuestPending(questId, false);
      }
    },
    [trackerByQuestId, setQuestPending, userId],
  );

  const handleJumpToQuest = useCallback(
    (questId: number) => {
      const targetName = questNameById.get(questId);
      if (targetName && targetName !== "이전 퀘스트") {
        setQuery(targetName);
      } else {
        setQuery(String(questId));
      }
      setSelectedWorldGroup("all");
      setMaxLevel("");
      setRewardTypeFilter("all");
      setRewardItemTypeFilter("all");
      setShowTrackedOnly(false);
      setHighlightedQuestId(questId);
    },
    [questNameById],
  );

  const handleToggleMobInfo = useCallback((key: string) => {
    setOpenedMobInfoKey((prev) => (prev === key ? null : key));
  }, []);

  const handleToggleTrackedOnly = useCallback(() => {
    if (!showTrackedOnly && !userId) {
      window.location.href = "/login?next=/quests";
      return;
    }
    setShowTrackedOnly((prev) => !prev);
  }, [showTrackedOnly, userId]);

  useEffect(() => {
    if (!highlightedQuestId) return;
    const element = document.getElementById(`quest-card-${highlightedQuestId}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(() => setHighlightedQuestId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [filteredQuests, highlightedQuestId]);

  useEffect(() => {
    setOpenedMobInfoKey(null);
  }, [query, selectedWorldGroup, maxLevel, rewardTypeFilter, rewardItemTypeFilter, showTrackedOnly]);

  useEffect(() => {
    if (!userId && showTrackedOnly) setShowTrackedOnly(false);
  }, [showTrackedOnly, userId]);

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)] lg:space-y-7">
      <header className="glass-panel rounded-3xl px-6 py-6 text-left lg:px-8 lg:py-8">
        <h1 className="display text-4xl font-semibold md:text-5xl lg:text-6xl">메랜 퀘스트</h1>
        <p className="mt-3 text-base text-slate-200/90 md:text-lg lg:text-xl">
          NPC 기준 퀘스트 조건/보상을 확인하고, 내 퀘스트에 담아 완료 체크까지 관리할 수 있습니다.
        </p>
      </header>

      <Panel
        title="퀘스트 검색"
        tone="blue"
        actions={
          <span className="text-xs text-[color:var(--retro-text-muted)] md:text-sm">
            표시 {displayedQuests.length} / 결과 {filteredQuests.length}
          </span>
        }
      >
        <div className="space-y-3 lg:space-y-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="퀘스트명 / NPC명 / 보상 아이템"
            className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20 md:text-base lg:px-4 lg:py-3 lg:text-lg"
          />

          <div className="grid gap-2 md:grid-cols-[220px_170px_170px_170px_auto]">
            <select
              value={selectedWorldGroup}
              onChange={(event) => setSelectedWorldGroup(event.target.value)}
              className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20 md:text-base lg:px-4 lg:py-3 lg:text-lg"
            >
              <option value="all">전체 월드</option>
              {worldGroupOptions.map(([group, count]) => (
                <option key={group} value={group}>
                  {group} ({count})
                </option>
              ))}
            </select>

            <input
              value={maxLevel}
              onChange={(event) => setMaxLevel(event.target.value)}
              inputMode="numeric"
              placeholder="최대 레벨 (예: 80)"
              className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20 md:text-base lg:px-4 lg:py-3 lg:text-lg"
            />

            <select
              value={rewardTypeFilter}
              onChange={(event) => {
                const next = event.target.value as RewardTypeFilter;
                setRewardTypeFilter(next);
                if (next !== "item") setRewardItemTypeFilter("all");
              }}
              className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20 md:text-base lg:px-4 lg:py-3 lg:text-lg"
            >
              <option value="all">보상 전체</option>
              <option value="exp">경험치 보상</option>
              <option value="meso">메소 보상</option>
              <option value="item">아이템 보상</option>
            </select>

            <select
              value={rewardItemTypeFilter}
              onChange={(event) => setRewardItemTypeFilter(event.target.value as RewardItemTypeFilter)}
              disabled={rewardTypeFilter !== "item"}
              className={`w-full rounded-[10px] border px-3 py-2.5 text-sm focus:outline-none focus:ring-4 md:text-base lg:px-4 lg:py-3 lg:text-lg ${
                rewardTypeFilter === "item"
                  ? "border-cyan-200/30 bg-[var(--retro-bg)] text-[color:var(--retro-text)] focus:border-cyan-200/70 focus:ring-cyan-200/20"
                  : "cursor-not-allowed border-white/10 bg-slate-800/40 text-slate-400"
              }`}
            >
              <option value="all">아이템 전체</option>
              <option value="scroll">주문서</option>
              <option value="equip">장비</option>
              <option value="etc">기타템</option>
            </select>

            <button
              type="button"
              onClick={handleToggleTrackedOnly}
              className={`rounded-[10px] border px-2.5 py-2 text-xs font-semibold transition md:text-sm lg:px-3 lg:py-2.5 lg:text-base ${
                showTrackedOnly
                  ? "border-cyan-100/90 bg-cyan-300/35 text-cyan-50 shadow-[0_0_0_1px_rgba(125,211,252,0.45)] hover:-translate-y-0.5"
                  : "border-cyan-100/70 bg-cyan-200/25 text-cyan-50 shadow-[0_0_0_1px_rgba(125,211,252,0.32)] hover:-translate-y-0.5 hover:border-cyan-50/95 hover:bg-cyan-200/35"
              }`}
            >
              {showTrackedOnly ? "내 퀘스트만 보는 중" : "내 퀘스트만 보기"}
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/35 px-3 py-2 text-xs text-slate-200/85 md:text-sm lg:px-4 lg:py-3 lg:text-base">
            {userId ? (
              <div className="flex flex-wrap items-center gap-2">
                <span>내 퀘스트 {trackedQuestCount}개</span>
                <span className="text-slate-400">/</span>
                <span>완료 {completedQuestCount}개</span>
                {trackerLoading ? <span className="text-cyan-200/80">동기화 중...</span> : null}
              </div>
            ) : (
              <p>
                <Link href="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">
                  로그인
                </Link>{" "}
                후 퀘스트를 담고 완료 체크를 저장할 수 있습니다.
              </p>
            )}
          </div>

          {syncError ? (
            <div className="rounded-lg border border-rose-300/35 bg-rose-400/10 px-3 py-2 text-xs text-rose-100 md:text-sm lg:text-base">
              {syncError}
            </div>
          ) : null}

          {!isSearchMode && filteredQuests.length > INITIAL_VISIBLE_COUNT ? (
            <div className="rounded-lg border border-cyan-200/30 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 md:text-sm lg:text-base">
              검색어가 없을 때는 처음 {INITIAL_VISIBLE_COUNT}개만 표시됩니다. 퀘스트명/NPC명/보상 아이템으로 검색해 주세요.
            </div>
          ) : null}
        </div>
      </Panel>

      <section className="space-y-2 lg:space-y-3">
        <div className="grid gap-2 rounded-xl border border-cyan-200/35 bg-[var(--retro-bg)] px-3 py-2 text-xs text-slate-200 md:grid-cols-[minmax(0,1.75fr)_minmax(0,0.85fr)_minmax(0,1.25fr)_minmax(0,0.95fr)] md:text-sm lg:px-4 lg:py-3 lg:text-base">
          <span>NPC / 퀘스트</span>
          <span>월드맵</span>
          <span>조건</span>
          <span>보상</span>
        </div>

        {displayedQuests.length === 0 ? (
          <div className="glass-panel glass-panel-strong rounded-2xl border border-cyan-200/30 px-5 py-5 text-sm text-slate-200/80 md:text-base lg:text-lg">
            검색 결과가 없습니다.
          </div>
        ) : null}

        {displayedQuests.map((quest) => {
          const npcName = npcMap.get(quest.npcId) ?? `NPC #${quest.npcId}`;
          const worldName = worldMap.get(quest.worldId) ?? quest.worldId;
          const groupedWorld = getWorldGroup(worldName, npcName);
          const worldMapNames = collectQuestMapNames(quest, worldName);
          const npcMapNames = collectNpcMapNames(quest, worldName, npcMapNamesByNpcId);
          const npcInfoKey = `npc-${quest.id}-${quest.npcId}`;
          const isNpcInfoOpen = openedMobInfoKey === npcInfoKey;

          const requiredItems = quest.requirements.complete?.items ?? [];
          const requiredMobs = quest.requirements.complete?.mobs ?? [];
          const rewardItems = quest.rewards.items ?? [];
          const startLevel = quest.requirements.start?.levelMin ?? quest.levelMin;
          const prerequisites = quest.prerequisites
            .map((item) => ({
              questId: Number(item.questId),
              name: String(item.name ?? questNameById.get(Number(item.questId)) ?? `퀘스트 #${Number(item.questId)}`).trim(),
            }))
            .filter((item) => Number.isFinite(item.questId) && item.questId > 0 && item.name);
          const visiblePrerequisites = prerequisites.slice(0, 3);
          const hiddenPrerequisiteCount = Math.max(prerequisites.length - visiblePrerequisites.length, 0);

          const tracked = trackerByQuestId.get(quest.id);
          const isTracked = Boolean(tracked);
          const isCompleted = Boolean(tracked?.is_completed);
          const isPending = Boolean(pendingQuestIds[quest.id]);

          return (
            <article
              key={quest.id}
              id={`quest-card-${quest.id}`}
              className={`grid gap-2 rounded-xl border border-cyan-100/55 bg-[color:color-mix(in_srgb,var(--retro-cell)_70%,#bae6fd_30%)] px-3 py-3 text-sm shadow-[0_0_0_1px_rgba(125,211,252,0.2)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-50/95 hover:bg-[color:color-mix(in_srgb,var(--retro-cell-strong)_72%,#bae6fd_28%)] hover:shadow-[0_12px_22px_rgba(8,47,73,0.35)] hover:ring-4 hover:ring-cyan-200/20 md:grid-cols-[minmax(0,1.75fr)_minmax(0,0.85fr)_minmax(0,1.25fr)_minmax(0,0.95fr)] md:text-base lg:px-4 lg:py-4 lg:text-[17px] ${
                highlightedQuestId === quest.id ? "ring-4 ring-amber-200/60 border-amber-200/80" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="relative">
                  <div className="flex min-w-0 items-center gap-2 text-left lg:gap-3">
                    <img
                      src={getNpcIconUrl(quest.npcId)}
                      alt={npcName}
                      data-maple-code={String(quest.npcId)}
                      data-maple-retry="0"
                      onError={(event) => handleMapleIoImageError(event, "npc")}
                      className="h-8 w-8 shrink-0 object-contain [image-rendering:pixelated] md:h-9 md:w-9 lg:h-11 lg:w-11"
                    />
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-100 md:text-lg lg:text-xl">{quest.name}</p>
                      <div className="flex flex-wrap items-center gap-1 text-xs md:text-sm lg:text-base">
                        <button
                          type="button"
                          onClick={() => handleToggleMobInfo(npcInfoKey)}
                          className="break-words rounded px-0.5 text-cyan-200 underline decoration-dotted underline-offset-2 transition hover:text-cyan-100"
                        >
                          {npcName} 위치
                        </button>
                        <span className="text-slate-400">· Lv.{startLevel}+</span>
                      </div>
                    </div>
                  </div>

                  {isNpcInfoOpen ? (
                    <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-cyan-100/55 bg-slate-950/95 px-2.5 py-2 text-[11px] text-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.45)] md:text-xs">
                      <p className="font-semibold text-cyan-100">{npcName} 위치</p>
                      <div className="mt-1 space-y-0.5">
                        {npcMapNames.map((location) => (
                          <p key={`${npcInfoKey}-${location}`} className="break-words text-slate-200/95">• {location}</p>
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400/90">NPC를 다시 누르면 닫힙니다.</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 space-y-2">
                  {prerequisites.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1" title={prerequisites.map((item) => item.name).join(", ")}>
                      <span className="text-[11px] text-indigo-100/90 md:text-xs lg:text-sm">선행퀘:</span>
                      {visiblePrerequisites.map((item) => (
                        <button
                          key={`${quest.id}-${item.questId}`}
                          type="button"
                          onClick={() => handleJumpToQuest(item.questId)}
                          className="rounded-full border border-indigo-200/35 bg-indigo-300/10 px-2 py-0.5 text-[11px] text-indigo-100 transition hover:border-indigo-100/70 hover:bg-indigo-300/20 md:text-xs lg:text-sm"
                        >
                          {item.name}
                        </button>
                      ))}
                      {hiddenPrerequisiteCount > 0 ? (
                        <span className="rounded-full border border-slate-300/30 bg-slate-700/30 px-2 py-0.5 text-[11px] text-slate-200 md:text-xs lg:text-sm">
                          +{hiddenPrerequisiteCount}개
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => void handleToggleTracked(quest.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition md:text-sm lg:px-3 lg:py-1.5 lg:text-base ${
                        isTracked
                          ? "border-cyan-100/90 bg-cyan-300/35 text-cyan-50 shadow-[0_0_0_1px_rgba(125,211,252,0.45)] hover:-translate-y-0.5"
                          : "border-cyan-100/75 bg-cyan-200/25 text-cyan-50 shadow-[0_0_0_1px_rgba(125,211,252,0.35)] hover:-translate-y-0.5 hover:border-cyan-50/95 hover:bg-cyan-200/35"
                      } ${isPending ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {isPending ? "저장 중..." : isTracked ? "담기 해제" : "내 퀘스트 담기"}
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => void handleToggleCompleted(quest.id, !isCompleted)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition md:text-sm lg:px-3 lg:py-1.5 lg:text-base ${
                        isCompleted
                          ? "border-emerald-100/90 bg-emerald-300/30 text-emerald-50 shadow-[0_0_0_1px_rgba(110,231,183,0.42)] hover:-translate-y-0.5"
                          : "border-slate-200/45 bg-slate-700/25 text-slate-100 shadow-[0_0_0_1px_rgba(148,163,184,0.24)] hover:-translate-y-0.5 hover:bg-slate-700/35"
                      } ${isPending ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] md:h-4.5 md:w-4.5 ${
                        isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-slate-900/40 text-slate-200"
                      }`}>
                        {isCompleted ? "✓" : "○"}
                      </span>
                      {isPending ? "저장 중..." : isCompleted ? "완료됨" : "완료하기"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-w-0 text-xs text-slate-200/90 md:text-sm lg:text-base">
                <p className="break-words font-semibold">{worldMapNames[0] || "맵 정보 없음"}</p>
                <p className="mt-0.5 break-words text-slate-300/85">{groupedWorld}</p>
                {worldMapNames.length > 1 ? (
                  <div className="mt-0.5 space-y-0.5 text-[11px] text-slate-300/85 md:text-xs lg:text-sm">
                    {worldMapNames.slice(1, 3).map((name) => (
                      <p key={`${quest.id}-map-${name}`} className="break-words">• {name}</p>
                    ))}
                    {worldMapNames.length > 3 ? (
                      <p className="text-slate-400">외 {worldMapNames.length - 3}곳</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 space-y-1 text-xs text-slate-200/90 md:text-sm lg:text-base">
                {requiredMobs.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-slate-300/85">사냥:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {requiredMobs.map((mob, index) => {
                        const mobId = Number(mob.id ?? 0);
                        const mobName = String(mob.name ?? "").trim();
                        const mobFromCode = Number.isFinite(mobId) && mobId > 0 ? monsterInfoByMobCode.get(mobId) : undefined;
                        const mobFromName = mobFromCode ? undefined : monsterInfoByName.get(mobName);
                        const iconMobCode = mobFromCode ? mobId : mobFromName?.mobCode ?? 0;
                        const infoKey = `${quest.id}-${mobId || mobName}-${index}`;
                        const isInfoOpen = openedMobInfoKey === infoKey;
                        const exactLocations = Array.from(
                          new Set(
                            [
                              mob.area,
                              ...(mobId > 0 ? Array.from(mobAreasById.get(mobId) ?? []) : []),
                              ...Array.from(mobAreasByName.get(mobName) ?? []),
                              mobFromCode?.map,
                              mobFromName?.map,
                            ]
                              .map((v) => String(v ?? "").trim())
                              .filter(Boolean),
                          ),
                        );
                        const regionHint = String(mobFromCode?.region ?? mobFromName?.region ?? "").trim() || null;

                        return (
                          <div key={infoKey} className="relative">
                            <button
                              type="button"
                              onClick={() => handleToggleMobInfo(infoKey)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/60 bg-sky-300/15 px-2 py-1 text-[11px] text-sky-100 transition hover:-translate-y-0.5 hover:border-sky-100/95 hover:bg-sky-300/25 md:text-xs lg:text-sm"
                            >
                              {iconMobCode > 0 ? (
                                <img
                                  src={getMobIconUrl(iconMobCode)}
                                  alt={mobName}
                                  data-maple-code={String(iconMobCode)}
                                  data-maple-retry="0"
                                  onError={(event) => handleMapleIoImageError(event, "mob")}
                                  className="h-4 w-4 shrink-0 object-contain [image-rendering:pixelated] md:h-5 md:w-5"
                                  loading="lazy"
                                />
                              ) : null}
                              <span className="break-words">{mobName}{mob.quantity ? ` x${mob.quantity}` : ""}</span>
                            </button>

                            {isInfoOpen ? (
                              <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-sky-100/55 bg-slate-950/95 px-2.5 py-2 text-[11px] text-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.45)] md:text-xs">
                                <p className="font-semibold text-sky-100">{mobName} 위치 안내</p>
                                {exactLocations.length > 0 ? (
                                  <div className="mt-1 space-y-0.5">
                                    {exactLocations.map((location) => (
                                      <p key={`${infoKey}-${location}`} className="break-words text-slate-200/95">• {location}</p>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-1 text-slate-300/85">퀘스트 데이터에 정확한 맵 정보가 없습니다.</p>
                                )}
                                {regionHint ? <p className="mt-1 text-[10px] text-slate-400/90">참고 지역: {regionHint}</p> : null}
                                <p className="mt-1 text-[10px] text-slate-400/90">다시 누르면 닫힙니다.</p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {requiredItems.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-slate-300/85">아이템:</span>
                    {requiredItems.map((item, itemIndex) => (
                      <div key={`${quest.id}-req-${item.id}`} className="rounded-lg border border-white/10 bg-slate-900/40 px-2 py-1.5">
                        {(() => {
                          const dropMonsters = (itemDropMonstersByItemId.get(item.id) ?? []).slice(0, 3);

                          return (
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0 md:flex-1">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={getItemIconUrl(item.id)}
                                    alt={item.name}
                                    className="h-4 w-4 shrink-0 object-contain [image-rendering:pixelated] md:h-5 md:w-5"
                                    loading="lazy"
                                  />
                                  <span className="break-words">{item.name} x{item.count}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[11px] md:text-xs lg:text-sm">
                                  <a
                                    href={`https://www.mapleland.gg/item/${item.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-200 hover:text-cyan-100"
                                  >
                                    매랜지지
                                  </a>
                                  <a
                                    href={`https://mapledb.kr/search.php?q=${item.id}&t=item`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-200 hover:text-emerald-100"
                                  >
                                    매랜DB
                                  </a>
                                </div>
                              </div>

                              {dropMonsters.length > 0 ? (
                                <div className="md:w-[46%] md:pl-2">
                                  <p className="text-[11px] text-amber-100/90 md:text-xs">드랍 몬스터</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {dropMonsters.map((mob) => {
                                      const infoKey = `${quest.id}-item-${item.id}-${mob.mobId}-${itemIndex}`;
                                      const isInfoOpen = openedMobInfoKey === infoKey;
                                      const exactLocations = Array.from(
                                        new Set(
                                          [
                                            ...(mob.mobId > 0 ? Array.from(mobAreasById.get(mob.mobId) ?? []) : []),
                                            ...Array.from(mobAreasByName.get(mob.name) ?? []),
                                          ]
                                            .map((v) => String(v ?? "").trim())
                                            .filter(Boolean),
                                        ),
                                      );
                                      const regionHint = String(mob.region ?? "").trim() || null;
                                      const probText = typeof mob.prob === "number" && mob.prob > 0
                                        ? `${(mob.prob * 100).toFixed(mob.prob * 100 >= 1 ? 1 : 2)}%`
                                        : null;

                                      return (
                                        <div key={infoKey} className="relative">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleMobInfo(infoKey)}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-300/15 px-2 py-1 text-[11px] text-amber-100 transition hover:-translate-y-0.5 hover:border-amber-100/95 hover:bg-amber-300/25 md:text-xs"
                                          >
                                            <img
                                              src={getMobIconUrl(mob.mobId)}
                                              alt={mob.name}
                                              data-maple-code={String(mob.mobId)}
                                              data-maple-retry="0"
                                              onError={(event) => handleMapleIoImageError(event, "mob")}
                                              className="h-4 w-4 shrink-0 object-contain [image-rendering:pixelated] md:h-5 md:w-5"
                                              loading="lazy"
                                            />
                                            <span className="break-words">{mob.name}</span>
                                            {probText ? <span className="text-[10px] text-amber-200/90">{probText}</span> : null}
                                          </button>

                                          {isInfoOpen ? (
                                            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-amber-100/55 bg-slate-950/95 px-2.5 py-2 text-[11px] text-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.45)] md:text-xs">
                                              <p className="font-semibold text-amber-100">{mob.name} 정보</p>
                                              {exactLocations.length > 0 ? (
                                                <div className="mt-1 space-y-0.5">
                                                  {exactLocations.map((location) => (
                                                    <p key={`${infoKey}-${location}`} className="break-words text-slate-200/95">• {location}</p>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="mt-1 text-slate-300/85">퀘스트 데이터에 정확한 맵 정보가 없습니다.</p>
                                              )}
                                              {regionHint ? <p className="mt-1 text-[10px] text-slate-400/90">참고 지역: {regionHint}</p> : null}
                                              <p className="mt-1 text-[10px] text-slate-400/90">다시 누르면 닫힙니다.</p>
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">아이템 조건: 없음</p>
                )}
              </div>

              <div className="min-w-0 space-y-1 text-xs text-slate-200/90 md:text-sm lg:text-base">
                <div className="flex flex-wrap gap-1.5">
                  {(quest.rewards.exp ?? 0) > 0 ? (
                    <span className="rounded-full border border-sky-200/45 bg-sky-300/15 px-2 py-0.5 text-[11px] text-sky-100 md:text-xs lg:text-sm">경험치</span>
                  ) : null}
                  {(quest.rewards.meso ?? 0) > 0 ? (
                    <span className="rounded-full border border-yellow-200/45 bg-yellow-300/15 px-2 py-0.5 text-[11px] text-yellow-100 md:text-xs lg:text-sm">메소</span>
                  ) : null}
                  {rewardItems.length > 0 ? (
                    <span className="rounded-full border border-emerald-200/45 bg-emerald-300/15 px-2 py-0.5 text-[11px] text-emerald-100 md:text-xs lg:text-sm">아이템</span>
                  ) : null}
                </div>
                {(quest.rewards.exp ?? 0) > 0 ? <p>EXP: {formatNumber(quest.rewards.exp ?? 0)}</p> : null}
                {(quest.rewards.meso ?? 0) > 0 ? <p>메소: {formatNumber(quest.rewards.meso ?? 0)}</p> : null}
                {rewardItems.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-slate-300/85">아이템:</span>
                    {rewardItems.map((item) => (
                      <div key={`${quest.id}-reward-${item.id}`} className="rounded-lg border border-white/10 bg-slate-900/40 px-2 py-1.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <img
                            src={getItemIconUrl(item.id)}
                            alt={item.name}
                            className="h-4 w-4 shrink-0 object-contain [image-rendering:pixelated] md:h-5 md:w-5"
                            loading="lazy"
                          />
                          <span
                            title={`${item.name} x${item.count}`}
                            className="truncate whitespace-nowrap"
                          >
                            {item.name} x{item.count}
                          </span>
                          <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-200/90 md:text-[11px]">
                            {getRewardItemGroup(Number(item.id), item.name) === "scroll"
                              ? "주문서"
                              : getRewardItemGroup(Number(item.id), item.name) === "equip"
                                ? "장비"
                                : "기타템"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] md:text-xs lg:text-sm">
                          <a
                            href={`https://www.mapleland.gg/item/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-200 hover:text-cyan-100"
                          >
                            매랜지지
                          </a>
                          <a
                            href={`https://mapledb.kr/search.php?q=${item.id}&t=item`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-200 hover:text-emerald-100"
                          >
                            매랜DB
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">아이템 보상: 없음</p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
}
