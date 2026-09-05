import type { ReactNode } from "react";
import { InlineKatex } from "@/components/Katex";
import { MOMENT_TABLE, type OneWaySlabInput, type OneWaySlabResult, type ReinforcementDesign } from "@/lib/one-way-slab";

const f = (value: number, digits = 3) => value.toFixed(digits);
const math = String.raw;

export function OneWaySlabSolution({ input: i, result: r }: { input: OneWaySlabInput; result: OneWaySlabResult }) {
  const st = r.distribution;
  const perLocation = (render: (design: ReinforcementDesign) => ReactNode) => r.designs.map((item) => <div key={item.id} className="mt-3 min-w-0"><h4 className="mb-2 text-xs font-semibold text-[var(--green)]">{item.location}</h4>{render(item)}</div>);
  const minimumFormula = i.fy < 420 ? math`\rho_{min}=0.002` : math`\rho_{min}=\max\left(0.0018\frac{420}{f_y},0.0014\right)`;
  return (
    <section id="one-way-slab-solution" className="min-w-0 space-y-3">
      <h2 className="text-lg font-bold">Full Manual Solution</h2>
      <p className="text-xs text-[var(--text-muted)]">All steel areas and moments below are for the {i.stripWidth} mm design strip. Negative moments are shown as magnitudes; top bars resist them. Values displayed are rounded; calculations use full precision.</p>
      <Card number={1} title="Given data">
        <Equation value={math`f'_c=${i.fc}\,\text{MPa},\quad f_y=${i.fy}\,\text{MPa},\quad E_s=${i.Es}\,\text{MPa}`} />
        <Equation value={math`\gamma_c=${i.concreteUnitWeight}\,\text{kN/m}^3,\quad b=${i.stripWidth}\,\text{mm},\quad h=${i.h}\,\text{mm}`} />
        <Equation value={math`c_{cover}=${i.cover}\,\text{mm},\quad d_b=${i.barDiameter}\,\text{mm},\quad d_{b,ST}=${i.distributionBarDiameter}\,\text{mm},\quad d_{agg}=${i.aggregateSize}\,\text{mm}`} />
        <p>Normalweight, nonprestressed, prismatic continuous slab; uniform gravity loading. Main bars are nearest the tension face. {i.spanCount} continuous spans.</p>
      </Card>
      <Card number={2} title={i.geometryMode === "strip" ? "Given beam spacing and derived clear span" : "Floor-system and panel dimensions"}>
        {i.geometryMode === "strip" ? <>
          <Equation value={math`L_{centers}=${i.panelLength}\,\text{m},\quad b_{beam}=${i.beamWidth}\,\text{mm}`} />
          <Equation value={math`L_n=L_{centers}-b_{beam}/1000=${i.panelLength}-${i.beamWidth}/1000=${f(i.span)}\,\text{m}`} />
          <p>Equal beam widths. The clear span is calculated automatically from the dimensions in the figure.</p>
        </> : <>
        <Equation value={math`L_{floor}=${i.floorLength}\,\text{m},\quad W_{floor}=${i.floorWidth}\,\text{m}`} />
        <Equation value={math`L_{panel}=${i.panelLength}\,\text{m},\quad W_{panel}=${i.panelWidth}\,\text{m}`} />
        <p>Panel dimensions are measured between support centers; clear spans are entered separately.</p>
        </>}
      </Card>
      <Card number={3} title={i.geometryMode === "strip" ? "Design strip" : "Floor-system area"}>{i.geometryMode === "strip" ? <><Equation value={math`b=1000\,\text{mm}=1\,\text{m}`} /><p>The problem gives a slab section, so a one-metre-wide strip is designed. Total floor area is not required or assumed.</p></> : <Equation value={math`A_{floor}=L_{floor}W_{floor}=(${i.floorLength})(${i.floorWidth})=${f(r.floorArea)}\,\text{m}^2`} />}</Card>
      <Card number={4} title="Slab classification and span direction">
        {i.geometryMode === "strip" ? <p>The problem specifies a one-way slab. Main bars span from beam to beam in the section shown. Shrinkage and temperature bars run perpendicular to them.</p> : <>
        <Equation value={math`R=\frac{L_{longer}}{L_{shorter}}=\frac{${Math.max(i.panelLength, i.panelWidth)}}{${Math.min(i.panelLength, i.panelWidth)}}=${f(r.aspectRatio)}`} />
        <p>{r.classification}. Main reinforcement runs along panel {i.spanDirection}, perpendicular to the supporting beams. Shrinkage and temperature reinforcement runs perpendicular to the main bars.</p>
        <p>Module criterion: two opposite supported sides OR R &gt; 2. With four supported sides, R = 2 is not one-way.</p>
        </>}
      </Card>
      <Card number={5} title="Support condition"><p>{r.supportLabel}. {i.supportCondition === "interior" ? "Both ends continuous for the thickness screen." : "One end continuous for the thickness screen."}</p></Card>
      <Card number={6} title="Selected table cases">
        <p className="font-semibold">{MOMENT_TABLE}</p>
        <p>Module 4, pp. 12–13 (supplied transcription).</p>
        {perLocation((item) => <p>{item.tableCase.location} — {item.tableCase.condition}</p>)}
        {i.shortSpanCase && <p>The slab-specific 1/12 row replaces other negative coefficients at restrained supports. All spans must be ≤3 m.</p>}
      </Card>
      <Card number={7} title="Moment coefficients">
        {perLocation((item) => <Equation value={math`C_{${item.face === "bottom" ? "+" : "-"}}=\frac{1}{${item.tableCase.denominator}}=${f(item.coefficient, 6)}`} />)}
        <p>Coefficients are applied individually and are not redistributed.</p>
      </Card>
      <Card number={8} title="Trial slab thickness and deflection screen" reference="ACI 318-14 Table 7.3.1.1 and §7.3.1.1.1">
        <Equation value={math`h=${i.h}\,\text{mm},\quad \ell=${r.panelSpan}\,\text{m}=${f(r.panelSpan * 1000)}\,\text{mm}`} />
        <Equation value={math`k_y=0.4+\frac{f_y}{700}=0.4+\frac{${i.fy}}{700}=${f(r.thicknessFactor)}`} />
        <Equation value={math`h_{min}=\frac{\ell}{${r.thicknessRatio}}k_y=\frac{${r.panelSpan * 1000}}{${r.thicknessRatio}}(${f(r.thicknessFactor)})=${f(r.thicknessMinimum)}\,\text{mm}`} />
        <Equation value={math`${i.h}\,\text{mm}\ ${r.thicknessOk ? "\\ge" : "<"}\ ${f(r.thicknessMinimum)}\,\text{mm}`} />
        <p>Normalweight-concrete screen, with no deflection-sensitive attachments. A failed screen requires increased thickness or a separate deflection calculation.</p>
      </Card>
      <Card number={9} title="Effective depth"><Equation value={math`d=h-c_{cover}-\frac{d_b}{2}=${i.h}-${i.cover}-\frac{${i.barDiameter}}{2}=${f(r.d)}\,\text{mm}`} /></Card>
      <Card number={10} title="Slab self-weight">
        <Equation value={math`h_m=\frac{h}{1000}=\frac{${i.h}}{1000}=${f(i.h / 1000)}\,\text{m}`} />
        <Equation value={math`w_{slab}=h_m\gamma_c=(${f(i.h / 1000)})(${i.concreteUnitWeight})=${f(r.selfWeight)}\,\text{kN/m}^2`} />
      </Card>
      <Card number={11} title="Additional dead loads and total D">
        {i.geometryMode === "strip" ? <Equation value={math`D_{add}=D_{superimposed}=${i.otherDeadLoad}\,\text{kPa}=${i.otherDeadLoad}\,\text{kN/m}^2`} /> : <>
        <Equation value={math`D_{add}=w_{finish}+w_{ceiling}+w_{partition}+w_{other}`} />
        <Equation value={math`D_{add}=${i.finishLoad}+${i.ceilingLoad}+${i.partitionLoad}+${i.otherDeadLoad}=${f(r.additionalDeadLoad)}\,\text{kN/m}^2`} />
        </>}
        <Equation value={math`D=w_{slab}+D_{add}=${f(r.selfWeight)}+${f(r.additionalDeadLoad)}=${f(r.deadLoadTotal)}\,\text{kN/m}^2`} />
      </Card>
      <Card number={12} title="Live load and table applicability" reference="ACI 318-14 §6.5.1">
        <Equation value={math`L=${i.liveLoad}\,\text{kN/m}^2\le3D=3(${f(r.deadLoadTotal)})=${f(3 * r.deadLoadTotal)}\,\text{kN/m}^2`} />
        <p>At least two continuous spans, uniform loads, constant sections. For each entered pair, longer clear span / shorter clear span ≤1.20.</p>
        {(i.supportCondition === "interior" ? [[i.leftSpan, i.span], [i.span, i.rightSpan]] : [[i.span, i.rightSpan]]).map(([a, b], index) => <Equation key={index} value={math`\frac{\ell_{long}}{\ell_{short}}=\frac{${Math.max(a, b)}}{${Math.min(a, b)}}=${f(Math.max(a, b) / Math.min(a, b))}\le1.20`} />)}
      </Card>
      <Card number={13} title="Factored area load and design-strip load" reference="ACI 318-14 Table 5.3.1; gravity D and L combinations">
        <Equation value={math`q_{u,1}=1.4D=1.4(${f(r.deadLoadTotal)})=${f(r.deadOnlyLoad)}\,\text{kN/m}^2`} />
        <Equation value={math`q_{u,2}=1.2D+1.6L=1.2(${f(r.deadLoadTotal)})+1.6(${i.liveLoad})=${f(r.gravityLoad)}\,\text{kN/m}^2`} />
        <Equation value={math`q_u=\max(q_{u,1},q_{u,2})=\max(${f(r.deadOnlyLoad)},${f(r.gravityLoad)})=${f(r.factoredLoad)}\,\text{kN/m}^2`} />
        <Equation value={math`w_u=q_u\frac{b}{1000}=(${f(r.factoredLoad)})\frac{${i.stripWidth}}{1000}=${f(r.stripLoad)}\,\text{kN/m}`} />
        <p>Governing combination: {r.loadCombination}. In the moment equations, wu is the factored line load on the design strip.</p>
      </Card>
      <Card number={14} title="Design span at each location">
        {perLocation((item) => <>
          <Equation value={item.adjacentSpans ? math`L_n=\frac{L_{left}+L_{right}}{2}=\frac{${item.adjacentSpans[0]}+${item.adjacentSpans[1]}}{2}=${f(item.designSpan)}\,\text{m}` : math`L_n=L_{clear}=${f(item.designSpan)}\,\text{m}`} />
          {!item.adjacentSpans && item.face === "top" && <p>Exterior support has only one adjoining span; its clear span is used. No fictitious second span is averaged.</p>}
        </>)}
      </Card>
      <Card number={15} title="Positive design moment">
        <MomentEquation item={r.designs[0]} stripLoad={r.stripLoad} />
      </Card>
      <Card number={16} title="Negative design moments">
        {r.designs.filter((item) => item.face === "top").map((item) => <div key={item.id} className="mt-3"><p>{item.location}</p><MomentEquation item={item} stripLoad={r.stripLoad} /></div>)}
        {i.supportCondition === "end-unrestrained" && <p>At the unrestrained exterior end, Mu,− = 0 kN·m. No negative flexural design is assigned there by this table.</p>}
      </Card>
      <Card number={17} title="Required nominal moment strength">
        <Equation value={math`\phi M_n\ge M_u,\qquad \phi_{trial}=0.90`} />
        {perLocation((item) => <Equation value={math`M_{n,req}=\frac{M_u}{\phi_{trial}}=\frac{${f(item.Mu)}}{0.90}=${f(item.MnRequired)}\,\text{kN}\cdot\text{m}`} />)}
        <p>The assumed strength factor is verified against the provided steel strain in step 28.</p>
      </Card>
      <Card number={18} title="Required reinforcement: quadratic solution" reference="ACI 318-14 §22.2; rectangular compression block and force equilibrium">
        <Equation value={math`M_n=A_sf_y\left(d-\frac{A_sf_y}{2(0.85f'_cb)}\right)`} />
        <Equation value={math`qA_s^2-pA_s+10^6M_{n,req}=0,\quad q=\frac{f_y^2}{1.7f'_cb},\quad p=f_yd`} />
        {perLocation((item) => <>
          <Equation value={math`q=\frac{${i.fy}^2}{1.7(${i.fc})(${i.stripWidth})}=${f(item.quadraticA, 6)}\,\text{N/mm}^3,\quad p=(${i.fy})(${f(r.d)})=${f(item.quadraticB)}\,\text{N/mm}`} />
          <Equation value={math`\Delta=p^2-4q(10^6M_{n,req})=${f(item.quadraticB)}^2-4(${f(item.quadraticA, 6)})(10^6)(${f(item.MnRequired)})=${f(item.discriminant)}\,\text{N}^2/\text{mm}^2`} />
          <Equation value={math`A_{s,req}=\frac{p-\sqrt{\Delta}}{2q}=\frac{${f(item.quadraticB)}-\sqrt{${f(item.discriminant)}}}{2(${f(item.quadraticA, 6)})}=${f(item.AsRequired)}\,\text{mm}^2`} />
        </>)}
        <p>The smaller positive root is used. Numerically, the equivalent rationalized root avoids rounding cancellation.</p>
      </Card>
      <Card number={19} title="Minimum flexural and shrinkage reinforcement" reference="ACI 318-14 Table 7.6.1.1 and §24.4.3.2">
        <Equation value={minimumFormula} />
        <Equation value={i.fy < 420 ? math`\rho_{min}=0.002` : math`\rho_{min}=\max\left(0.0018\frac{420}{${i.fy}},0.0014\right)=${f(r.rhoMin, 6)}`} />
        <Equation value={math`A_{s,min}=A_{s,ST,min}=\rho_{min}bh=(${f(r.rhoMin, 6)})(${i.stripWidth})(${i.h})=${f(st.AsMinimum)}\,\text{mm}^2`} />
        <p>Flexural minimum steel is placed at each tension face. Shrinkage and temperature steel is perpendicular to the main bars.</p>
      </Card>
      <Card number={20} title="Governing reinforcement area">
        {perLocation((item) => <Equation value={math`A_{s,gov}=\max(A_{s,req},A_{s,min})=\max(${f(item.AsRequired)},${f(item.AsMinimum)})=${f(item.AsGoverning)}\,\text{mm}^2`} />)}
      </Card>
      <Card number={21} title="Bar area">
        <Equation value={math`A_{bar}=\frac{\pi d_b^2}{4}=\frac{\pi(${i.barDiameter})^2}{4}=${f(r.designs[0].barArea)}\,\text{mm}^2`} />
        <Equation value={math`A_{bar,ST}=\frac{\pi(${i.distributionBarDiameter})^2}{4}=${f(st.barArea)}\,\text{mm}^2`} />
      </Card>
      <Card number={22} title="Required and practical bar spacing">
        <p>Spacing is in 5 mm increments. Round downward to provide at least the required area; minimum clear-distance constraints are also enforced. Any resulting area shortfall is a failed design, not a recommendation.</p>
        <Equation value={math`s_{prov}=\max\left(5\left\lceil\frac{s_{min}}5\right\rceil,\ 5\left\lfloor\frac{\min(s_{req},s_{max})}5\right\rfloor\right)`} />
        {perLocation((item) => <>
          <Equation value={math`s_{req}=\frac{A_{bar}b}{A_{s,gov}}=\frac{(${f(item.barArea)})(${i.stripWidth})}{${f(item.AsGoverning)}}=${f(item.spacingRequired)}\,\text{mm}`} />
          <Equation value={math`s_{prov}=\max\left(5\left\lceil\frac{${f(r.minimumSpacing)}}5\right\rceil,5\left\lfloor\frac{\min(${f(item.spacingRequired)},${f(r.spacingMax)})}5\right\rfloor\right)=${item.spacingProvided}\,\text{mm}`} />
        </>)}
        <p className="mt-3 font-semibold">Shrinkage and temperature bars</p>
        <Equation value={math`s_{ST,req}=\frac{A_{bar,ST}b}{A_{s,ST,min}}=\frac{(${f(st.barArea)})(${i.stripWidth})}{${f(st.AsMinimum)}}=${f(st.spacingRequired)}\,\text{mm}`} />
        <Equation value={math`s_{ST,prov}=\max\left(5\left\lceil\frac{${f(st.minimumSpacing)}}5\right\rceil,5\left\lfloor\frac{\min(${f(st.spacingRequired)},${f(st.spacingMax)})}5\right\rfloor\right)=${st.spacing}\,\text{mm}`} />
      </Card>
      <Card number={23} title="Provided reinforcement">
        {perLocation((item) => <Equation value={math`A_{s,prov}=\frac{A_{bar}b}{s_{prov}}=\frac{(${f(item.barArea)})(${i.stripWidth})}{${item.spacingProvided}}=${f(item.AsProvided)}\,\text{mm}^2\ ${item.steelOk ? "\\ge" : "<"}\ ${f(item.AsGoverning)}\,\text{mm}^2`} />)}
        <Equation value={math`A_{s,ST,prov}=\frac{(${f(st.barArea)})(${i.stripWidth})}{${st.spacing}}=${f(st.AsProvided)}\,\text{mm}^2\ ${st.AsProvided >= st.AsMinimum ? "\\ge" : "<"}\ ${f(st.AsMinimum)}\,\text{mm}^2`} />
      </Card>
      <Card number={24} title="Maximum and minimum spacing checks" reference="ACI 318-14 §7.7.2.3–4, §25.2.1, §26.4.2.1 and Table 24.3.2">
        <Equation value={math`s_{geom}=\min(3h,450)=\min(3(${i.h}),450)=${f(r.geometricSpacingMax)}\,\text{mm}`} />
        <Equation value={math`f_s=\frac23 f_y=\frac23(${i.fy})=${f(2 * i.fy / 3)}\,\text{MPa}`} />
        <Equation value={math`s_{crack}=\min\left(380\frac{280}{f_s}-2.5c_{cover},300\frac{280}{f_s}\right)`} />
        <Equation value={math`s_{crack}=\min\left(380\frac{280}{${f(2 * i.fy / 3)}}-2.5(${i.cover}),300\frac{280}{${f(2 * i.fy / 3)}}\right)=${f(r.crackSpacingMax)}\,\text{mm}`} />
        <Equation value={math`s_{max}=\min(s_{geom},s_{crack})=\min(${f(r.geometricSpacingMax)},${f(r.crackSpacingMax)})=${f(r.spacingMax)}\,\text{mm}`} />
        <Equation value={math`s_{min}=d_b+\max(25,d_b,4d_{agg}/3)=${i.barDiameter}+\max(25,${i.barDiameter},4(${i.aggregateSize})/3)=${f(r.minimumSpacing)}\,\text{mm}`} />
        {perLocation((item) => <><Equation value={math`s_{min}\le s_{prov}\le s_{max}:\quad ${f(r.minimumSpacing)}\ ${r.minimumSpacing <= item.spacingProvided ? "\\le" : ">"}\ ${item.spacingProvided}\ ${item.spacingProvided <= r.spacingMax ? "\\le" : ">"}\ ${f(r.spacingMax)}\,\text{mm}`} /><p>{item.spacingOk ? "ADEQUATE" : "NOT ADEQUATE"}</p></>)}
        <Equation value={math`s_{ST,max}=\min(5h,450)=\min(5(${i.h}),450)=${st.spacingMax}\,\text{mm}`} />
        <Equation value={math`s_{ST,min}=${i.distributionBarDiameter}+\max(25,${i.distributionBarDiameter},4(${i.aggregateSize})/3)=${f(st.minimumSpacing)}\,\text{mm}`} />
        <Equation value={math`${f(st.minimumSpacing)}\ ${st.minimumSpacing <= st.spacing ? "\\le" : ">"}\ ${st.spacing}\ ${st.spacing <= st.spacingMax ? "\\le" : ">"}\ ${st.spacingMax}\,\text{mm}`} />
        <p>Shrinkage spacing and area: {st.adequate ? "ADEQUATE" : "NOT ADEQUATE"}.</p>
      </Card>
      <Card number={25} title="Neutral-axis depth" reference="ACI 318-14 §22.2.2.4">
        <Equation value={math`\beta_1=\max\left(0.65,\min\left(0.85,0.85-\frac{0.05(f'_c-28)}7\right)\right)`} />
        <Equation value={math`\beta_1=\max\left(0.65,\min\left(0.85,0.85-\frac{0.05(${i.fc}-28)}7\right)\right)=${f(r.beta1)}`} />
        {perLocation((item) => <Equation value={math`c=\frac{A_{s,prov}f_y}{0.85f'_cb\beta_1}=\frac{(${f(item.AsProvided)})(${i.fy})}{0.85(${i.fc})(${i.stripWidth})(${f(r.beta1)})}=${f(item.c)}\,\text{mm}`} />)}
      </Card>
      <Card number={26} title="Equivalent compression-block depth">
        {perLocation((item) => <Equation value={math`a=\frac{A_{s,prov}f_y}{0.85f'_cb}=\frac{(${f(item.AsProvided)})(${i.fy})}{0.85(${i.fc})(${i.stripWidth})}=${f(item.a)}\,\text{mm}=\beta_1c`} />)}
      </Card>
      <Card number={27} title="Nominal moment capacity">
        {perLocation((item) => <Equation value={math`M_n=\frac{A_{s,prov}f_y(d-a/2)}{10^6}=\frac{(${f(item.AsProvided)})(${i.fy})(${f(r.d)}-${f(item.a)}/2)}{10^6}=${f(item.Mn)}\,\text{kN}\cdot\text{m}`} />)}
      </Card>
      <Card number={28} title="Verify tensile strain, φ, and design moment capacity" reference="Module 4: εt ≥ 0.004; ACI 318-14 §7.3.3.1 and Table 21.2.2">
        <Equation value={math`\varepsilon_y=\frac{f_y}{E_s}=\frac{${i.fy}}{${i.Es}}=${f(r.epsilonY, 6)}`} />
        <Equation value={math`\phi=\begin{cases}0.65&\varepsilon_t\le\varepsilon_y\\0.65+0.25\frac{\varepsilon_t-\varepsilon_y}{0.005-\varepsilon_y}&\varepsilon_y<\varepsilon_t<0.005\\0.90&\varepsilon_t\ge0.005\end{cases}`} />
        {perLocation((item) => <>
          <Equation value={math`\varepsilon_t=0.003\frac{d-c}{c}=0.003\frac{${f(r.d)}-${f(item.c)}}{${f(item.c)}}=${f(item.epsilonT, 6)}\ ${item.strainOk ? "\\ge" : "<"}\ 0.004`} />
          {item.epsilonT > r.epsilonY && item.epsilonT < 0.005 && <Equation value={math`\phi=0.65+0.25\frac{${f(item.epsilonT, 6)}-${f(r.epsilonY, 6)}}{0.005-${f(r.epsilonY, 6)}}=${f(item.phi, 6)}`} />}
          <Equation value={math`\phi M_n=(${f(item.phi, 6)})(${f(item.Mn)})=${f(item.phiMn)}\,\text{kN}\cdot\text{m}`} />
          {!item.strainOk && <p className="text-[var(--red)]">Strain limit failed. Do not accept this section; revise its thickness. The displayed yielding-model capacity is not an accepted design strength.</p>}
        </>)}
      </Card>
      <Card number={29} title="Final adequacy: strength, reinforcement, cover, and shear">
        {perLocation((item) => <>
          <Equation value={math`\phi M_n\ge M_u:\quad ${f(item.phiMn)}\ ${item.phiMn >= item.Mu ? "\\ge" : "<"}\ ${f(item.Mu)}\,\text{kN}\cdot\text{m}`} />
          <p>Strength and strain: {item.strengthOk ? "ADEQUATE" : "NOT ADEQUATE"}; area: {item.steelOk ? "ADEQUATE" : "NOT ADEQUATE"}; spacing: {item.spacingOk ? "ADEQUATE" : "NOT ADEQUATE"}.</p>
        </>)}
        <Equation value={math`c_{cover}=${i.cover}\,\text{mm}\ ${r.coverOk ? "\\ge" : "<"}\ 20\,\text{mm}`} />
        <p>Support-face shear screen: ACI 318-14 Table 6.5.4 and §22.5.5.1, λ = 1, φv = 0.75.</p>
        <Equation value={math`V_u=k_v\frac{w_uL_n}{2}=${r.shearFactor}\frac{(${f(r.stripLoad)})(${r.shearSpan})}{2}=${f(r.Vu)}\,\text{kN}`} />
        <Equation value={math`V_c=\frac{0.17\lambda\sqrt{f'_c}bd}{1000}=\frac{0.17(1)\sqrt{${i.fc}}(${i.stripWidth})(${f(r.d)})}{1000}=${f(r.Vc)}\,\text{kN}`} />
        <Equation value={math`\phi_vV_c=0.75(${f(r.Vc)})=${f(r.phiVc)}\,\text{kN}\ ${r.shearOk ? "\\ge" : "<"}\ ${f(r.Vu)}\,\text{kN}`} />
        <p className={`font-bold ${r.overallOk ? "text-[var(--green)]" : "text-[var(--red)]"}`}>Selected span overall: {r.overallOk ? "ADEQUATE" : "NOT ADEQUATE"}.</p>
      </Card>
      <Card number={30} title="Final reinforcement recommendation">
        {!r.overallOk && <p className="font-semibold text-[var(--red)]">The design is NOT ADEQUATE. The following are trial arrangements; resolve all failed checks before use.</p>}
        {r.designs.map((item) => <p key={item.id} className="mt-2"><strong>{item.location}:</strong> {i.barDiameter} mm diameter bars at {item.spacingProvided} mm spacing — {item.adequate ? "zone checks adequate" : "revise this zone"}.</p>)}
        <p className="mt-2"><strong>Shrinkage and temperature reinforcement:</strong> {i.distributionBarDiameter} mm diameter bars at {st.spacing} mm spacing, perpendicular to main bars — {st.adequate ? "adequate" : "revise"}.</p>
        <p className="mt-2">Bar development, cutoffs, anchorage, openings and fire requirements need separate detailing. This solution designs the selected span, not every span in the floor.</p>
      </Card>
    </section>
  );
}
function Card({ number, title, reference, children }: { number: number; title: string; reference?: string; children: ReactNode }) {
  return <section data-solution-step={number} className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"><div className="mb-3 flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--green)] text-xs font-bold text-white">{number}</span><h3 className="text-sm font-semibold">{title}</h3></div>{reference && <p className="mb-2 text-xs text-[var(--text-muted)]">{reference}</p>}<div className="min-w-0 space-y-2 text-xs leading-relaxed">{children}</div></section>;
}
function Equation({ value }: { value: string }) {
  return <div className="max-w-full overflow-x-auto rounded-md bg-[var(--bg)] p-2 text-sm"><InlineKatex math={value} /></div>;
}
function MomentEquation({ item, stripLoad }: { item: ReinforcementDesign; stripLoad: number }) {
  return <Equation value={math`M_{u,${item.face === "bottom" ? "+" : "-"}}=Cw_uL_n^2=\frac1{${item.tableCase.denominator}}(${f(stripLoad)})(${f(item.designSpan)})^2=${f(item.Mu)}\,\text{kN}\cdot\text{m}`} />;
}
