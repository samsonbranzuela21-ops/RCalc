import { InlineKatex } from "@/components/Katex";
import type {
  ColumnInteractionInput,
  ColumnInteractionResult,
  InteractionPoint,
} from "@/lib/column-interaction";

interface ColumnInteractionSolutionProps {
  input: ColumnInteractionInput;
  result: ColumnInteractionResult;
}

function n(value: number, digits = 3) {
  if (!Number.isFinite(value)) return "\\infty";
  return value.toFixed(digits);
}

export function ColumnInteractionSolution({
  input,
  result,
}: ColumnInteractionSolutionProps) {
  return (
    <section className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
      <h2 className="text-[15px] font-extrabold">Full Manual Solution</h2>
      <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">
        Compression is positive. Distances are measured downward from the top
        compression face. Every steel layer is checked separately by strain
        compatibility.
      </p>

      <div className="mt-4 space-y-4">
        <SolutionCard number={1} title="Given data and section properties">
          <FormulaLine
            math={`b=${n(input.b, 0)}\\,\\text{mm},\\quad h=${n(input.h, 0)}\\,\\text{mm},\\quad f'_c=${n(input.fc)}\\,\\text{MPa}`}
          />
          <FormulaLine
            math={`f_y=${n(input.fy)}\\,\\text{MPa},\\quad E_s=${n(input.Es, 0)}\\,\\text{MPa},\\quad \\varepsilon_{cu}=0.003`}
          />
          <FormulaLine math="A_g=bh" />
          <FormulaLine
            math={`A_g=(${n(input.b, 0)})(${n(input.h, 0)})=${n(result.Ag)}\\,\\text{mm}^2`}
            muted
          />

          {result.layers.map((layer, index) => (
            <div key={layer.id} className="mt-2">
              <FormulaLine
                math={`A_{s${index + 1}}=N_{${index + 1}}\\frac{\\pi d_{b${index + 1}}^2}{4}`}
              />
              <FormulaLine
                math={`A_{s${index + 1}}=(${layer.count})\\frac{\\pi(${n(layer.diameter)})^2}{4}=${n(layer.area)}\\,\\text{mm}^2,\\quad y_{${index + 1}}=${n(layer.y)}\\,\\text{mm}`}
                muted
              />
            </div>
          ))}

          <FormulaLine math="A_{st}=\\sum A_{si}" />
          <FormulaLine
            math={`A_{st}=${result.layers.map((layer) => n(layer.area)).join("+")}=${n(result.Ast)}\\,\\text{mm}^2`}
            muted
          />
          <FormulaLine
            math={`\\rho_g=\\frac{A_{st}}{A_g}=\\frac{${n(result.Ast)}}{${n(result.Ag)}}=${n(result.rho, 5)}=${n(result.rho * 100, 2)}\\%`}
            result
          />
        </SolutionCard>

        <SolutionCard number={2} title="Material parameters">
          <p className="rounded-md bg-[var(--bg-surface)] px-2 py-1.5 text-[10px] leading-relaxed text-[var(--text-muted)]">
            β₁ defines the equivalent rectangular compression-block depth,
            a = β₁c. It is 0.85 for f&apos;c ≤ 28 MPa and reduces for stronger
            concrete, but never below 0.65.
          </p>
          <FormulaLine
            math="\\beta_1=\\begin{cases}0.85, & f'_c\\leq28\\,\\text{MPa}\\\\ \\max\\left[0.65,\\;0.85-0.05\\left(\\frac{f'_c-28}{7}\\right)\\right], & f'_c>28\\,\\text{MPa}\\end{cases}"
          />
          <FormulaLine
            math={`\\beta_1=${n(result.beta1, 3)}`}
            result
          />
          <FormulaLine math="\\varepsilon_y=\\frac{f_y}{E_s}" />
          <FormulaLine
            math={`\\varepsilon_y=\\frac{${n(input.fy)}}{${n(input.Es, 0)}}=${n(result.epsilonY, 6)}`}
            result
          />
        </SolutionCard>

        {result.keyPoints.map((point, index) => (
          <PointSolution
            key={point.key}
            number={index + 3}
            point={point}
            input={input}
            result={result}
          />
        ))}

        <SolutionCard number={result.keyPoints.length + 3} title="Applied load check">
          <FormulaLine
            math={`P_u=${n(input.Pu)}\\,\\text{kN},\\quad |M_u|=${n(Math.abs(input.Mu))}\\,\\text{kN}\\cdot\\text{m}`}
          />
          {result.eccentricity !== null && (
            <>
              <FormulaLine math="e=\\frac{M_u}{P_u}" />
              <FormulaLine
                math={`e=\\frac{${n(input.Mu)}(10^3)}{${n(input.Pu)}}=${n(result.eccentricity)}\\,\\text{mm}`}
                muted
              />
            </>
          )}
          {result.demandMomentCapacity !== null ? (
            <>
              <FormulaLine
                math={`\\phi M_{n,\\,capacity}=${n(result.demandMomentCapacity)}\\,\\text{kN}\\cdot\\text{m}`}
              />
              <FormulaLine math="DCR=\\frac{|M_u|}{\\phi M_{n,\\,capacity}}" />
              <FormulaLine
                math={`DCR=\\frac{${n(Math.abs(input.Mu))}}{${n(result.demandMomentCapacity)}}=${n(result.demandRatio ?? 0, 3)}`}
                muted
              />
              <FormulaLine
                math={
                  result.status === "SAFE"
                    ? `DCR=${n(result.demandRatio ?? 0, 3)}\\leq1.0\\quad\\therefore\\quad\\text{SAFE}`
                    : `DCR=${n(result.demandRatio ?? 0, 3)}>1.0\\quad\\therefore\\quad\\text{NOT SAFE}`
                }
                result={result.status === "SAFE"}
                danger={result.status !== "SAFE"}
              />
            </>
          ) : (
            <FormulaLine
              math="P_u\\text{ is outside the calculated design interaction range.}"
              danger
            />
          )}
        </SolutionCard>
      </div>
    </section>
  );
}

