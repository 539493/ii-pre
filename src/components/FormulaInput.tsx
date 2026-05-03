import { useState } from "react";

interface Props {
  onInsert: (formula: string) => void;
}

const FRACTION_TEMPLATE = "▢/▢";
const POWER_TEMPLATE = "▢^▢";
const SQRT_TEMPLATE = "√(▢)";
const TEMPLATES = [
  { label: "a/b", value: FRACTION_TEMPLATE, desc: "Дробь" },
  { label: "x²", value: POWER_TEMPLATE, desc: "Степень" },
  { label: "√x", value: SQRT_TEMPLATE, desc: "Корень" },
  { label: "±", value: "±", desc: "Плюс-минус" },
  { label: "≤", value: "≤", desc: "Меньше или равно" },
  { label: "≥", value: "≥", desc: "Больше или равно" },
  { label: "≠", value: "≠", desc: "Не равно" },
  { label: "π", value: "π", desc: "Пи" },
  { label: "∞", value: "∞", desc: "Бесконечность" },
];

export default function FormulaInput({ onInsert }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TEMPLATES.map((t) => (
        <button
          key={t.label}
          onClick={() => onInsert(t.value)}
          title={t.desc}
          className="rounded-[12px] border border-[#e7e1d8] bg-[#fcfbf8] px-2.5 py-1.5 text-[11px] font-mono text-[#28416d] transition hover:border-[#d5e3ff] hover:bg-[#eef4ff] hover:text-[#2563eb]"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
