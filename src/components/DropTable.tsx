"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { getItemIconUrl, getMobIconUrl, getMobRenderUrl } from "@/lib/maplestory-io";
import { getMonsters } from "@/lib/data/monsters";
import type { Monster } from "@/types/monster";
import dropIndex from "@data/drop-index.json";

type DropIndexItem = {
  id: number;
  name: string;
  typeInfo?: {
    overallCategory?: string;
    category?: string;
    subCategory?: string;
  };
  equipGroup?: string;
};

type DropEntry = {
  itemId: number;
  prob?: number;
  min?: number;
  max?: number;
};

type MonsterDropEntry = {
  mobId: number;
  prob?: number;
  min?: number;
  max?: number;
};

type DropIndexData = {
  generatedAt: string;
  source?: string;
  items: DropIndexItem[];
  dropsByMonsterId: Record<string, DropEntry[]>;
  monstersByItemId: Record<string, MonsterDropEntry[]>;
};

const monsterList = getMonsters() as Monster[];
const dropData = dropIndex as DropIndexData;

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

export function DropTable() {
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedMonsterName, setSelectedMonsterName] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const groupOrder = ["주문서", "장비", "물약", "기타템"];
  const getItemGroup = (item: DropIndexItem) => {
    const overall = item.typeInfo?.overallCategory ?? "";
    const category = item.typeInfo?.category ?? "";
    const lower = `${overall} ${category}`.toLowerCase();
    if (lower.includes("scroll")) return "주문서";
    if (overall === "Equip") return "장비";
    if (lower.includes("potion") || lower.includes("food") || lower.includes("drink")) return "물약";
    return "기타템";
  };

  const getItemLevel = (item?: DropIndexItem) => {
    const level = item?.meta?.equip?.reqLevel;
    return typeof level === "number" ? level : null;
  };

  const selectedMonster = useMemo(
    () => monsterList.find((monster) => monster.name === selectedMonsterName),
    [selectedMonsterName]
  );

  const itemsById = useMemo(() => {
    const map = new Map<number, DropIndexItem>();
    for (const item of dropData.items) {
      map.set(item.id, item);
    }
    return map;
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = normalizeQuery(query);
    const sorted = [...dropData.items].sort((a, b) => {
      const groupA = getItemGroup(a);
      const groupB = getItemGroup(b);
      if (groupA !== groupB) return groupOrder.indexOf(groupA) - groupOrder.indexOf(groupB);
      return a.name.localeCompare(b.name, "ko");
    });
    if (!keyword) return sorted.slice(0, 60);
    return sorted
      .filter((item) => getSearchKeys(item.name).some((key) => key.includes(keyword)))
      .slice(0, 60);
  }, [query]);

  const filteredMonsters = useMemo(() => {
    const keyword = normalizeQuery(query);
    const sorted = [...monsterList].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
    if (!keyword) return sorted.slice(0, 60);
    return sorted
      .filter((monster) => getSearchKeys(monster.name).some((key) => key.includes(keyword)))
      .slice(0, 60);
  }, [query]);

  const monsterDrops = useMemo(() => {
    if (!selectedMonster?.mobCode) return [];
    return dropData.dropsByMonsterId[String(selectedMonster.mobCode)] ?? [];
  }, [selectedMonster]);

  const monstersForItem = useMemo(() => {
    if (!selectedItemId) return [];
    const entries = dropData.monstersByItemId[String(selectedItemId)] ?? [];
    const monsterMap = new Map(monsterList.map((monster) => [monster.mobCode, monster]));
    return entries
      .map((entry) => ({
        entry,
        monster: monsterMap.get(entry.mobId),
      }))
      .filter((row) => row.monster);
  }, [selectedItemId]);

  const formatProb = (prob?: number) => {
    if (typeof prob !== "number" || prob <= 0) return { percent: "정보 없음", fraction: null as string | null };
    const percent = prob * 100;
    const percentText = percent >= 1 ? `${percent.toFixed(2)}%` : percent >= 0.1 ? `${percent.toFixed(3)}%` : `${percent.toFixed(4)}%`;
    const denom = Math.max(1, Math.round(1 / prob));
    return { percent: percentText, fraction: `1/${denom}` };
  };

  const formatAmount = (min?: number, max?: number) => {
    if (typeof min === "number" && typeof max === "number") {
      return min === max ? `${min}` : `${min}~${max}`;
    }
    if (typeof min === "number") return `${min}+`;
    return "1";
  };

  const formatAmountLabel = (min?: number, max?: number) => {
    const amount = formatAmount(min, max);
    if (amount === "1") return null;
    return `수량 ${amount}`;
  };

  return (
    <div className="space-y-6">
      <header className="glass-panel flex flex-col gap-3 rounded-3xl px-6 py-6 text-left">
        <h1 className="display text-3xl font-semibold md:text-4xl">드랍 테이블</h1>
        <p className="text-sm text-slate-200/90 md:text-base">
          몬스터가 드랍하는 아이템과 아이템을 드랍하는 몬스터를 양방향으로 빠르게 확인합니다.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-200/70">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            데이터: {dropData.source === "drops-parsed" ? "드랍 테이블" : "MonsterBook reward"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">드랍 확률/수량: 제공</span>
        </div>
      </header>

      <section className="glass-panel rounded-2xl px-6 py-5 text-left text-xs text-slate-200/90">
        <h2 className="text-sm font-semibold text-slate-100">드랍 테이블 소개</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {[
            "몬스터별 드랍 아이템",
            "추정 확률 범위",
            "기대 획득 수 계산",
          ].map((text) => (
            <div
              key={text}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-violet-200/60 hover:bg-white/10"
            >
              <h3 className="text-[12px] font-semibold text-slate-100">{text}</h3>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Panel
          title="검색"
          tone="blue"
          actions={<span className="text-[11px] text-[color:var(--retro-text-muted)]">몬스터 · 아이템</span>}
        >
          <div className="flex flex-col gap-4 text-xs text-[color:var(--retro-text)]">
            <div className="space-y-2">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[14px] text-cyan-100/80">
                  ⌕
                </div>
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedItemId(null);
                    setSelectedMonsterName(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  placeholder="몬스터 또는 아이템 이름을 입력하세요"
                  className="w-full rounded-[10px] border border-[var(--retro-border)] bg-[var(--retro-bg)] px-10 py-3 text-[12px] text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] focus:border-cyan-200/60 focus:outline-none focus:ring-2 focus:ring-cyan-200/20"
                />
                {query && showSuggestions ? (
                  <div className="absolute top-full z-20 mt-2 max-h-80 w-full overflow-auto rounded-[10px] border border-[var(--retro-border-strong)] bg-[var(--retro-bg)] p-3 shadow-[0_18px_34px_rgba(0,0,0,0.45)]">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-[11px] font-semibold text-slate-100">아이템</h3>
                        <div className="mt-2 space-y-1">
                          {filteredItems.length === 0 ? (
                            <div className="text-[11px] text-[color:var(--retro-text-muted)]">검색 결과 없음</div>
                          ) : (
                            filteredItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className="flex w-full items-center gap-2 rounded-[6px] border border-transparent px-2 py-1.5 text-left text-[12px] text-[color:var(--retro-text)] hover:border-[var(--retro-border-strong)] hover:bg-[var(--retro-cell-strong)]"
                                onClick={() => {
                                  setSelectedItemId(item.id);
                                  setSelectedMonsterName(null);
                                  setQuery(item.name);
                                  setShowSuggestions(false);
                                }}
                              >
                                <img src={getItemIconUrl(item.id)} alt={item.name} className="h-6 w-6" loading="lazy" />
                                <span className="flex-1 truncate">{item.name}</span>
                                <span className="text-[10px] text-[color:var(--retro-text-muted)]">{getItemGroup(item)}</span>
                                <span className="text-[10px] text-[color:var(--retro-text-muted)]">#{item.id}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[11px] font-semibold text-slate-100">몬스터</h3>
                        <div className="mt-2 space-y-1">
                          {filteredMonsters.length === 0 ? (
                            <div className="text-[11px] text-[color:var(--retro-text-muted)]">검색 결과 없음</div>
                          ) : (
                            filteredMonsters.map((monster) => (
                              <button
                                key={monster.mobCode}
                                type="button"
                                className="flex w-full items-center gap-2 rounded-[6px] border border-transparent px-2 py-1.5 text-left text-[12px] text-[color:var(--retro-text)] hover:border-[var(--retro-border-strong)] hover:bg-[var(--retro-cell-strong)]"
                                onClick={() => {
                                  setSelectedItemId(null);
                                  setSelectedMonsterName(monster.name);
                                  setQuery(monster.name);
                                  setShowSuggestions(false);
                                }}
                              >
                                <img src={getMobIconUrl(monster.mobCode)} alt={monster.name} className="h-6 w-6" />
                                <span className="flex-1 truncate">{monster.name}</span>
                                <span className="text-[10px] text-[color:var(--retro-text-muted)]">
                                  Lv.{monster.level ?? "-"}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {selectedItemId ? (
              <div className="rounded-[10px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <img
                    src={getItemIconUrl(selectedItemId)}
                    alt={itemsById.get(selectedItemId)?.name ?? "아이템"}
                    className="h-10 w-10"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{itemsById.get(selectedItemId)?.name ?? "아이템"}</div>
                    <div className="text-[11px] text-[color:var(--retro-text-muted)]">아이템 선택됨</div>
                  </div>
                </div>
              </div>
            ) : selectedMonster ? (
              <div className="rounded-[10px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <img src={getMobIconUrl(selectedMonster.mobCode)} alt={selectedMonster.name} className="h-10 w-10" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{selectedMonster.name}</div>
                    <div className="text-[11px] text-[color:var(--retro-text-muted)]">
                      Lv.{selectedMonster.level ?? "-"} · {selectedMonster.region ?? "지역 정보 없음"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedMonster ? (
              <div className="rounded-[14px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-4 py-4 text-[12px] text-[color:var(--retro-text)]">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-slate-100">몬스터 정보</div>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-[color:var(--retro-text-muted)]">
                    Lv.{selectedMonster.level ?? "-"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                  <div>HP {selectedMonster.hp ?? "-"}</div>
                  <div>EXP {selectedMonster.exp ?? "-"}</div>
                  <div>물공 {selectedMonster.watk ?? "-"}</div>
                  <div>마공 {selectedMonster.matk ?? "-"}</div>
                  <div>물방 {selectedMonster.def ?? "-"}</div>
                  <div>마방 {selectedMonster.mDef ?? "-"}</div>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="결과"
          tone="blue"
          actions={
            <span>
              {selectedItemId
                ? `${monstersForItem.length}마리`
                : selectedMonster
                  ? `${monsterDrops.length}개 아이템`
                  : "결과 없음"}
            </span>
          }
        >
          {selectedMonster && !selectedItemId ? (
            <div className="grid gap-4 sm:grid-cols-2">
                {monsterDrops.length === 0 ? (
                  <p className="text-xs text-[color:var(--retro-text-muted)]">드랍 정보가 없습니다.</p>
                ) : (
                  monsterDrops.map((entry) => {
                    const item = itemsById.get(entry.itemId);
                    const amountLabel = formatAmountLabel(entry.min, entry.max);
                    return (
                      <div
                        key={`${entry.itemId}`}
                        className="flex items-center gap-4 rounded-[12px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-4 py-3 text-xs transition hover:border-cyan-200/60 hover:bg-[var(--retro-cell-strong)]"
                        onClick={() => {
                          setSelectedItemId(entry.itemId);
                          setSelectedMonsterName(null);
                          const name = itemsById.get(entry.itemId)?.name;
                          if (name) setQuery(name);
                        }}
                      >
                        <img src={getItemIconUrl(entry.itemId)} alt={item?.name ?? String(entry.itemId)} className="h-10 w-10" />
                        <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="text-[13px] font-semibold">
                              {item?.name ?? "미확인 아이템"}
                              {getItemLevel(item) !== null ? ` · Lv.${getItemLevel(item)}` : ""}
                            </div>
                            {(() => {
                              const prob = formatProb(entry.prob);
                              return (
                                <div className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-100">
                                  {prob.percent}
                                  {prob.fraction ? ` (${prob.fraction})` : ""}
                                </div>
                              );
                            })()}
                          </div>
                          <div className="mt-1 text-[10px] text-[color:var(--retro-text-muted)]">
                            {amountLabel ? `${amountLabel} · ` : ""}
                            {item ? getItemGroup(item) : "기타템"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : selectedItemId ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedItemId && monstersForItem.length === 0 ? (
                  <p className="text-xs text-[color:var(--retro-text-muted)]">해당 아이템을 드랍하는 몬스터가 없습니다.</p>
                ) : null}
                {monstersForItem.map(({ monster, entry }) => (
                  <div
                    key={monster?.mobCode}
                    className="flex items-center gap-4 rounded-[14px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-5 py-4 text-xs transition hover:border-emerald-200/60 hover:bg-[var(--retro-cell-strong)]"
                    onClick={() => {
                      setSelectedItemId(null);
                      setSelectedMonsterName(monster.name);
                      setQuery(monster.name);
                    }}
                  >
                    <img
                      src={getMobRenderUrl(monster.mobCode)}
                      alt={monster.name}
                      className="h-14 w-14"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getMobIconUrl(monster.mobCode);
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[14px] font-semibold">{monster.name}</div>
                        {(() => {
                          const prob = formatProb(entry.prob);
                          return (
                            <div className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                              {prob.percent}
                              {prob.fraction ? ` (${prob.fraction})` : ""}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="mt-1 text-[10px] text-[color:var(--retro-text-muted)]">
                        Lv.{monster.level ?? "-"} · {monster.region ?? "지역 정보 없음"}
                      </div>
                      <div className="text-[10px] text-[color:var(--retro-text-muted)]">
                        HP {monster.hp ?? "-"} · EXP {monster.exp ?? "-"}
                        {formatAmountLabel(entry.min, entry.max) ? ` · ${formatAmountLabel(entry.min, entry.max)}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[color:var(--retro-text-muted)]">
                아이템이나 몬스터를 선택하면 결과가 표시됩니다.
              </p>
            )}
        </Panel>
      </div>
    </div>
  );
}
