"use client";

import { useState, type FormEvent } from "react";
import { ColumnInteractionDiagram } from "@/components/ColumnInteractionDiagram";
import { ColumnInteractionSolution } from "@/components/ColumnInteractionSolution";
import { calculateColumnInteraction, type ColumnInteractionInput, type ColumnInteractionResult } from "@/lib/column-interaction";

type NumericField = Exclude<keyof ColumnInteractionInput, "layers">;
type DraftLayer = { id: string; count: string; diameter: string; y: string };
type DraftInput = Record<NumericField, string> & { layers: DraftLayer[] };

const exampleInput: DraftInput = {
  b: "300", h: "500", fc: "28", fy: "420", Es: "200000", Pu: "900", Mu: "120",
  layers: [
    { id: "top", count: "3", diameter: "25", y: "50" },
    { id: "middle", count: "2", diameter: "25", y: "250" },
    { id: "bottom", count: "3", diameter: "25", y: "450" },
  ],
};

const fieldGroups: Array<{ title: string; fields: Array<{ name: NumericField; label: string; unit: string; step?: string }> }> = [
  { title: "Section", fields: [
    { name: "b", label: "Width, b", unit: "mm" },
    { name: "h", label: "Depth, h", unit: "mm" },
  ] },
  { title: "Materials", fields: [
    { name: "fc", label: "Concrete strength, f'c", unit: "MPa", step: "0.1" },
    { name: "fy", label: "Steel yield strength, fy", unit: "MPa" },
    { name: "Es", label: "Steel modulus, Es", unit: "MPa" },
  ] },
  { title: "Factored demand", fields: [
    { name: "Pu", label: "Axial load, Pu", unit: "kN", step: "0.1" },
    { name: "Mu", label: "Moment, Mu", unit: "kN·m", step: "0.1" },
  ] },
];

export default function ColumnInteractionPage() {
  const [draft, setDraft] = useState<DraftInput>(exampleInput);
  const [result, setResult] = useState<ColumnInteractionResult | null>(null);
  const [solvedInput, setSolvedInput] = useState<ColumnInteractionInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextLayerId, setNextLayerId] = useState(1);

  function updateField(name: NumericField, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function updateLayer(id: string, field: keyof Omit<DraftLayer, "id">, value: string) {
    setDraft((current) => ({ ...current, layers: current.layers.map((layer) =>
      layer.id === id ? { ...layer, [field]: value } : layer
    ) }));
  }

  function addLayer() {
    const id = `layer-${nextLayerId}`;
    setNextLayerId((value) => value + 1);
    setDraft((current) => ({ ...current, layers: [
      ...current.layers,
      { id, count: "2", diameter: "20", y: String(Number(current.h) / 2 || 250) },
    ] }));
  }

  function removeLayer(id: string) {
    setDraft((current) => ({ ...current, layers: current.layers.filter((layer) => layer.id !== id) }));
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: ColumnInteractionInput = {
      b: Number(draft.b), h: Number(draft.h), fc: Number(draft.fc), fy: Number(draft.fy),
      Es: Number(draft.Es), Pu: Number(draft.Pu), Mu: Number(draft.Mu),
      layers: draft.layers.map((layer) => ({
        id: layer.id, count: Number(layer.count), diameter: Number(layer.diameter), y: Number(layer.y),
      })),
    };
    try {
      const calculatedResult = calculateColumnInteraction(input);
      setSolvedInput(input);
      setResult(calculatedResult);
      setError(null);
    } catch (calculationError) {
      setError(calculationError instanceof Error
        ? calculationError.message
        : "The calculation could not be completed. Check the entered values.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">Column P-M Interaction</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Enter a column problem, calculate it, then change the values to solve the next one.
        </p>

        <form onSubmit={calculate} className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-3">
            {fieldGroups.map((group) => (
              <fieldset key={group.title} className="min-w-0">
                <legend className="mb-3 text-sm font-bold">{group.title}</legend>
                <div className="space-y-3">
                  {group.fields.map((field) => (
                    <NumberInput key={field.name} id={field.name} label={field.label} unit={field.unit}
                      step={field.step} value={draft[field.name]}
                      onChange={(value) => updateField(field.name, value)} />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <fieldset aria-labelledby="reinforcement-layers-heading" className="mt-6 border-t border-[var(--border)] pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="reinforcement-layers-heading" className="text-sm font-bold">Reinforcement layers</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">y is measured from the top compression face.</p>
              </div>
              <button type="button" onClick={addLayer}
                className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold hover:bg-[var(--bg-hover)]">
                + Add layer
              </button>
            </div>

            <div className="space-y-3">
              {draft.layers.map((layer, index) => (
                <div key={layer.id}
                  className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-end">
                  <span className="self-center text-xs font-bold text-[var(--text-muted)]">{index + 1}</span>
                  <NumberInput id={`${layer.id}-count`} label="Number of bars" unit="bars" step="1" min="1"
                    value={layer.count} onChange={(value) => updateLayer(layer.id, "count", value)} />
                  <NumberInput id={`${layer.id}-diameter`} label="Bar diameter" unit="mm"
                    value={layer.diameter} onChange={(value) => updateLayer(layer.id, "diameter", value)} />
                  <NumberInput id={`${layer.id}-y`} label="Layer position, y" unit="mm"
                    value={layer.y} onChange={(value) => updateLayer(layer.id, "y", value)} />
                  <button type="button" onClick={() => removeLayer(layer.id)}
                    aria-label={`Remove reinforcement layer ${index + 1}`}
                    className="rounded-md border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </fieldset>

          {error && <p role="alert" className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}
          <button type="submit"
            className="mt-5 w-full rounded-md bg-[var(--orange)] px-4 py-2.5 font-semibold text-white sm:w-auto">
            Calculate problem
          </button>
        </form>

        <div className="mt-6">
          <ColumnInteractionDiagram result={result} Pu={solvedInput?.Pu ?? 0} Mu={solvedInput?.Mu ?? 0} />
        </div>
        {result && solvedInput && <ColumnInteractionSolution input={solvedInput} result={result} />}
      </div>
    </main>
  );
}

function NumberInput({ id, label, unit, value, onChange, step = "any", min }: {
  id: string; label: string; unit: string; value: string; onChange: (value: string) => void; step?: string; min?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">{label}</span>
      <span className="flex overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg)] focus-within:border-[var(--orange)]">
        <input id={id} type="number" inputMode="decimal" required step={step} min={min} value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
        <span className="flex min-w-14 items-center justify-center border-l border-[var(--border)] px-2 text-xs text-[var(--text-muted)]">{unit}</span>
      </span>
    </label>
  );
}
