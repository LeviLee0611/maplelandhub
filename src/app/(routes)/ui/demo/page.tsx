import { Panel } from "@/components/ui/Panel";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { TableGrid } from "@/components/ui/TableGrid";
import { LabelCell, ValueCell, ValueCellMuted } from "@/components/ui/Cells";

export default function UiDemoPage() {
  return (
    <div className="min-h-screen bg-[var(--retro-bg)] text-[color:var(--retro-text)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <div className="border border-[var(--retro-border-strong)]">
          <div className="bg-[var(--retro-header-blue)] px-3 py-2 text-xs font-semibold tracking-[0.08em]">
            메이플랜드 캐릭터 스탯창
          </div>
        </div>

        <Panel>
          <PanelHeader tone="blue">캐릭터 정보</PanelHeader>
          <TableGrid columns={4}>
            <LabelCell>닉네임</LabelCell>
            <ValueCell>폴라베어</ValueCell>
            <LabelCell>직업</LabelCell>
            <ValueCell>궁수</ValueCell>

            <LabelCell>레벨</LabelCell>
            <ValueCell>Lv. 72</ValueCell>
            <LabelCell>길드</LabelCell>
            <ValueCell>바다바람</ValueCell>

            <LabelCell>서버</LabelCell>
            <ValueCell>메이플랜드 1</ValueCell>
            <LabelCell>랭킹</LabelCell>
            <ValueCell>1,248위</ValueCell>
          </TableGrid>
        </Panel>

        <Panel>
          <PanelHeader tone="green">기본 스탯</PanelHeader>
          <TableGrid columns={4}>
            <LabelCell>힘</LabelCell>
            <ValueCell>92</ValueCell>
            <LabelCell>민첩</LabelCell>
            <ValueCell>286</ValueCell>

            <LabelCell>지력</LabelCell>
            <ValueCell>33</ValueCell>
            <LabelCell>운</LabelCell>
            <ValueCell>54</ValueCell>

            <LabelCell>HP</LabelCell>
            <ValueCell>3,842</ValueCell>
            <LabelCell>MP</LabelCell>
            <ValueCell>1,205</ValueCell>
          </TableGrid>
        </Panel>

        <Panel>
          <PanelHeader tone="yellow">전투 스탯</PanelHeader>
          <TableGrid columns={4}>
            <LabelCell>공격력</LabelCell>
            <ValueCellMuted>1,252</ValueCellMuted>
            <LabelCell>방어력</LabelCell>
            <ValueCellMuted>482</ValueCellMuted>

            <LabelCell>명중</LabelCell>
            <ValueCellMuted>318</ValueCellMuted>
            <LabelCell>회피</LabelCell>
            <ValueCellMuted>165</ValueCellMuted>

            <LabelCell>이동속도</LabelCell>
            <ValueCellMuted>125%</ValueCellMuted>
            <LabelCell>점프력</LabelCell>
            <ValueCellMuted>110%</ValueCellMuted>
          </TableGrid>
        </Panel>

        <Panel>
          <PanelHeader tone="blue">스킬 정보</PanelHeader>
          <TableGrid columns={2}>
            <LabelCell>주력 스킬</LabelCell>
            <ValueCell>애로우 샤워</ValueCell>
            <LabelCell>보조 스킬</LabelCell>
            <ValueCell>포커스</ValueCell>
            <LabelCell>버프 스킬</LabelCell>
            <ValueCell>부스터</ValueCell>
            <LabelCell>스킬 레벨</LabelCell>
            <ValueCell>8 / 20</ValueCell>
          </TableGrid>
          <div className="flex items-center justify-between border-t border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-3 py-2 text-[11px] text-[color:var(--retro-text-muted)]">
            <span>최근 사용 스킬 3개 표시</span>
            <span className="border border-[var(--retro-border)] bg-[var(--retro-bg)] px-2 py-0.5 text-[10px] text-[color:var(--retro-text)]">
              상태: 안정
            </span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
