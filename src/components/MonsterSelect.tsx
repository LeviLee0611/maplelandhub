import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { getMobIconUrl, handleMapleIoImageError } from "@/lib/maplestory-io";
import { filterReleasedMonsters } from "@/lib/release-filter";
import { resolveSelectedMonster } from "@/lib/data/monsters";
import type { Monster } from "@/types/monster";

type MonsterSelectProps = {
  monsters: Monster[];
  value: string;
  /**
   * 목록에서 고른 몬스터의 mobCode. 이름이 같은 몬스터가 여럿이라(출시분 기준 52개 이름,
   * 그중 19개는 HP까지 다름) 이름만으로는 어느 쪽인지 결정되지 않는다. 검색어를 직접
   * 입력하는 중이면 null.
   */
  selectedMobCode?: number | null;
  /** 목록에서 고른 경우에만 mobCode가 함께 온다. 자유 입력 중에는 undefined. */
  onChange: (value: string, mobCode?: number) => void;
};

function normalizeMonsterQuery(text: string) {
  return text.replace(/\s+/g, "").toLowerCase();
}

function getMonsterSearchKeys(name: string) {
  const raw = String(name ?? "").trim();
  if (!raw) return [];

  const normalizedName = normalizeMonsterQuery(raw);
  const tokens = raw.split(/\s+/).filter(Boolean);
  const initials = tokens.map((token) => token[0]).join("");
  const firstTwoChars = tokens.map((token) => token.slice(0, 2)).join("");

  return Array.from(new Set([
    normalizedName,
    normalizeMonsterQuery(initials),
    normalizeMonsterQuery(firstTwoChars),
  ]));
}

export function MonsterSelect({ monsters, value, selectedMobCode, onChange }: MonsterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAllOnOpen, setShowAllOnOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const releasedMonsters = useMemo(() => filterReleasedMonsters(monsters), [monsters]);

  // 검색 키는 목록이 바뀔 때만 만든다 — 예전엔 타이핑할 때마다 500여 종의 키를 다시 만들었다.
  const searchIndex = useMemo(
    () => releasedMonsters.map((monster) => ({ monster, keys: getMonsterSearchKeys(monster.name) })),
    [releasedMonsters],
  );

  const filtered = useMemo(() => {
    if (showAllOnOpen) {
      return releasedMonsters.slice(0, 60);
    }
    const keyword = normalizeMonsterQuery(value);
    if (!keyword) return releasedMonsters.slice(0, 60);

    const matched: Monster[] = [];
    for (const entry of searchIndex) {
      if (entry.keys.some((key) => key.includes(keyword))) {
        matched.push(entry.monster);
        if (matched.length >= 60) break;
      }
    }
    return matched;
  }, [releasedMonsters, searchIndex, showAllOnOpen, value]);

  const selectedMonster = useMemo(
    () => resolveSelectedMonster(releasedMonsters, value, selectedMobCode),
    [releasedMonsters, selectedMobCode, value],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const container = listRef.current;
    const activeEl = container?.querySelector<HTMLButtonElement>(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setActiveIndex(0);
    setIsOpen(true);
    setShowAllOnOpen(false);
  };

  const handleSelect = (monster: Monster) => {
    onChange(monster.name, monster.mobCode);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!filtered.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(filtered[activeIndex] ?? filtered[0]);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="space-y-1 text-xs">
      <span className="inline-flex items-center bg-[var(--retro-label)] px-2 py-0.5 text-[11px] font-medium text-white">
        몬스터
      </span>
      <div className="relative">
        <input
          className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] pl-10 pr-7 py-2 text-xs text-[color:var(--retro-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] focus:border-[var(--retro-border-strong)] focus:outline-none"
          value={value}
          onChange={handleChange}
          onFocus={() => {
            if (value === "달팽이") {
              onChange("");
            }
            setShowAllOnOpen(true);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="몬스터 이름을 검색하세요"
        />
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
          {selectedMonster?.mobCode ? (
            <Image
              key={selectedMonster.mobCode}
              src={getMobIconUrl(selectedMonster.mobCode)}
              alt={selectedMonster.name}
              width={22}
              height={22}
              data-maple-code={String(selectedMonster.mobCode)}
              data-maple-retry="0"
              className="h-[22px] w-[22px] object-contain"
              unoptimized
              onError={(event) => handleMapleIoImageError(event, "mob")}
            />
          ) : (
            <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded bg-[var(--retro-cell-strong)] text-[10px] text-[color:var(--retro-text-muted)]">
              ?
            </span>
          )}
        </span>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[color:var(--retro-text-muted)]">
          ▼
        </span>

        {isOpen ? (
          <div
            ref={listRef}
            className="absolute bottom-full z-30 mb-1 max-h-64 w-full overflow-auto rounded-[8px] border border-[var(--retro-border-strong)] bg-[var(--retro-bg)] p-1 shadow-[0_14px_30px_rgba(0,0,0,0.45)] backdrop-blur"
          >
            {filtered.length ? (
              filtered.map((monster, index) => (
                <button
                  key={monster.mobCode}
                  data-index={index}
                  type="button"
                  onClick={() => handleSelect(monster)}
                  className={`flex w-full items-center gap-2 rounded-[6px] border px-2 py-1.5 text-left text-xs transition ${
                    index === activeIndex
                      ? "border-cyan-300/70 bg-cyan-300/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
                      : "border-transparent text-[color:var(--retro-text)] hover:bg-[var(--retro-cell-strong)]/80"
                  }`}
                >
                  <Image
                    src={getMobIconUrl(monster.mobCode)}
                    alt={monster.name}
                    width={24}
                    height={24}
                    data-maple-code={String(monster.mobCode)}
                    data-maple-retry="0"
                    className="h-6 w-6 shrink-0 object-contain"
                    unoptimized
                    onError={(event) => handleMapleIoImageError(event, "mob")}
                  />
                  <span className="flex-1">{monster.name}</span>
                  <span className="text-[10px] text-[color:var(--retro-text-muted)]">Lv.{monster.level}</span>
                </button>
              ))
            ) : (
              <div className="px-2 py-2 text-[11px] text-[color:var(--retro-text-muted)]">검색 결과가 없습니다.</div>
            )}
          </div>
        ) : null}
      </div>
      <p className="text-[10px] text-[color:var(--retro-text-muted)]">이름 검색 후 Enter로 빠르게 선택할 수 있습니다.</p>
    </div>
  );
}
