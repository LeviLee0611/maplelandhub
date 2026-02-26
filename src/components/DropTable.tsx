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
  meta?: {
    equip?: {
      reqLevel?: number;
    };
  };
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
  const [activeIndex, setActiveIndex] = useState(-1);

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

  const suggestionItems = useMemo(() => {
    const items = filteredItems.map((item) => ({
      type: "item" as const,
      id: item.id,
      label: item.name,
    }));
    const monsters = filteredMonsters.map((monster) => ({
      type: "monster" as const,
      id: monster.mobCode,
      label: monster.name,
    }));
    return [...items, ...monsters];
  }, [filteredItems, filteredMonsters]);

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
      .filter((row): row is { entry: MonsterDropEntry; monster: Monster } => Boolean(row.monster));
  }, [selectedItemId]);

  const formatProb = (prob?: number) => {
    if (typeof prob !== "number" || prob <= 0) {
      return { percent: "정보 없음", fraction: null as { num: number; den: number } | null };
    }
    const percent = prob * 100;
    const decimals =
      percent >= 1
        ? 2
        : percent >= 0.01
          ? 2
          : percent >= 0.001
            ? 3
            : percent >= 0.0001
              ? 4
              : 5;
    const percentText = `${percent.toFixed(decimals)}%`;

    const scale = 1_000_000;
    let numerator = Math.round(prob * scale);
    let denominator = scale;
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    if (numerator > 0) {
      const divisor = gcd(numerator, denominator);
      numerator = Math.floor(numerator / divisor);
      denominator = Math.floor(denominator / divisor);
    }
    const fraction = numerator > 0 ? { num: numerator, den: denominator } : null;
    return { percent: percentText, fraction };
  };

  const renderFraction = (fraction: { num: number; den: number } | null) => {
    if (!fraction) return null;
    return (
      <span className="inline-flex flex-col items-center text-[12px] leading-none text-current">
        <span>{fraction.num}</span>
        <span className="my-0.5 h-px w-full bg-current/70" />
        <span>{fraction.den}</span>
      </span>
    );
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
        <h1 className="display text-4xl font-semibold md:text-5xl">드랍 테이블</h1>
        <p className="text-base text-slate-200/90 md:text-lg">
          몬스터가 드랍하는 아이템과 아이템을 드랍하는 몬스터를 양방향으로 빠르게 확인합니다.
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-slate-200/70">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            데이터: {dropData.source === "drops-parsed" ? "드랍 테이블" : "MonsterBook reward"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">드랍 확률/수량: 제공</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Panel
          title="검색"
          tone="blue"
          actions={<span className="text-xs text-[color:var(--retro-text-muted)]">몬스터 · 아이템</span>}
          className="shadow-[0_20px_40px_rgba(15,23,42,0.45)]"
        >
          <div className="flex flex-col gap-4 text-sm text-[color:var(--retro-text)]">
            <div className="space-y-2">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[16px] text-cyan-100/80">
                  ⌕
                </div>
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedItemId(null);
                    setSelectedMonsterName(null);
                    setShowSuggestions(true);
                    setActiveIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  onKeyDown={(event) => {
                    if (!showSuggestions) setShowSuggestions(true);
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      if (suggestionItems.length === 0) return;
                      setActiveIndex((prev) => (prev + 1) % suggestionItems.length);
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      if (suggestionItems.length === 0) return;
                      setActiveIndex((prev) => (prev <= 0 ? suggestionItems.length - 1 : prev - 1));
                    }
                    if (event.key === "Enter") {
                      if (activeIndex < 0 || activeIndex >= suggestionItems.length) return;
                      event.preventDefault();
                      const picked = suggestionItems[activeIndex];
                      if (picked.type === "item") {
                        setSelectedItemId(picked.id);
                        setSelectedMonsterName(null);
                        setQuery(picked.label);
                      } else {
                        setSelectedItemId(null);
                        setSelectedMonsterName(picked.label);
                        setQuery(picked.label);
                      }
                      setShowSuggestions(false);
                    }
                    if (event.key === "Escape") {
                      setShowSuggestions(false);
                      setActiveIndex(-1);
                    }
                  }}
                  placeholder="몬스터 또는 아이템 이름을 입력하세요"
                  className="w-full rounded-[12px] border border-cyan-200/30 bg-[var(--retro-bg)] px-10 py-3.5 text-sm text-[color:var(--retro-text)] placeholder:text-[color:var(--retro-text-muted)] shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_10px_30px_rgba(0,0,0,0.35)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20"
                />
                {query && showSuggestions ? (
                  <div className="absolute top-full z-20 mt-2 max-h-80 w-full overflow-auto rounded-[10px] border border-[var(--retro-border-strong)] bg-slate-950/95 p-3 shadow-[0_18px_34px_rgba(0,0,0,0.55)] backdrop-blur">
                    <div className="space-y-4">
                      {filteredItems.length === 0 && filteredMonsters.length === 0 ? (
                        <div className="text-xs text-[color:var(--retro-text-muted)]">검색 결과 없음</div>
                      ) : null}

                      {filteredItems.length > 0 ? (
                        <div>
                          <h3 className="text-xs font-semibold text-slate-100">아이템</h3>
                          <div className="mt-2 space-y-1">
                            {filteredItems.map((item, index) => (
                              <button
                                key={item.id}
                                type="button"
                                className={`flex w-full items-center gap-2 rounded-[6px] border px-2 py-2 text-left text-sm text-[color:var(--retro-text)] ${
                                  activeIndex === index
                                    ? "border-cyan-200/70 bg-[var(--retro-cell-strong)]"
                                    : "border-transparent hover:border-[var(--retro-border-strong)] hover:bg-[var(--retro-cell-strong)]"
                                }`}
                                onClick={() => {
                                  setSelectedItemId(item.id);
                                  setSelectedMonsterName(null);
                                  setQuery(item.name);
                                  setShowSuggestions(false);
                                }}
                              >
                                <img src={getItemIconUrl(item.id)} alt={item.name} className="h-6 w-6" loading="lazy" />
                                <span className="flex-1 truncate">{item.name}</span>
                                <span className="text-[11px] text-[color:var(--retro-text-muted)]">{getItemGroup(item)}</span>
                                <span className="text-[11px] text-[color:var(--retro-text-muted)]">#{item.id}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {filteredMonsters.length > 0 ? (
                        <div>
                          <h3 className="text-xs font-semibold text-slate-100">몬스터</h3>
                          <div className="mt-2 space-y-1">
                            {filteredMonsters.map((monster, index) => {
                              const adjustedIndex = filteredItems.length + index;
                              return (
                              <button
                                key={monster.mobCode}
                                type="button"
                                className={`flex w-full items-center gap-2 rounded-[6px] border px-2 py-2 text-left text-sm text-[color:var(--retro-text)] ${
                                  activeIndex === adjustedIndex
                                    ? "border-cyan-200/70 bg-[var(--retro-cell-strong)]"
                                    : "border-transparent hover:border-[var(--retro-border-strong)] hover:bg-[var(--retro-cell-strong)]"
                                }`}
                                onClick={() => {
                                  setSelectedItemId(null);
                                  setSelectedMonsterName(monster.name);
                                  setQuery(monster.name);
                                  setShowSuggestions(false);
                                }}
                              >
                                <img src={getMobIconUrl(monster.mobCode)} alt={monster.name} className="h-6 w-6" />
                                <span className="flex-1 truncate">{monster.name}</span>
                                <span className="text-[11px] text-[color:var(--retro-text-muted)]">
                                  Lv.{monster.level ?? "-"}
                                </span>
                              </button>
                            );
                            })}
                          </div>
                        </div>
                      ) : null}
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
                    className="h-12 w-12"
                  />
                  <div className="flex-1">
                    <div className="text-base font-semibold">{itemsById.get(selectedItemId)?.name ?? "아이템"}</div>
                    <div className="text-xs text-[color:var(--retro-text-muted)]">아이템 선택됨</div>
                  </div>
                </div>
                <div className="mt-2 border-t border-white/10 pt-2">
                  <a
                    href={`https://www.mapleland.gg/item/${selectedItemId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-semibold text-cyan-100 hover:border-cyan-200/60 hover:bg-cyan-200/20"
                  >
                    메랜지지 바로가기
                  </a>
                </div>
              </div>
            ) : selectedMonster ? (
              <div className="rounded-[10px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <img src={getMobIconUrl(selectedMonster.mobCode)} alt={selectedMonster.name} className="h-12 w-12" />
                  <div className="flex-1">
                    <div className="text-base font-semibold">{selectedMonster.name}</div>
                    <div className="text-xs text-[color:var(--retro-text-muted)]">
                      Lv.{selectedMonster.level ?? "-"} · {selectedMonster.region ?? "지역 정보 없음"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedMonster ? (
              <div className="space-y-3">
                <div className="rounded-[14px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-4 py-4 text-sm text-[color:var(--retro-text)]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-100">몬스터 정보</div>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[color:var(--retro-text-muted)]">
                      Lv.{selectedMonster.level ?? "-"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>HP {selectedMonster.hp ?? "-"}</div>
                    <div>EXP {selectedMonster.exp ?? "-"}</div>
                    <div>물공 {selectedMonster.watk ?? "-"}</div>
                    <div>마공 {selectedMonster.matk ?? "-"}</div>
                    <div>물방 {selectedMonster.def ?? "-"}</div>
                    <div>마방 {selectedMonster.mDef ?? "-"}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={`/calculators/onehit?mob=${encodeURIComponent(selectedMonster.name)}`}
                    className="inline-flex items-center justify-center rounded-[10px] border border-sky-200/30 bg-sky-200/10 px-3 py-2 text-xs font-semibold text-sky-100 hover:border-sky-200/60 hover:bg-sky-200/20"
                  >
                    N방컷 계산하기
                  </a>
                  <a
                    href={`/calculator/damage?mob=${encodeURIComponent(selectedMonster.name)}`}
                    className="inline-flex items-center justify-center rounded-[10px] border border-emerald-200/30 bg-emerald-200/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:border-emerald-200/60 hover:bg-emerald-200/20"
                  >
                    피격뎀 계산하기
                  </a>
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
          className="shadow-[0_20px_40px_rgba(15,23,42,0.45)]"
        >
          {selectedMonster && !selectedItemId ? (
            <div className="grid gap-4 sm:grid-cols-2">
                {monsterDrops.length === 0 ? (
                  <p className="text-sm text-[color:var(--retro-text-muted)]">드랍 정보가 없습니다.</p>
                ) : (
                  monsterDrops.map((entry) => {
                    const item = itemsById.get(entry.itemId);
                    const amountLabel = formatAmountLabel(entry.min, entry.max);
                    return (
                      <div
                        key={`${entry.itemId}`}
                        className="flex items-center gap-4 rounded-[12px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-4 py-3 text-sm transition hover:border-cyan-200/60 hover:bg-[var(--retro-cell-strong)]"
                        onClick={() => {
                          setSelectedItemId(entry.itemId);
                          setSelectedMonsterName(null);
                          const name = itemsById.get(entry.itemId)?.name;
                          if (name) setQuery(name);
                        }}
                      >
                        <img src={getItemIconUrl(entry.itemId)} alt={item?.name ?? String(entry.itemId)} className="h-12 w-12" />
                        <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold">{item?.name ?? "미확인 아이템"}</div>
                            {getItemLevel(item) !== null ? (
                              <div className="mt-1 text-xs text-[color:var(--retro-text-muted)]">Lv.{getItemLevel(item)}</div>
                            ) : null}
                            <div className="mt-1 text-xs text-[color:var(--retro-text-muted)]">
                              {item ? getItemGroup(item) : "기타템"}
                              {amountLabel ? ` · ${amountLabel}` : ""}
                            </div>
                          </div>
                          {(() => {
                            const prob = formatProb(entry.prob);
                            return (
                          <div className="flex min-w-[84px] flex-col items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100">
                              <div className="text-sm">{prob.percent}</div>
                              {prob.fraction ? <div className="mt-1">{renderFraction(prob.fraction)}</div> : null}
                          </div>
                            );
                          })()}
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
                  <p className="text-sm text-[color:var(--retro-text-muted)]">해당 아이템을 드랍하는 몬스터가 없습니다.</p>
                ) : null}
                {monstersForItem.map(({ monster, entry }) => (
                  <div
                    key={monster?.mobCode}
                    className="flex items-center gap-4 rounded-[14px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-5 py-4 text-sm transition hover:border-emerald-200/60 hover:bg-[var(--retro-cell-strong)]"
                    onClick={() => {
                      setSelectedItemId(null);
                      setSelectedMonsterName(monster.name);
                      setQuery(monster.name);
                    }}
                  >
                    <img
                      src={getMobRenderUrl(monster.mobCode)}
                      alt={monster.name}
                      className="h-16 w-16"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getMobIconUrl(monster.mobCode);
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold">{monster.name}</div>
                          <div className="mt-1 text-xs text-[color:var(--retro-text-muted)]">
                            Lv.{monster.level ?? "-"} · {monster.region ?? "지역 정보 없음"}
                          </div>
                          <div className="text-xs text-[color:var(--retro-text-muted)]">
                            HP {monster.hp ?? "-"} · EXP {monster.exp ?? "-"}
                            {formatAmountLabel(entry.min, entry.max) ? ` · ${formatAmountLabel(entry.min, entry.max)}` : ""}
                          </div>
                        </div>
                        {(() => {
                          const prob = formatProb(entry.prob);
                          return (
                            <div className="flex min-w-[84px] flex-col items-center justify-center rounded-2xl border border-emerald-200/30 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100">
                              <div className="text-sm">{prob.percent}</div>
                              {prob.fraction ? <div className="mt-1">{renderFraction(prob.fraction)}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[color:var(--retro-text-muted)]">
                아이템이나 몬스터를 선택하면 결과가 표시됩니다.
              </p>
            )}
        </Panel>
      </div>
    </div>
  );
}
