import dropIndexJson from "@data/planet/drop-index.json";
import { DropTable } from "@/components/DropTable";
import type { DropIndexData, DropIndexItem } from "@/components/DropTable";
import { getPlanetMonsters } from "@/lib/data/monsters";
import { PlanetBadge } from "@/components/PlanetBadge";

// 검색/목록 렌더링에 필요한 필드만 남겨서 클라이언트로 보내는 페이로드를 줄인다.
// 드랍/역방향 조회는 /api/drop-table/{monster,item} 라우트로 온디맨드 fetch.
const slimItems: DropIndexItem[] = (dropIndexJson.items as DropIndexItem[]).map((item) => ({
  id: item.id,
  name: item.name,
  typeInfo: item.typeInfo
    ? { overallCategory: item.typeInfo.overallCategory, category: item.typeInfo.category }
    : undefined,
  meta: item.meta
    ? { synthetic: item.meta.synthetic, equip: item.meta.equip ? { reqLevel: item.meta.equip.reqLevel } : undefined }
    : undefined,
}));

const dropData: DropIndexData = {
  generatedAt: dropIndexJson.generatedAt,
  source: dropIndexJson.source,
  items: slimItems,
};

export default function PlanetDropTablePage() {
  return (
    <>
      <PlanetBadge />
      <DropTable
        dropData={dropData}
        monsters={getPlanetMonsters()}
        calculatorBasePath="/planet"
        server="planet"
      />
    </>
  );
}
