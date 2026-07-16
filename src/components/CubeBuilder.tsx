"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { NumberField } from "@/components/NumberField";
import { GradeOptionPicker, type OptionGroup } from "@/components/GradeOptionPicker";
import { QuickSlots } from "@/components/quick-slots";
import { formatCount, formatProbability, gradeMeta } from "@/lib/cube-ui";
import { eligiblePoolAtGrade, resolveOptionText } from "@/lib/calculators/cubeSimulator";
import { computeSlotValue, simulateSlotOutcome } from "@/lib/calculators/cubeBuilder";
import { CUBE_BUILDER_EQUIP_SLOTS } from "@/types/cubeBuilder";
import type { CubeIndexData, CubeVariant } from "@/types/cube";
import type {
  CubeBuilderCharacter,
  CubeBuilderEquipSlotKey,
  CubeBuilderEquipmentSlot,
  CubeBuilderJobGroup,
  CubeBuilderSlotOutcome,
} from "@/types/cubeBuilder";

const JOB_GROUPS: CubeBuilderJobGroup[] = ["전사", "마법사", "궁수", "도적"];

const CUBE_LABEL: Record<CubeVariant, string> = {
  suspicious: "수상한 큐브",
  miracle: "미라클 큐브",
};

// 트라이얼 수는 정확도와 입력할 때마다 즉시 재계산되는 UI 반응성 사이의 절충치.
const SIMULATION_TRIALS = 1500;

function defaultCharacter(): CubeBuilderCharacter {
  return {
    jobGroup: "전사",
    str: 500,
    dex: 120,
    int: 20,
    luk: 50,
    attack: 200,
    mastery: 0.6,
    criticalRate: 0,
    criticalDamage: 0,
    bossDamageEnabled: false,
    bossDamagePercent: 0,
    totalDamagePercent: 0,
    ignoreDefensePercent: 0,
    monsterDefense: 0,
  };
}

function emptySlot(slotKey: CubeBuilderEquipSlotKey): CubeBuilderEquipmentSlot {
  return { slotKey, grade: 0, potentialIds: [null, null, null] };
}

type BuilderSnapshot = {
  character: CubeBuilderCharacter;
  itemLevel: number;
  cubeType: CubeVariant;
  slots: CubeBuilderEquipmentSlot[];
};

type CubeBuilderProps = {
  cubeData: CubeIndexData;
};

