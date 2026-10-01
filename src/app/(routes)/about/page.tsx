import type { Metadata } from "next";
import Link from "next/link";

const title = "메랜Hub - 사이트 소개 | 메이플랜드 계산기";
const description =
  "메랜Hub가 어떤 데이터를 어디서 모아 어떻게 검증하는지, 메이플랜드와 메이플 플래닛을 어떻게 나눠 다루는지 설명합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/about",
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

export default function AboutPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="glass-panel rounded-3xl px-6 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-200/60">메랜Hub 소개</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100 md:text-3xl">사이트 소개</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-200/90 md:text-base">
          메랜Hub는 <strong className="text-slate-100">메이플랜드</strong>와{" "}
          <strong className="text-slate-100">메이플 플래닛</strong> 플레이어가 필요한 계산과 데이터를 한 번에 확인할 수
          있도록 만든 팬메이드 유틸리티입니다. 사냥터를 고르거나 장비를 맞출 때 몬스터 HP, 방어력, 드랍 아이템을
          찾아 여러 사이트를 오가야 했던 과정을 한 화면에서 끝내는 것이 목표입니다.
        </p>
      </div>

      <div className="glass-panel rounded-2xl px-6 py-6">
        <h2 className="text-lg font-semibold text-slate-100">무엇을 할 수 있나요</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-sky-200">N방컷 계산기</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200/90">
              직업과 스킬, 공격력을 입력하면 특정 몬스터를 몇 대에 잡는지 계산합니다. 몬스터의 물리/마법 방어력과
              스킬 데미지%를 함께 반영하므로, 사냥터를 옮기기 전에 한 방에 잡히는 구간인지 미리 확인할 수 있습니다.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-200">피격 데미지 계산기</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200/90">
              몬스터에게 맞았을 때 받는 피해를 추정합니다. 물리 방어력과 마법 저항을 적용해 계산하므로, 장비를
              바꿨을 때 생존력이 어떻게 달라지는지 비교해 볼 수 있습니다.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-violet-200">드랍 테이블</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200/90">
              몬스터 이름으로 그 몬스터가 떨구는 아이템을 찾고, 반대로 아이템 이름으로 그걸 떨구는 몬스터를 역으로
              찾는 양방향 검색을 지원합니다. 몬스터별 상세 페이지에서는 스탯, 속성 상성, 출현 맵까지 함께 확인할 수 있습니다.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-200">퀘스트</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200/90">
              NPC별로 퀘스트의 수행 조건과 보상을 정리했습니다. 진행 상황을 체크해 둘 수 있어 어디까지 했는지
              기억해 둘 필요가 없습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl px-6 py-6">
        <h2 className="text-lg font-semibold text-slate-100">데이터는 어떻게 모으나요</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-200/90">
          몬스터 스탯과 아이템 정보는 공개 게임 데이터(maplestory.io)를 기준으로 삼습니다. 여기에 각 서버가 발표하는{" "}
          <strong className="text-slate-100">공식 패치노트</strong>를 추적해 신규 지역·몬스터 추가나 밸런스 조정을
          반영합니다.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-200/90">
          한 곳의 값만 그대로 믿지 않습니다. 여러 커뮤니티 데이터베이스와 대조해 수치가 어긋나는 항목을 찾아내고,
          서로 다를 때는 어느 쪽이 맞는지 확인될 때까지 섣불리 바꾸지 않습니다. 근거가 한쪽뿐인 값은 반영을
          보류하고, 반영한 경우에도 출처와 수집 시점을 남겨 나중에 다시 검증할 수 있게 합니다.
        </p>

        <h3 className="mt-6 text-base font-semibold text-slate-100">두 서버를 나눠 다루는 이유</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-200/90">
          메이플랜드와 메이플 플래닛은 같은 원작을 기반으로 하지만, 각자 밸런스 패치를 해오면서 스킬 수치와 획득
          경험치, 드랍률이 달라졌습니다. 그래서 두 서버의 데이터를 따로 관리하고, 서버를 선택하면 그 서버 기준의
          값만 보여줍니다. 확인된 차이는{" "}
          <Link href="/mapleland-vs-planet" className="font-semibold text-sky-200 hover:text-white">
            메랜 vs 플래닛 차이
          </Link>{" "}
          페이지에 정리해 두었습니다.
        </p>
      </div>

      <div className="glass-panel rounded-2xl px-6 py-6">
        <h2 className="text-lg font-semibold text-slate-100">알아두실 점</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-slate-200/90">
          <li>
            <strong className="text-slate-100">드랍 확률은 참고용입니다.</strong> 게임 내부 수치가 공개되지 않아
            외부에서 수집한 값을 정리한 것이라 실제와 다를 수 있습니다.
          </li>
          <li>
            <strong className="text-slate-100">모르는 값은 비워 둡니다.</strong> 확인되지 않은 항목을 그럴듯한
            숫자로 채우지 않고 &ldquo;정보 없음&rdquo;으로 표시합니다.
          </li>
          <li>
            <strong className="text-slate-100">계산 결과는 추정치입니다.</strong> 실제 전투에는 데미지 편차와 각종
            보정이 작용하므로 기준값으로만 활용해 주세요.
          </li>
          <li>
            <strong className="text-slate-100">공식 서비스가 아닙니다.</strong> 메랜Hub는 플레이어가 만든 비공식
            유틸리티이며, 게임사와 관련이 없습니다.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-slate-200/90">
          잘못된 값이나 빠진 데이터를 발견하시면{" "}
          <Link href="/feedback" className="font-semibold text-amber-200 hover:text-white">
            문의/요청
          </Link>
          으로 알려주세요. 확인 후 반영하고 있습니다.
        </p>
      </div>

      <div className="glass-panel rounded-2xl px-5 py-5">
        <h2 className="text-base font-semibold text-slate-100">바로가기</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/calculators/onehit" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            N방컷 계산기
          </Link>
          <Link href="/calculator/damage" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            피격 데미지 계산기
          </Link>
          <Link href="/drop-table" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            드랍 테이블
          </Link>
        </div>
      </div>
    </section>
  );
}
