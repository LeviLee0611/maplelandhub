import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";

/**
 * 계산기 하단 설명 블록 — 서버 컴포넌트.
 *
 * 계산기 페이지는 입력·결과가 전부 클라이언트에서 그려져 HTML에 남는 고유 본문이 100~200자뿐이었다
 * (2026-09-21 측정: `/calculator/damage` 본문 1,081자 중 대부분이 모든 페이지 공통 사이드바).
 * 검색엔진이 "이 페이지가 무엇에 대한 것인지" 판단할 근거가 title과 h1밖에 없던 상태.
 *
 * 내용은 일반적인 설명이 아니라 **이 프로젝트가 실제로 쓰는 계산식**을 옮긴 것이다
 * (`src/lib/calculators/onehit.ts`, `src/lib/calculators/takenDamage/*`). 공식이 바뀌면 여기도 고쳐야 한다.
 * 클라이언트 지시어를 넣지 말 것 — 텍스트가 HTML에 정적으로 박혀야 의미가 있다.
 */

type GuideVariant = "onehit" | "damage" | "drop-table";
type GuideServer = "mapleland" | "planet";

type FaqEntry = { q: string; a: string };

const SUMMARY_LABEL: Record<GuideVariant, string> = {
  onehit: "한방컷 계산 방식과 자주 묻는 질문 보기",
  damage: "피격 데미지 계산 방식과 자주 묻는 질문 보기",
  "drop-table": "드랍 테이블 사용법과 데이터 신뢰도 안내 보기",
};

function faqJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    })),
  };
}

const FAQ: Record<GuideVariant, FaqEntry[]> = {
  onehit: [
    {
      q: "한방컷(N방컷)이 무엇인가요?",
      a: "몬스터를 한 번의 스킬로 처치하는 것을 한방컷이라고 합니다. N방컷은 처치까지 필요한 타격 횟수를 뜻합니다. 사냥터 효율은 이 횟수에 크게 좌우되므로, 공격력을 얼마나 올리면 한 방이 줄어드는지 확인하는 데 씁니다.",
    },
    {
      q: "최소 데미지와 최대 데미지는 왜 차이가 나나요?",
      a: "무기 숙련도(마스터리)가 최소 데미지에만 영향을 주기 때문입니다. 최대 데미지는 숙련도와 무관하게 결정되고, 최소 데미지는 숙련도가 높을수록 최대치에 가까워집니다. 그래서 숙련도를 올리면 평균 데미지가 오르고 데미지 편차가 줄어듭니다.",
    },
    {
      q: "명중률은 결과에 어떻게 반영되나요?",
      a: "명중률이 100%가 아니면 일부 타격이 빗나가므로 실제 필요한 타격 횟수가 늘어납니다. 계산기는 명중률을 반영해 N방컷 확률을 분포로 보여줍니다.",
    },
  ],
  damage: [
    {
      q: "피격 데미지는 어떻게 계산되나요?",
      a: "몬스터의 공격력을 기준으로 기본 피해량을 구한 뒤, 캐릭터의 방어력과 스탯으로 일정량을 깎는 방식입니다. 물리 피격은 몬스터 물리 공격력의 제곱에 비례하고, 마법 피격은 몬스터 마법 공격력을 기준으로 계산합니다.",
    },
    {
      q: "방어력을 올리면 피격 데미지가 계속 줄어드나요?",
      a: "직업과 레벨마다 기준 방어력이 정해져 있고, 이 기준을 넘는지에 따라 차감 계수가 달라집니다. 기준보다 낮으면 차감 효율이 더 크고, 기준을 넘어서면 효율이 완만해집니다. 또 캐릭터 레벨이 몬스터 레벨보다 낮으면 불리하게 계산됩니다.",
    },
    {
      q: "매직 가드는 피해를 없애주나요?",
      a: "아닙니다. 매직 가드는 받은 피해의 일정 비율을 HP 대신 MP로 돌리는 스킬입니다. 총 피해량이 줄어드는 것이 아니라 HP로 들어오는 몫이 줄어듭니다. 그래서 계산기는 마법사 직업일 때 HP 기준 피격량을 따로 보여줍니다.",
    },
  ],
  "drop-table": [
    {
      q: "드랍 확률은 어디까지 믿을 수 있나요?",
      a: "표시되는 확률은 외부에서 수집한 데이터를 정리한 값이며 게임 내부 수치와 다를 수 있습니다. 확률이 확인되지 않은 항목은 임의로 추정하지 않고 정보 없음으로 표시합니다.",
    },
    {
      q: "같은 이름의 몬스터가 여러 개 있는 이유는 무엇인가요?",
      a: "원작에서 이름이 같아도 레벨과 능력치가 다른 몬스터가 존재합니다. 이 사이트는 이름이 아니라 몬스터 고유 코드로 구분하므로, 목록에서 선택한 몬스터의 실제 드랍이 표시됩니다.",
    },
  ],
};

