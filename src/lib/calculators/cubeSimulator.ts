import type { CubeOptionEntry, CubeRollResult, CubeVariant, ResolvedCubeLine } from "@/types/cube";

// 장비 종류별 스킬 옵션("<쓸만한 OO> 스킬 사용 가능") 제한 — cube-data.js 안에서 같은 optionType을 공유하는
// 쌍(유니크 등급 이름 / 레전드리 등급 이름)으로 확인: 51=모자(미스틱 도어/어드밴스드 블레스),
// 53=상의·하의·전신 갑옷(하이퍼 바디), 54=장갑(샤프 아이즈/윈드 부스터), 55=신발(헤이스트/컴뱃 오더스).
// 스탯/공격력류 옵션은 optionType이 다르므로 장비 종류와 무관하게 항상 노출된다.
// 큐브 시뮬레이터/큐브 빌더 양쪽에서 공유하는 도메인 로직이라 이 lib 파일에 둔다.
export type EquipCategory = "hat" | "top" | "glove" | "shoes" | "other";

export const EQUIP_CATEGORY_LABEL: Record<EquipCategory, string> = {
  hat: "모자",
  top: "상의/하의/전신 갑옷",
  glove: "장갑",
  shoes: "신발",
  other: "기타 (무기·방패·망토·장신구 등 — 스킬 옵션 없음)",
};

const SKILL_OPTION_TYPE_BY_EQUIP: Partial<Record<EquipCategory, number>> = {
  hat: 51,
  top: 53,
  glove: 54,
  shoes: 55,
};

const ALL_SKILL_OPTION_TYPES = new Set(Object.values(SKILL_OPTION_TYPE_BY_EQUIP));

export function isOptionAllowedForEquip(entry: CubeOptionEntry, equipCategory: EquipCategory | null): boolean {
  if (equipCategory === null) return true; // 필터 없음 — 전체 표시
  if (!ALL_SKILL_OPTION_TYPES.has(entry.optionType)) return true; // 스킬 옵션이 아니면 부위 무관하게 항상 노출
  return entry.optionType === SKILL_OPTION_TYPE_BY_EQUIP[equipCategory];
}

// 2026-07-08, mapleplanet.co.kr/Cube 공식 페이지를 직접 열어 브라우저 JS로 확인함 —
// 수상한 큐브/미라클 큐브 두 종류의 확률표가 완전히 동일함(사이트의 큐브 탭 전환 UI가 표시만 안 바뀌는
// 버그가 있어서 내부 상태(activeCube)를 강제로 바꿔가며 재확인, 두 번 다 같은 수치 확인).
//   - 등급 상승 확률표: 레어 -> 에픽 6.0000%, 에픽 -> 유니크 1.8000%
//   - 옵션 등급 설정 확률: 1번째 옵션은 표기 등급과 동일 100%, 2번째 옵션은 표기 등급 유지 10%(아니면 한 단계 하락),
//     3번째 옵션은 표기 등급 유지 1%(아니면 한 단계 하락)
// 공식 페이지의 확률표는 유니크까지만 표기하고 레전드리 단계가 없음(사이트 전역 JS의 gradeLabel 객체에도 레전드리가
// 없고, 페이지 전체에 "레전드리" 문자열 자체가 없음). 하지만 cube-data.js 원본 풀에 grade:4(레전드리로 추정) 옵션이
// 실제로 존재하고(수상한 56개/미라클 44개), 레전드리 등장을 직접 경험했다는 사용자 확인에 따라 유니크->레전드리
// 단계를 유지하기로 함.
// rareToEpic(6.0%)/epicToUnique(1.8%)는 넥슨 공식 "레드 큐브" 확률표(maplestory.nexon.com/Guide/OtherProbability/cube/red)와
// 소수점까지 정확히 일치 — 메이플플래닛이 레드 큐브의 등급 상승표를 그대로 가져다 쓴 것으로 보임. 따라서 레드 큐브의
// 공식 유니크->레전드리 확률(0.3%)을 그대로 적용(임의 추정한 감소 비율 계산보다 훨씬 근거 있음).
const GRADE_UP_CHANCE = {
  rareToEpic: 0.06,
  epicToUnique: 0.018,
  uniqueToLegendary: 0.003, // 레드 큐브 공식 확률(0.3%) — 메이플플래닛 자체 공식 확인은 아님
};

