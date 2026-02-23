"use client";

import { useEffect, useMemo, useState } from "react";

type QuickSlotRecord<T> = {
  data: T;
} | null;

type QuickSlotsProps<T> = {
  storageKey: string;
  getSnapshot: () => T;
  applySnapshot: (data: T) => void;
  title?: string;
  slotCount?: number;
  preview?: (data: T) => string;
};

export function QuickSlots<T>({
  storageKey,
  getSnapshot,
  applySnapshot,
  title = "빠른 저장",
  slotCount = 6,
  preview,
}: QuickSlotsProps<T>) {
  const [slots, setSlots] = useState<Array<QuickSlotRecord<T>>>(() => {
    if (typeof window === "undefined") return Array.from({ length: slotCount }, () => null);
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return Array.from({ length: slotCount }, () => null);
    try {
      const parsed = JSON.parse(raw) as Array<QuickSlotRecord<T>>;
      if (!Array.isArray(parsed)) return Array.from({ length: slotCount }, () => null);
      return Array.from({ length: slotCount }, (_, index) => parsed[index] ?? null);
    } catch {
      return Array.from({ length: slotCount }, () => null);
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(slots));
  }, [storageKey, slots]);

  const slotLabels = useMemo(
    () =>
      slots.map((slot) => {
        if (!slot) return "비어 있음";
        if (preview) return preview(slot.data);
        return "저장됨";
      }),
    [slots, preview],
  );

  const saveToSlot = (index: number) => {
    const next = [...slots];
    next[index] = { data: getSnapshot() };
    setSlots(next);
  };

  const loadFromSlot = (index: number) => {
    const slot = slots[index];
    if (!slot) return;
    applySnapshot(slot.data);
  };

  const clearSlot = (index: number) => {
    const next = [...slots];
    next[index] = null;
    setSlots(next);
  };

  return (
    <details className="relative inline-block">
      <summary className="inline-flex cursor-pointer list-none items-center rounded border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2 py-1 text-[11px] font-semibold text-[color:var(--retro-text)] hover:border-[var(--retro-border-strong)]">
        {title}
      </summary>
      <div className="absolute left-0 top-full z-30 mt-2 w-[340px] max-w-[85vw] rounded-[10px] border border-[var(--retro-border-strong)] bg-[color:var(--retro-bg)] p-2 shadow-[0_16px_34px_rgba(0,0,0,0.32)]">
        <div className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1">
          {slots.map((slot, index) => (
            <div key={index} className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] p-2">
              <div className="mb-1 text-[11px] font-semibold text-[color:var(--retro-text)]">슬롯 {index + 1}</div>
              <div className="mb-2 truncate text-[10px] text-[color:var(--retro-text-muted)]">{slotLabels[index]}</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded border border-[var(--retro-border)] bg-[var(--retro-bg)] px-2 py-1 text-[10px] text-[color:var(--retro-text)] hover:border-[var(--retro-border-strong)]"
                  onClick={() => saveToSlot(index)}
                >
                  저장
                </button>
                <button
                  type="button"
                  className="rounded border border-[var(--retro-border)] bg-[var(--retro-bg)] px-2 py-1 text-[10px] text-[color:var(--retro-text)] hover:border-[var(--retro-border-strong)] disabled:opacity-40"
                  onClick={() => loadFromSlot(index)}
                  disabled={!slot}
                >
                  불러오기
                </button>
                <button
                  type="button"
                  className="rounded border border-[var(--retro-border)] bg-[var(--retro-bg)] px-2 py-1 text-[10px] text-[color:var(--retro-text)] hover:border-[var(--retro-border-strong)] disabled:opacity-40"
                  onClick={() => clearSlot(index)}
                  disabled={!slot}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
