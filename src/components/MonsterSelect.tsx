import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { getMobIconUrl } from "@/lib/maplestory-io";
import type { Monster } from "@/types/monster";

type MonsterSelectProps = {
  monsters: Monster[];
  value: string;
  onChange: (value: string) => void;
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

export function MonsterSelect({ monsters, value, onChange }: MonsterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const keyword = normalizeMonsterQuery(value);
    const list = keyword
      ? monsters.filter((monster) => {
          const keys = getMonsterSearchKeys(monster.name);
          return keys.some((key) => key.includes(keyword));
        })
      : monsters;
    return list.slice(0, 60);
  }, [monsters, value]);

  const selectedMonster = useMemo(
    () => monsters.find((monster) => monster.name === value),
    [monsters, value],
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
  };

  const handleSelect = (monsterName: string) => {
    onChange(monsterName);
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
      handleSelect(filtered[activeIndex]?.name ?? filtered[0].name);
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
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="몬스터 이름을 검색하세요"
        />
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
          {selectedMonster?.mobCode ? (
            <Image
              src={getMobIconUrl(selectedMonster.mobCode)}
              alt={selectedMonster.name}
              width={22}
              height={22}
              className="h-[22px] w-[22px] object-contain"
              unoptimized
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
                  onClick={() => handleSelect(monster.name)}
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
                    className="h-6 w-6 shrink-0 object-contain"
                    unoptimized
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