// 2번째/3번째 옵션이 한 단계 낮은 등급으로 떨어지지 않고 표기 등급 그대로 나올 확률("이탈").
// 공식 확인: 수상한 큐브와 미라클 큐브가 완전히 동일한 수치를 사용함.
const DEVIATION_CHANCE: Record<CubeVariant, { second: number; third: number }> = {
  suspicious: { second: 0.1, third: 0.01 },
  miracle: { second: 0.1, third: 0.01 },
};

function pickWeighted(pool: CubeOptionEntry[]): CubeOptionEntry | null {
  if (pool.length === 0) return null;
  const totalWeight = pool.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (totalWeight <= 0) return pool[Math.floor(Math.random() * pool.length)];
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry;
  }
  return pool[pool.length - 1];
}

// 큐브의 "표기 등급"을 정함 — 항상 레어에서 시작해 순차적으로 에픽 -> 유니크 -> 레전드리로 상승을 시도한다
// (풀의 가중치와는 무관 — 공식 페이지의 "등급 상승 확률표"를 그대로 재현).
export function rollOverallGrade(): number {
  let grade = 1; // 레어
  if (Math.random() >= GRADE_UP_CHANCE.rareToEpic) return grade;
  grade = 2; // 에픽
  if (Math.random() >= GRADE_UP_CHANCE.epicToUnique) return grade;
  grade = 3; // 유니크
  if (Math.random() >= GRADE_UP_CHANCE.uniqueToLegendary) return grade;
  return 4; // 레전드리
}

// 옵션 수치는 각 브라켓(1~20)이 아이템 착용 레벨 10구간(1~10, 11~20, ..., 191~200+)에 대응 —
// 무작위가 아니라 착용 레벨로 결정되는 고정값. cube-data.js의 모든 옵션이 정확히 1~20 키를 갖는 것으로 확인됨.
export function levelBracket(itemLevel: number): string {
  const bracket = Math.ceil(itemLevel / 10);
  return String(Math.min(20, Math.max(1, bracket)));
}

function resolveValues(entry: CubeOptionEntry, levelKey: string): Record<string, number> {
  return entry.level[levelKey] ?? entry.level["1"] ?? {};
}

function resolveText(entry: CubeOptionEntry, levelKey: string): string {
  const values = resolveValues(entry, levelKey);
  return entry.text.replace(/#(\w+)/g, (match, varName: string) => {
    const value = values[varName];
    return typeof value === "number" ? String(value) : match;
  });
}

/** 특정 아이템 레벨 기준으로 옵션의 실제 표시 텍스트(수치 포함)를 계산한다 — 옵션 선택 UI 등에서 사용. */
export function resolveOptionText(entry: CubeOptionEntry, itemLevel: number): string {
  return resolveText(entry, levelBracket(itemLevel));
}

/**
 * 특정 아이템 레벨 기준 옵션의 원본 수치(치환 전, `#incSTR` 같은 변수명 -> 숫자)를 반환한다.
 * `resolveOptionText`는 문자열로 치환한 결과만 주기 때문에, 옵션 가치를 계산해야 하는 큐브 빌더처럼
 * 숫자 자체가 필요한 소비자를 위해 별도로 노출.
 */
export function resolveOptionValues(entry: CubeOptionEntry, itemLevel: number): Record<string, number> {
  return resolveValues(entry, levelBracket(itemLevel));
}