function PointSolution({
  number,
  point,
  input,
  result,
}: {
  number: number;
  point: InteractionPoint;
  input: ColumnInteractionInput;
  result: ColumnInteractionResult;
}) {
  if (point.key === "A") {
    return (
      <SolutionCard number={number} title="Point A — Pure axial compression">
        <FormulaLine math="P_o=0.85f'_c(A_g-A_{st})+f_yA_{st}" />
        <FormulaLine
          math={`P_o=\\frac{0.85(${n(input.fc)})[${n(result.Ag)}-${n(result.Ast)}]+(${n(input.fy)})(${n(result.Ast)})}{10^3}`}
          muted
        />
        <FormulaLine math={`P_o=${n(result.Po)}\\,\\text{kN}`} result />
        <FormulaLine math="\\phi P_{n,max}=0.80(0.65)P_o" />
        <FormulaLine
          math={`\\phi P_{n,max}=0.80(0.65)(${n(result.Po)})=${n(result.maxDesignAxial)}\\,\\text{kN}`}
          result
        />
        <FormulaLine math="M_n=0,\\quad \\phi M_n=0" />
        <Coordinate point={point} />
      </SolutionCard>
    );
  }

  if (point.key === "G") {
    return (
      <SolutionCard number={number} title="Point G — Pure axial tension">
        <FormulaLine math="P_n=-f_yA_{st}" />
        <FormulaLine
          math={`P_n=-\\frac{(${n(input.fy)})(${n(result.Ast)})}{10^3}=${n(point.Pn)}\\,\\text{kN}`}
          muted
        />
        <FormulaLine math="\\varepsilon_t\\geq0.005\\quad\\Rightarrow\\quad\\phi=0.90" />
        <FormulaLine
          math={`\\phi P_n=0.90(${n(point.Pn)})=${n(point.phiPn)}\\,\\text{kN}`}
          result
        />
        <FormulaLine math="M_n=0,\\quad \\phi M_n=0" />
        <Coordinate point={point} />
      </SolutionCard>
    );
  }

  return (
    <SolutionCard number={number} title={`Point ${point.key} — ${point.label}`}>
      <NeutralAxisCalculation point={point} result={result} />

      <FormulaLine math="a=\\beta_1c" />
      <FormulaLine
        math={`a=(${n(result.beta1, 3)})(${n(point.c ?? 0)})=${n(point.a)}\\,\\text{mm}`}
        muted
      />

      <FormulaLine math="C_c=0.85f'_cba" />
      <FormulaLine
        math={`C_c=\\frac{0.85(${n(input.fc)})(${n(input.b, 0)})(${n(point.a)})}{10^3}=${n(point.concreteForce)}\\,\\text{kN}`}
        muted
      />
      <FormulaLine math="M_c=C_c\\left(\\frac{h}{2}-\\frac{a}{2}\\right)" />
      <FormulaLine
        math={`M_c=(${n(point.concreteForce)})\\left(\\frac{${n(input.h, 0)}}{2}-\\frac{${n(point.a)}}{2}\\right)\\frac{1}{10^3}=${n(point.concreteMoment)}\\,\\text{kN}\\cdot\\text{m}`}
        muted
      />

      <div className="mt-3 rounded-md border border-[var(--border)] p-2 sm:p-3">
        <p className="mb-2 text-[10px] font-bold">Steel-layer calculations</p>
        <div className="space-y-3">
          {point.layerStates.map((layer, index) => (
            <div key={layer.id} className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
              <p className="mb-1 text-[10px] font-semibold text-[var(--text)]">
                Layer {index + 1}: {layer.count}–{n(layer.diameter, 0)} mm bars at y = {n(layer.y)} mm
              </p>
              <FormulaLine math={`\\varepsilon_{s${index + 1}}=0.003\\left(\\frac{c-y_{${index + 1}}}{c}\\right)`} />
              <FormulaLine
                math={`\\varepsilon_{s${index + 1}}=0.003\\left(\\frac{${n(point.c ?? 0)}-${n(layer.y)}}{${n(point.c ?? 0)}}\\right)=${n(layer.strain, 6)}`}
                muted
              />
              <FormulaLine math={`f_{s${index + 1}}=E_s\\varepsilon_{s${index + 1}},\\quad -f_y\\leq f_s\\leq f_y`} />
              <FormulaLine
                math={`f_{s${index + 1}}=\\operatorname{limit}[(${n(input.Es, 0)})(${n(layer.strain, 6)})]=${n(layer.stress)}\\,\\text{MPa}`}
                muted
              />
              <FormulaLine
                math={
                  layer.insideCompressionBlock
                    ? `F_{s${index + 1}}=(f_{s${index + 1}}-0.85f'_c)A_{s${index + 1}}`
                    : `F_{s${index + 1}}=f_{s${index + 1}}A_{s${index + 1}}`
                }
              />
              <FormulaLine
                math={
                  layer.insideCompressionBlock
                    ? `F_{s${index + 1}}=\\frac{[${n(layer.stress)}-0.85(${n(input.fc)})](${n(layer.area)})}{10^3}=${n(layer.force)}\\,\\text{kN}`
                    : `F_{s${index + 1}}=\\frac{(${n(layer.stress)})(${n(layer.area)})}{10^3}=${n(layer.force)}\\,\\text{kN}`
                }
                muted
              />
              <FormulaLine
                math={`M_{s${index + 1}}=F_{s${index + 1}}\\left(\\frac{h}{2}-y_{${index + 1}}\\right)=${n(layer.moment)}\\,\\text{kN}\\cdot\\text{m}`}
                muted
              />
            </div>
          ))}
        </div>
      </div>

      <FormulaLine math="P_n=C_c+\\sum F_{si}" />
      <FormulaLine
        math={`P_n=${n(point.concreteForce)}+(${point.layerStates.map((layer) => n(layer.force)).join(")+( ")})=${n(point.Pn)}\\,\\text{kN}`}
        muted
      />
      <FormulaLine math="M_n=\\left|M_c+\\sum M_{si}\\right|" />
      <FormulaLine
        math={`M_n=\\left|${n(point.concreteMoment)}+(${point.layerStates.map((layer) => n(layer.moment)).join(")+( ")})\\right|=${n(point.Mn)}\\,\\text{kN}\\cdot\\text{m}`}
        muted
      />

      <PhiCalculation point={point} result={result} />
      <FormulaLine
        math={`\\phi P_n=${n(point.phi)}(${n(point.Pn)})=${n(point.phiPn)}\\,\\text{kN}`}
        result
      />
      <FormulaLine
        math={`\\phi M_n=${n(point.phi)}(${n(point.Mn)})=${n(point.phiMn)}\\,\\text{kN}\\cdot\\text{m}`}
        result
      />
      <Coordinate point={point} />
    </SolutionCard>
  );
}

