import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 확률의 비밀 | 드랍 확률과 한방컷 확률은 어떻게 계산되나";
const description =
  "메랜Hub가 보여주는 드랍 확률과 한방컷 확률이 어디서 오고 어떻게 계산되는지, 한계는 무엇인지 설명합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/probability",
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

/**
 * 확률 설명 페이지.
 *
 * 2026-10-12 애드센스 재심사 대응으로 두 줄짜리 더미를 실제 설명으로 교체했다.
 * 여기 적힌 수치와 규칙은 전부 코드에 실제로 있는 것들이다 — src/lib/calculators/onehit.ts(한방컷 확률),
 * src/components/DropTable.tsx(formatProb, 0% → 정보 없음), scripts/build-planet-data.mjs(플래닛 4배).
 * 코드를 바꾸면 여기도 같이 고칠 것. 설명이 실제 동작과 어긋나는 순간 이 페이지는 거짓말이 된다.
 */

type Section = { title: string; paragraphs: string[]; list?: string[] };

const sections: Section[] = [
  {
    title: "드랍 확률은 어디서 오나요?",
    paragraphs: [
      "메이플랜드와 메이플 플래닛은 아이템 드랍 확률을 공식적으로 공개하지 않습니다. 메랜Hub의 드랍 확률은 공개된 게임 데이터와 여러 커뮤니티 데이터베이스가 정리한 값을 수집해 대조한 것입니다. 그래서 이 확률은 '정확한 내부 수치'가 아니라 '현재까지 알려진 가장 신뢰할 만한 추정치'입니다.",
      "같은 몬스터·아이템 쌍에 대해 출처마다 값이 다를 때는 출처 간 일치율이 높은 쪽을 택합니다. 예를 들어 2026년 10월 플래닛 데이터를 외부 데이터베이스와 전수 대조했을 때 공통 쌍의 70%가 소수점까지 똑같았고, 가장 큰 불일치 덩어리는 한쪽이 0.009%를 0.01%로 반올림해 표시한 차이였습니다. 이런 식으로 실제 오류와 표시 차이를 구분해 반영합니다.",
    ],
  },
  {
    title: "'정보 없음'은 무슨 뜻인가요?",
    paragraphs: [
      "드랍 테이블에 '정보 없음'이라고 나오면 그 아이템이 안 떨어진다는 뜻이 아닙니다. 원본 데이터에 확률 값이 비어 있다는 뜻입니다. 게임에 확률 0%인 드랍은 존재하지 않으므로, 모르는 값을 0.00%라고 적어 '안 떨어진다'고 오해시키는 대신 모른다고 적습니다.",
      "확률이 확인되지 않은 쌍은 2026년 10월 기준 메이플랜드 데이터에 87건 남아 있으며, 여러 데이터베이스를 교차 확인했지만 어디에도 값이 없는 것들입니다. 값이 확인되는 대로 채웁니다.",
    ],
  },
  {
    title: "메이플 플래닛의 확률은 왜 다른가요?",
    paragraphs: [
      "메이플 플래닛은 원작 대비 드랍률 4배, 경험치 4배(지역별 개별 조정 있음), 메소 2배 서버입니다. 메랜Hub의 플래닛 드랍 확률은 메이플랜드 기준값에 4배를 곱한 뒤 100%를 넘는 값은 100%로 잘라낸 것입니다.",
      "경험치는 단순히 4를 곱하지 않습니다. 플래닛이 지역별로 경험치를 따로 조정해 온 탓에 4배가 아닌 몬스터가 100종 넘게 섞여 있어, 실제 플래닛에서 측정된 값을 몬스터마다 개별로 넣습니다. 플래닛 전용 드랍(원작에 없는 전리품)은 플래닛 데이터베이스에서 별도로 가져옵니다.",
    ],
  },
  {
    title: "한방컷 확률은 어떻게 계산하나요?",
    paragraphs: [
      "한방컷 계산기는 캐릭터의 최소 데미지와 최대 데미지를 먼저 구합니다. 최대 데미지는 주스탯·부스탯·공격력(마법사는 마력)과 스킬 데미지%로, 최소 데미지는 거기에 숙련도를 곱해 구합니다. 숙련도가 60%면 최소 데미지는 최대의 약 60%(정확히는 0.9 × 숙련도) 수준입니다.",
      "그다음 몬스터 방어력과 레벨 차이를 적용합니다. 물리 공격은 몬스터가 캐릭터보다 높은 레벨일 때 레벨 차이 1당 1%씩 데미지가 깎이고, 방어력은 최대 데미지에서 방어력÷5, 최소 데미지에서 방어력÷6을 뺍니다. 마법 공격은 마법 방어력에 레벨 차이 보정을 곱한 값을 뺍니다.",
      "이렇게 나온 최소~최대 데미지 범위 안에서 몬스터 HP보다 큰 구간이 차지하는 비율이 '한방컷 확률'입니다. 최소 데미지가 HP 이상이면 100%, 최대 데미지가 HP 미만이면 0%입니다. N방컷 확률도 같은 원리로 N번 때린 누적 범위에서 계산합니다.",
    ],
    list: [
      "속성: 약점 속성은 1.5배, 반감은 0.5배, 면역은 0입니다. 스킬 이름으로 속성을 판정하며 일부 스킬은 수동으로 지정돼 있습니다.",
      "크리티컬: 크리티컬 확률과 크리 데미지를 가진 직업(궁수·나이트로드·나이트워커·에반)은 기대값으로 반영합니다.",
      "스킬 수치: 직업별 스킬 데미지%는 원작 데이터와 각 서버의 공식 패치노트를 대조해 관리합니다. 서버 간 수치가 다른 스킬은 서버별로 따로 둡니다.",
      "명중: 입력한 명중률만큼 기대 데미지를 깎습니다. 명중 100%면 영향이 없습니다.",
    ],
  },
  {
    title: "피격 데미지는 어떻게 계산하나요?",
    paragraphs: [
      "피격 데미지 계산기는 몬스터의 물리/마법 공격력과 캐릭터의 레벨·방어력·직업을 바탕으로 한 번 맞을 때 받는 데미지 범위를 구합니다. 물리 피격은 0.8~0.85, 마법 피격은 0.75~0.8의 랜덤 계수가 들어가므로 결과가 범위로 나옵니다.",
      "마법사 계열의 매직 가드(마스터 80%, 에반은 70%), 도적의 메소 가드, 전사의 파워 가드·아킬레스 같은 피격 감소 스킬은 직업을 고르면 입력란이 나타나고, 'HP로 받는 데미지'와 'MP/메소로 대신하는 데미지'를 나눠 보여줍니다. '한 방 사망 확률'은 피격 범위 중 현재 HP를 넘는 구간의 비율입니다.",
    ],
  },
  {
    title: "그래서 얼마나 믿어도 되나요?",
    paragraphs: [
      "한방컷·피격 데미지 계산은 원작의 공개된 공식을 그대로 구현한 것이라, 입력값이 정확하면 결과도 정확합니다. 틀리는 경우는 대부분 입력 쪽입니다 — 버프 공격력을 빼먹었거나, 장비 숙련도 스킬 레벨이 다르거나, 몬스터 방어력 데이터가 원작과 다른 경우입니다.",
      "드랍 확률은 추정치라는 점을 항상 염두에 두세요. 특히 보스 희귀 드랍처럼 표본이 적은 항목은 출처 간 편차가 큽니다. 실제 체감과 다르거나 잘못된 값을 발견하면 문의/요청으로 알려주시면 출처를 다시 확인합니다.",
    ],
  },
];

