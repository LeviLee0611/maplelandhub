"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { getItemIconUrl, getNpcIconUrl } from "@/lib/maplestory-io";
import questJson from "@data/quests.json";
import type { QuestData } from "@/types/quest";

const data = questJson as QuestData;

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
    text.includes("노틸러스") ||
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

export function QuestBoard() {
  const [query, setQuery] = useState("");
  const [selectedWorldGroup, setSelectedWorldGroup] = useState("all");
  const [maxLevel, setMaxLevel] = useState("");

  const npcMap = useMemo(() => new Map(data.npcs.map((npc) => [npc.id, npc.name])), []);
  const worldMap = useMemo(() => new Map(data.worlds.map((world) => [world.id, world.name])), []);
  const maxLevelValue = useMemo(() => {
    const parsed = Number(maxLevel);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [maxLevel]);

  const filteredQuests = useMemo(() => {
    const keyword = normalizeQuery(query);
    const rows = [...data.quests]
      .filter((quest) => {
        const worldName = worldMap.get(quest.worldId) ?? quest.worldId;
        const npcName = npcMap.get(quest.npcId) ?? "";
        if (selectedWorldGroup !== "all" && getWorldGroup(worldName, npcName) !== selectedWorldGroup) return false;
        if (maxLevelValue !== null && quest.levelMin > maxLevelValue) return false;
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
        if (a.levelMin !== b.levelMin) return a.levelMin - b.levelMin;
        return a.name.localeCompare(b.name, "ko");
      });
    return rows;
  }, [maxLevelValue, npcMap, query, selectedWorldGroup, worldMap]);

  const worldGroupOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const quest of data.quests) {
      const worldName = worldMap.get(quest.worldId) ?? quest.worldId;
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

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <header className="glass-panel rounded-3xl px-6 py-6 text-left">
        <h1 className="display text-4xl font-semibold md:text-5xl">메랜 퀘스트</h1>
        <p className="mt-3 text-base text-slate-200/90 md:text-lg">
          NPC 기준 퀘스트 목록과 조건/보상을 확인하고, 레벨 오름차순으로 탐색합니다.
        </p>
      </header>

      <Panel
        title="퀘스트 검색"
        tone="blue"
        actions={<span className="text-xs text-[color:var(--retro-text-muted)]">결과 {filteredQuests.length} / {data.quests.length}</span>}
      >
        <div className="space-y-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="퀘스트명 / NPC명 / 보상 아이템"
            className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20"
          />
          <div className="grid gap-2 md:grid-cols-[220px_180px]">
            <select
              value={selectedWorldGroup}
              onChange={(event) => setSelectedWorldGroup(event.target.value)}
              className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20"
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
              className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20"
            />
          </div>
        </div>
      </Panel>

      <section className="space-y-2">
        <div className="grid gap-2 rounded-xl border border-cyan-200/35 bg-[var(--retro-bg)] px-3 py-2 text-xs text-slate-200 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.2fr)]">
          <span>NPC / 퀘스트</span>
          <span>월드 + 맵</span>
          <span>조건</span>
          <span>보상</span>
        </div>
        {filteredQuests.length === 0 ? (
          <div className="glass-panel glass-panel-strong rounded-2xl border border-cyan-200/30 px-5 py-5 text-sm text-slate-200/80">
            검색 결과가 없습니다.
          </div>
        ) : null}
        {filteredQuests.map((quest) => {
          const npcName = npcMap.get(quest.npcId) ?? `NPC #${quest.npcId}`;
          const worldName = worldMap.get(quest.worldId) ?? quest.worldId;
          const groupedWorld = getWorldGroup(worldName, npcName);
          const requiredItems = quest.requirements.complete?.items ?? [];
          const requiredMobs = quest.requirements.complete?.mobs ?? [];
          const rewardItems = quest.rewards.items ?? [];
          const startLevel = quest.requirements.start?.levelMin ?? quest.levelMin;
          const prerequisiteNames = quest.prerequisites.map((item) => String(item.name ?? "").trim()).filter(Boolean);
          return (
            <article
              key={quest.id}
              className="grid gap-2 rounded-xl border border-cyan-200/35 bg-[var(--retro-cell)] px-3 py-2 text-sm shadow-[0_0_0_1px_rgba(34,211,238,0.08)] transition duration-150 hover:border-cyan-200/70 hover:bg-[var(--retro-cell-strong)] hover:shadow-[0_0_0_1px_rgba(34,211,238,0.2)] hover:ring-4 hover:ring-cyan-200/20 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.2fr)]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <img
                  src={getNpcIconUrl(quest.npcId)}
                  alt={npcName}
                  className="h-7 w-7 shrink-0 object-contain [image-rendering:pixelated]"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">{quest.name}</p>
                  <p className="truncate text-xs text-slate-300/80">
                    {npcName} <span className="text-slate-400">· Lv.{startLevel}+</span>
                  </p>
                </div>
              </div>

              <div className="min-w-0 text-xs text-slate-200/90">
                <p className="truncate font-semibold">{groupedWorld}</p>
                <p className="truncate text-slate-300/80">{worldName}</p>
              </div>

              <div className="min-w-0 space-y-1 text-xs text-slate-200/90">
                {prerequisiteNames.length > 0 ? (
                  <details className="rounded-md border border-white/10 bg-slate-900/30 px-2 py-1">
                    <summary className="cursor-pointer list-none text-slate-300/90">
                      선행 퀘스트 {prerequisiteNames.length}개
                    </summary>
                    <p className="mt-1 text-slate-300/85">
                      {prerequisiteNames.join(", ")}
                    </p>
                  </details>
                ) : (
                  <p className="text-slate-400">선행: 없음</p>
                )}
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
                            className="h-4 w-4 shrink-0 object-contain [image-rendering:pixelated]"
                            loading="lazy"
                          />
                          <span className="truncate">{item.name} x{item.count}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px]">
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

              <div className="min-w-0 space-y-1 text-xs text-slate-200/90">
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
