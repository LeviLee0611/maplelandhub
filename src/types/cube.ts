export type CubeOptionEntry = {
  id: number;
  grade: number;
  weight: number;
  optionType: number;
  reqLevel: number;
  text: string;
  level: Record<string, Record<string, number>>;
};

export type CubeIndexData = {
  generatedAt: string;
  source: string;
  capturedAt: string | null;
  suspicious: CubeOptionEntry[];
  miracle: CubeOptionEntry[];
};

export type ResolvedCubeLine = {
  text: string;
  grade: number;
  optionType: number;
  entryId: number;
};

export type CubeVariant = "suspicious" | "miracle";

export type CubeRollResult = {
  overallGrade: number;
  lines: ResolvedCubeLine[];
};