export function CubeBuilder({ cubeData }: CubeBuilderProps) {
  const [character, setCharacter] = useState<CubeBuilderCharacter>(defaultCharacter());
  const [itemLevel, setItemLevel] = useState(150);
  const [cubeType, setCubeType] = useState<CubeVariant>("suspicious");
  const [slots, setSlots] = useState<CubeBuilderEquipmentSlot[]>([]);
  const [expandedSlot, setExpandedSlot] = useState<CubeBuilderEquipSlotKey | null>(null);

  const pool = cubeType === "suspicious" ? cubeData.suspicious : cubeData.miracle;
  const isMagic = character.jobGroup === "마법사";

  const groupedOptions = useMemo<OptionGroup[]>(() => {
    return [4, 3, 2, 1, 0]
      .map((grade) => ({
        grade,
        options: eligiblePoolAtGrade(pool, itemLevel, grade)
          .map((entry) => ({ id: entry.id, label: resolveOptionText(entry, itemLevel) }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .filter((group) => group.options.length > 0);
  }, [pool, itemLevel]);

  // 슬롯마다 몬테카를로 1500회를 도는 무거운 계산이라, 스탯 입력칸에 한 글자 칠 때마다(슬롯이 여러 개면
  // 특히) 즉시 재계산하면 눈에 띄게 버벅일 수 있음 — 입력이 잠깐 멈춘 뒤에만 재계산(다른 계산기의 GA 이벤트
  // 디바운스와 동일한 절충 패턴).
  type Outcome = { slot: CubeBuilderEquipmentSlot; currentValue: number; outcome: CubeBuilderSlotOutcome };
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setOutcomes(
        slots.map((slot) => ({
          slot,
          currentValue: computeSlotValue(character, slot, pool, itemLevel),
          outcome: simulateSlotOutcome(character, slot, pool, cubeType, itemLevel, SIMULATION_TRIALS),
        })),
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [slots, character, pool, itemLevel, cubeType]);

  // 빈 슬롯(잠재 미입력)도 추천 후보에 포함한다 — 오히려 빈 슬롯이 가장 먼저 돌려야 할 부위인 경우가 많다.
  const recommended = useMemo(() => {
    if (outcomes.length === 0) return null;
    return [...outcomes].sort((a, b) => a.outcome.avgCubesPerHalfPercent - b.outcome.avgCubesPerHalfPercent)[0];
  }, [outcomes]);

  function toggleSlot(slotKey: CubeBuilderEquipSlotKey) {
    const existing = slots.find((s) => s.slotKey === slotKey);
    if (existing) {
      setExpandedSlot((prev) => (prev === slotKey ? null : slotKey));
      return;
    }
    setSlots((prev) => [...prev, emptySlot(slotKey)]);
    setExpandedSlot(slotKey);
  }

  function removeSlot(slotKey: CubeBuilderEquipSlotKey) {
    setSlots((prev) => prev.filter((s) => s.slotKey !== slotKey));
    setExpandedSlot((prev) => (prev === slotKey ? null : prev));
  }

  function updateSlotLine(slotKey: CubeBuilderEquipSlotKey, lineIndex: 0 | 1 | 2, id: number | null) {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.slotKey !== slotKey) return s;
        const nextIds = [...s.potentialIds] as [number | null, number | null, number | null];
        nextIds[lineIndex] = id;
        const entries = nextIds.map((optionId) => pool.find((entry) => entry.id === optionId));
        const grade = Math.max(0, ...entries.filter((e): e is NonNullable<typeof e> => !!e).map((e) => e.grade));
        return { ...s, potentialIds: nextIds, grade };
      }),
    );
  }

  const snapshot: BuilderSnapshot = { character, itemLevel, cubeType, slots };

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">큐브 빌더</h1>
          <p className="text-sm text-slate-300">
            내 캐릭터 스탯과 장착 중인 잠재능력을 입력하면, 어느 부위를 큐브 돌리는 게 가장 효율적인지 알려줍니다.
          </p>
          <p className="text-xs text-amber-200/90">
            데미지 공식은 빅뱅 직전 메이플 표준을 따르고, 방어력은 절대값 기준(방어율% 아님)입니다. 몬스터 방어력을 모르면
            0(파밍 기준)으로 두세요.
          </p>
          <p className="text-xs text-amber-200/90">
            캐릭터 스탯은 인게임 캐릭터 정보창에 보이는 <strong>현재 총합 값 그대로</strong> 입력하세요(지금 낀 장비/잠재
            효과 이미 포함된 값). 각 슬롯의 가치를 계산할 때 그 슬롯이 기여한 만큼을 자동으로 빼고 비교하니 별도로 뺄 필요는
            없습니다.
          </p>
          <a
            href="/planet/cube-simulator"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-accent-text)] hover:underline"
          >
            직접 큐브를 굴려보려면 → 큐브 시뮬레이터
          </a>
        </header>

        <div className="mt-4">
          <QuickSlots
            storageKey="mlh-quickslots-cubebuilder-v1"
            getSnapshot={() => snapshot}
            applySnapshot={(data: BuilderSnapshot) => {
              if (data.character) setCharacter(data.character);
              if (typeof data.itemLevel === "number") setItemLevel(data.itemLevel);
              if (data.cubeType) setCubeType(data.cubeType);
              if (Array.isArray(data.slots)) setSlots(data.slots);
              // 복원된 슬롯 목록에 지금 펼쳐져 있던 슬롯이 없을 수 있어(다른 스냅샷) 편집 패널을 닫아둔다.
              setExpandedSlot(null);
            }}
            title="빠른 저장 (큐브 빌더)"
            preview={(data) => `${data.character.jobGroup} · 슬롯 ${data.slots.length}개`}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Panel title="캐릭터 정보" tone="blue">
              <div className="space-y-3 text-xs">
                <label className="space-y-1">
                  <span className="retro-chip">직업군</span>
                  <select
                    className="w-full rounded-[6px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1.5 text-xs text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none"
                    value={character.jobGroup}
                    onChange={(event) => setCharacter({ ...character, jobGroup: event.target.value as CubeBuilderJobGroup })}
                  >
                    {JOB_GROUPS.map((job) => (
                      <option key={job} value={job}>
                        {job}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <NumberField id="cp-str" label="STR" value={character.str} min={0} onChange={(v) => setCharacter({ ...character, str: v })} />
                  <NumberField id="cp-dex" label="DEX" value={character.dex} min={0} onChange={(v) => setCharacter({ ...character, dex: v })} />
                  <NumberField id="cp-int" label="INT" value={character.int} min={0} onChange={(v) => setCharacter({ ...character, int: v })} />
                  <NumberField id="cp-luk" label="LUK" value={character.luk} min={0} onChange={(v) => setCharacter({ ...character, luk: v })} />
                </div>

                <NumberField
                  id="cp-attack"
                  label={isMagic ? "마력 (S창 표시된 값 그대로)" : "공격력 (무기+장갑 합)"}
                  value={character.attack}
                  min={0}
                  onChange={(v) => setCharacter({ ...character, attack: v })}
                />

                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    id="cp-mastery"
                    label="마스터리 (%)"
                    value={Math.round(character.mastery * 100)}
                    min={0}
                    max={100}
                    onChange={(v) => setCharacter({ ...character, mastery: v / 100 })}
                  />
                  <NumberField
                    id="cp-item-level"
                    label="장비 착용 레벨"
                    value={itemLevel}
                    min={0}
                    max={200}
                    onChange={setItemLevel}
                  />
                </div>

                <div className="retro-subsection space-y-2">
                  <div className="retro-section-title">크리티컬 (궁수/도적류만 해당하면 입력)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      id="cp-crit-rate"
                      label="크리티컬 확률 (%)"
                      value={character.criticalRate}
                      min={0}
                      max={100}
                      onChange={(v) => setCharacter({ ...character, criticalRate: v })}
                    />
                    <NumberField
                      id="cp-crit-dmg"
                      label="크리티컬 데미지 (%)"
                      value={character.criticalDamage}
                      min={0}
                      onChange={(v) => setCharacter({ ...character, criticalDamage: v })}
                    />
                  </div>
                </div>

                <div className="retro-subsection space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="retro-section-title">보스 데미지 적용</div>
                    <button
                      type="button"
                      onClick={() => setCharacter({ ...character, bossDamageEnabled: !character.bossDamageEnabled })}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        character.bossDamageEnabled
                          ? "border-[var(--brand-accent)] bg-[var(--brand-accent-soft)] text-[color:var(--brand-accent-text)]"
                          : "border-[var(--retro-border)] text-[color:var(--retro-text-muted)]"
                      }`}
                    >
                      {character.bossDamageEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                  <p className="text-[10px] text-[color:var(--retro-text-muted)]">
                    보스 사냥이면 ON, 잡몹/파밍 사냥이면 OFF — OFF면 보스뎀% 옵션은 가치 계산에서 제외됩니다.
                  </p>
                  {character.bossDamageEnabled ? (
                    <NumberField
                      id="cp-boss-dmg"
                      label="현재 보스 데미지 (%)"
                      value={character.bossDamagePercent}
                      min={0}
                      onChange={(v) => setCharacter({ ...character, bossDamagePercent: v })}
                    />
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    id="cp-total-dmg"
                    label="총 데미지 (%, 선택)"
                    value={character.totalDamagePercent}
                    min={0}
                    onChange={(v) => setCharacter({ ...character, totalDamagePercent: v })}
                  />
                  <NumberField
                    id="cp-ignore-def"
                    label="방어율 무시 (%, 선택)"
                    value={character.ignoreDefensePercent}
                    min={0}
                    max={100}
                    onChange={(v) => setCharacter({ ...character, ignoreDefensePercent: v })}
                  />
                </div>

                <NumberField
                  id="cp-monster-def"
                  label="기준 몬스터 방어력 (절대값, 모르면 0)"
                  value={character.monsterDefense}
                  min={0}
                  onChange={(v) => setCharacter({ ...character, monsterDefense: v })}
                />
              </div>
            </Panel>

            <Panel title="큐브 종류" tone="yellow">
              <div className="flex gap-1 rounded-full border border-[var(--retro-border)] bg-[var(--retro-cell)] p-1 text-xs">
                {(Object.keys(CUBE_LABEL) as CubeVariant[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (type === cubeType) return;
                      setCubeType(type);
                      // 두 큐브 옵션 풀은 id를 상당수 공유하지만 완전히 같지는 않음(수상한 전용 옵션 존재) —
                      // 다른 풀에서 같은 id가 다른 옵션을 가리킬 위험을 없애기 위해 선택된 잠재를 초기화한다
                      // (CubeSimulator.tsx의 장비 종류 필터 전환 시 선택 초기화와 동일한 패턴).
                      setSlots((prev) => prev.map((slot) => ({ ...slot, grade: 0, potentialIds: [null, null, null] })));
                    }}
                    className={`flex-1 rounded-full px-2 py-1.5 font-semibold transition ${
                      cubeType === type
                        ? "bg-[var(--brand-accent-soft)] text-[color:var(--brand-accent-text)]"
                        : "text-[color:var(--retro-text-muted)] hover:bg-white/10"
                    }`}
                  >
                    {CUBE_LABEL[type]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-[color:var(--retro-text-muted)]">
                큐브 종류를 바꾸면 슬롯에 골라둔 잠재능력이 초기화됩니다(두 큐브의 옵션 구성이 완전히 같지 않아서요).
              </p>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="장비별 분석" tone="blue" actions={<span>빈 칸 클릭으로 추가</span>}>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {CUBE_BUILDER_EQUIP_SLOTS.map((slotKey) => {
                  const active = slots.find((s) => s.slotKey === slotKey);
                  const isExpanded = expandedSlot === slotKey;
                  return (
                    <button
                      key={slotKey}
                      type="button"
                      onClick={() => toggleSlot(slotKey)}
                      className={`flex flex-col items-center gap-1 rounded-[10px] border-2 px-1 py-2 text-center transition ${
                        isExpanded
                          ? "border-[var(--brand-accent)] bg-[var(--brand-accent-soft)]"
                          : active
                            ? "border-[var(--brand-accent-border)] bg-[var(--retro-cell-strong)]"
                            : "border-dashed border-[var(--retro-border)] bg-[var(--retro-cell)] hover:border-[var(--retro-border-strong)]"
                      }`}
                    >
                      <span className="text-[11px] font-semibold">{slotKey}</span>
                      {active ? (
                        <span className="text-[9px] text-[color:var(--retro-text-muted)]">
                          {active.potentialIds.filter((id) => id !== null).length}/3줄
                        </span>
                      ) : (
                        <span className="text-[9px] text-[color:var(--retro-text-muted)]">+ 추가</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {expandedSlot ? (
                <div className="mt-4 space-y-2 rounded-[10px] border border-[var(--brand-accent-border)] bg-[var(--retro-cell)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{expandedSlot} 잠재능력</span>
                    <button
                      type="button"
                      onClick={() => removeSlot(expandedSlot)}
                      className="text-[11px] font-semibold text-[color:var(--retro-text-muted)] hover:text-red-300"
                    >
                      슬롯 삭제
                    </button>
                  </div>
                  {[0, 1, 2].map((lineIndex) => {
                    const activeSlot = slots.find((s) => s.slotKey === expandedSlot);
                    return (
                      <div key={lineIndex}>
                        <div className="mb-1 text-[10px] font-semibold text-[color:var(--retro-text-muted)]">
                          {lineIndex + 1}번째 줄
                        </div>
                        <GradeOptionPicker
                          placeholder="옵션 없음"
                          groups={groupedOptions}
                          value={activeSlot?.potentialIds[lineIndex as 0 | 1 | 2] ?? null}
                          onChange={(id) => updateSlotLine(expandedSlot, lineIndex as 0 | 1 | 2, id)}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-[color:var(--retro-text-muted)]">
                  현재 착용 중인 장비의 잠재능력을 슬롯별로 입력하면, 부위별로 어느 슬롯을 먼저 돌려야 효율적인지 계산합니다.
                  분석하고 싶은 부위만 추가하면 됩니다.
                </p>
              )}
            </Panel>

            <Panel title="결과" tone="green">
              {outcomes.length === 0 ? (
                <p className="text-sm text-[color:var(--retro-text-muted)]">
                  위에서 장비 슬롯을 추가하고 잠재능력을 입력하면 부위별 가성비가 여기 표시됩니다.
                </p>
              ) : (
                <div className="space-y-3 text-xs">
                  {recommended ? (
                    <div className="rounded-[10px] border-2 border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-3 py-3">
                      <div className="text-[10px] font-semibold text-[color:var(--brand-accent-text)]">
                        지금 큐브를 돌린다면
                      </div>
                      <div className="text-lg font-extrabold text-[color:var(--brand-accent-text)]">
                        {recommended.slot.slotKey}
                      </div>
                      <div className="mt-1 text-[11px] text-[color:var(--retro-text-muted)]">
                        좋아질 확률 {formatProbability(recommended.outcome.upgradeChance)} · +0.5% 스펙당 평균{" "}
                        {formatCount(recommended.outcome.avgCubesPerHalfPercent)}개
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    {[...outcomes]
                      .sort((a, b) => a.outcome.avgCubesPerHalfPercent - b.outcome.avgCubesPerHalfPercent)
                      .map(({ slot, currentValue, outcome }) => (
                        <div
                          key={slot.slotKey}
                          className="flex items-center justify-between gap-2 rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{slot.slotKey}</span>
                              <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${gradeMeta(slot.grade).chip}`}>
                                {gradeMeta(slot.grade).label}
                              </span>
                            </div>
                            <div className="text-[10px] text-[color:var(--retro-text-muted)]">
                              현재 가치 {currentValue >= 0 ? "+" : ""}
                              {currentValue.toFixed(2)}%
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-semibold">{formatProbability(outcome.upgradeChance)}</div>
                            <div className="text-[10px] text-[color:var(--retro-text-muted)]">
                              평균 {formatCount(outcome.avgCubesPerHalfPercent)}개/0.5%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <p className="text-[10px] text-[color:var(--retro-text-muted)]">
                    &ldquo;가치&rdquo;는 스탯/공격력/보스뎀/총뎀/크리티컬/방어율무시 옵션만 반영한 근사 스펙 증가율입니다.
                    스킬 재사용, 이동속도, 방어력 등은 데미지와 무관해 계산에서 제외됩니다(
                    {SIMULATION_TRIALS.toLocaleString()}회 시뮬 기준).
                  </p>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
