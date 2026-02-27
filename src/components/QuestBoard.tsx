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

export function QuestBoard() {
  const [query, setQuery] = useState("");
  const [selectedWorld, setSelectedWorld] = useState("all");
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
        if (selectedWorld !== "all" && quest.worldId !== selectedWorld) return false;
        if (maxLevelValue !== null && quest.levelMin > maxLevelValue) return false;
        if (!keyword) return true;
        const npcName = npcMap.get(quest.npcId) ?? "";
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
  }, [maxLevelValue, npcMap, query, selectedWorld]);

  const selectedWorldLabel = selectedWorld === "all" ? "전체" : worldMap.get(selectedWorld) ?? selectedWorld;

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <header className="glass-panel rounded-3xl px-6 py-6 text-left">
        <h1 className="display text-4xl font-semibold md:text-5xl">메랜 퀘스트</h1>
        <p className="mt-3 text-base text-slate-200/90 md:text-lg">
          NPC 기준 퀘스트 목록과 조건/보상을 확인하고, 레벨 오름차순으로 탐색합니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-200/70">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">월드: {selectedWorldLabel}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            레벨: {maxLevelValue === null ? "제한 없음" : `Lv.${maxLevelValue} 이하`}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">정렬: 레벨 ↑ + 퀘스트명</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">검색: 퀘스트/NPC/보상</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel
          title="퀘스트 검색"
          tone="blue"
          actions={<span className="text-xs text-[color:var(--retro-text-muted)]">퀘스트 · NPC · 보상</span>}
        >
          <div className="space-y-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="퀘스트명 / NPC명 / 보상 아이템"
              className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20"
            />
            <p className="text-xs text-[color:var(--retro-text-muted)]">
              결과 {filteredQuests.length}개 / 전체 {data.quests.length}개
            </p>

            <div className="pt-2">
              <label className="mb-1 block text-xs text-[color:var(--retro-text-muted)]">월드 필터</label>
              <select
                value={selectedWorld}
                onChange={(event) => setSelectedWorld(event.target.value)}
                className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20"
              >
                <option value="all">전체 월드</option>
                {data.worlds.map((world) => (
                  <option key={world.id} value={world.id}>
                    {world.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-[color:var(--retro-text-muted)]">최대 레벨 (이하)</label>
              <input
                value={maxLevel}
                onChange={(event) => setMaxLevel(event.target.value)}
                inputMode="numeric"
                placeholder="예: 80"
                className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20"
              />
            </div>
          </div>
        </Panel>

        <section className="space-y-4">
          {filteredQuests.length === 0 ? (
            <div className="glass-panel glass-panel-strong rounded-2xl border border-cyan-200/30 px-5 py-5 text-sm text-slate-200/80 shadow-[0_18px_34px_rgba(8,47,73,0.45)]">
              검색 결과가 없습니다.
            </div>
          ) : null}

          {filteredQuests.map((quest) => {
            const npcName = npcMap.get(quest.npcId) ?? `NPC #${quest.npcId}`;
            const worldName = worldMap.get(quest.worldId) ?? quest.worldId;
            const requiredItems = quest.requirements.complete?.items ?? [];
            const requiredMobs = quest.requirements.complete?.mobs ?? [];
            const fallbackSource = quest.guide?.recommendedAreas;

            return (
              <article
                key={quest.id}
                className="glass-panel glass-panel-strong retro-subsection rounded-2xl border border-cyan-200/20 px-5 py-5 shadow-[0_20px_36px_rgba(8,47,73,0.45)] transition hover:border-cyan-200/45"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                      <img
                        src={getNpcIconUrl(quest.npcId)}
                        alt={npcName}
                        className="h-8 w-8 shrink-0 object-contain [image-rendering:pixelated]"
                      />
                      <span>{quest.name}</span>
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-200/80">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">{worldName}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">{npcName}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                        {quest.repeatable ? "반복 퀘스트" : "1회 퀘스트"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <h3 className="text-sm font-semibold text-slate-100">조건</h3>
                    <ul className="mt-2 space-y-1 text-xs text-slate-200/85">
                      <li>시작 레벨: Lv.{quest.requirements.start?.levelMin ?? quest.levelMin}</li>
                      {quest.prerequisites.length > 0 ? (
                        <li>
                          선행 퀘스트:{" "}
                          {quest.prerequisites.map((item) => item.name ?? `#${item.questId}`).join(", ")}
                        </li>
                      ) : (
                        <li>선행 퀘스트: 없음</li>
                      )}
                      {requiredMobs.length > 0 ? (
                        <li>
                          사냥 몬스터:{" "}
                          {requiredMobs
                            .map((mob) => `${mob.name}${mob.quantity ? ` x${mob.quantity}` : ""}`)
                            .join(", ")}
                        </li>
                      ) : null}
                      {requiredItems.length > 0 ? (
                        <li>
                          완료 아이템:{" "}
                          {requiredItems
                            .map((item) => {
                              const source = item.source ?? fallbackSource ?? "출처 정보 없음";
                              return `${item.name} x${item.count} (출처: ${source})`;
                            })
                            .join(", ")}
                        </li>
                      ) : (
                        <li>완료 아이템: 없음</li>
                      )}
                      {fallbackSource ? <li>추천 사냥터: {fallbackSource}</li> : null}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <h3 className="text-sm font-semibold text-slate-100">보상</h3>
                    <ul className="mt-2 space-y-1 text-xs text-slate-200/85">
                      <li>경험치: {formatNumber(quest.rewards.exp ?? 0)}</li>
                      <li>메소: {formatNumber(quest.rewards.meso ?? 0)}</li>
                    </ul>
                    {(quest.rewards.items ?? []).length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(quest.rewards.items ?? []).map((item) => (
                          <div
                            key={`${quest.id}-${item.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-100"
                          >
                            <img src={getItemIconUrl(item.id)} alt={item.name} className="h-4 w-4" />
                            <span>{item.name}</span>
                            <span className="text-slate-300/80">x{item.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </section>
  );
}