// 특정 등급으로 확정된 뒤, 실제로 뽑기 후보가 되는 풀(착용 레벨 미달 옵션 제외, 없으면 등급 전체로 대체).
export function eligiblePoolAtGrade(pool: CubeOptionEntry[], itemLevel: number, grade: number): CubeOptionEntry[] {
  const gradePool = pool.filter((entry) => entry.grade === grade);
  const eligible = gradePool.filter((entry) => entry.reqLevel <= itemLevel);
  return eligible.length > 0 ? eligible : gradePool;
}

// 한 줄이 특정 등급으로 결정됐을 때, 그 줄이 정확히 targetEntry로 뽑힐 확률.
// targetEntry의 등급이 다르거나, 착용 레벨 미달로 후보 풀에서 아예 빠져 있으면 0을 반환한다
// (레벨 미달 옵션은 eligiblePoolAtGrade가 걸러내므로 실제 롤에서는 절대 나올 수 없음).
function lineHitProbability(pool: CubeOptionEntry[], itemLevel: number, lineGrade: number, targetEntry: CubeOptionEntry): number {
  if (targetEntry.grade !== lineGrade) return 0;
  const candidates = eligiblePoolAtGrade(pool, itemLevel, lineGrade);
  if (!candidates.some((entry) => entry.id === targetEntry.id)) return 0;
  const totalWeight = candidates.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  return totalWeight > 0 ? Math.max(0, targetEntry.weight) / totalWeight : 0;
}

function pickLineAtGrade(pool: CubeOptionEntry[], itemLevel: number, grade: number): ResolvedCubeLine | null {
  const candidates = eligiblePoolAtGrade(pool, itemLevel, grade);
  const picked = pickWeighted(candidates.length > 0 ? candidates : pool);
  if (!picked) return null;

  return {
    text: resolveText(picked, levelBracket(itemLevel)),
    grade: picked.grade,
    optionType: picked.optionType,
    entryId: picked.id,
  };
}

// 표기 등급(1~4) 확률 분포 — rollOverallGrade()의 카스케이드 확률을 닫힌 형태로 계산.
function overallGradeDistribution(): Record<number, number> {
  const { rareToEpic, epicToUnique, uniqueToLegendary } = GRADE_UP_CHANCE;
  const pRare = 1 - rareToEpic;
  const pEpic = rareToEpic * (1 - epicToUnique);
  const pUnique = rareToEpic * epicToUnique * (1 - uniqueToLegendary);
  const pLegendary = rareToEpic * epicToUnique * uniqueToLegendary;
  return { 1: pRare, 2: pEpic, 3: pUnique, 4: pLegendary };
}

// fixedOverallGrade가 있으면 그 등급 하나만("등급 고정" 가정), 없으면 전체 상승 카스케이드 분포를 순회한다.
function gradeIterations(fixedOverallGrade?: number): [number, number][] {
  if (fixedOverallGrade !== undefined) return [[fixedOverallGrade, 1]];
  return Object.entries(overallGradeDistribution()).map(([key, prob]) => [Number(key), prob]);
}

// 등급별 다음 단계 상승 확률(레어->에픽, 에픽->유니크, 유니크->레전드리) — mapleplanet 공식 확률표 기준(위 주석 참고).
const GRADE_STEP_UP_CHANCE: Record<number, number> = {
  1: GRADE_UP_CHANCE.rareToEpic,
  2: GRADE_UP_CHANCE.epicToUnique,
  3: GRADE_UP_CHANCE.uniqueToLegendary,
};

/**
 * "등급업" 기댓값 — 이미 fromGrade 등급인 아이템을 toGrade(기본 레전드리)까지 올리는 데
 * 평균 몇 번 더 큐브를 사용해야 하는지. 옵션(잠재능력 종류)과는 무관하게 등급 상승 확률만으로 계산 —
 * 실제 게임에서 "등급업" 확률표가 의미하는 것과 동일(이미 그 등급에 도달한 상태에서 한 단계 더 오를 확률).
 */
