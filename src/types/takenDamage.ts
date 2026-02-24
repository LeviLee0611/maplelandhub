export type JobClass = "warrior" | "magician" | "archer" | "thief" | "beginner";

export type BasicStats = {
  STR: number;
  DEX: number;
  INT: number;
  LUK: number;
};

export type SecondaryStats = {
  PDD: number; // physical defense
  MDD: number; // magic defense
};

export type TempStats = {
  PddBonus?: number;
  MddBonus?: number;
  InvinciblePercent?: number; // 0~100
  MesoGuard?: boolean;
  PowerUpPercent?: number; // 120 => 1.2x
};

export type CharacterInput = {
  level: number;
  jobClass: JobClass;
  basicStats: BasicStats;
  secondaryStats: SecondaryStats;
  tempStats?: TempStats;
};

export type MobInput = {
  level: number;
  templatePADamage: number;
  templateMADamage: number;
  tempPADBonus?: number;
  tempMADBonus?: number;
};

export type DamageRange = {
  min: number;
  max: number;
  reduce?: number;
};

export type CalcLimits = {
  MaxPad?: number;
  MaxMad?: number;
  MaxPdd?: number;
  MaxMdd?: number;
  MaxDamage?: number;
};

export type CalcContext = {
  character: CharacterInput;
  mob: MobInput;
  limits?: CalcLimits;
};
