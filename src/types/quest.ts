export type QuestItem = {
  id: number;
  name: string;
  count: number;
  source?: string;
};

export type QuestMobRequirement = {
  id?: number;
  name: string;
  quantity?: number;
  area?: string;
};

export type QuestPrerequisite = {
  questId: number;
  name?: string;
};

export type QuestRequirements = {
  start?: {
    levelMin?: number;
    jobs?: number[];
  };
  complete?: {
    items?: QuestItem[];
    mobs?: QuestMobRequirement[];
  };
};

export type QuestGuide = {
  recommendedAreas?: string;
  notes?: string[];
};

export type QuestRewards = {
  exp?: number;
  meso?: number;
  items?: QuestItem[];
};

export type Quest = {
  id: number;
  name: string;
  worldId: string;
  npcId: number;
  repeatable: boolean;
  levelMin: number;
  prerequisites: QuestPrerequisite[];
  requirements: QuestRequirements;
  rewards: QuestRewards;
  guide?: QuestGuide;
};

export type QuestNpc = {
  id: number;
  name: string;
};

export type QuestWorld = {
  id: string;
  name: string;
};

export type QuestData = {
  generatedAt: string;
  source: string;
  worlds: QuestWorld[];
  npcs: QuestNpc[];
  quests: Quest[];
};
