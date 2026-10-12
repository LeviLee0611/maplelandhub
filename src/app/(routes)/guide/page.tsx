import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 사용방법 | 한방컷·피격 데미지·드랍 테이블·퀘스트 사용 가이드";
const description =
  "메랜Hub의 한방컷 계산기, 피격 데미지 계산기, 드랍 테이블, 퀘스트 보드를 정확하게 쓰는 방법과 자주 틀리는 입력을 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/guide",
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
 * 사용방법 페이지.
 *
 * 2026-10-12 애드센스 재심사 대응으로 네 줄짜리 일반론을 도구별 실제 사용법으로 교체했다.
 * 여기 적힌 입력란 이름·동작은 전부 실제 UI 기준이다(onehit-calculator-client.tsx, TakenDamageCalculator.tsx,
 * DropTable.tsx, QuestBoard.tsx). UI 를 바꾸면 여기도 같이 고칠 것.
 */

type Tool = {
  name: string;
  href: string;
  summary: string;
  steps: string[];
  tips: string[];
};

const tools: Tool[] = [
  {
    name: "한방컷 계산기",
    href: "/calculators/onehit",
    summary: "내 스펙으로 특정 몬스터를 몇 방에 잡는지, 한 방에 잡을 확률은 얼마인지 계산합니다.",
    steps: [
      "직업군 → 직업을 고릅니다. 전사·궁수·도적·해적은 무기 타입도 골라야 합니다(무기마다 공격 계수가 다릅니다). 메이플랜드에만 있는 배틀메이지, 플래닛에만 있는 에반은 해당 서버 페이지에서만 선택지에 나옵니다.",
      "레벨과 스탯(STR/DEX/INT/LUK)은 장비·버프를 포함한 최종값을 넣습니다. 장비창에서 보이는 괄호 안 숫자가 아니라 괄호 앞 합산값입니다.",
      "공격력은 '무기 공격력'과 '총 공격력' 중 아는 쪽 하나만 넣으면 됩니다. 마법사는 마력을 넣습니다. 장갑 공격력과 소모품(전공·마공 약) 공격력은 별도 칸이 있으니 총합에 중복으로 더하지 마세요.",
      "공격 스킬과 스킬 레벨을 고릅니다. 스킬 데미지%는 레벨마다 다르므로 실제 찍은 레벨을 넣어야 합니다. 'M' 버튼을 누르면 마스터 레벨로 바로 설정됩니다.",
      "직업별 패시브/버프 칸(크리티컬 스로우, 샤프 아이즈, 엠플리피케이션, 콤보 어택, 메이플 용사 등)은 실제 레벨을 넣고, 안 쓰는 버프는 0으로 둡니다.",
      "몬스터를 검색해 고르면 HP·방어력·레벨·속성이 자동으로 들어갑니다. 결과 패널에서 최소/최대 데미지, 한방컷 확률, N방컷 분포를 확인합니다.",
    ],
    tips: [
      "결과가 체감보다 높게 나오면 대부분 스탯 칸에 순수 스탯만 넣고 장비 보정을 빼먹은 경우입니다. 반대로 낮게 나오면 버프 공격력이 빠진 경우가 많습니다.",
      "'빠른 저장'으로 캐릭터 세팅을 브라우저에 저장해 두면 다음에 몬스터만 바꿔가며 쓸 수 있습니다. 저장은 이 브라우저에만 남습니다.",
    ],
  },
  {
    name: "피격 데미지 계산기",
    href: "/calculator/damage",
    summary: "특정 몬스터에게 한 대 맞으면 HP가 얼마나 깎이는지, 한 방에 죽을 확률은 얼마인지 계산합니다.",
    steps: [
      "직업군과 직업, 레벨, 최대 HP를 넣습니다. 물리 방어력과 마법 방어력은 장비 포함 최종값입니다.",
      "직업을 고르면 피격 감소 스킬 칸이 나타납니다 — 마법사는 매직 가드·인빈서블·엘리멘트 레지스턴스, 도적은 메소 가드, 전사는 파워 가드·아킬레스, 에반은 매직 가드·매직 레지스턴스. 실제 스킬 레벨을 넣으세요.",
      "몬스터를 검색해 고르면 물리/마법 공격력이 자동으로 들어갑니다. 마법 공격을 하는 몬스터는 마법 피격도 함께 계산됩니다.",
      "결과는 범위로 나옵니다. 피격 데미지에는 랜덤 계수가 있어 한 값으로 고정되지 않기 때문입니다. '한 방 사망 확률'이 0%가 아니면 그 사냥터에서는 HP 물약 타이밍을 여유 있게 잡아야 합니다.",
    ],
    tips: [
      "마법사는 매직 가드가 켜져 있으면 결과가 'HP로 받는 양'으로 표시됩니다. MP가 바닥나면 전부 HP로 들어오니 MP 관리도 같이 보세요.",
      "일부 몬스터의 마법 공격력 데이터는 원작과 차이가 있을 수 있습니다. 결과가 실제와 크게 다르면 문의로 알려주세요.",
    ],
  },
  {
    name: "드랍 테이블",
    href: "/drop-table",
    summary: "몬스터가 무엇을 떨어뜨리는지, 아이템을 어떤 몬스터가 떨어뜨리는지 양방향으로 찾습니다.",
    steps: [
      "검색창에 몬스터 이름이나 아이템 이름을 넣습니다. 몬스터를 고르면 드랍 목록이, 아이템을 고르면 드랍하는 몬스터 목록이 나옵니다.",
      "확률은 퍼센트와 분수(예: 1/1,250) 두 가지로 표시됩니다. 분수는 '평균 몇 마리당 하나'라는 체감용 환산입니다.",
      "'정보 없음'은 확률 데이터가 없다는 뜻이지 드랍하지 않는다는 뜻이 아닙니다. 자세한 기준은 확률의 비밀 페이지에 있습니다.",
    ],
    tips: [
      "메이플 플래닛 드랍 테이블은 왼쪽 메뉴에서 플래닛으로 전환하면 따로 볼 수 있습니다. 확률이 4배로 반영돼 있고 플래닛 전용 드랍도 들어 있습니다.",
      "몬스터 상세 페이지에서는 드랍 외에 출현 맵, 스탯, 비슷한 레벨의 몬스터까지 함께 볼 수 있습니다.",
    ],
  },
  {
    name: "메랜 퀘스트",
    href: "/quests",
    summary: "메이플랜드 퀘스트를 이름·NPC·보상 아이템으로 찾고, 내 퀘스트에 담아 완료 체크를 관리합니다.",
    steps: [
      "검색창에 퀘스트명, NPC명, 보상 아이템명, 퀘스트 ID 중 아무거나 넣습니다. '최대 레벨' 칸에 내 레벨을 넣으면 지금 할 수 있는 퀘스트만 남습니다.",
      "퀘스트를 열면 시작/완료 NPC, 선행 조건, 필요 아이템, 보상이 나옵니다. '담기'로 내 퀘스트에 모아두고, 끝낸 것은 완료 체크합니다. '내 퀘스트만 보기'로 담아둔 것만 추려 볼 수 있습니다.",
    ],
    tips: [
      "완료 체크는 로그인하지 않아도 되지만, 그 경우 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우면 함께 사라집니다.",
    ],
  },
];