export default function ProbabilityPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">데이터 안내</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">확률의 비밀</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-200/90 md:text-base">
          메랜Hub가 보여주는 숫자가 어디서 오고 어떻게 계산되는지 숨기지 않고 적어둡니다. 추정치는 추정치라고,
          모르는 값은 모른다고 표시하는 것이 이 사이트의 원칙입니다.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.title} className="glass-panel rounded-2xl px-6 py-5">
            <h2 className="text-base font-semibold text-slate-100">{section.title}</h2>
            {section.paragraphs.map((text) => (
              <p key={text} className="mt-2 text-sm leading-relaxed text-slate-200/90">
                {text}
              </p>
            ))}
            {section.list ? (
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-slate-200/90">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl px-6 py-5">
        <h2 className="text-base font-semibold text-slate-100">직접 확인하기</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-200/90">
          <Link href="/calculators/onehit" className="font-semibold text-sky-200 hover:text-white">
            한방컷 계산기
          </Link>
          에서 결과 아래의 &apos;계산식 보기&apos;를 열면 위 과정이 실제 숫자로 어떻게 적용됐는지 단계별로 볼 수 있습니다.{" "}
          <Link href="/drop-table" className="font-semibold text-violet-200 hover:text-white">
            드랍 테이블
          </Link>
          의 확률은 몬스터 기준과 아이템 기준 양쪽에서 같은 값을 보여줍니다.
        </p>
      </div>
    </section>
  );
}
