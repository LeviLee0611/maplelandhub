import { Panel } from "@/components/Panel";
import { MonsterSelect } from "@/components/MonsterSelect";
import type { Monster } from "@/types/monster";
import { formatNumber } from "@/lib/utils";

type MonsterPanelProps = {
  monsters: Monster[];
  value: string;
  onChange: (value: string) => void;
  selected: Monster | undefined;
};

export function MonsterPanel({ monsters, value, onChange, selected }: MonsterPanelProps) {
  return (
    <Panel title="Monster">
      <div className="space-y-3">
        <MonsterSelect monsters={monsters} value={value} onChange={onChange} />

        <div className="grid gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-100 md:grid-cols-[72px_1fr]">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md border border-white/10 bg-black/30 text-[10px] text-slate-400">
            {selected?.mobCode ? (
              <span>mob {selected.mobCode}</span>
            ) : (
              "no image"
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{selected?.name ?? "-"}</span>
              <span className="text-[11px] text-emerald-200">Lv. {selected?.level ?? 0}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>HP {formatNumber(selected?.hp ?? 0)}</div>
              <div>DEF {formatNumber(selected?.def ?? 0)}</div>
              <div>필요 명중 {formatNumber(selected?.needAcc ?? 0)}</div>
              <div>MDEF {formatNumber(selected?.mDef ?? 0)}</div>
              <div>EXP {formatNumber(selected?.exp ?? 0)}</div>
              <div>속성 {selected?.ele?.join(", ") ?? "없음"}</div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
