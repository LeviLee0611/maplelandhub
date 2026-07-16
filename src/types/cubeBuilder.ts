export type CubeBuilderJobGroup = "전사" | "마법사" | "궁수" | "도적";

export type CubeBuilderCharacter = {
  jobGroup: CubeBuilderJobGroup;
  str: number;
  dex: number;
  int: number;
  luk: number;
  /** 물리 직업: 무기 공격력 + 장갑 공격력 합. 마법사: 마력(마공) 총합. */
  attack: number;
  /** 0~1 */
  mastery: number;
  /** 0~100 */
  criticalRate: number;
  /** 0~100, 크리티컬 발생 시 추가 데미지 % (min/max 구분 없이 평균으로 취급) */
  criticalDamage: number;
  /** 보스 사냥 여부 — OFF면 보스뎀% 옵션은 스펙 계산에서 제외 */
  bossDamageEnabled: boolean;
  /** 0~100, 장비/버프로 이미 확보한 보스뎀%(보스뎀 옵션 켰을 때만 적용) */
  bossDamagePercent: number;
  /** 0~100, 총 데미지% */
  totalDamagePercent: number;
  /** 0~100, 몬스터 방어율 무시% */
  ignoreDefensePercent: number;
  /** 몬스터 방어력(절대값) — 프리빅뱅 공식 특성상 %가 아님. 파밍/잡몹 기준이면 0. */
  monsterDefense: number;
};

export const CUBE_BUILDER_EQUIP_SLOTS = [
  "무기",
  "보조무기",
  "모자",
  "상의",
  "하의",
  "신발",
  "장갑",
  "망토",
  "얼굴장식",
  "눈장식",
  "귀고리",
  "펜던트",
  "벨트",
  "반지1",
  "반지2",
] as const;

export type CubeBuilderEquipSlotKey = (typeof CUBE_BUILDER_EQUIP_SLOTS)[number];

export type CubeBuilderEquipmentSlot = {
  slotKey: CubeBuilderEquipSlotKey;
  grade: number;
  /** 최대 3줄, 비어있으면 null */
  potentialIds: [number | null, number | null, number | null];
};

/** 옵션 하나에서 나올 수 있는 "스펙에 영향 주는" 델타 — 엔트리 하나가 여러 개를 낼 수 있음(예: 올스탯 4개). */
export type CubeBuilderOptionDelta =
  | { kind: "stat"; stat: "str" | "dex" | "int" | "luk"; percent: boolean; value: number }
  | { kind: "attack"; percent: boolean; value: number }
  | { kind: "criticalRate"; value: number }
  | { kind: "criticalDamage"; value: number }
  | { kind: "bossDamage"; value: number }
  | { kind: "totalDamage"; value: number }
  | { kind: "ignoreDefense"; value: number };

export type CubeBuilderSlotOutcome = {
  currentPowerPercent: number;
  upgradeChance: number;
  avgCubesPerHalfPercent: number;
};