export function estimateGradeUpExpectedUses(fromGrade: number, toGrade = 4): number {
  let total = 0;
  for (let grade = Math.max(1, fromGrade); grade < toGrade; grade += 1) {
    const stepChance = GRADE_STEP_UP_CHANCE[grade];
    if (!stepChance || stepChance <= 0) return Infinity;
    total += 1 / stepChance;
  }
  return total;
}

export type OptionOdds = {
  /** 큐브 1회 사용으로 원하는 옵션(3줄 중 하나로)을 얻을 확률(0~1) — "그 옵션 자체가 나올 확률". */
  probabilityPerUse: number;
  /** 기댓값 — 평균적으로 몇 번 사용해야 하는지(1/probabilityPerUse). 확률이 0이면 Infinity. */
  expectedUses: number;
};

type LineGradeChance = { grade: number; prob: number; altGrade: number; altProb: number };

// 표기 등급 og일 때 1/2/3번째 줄 각각의 등급 — rollCubeResult와 동일한 규칙(줄2/3은 og와 동일하거나 한 단계 낮음).
// 1번째 줄은 altProb=0으로 둬서 "대체 등급" 항이 항상 0으로 무력화되게 한다(줄마다 분기 개수를 통일하기 위함).
function lineGradesForOverallGrade(og: number, deviation: { second: number; third: number }): LineGradeChance[] {
  const lowerGrade = Math.max(0, og - 1);
  return [
    { grade: og, prob: 1, altGrade: og, altProb: 0 },
    { grade: og, prob: deviation.second, altGrade: lowerGrade, altProb: 1 - deviation.second },
    { grade: og, prob: deviation.third, altGrade: lowerGrade, altProb: 1 - deviation.third },
  ];
}

/**
 * 특정 옵션(entryId)이 큐브 1회 사용에서 3줄 중 하나로 나올 확률과 기댓값을 계산한다.
 * 실제 반복 시뮬레이션 없이, 표기 등급 분포 x 줄별 등급 확률 x 등급 내 가중치 비율을 조합한 닫힌 형태 계산.
 * `fixedOverallGrade`를 넘기면 등급 상승 카스케이드 없이 그 등급에 이미 도달했다고 가정하고 계산한다
 * ("옵션 재설정만" — 등급업에 필요한 횟수는 `estimateGradeUpExpectedUses`로 별도 계산).
 */
export function estimateOptionOdds(
  pool: CubeOptionEntry[],
  itemLevel: number,
  cubeType: CubeVariant,
  targetEntryId: number,
  fixedOverallGrade?: number,
): OptionOdds | null {
  const target = pool.find((entry) => entry.id === targetEntryId);
  if (!target) return null;

  const deviation = DEVIATION_CHANCE[cubeType];
  let noHitProb = 0;

  for (const [og, ogProb] of gradeIterations(fixedOverallGrade)) {
    if (ogProb <= 0) continue;
    const lines = lineGradesForOverallGrade(og, deviation);

    let noneForThisOg = 1;
    for (const line of lines) {
      const pMain = line.prob * lineHitProbability(pool, itemLevel, line.grade, target);
      const pAlt = line.altProb * lineHitProbability(pool, itemLevel, line.altGrade, target);
      noneForThisOg *= 1 - pMain - pAlt;
    }
    noHitProb += ogProb * noneForThisOg;
  }

  const probabilityPerUse = 1 - noHitProb;
  return {
    probabilityPerUse,
    expectedUses: probabilityPerUse > 0 ? 1 / probabilityPerUse : Infinity,
  };
}

