import dropIndexJson from "@data/planet/drop-index.json";
import itemDetailByJson from "@data/planet/item-detail-by.json";
import { DropTable } from "@/components/DropTable";
import type { DropIndexData, ItemDetailByData } from "@/components/DropTable";
import { getPlanetMonsters } from "@/lib/data/monsters";
import { PlanetBadge } from "@/components/PlanetBadge";

export default function PlanetDropTablePage() {
  return (
    <>
      <PlanetBadge />
      <DropTable
        dropData={dropIndexJson as unknown as DropIndexData}
        itemDetailByData={itemDetailByJson as unknown as ItemDetailByData}
        monsters={getPlanetMonsters()}
        calculatorBasePath="/planet"
      />
    </>
  );
}
