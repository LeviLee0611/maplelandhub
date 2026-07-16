"use client";

/* eslint-disable @next/next/no-img-element -- maplestory.io 아이콘은 외부 동적 이미지라 next/image 최적화 대상이 아님 (DropTable.tsx와 동일 패턴) */

import { useEffect, useMemo, useRef, useState } from "react";
import { NumberField } from "@/components/NumberField";
import { GradeOptionPicker, type OptionGroup } from "@/components/GradeOptionPicker";
import { getItemIconCandidateUrls } from "@/lib/maplestory-io";
import { playCubeImpactSound, playCubeGradeUpSound, playCubeRevealSound } from "@/lib/audio/cubeSfx";
import { GRADE_META, formatCount, formatProbability, gradeMeta } from "@/lib/cube-ui";
import {
  type EquipCategory,
  EQUIP_CATEGORY_LABEL,
  eligiblePoolAtGrade,
  estimateCombinedOptionOdds,
  estimateGradeUpExpectedUses,
  isOptionAllowedForEquip,
  resolveOptionText,
  rollCubeResult,
} from "@/lib/calculators/cubeSimulator";
import type { CubeIndexData, ResolvedCubeLine } from "@/types/cube";

type CubeType = "suspicious" | "miracle";
type Phase = "idle" | "shaking" | "climbing";

const CUBE_LABEL: Record<CubeType, string> = {
  suspicious: "수상한 큐브",
  miracle: "미라클 큐브",
};

// 미라클 큐브는 메소가 아니라 캐시샵(현금) 아이템 — 공식 공지("미라클 큐브 가격 변경 관련 안내",
// mapleplanet.co.kr/board/notice/511)와 maplanet.net 환율 페이지에서 확인한 캐시샵 묶음 판매가(110개 = 45,000메포)
// 기준으로 1개당 캐시 비용을 계산한다. 수상한 큐브는 몬스터 드랍으로도 구할 수 있는 메소 아이템이라 별도 캐시 비용 없음.
const MIRACLE_CUBE_BUNDLE = { count: 110, mepo: 45000 };
const MIRACLE_CUBE_MEPO_PER_CUBE = MIRACLE_CUBE_BUNDLE.mepo / MIRACLE_CUBE_BUNDLE.count;
// 메포->원화는 공식 고정가를 찾지 못해, 커뮤니티에서 통용되는 메소마켓 환율(1,150~1,250메포 ≈ 1,000원)의
// 중간값을 근사치로 사용함 — 실제 캐시샵 정가와 다를 수 있음(잠정치).
const KRW_PER_MEPO_APPROX = 1000 / 1200;

// 실제 메이플스토리 아이템 아이콘(maplestory.io) — 큐브 자체는 서버 공용이라 itemId 고정.
const CUBE_ITEM_ID: Record<CubeType, number> = {
  suspicious: 2710000,
  miracle: 5062000,
};

// 등급 연출의 시작 지점 — 공식 사이트 확인 결과 두 큐브 모두 항상 레어에서 시작해 상승을 시도함.
const CLIMB_BASELINE_GRADE = 1;

