import dropIndexJson from "@data/drop-index.json";
import itemDetailByJson from "@data/item-detail-by.json";
import { DropTable } from "@/components/DropTable";
import type { DropIndexData, ItemDetailByData } from "@/components/DropTable";
import { getMonsters } from "@/lib/data/monsters";

export default function DropTablePage() {
  return (
    <DropTable
      dropData={dropIndexJson as unknown as DropIndexData}
      itemDetailByData={itemDetailByJson as unknown as ItemDetailByData}
      monsters={getMonsters()}
      itemLinkBase="https://www.mapleland.gg"
    />
  );
}
