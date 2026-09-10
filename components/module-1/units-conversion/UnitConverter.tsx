"use client";

import { useState } from "react";

type UnitKey =
  | "mm"
  | "cm"
  | "m"
  | "n"
  | "kn"
  | "pa"
  | "kpa"
  | "mpa"
  | "nPerMm2"
  | "mm2"
  | "m2"
  | "nmm"
  | "knm";

type UnitDefinition = {
  label: string;
  category: string;
  factorToBase: number;
};

const unitDefinitions: Record<UnitKey, UnitDefinition> = {
  mm: { label: "mm", category: "Length", factorToBase: 1 },
  cm: { label: "cm", category: "Length", factorToBase: 10 },
  m: { label: "m", category: "Length", factorToBase: 1000 },
  n: { label: "N", category: "Force", factorToBase: 1 },
  kn: { label: "kN", category: "Force", factorToBase: 1000 },
  pa: { label: "Pa", category: "Stress", factorToBase: 1 },
  kpa: { label: "kPa", category: "Stress", factorToBase: 1000 },
  mpa: { label: "MPa", category: "Stress", factorToBase: 1000000 },
  nPerMm2: { label: "N/mm²", category: "Stress", factorToBase: 1000000 },
  mm2: { label: "mm²", category: "Area", factorToBase: 1 },
  m2: { label: "m²", category: "Area", factorToBase: 1000000 },
  nmm: { label: "N·mm", category: "Moment", factorToBase: 1 },
  knm: { label: "kN·m", category: "Moment", factorToBase: 1000000 },
};

const unitGroups: { label: string; units: UnitKey[] }[] = [
  { label: "Length", units: ["mm", "cm", "m"] },
  { label: "Force", units: ["n", "kn"] },
  { label: "Stress", units: ["pa", "kpa", "mpa", "nPerMm2"] },
  { label: "Area", units: ["mm2", "m2"] },
  { label: "Moment", units: ["nmm", "knm"] },
];

export function UnitConverter() {
  const [value, setValue] = useState("3.5");
  const [fromUnit, setFromUnit] = useState<UnitKey>("m");
  const [toUnit, setToUnit] = useState<UnitKey>("mm");
  const [result, setResult] = useState("3,500 mm");
  const [error, setError] = useState("");

  function convert() {
    const numericValue = Number(value);
    const from = unitDefinitions[fromUnit];
    const to = unitDefinitions[toUnit];

    if (!Number.isFinite(numericValue)) {
      setResult("");
      setError("Enter a valid number before converting.");
      return;
    }

    if (from.category !== to.category) {
      setResult("");
      setError("Choose units from the same quantity category.");
      return;
    }

    const convertedValue = (numericValue * from.factorToBase) / to.factorToBase;
    const formattedValue = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 6,
    }).format(convertedValue);

    setError("");
    setResult(`${formattedValue} ${to.label}`);
  }

  return (
    <section className="rounded-2xl border border-[var(--blue)]/25 bg-[var(--blue)]/5 p-5 sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--blue)]">
            Practice safely
          </p>
          <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
            Try Unit Conversion
          </h2>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Works within one quantity category</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <label className="block text-xs font-bold text-[var(--text-muted)]">
          Value
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--blue)]"
            aria-label="Value to convert"
          />
        </label>

        <label className="block text-xs font-bold text-[var(--text-muted)]">
          From Unit
          <UnitSelect value={fromUnit} onChange={setFromUnit} />
        </label>

        <label className="block text-xs font-bold text-[var(--text-muted)]">
          To Unit
          <UnitSelect value={toUnit} onChange={setToUnit} />
        </label>

        <button
          type="button"
          onClick={convert}
          className="min-h-11 rounded-lg bg-[var(--blue)] px-5 py-2 text-sm font-bold text-white hover:brightness-110"
        >
          Convert
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3" aria-live="polite">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Result</p>
        {error ? (
          <p className="mt-1 text-sm font-semibold text-[var(--orange)]">{error}</p>
        ) : (
          <p className="mt-1 text-xl font-extrabold text-[var(--blue)]">{result}</p>
        )}
      </div>
    </section>
  );
}

function UnitSelect({
  value,
  onChange,
}: {
  value: UnitKey;
  onChange: (value: UnitKey) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as UnitKey)}
      className="mt-2 block min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--blue)]"
    >
      {unitGroups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.units.map((unit) => (
            <option key={unit} value={unit}>
              {unitDefinitions[unit].label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
