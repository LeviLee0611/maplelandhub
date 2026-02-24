import type { JobClass } from "@/types/takenDamage";

export const STANDARD_PDD: Record<JobClass, Record<number, number>> = {
  warrior: {
    10: 54,
    12: 57,
    15: 83,
    20: 106,
    22: 109,
    25: 129,
    30: 154,
    35: 179,
    40: 203,
    47: 208,
    50: 261,
    55: 267,
    60: 305,
    65: 308,
    70: 359,
    75: 356,
    80: 382,
    85: 388,
    90: 440,
    95: 446,
    100: 494,
  },
  magician: {
    8: 25,
    10: 31,
    13: 40,
    15: 49,
    18: 54,
    20: 56,
    25: 60,
    28: 64,
    30: 75,
    33: 91,
    35: 98,
    40: 99,
    48: 107,
    50: 131,
    55: 134,
    58: 142,
    60: 159,
    65: 162,
    68: 170,
    70: 184,
    75: 190,
    78: 198,
    80: 212,
    85: 218,
    88: 226,
    90: 240,
    95: 246,
    98: 254,
    100: 266,
  },
  archer: {
    10: 32,
    15: 49,
    20: 65,
    25: 80,
    30: 95,
    35: 110,
    40: 125,
    50: 145,
    55: 148,
    60: 177,
    65: 180,
    70: 206,
    75: 212,
    80: 238,
    85: 244,
    90: 270,
    95: 276,
    100: 298,
  },
  thief: {
    10: 42,
    15: 60,
    20: 76,
    22: 85,
    25: 100,
    30: 115,
    32: 116,
    35: 131,
    37: 132,
    40: 147,
    50: 184,
    55: 187,
    60: 220,
    65: 223,
    70: 257,
    75: 263,
    80: 291,
    85: 297,
    90: 325,
    95: 331,
    100: 331,
  },
  beginner: {
    1: 7,
    5: 17,
    8: 19,
  },
};

export function getStandardPDD(jobClass: JobClass, level: number): number {
  const table = STANDARD_PDD[jobClass];
  const levels = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

  let result = levels[0];
  for (const lv of levels) {
    if (lv <= level) result = lv;
    else break;
  }

  return table[result];
}
