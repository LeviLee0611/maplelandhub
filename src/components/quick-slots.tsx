"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  slotsOverride?: Array<QuickSlotRecord<T>> | null;
  onSaveSlot?: (index: number, data: T) => void | Promise<void>;
  onDeleteSlot?: (index: number) => void | Promise<void>;
  slotName?: (index: number) => string;
};

export function QuickSlots<T>({
  storageKey,
  getSnapshot,
  applySnapshot,
  title = "빠른 저장",
  slotCount = 6,
  preview,
  slotsOverride = null,
  onSaveSlot,
  onDeleteSlot,
  slotName,
}: QuickSlotsProps<T>) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
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
    if (slotsOverride) return;
    window.localStorage.setItem(storageKey, JSON.stringify(slots));
  }, [storageKey, slots, slotsOverride]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details || !details.open) return;
      const target = event.target;
      if (target instanceof Node && !details.contains(target)) {
        details.removeAttribute("open");
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const effectiveSlots = useMemo(
    () => (slotsOverride ? Array.from({ length: slotCount }, (_, index) => slotsOverride[index] ?? null) : slots),
    [slotCount, slotsOverride, slots],
  );

  const slotLabels = useMemo(
    () =>
      effectiveSlots.map((slot) => {
        if (!slot) return "비어 있음";
        if (preview) return preview(slot.data);
        return "저장됨";
      }),
    [effectiveSlots, preview],
  );

  const saveToSlot = (index: number) => {
    const snapshot = getSnapshot();
    if (slotsOverride) {
      void onSaveSlot?.(index, snapshot);
      return;
    }
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { data: snapshot };
      return next;
    });
    void onSaveSlot?.(index, snapshot);
  };

  const loadFromSlot = (index: number) => {
    const slot = effectiveSlots[index];
    if (!slot) return;
    applySnapshot(slot.data);
  };

  const clearSlot = (index: number) => {
    if (!slotsOverride) {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    }
    void onDeleteSlot?.(index);
  };

  return (
    <details ref={detailsRef} className="relative inline-block">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-[7px] border border-cyan-300/40 bg-[linear-gradient(180deg,rgba(34,211,238,0.14),rgba(34,211,238,0.05))] px-2.5 py-1.5 text-[11px] font-semibold text-cyan-100 shadow-[0_4px_10px_rgba(34,211,238,0.12)] transition hover:-translate-y-0.5 hover:border-cyan-200/60 hover:bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(34,211,238,0.08))] active:translate-y-0">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] border border-cyan-200/50 bg-cyan-200/10 text-[9px] font-bold text-cyan-100">
          S
        </span>
        {title}
        <span className="text-[10px] text-cyan-100/70">▼</span>
      </summary>
      <div className="absolute left-0 top-full z-30 mt-2 w-[340px] max-w-[85vw] rounded-[10px] border border-[var(--retro-border-strong)] bg-[linear-gradient(180deg,rgba(6,10,20,0.98),rgba(6,12,24,0.94))] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1">
          {effectiveSlots.map((slot, index) => (
            <div key={index} className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] p-2">
              <div className="mb-1 text-[11px] font-semibold text-[color:var(--retro-text)]">
                {slotName ? slotName(index) : `슬롯 ${index + 1}`}
              </div>
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
