import type { Metadata } from "next";
import Link from "next/link";

const title = "메이플랜드 vs 메이플플래닛 차이점 총정리 | 메랜Hub";
const description =
  "메이플랜드와 메이플플래닛의 경험치·드랍률·메소 배율, 큐브 시스템, 그리고 두 서버에서 수치가 다른 스킬 8종을 공식 패치노트 기준으로 비교했습니다.";

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
    "플래닛 스킬 차이",
    "플래닛 블래스트 데미지",
    "메랜 플래닛 스킬 비교",
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

/**
 * 두 서버의 마스터 레벨 스킬 수치 차이.
 *
 * 출처는 메이플플래닛 2026-08-28 밸런스 패치노트 원문이고, 우리 계산기가 쓰는
 * `data/skills/damageMappingPlanetOverrides.json`과 같은 값이다(수치가 바뀌면 양쪽을 함께 고칠 것).
 * 공식 패치노트로 확인된 8종만 싣는다 — 제3자 데이터로만 짐작되는 차이는 근거가 약해 제외했다.
 */
const skillRows: Array<{ job: string; skill: string; mapleland: string; planet: string; note: string }> = [
  { job: "팔라딘", skill: "블래스트", mapleland: "600% × 1타", planet: "330% × 2타", note: "타수가 2배로 늘고 1타당 데미지는 감소" },
  { job: "히어로", skill: "브랜디쉬", mapleland: "270% × 2타", planet: "290% × 2타", note: "타수 동일, 데미지만 상승" },
  { job: "아크메이지", skill: "빅뱅", mapleland: "450% × 1타", planet: "225% × 2타", note: "총합은 비슷하나 타수가 갈림" },
  { job: "비숍", skill: "엔젤레이", mapleland: "250% × 1타", planet: "140% × 2타", note: "총합은 비슷하나 타수가 갈림" },
  { job: "신궁·저격수", skill: "스트레이프", mapleland: "100% × 4타", planet: "120% × 4타", note: "타수 동일, 데미지만 상승" },
  { job: "나이트로드", skill: "어벤져", mapleland: "180% × 1타", planet: "215% × 1타", note: "타수 동일, 데미지만 상승" },
  { job: "바이퍼", skill: "드래곤 스트라이크", mapleland: "810% × 1타", planet: "420% × 2타", note: "타수가 2배" },
  { job: "신궁", skill: "스나이핑", mapleland: "고정 데미지(즉사급)", planet: "1500% × 2타", note: "고정 데미지에서 배율형으로 성격이 바뀜" },
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
        <h2 className="text-base font-semibold text-slate-100">스킬 수치가 다른 직업들</h2>
        <p className="mt-2 text-sm text-slate-200/90">
          같은 프리빅뱅 원본에서 출발했지만 두 서버가 각자 밸런스 패치를 해오면서 스킬 수치가 갈리기 시작했습니다.
          메이플랜드는 2026년 6월 19일 패치로 스킬 기준을 1.2.35에서 1.2.89(모험가의 귀환)로 올렸고,
          메이플플래닛은 2026년 8월 28일 대규모 밸런스 개편을 했습니다. 아래는 플래닛 8월 28일 패치노트로
          확인된 <strong>마스터 레벨 기준</strong> 차이입니다.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-200/70">
                <th className="py-2 pr-4 font-semibold">직업</th>
                <th className="py-2 pr-4 font-semibold">스킬</th>
                <th className="py-2 pr-4 font-semibold text-rose-200">메이플랜드</th>
                <th className="py-2 pr-4 font-semibold text-amber-200">메이플플래닛</th>
                <th className="py-2 font-semibold">차이</th>
              </tr>
            </thead>
            <tbody>
              {skillRows.map((row) => (
                <tr key={row.skill} className="border-b border-white/5 text-slate-200/90">
                  <td className="py-2 pr-4 text-slate-200/70">{row.job}</td>
                  <td className="py-2 pr-4 font-medium text-slate-100">{row.skill}</td>
                  <td className="py-2 pr-4">{row.mapleland}</td>
                  <td className="py-2 pr-4">{row.planet}</td>
                  <td className="py-2 text-xs text-slate-200/70">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-200/90">
          타수가 갈리는 스킬이 특히 중요합니다. 총 데미지가 비슷해 보여도 <strong>방어력이 높은 몬스터</strong>에게는
          타수가 많을수록 차감이 여러 번 적용돼 실제 피해가 더 줄어듭니다. 그래서 같은 스킬이라도 서버에 따라
          체감 효율이 달라집니다.
        </p>
        <p className="mt-2 text-xs text-slate-200/60">
          위 수치는 마스터 레벨 기준입니다. 두 서버 모두 패치노트가 마스터 값만 공개해 하위 레벨(1~29) 곡선은
          공식적으로 확인되지 않았습니다. 확인되지 않은 구간을 임의로 추정하지는 않습니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/calculators/onehit" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            메랜 한방컷 계산기
          </Link>
          <Link href="/planet/calculators/onehit" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            플래닛 한방컷 계산기
          </Link>
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
          <Link href="/drop-table" className="font-semibold text-violet-200 hover:text-white">
            드랍 테이블
          </Link>
          (
          <Link href="/planet/drop-table" className="font-semibold text-violet-200 hover:text-white">
            플래닛판
          </Link>
          ), N방컷 계산기, 피격 데미지 계산기, 큐브 시뮬레이터까지 메이플랜드/메이플플래닛 버전을 각각 제공합니다.
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
