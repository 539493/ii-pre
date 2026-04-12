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
    <div className="flex flex-wrap gap-1">
      {TEMPLATES.map((t) => (
        <button
          key={t.label}
          onClick={() => onInsert(t.value)}
          title={t.desc}
          className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-mono text-foreground transition hover:bg-primary/20 hover:border-primary/30"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
