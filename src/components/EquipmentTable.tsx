import { SpinnerInput } from "@/components/SpinnerInput";

export type EquipmentSlot = {
  id: string;
  name: string;
  str: number;
  dex: number;
  int: number;
  luk: number;
  atk: number;
  acc: number;
};

type NumericEquipmentField = Exclude<keyof EquipmentSlot, "id" | "name">;

type EquipmentTableProps = {
  slots: EquipmentSlot[];
  onChange: (next: EquipmentSlot[]) => void;
};

const inputClass =
  "retro-number w-full rounded-[3px] border border-[var(--retro-border)] bg-[var(--retro-cell)] px-1 py-1 text-center text-[11px] text-[color:var(--retro-text)] focus:border-[var(--retro-border-strong)] focus:outline-none";

export function EquipmentTable({ slots, onChange }: EquipmentTableProps) {
  const handleChange = (index: number, field: NumericEquipmentField, value: number) => {
    const next = slots.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, [field]: value } : slot,
    );
    onChange(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-[var(--retro-border)] text-xs text-[color:var(--retro-text)]">
        <thead className="text-[11px] text-[color:var(--retro-text-muted)]">
          <tr>
            <th className="border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2 py-2 text-left font-semibold">
              슬롯
            </th>
            <th className="border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2 py-2 text-center font-semibold">
              STR
            </th>
            <th className="border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2 py-2 text-center font-semibold">
              DEX
            </th>
            <th className="border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2 py-2 text-center font-semibold">
              INT
            </th>
            <th className="border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2 py-2 text-center font-semibold">
              LUK
            </th>
            <th className="border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2 py-2 text-center font-semibold">
              공/마
            </th>
            <th className="border border-[var(--retro-border)] bg-[var(--retro-cell-strong)] px-2 py-2 text-center font-semibold">
              명중
            </th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, index) => (
            <tr key={slot.id}>
              <td className="border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-2 text-left">
                {slot.name}
              </td>
              {(["str", "dex", "int", "luk", "atk", "acc"] as NumericEquipmentField[]).map((field) => (
                <td key={field} className="border border-[var(--retro-border)] bg-[var(--retro-cell)] px-2 py-1 text-center">
                  <SpinnerInput
                    value={slot[field]}
                    onChange={(value) => handleChange(index, field, value)}
                    min={0}
                    step={1}
                    className="w-16"
                    inputClassName={inputClass}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
