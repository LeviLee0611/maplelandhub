import type { Metadata } from "next";
import Link from "next/link";

const title = "메이플랜드 vs 메이플플래닛 차이점 총정리 | 메랜Hub";
const description =
  "메이플랜드와 메이플플래닛의 출시일, 경험치/드랍률/메소 배율, 큐브 시스템, 직업 구성 차이를 한눈에 정리했습니다.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "메이플랜드",
    "메이플플래닛",
    "메이플 플래닛",
    "메이플랜드 메이플플래닛 차이",
    "메이플랜드 메이플플래닛 차이점",
    "메이플랜드 플래닛 비교",
  ],
  alternates: {
    canonical: "/mapleland-vs-planet",
  },
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

const compareRows: Array<{ label: string; mapleland: string; planet: string }> = [
  { label: "오픈베타(OBT) 시작", mapleland: "2023-10-31", planet: "2026-04-24" },
  { label: "정식 출시", mapleland: "2024-10-31", planet: "OBT 중(2026-07 기준)" },
  { label: "기반 플랫폼", mapleland: "메이플스토리 월드", planet: "메이플스토리 월드" },
  { label: "게임 버전 기준", mapleland: "프리빅뱅(KMS 1.2.95~98)", planet: "프리빅뱅(KMS 1.2.95~98, 메랜과 동일)" },
  { label: "경험치 배율(메랜 대비)", mapleland: "기준(1배)", planet: "약 4배" },
  { label: "아이템 드랍률(메랜 대비)", mapleland: "기준(1배)", planet: "약 4배" },
  { label: "메소 획득량(메랜 대비)", mapleland: "기준(1배)", planet: "약 2배" },
  { label: "큐브 / 잠재능력 시스템", mapleland: "없음", planet: "있음 (수상한 큐브 / 미라클 큐브)" },
  { label: "직업 구성", mapleland: "프리빅뱅 기본 직업군", planet: "메랜과 동일한 전 직업 + 후반 액티브 스킬 일부 추가" },
];

export default function MaplelandVsPlanetPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">서버 비교</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">메이플랜드 vs 메이플플래닛, 뭐가 다를까?</h1>
        <p className="mt-3 text-sm text-slate-200/90 md:text-base">
          둘 다 넥슨의 &ldquo;메이플스토리 월드&rdquo; 플랫폼에서 서비스되는, 빅뱅 이전(프리빅뱅) 메이플스토리를 재현한
          클래식 서버입니다. 같은 뿌리에서 나왔지만 배율/시스템에서 몇 가지 실질적인 차이가 있어 정리했습니다.
        </p>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">공통점</h2>
        <p className="mt-2 text-sm text-slate-200/90">
          둘 다 메이플스토리 본편(베라/루나 등)과는 별도로, 넥슨이 직접 운영하는 &ldquo;메이플스토리 월드&rdquo;
          플랫폼 위에 만들어진 공식 타이틀입니다. 몬스터/맵/직업 등 기반 데이터는 같은 프리빅뱅 버전(KMS
          1.2.95~98)을 따르기 때문에, 사냥터나 스킬 자체의 기본 뼈대는 거의 동일합니다.
        </p>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">핵심 차이 한눈에 보기</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-200/70">
                <th className="py-2 pr-4 font-semibold">항목</th>
                <th className="py-2 pr-4 font-semibold text-rose-200">메이플랜드</th>
                <th className="py-2 font-semibold text-amber-200">메이플플래닛</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.label} className="border-b border-white/5 text-slate-200/90">
                  <td className="py-2 pr-4 font-medium text-slate-100">{row.label}</td>
                  <td className="py-2 pr-4">{row.mapleland}</td>
                  <td className="py-2">{row.planet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-200/60">
          배율/직업 구성은 커뮤니티 정보 및 공식 공지 기준으로 정리했으며, 각 서버 패치에 따라 달라질 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">경험치/드랍/메소 배율 차이가 뜻하는 것</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            메이플플래닛은 메이플랜드와 같은 원본 데이터를 쓰면서 경험치 약 4배, 드랍률 약 4배, 메소 획득량 약 2배가
            적용돼 있어 성장 속도가 눈에 띄게 빠릅니다. 오래 걸리는 파밍/레벨업 없이 빠르게 캐릭터를 키우고 싶다면
            플래닛 쪽이 접근하기 편합니다.
          </p>
        </div>
        <div className="glass-panel rounded-2xl px-5 py-5">
          <h2 className="text-base font-semibold text-slate-100">큐브 시스템 유무</h2>
          <p className="mt-2 text-sm text-slate-200/90">
            메이플랜드에는 잠재능력/큐브 시스템 자체가 없어 장비 스펙업 방식이 단순한 반면, 메이플플래닛은 수상한
            큐브·미라클 큐브로 장비에 잠재능력을 부여할 수 있어 엔드 콘텐츠에서 스펙을 더 세밀하게 파고들 수 있습니다.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">어느 쪽이 나에게 맞을까?</h2>
        <p className="mt-2 text-sm text-slate-200/90">
          &ldquo;원조 클래식 감성을 더 오래, 더 많은 유저와 즐기고 싶다&rdquo;면 누적 유저 수가 많고 먼저 자리 잡은
          메이플랜드가, &ldquo;빠른 성장과 큐브 스펙업까지 포함한 확장된 클래식&rdquo;을 원한다면 메이플플래닛이 더
          맞을 수 있습니다. 정답은 없고, 둘 다 같은 원본을 기반으로 하는 만큼 캐릭터 빌드나 사냥터 지식은 상당 부분
          공유됩니다.
        </p>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">메랜Hub는 두 서버 모두 지원합니다</h2>
        <p className="mt-2 text-sm text-slate-200/90">
          드랍 테이블, N방컷 계산기, 피격 데미지 계산기, 큐브 시뮬레이터까지 메이플랜드/메이플플래닛 버전을 각각
          제공합니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            메이플랜드 도구 보기
          </Link>
          <Link href="/planet" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            메이플플래닛 도구 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
