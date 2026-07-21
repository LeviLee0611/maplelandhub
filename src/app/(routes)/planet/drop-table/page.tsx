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
      <div className="glass-panel mb-4 rounded-2xl px-5 py-5 text-sm text-slate-200/90">
        <h2 className="text-base font-semibold text-slate-100">메이플 플래닛 드랍테이블 안내</h2>
        <p className="mt-2">
          메이플 플래닛은 메이플랜드와 같은 프리빅뱅(1.2.95~98) 기반 서버지만, 드랍률이 기본 대비{" "}
          <strong className="font-semibold text-slate-100">4배</strong>로 적용됩니다. 아래 확률은 이 배율까지
          반영된 플래닛 실제 수치입니다.
        </p>
      </div>
      <DropTable
        dropData={dropData}
        monsters={getPlanetMonsters()}
        calculatorBasePath="/planet"
        server="planet"
      />
    </>
  );
}
