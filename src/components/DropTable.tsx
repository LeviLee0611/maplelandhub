"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { getItemIconCandidateUrls, getMobAnimatedFallbackUrl, getMobIconUrl, getMobRenderUrl } from "@/lib/maplestory-io";
import { getMonsters } from "@/lib/data/monsters";
import { isReleasedMobCode } from "@/lib/release-filter";
import type { Monster } from "@/types/monster";
import dropIndex from "@data/drop-index.json";
import itemDetailByJson from "@data/item-detail-by.json";

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
    synthetic?: boolean;
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

type ItemDetailByData = {
  itemsByItemId?: Record<string, MonsterDropEntry[]>;
};

const monsterList = getMonsters() as Monster[];
const dropData = dropIndex as DropIndexData;
const itemDetailByData = itemDetailByJson as ItemDetailByData;
const INITIAL_SUGGESTION_COUNT = 10;
const SEARCH_SUGGESTION_LIMIT = 60;
const GROUP_ORDER = ["주문서", "장비", "물약", "기타템"];
const KOREAN_INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

function normalizeQuery(text: string) {
  return text.toLowerCase().replace(/[^0-9a-z가-힣ㄱ-ㅎ]+/gi, "");
}

function toKoreanInitials(text: string) {
  let result = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const syllableIndex = code - 0xac00;
      const initialIndex = Math.floor(syllableIndex / 588);
      result += KOREAN_INITIALS[initialIndex] ?? "";
      continue;
    }
    result += char;
  }
  return result;
}

function getSearchKeys(raw: string) {
  const base = String(raw ?? "").trim();
  if (!base) return [];
  const noParen = base.replace(/\([^)]*\)/g, " ").trim();
  const normalized = normalizeQuery(base);
  const tokens = base.split(/\s+/).filter(Boolean);
  const initials = tokens.map((token) => token[0]).join("");
  const firstTwoChars = tokens.map((token) => token.slice(0, 2)).join("");
  const hangulInitials = normalizeQuery(toKoreanInitials(base));
  const hangulInitialsNoParen = normalizeQuery(toKoreanInitials(noParen));
  return Array.from(
    new Set([
      normalized,
      normalizeQuery(noParen),
      normalizeQuery(initials),
      normalizeQuery(firstTwoChars),
      hangulInitials,
      hangulInitialsNoParen,
    ])
  ).filter(Boolean);
}

function isSyntheticItem(item?: DropIndexItem | null) {
  return Boolean(item?.meta?.synthetic || (typeof item?.id === "number" && item.id < 0));
}