function NeutralAxisCalculation({
  point,
  result,
}: {
  point: InteractionPoint;
  result: ColumnInteractionResult;
}) {
  if (point.key === "D") {
    return (
      <>
        <FormulaLine math="c_b=\\frac{0.003d}{0.003+\\varepsilon_y}" />
        <FormulaLine
          math={`c_b=\\frac{0.003(${n(result.d)})}{0.003+${n(result.epsilonY, 6)}}=${n(point.c ?? 0)}\\,\\text{mm}`}
          muted
        />
      </>
    );
  }
  if (point.key === "D.5" || point.key === "E") {
    const target = point.key === "D.5" ? 0.004 : 0.005;
    return (
      <>
        <FormulaLine math={`c=\\frac{0.003d}{0.003+${target.toFixed(3)}}`} />
        <FormulaLine
          math={`c=\\frac{0.003(${n(result.d)})}{0.003+${target.toFixed(3)}}=${n(point.c ?? 0)}\\,\\text{mm}`}
          muted
        />
      </>
    );
  }
  return (
    <>
      <FormulaLine math="\\text{For pure bending, solve }P_n(c)=C_c+\\sum F_{si}=0" />
      <FormulaLine
        math={`\\text{By iteration: }c=${n(point.c ?? 0)}\\,\\text{mm},\\quad P_n=${n(point.Pn, 4)}\\,\\text{kN}\\approx0`}
        muted
      />
    </>
  );
}