const SHAKE_DURATION_MS = 350;
const CLIMB_STEP_MS = 400;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function CubeIcon({ cubeType }: { cubeType: CubeType }) {
  const [iconIndex, setIconIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const candidateUrls = useMemo(() => getItemIconCandidateUrls(CUBE_ITEM_ID[cubeType], 3), [cubeType]);

  if (failed || candidateUrls.length === 0) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-white/20 text-center text-[10px] text-[color:var(--retro-text-muted)]">
        {CUBE_LABEL[cubeType]}
      </div>
    );
  }

  return (
    <img
      src={candidateUrls[Math.min(iconIndex, candidateUrls.length - 1)]}
      alt={CUBE_LABEL[cubeType]}
      className="h-16 w-16 select-none drop-shadow-[0_0_10px_rgba(0,0,0,0.45)]"
      draggable={false}
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

type ResultEntry = { id: number; cubeType: CubeType; lines: ResolvedCubeLine[] };

type CubeSimulatorProps = {
  cubeData: CubeIndexData;
};

export function CubeSimulator({ cubeData }: CubeSimulatorProps) {
  const [itemLevel, setItemLevel] = useState(70);
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeCubeType, setActiveCubeType] = useState<CubeType | null>(null);
  const [climbGrade, setClimbGrade] = useState<number | null>(null);
  const [result, setResult] = useState<ResultEntry | null>(null);
  const [history, setHistory] = useState<ResultEntry[]>([]);
  const [muted, setMuted] = useState(false);
  const [gradeLockEnabled, setGradeLockEnabled] = useState(false);
  const [lockedGrade, setLockedGrade] = useState(4);
  const [oddsCubeType, setOddsCubeType] = useState<CubeType>("suspicious");
  const [oddsTargetIds, setOddsTargetIds] = useState<(number | null)[]>([null, null, null]);
  const [equipFilter, setEquipFilter] = useState<EquipCategory | null>(null);
  const [assumeGradeReached, setAssumeGradeReached] = useState(false);
  const [gradeUpFromGrade, setGradeUpFromGrade] = useState(1);
  const cancelledRef = useRef(false);
  const nextIdRef = useRef(0);

  // 고른 장비 종류에서 실제로 나올 수 없는 스킬 옵션은 풀 자체에서 제외한다 — 확률 계산의 등급 내 가중치
  // 합산(eligiblePoolAtGrade)도 이 풀을 기준으로 하므로, 여기서 걸러야 다른 옵션들의 확률도 정확해진다
  // (다른 부위 전용 스킬 옵션이 애초에 후보가 될 수 없으므로 가중치 총합에서도 빠져야 함).
  const suspiciousPoolForEquip = useMemo(
    () => cubeData.suspicious.filter((entry) => isOptionAllowedForEquip(entry, equipFilter)),
    [cubeData.suspicious, equipFilter],
  );
  const miraclePoolForEquip = useMemo(
    () => cubeData.miracle.filter((entry) => isOptionAllowedForEquip(entry, equipFilter)),
    [cubeData.miracle, equipFilter],
  );

  const oddsPool = oddsCubeType === "suspicious" ? suspiciousPoolForEquip : miraclePoolForEquip;

  // 등급별로 "현재 착용 레벨에서 실제로 뽑힐 수 있는" 옵션만 보여줌(장비 종류 필터는 이미 oddsPool에 적용됨).
  const groupedOddsOptions = useMemo<OptionGroup[]>(() => {
    return [4, 3, 2, 1, 0]
      .map((grade) => ({
        grade,
        options: eligiblePoolAtGrade(oddsPool, itemLevel, grade)
          .map((entry) => ({ id: entry.id, label: resolveOptionText(entry, itemLevel) }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .filter((group) => group.options.length > 0);
  }, [oddsPool, itemLevel]);

  const selectedTargetIds = useMemo(
    () => oddsTargetIds.filter((id): id is number => id !== null),
    [oddsTargetIds],
  );

  // "이미 그 등급에 도달했다고 가정"이 켜져 있으면, 고른 옵션 중 가장 높은 등급으로 표기 등급을 고정한다
  // (등급업 확률을 계산에서 빼고 "그 등급 안에서 옵션만 재설정"하는 비용만 남김).
  const fixedOverallGrade = useMemo(() => {
    if (!assumeGradeReached || selectedTargetIds.length === 0) return undefined;
    const grades = selectedTargetIds.map((id) => oddsPool.find((entry) => entry.id === id)?.grade ?? 0);
    return Math.max(...grades);
  }, [assumeGradeReached, selectedTargetIds, oddsPool]);

  const oddsResult = useMemo(() => {
    if (selectedTargetIds.length === 0) return null;
    return estimateCombinedOptionOdds(oddsPool, itemLevel, oddsCubeType, selectedTargetIds, fixedOverallGrade);
  }, [oddsPool, itemLevel, oddsCubeType, selectedTargetIds, fixedOverallGrade]);

  const gradeUpExpectedUses = estimateGradeUpExpectedUses(gradeUpFromGrade, 4);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  function revealResult(cubeType: CubeType, lines: ResolvedCubeLine[]) {
    nextIdRef.current += 1;
    const entry: ResultEntry = { id: nextIdRef.current, cubeType, lines };
    setResult(entry);
    setHistory((prev) => [entry, ...prev].slice(0, 5));
    setPhase("idle");
    setClimbGrade(null);
    if (!muted) playCubeRevealSound();
  }

  async function handleUseCube(cubeType: CubeType) {
    if (phase !== "idle") return;

    // 직전 결과 옵션 리스트는 지우지 않고 그대로 화면에 둔 채로 다음 결과를 준비 — 화면이 비는 구간 없이 바로 교체.
    setPhase("shaking");
    setActiveCubeType(cubeType);
    setClimbGrade(null);
    if (!muted) playCubeImpactSound();
    await delay(SHAKE_DURATION_MS);
    if (cancelledRef.current) return;

    const basePool = cubeType === "suspicious" ? suspiciousPoolForEquip : miraclePoolForEquip;
    const rolled = rollCubeResult(basePool, itemLevel, cubeType, gradeLockEnabled ? lockedGrade : undefined);

    // 등급 고정 모드이거나, 실제로 등급 상승이 없었던 경우(가장 흔한 케이스) — 사람들은 상승 연출보다
    // 옵션 결과를 빨리 보고 싶어하므로 연출 없이 바로 옵션을 공개한다.
    if (gradeLockEnabled || rolled.overallGrade <= CLIMB_BASELINE_GRADE) {
      revealResult(cubeType, rolled.lines);
      return;
    }

    setPhase("climbing");
    let currentGrade = CLIMB_BASELINE_GRADE;
    setClimbGrade(currentGrade);
    if (!muted) playCubeGradeUpSound(currentGrade);
    await delay(CLIMB_STEP_MS);

    while (!cancelledRef.current && currentGrade < rolled.overallGrade) {
      currentGrade += 1;
      setClimbGrade(currentGrade);
      if (!muted) playCubeGradeUpSound(currentGrade);
      await delay(CLIMB_STEP_MS);
    }
    if (cancelledRef.current) return;

    revealResult(cubeType, rolled.lines);
  }

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-100">큐브 시뮬레이터</h1>
            <p className="text-sm text-slate-300">아래 큐브를 클릭하면 잠재능력이 새로 부여됩니다.</p>
            <a
              href="/planet/cube-builder"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-accent-text)] hover:underline"
            >
              내 캐릭터 스펙 기준으로 어느 부위가 효율적인지 보려면 → 큐브 빌더
            </a>
          </div>
          <div className="flex items-start gap-2">
            <div
              className="flex w-36 shrink-0 flex-col items-center gap-1 rounded-lg border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-center"
              title="잠재능력 옵션과 무관하게, 이미 그 등급인 아이템을 레전드리까지 올리는 데 평균 몇 개가 필요한지만 계산합니다."
            >
              <span className="text-[10px] font-semibold text-[color:var(--retro-text-muted)]">📈 등급업 기댓값</span>
              <div className="flex items-center gap-1">
                <select
                  value={gradeUpFromGrade}
                  onChange={(event) => setGradeUpFromGrade(Number(event.target.value))}
                  className="rounded border border-[var(--retro-border)] bg-black/15 px-1 py-0.5 text-[10px] text-[color:var(--retro-text)]"
                >
                  {[1, 2, 3].map((grade) => (
                    <option key={grade} value={grade}>
                      {gradeMeta(grade).label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[color:var(--retro-text-muted)]">→레전</span>
              </div>
              <span className="text-sm font-extrabold text-[color:var(--brand-accent-text)]">
                약 {formatCount(gradeUpExpectedUses)}개
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMuted((prev) => !prev)}
              aria-label={muted ? "효과음 켜기" : "효과음 끄기"}
              className="shrink-0 rounded-full border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2.5 py-1.5 text-sm hover:bg-white/10"
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </header>

        <div className="mt-6 flex flex-col items-center gap-6">
          <div className="w-full max-w-[220px]">
            <NumberField
              id="cube-item-level"
              label="아이템 착용 레벨"
              value={itemLevel}
              onChange={setItemLevel}
              min={0}
              max={200}
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <label htmlFor="cube-equip-type" className="text-xs font-semibold text-[color:var(--retro-text-muted)]">
              장비 종류
            </label>
            <select
              id="cube-equip-type"
              value={equipFilter ?? ""}
              onChange={(event) => {
                setEquipFilter(event.target.value ? (event.target.value as EquipCategory) : null);
                setOddsTargetIds([null, null, null]);
              }}
              className="rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)]"
            >
              <option value="">전체 (필터 없음)</option>
              {(Object.keys(EQUIP_CATEGORY_LABEL) as EquipCategory[]).map((category) => (
                <option key={category} value={category}>
                  {EQUIP_CATEGORY_LABEL[category]}
                </option>
              ))}
            </select>
            <p className="max-w-xs text-center text-[10px] text-[color:var(--retro-text-muted)]">
              부위별 전용 스킬 옵션(쓸만한 OO)만 걸러져요 — 나머지 스탯 옵션은 부위 무관하게 항상 나올 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[color:var(--retro-text-muted)]">
              <input
                type="checkbox"
                checked={gradeLockEnabled}
                onChange={(event) => setGradeLockEnabled(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
              />
              등급 고정 (등급업 없이 원하는 등급에서 옵션만 재설정)
            </label>
            <div className="flex flex-wrap justify-center gap-1.5">
              {GRADE_META.map((meta, grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setLockedGrade(grade)}
                  className={`rounded-full border-2 px-3 py-1 text-[11px] font-bold transition ${
                    lockedGrade === grade ? meta.solid : meta.chip
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {(Object.keys(CUBE_LABEL) as CubeType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleUseCube(type)}
                disabled={phase !== "idle"}
                className={`group flex flex-col items-center gap-2 rounded-xl border-2 border-[var(--retro-border)] bg-[var(--retro-cell)] px-6 py-5 transition hover:border-[var(--brand-accent)] hover:bg-[var(--brand-accent-soft)] disabled:cursor-not-allowed disabled:opacity-60 ${
                  phase === "shaking" && activeCubeType === type ? "cube-shake" : ""
                }`}
              >
                <CubeIcon cubeType={type} />
                <span className="text-xs font-semibold">{CUBE_LABEL[type]}</span>
                <span className="text-[10px] text-[color:var(--retro-text-muted)] opacity-0 transition group-hover:opacity-100">
                  클릭해서 사용
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex min-h-[130px] w-full max-w-md items-center justify-center">
            {phase === "climbing" && climbGrade !== null ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="cube-flash pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle,var(--brand-accent-soft),transparent_70%)]" />
                <div
                  key={climbGrade}
                  className={`cube-grade-bump rounded-2xl border-2 px-10 py-5 text-2xl font-extrabold tracking-wide shadow-lg ${gradeMeta(climbGrade).chip}`}
                >
                  {gradeMeta(climbGrade).label}
                </div>
              </div>
            ) : null}

            {result && phase !== "climbing" ? (
              <div key={result.id} className="cube-reveal w-full space-y-2.5">
                <div className="text-center text-xs font-semibold text-[color:var(--retro-text-muted)]">
                  {CUBE_LABEL[result.cubeType]} 결과
                </div>
                {result.lines.map((line, index) => {
                  const meta = gradeMeta(line.grade);
                  return (
                    <div key={index} className={`rounded-[10px] border-2 px-4 py-3 shadow-sm ${meta.chip}`}>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.solid}`}>
                        {meta.label}
                      </span>
                      <div className="mt-1.5 text-base font-bold leading-snug">{line.text}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!result && phase !== "climbing" ? (
              <p className="text-center text-sm text-[color:var(--retro-text-muted)]">
                큐브를 클릭해서 사용해보세요.
              </p>
            ) : null}
          </div>

          <p className="text-center text-[10px] text-[color:var(--retro-text-muted)]">
            옵션 종류(가중치)는 공식 데이터, 수치는 착용 레벨 10구간 기준 계산치입니다 — 실제 서버와 약간 다를 수 있습니다.
            {gradeLockEnabled ? " 등급 고정 모드는 실제 서버의 등급업 확률을 재현하지 않고, 선택한 등급의 옵션만 바로 재설정합니다." : ""}
          </p>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] p-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <h2 className="text-sm font-extrabold text-[color:var(--brand-accent-text)]">원하는 옵션 기댓값</h2>
          </div>

          <div className="flex gap-1 rounded-full border border-[var(--retro-border)] bg-[var(--retro-cell)] p-1 text-xs">
            {(Object.keys(CUBE_LABEL) as CubeType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setOddsCubeType(type);
                  setOddsTargetIds([null, null, null]);
                }}
                className={`rounded-full px-2 py-1 font-semibold transition ${
                  oddsCubeType === type
                    ? "bg-[var(--brand-accent-soft)] text-[color:var(--brand-accent-text)]"
                    : "text-[color:var(--retro-text-muted)] hover:bg-white/10"
                }`}
              >
                {CUBE_LABEL[type]}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((slotIndex) => (
              <div key={slotIndex} className="rounded-[10px] border border-[var(--retro-border)] bg-black/10 p-2">
                <div className="mb-1.5 text-[10px] font-semibold text-[color:var(--retro-text-muted)]">
                  옵션 {slotIndex + 1}
                </div>
                <GradeOptionPicker
                  key={`${oddsCubeType}-${equipFilter}-${slotIndex}`}
                  placeholder="옵션 선택 안 함"
                  groups={groupedOddsOptions}
                  value={oddsTargetIds[slotIndex]}
                  onChange={(value) => setOddsTargetIds((prev) => prev.map((id, i) => (i === slotIndex ? value : id)))}
                />
              </div>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[color:var(--retro-text-muted)]">
            <input
              type="checkbox"
              checked={assumeGradeReached}
              onChange={(event) => setAssumeGradeReached(event.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
            />
            이미 그 등급에 도달했다고 가정 (등급업 제외, 옵션 재설정 비용만 계산)
          </label>

          {oddsResult ? (
            <div className="space-y-2">
              {selectedTargetIds.length > 1
                ? [...new Set(selectedTargetIds)].map((id) => {
                    const entry = oddsPool.find((option) => option.id === id);
                    const requiredCount = selectedTargetIds.filter((selectedId) => selectedId === id).length;
                    const p = oddsResult.perOptionProbability.get(id) ?? 0;
                    return (
                      <div key={id} className="flex items-center justify-between gap-2 text-xs text-[color:var(--retro-text-muted)]">
                        <span className="truncate">
                          {entry ? resolveOptionText(entry, itemLevel) : id}
                          {requiredCount > 1 ? ` (${requiredCount}줄)` : ""}
                        </span>
                        <span className="shrink-0 font-semibold">{formatProbability(p)}</span>
                      </div>
                    );
                  })
                : null}

              <div className="flex items-baseline justify-between gap-3 rounded-[8px] bg-black/15 px-3 py-2">
                <span className="text-xs font-semibold text-[color:var(--retro-text-muted)]">
                  {selectedTargetIds.length > 1 ? "전부 동시에 나올 확률" : "확률"}
                </span>
                <span className="text-sm font-bold">{formatProbability(oddsResult.combinedProbabilityPerUse)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 rounded-[8px] border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-3 py-2">
                <span className="text-xs font-semibold text-[color:var(--brand-accent-text)]">평균 몇 개 필요한지</span>
                <span className="text-xl font-extrabold text-[color:var(--brand-accent-text)]">
                  약 {formatCount(oddsResult.expectedUses)}개
                </span>
              </div>
              {oddsCubeType === "miracle" && Number.isFinite(oddsResult.expectedUses) ? (
                <div className="flex items-baseline justify-between gap-3 rounded-[8px] bg-black/15 px-3 py-2">
                  <span
                    className="text-xs font-semibold text-[color:var(--retro-text-muted)]"
                    title="공식 고정 결제가가 아니라 커뮤니티 메소마켓 환율(1,200메포≈1,000원)로 근사 환산한 추정치입니다."
                  >
                    예상 캐시 비용 (추정 환율 기준)
                  </span>
                  <span className="text-sm font-bold">
                    약{" "}
                    {Math.round(
                      oddsResult.expectedUses * MIRACLE_CUBE_MEPO_PER_CUBE * KRW_PER_MEPO_APPROX,
                    ).toLocaleString()}
                    원 (
                    {Math.round(oddsResult.expectedUses * MIRACLE_CUBE_MEPO_PER_CUBE).toLocaleString()}
                    메포)
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] text-[color:var(--retro-text-muted)]">
              등급을 먼저 고르고, 그 안에서 옵션을 최대 3개까지 고르면 각각의 확률과 전부 동시에 나올 확률·평균 몇
              개나 써야 하는지를 계산해서 보여줍니다.
            </p>
          )}
        </div>

        {history.length > 1 ? (
          <div className="mt-5 space-y-1.5 border-t border-[var(--retro-border)] pt-4">
            <div className="text-xs font-semibold text-[color:var(--retro-text-muted)]">최근 기록</div>
            {history.slice(1).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center gap-1.5 rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5"
              >
                <span className="shrink-0 text-[10px] text-[color:var(--retro-text-muted)]">
                  {CUBE_LABEL[entry.cubeType]}
                </span>
                {entry.lines.map((line, index) => (
                  <span
                    key={index}
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${gradeMeta(line.grade).chip}`}
                  >
                    {line.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