function normalizeItemName(text: string) {
  return String(text ?? "")
    .replace(/민첩성/g, "민첩")
    .replace(/지력성/g, "지력")
    .replace(/명중률/g, "명중")
    .replace(/회피율/g, "회피")
    .replace(/[’‘`]/g, "'")
    .replace(/[(){}\[\]'"~!@#$^&*_+=|\\/:;,.?-]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function getSyntheticTileLabel(name: string) {
  const raw = String(name ?? "").trim();
  if (!raw) return "?";
  if (raw.includes("마스터리북")) return "MB";
  if (raw.includes("주문서")) return "SC";
  if (raw.includes("카드")) return "CD";
  if (raw.includes("조각")) return "PK";
  if (raw.includes("촉진제")) return "UP";
  const compact = raw.replace(/\[[^\]]*\]/g, "").replace(/\([^)]*\)/g, "").replace(/\s+/g, "");
  return compact.slice(0, 2) || raw.slice(0, 2) || "?";
}

function ItemIcon({
  item,
  sizeClass,
  iconItemId,
}: {
  item?: DropIndexItem;
  sizeClass: string;
  iconItemId?: number | null;
}) {
  const [failed, setFailed] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const candidateUrls = useMemo(() => {
    if (!iconItemId || iconItemId <= 0) return [];
    return getItemIconCandidateUrls(iconItemId);
  }, [iconItemId]);

  if (failed || candidateUrls.length === 0) {
    return (
      <div
        className={`${sizeClass} flex items-center justify-center rounded-md border border-dashed border-white/20 bg-[linear-gradient(135deg,rgba(34,197,94,0.08),rgba(59,130,246,0.12))] text-[10px] font-semibold text-[color:var(--retro-text-muted)]`}
        aria-label={item?.name ?? "가상 아이템"}
      >
        {getSyntheticTileLabel(item?.name ?? "")}
      </div>
    );
  }

  return (
    <img
      src={candidateUrls[Math.min(iconIndex, candidateUrls.length - 1)]}
      alt={item?.name ?? "아이템"}
      className={sizeClass}
      loading="lazy"
      onError={() => {
        if (iconIndex < candidateUrls.length - 1) {
          setIconIndex((prev) => prev + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

function getMatchScore(name: string, keyword: string) {
  if (!keyword) return 0;
  const keys = getSearchKeys(name);
  if (keys.some((key) => key === keyword)) return 4;
  if (keys.some((key) => key.startsWith(keyword) || keyword.startsWith(key))) return 3;
  if (keys.some((key) => key.includes(keyword) || keyword.includes(key))) return 2;
  return -1;
}

function getProbSortValue(prob?: number) {
  return typeof prob === "number" && Number.isFinite(prob) ? prob : -1;
}

function getWorldMapGroup(region?: string) {
  const text = String(region ?? "").trim();
  if (!text) return "기타";
  if (text.includes("빅토리아")) return "빅토리아";
  if (text.includes("루디브리엄") || text.includes("시계탑")) return "루디브리움";
  if (text.includes("오르비스")) return "오르비스";
  if (text.includes("리프레")) return "리프레";
  if (text.includes("엘나스") || text.includes("폐광")) return "엘나스";
  if (text.includes("아쿠아")) return "아쿠아리움";
  if (text.includes("마가티아")) return "마가티아";
  if (text.includes("아리안트")) return "아리안트";
  if (text.includes("무릉")) return "무릉도원";
  if (text.includes("아랫마을")) return "아랫마을";
  if (text.includes("지구방위본부")) return "지구방위본부";
  if (text.includes("시간의 신전")) return "시간의 신전";
  return text;
}

export function DropTable() {
  const [query, setQuery] = useState("");
  const [selectedWorldMap, setSelectedWorldMap] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedMonsterMobCode, setSelectedMonsterMobCode] = useState<number | null>(null);
  const [characterLevel, setCharacterLevel] = useState(1);
  const [fallbackDropsByMobCode, setFallbackDropsByMobCode] = useState<Record<number, DropEntry[]>>({});
  const [fallbackLoadingMobCode, setFallbackLoadingMobCode] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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
    () => monsterList.find((monster) => monster.mobCode === selectedMonsterMobCode),
    [selectedMonsterMobCode]
  );

  const hasLocalDrops = (mobCode: number) => (dropData.dropsByMonsterId[String(mobCode)] ?? []).length > 0;

  const ensureFallbackDrops = async (mobCode: number) => {
    if (!mobCode || hasLocalDrops(mobCode) || fallbackDropsByMobCode[mobCode]) return;
    setFallbackLoadingMobCode(mobCode);
    const rootUrl = `https://maplestory.io/api/wz/KMS/389/String/MonsterBook.img/${mobCode}/reward`;
    try {
      const rootRes = await fetch(rootUrl);
      if (!rootRes.ok) throw new Error(`Failed to load rewards for ${mobCode}`);
      const rootJson = await rootRes.json();
      const children: string[] = Array.isArray(rootJson?.children)
        ? rootJson.children.map((child: unknown) => String(child))
        : [];
      if (children.length === 0) {
        setFallbackDropsByMobCode((prev) => ({ ...prev, [mobCode]: [] }));
        return;
      }
      const results = await Promise.all(
        children.map(async (child: string) => {
          const childRes = await fetch(`${rootUrl}/${child}`);
          if (!childRes.ok) return null;
          const childJson = await childRes.json();
          const value = Number(childJson?.value);
          return Number.isFinite(value) && value > 0 ? value : null;
        })
      );
      const uniqueItemIds = Array.from(new Set(results.filter((value): value is number => Boolean(value))));
      setFallbackDropsByMobCode((prev) => ({
        ...prev,
        [mobCode]: uniqueItemIds.map((itemId) => ({ itemId })),
      }));
    } catch {
      setFallbackDropsByMobCode((prev) => ({ ...prev, [mobCode]: [] }));
    } finally {
      setFallbackLoadingMobCode((prev) => (prev === mobCode ? null : prev));
    }
  };

  const itemsById = useMemo(() => {
    const map = new Map<number, DropIndexItem>();
    for (const item of dropData.items) {
      map.set(item.id, item);
    }
    return map;
  }, []);

  const normalizedRealItemIds = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of dropData.items) {
      if (!item || typeof item.id !== "number" || item.id <= 0) continue;
      const normalized = normalizeItemName(item.name);
      if (normalized && !map.has(normalized)) {
        map.set(normalized, item.id);
      }
    }
    return map;
  }, []);

  const representativeIconIds = useMemo(() => {
    const findFirst = (predicate: (item: DropIndexItem) => boolean) =>
      dropData.items.find((item) => item.id > 0 && predicate(item))?.id ?? null;
    return {
      masteryBook: findFirst((item) => item.name.includes("[마스터리북]")),
      scroll60: findFirst((item) => item.name.includes("주문서") && item.name.includes("60%")),
      scroll10: findFirst((item) => item.name.includes("주문서") && item.name.includes("10%")),
      scroll30: findFirst((item) => item.name.includes("주문서") && item.name.includes("30%")),
      scroll70: findFirst((item) => item.name.includes("주문서") && item.name.includes("70%")),
      card: findFirst((item) => item.name.includes("카드")),
    };
  }, []);

  const getResolvedIconItemId = (item?: DropIndexItem | null) => {
    if (!item) return null;
    if (!isSyntheticItem(item)) return item.id;

    const normalized = normalizeItemName(item.name);
    const exact = normalizedRealItemIds.get(normalized);
    if (exact) return exact;

    if (item.name.includes("[마스터리북]")) {
      return representativeIconIds.masteryBook;
    }
    if (item.name.includes("카드")) {
      return representativeIconIds.card;
    }
    if (item.name.includes("주문서")) {
      if (item.name.includes("10%")) return representativeIconIds.scroll10 ?? representativeIconIds.scroll60;
      if (item.name.includes("30%")) return representativeIconIds.scroll30 ?? representativeIconIds.scroll60;
      if (item.name.includes("70%")) return representativeIconIds.scroll70 ?? representativeIconIds.scroll60;
      if (item.name.includes("60%")) return representativeIconIds.scroll60;
      return representativeIconIds.scroll60;
    }

    return null;
  };

  const queryKeyword = useMemo(() => normalizeQuery(query), [query]);

  const filteredItems = useMemo(() => {
    const keyword = queryKeyword;
    const sorted = [...dropData.items].sort((a, b) => {
      if (keyword) {
        const scoreDiff = getMatchScore(b.name, keyword) - getMatchScore(a.name, keyword);
        if (scoreDiff !== 0) return scoreDiff;
      }
      const groupA = getItemGroup(a);
      const groupB = getItemGroup(b);
      if (groupA !== groupB) return GROUP_ORDER.indexOf(groupA) - GROUP_ORDER.indexOf(groupB);
      return a.name.localeCompare(b.name, "ko");
    });
    if (!keyword) return sorted;
    return sorted.filter((item) => getMatchScore(item.name, keyword) >= 0);
  }, [queryKeyword]);

  const filteredMonsters = useMemo(() => {
    const keyword = queryKeyword;
    const sorted = [...monsterList]
      .filter((monster) => {
        if (selectedWorldMap === "all") return true;
        return getWorldMapGroup(monster.region) === selectedWorldMap;
      })
      .sort((a, b) => {
        if (keyword) {
          const scoreDiff = getMatchScore(b.name, keyword) - getMatchScore(a.name, keyword);
          if (scoreDiff !== 0) return scoreDiff;
        }
        return (a.level ?? 0) - (b.level ?? 0);
      });
    if (!keyword) return sorted;
    return sorted.filter((monster) => getMatchScore(monster.name, keyword) >= 0);
  }, [queryKeyword, selectedWorldMap]);

  const displayedItems = useMemo(() => {
    if (!queryKeyword) return filteredItems.slice(0, INITIAL_SUGGESTION_COUNT);
    return filteredItems.slice(0, SEARCH_SUGGESTION_LIMIT);
  }, [filteredItems, queryKeyword]);

  const displayedMonsters = useMemo(() => {
    if (!queryKeyword) return filteredMonsters.slice(0, INITIAL_SUGGESTION_COUNT);
    return filteredMonsters.slice(0, SEARCH_SUGGESTION_LIMIT);
  }, [filteredMonsters, queryKeyword]);

  const suggestionItems = useMemo(() => {
    const monsters = displayedMonsters.map((monster) => ({
      type: "monster" as const,
      id: monster.mobCode,
      label: monster.name,
    }));
    const items = displayedItems.map((item) => ({
      type: "item" as const,
      id: item.id,
      label: item.name,
    }));
    return [...monsters, ...items];
  }, [displayedItems, displayedMonsters]);

  const localMonsterDrops = useMemo(() => {
    if (!selectedMonster?.mobCode) return [];
    return dropData.dropsByMonsterId[String(selectedMonster.mobCode)] ?? [];
  }, [selectedMonster]);

  const monsterDrops = useMemo(() => {
    if (!selectedMonster?.mobCode) return [];
    const entries = localMonsterDrops.length > 0 ? localMonsterDrops : (fallbackDropsByMobCode[selectedMonster.mobCode] ?? []);
    return [...entries].sort((a, b) => {
      const probDiff = getProbSortValue(b.prob) - getProbSortValue(a.prob);
      if (probDiff !== 0) return probDiff;
      return a.itemId - b.itemId;
    });
  }, [selectedMonster, localMonsterDrops, fallbackDropsByMobCode]);

  const monstersForItem = useMemo(() => {
    if (!selectedItemId) return [];
    const preferredEntries = itemDetailByData.itemsByItemId?.[String(selectedItemId)] ?? [];
    const entries = preferredEntries.length ? preferredEntries : (dropData.monstersByItemId[String(selectedItemId)] ?? []);
    const monsterMap = new Map(monsterList.map((monster) => [monster.mobCode, monster]));
    return entries
      .map((entry) => ({
        ...entry,
        mobId: Number(entry.mobId),
      }))
      .filter((entry) => Number.isFinite(entry.mobId) && entry.mobId > 0)
      .filter((entry) => isReleasedMobCode(entry.mobId))
      .map((entry) => ({
        entry,
        monster: monsterMap.get(entry.mobId),
      }))
      .filter((row): row is { entry: MonsterDropEntry; monster: Monster } => Boolean(row.monster))
      .filter((row) => {
        if (selectedWorldMap === "all") return true;
        return getWorldMapGroup(row.monster.region) === selectedWorldMap;
      })
      .sort((a, b) => {
        const probDiff = getProbSortValue(b.entry.prob) - getProbSortValue(a.entry.prob);
        if (probDiff !== 0) return probDiff;
        return (a.monster.level ?? 0) - (b.monster.level ?? 0);
      });
  }, [selectedItemId, selectedWorldMap]);

  const worldMapOptions = useMemo(() => {
    const priority = [
      "빅토리아",
      "오르비스",
      "루디브리움",
      "리프레",
      "엘나스",
      "아쿠아리움",
      "무릉도원",
      "아리안트",
      "마가티아",
      "시간의 신전",
      "기타",
    ];
    const counts = new Map<string, number>();
    for (const monster of monsterList) {
      const group = getWorldMapGroup(monster.region);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }

    const labels = [...counts.keys()].sort((a, b) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return a.localeCompare(b, "ko");
    });

    return labels.map((label) => ({
      label,
      count: counts.get(label) ?? 0,
    }));
  }, []);

  const formatProb = (prob?: number) => {
    if (typeof prob !== "number" || prob < 0) {
      return { percent: "정보 없음", fraction: null as { num: number; den: number } | null };
    }
    if (prob === 0) {
      return { percent: "0.00%", fraction: null as { num: number; den: number } | null };
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

  const getRequiredAcc = (monster: Monster | undefined, level: number) => {
    if (!monster) return 0;
    const eva = monster.eva ?? 0;
    const monsterLevel = monster.level ?? 0;
    const diffLevel = Math.max(0, monsterLevel - Math.max(1, level));
    return Math.max(0, Math.ceil(((55 + diffLevel * 2) * eva) / 15));
  };

  const handleMobImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>, mobCode: number) => {
    const target = event.currentTarget;
    if (target.dataset.fallback === "animated") {
      target.onerror = null;
      target.src = getMobIconUrl(mobCode);
      return;
    }
    target.dataset.fallback = "animated";
    target.src = getMobAnimatedFallbackUrl(mobCode, "stand");
  };

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <header className="glass-panel flex flex-col gap-3 rounded-3xl px-6 py-6 text-left">
        <h1 className="display text-4xl font-semibold md:text-5xl">드랍 테이블</h1>
        <p className="text-base text-slate-200/90 md:text-lg">
          몬스터가 드랍하는 아이템과 아이템을 드랍하는 몬스터를 양방향으로 빠르게 확인합니다.
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-slate-200/70">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            데이터: {String(dropData.source ?? "").startsWith("drops-parsed") ? "드랍 테이블" : "MonsterBook reward"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">드랍 확률/수량: 제공</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Panel
          title="검색"
          tone="blue"
          actions={
            <span className="text-xs text-[color:var(--retro-text-muted)]">
              표시 {displayedItems.length + displayedMonsters.length} / 결과 {filteredItems.length + filteredMonsters.length}
            </span>
          }
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
                    setSelectedMonsterMobCode(null);
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
                        setSelectedMonsterMobCode(null);
                        setQuery(picked.label);
                      } else {
                        setSelectedItemId(null);
                        setSelectedMonsterMobCode(picked.id);
                        const selected = monsterList.find((monster) => monster.mobCode === picked.id);
                        setCharacterLevel(Math.max(1, selected?.level ?? 1));
                        void ensureFallbackDrops(picked.id);
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
                      {displayedItems.length === 0 && displayedMonsters.length === 0 ? (
                        <div className="text-xs text-[color:var(--retro-text-muted)]">검색 결과 없음</div>
                      ) : null}

                      {displayedMonsters.length > 0 ? (
                        <div>
                          <h3 className="text-xs font-semibold text-slate-100">몬스터</h3>
                          <div className="mt-2 space-y-1">
                            {displayedMonsters.map((monster, index) => (
                              <button
                                key={monster.mobCode}
                                type="button"
                                className={`flex w-full items-center gap-2 rounded-[6px] border px-2 py-2 text-left text-sm text-[color:var(--retro-text)] ${
                                  activeIndex === index
                                    ? "border-cyan-200/70 bg-[var(--retro-cell-strong)]"
                                    : "border-transparent hover:border-[var(--retro-border-strong)] hover:bg-[var(--retro-cell-strong)]"
                                }`}
                                onClick={() => {
                                  setSelectedItemId(null);
                                  setSelectedMonsterMobCode(monster.mobCode);
                                  setCharacterLevel(Math.max(1, monster.level ?? 1));
                                  void ensureFallbackDrops(monster.mobCode);
                                  setQuery(monster.name);
                                  setShowSuggestions(false);
                                }}
                              >
                                <img
                                  src={getMobIconUrl(monster.mobCode)}
                                  alt={monster.name}
                                  className="h-6 w-6"
                                  onError={(event) => handleMobImageError(event, monster.mobCode)}
                                />
                                <span className="flex-1 truncate">{monster.name}</span>
                                <span className="text-[11px] text-[color:var(--retro-text-muted)]">
                                  Lv.{monster.level ?? "-"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {displayedItems.length > 0 ? (
                        <div>
                          <h3 className="text-xs font-semibold text-slate-100">아이템</h3>
                          <div className="mt-2 space-y-1">
                            {displayedItems.map((item, index) => {
                              const adjustedIndex = displayedMonsters.length + index;
                              return (
                              <button
                                key={item.id}
                                type="button"
                                className={`flex w-full items-center gap-2 rounded-[6px] border px-2 py-2 text-left text-sm text-[color:var(--retro-text)] ${
                                  activeIndex === adjustedIndex
                                    ? "border-cyan-200/70 bg-[var(--retro-cell-strong)]"
                                    : "border-transparent hover:border-[var(--retro-border-strong)] hover:bg-[var(--retro-cell-strong)]"
                                }`}
                                onClick={() => {
                                  setSelectedItemId(item.id);
                                  setSelectedMonsterMobCode(null);
                                  setQuery(item.name);
                                  setShowSuggestions(false);
                                }}
                              >
                                <ItemIcon item={item} sizeClass="h-6 w-6" iconItemId={getResolvedIconItemId(item)} />
                                <span className="flex-1 truncate">{item.name}</span>
                                <span className="text-[11px] text-[color:var(--retro-text-muted)]">{getItemGroup(item)}</span>
                                <span className="text-[11px] text-[color:var(--retro-text-muted)]">#{item.id}</span>
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
              {!queryKeyword && filteredItems.length + filteredMonsters.length > displayedItems.length + displayedMonsters.length ? (
                <p className="mt-2 text-xs text-cyan-100/90">
                  검색어가 없을 때는 처음 {INITIAL_SUGGESTION_COUNT}개씩만 표시됩니다.
                </p>
              ) : null}
              <div>
                <label className="mb-1 block text-xs text-[color:var(--retro-text-muted)]">월드맵 필터</label>
                <select
                  value={selectedWorldMap}
                  onChange={(event) => setSelectedWorldMap(event.target.value)}
                  className="w-full rounded-[10px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2.5 text-sm text-[color:var(--retro-text)] focus:border-cyan-200/70 focus:outline-none focus:ring-4 focus:ring-cyan-200/20"
                >
                  <option value="all">전체 지역</option>
                  {worldMapOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedItemId ? (
              <div className="rounded-[10px] border border-cyan-200/30 bg-[var(--retro-cell)] px-3 py-2 shadow-[0_10px_22px_rgba(8,47,73,0.35)]">
                <div className="flex items-center gap-2">
                  <ItemIcon
                    item={itemsById.get(selectedItemId)}
                    sizeClass="h-12 w-12"
                    iconItemId={getResolvedIconItemId(itemsById.get(selectedItemId))}
                  />
                  <div className="flex-1">
                    <div className="text-base font-semibold">{itemsById.get(selectedItemId)?.name ?? "아이템"}</div>
                    <div className="text-xs text-[color:var(--retro-text-muted)]">
                      {isSyntheticItem(itemsById.get(selectedItemId)) ? "아이템 선택됨 · 아이콘 없음" : "아이템 선택됨"}
                    </div>
                  </div>
                </div>
                {!isSyntheticItem(itemsById.get(selectedItemId)) ? (
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
                ) : null}
              </div>
            ) : selectedMonster ? (
              <div className="rounded-[10px] border border-emerald-200/30 bg-[var(--retro-cell)] px-3 py-2 shadow-[0_10px_22px_rgba(6,78,59,0.35)]">
                <div className="flex items-center gap-2">
                  <img
                    src={getMobIconUrl(selectedMonster.mobCode)}
                    alt={selectedMonster.name}
                    className="h-12 w-12"
                    onError={(event) => handleMobImageError(event, selectedMonster.mobCode)}
                  />
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
                    <div>회피 {selectedMonster.eva ?? "-"}</div>
                    <div>필요 명중치 {getRequiredAcc(selectedMonster, characterLevel)}</div>
                  </div>
                  <div className="mt-3">
                    <label className="mb-1 block text-xs text-[color:var(--retro-text-muted)]">캐릭터 레벨</label>
                    <input
                      type="number"
                      min={1}
                      max={250}
                      value={characterLevel}
                      onChange={(event) => {
                        const parsed = Number(event.target.value);
                        setCharacterLevel(Number.isFinite(parsed) ? Math.min(250, Math.max(1, Math.floor(parsed))) : 1);
                      }}
                      className="w-full rounded-[8px] border border-cyan-200/30 bg-[var(--retro-bg)] px-3 py-2 text-sm text-[color:var(--retro-text)] focus:border-cyan-200/70 focus:outline-none focus:ring-2 focus:ring-cyan-200/20"
                    />
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
          className="glass-panel-strong border-cyan-200/25 shadow-[0_20px_40px_rgba(15,23,42,0.45)]"
        >
          {selectedMonster && !selectedItemId ? (
            <div className="grid gap-4 sm:grid-cols-2">
                {monsterDrops.length === 0 ? (
                  <p className="text-sm text-[color:var(--retro-text-muted)]">
                    {fallbackLoadingMobCode === selectedMonster.mobCode
                      ? "몬스터북 보상 데이터를 불러오는 중입니다..."
                      : `드랍 정보가 없습니다. (Mob ID: ${selectedMonster.mobCode}, 로컬/몬스터북 소스 미수록 가능)`}
                  </p>
                ) : (
                  monsterDrops.map((entry) => {
                    const normalizedItemId = Number(entry.itemId);
                    const itemId = Number.isFinite(normalizedItemId) ? normalizedItemId : entry.itemId;
                    const item = Number.isFinite(normalizedItemId) ? itemsById.get(normalizedItemId) : undefined;
                    const amountLabel = formatAmountLabel(entry.min, entry.max);
                    return (
                      <div
                        key={String(itemId)}
                        className="retro-subsection flex items-center gap-4 rounded-[12px] border border-cyan-200/25 bg-[var(--retro-cell)] px-4 py-3 text-sm shadow-[0_10px_20px_rgba(8,47,73,0.3)] transition hover:border-cyan-200/60 hover:bg-[var(--retro-cell-strong)]"
                        onClick={() => {
                          if (!Number.isFinite(normalizedItemId)) return;
                          setSelectedItemId(normalizedItemId);
                          setSelectedMonsterMobCode(null);
                          const name = itemsById.get(normalizedItemId)?.name;
                          if (name) setQuery(name);
                        }}
                      >
                        <ItemIcon item={item} sizeClass="h-12 w-12" iconItemId={getResolvedIconItemId(item)} />
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
                    className="retro-subsection flex items-center gap-4 rounded-[14px] border border-emerald-200/25 bg-[var(--retro-cell)] px-5 py-4 text-sm shadow-[0_10px_20px_rgba(6,78,59,0.3)] transition hover:border-emerald-200/60 hover:bg-[var(--retro-cell-strong)]"
                    onClick={() => {
                      setSelectedItemId(null);
                      setSelectedMonsterMobCode(monster.mobCode);
                      setCharacterLevel(Math.max(1, monster.level ?? 1));
                      void ensureFallbackDrops(monster.mobCode);
                      setQuery(monster.name);
                    }}
                  >
                    <img
                      src={getMobRenderUrl(monster.mobCode)}
                      alt={monster.name}
                      className="h-16 w-16"
                      onError={(event) => {
                        handleMobImageError(event, monster.mobCode);
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
    </section>
  );
}