function PhiCalculation({
  point,
  result,
}: {
  point: InteractionPoint;
  result: ColumnInteractionResult;
}) {
  if (point.epsilonT <= result.epsilonY) {
    return (
      <FormulaLine
        math={`\\varepsilon_t=${n(point.epsilonT, 6)}\\leq\\varepsilon_y=${n(result.epsilonY, 6)}\\quad\\Rightarrow\\quad\\phi=0.65`}
      />
    );
  }
  if (point.epsilonT >= 0.005) {
    return (
      <FormulaLine
        math={`\\varepsilon_t=${n(point.epsilonT, 6)}\\geq0.005\\quad\\Rightarrow\\quad\\phi=0.90`}
      />
    );
  }
  return (
    <>
      <FormulaLine math="\\phi=0.65+0.25\\left(\\frac{\\varepsilon_t-\\varepsilon_y}{0.005-\\varepsilon_y}\\right)" />
      <FormulaLine
        math={`\\phi=0.65+0.25\\left(\\frac{${n(point.epsilonT, 6)}-${n(result.epsilonY, 6)}}{0.005-${n(result.epsilonY, 6)}}\\right)=${n(point.phi, 3)}`}
        muted
      />
    </>
  );
}

function Coordinate({ point }: { point: InteractionPoint }) {
  return (
    <FormulaLine
      math={`\\boxed{(\\phi M_n,\\phi P_n)=(${n(point.phiMn)}\\,\\text{kN}\\cdot\\text{m},\\ ${n(point.phiPn)}\\,\\text{kN})}`}
      result
    />
  );
}

function SolutionCard({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-[9px] font-bold text-white">
          {number}
        </span>
        <h3 className="text-[11px] font-semibold">{title}</h3>
      </div>
      <div className="mt-3 min-w-0 space-y-1.5 sm:pl-7">{children}</div>
    </div>
  );
}

function FormulaLine({
  math,
  muted = false,
  result = false,
  danger = false,
}: {
  math: string;
  muted?: boolean;
  result?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`max-w-full overflow-x-auto rounded px-2 py-1.5 text-[11px] ${
        danger
          ? "bg-red-500/10 text-red-500"
          : result
            ? "bg-green-500/10 text-green-500"
            : muted
              ? "text-[var(--text-muted)]"
              : "bg-[var(--bg-surface)] text-[var(--text)]"
      }`}
    >
      <InlineKatex math={math} />
    </div>
  );
}
