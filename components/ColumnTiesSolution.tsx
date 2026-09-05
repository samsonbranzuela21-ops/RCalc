import { InlineKatex } from "@/components/Katex";
import type { ColumnTiesResult, DetailingCheck } from "@/lib/column-ties-check";

export function ColumnTiesSolution({ result }: { result: ColumnTiesResult }) {
  return <section id="column-ties-solution" className="mt-4 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
    <h2 className="text-[15px] font-extrabold">Full Manual Solution</h2>
    <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">Module 8 — Shear Analysis and Design of Columns Using NSCP 2015. Values are rounded for display; comparisons use full precision. Spacing is center to center unless labeled clear.</p>
    <div className="mt-4 space-y-4">{result.steps.map((step, index) => <SolutionCard key={step.title} number={index + 1} title={step.title} reference={step.reference} dataStep={index + 1}>
      {step.equations.map((equation, equationIndex) => <FormulaLine key={equationIndex} math={equation} />)}
      {step.notes.map((note, noteIndex) => <p key={noteIndex} className="break-words text-[10px] leading-relaxed text-[var(--text-muted)]">{note}</p>)}
      {step.checkIds.map((id) => <ColumnDetailCheck key={id} check={result.checks.find((check) => check.id === id)!} />)}
    </SolutionCard>)}</div>
  </section>;
}

export function ColumnDetailCheck({ check }: { check: DetailingCheck }) {
  const color = check.status === "PASS" ? "text-[var(--green)]" : check.status === "FAIL" ? "text-[var(--red)]" : "text-amber-600";
  return <div data-check={check.id} className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"><div className="flex items-start justify-between gap-3"><h3 className="text-[11px] font-semibold">{check.label}</h3><span className={`shrink-0 text-[10px] font-bold ${color}`}>{check.status}</span></div><p className="mt-2 text-[10px] leading-relaxed">{check.summary}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{check.reference}</p>{check.status !== "PASS" && <p className={`mt-2 text-[10px] leading-relaxed ${color}`}>{check.correction}</p>}</div>;
}

function SolutionCard({ number, title, reference, dataStep, children }: { number: number; title: string; reference?: string; dataStep: number; children: React.ReactNode }) {
  return <section data-column-step={dataStep} className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"><div className="flex items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-[9px] font-bold text-white">{number}</span><h3 className="text-[11px] font-semibold">{title}</h3></div>{reference && <p className="mt-1 pl-7 text-[10px] text-[var(--text-muted)]">{reference}</p>}<div className="mt-3 min-w-0 space-y-1.5 sm:pl-7">{children}</div></section>;
}

function FormulaLine({ math }: { math: string }) {
  return <div className="max-w-full overflow-x-auto rounded bg-[var(--bg-surface)] px-2 py-1.5 text-[11px] text-[var(--text)]"><InlineKatex math={math} /></div>;
}