function OneHitBody({ base }: { base: string }) {
  return (
    <>
      <h2 className="text-lg font-semibold">한방컷 계산기는 무엇을 계산하나요</h2>
      <p>
        캐릭터의 주스탯·부스탯·무기 공격력과 스킬 데미지%를 넣으면 한 번의 스킬로 들어가는 데미지 범위를 구하고,
        몬스터 HP와 비교해 처치까지 필요한 타격 횟수(N방컷)와 한 방에 잡을 확률을 계산합니다.
      </p>

      <h2 className="mt-5 text-lg font-semibold">계산 방식</h2>
      <p>
        물리 공격은 <strong>(주스탯 × 스탯 배율 + 부스탯) × 무기 공격력 × 스킬 데미지% ÷ 100</strong>으로 최대
        데미지를 구합니다. 최소 데미지는 여기에 무기 숙련도가 적용돼,
        <strong> 주스탯에 0.9 × 숙련도</strong>를 곱한 값으로 계산합니다. 숙련도가 최대 데미지를 올려주지 않고
        최소 데미지만 끌어올린다는 점이 중요합니다.
      </p>
      <p>
        마법 공격은 공식이 다릅니다. <strong>0.0033665 × 마력² + 3.3 × 마력 + 0.5 × INT</strong>에 스킬 데미지%를
        곱합니다. 마력이 커질수록 제곱항의 비중이 커져서, 같은 수치를 올려도 마력이 높을수록 이득이 큽니다.
      </p>
      <p>
        이렇게 구한 한 방 데미지에 스킬 타수와 명중률을 반영해 실제 필요한 타격 횟수를 냅니다. 명중률이 100%가
        아니면 빗나가는 타격이 생기므로 N방컷이 확률 분포로 나옵니다.
      </p>

      <h2 className="mt-5 text-lg font-semibold">이럴 때 쓰면 좋습니다</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>공격력을 얼마나 올려야 한 방이 줄어드는지 확인할 때</li>
        <li>주문서를 바를지, 무기를 바꿀지 판단할 때 기대 이득을 비교</li>
        <li>사냥터를 옮기기 전에 해당 몬스터를 몇 방에 잡는지 미리 확인</li>
        <li>스킬 레벨을 올렸을 때 실제로 방수가 줄어드는지 검증</li>
      </ul>

      <p className="mt-4 text-xs text-[color:var(--retro-text-muted)]">
        더 자세한 설명은 <Link href="/services/onehit" className="underline">계산 방식 안내</Link>에서 볼 수 있고,
        몬스터별 스탯과 드랍은 <Link href={`${base}/drop-table`} className="underline">드랍 테이블</Link>에서 확인할
        수 있습니다.
      </p>
    </>
  );
}

function DamageBody({ base }: { base: string }) {
  return (
    <>
      <h2 className="text-lg font-semibold">피격 데미지 계산기는 무엇을 계산하나요</h2>
      <p>
        몬스터에게 맞았을 때 실제로 받는 피해량을 추정합니다. 캐릭터 레벨·스탯·방어력과 직업별 피격 감소 스킬을
        넣으면 물리 피격과 마법 피격의 범위, 그리고 한 방에 죽을 확률을 함께 보여줍니다.
      </p>

      <h2 className="mt-5 text-lg font-semibold">계산 방식</h2>
      <p>
        물리 피격은 몬스터 물리 공격력의 <strong>제곱에 비례</strong>합니다. 여기에서 캐릭터의 방어력과 스탯으로
        계산한 차감치를 뺍니다. 차감치는 단순히 방어력만 보는 것이 아니라{" "}
        <strong>직업·레벨별 기준 방어력</strong>을 넘는지에 따라 계수가 달라집니다. 기준보다 방어력이 낮으면 차감
        효율이 더 크고, 기준을 넘어서면 완만해집니다. 캐릭터 레벨이 몬스터 레벨보다 낮으면 추가로 불리하게
        계산됩니다.
      </p>
      <p>
        마법 피격은 몬스터 마법 공격력을 기준으로 기본 피해를 구한 뒤, <strong>STR·DEX·LUK과 마법 방어력</strong>을
        합산한 값으로 차감합니다. 이때 마법사 직업은 차감 계수가 더 높아 같은 마법 방어력이라도 더 많이 줄어듭니다.
      </p>

      <h2 className="mt-5 text-lg font-semibold">직업별 피격 감소 스킬</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>매직 가드</strong>(마법사) — 피해를 없애는 것이 아니라 일정 비율을 HP 대신 MP로 돌립니다. 그래서
          이 계산기는 마법사일 때 HP 기준 피격량을 따로 표시합니다.
        </li>
        <li>
          <strong>인빈서블</strong>(마법사) — 받는 피해를 비율로 줄입니다.
        </li>
        <li>
          <strong>엘리멘트 레지스턴스</strong>(마법사) — 속성 공격에만 적용되며, 직업 갈래와 속성이 맞아야
          들어갑니다. 무속성 공격에는 적용되지 않습니다.
        </li>
        <li>
          <strong>아킬레스</strong>(파이터 계열) · <strong>파워 가드</strong>(페이지 계열) — 전사 갈래별 전용
          스킬입니다.
        </li>
        <li>
          <strong>메소 가드</strong>(도적) — 피해의 일부를 메소로 대신 지불합니다.
        </li>
      </ul>

      <p className="mt-4">
        결과는 최소·최대 범위로 나옵니다. 몬스터 공격에는 원래 난수 폭이 있어 한 값으로 고정되지 않기 때문입니다.
        최대 피격량이 자신의 최대 HP를 넘으면 한 방에 죽을 수 있다는 뜻입니다.
      </p>

      <p className="mt-4 text-xs text-[color:var(--retro-text-muted)]">
        계산식 상세는 <Link href="/services/damage" className="underline">피격 데미지 계산 방식 설명</Link>에 있고,
        몬스터별 공격력은 <Link href={`${base}/drop-table`} className="underline">드랍 테이블</Link>에서 확인할 수
        있습니다.
      </p>
    </>
  );
}