const commonMistakes = [
  "플래닛 캐릭터인데 메이플랜드 페이지에서 계산하는 경우 — 두 서버는 스킬 수치·드랍률·경험치가 다릅니다. 왼쪽 메뉴의 '메이플랜드 / 메이플 플래닛' 전환 스위치로 서버를 먼저 맞추세요. 어디가 다른지는 '메랜 vs 플래닛 차이' 페이지에 정리돼 있습니다.",
  "장비 숙련도 스킬(무기 마스터리 등)을 빼먹는 경우 — 최소 데미지가 크게 달라져 한방컷 확률이 뚝 떨어집니다. 전사·궁수·도적·해적은 숙련도 칸을 꼭 확인하세요.",
  "속성 몬스터에 속성 스킬을 쓰는 경우 — 약점이면 1.5배, 반감이면 0.5배, 면역이면 데미지가 0입니다. 계산기는 자동으로 반영하지만, 결과가 이상하면 몬스터 속성을 먼저 확인하세요.",
];

export default function GuidePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">사용방법</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">사용방법 (필독)</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-200/90 md:text-base">
          메랜Hub의 계산 결과는 입력값이 정확할 때만 정확합니다. 도구마다 어떤 값을 어디에 넣어야 하는지, 자주 틀리는
          입력이 무엇인지 정리했습니다. 처음 쓰신다면 한방컷 계산기부터 순서대로 따라 해보세요.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {tools.map((tool) => (
          <div key={tool.name} className="glass-panel rounded-2xl px-6 py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-100">{tool.name}</h2>
              <Link href={tool.href} className="text-sm font-semibold text-sky-200 hover:text-white">
                바로가기 →
              </Link>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-200/90">{tool.summary}</p>
            <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-slate-200/90">
              {tool.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <h3 className="mt-4 text-sm font-semibold text-amber-200/90">알아두면 좋은 것</h3>
            <ul className="mt-1.5 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-slate-200/80">
              {tool.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl px-6 py-5">
        <h2 className="text-base font-semibold text-slate-100">자주 틀리는 입력</h2>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-slate-200/90">
          {commonMistakes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="glass-panel rounded-2xl px-6 py-5">
        <h2 className="text-base font-semibold text-slate-100">도움이 필요하신가요?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-200/90">
          계산 방식 자체가 궁금하면{" "}
          <Link href="/probability" className="font-semibold text-violet-200 hover:text-white">
            확률의 비밀
          </Link>
          을, 오류 제보나 기능 제안은{" "}
          <Link href="/contact" className="font-semibold text-sky-200 hover:text-white">
            문의하기
          </Link>
          를 이용해 주세요. 잘못된 데이터를 알려주시면 출처를 다시 확인해 고칩니다.
        </p>
      </div>
    </section>
  );
}
