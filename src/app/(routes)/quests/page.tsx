import questJson from "@data/quests.json";
import monstersJson from "@data/monsters.json";
import monsterSpawnsJson from "@data/monster-spawns.json";
import dropIndexJson from "@data/drop-index.json";
import itemDetailByJson from "@data/item-detail-by.json";
import npcLocationsJson from "@data/npc-locations.json";
import { QuestBoard } from "@/components/QuestBoard";
import type { QuestBoardProps } from "@/components/QuestBoard";
import type { QuestData } from "@/types/quest";

export default function QuestsPage() {
  const props: QuestBoardProps = {
    data: questJson as unknown as QuestData,
    monsterData: monstersJson as unknown as QuestBoardProps["monsterData"],
    dropIndexData: dropIndexJson as unknown as QuestBoardProps["dropIndexData"],
    itemDetailByData: itemDetailByJson as unknown as QuestBoardProps["itemDetailByData"],
    monsterSpawnsData: monsterSpawnsJson as unknown as QuestBoardProps["monsterSpawnsData"],
    npcLocationsData: npcLocationsJson as unknown as QuestBoardProps["npcLocationsData"],
  };
  return <QuestBoard {...props} />;
}