function DropTableBody({ base }: { base: string }) {
  return (
    <>
      <h2 className="text-lg font-semibold">드랍 테이블 사용법</h2>
      <p>
        몬스터 이름으로 검색하면 해당 몬스터가 떨어뜨리는 아이템과 확률을, 아이템 이름으로 검색하면 그 아이템이
        나오는 몬스터를 역으로 찾을 수 있습니다. 몬스터를 선택하면 레벨·HP·경험치·방어력·회피 같은 스탯과 필요
        명중치도 함께 보여줍니다.
      </p>

      <h2 className="mt-5 text-lg font-semibold">확률 표기와 데이터 신뢰도</h2>
      <p>
        표시되는 확률은 외부에서 수집한 데이터를 정리한 값이라 게임 내부 수치와 다를 수 있습니다. 확률이 확인되지
        않은 항목은 임의로 추정하지 않고 <strong>정보 없음</strong>으로 둡니다. 근거 없는 숫자를 채워 넣는 것이
        비어 있는 것보다 나쁘다고 보기 때문입니다.
      </p>
      <p>
        같은 이름의 몬스터가 여러 종 존재하는 경우가 있습니다. 원작에서 이름이 같아도 레벨과 HP가 다른 몬스터가
        있기 때문인데, 이 사이트는 이름이 아니라 몬스터 고유 코드로 구분하므로 목록에서 고른 몬스터의 실제 드랍이
        표시됩니다.
      </p>

      <p className="mt-4 text-xs text-[color:var(--retro-text-muted)]">
        확률 계산 방식은 <Link href="/services/drop-table" className="underline">드랍 확률 설명</Link>에서 볼 수
        있습니다. 몬스터를 고르면{" "}
        <Link href={`${base}/calculators/onehit`} className="underline">한방컷 계산기</Link>와{" "}
        <Link href={`${base}/calculator/damage`} className="underline">피격 데미지 계산기</Link>로 바로 이어집니다.
      </p>
    </>
  );
}

export function CalculatorGuide({
  variant,
  server = "mapleland",
}: {
  variant: GuideVariant;
  server?: GuideServer;
}) {
  const base = server === "planet" ? "/planet" : "";
  const entries = FAQ[variant];

  return (
    <section className="mx-auto mt-8 max-w-6xl px-4 pb-10 text-sm leading-relaxed text-[color:var(--retro-text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(entries)) }} />

      {/* 계산기(입력·결과)가 모두 끝난 직후, 설명 블록 위. 조작부와 겹치지 않으면서
          페이지 맨 밑보다는 눈에 띄는 자리다. 예전엔 한방컷 결과 패널 바로 위와 드랍테이블
          계산기 버튼 옆에 있었는데, 둘 다 입력->결과를 반복 확인하는 동선 한가운데이고
          버튼과 붙어 있어 오클릭 위험이 있었다(Google 게재위치 정책도 조작부 근처 배치를
          주의하도록 요구한다). */}
      <AdSlot slot={`${variant}-after-tool`} className="mb-6" />

      {/* 기본은 접어둔다 — 도구를 쓰러 온 사람에게 긴 글이 먼저 보이면 방해가 된다.
          details 안의 텍스트도 HTML에는 그대로 있어 검색엔진은 정상적으로 읽는다. */}
      <details className="group rounded-2xl border border-[var(--retro-border)] bg-[var(--retro-cell)] px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
          <span>{SUMMARY_LABEL[variant]}</span>
          <span className="text-xs text-[color:var(--retro-text-muted)] transition group-open:rotate-180">▼</span>
        </summary>

        <div className="mt-4 space-y-3 border-t border-[var(--retro-border)] pt-4">
          {variant === "onehit" ? <OneHitBody base={base} /> : null}
          {variant === "damage" ? <DamageBody base={base} /> : null}
          {variant === "drop-table" ? <DropTableBody base={base} /> : null}

          <h2 className="mt-5 text-lg font-semibold">자주 묻는 질문</h2>
          <dl className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.q}>
                <dt className="font-semibold">{entry.q}</dt>
                <dd className="mt-1 text-[color:var(--retro-text-muted)]">{entry.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

    </section>
  );
}