export type CombinedOptionOdds = {
  /** 선택한 옵션 각각의 개별 확률 — 그 옵션을 고른 횟수(N)만큼 줄에 나올 확률(다른 목표와 무관, 단독 기준). entryId -> 확률. */
  perOptionProbability: Map<number, number>;
  /** 선택한 옵션들이 큐브 1회 사용에서 전부 동시에 나올 확률. */
  combinedProbabilityPerUse: number;
  /** 기댓값 — 전부 동시에 나오려면 평균 몇 번 사용해야 하는지. */
  expectedUses: number;
};

// probs 각각을 독립 베르누이 시행으로 보고, 성공 횟수가 k 이상일 확률(전체 부분집합을 brute-force로 합산 — probs가
// 최대 3개뿐이라 2^3=8가지로 충분히 저렴함).
function probabilityAtLeastKSuccesses(probs: number[], k: number): number {
  if (k <= 0) return 1;
  if (k > probs.length) return 0;
  let total = 0;
  for (let mask = 0; mask < 1 << probs.length; mask += 1) {
    let successCount = 0;
    let prob = 1;
    for (let i = 0; i < probs.length; i += 1) {
      const isSuccess = (mask & (1 << i)) !== 0;
      if (isSuccess) successCount += 1;
      prob *= isSuccess ? probs[i] : 1 - probs[i];
    }
    if (successCount >= k) total += prob;
  }
  return total;
}

/**
 * 여러 개(최대 3개, 중복 허용)의 원하는 옵션이 큐브 1회 사용에서 "전부 동시에" 나올 확률과 기댓값을 계산한다.
 * 같은 옵션 id를 두 번 이상 고르면 "그 옵션이 N줄에 걸쳐 나올 확률"로 취급한다(예: 같은 옵션을 슬롯 2개에 고르면
 * 3줄 중 2줄 이상이 그 옵션과 일치할 확률). 줄마다 최대 하나의 옵션만 나올 수 있으므로, 각 줄이 어떤 목표(또는
 * 목표 없음)와 일치했는지의 모든 경우의 수를 직접 나열해 등급 상승 카스케이드의 각 분기마다 합산한다
 * (목표가 최대 3개, 줄도 3개뿐이라 경우의 수가 많지 않아 brute-force로 충분함).
 * `fixedOverallGrade`를 넘기면("이미 그 등급이라고 가정") 등급 상승 확률을 섞지 않고 그 등급 하나만으로 계산한다 —
 * 그렇지 않으면 레전드리처럼 높은 등급 옵션을 여러 개 고를 때 등급업 확률까지 겹쳐져 기댓값이 비현실적으로 커진다.
 */
