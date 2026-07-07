import type { CubeOptionEntry, ResolvedCubeLine } from "@/types/cube";

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

function resolveText(entry: CubeOptionEntry, levelKey: string): string {
  const values = entry.level[levelKey] ?? {};
  return entry.text.replace(/#(\w+)/g, (match, varName: string) => {
    const value = values[varName];
    return typeof value === "number" ? String(value) : match;
  });
}

export function rollCubeLine(pool: CubeOptionEntry[], itemLevel: number): ResolvedCubeLine | null {
  const eligible = pool.filter((entry) => entry.reqLevel <= itemLevel);
  const picked = pickWeighted(eligible.length > 0 ? eligible : pool);
  if (!picked) return null;

  const levelKeys = Object.keys(picked.level);
  const levelKey = levelKeys.length > 0 ? levelKeys[Math.floor(Math.random() * levelKeys.length)] : "1";

  return {
    text: resolveText(picked, levelKey),
    grade: picked.grade,
    optionType: picked.optionType,
  };
}

export function rollCubeLines(pool: CubeOptionEntry[], itemLevel: number, lineCount = 3): ResolvedCubeLine[] {
  const lines: ResolvedCubeLine[] = [];
  for (let i = 0; i < lineCount; i += 1) {
    const line = rollCubeLine(pool, itemLevel);
    if (line) lines.push(line);
  }
  return lines;
}
