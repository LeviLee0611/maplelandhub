"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { getItemIconUrl, getNpcIconUrl, handleMapleIoImageError } from "@/lib/maplestory-io";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import questJson from "@data/quests.json";
import npcLocationsJson from "@data/npc-locations.json";
import type { Quest, QuestData } from "@/types/quest";

const data = questJson as QuestData;
const npcLocationData = npcLocationsJson as {
  rows?: Array<{
    npc_code: number;
    npc_name: string;
    maps?: Array<{ map_code: number; map_name: string }>;
  }>;
};

type QuestTrackerRow = Database["public"]["Tables"]["quest_trackers"]["Row"];
type TrackerMapValue = Pick<QuestTrackerRow, "id" | "quest_id" | "is_completed">;

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

function isUnreleasedArea(text?: string) {
  return String(text ?? "").includes("노틸러스");
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

  const add = (raw?: string) => {
    const text = String(raw ?? "").trim();
    if (!text) return;
    if (isUnreleasedArea(text)) return;
    mapNames.add(text);
  };

  add(fallbackWorldName);

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

  return [...mapNames];
}

export function QuestBoard() {
  const [query, setQuery] = useState("");
  const [selectedWorldGroup, setSelectedWorldGroup] = useState("all");
  const [maxLevel, setMaxLevel] = useState("");
  const [showTrackedOnly, setShowTrackedOnly] = useState(false);
  const [highlightedQuestId, setHighlightedQuestId] = useState<number | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [trackerByQuestId, setTrackerByQuestId] = useState<Map<number, TrackerMapValue>>(new Map());
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [pendingQuestIds, setPendingQuestIds] = useState<Record<number, boolean>>({});
  const [syncError, setSyncError] = useState<string | null>(null);

  const npcMap = useMemo(() => new Map(data.npcs.map((npc) => [npc.id, npc.name])), []);
  const worldMap = useMemo(() => new Map(data.worlds.map((world) => [world.id, world.name])), []);
  const questNameById = useMemo(() => new Map(data.quests.map((quest) => [quest.id, quest.name])), []);
  const npcMapsByNpcCode = useMemo(() => {
    const map = new Map<number, Array<{ map_code: number; map_name: string }>>();
    for (const row of npcLocationData.rows ?? []) {
      const npcCode = Number(row.npc_code);
      if (!Number.isFinite(npcCode) || npcCode <= 0) continue;
      const maps = (row.maps ?? [])
        .map((v) => ({
          map_code: Number(v.map_code),
          map_name: String(v.map_name ?? "").trim(),
        }))
        .filter((v) => Number.isFinite(v.map_code) && v.map_name.length > 0);
      map.set(npcCode, maps);
    }
    return map;
  }, []);

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

        if (!keyword) return true;
        const rewardNames = (quest.rewards.items ?? []).map((item) => item.name).join(" ");
        const keys = [
          ...getSearchKeys(quest.name),
          ...getSearchKeys(npcName),
          ...getSearchKeys(rewardNames),
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
  }, [maxLevelValue, npcMap, query, selectedWorldGroup, showTrackedOnly, trackerByQuestId, worldMap]);

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
      const tracked = trackerByQuestId.get(questId);
      if (!tracked) return;

      setSyncError(null);
      setQuestPending(questId, true);

      const supabase = getSupabaseBrowserClient();

      try {
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
    [trackerByQuestId, setQuestPending],
  );

  const handleJumpToQuest = useCallback(
    (questId: number) => {
      const targetName = questNameById.get(questId);
      if (targetName) {
        setQuery(targetName);
      }
      setSelectedWorldGroup("all");
      setMaxLevel("");
      setShowTrackedOnly(false);
      setHighlightedQuestId(questId);
    },
    [questNameById],
  );

  useEffect(() => {
    if (!highlightedQuestId) return;
    const element = document.getElementById(`quest-card-${highlightedQuestId}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(() => setHighlightedQuestId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [filteredQuests, highlightedQuestId]);

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
        actions={<span className="text-xs text-[color:var(--retro-text-muted)] md:text-sm">결과 {filteredQuests.length} / {data.quests.length}</span>}
      >
        <div className="space-y-3 lg:space-y-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="퀘스트명 / NPC명 / 보상 아이템"
            className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20 md:text-base lg:px-4 lg:py-3 lg:text-lg"
          />

          <div className="grid gap-2 md:grid-cols-[220px_180px_auto]">
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

            <button
              type="button"
              onClick={() => setShowTrackedOnly((prev) => !prev)}
              className={`rounded-[10px] border px-3 py-2.5 text-sm font-semibold transition md:text-base lg:px-4 lg:py-3 lg:text-lg ${
                showTrackedOnly
                  ? "border-cyan-200/70 bg-cyan-300/20 text-cyan-100"
                  : "border-cyan-200/30 bg-[var(--retro-bg)] text-slate-200/90 hover:border-cyan-200/50"
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
        </div>
      </Panel>

      <section className="space-y-2 lg:space-y-3">
        <div className="grid gap-2 rounded-xl border border-cyan-200/35 bg-[var(--retro-bg)] px-3 py-2 text-xs text-slate-200 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.2fr)] md:text-sm lg:px-4 lg:py-3 lg:text-base">
          <span>NPC / 퀘스트</span>
          <span>월드맵</span>
          <span>조건</span>
          <span>보상</span>
        </div>

        {filteredQuests.length === 0 ? (
          <div className="glass-panel glass-panel-strong rounded-2xl border border-cyan-200/30 px-5 py-5 text-sm text-slate-200/80 md:text-base lg:text-lg">
            검색 결과가 없습니다.
          </div>
        ) : null}

        {filteredQuests.map((quest) => {
          const npcName = npcMap.get(quest.npcId) ?? `NPC #${quest.npcId}`;
          const worldName = worldMap.get(quest.worldId) ?? quest.worldId;
          const groupedWorld = getWorldGroup(worldName, npcName);
          const npcFixedMaps = npcMapsByNpcCode.get(quest.npcId) ?? [];
          const worldMapNames =
            npcFixedMaps.length > 0
              ? npcFixedMaps.map((v) => v.map_name)
              : collectQuestMapNames(quest, worldName);

          const requiredItems = quest.requirements.complete?.items ?? [];
          const requiredMobs = quest.requirements.complete?.mobs ?? [];
          const rewardItems = quest.rewards.items ?? [];
          const startLevel = quest.requirements.start?.levelMin ?? quest.levelMin;
          const prerequisites = quest.prerequisites
            .map((item) => ({
              questId: Number(item.questId),
              name: String(item.name ?? questNameById.get(Number(item.questId)) ?? "").trim(),
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
              className={`grid gap-2 rounded-xl border border-cyan-200/35 bg-[var(--retro-cell)] px-3 py-3 text-sm shadow-[0_0_0_1px_rgba(34,211,238,0.08)] transition duration-150 hover:border-cyan-200/70 hover:bg-[var(--retro-cell-strong)] hover:shadow-[0_0_0_1px_rgba(34,211,238,0.2)] hover:ring-4 hover:ring-cyan-200/20 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.2fr)] md:text-base lg:px-4 lg:py-4 lg:text-[17px] ${
                highlightedQuestId === quest.id ? "ring-4 ring-amber-200/60 border-amber-200/80" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2 lg:gap-3">
                  <img
                    src={getNpcIconUrl(quest.npcId)}
                    alt={npcName}
                    data-maple-code={String(quest.npcId)}
                    data-maple-retry="0"
                    onError={(event) => handleMapleIoImageError(event, "npc")}
                    className="h-8 w-8 shrink-0 object-contain [image-rendering:pixelated] md:h-9 md:w-9 lg:h-11 lg:w-11"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100 md:text-lg lg:text-xl">{quest.name}</p>
                    <p className="truncate text-xs text-slate-300/80 md:text-sm lg:text-base">
                      {npcName} <span className="text-slate-400">· Lv.{startLevel}+</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void handleToggleTracked(quest.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition md:text-sm lg:px-3 lg:py-1.5 lg:text-base ${
                      isTracked
                        ? "border-cyan-200/65 bg-cyan-300/20 text-cyan-100"
                        : "border-white/20 bg-white/5 text-slate-200/90 hover:border-cyan-200/55"
                    } ${isPending ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {isPending ? "저장 중..." : isTracked ? "담기 해제" : "내 퀘스트 담기"}
                  </button>

                  <label className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs md:text-sm lg:px-3 lg:py-1.5 lg:text-base ${isTracked ? "border-emerald-200/40 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-400"}`}>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={!isTracked || isPending}
                      onChange={(event) => void handleToggleCompleted(quest.id, event.target.checked)}
                      className="h-3.5 w-3.5 accent-emerald-400 md:h-4 md:w-4"
                    />
                    완료
                  </label>
                </div>
              </div>

              <div className="min-w-0 text-xs text-slate-200/90 md:text-sm lg:text-base">
                <p className="truncate font-semibold">{groupedWorld}</p>
                <p className="mt-0.5 truncate text-slate-300/85">
                  {worldMapNames.slice(0, 2).join(" · ") || "맵 정보 없음"}
                </p>
                {npcFixedMaps.length > 0 ? (
                  <p className="mt-0.5 text-[11px] text-emerald-200/85 md:text-xs lg:text-sm">NPC 고정 위치 기준</p>
                ) : null}
                {worldMapNames.length > 2 ? (
                  <p className="mt-0.5 text-[11px] text-slate-400 md:text-xs lg:text-sm">외 {worldMapNames.length - 2}곳</p>
                ) : null}
              </div>

              <div className="min-w-0 space-y-1 text-xs text-slate-200/90 md:text-sm lg:text-base">
                <div>
                  <p className="text-slate-300/90">선행:</p>
                  {prerequisites.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1" title={prerequisites.map((item) => item.name).join(", ")}>
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
                  ) : (
                    <p className="text-slate-400">없음</p>
                  )}
                </div>

                {requiredMobs.length > 0 ? (
                  <p className="truncate text-slate-300/85">
                    사냥:{" "}
                    {requiredMobs
                      .map((mob) => `${mob.name}${mob.quantity ? ` x${mob.quantity}` : ""}`)
                      .join(", ")}
                  </p>
                ) : null}

                {requiredItems.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-slate-300/85">아이템:</span>
                    {requiredItems.map((item) => (
                      <div key={`${quest.id}-req-${item.id}`} className="rounded-lg border border-white/10 bg-slate-900/40 px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={getItemIconUrl(item.id)}
                            alt={item.name}
                            className="h-4 w-4 shrink-0 object-contain [image-rendering:pixelated] md:h-5 md:w-5"
                            loading="lazy"
                          />
                          <span className="truncate">{item.name} x{item.count}</span>
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
                  <p className="text-slate-400">아이템 조건: 없음</p>
                )}
              </div>

              <div className="min-w-0 space-y-1 text-xs text-slate-200/90 md:text-sm lg:text-base">
                <p>EXP: {formatNumber(quest.rewards.exp ?? 0)}</p>
                <p>메소: {formatNumber(quest.rewards.meso ?? 0)}</p>
                {rewardItems.length > 0 ? (
                  <p className="truncate text-slate-300/85">
                    아이템: {rewardItems.map((item) => `${item.name} x${item.count}`).join(", ")}
                  </p>
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
