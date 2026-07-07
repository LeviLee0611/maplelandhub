"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/Panel";
import { NumberField } from "@/components/NumberField";
import type { CubeIndexData } from "@/types/cube";
import { rollCubeLines } from "@/lib/calculators/cubeSimulator";
import type { ResolvedCubeLine } from "@/types/cube";

type CubeType = "suspicious" | "miracle";

const CUBE_LABEL: Record<CubeType, string> = {
  suspicious: "수상한 큐브",
  miracle: "미라클 큐브",
};

const GRADE_LABEL = ["일반", "레어", "에픽", "유니크", "레전드리"];

function gradeClassName(grade: number) {
  if (grade >= 3) {
    return "border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] text-[color:var(--brand-accent-text)]";
  }
  if (grade === 2) {
    return "border-[var(--brand-accent-2-border)] bg-[var(--brand-accent-2-soft)] text-[color:var(--brand-accent-2-text)]";
  }
  return "border-[var(--retro-border)] bg-[var(--retro-cell)] text-[color:var(--retro-text-muted)]";
}

type CubeSimulatorProps = {
  cubeData: CubeIndexData;
};

export function CubeSimulator({ cubeData }: CubeSimulatorProps) {
  const [cubeType, setCubeType] = useState<CubeType>("suspicious");
  const [itemLevel, setItemLevel] = useState(70);
  const [result, setResult] = useState<ResolvedCubeLine[] | null>(null);
  const [history, setHistory] = useState<{ id: number; lines: ResolvedCubeLine[] }[]>([]);

  const pool = useMemo(
    () => (cubeType === "suspicious" ? cubeData.suspicious : cubeData.miracle),
    [cubeType, cubeData],
  );

  function handleRoll() {
    const lines = rollCubeLines(pool, itemLevel, 3);
    setResult(lines);
    setHistory((prev) => [{ id: Date.now(), lines }, ...prev].slice(0, 5));
  }

  return (
    <section className="retro-glass space-y-6 text-[color:var(--retro-text)]">
      <div className="glass-panel rounded-2xl px-4 py-6 md:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">큐브 시뮬레이터</h1>
          <p className="text-sm text-slate-300">
            메이플 플래닛 공식 홈페이지에 공개된 잠재능력 확률 풀을 기준으로 수상한 큐브 / 미라클 큐브 사용 결과를 시뮬레이션합니다.
          </p>
          <p className="text-xs text-amber-200/90">
            옵션 종류 선택 확률(가중치)은 공식 데이터를 그대로 사용하지만, 옵션 안에서의 수치 등급(1~20단계) 선택은 균등 분포로 단순화했습니다 — 실제 서버와 세부 확률이 다를 수 있습니다.
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Panel title="설정" tone="blue">
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-1 rounded-full border border-[var(--retro-border)] bg-[var(--retro-cell)] p-1">
                  {(Object.keys(CUBE_LABEL) as CubeType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setCubeType(type);
                        setResult(null);
                      }}
                      className={`rounded-full px-2 py-1.5 text-center text-xs font-semibold transition ${
                        cubeType === type
                          ? "bg-[var(--brand-accent-soft)] text-[color:var(--brand-accent-text)]"
                          : "text-[color:var(--retro-text-muted)] hover:bg-white/10"
                      }`}
                    >
                      {CUBE_LABEL[type]}
                    </button>
                  ))}
                </div>

                <NumberField
                  id="cube-item-level"
                  label="아이템 착용 레벨"
                  value={itemLevel}
                  onChange={setItemLevel}
                  min={0}
                  max={200}
                  helper="레벨 제한이 있는 옵션(하이퍼 바디 등)은 착용 레벨 이상일 때만 등장합니다."
                />

                <button
                  type="button"
                  onClick={handleRoll}
                  className="w-full rounded-[8px] border border-[var(--brand-accent)] bg-[var(--brand-accent-soft)] px-3 py-2.5 text-sm font-semibold text-[color:var(--brand-accent-text)] transition hover:brightness-110"
                >
                  {CUBE_LABEL[cubeType]} 사용하기
                </button>
              </div>
            </Panel>

            {history.length > 0 ? (
              <Panel title="최근 결과" tone="yellow">
                <div className="space-y-2 text-xs">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[8px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-3 py-2"
                    >
                      {entry.lines.map((line, index) => (
                        <div key={index} className="text-[color:var(--retro-text-muted)]">
                          {line.text}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}
          </div>

          <Panel title="결과" tone="green">
            {result ? (
              <div className="space-y-2">
                {result.map((line, index) => (
                  <div
                    key={index}
                    className={`rounded-[10px] border px-3 py-2.5 text-sm font-semibold ${gradeClassName(line.grade)}`}
                  >
                    <div className="text-[10px] font-normal opacity-80">{GRADE_LABEL[line.grade] ?? `등급 ${line.grade}`}</div>
                    {line.text}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[color:var(--retro-text-muted)]">
                왼쪽에서 큐브 종류와 아이템 레벨을 설정하고 사용하기를 눌러주세요.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </section>
  );
}
