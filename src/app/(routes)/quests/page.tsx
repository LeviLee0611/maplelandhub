import Link from "next/link";
import questJson from "@data/quests.json";
import monstersJson from "@data/monsters.json";
import monsterSpawnsJson from "@data/monster-spawns.json";
import dropIndexJson from "@data/drop-index.json";
import itemDetailByJson from "@data/item-detail-by.json";
import npcLocationsJson from "@data/npc-locations.json";
import { QuestBoard } from "@/components/QuestBoard";
import type { QuestBoardProps } from "@/components/QuestBoard";
import type { QuestData } from "@/types/quest";
import { buildSlimQuestBoardData } from "@/lib/quest-board-data";

const questData = questJson as unknown as QuestData;

// drop-index.json(3.5MB) 등을 통째로 QuestBoard("use client")에 넘기는 대신, 퀘스트 데이터가
// 실제로 참조하는 아이템/NPC/몬스터만 골라낸 슬림 버전을 만들어 전달한다 (상세 로직은 quest-board-data.ts).
const slimData = buildSlimQuestBoardData(
  questData.quests,
  monstersJson as unknown as QuestBoardProps["monsterData"],
  dropIndexJson,
  itemDetailByJson,
  npcLocationsJson,
  monsterSpawnsJson,
);

export default function QuestsPage() {
  const props: QuestBoardProps = {
    data: questData,
    ...slimData,
  };
  return (
    <>
      <QuestBoard {...props} />
      <p className="mx-auto mt-2 max-w-6xl px-4 text-xs text-slate-400/80">
        <Link href="/services/quests" className="hover:text-slate-200">
          퀘스트 섹션 설명 보기
        </Link>
      </p>
    </>
  );
}
