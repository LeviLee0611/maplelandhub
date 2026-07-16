"use client";

import { useState } from "react";
import { gradeMeta } from "@/lib/cube-ui";

export type OptionGroup = { grade: number; options: { id: number; label: string }[] };

// 등급을 먼저 고르고, 그 등급 안의 옵션만 두 번째 드롭다운에 보여준다 — 등급 상관없이 185개 안팎을 한 목록에
// 다 넣으면 너무 길어지는 문제를 등급으로 먼저 좁혀서 해결. 큐브 시뮬레이터/큐브 빌더 공용.
export function GradeOptionPicker({
  placeholder,
  groups,
  value,
  onChange,
}: {
  placeholder: string;
  groups: OptionGroup[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const valueGrade = groups.find((group) => group.options.some((option) => option.id === value))?.grade ?? null;
  const activeGrade = value !== null ? valueGrade : gradeFilter;
  const currentGroup = groups.find((group) => group.grade === activeGrade) ?? null;

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <select
        value={activeGrade ?? ""}
        onChange={(event) => {
          setGradeFilter(event.target.value ? Number(event.target.value) : null);
          onChange(null);
        }}
        className="rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)]"
      >
        <option value="">등급 선택</option>
        {groups.map((group) => (
          <option key={group.grade} value={group.grade}>
            {gradeMeta(group.grade).label}
          </option>
        ))}
      </select>

      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        disabled={!currentGroup}
        className={`rounded-[6px] border px-2 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${
          value !== null && activeGrade !== null
            ? gradeMeta(activeGrade).chip
            : "border-[var(--retro-border)] bg-[var(--retro-cell)] text-[color:var(--retro-text)]"
        }`}
      >
        <option value="">{currentGroup ? placeholder : "등급을 먼저 선택"}</option>
        {(currentGroup?.options ?? []).map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