export function estimateCombinedOptionOdds(
  pool: CubeOptionEntry[],
  itemLevel: number,
  cubeType: CubeVariant,
  targetEntryIds: number[],
  fixedOverallGrade?: number,
): CombinedOptionOdds | null {
  if (targetEntryIds.length === 0 || targetEntryIds.length > 3) return null;
  const targets = targetEntryIds.map((id) => pool.find((entry) => entry.id === id)).filter((e): e is CubeOptionEntry => !!e);
  if (targets.length !== targetEntryIds.length) return null;

  // 중복 선택 지원: 같은 id가 여러 번 나오면 "그 옵션이 몇 줄에 걸쳐 나와야 하는지" 요구 횟수로 취급한다.
  const requiredCountById = new Map<number, number>();
  for (const entry of targets) requiredCountById.set(entry.id, (requiredCountById.get(entry.id) ?? 0) + 1);
  const distinctTargets = [...requiredCountById.keys()].map((id) => targets.find((entry) => entry.id === id)!);
  const requiredCounts = distinctTargets.map((target) => requiredCountById.get(target.id)!);
  const targetCount = distinctTargets.length;

  const deviation = DEVIATION_CHANCE[cubeType];
  const perOptionAtLeastProb = new Array(targetCount).fill(0);
  let combinedProb = 0;

  for (const [og, ogProb] of gradeIterations(fixedOverallGrade)) {
    if (ogProb <= 0) continue;
    const lines = lineGradesForOverallGrade(og, deviation);

    // hitMatrix[lineIndex][targetIndex] = 그 줄이 그 목표 옵션을 뽑을 확률(등급 유지/하락 분기 합산)
    const hitMatrix = lines.map((line) =>
      distinctTargets.map((target) => {
        const pMain = line.prob * lineHitProbability(pool, itemLevel, line.grade, target);
        const pAlt = line.altProb * lineHitProbability(pool, itemLevel, line.altGrade, target);
        return pMain + pAlt;
      }),
    );

    // 개별(marginal) 확률: 다른 목표와 무관하게, 이 옵션 하나만 N줄 이상 나올 확률(줄별 독립 베르누이 시행).
    for (let t = 0; t < targetCount; t += 1) {
      const probsPerLine = hitMatrix.map((row) => row[t]);
      perOptionAtLeastProb[t] += ogProb * probabilityAtLeastKSuccesses(probsPerLine, requiredCounts[t]);
    }

    // 결합 확률: 줄마다 "목표 중 하나(정확히 하나만 가능)와 일치" 또는 "목표 없음"의 모든 조합을 나열해서,
    // 각 목표의 요구 횟수를 동시에 만족하는 조합의 확률만 합산한다.
    const categories = targetCount + 1; // 마지막 인덱스(targetCount)는 "목표 없음"
    const numLines = lines.length;
    const totalCombos = categories ** numLines;
    let coverProbForOg = 0;
    for (let combo = 0; combo < totalCombos; combo += 1) {
      const counts = new Array(targetCount).fill(0);
      let prob = 1;
      let remaining = combo;
      for (let lineIndex = 0; lineIndex < numLines; lineIndex += 1) {
        const category = remaining % categories;
        remaining = Math.floor(remaining / categories);
        if (category < targetCount) {
          counts[category] += 1;
          prob *= hitMatrix[lineIndex][category];
        } else {
          const sumHits = hitMatrix[lineIndex].reduce((sum, p) => sum + p, 0);
          prob *= Math.max(0, 1 - sumHits);
        }
      }
      if (prob <= 0) continue;
      const satisfiesAll = counts.every((count, t) => count >= requiredCounts[t]);
      if (satisfiesAll) coverProbForOg += prob;
    }

    combinedProb += ogProb * coverProbForOg;
  }

  const perOptionProbability = new Map<number, number>();
  distinctTargets.forEach((target, t) => perOptionProbability.set(target.id, perOptionAtLeastProb[t]));

  return {
    perOptionProbability,
    combinedProbabilityPerUse: combinedProb,
    expectedUses: combinedProb > 0 ? 1 / combinedProb : Infinity,
  };
}

/**
 * 큐브 사용 결과 전체(표기 등급 + 3줄)를 계산한다.
 * `fixedOverallGrade`를 넘기면 등급을 랜덤으로 뽑지 않고 그 등급으로 고정한다("등급 고정" 모드용).
 */
export function rollCubeResult(
  pool: CubeOptionEntry[],
  itemLevel: number,
  cubeType: CubeVariant,
  fixedOverallGrade?: number,
): CubeRollResult {
  const overallGrade = fixedOverallGrade ?? rollOverallGrade();
  const lowerGrade = Math.max(0, overallGrade - 1);
  const deviation = DEVIATION_CHANCE[cubeType];

  const canDropTier = overallGrade > 0;
  const line2Grade = canDropTier && Math.random() >= deviation.second ? lowerGrade : overallGrade;
  const line3Grade = canDropTier && Math.random() >= deviation.third ? lowerGrade : overallGrade;

  const lines = [
    pickLineAtGrade(pool, itemLevel, overallGrade),
    pickLineAtGrade(pool, itemLevel, line2Grade),
    pickLineAtGrade(pool, itemLevel, line3Grade),
  ].filter((line): line is ResolvedCubeLine => line !== null);

  return { overallGrade, lines };
}
