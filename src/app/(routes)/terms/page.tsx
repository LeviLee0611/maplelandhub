import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 이용약관 | 메이플랜드 계산기";
const description =
  "메랜Hub 서비스의 성격과 제공 정보의 한계, 이용자 유의사항, 저작권 및 면책 범위를 안내합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/terms",
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
 * 이용약관.
 *
 * 내용은 사이트가 실제로 하는 일에 맞춰 적는다 — Discord OAuth 로그인, 브라우저 로컬 저장을
 * 쓰는 퀘스트 진행 체크, Google Analytics·애드센스, maplestory.io 이미지 참조.
 * 하지 않는 일을 적거나 보장할 수 없는 것을 보장하면 약관으로서 의미가 없다.
 */

const LAST_UPDATED = "2026년 10월 1일";

type Section = { title: string; paragraphs: string[]; list?: string[] };

const sections: Section[] = [
  {
    title: "제1조 (서비스의 성격)",
    paragraphs: [
      "메랜Hub(이하 '본 사이트')는 메이플랜드와 메이플 플래닛 플레이어를 위해 개인이 운영하는 비공식 팬메이드 유틸리티입니다. 게임 개발사·운영사와 아무런 제휴 관계가 없으며, 공식 서비스가 아닙니다.",
      "본 사이트는 몬스터·아이템·퀘스트 데이터 조회와 각종 계산 도구를 무료로 제공합니다. 이용에 별도의 요금을 받지 않습니다.",
    ],
  },
  {
    title: "제2조 (제공 정보의 한계)",
    paragraphs: [
      "본 사이트가 제공하는 수치는 공개된 게임 데이터와 공식 패치노트, 외부 커뮤니티 자료를 수집·정리한 것입니다. 게임 내부의 실제 값과 다를 수 있습니다.",
    ],
    list: [
      "드랍 확률은 게임 내부 수치가 공개되지 않아 외부 수집값을 정리한 추정치입니다.",
      "확인되지 않은 항목은 임의의 값으로 채우지 않고 '정보 없음'으로 표시합니다.",
      "계산기 결과는 데미지 편차와 각종 보정을 모두 반영하지 못하므로 참고용 기준값입니다.",
      "게임 패치로 수치가 변경된 경우, 반영까지 시간이 걸릴 수 있습니다.",
    ],
  },
  {
    title: "제3조 (이용자의 책임)",
    paragraphs: [
      "이용자는 본 사이트의 정보가 참고용임을 이해하고 이용해야 합니다. 정보를 신뢰하여 내린 게임 내 판단(아이템 구매, 사냥터 선택, 스탯 분배 등)의 결과는 이용자 본인에게 귀속됩니다.",
      "이용자는 자동화된 방법으로 본 사이트에 과도한 부하를 주거나, 데이터를 대량으로 복제하여 재배포하는 행위를 해서는 안 됩니다.",
    ],
  },
  {
    title: "제4조 (계정과 저장 데이터)",
    paragraphs: [
      "일부 기능은 Discord 계정을 통한 로그인을 지원합니다. 로그인 없이도 대부분의 기능을 이용할 수 있습니다.",
      "퀘스트 진행 체크 등 일부 기록은 로그인하지 않은 경우 이용자의 브라우저에만 저장됩니다. 브라우저 데이터를 삭제하면 해당 기록도 함께 사라지며, 운영자가 이를 복구할 수 없습니다.",
      "개인정보의 수집과 이용에 관한 사항은 개인정보처리방침을 따릅니다.",
    ],
  },
  {
    title: "제5조 (저작권)",
    paragraphs: [
      "본 사이트에서 다루는 게임의 명칭, 이미지, 데이터 등 모든 지식재산권은 해당 권리자에게 있습니다. 본 사이트는 플레이어 편의를 위한 정보 제공 목적으로 이를 인용하고 있으며, 권리자의 요청이 있을 경우 해당 자료를 수정하거나 삭제합니다.",
      "몬스터 이미지 등 일부 리소스는 외부 서비스(maplestory.io)를 통해 표시되며, 본 사이트가 해당 리소스를 저장하거나 배포하지 않습니다.",
    ],
  },
  {
    title: "제6조 (광고)",
    paragraphs: [
      "본 사이트는 운영 비용을 충당하기 위해 Google 애드센스 등 제3자 광고를 게재할 수 있습니다. 광고 사업자는 이용자의 관심사에 기반한 광고를 제공하기 위해 쿠키를 사용할 수 있으며, 자세한 내용은 개인정보처리방침에서 확인하실 수 있습니다.",
      "광고 내용은 광고 사업자가 제공하는 것으로, 본 사이트는 광고에 표시된 상품이나 서비스에 대해 책임지지 않습니다.",
    ],
  },
  {
    title: "제7조 (서비스의 변경과 중단)",
    paragraphs: [
      "본 사이트는 개인이 운영하는 비영리에 가까운 서비스로, 사전 예고 없이 기능이 변경되거나 서비스가 중단될 수 있습니다. 이로 인해 발생한 불편에 대해 보상 책임을 지지 않습니다.",
    ],
  },
  {
    title: "제8조 (면책)",
    paragraphs: [
      "운영자는 본 사이트가 제공하는 정보의 정확성·완전성·최신성을 보증하지 않습니다. 정보의 오류나 누락, 서비스 중단으로 인해 발생한 손해에 대해 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.",
      "다만 잘못된 정보를 발견하여 알려주시면 확인 후 신속히 수정하고 있습니다.",
    ],
  },
  {
    title: "제9조 (약관의 변경)",
    paragraphs: [
      "본 약관은 서비스 내용이나 관련 법령의 변경에 따라 수정될 수 있으며, 변경 시 이 페이지에 게시합니다. 변경된 약관은 게시한 시점부터 적용됩니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">정책 안내</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">이용약관</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-200/90 md:text-base">
          메랜Hub는 메이플랜드와 메이플 플래닛 플레이어를 위한 비공식 팬메이드 유틸리티입니다. 본 약관은 서비스의
          성격과 제공 정보의 한계, 이용자 유의사항을 안내합니다.
        </p>
        <p className="mt-3 text-xs text-slate-300/70">최종 개정일: {LAST_UPDATED}</p>
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
        <h2 className="text-base font-semibold text-slate-100">문의</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-200/90">
          약관이나 서비스에 대한 문의, 잘못된 정보 제보는{" "}
          <Link href="/feedback" className="font-semibold text-amber-200 hover:text-white">
            문의/요청
          </Link>
          에서 남겨주세요. 개인정보 처리에 관한 사항은{" "}
          <Link href="/privacy" className="font-semibold text-sky-200 hover:text-white">
            개인정보처리방침
          </Link>
          을 참고해 주세요.
        </p>
      </div>
    </section>
  );
}
