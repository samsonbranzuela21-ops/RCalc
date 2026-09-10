"use client";

import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { catalogModules } from "@/lib/modules";

interface TableRow {
  [key: string]: string;
}

interface EqRow {
  label: string;
  latex: string;
  note?: string;
}

interface RefSection {
  topicSlug?: string; // matches a topic slug in lib/modules.ts when applicable
  title: string;
  reference: string;
  summary: string;
  table?: { caption: string; headers: string[]; rows: TableRow[] };
  equations?: { caption: string; rows: EqRow[] };
}

interface RefChapter {
  moduleSlug: string; // must match catalogModules[].slug in lib/modules.ts
  sections: RefSection[];
}

// Content is grouped to mirror the eight source modules and their NSCP/ACI topics.
const chapters: RefChapter[] = [
  {
    moduleSlug: "introduction-to-rc-design",
    sections: [
      {
        topicSlug: "units-conversion",
        title: "Units Conversion",
        reference: "NSCP 2015 uses SI (metric) units throughout",
        summary:
          "Use SI units throughout: force in N or kN, stress in MPa, and length in mm.",
        table: {
          caption: "Table 1.1 — Common Conversions",
          headers: ["Quantity", "Conversion"],
          rows: [
            { Quantity: "Stress", Conversion: "1 MPa = 1 N/mm² = 145.04 psi" },
            { Quantity: "Force", Conversion: "1 kN = 1000 N = 224.8 lb" },
            { Quantity: "Length", Conversion: "1 in = 25.4 mm" },
            { Quantity: "Unit weight of concrete", Conversion: "≈ 23.6 kN/m³ (normalweight)" },
          ],
        },
      },
      {
        topicSlug: "concrete",
        title: "Concrete",
        reference: "ACI 318-14 Ch. 19",
        summary:
          "Concrete strength is given by f'c at 28 days. Use it to estimate stiffness and the cracking strength.",
        equations: {
          caption: "Eq. 1.1–1.5 — Concrete Properties and Strain Limits",
          rows: [
            { label: "Modulus of elasticity, Ec", latex: "E_c = 4700\\sqrt{f'_c}\\ \\text{(MPa)}" },
            { label: "Modulus of rupture, fr", latex: "f_r = 0.62\\,\\lambda\\sqrt{f'_c}\\ \\text{(MPa)}" },
            { label: "Peak concrete strain", latex: "\\varepsilon_0 \\approx 0.002" },
            { label: "Ultimate concrete strain", latex: "\\varepsilon_{cu} = 0.003" },
            { label: "General-weight concrete modulus", latex: "E_c = 0.043\\,w_c^{1.5}\\sqrt{f'_c}\\ \\text{(MPa)}" },
          ],
        },
      },
      {
        topicSlug: "reinforcing-steel",
        title: "Reinforcing Steel",
        reference: "NSCP 2015 material provisions / ASTM A615",
        summary:
          "Each bar grade has a yield strength, fy. Steel is elastic until it reaches fy, then it yields.",
        table: {
          caption: "Table 1.2 — Common Grades",
          headers: ["Grade", "fy", "Es"],
          rows: [
            { Grade: "Grade 40", fy: "275 MPa", Es: "200,000 MPa" },
            { Grade: "Grade 60", fy: "420 MPa", Es: "200,000 MPa" },
            { Grade: "Grade 75", fy: "520 MPa", Es: "200,000 MPa" },
          ],
        },
        equations: {
          caption: "Eq. 1.6–1.7 — Steel Elastic Properties",
          rows: [
            { label: "Steel modulus", latex: "E_s = \\dfrac{f_y}{\\varepsilon_y}" },
            { label: "Yield strain", latex: "\\varepsilon_y = \\dfrac{f_y}{E_s}" },
          ],
        },
      },
      {
        topicSlug: "reinforced-concrete",
        title: "Reinforced Concrete",
        reference: "ACI 318-14 Section 22.2",
        summary:
          "Concrete mainly resists compression while steel mainly resists tension. The bond between them makes both materials act together.",
        equations: {
          caption: "Eq. 1.8–1.9 — Compatibility and Force Equilibrium",
          rows: [
            { label: "Strain compatibility", latex: "\\phi = \\dfrac{\\varepsilon_c}{c} = \\dfrac{\\varepsilon_t}{d-c}" },
            { label: "Internal force equilibrium", latex: "T = C" },
          ],
        },
      },
      {
        topicSlug: "design-codes",
        title: "Design Codes",
        reference: "NSCP 2015 Section 203 / ACI 318-14 Ch. 5, 21",
        summary:
          "Check every required load combination. Use the largest demand, then multiply nominal strength by φ to get design strength.",
        table: {
          caption: "Table 1.3 — Factored Load Combinations",
          headers: ["No.", "Combination"],
          rows: [
            { "No.": "1", Combination: "U = 1.4D" },
            { "No.": "2", Combination: "U = 1.2D + 1.6L + 0.5(Lr or R)" },
            { "No.": "3", Combination: "U = 1.2D + 1.6(Lr or R) + (1.0L or 0.5W)" },
            { "No.": "4", Combination: "U = 1.2D + 1.0W + 1.0L + 0.5(Lr or R)" },
            { "No.": "5", Combination: "U = 1.2D + 1.0E + 1.0L" },
            { "No.": "6", Combination: "U = 0.9D + 1.0W" },
            { "No.": "7", Combination: "U = 0.9D + 1.0E" },
          ],
        },
      },
      {
        title: "Strength Reduction Factors, φ",
        reference: "NSCP 2015 Table 421.2.2 / ACI 318-14 Table 21.2.2",
        summary: "φ reduces nominal strength to allow for material variation, construction tolerance, and failure behavior.",
        table: {
          caption: "Table 1.4 — Strength Reduction Factors",
          headers: ["Action / Section Type", "φ"],
          rows: [
            { "Action / Section Type": "Tension-controlled (flexure)", "φ": "0.90" },
            { "Action / Section Type": "Compression-controlled — spiral", "φ": "0.75" },
            { "Action / Section Type": "Compression-controlled — tied", "φ": "0.65" },
            { "Action / Section Type": "Shear and torsion", "φ": "0.75" },
          ],
        },
      },
    ],
  },
  {
    moduleSlug: "moment-curvature-behavior",
    sections: [
      {
        topicSlug: "moment-curvature-relationship",
        title: "Moment–Curvature Relationship",
        reference: "NSCP 2015 / ACI 318-14 Section 22.2",
        summary:
          "As moment increases, the beam moves from uncracked behavior to cracking, steel yielding, and finally concrete crushing. Stiffness changes at each stage.",
        equations: {
          caption: "Eq. 2.1 — Curvature and Strain Compatibility",
          rows: [
            { label: "Section curvature", latex: "\\phi = \\dfrac{\\varepsilon_c}{c} = \\dfrac{\\varepsilon_s}{d-c}" },
            { label: "Moment–curvature relation", latex: "M = E I \\phi" },
          ],
        },
      },
      {
        topicSlug: "stage-1-2-uncracked-section",
        title: "Stage 1 & 2 — Uncracked Section",
        reference: "ACI 318-14 Section 24.2.3.5",
        summary:
          "Before cracking, the full concrete section carries load elastically. Cracking starts when tensile stress reaches fr.",
        equations: {
          caption: "Eq. 2.2–2.4 — Uncracked Section",
          rows: [
            { label: "Cracking moment", latex: "M_{cr} = \\dfrac{f_r I_g}{y_t}" },
            { label: "Elastic stress", latex: "f = \\dfrac{M y}{I_g}" },
            { label: "Uncracked curvature", latex: "\\phi = \\dfrac{M}{E_c I_g}" },
          ],
        },
      },
      {
        topicSlug: "stage-3-service-loads",
        title: "Stage 3 — Service Loads",
        reference: "CE72 Module 2 / ACI 318-14 Section 24.2 serviceability provisions",
        summary:
          "After cracking, ignore tension concrete and use the transformed section. The modular ratio n changes steel area into an equivalent concrete area.",
        equations: {
          caption: "Eq. 2.2 — Cracked Section (singly reinforced)",
          rows: [
            { label: "Modular ratio, n", latex: "n = \\dfrac{E_s}{E_c}" },
            {
              label: "Neutral axis depth, kd",
              latex: "\\tfrac{1}{2} b (kd)^2 = n A_s (d - kd)",
              note: "solve the quadratic for kd; Icr follows from the transformed section",
            },
            { label: "Cracked transformed inertia", latex: "I_{cr} = \\dfrac{b(kd)^3}{3} + n A_s(d-kd)^2" },
            { label: "Cracked-section moment", latex: "M = E_c I_{cr} \\phi" },
            { label: "Steel stress after cracking", latex: "f_s = n E_c \\phi(d-kd)" },
          ],
        },
      },
      {
        topicSlug: "stage-4-reinforcing-steel-yields",
        title: "Stage 4 — Reinforcing Steel Yields",
        reference: "NSCP 2015 Section 421.2 / ACI 318-14 Section 21.2.2",
        summary:
          "The tension steel yields when its strain reaches εy = fy/Es. After yielding, capacity increases mainly because the internal lever arm changes.",
        equations: {
          caption: "Eq. 2.5–2.6 — Yield Stage",
          rows: [
            { label: "Yield strain", latex: "\\varepsilon_y = \\dfrac{f_y}{E_s}" },
            { label: "Yield curvature", latex: "\\phi_y = \\dfrac{\\varepsilon_y}{d-c}" },
          ],
        },
      },
      {
        topicSlug: "stage-5-concrete-crushes",
        title: "Stage 5 — Concrete Crushes",
        reference: "NSCP 2015 Section 422.2.2.1 / ACI 318-14 Section 22.2.2.1",
        summary:
          "Ultimate capacity is reached when the extreme compression fiber reaches the assumed strain of 0.003.",
        equations: {
          caption: "Eq. 2.7–2.8 — Ultimate Stress Block",
          rows: [
            { label: "Ultimate concrete strain", latex: "\\varepsilon_{cu} = 0.003" },
            { label: "Equivalent block depth", latex: "a = \\beta_1 c" },
            { label: "Concrete compression force", latex: "C = 0.85 f'_c b a" },
          ],
        },
      },
      {
        topicSlug: "stage-5-based-on-nscp-2015",
        title: "Stage 5 — Based on NSCP 2015",
        reference: "NSCP 2015 Sections 422.2.2.1–422.2.2.4 / ACI 318-14 Sections 22.2.2.1–22.2.2.4",
        summary:
          "For design, replace the real concrete stress curve with the equivalent rectangular Whitney stress block. β1 controls its depth.",
        table: {
          caption: "Table 2.1 — β1 vs. f'c",
          headers: ["Condition", "β1"],
          rows: [
            { Condition: "f'c ≤ 28 MPa", "β1": "0.85" },
            { Condition: "28 < f'c < 55 MPa", "β1": "0.85 − 0.05[(f'c − 28)/7]" },
            { Condition: "f'c ≥ 55 MPa", "β1": "0.65 (minimum)" },
          ],
        },
      },
    ],
  },
  {
    moduleSlug: "srrc-beam-capacity-and-design",
    sections: [
      {
        topicSlug: "nominal-moment-of-srrc-beams",
        title: "Nominal Moment of SRRC Beams",
        reference: "NSCP 2015 / ACI 318-14 Section 22.2",
        summary:
          "For a singly reinforced rectangular beam, the concrete compression block balances the tension in the reinforcement. Nominal strength is calculated before applying the strength-reduction factor.",
        equations: {
          caption: "Eq. 3.1–3.5 — SRRC Nominal Strength",
          rows: [
            {
              label: "Equivalent compression-block depth",
              latex: "a = \\dfrac{A_s f_y}{0.85 f'_c b}",
            },
            {
              label: "Neutral-axis depth",
              latex: "c = \\dfrac{a}{\\beta_1}",
            },
            {
              label: "Force equilibrium",
              latex: "T = C, \\qquad A_s f_y = 0.85 f'_c a b",
            },
            {
              label: "Nominal moment",
              latex: "M_n = A_s f_y\\left(d - \\dfrac{a}{2}\\right)",
            },
            {
              label: "Design moment strength",
              latex: "\\phi M_n \\ge M_u",
            },
          ],
        },
      },
      {
        topicSlug: "nominal-moment-calculation",
        title: "Nominal Moment Calculation",
        reference: "NSCP 2015 / ACI 318-14 Section 22.2.2",
        summary:
          "The calculation uses strain compatibility, equilibrium, and the equivalent rectangular stress block. Check that the tension reinforcement reaches the assumed stress before using fy in the final capacity calculation.",
        equations: {
          caption: "Eq. 3.6–3.8 — Strain Compatibility",
          rows: [
            {
              label: "Tension-steel strain",
              latex: "\\varepsilon_t = 0.003\\left(\\dfrac{d-c}{c}\\right)",
              note: "Compare εt with εy = fy/Es to classify the section and select φ.",
            },
            {
              label: "Elastic steel stress",
              latex: "f_s = E_s\\varepsilon_t \\quad (\\varepsilon_t < \\varepsilon_y)",
            },
            {
              label: "Equilibrium for elastic steel",
              latex: "A_s E_s\\varepsilon_t = 0.85 f'_c(\\beta_1 c)b",
            },
          ],
        },
      },
      {
        topicSlug: "ultimate-moment-capacity-of-srrc-beams",
        title: "Ultimate Moment Capacity of SRRC Beams",
        reference: "NSCP 2015 Sections 421.2, 422.2 / ACI 318-14 Sections 21.2, 22.2",
        summary:
          "The ultimate design check compares the factored flexural demand Mu with φMn. A tension-controlled section is preferred because it provides yielding and visible warning before compression failure.",
        table: {
          caption: "Table 3.1 — Strength Classification Check",
          headers: ["Check", "Meaning"],
          rows: [
            { Check: "εt meets the tension-controlled limit", Meaning: "Use the tension-controlled φ when applicable." },
            { Check: "εt is below the tension-controlled limit", Meaning: "Transition or compression-controlled behavior; determine φ from the strain limits." },
          ],
        },
      },
      {
        topicSlug: "strength-reduction-factors",
        title: "Strength-Reduction Factors",
        reference: "NSCP 2015 Section 421.2 / ACI 318-14 Section 21.2",
        summary:
          "The strength-reduction factor accounts for material variation, construction tolerance, and the reliability associated with the failure mode. Use the factor required by the governing NSCP/ACI provision and strain classification.",
        table: {
          caption: "Table 3.2 — Common φ Values Used in RC Design",
          headers: ["Action", "Typical φ"],
          rows: [
            { Action: "Tension-controlled flexure", "Typical φ": "0.90" },
            { Action: "Shear and torsion", "Typical φ": "0.75" },
            { Action: "Compression-controlled tied member", "Typical φ": "0.65" },
            { Action: "Compression-controlled spiral member", "Typical φ": "0.75" },
          ],
        },
      },
      {
        topicSlug: "factored-moment",
        title: "Factored Moment",
        reference: "NSCP 2015 Section 203 / ACI 318-14 Table 5.3.1",
        summary:
          "Factored moment Mu is obtained from the governing strength load combination. Evaluate dead, live, wind, and earthquake effects with the sign and combination appropriate to the structural model.",
        equations: {
          caption: "Eq. 3.5 — Governing Flexural Demand",
          rows: [
            {
              label: "Design requirement",
              latex: "M_u = \\max\\left|M_{u,1}, M_{u,2}, \\ldots\\right|",
              note: "Use the applicable NSCP 2015 strength combinations, including seismic combinations where required.",
            },
          ],
        },
      },
      {
        topicSlug: "dead-load",
        title: "Dead Load",
        reference: "NSCP 2015 Section 203",
        summary:
          "Dead load includes the self-weight of the beam, slab, finishes, partitions, and other permanently attached components. Include member self-weight after selecting a preliminary section size.",
      },
      {
        topicSlug: "live-load",
        title: "Live Load",
        reference: "NSCP 2015 Section 204",
        summary:
          "Live load represents occupancy and movable loads. Apply the prescribed occupancy load and the corresponding strength factor in the governing combination.",
      },
      {
        topicSlug: "wind-load",
        title: "Wind Load",
        reference: "NSCP 2015 wind-load provisions / ACI 318-14 Table 5.3.1 for combinations",
        summary:
          "Wind effects may add or reverse flexural demand. Consider the required directional cases and combine wind with gravity actions according to the NSCP 2015 strength combinations.",
      },
      {
        topicSlug: "earthquake-load",
        title: "Earthquake Load",
        reference: "NSCP 2015 seismic-load provisions / ACI 318-14 Ch. 18 where applicable",
        summary:
          "Earthquake effects are combined with gravity actions using the prescribed seismic load cases. For members in seismic-force-resisting systems, also apply the detailing and capacity-design requirements that govern the member.",
      },
      {
        topicSlug: "design-of-singly-reinforced-rc-beams",
        title: "Design of Singly Reinforced RC Beams",
        reference: "NSCP 2015 / ACI 318-14 Section 22.2",
        summary:
          "Select a practical beam size, calculate d, determine the required tension steel from Mu, and verify strength, minimum reinforcement, spacing, cover, and strain classification.",
        equations: {
          caption: "Eq. 3.9–3.15 — Required Tension Steel",
          rows: [
            {
              label: "Required design strength",
              latex: "\\phi A_s f_y\\left(d - \\dfrac{A_s f_y}{1.7 f'_c b}\\right) \\ge M_u",
              note: "Solve for As, then verify the selected bar arrangement and all minimum/maximum requirements.",
            },
            {
              label: "Nominal moment coefficient",
              latex: "R_n = \\dfrac{M_u}{\\phi b d^2}",
            },
            {
              label: "Required steel ratio",
              latex: "\\rho = \\dfrac{0.85f'_c}{f_y}\\left[1-\\sqrt{1-\\dfrac{2R_n}{0.85f'_c}}\\right]",
            },
            {
              label: "Required steel area",
              latex: "A_{s,req} = \\rho_{req} b d",
            },
            {
              label: "Required ratio check",
              latex: "\\rho_{req}=\\max(\\rho,\\rho_{min}), \\qquad \\rho_{req} \\le \\rho_{max}",
            },
          ],
        },
      },
      {
        topicSlug: "concrete-cover",
        title: "Concrete Cover",
        reference: "NSCP 2015 durability provisions / ACI 318-14 Table 20.6.1.3.1",
        summary:
          "Provide the specified clear cover for durability, fire protection, and proper bar development. Cover depends on exposure, member type, and whether the concrete is cast against and permanently exposed to earth or weather.",
      },
      {
        topicSlug: "minimum-beam-depth",
        title: "Minimum Beam Depth",
        reference: "NSCP 2015 / ACI 318-14 Table 7.3.1.1",
        summary:
          "Use the code span-to-depth limits as an initial deflection-control check when the member meets the applicability conditions. A detailed deflection calculation is still required when those conditions are not met.",
      },
      {
        topicSlug: "minimum-reinforcement-spacing",
        title: "Minimum Reinforcement Spacing",
        reference: "NSCP 2015 / ACI 318-14 Section 25.2.1",
        summary:
          "Bars must be spaced far enough apart for concrete placement, consolidation, and bond. Check clear spacing between bars, layers, and the side forms after selecting the bar size.",
        equations: {
          caption: "Eq. 3.16–3.17 — Clear Spacing",
          rows: [
            { label: "Same-layer clear spacing", latex: "s_{clear} \\ge \\max\\left(25\\text{ mm}, d_b, \\dfrac{4}{3}d_{agg}\\right)" },
            { label: "Layer-to-layer clear spacing", latex: "s_{layers} \\ge 25\\text{ mm}" },
          ],
        },
      },
      {
        topicSlug: "skin-reinforcement-in-deep-beams",
        title: "Skin Reinforcement in Deep Beams",
        reference: "NSCP 2015 / ACI 318-14 Section 9.7.2.3",
        summary:
          "Deep beams may require reinforcement distributed near the side faces to control cracking and improve the behavior of the web. Confirm the trigger depth and required area from the governing code provision.",
      },
      {
        topicSlug: "steel-ratio",
        title: "Steel Ratio",
        reference: "NSCP 2015 / ACI 318-14 Section 22.2",
        summary:
          "The tension-steel ratio ρ = As/(bd) is used to describe the reinforcement level. Keep the ratio within the code limits so the section remains constructible and develops the intended ductile behavior.",
        equations: {
          caption: "Eq. 3.7 — Reinforcement Ratio",
          rows: [{ label: "Tension-steel ratio", latex: "\\rho = \\dfrac{A_s}{bd}" }],
        },
      },
      {
        topicSlug: "minimum-steel-ratio",
        title: "Minimum Steel Ratio",
        reference: "NSCP 2015 / ACI 318-14 Section 9.6.1.2",
        summary:
          "Minimum tension reinforcement prevents sudden failure after cracking and provides a reliable post-cracking load path. Use the governing code expression for the concrete strength, steel grade, and member type.",
        equations: {
          caption: "Eq. 3.8 — Minimum Reinforcement Check",
          rows: [
            {
              label: "Required minimum steel",
              latex: "A_s \\ge A_{s,\\min} = \\rho_{\\min} b d",
              note: "Use the larger applicable NSCP 2015 / ACI 318-14 minimum-steel expression.",
            },
            {
              label: "Minimum steel ratio",
              latex: "\\rho_{min}=\\max\\left(\\dfrac{\\sqrt{f'_c}}{4f_y},\\dfrac{1.4}{f_y}\\right)",
            },
          ],
        },
      },
    ],
  },
  {
    moduleSlug: "flexural-design-of-beams-slabs",
    sections: [
      {
        topicSlug: "design-of-singly-reinforced-rc-beams",
        title: "Design of Singly Reinforced RC Beams",
        reference: "ACI 318-14 Ch. 9, 22",
        summary:
          "Tension steel alone resists the internal tension couple. ρ must fall between ρmin and ρmax so the section is ductile and tension-controlled (φ = 0.90).",
        equations: {
          caption: "Eq. 3.18–3.25 — Singly Reinforced Rectangular Section",
          rows: [
            { label: "Nominal moment coefficient", latex: "R_n = \\dfrac{M_u}{\\phi \\, b \\, d^2}" },
            { label: "Steel ratio coefficient", latex: "m = \\dfrac{f_y}{0.85 \\, f'_c}" },
            { label: "Required steel ratio", latex: "\\rho = \\dfrac{1}{m}\\left[1 - \\sqrt{1 - \\dfrac{2mR_n}{f_y}}\\right]" },
            { label: "Minimum steel ratio", latex: "\\rho_{min} = \\max\\left(\\dfrac{1.4}{f_y}, \\dfrac{\\sqrt{f'_c}}{4f_y}\\right)" },
            { label: "Balanced steel ratio", latex: "\\rho_b = \\dfrac{0.85 f'_c \\beta_1}{f_y}\\left(\\dfrac{600}{600+f_y}\\right)" },
            { label: "Maximum steel ratio", latex: "\\rho_{max} = 0.75\\,\\rho_b" },
            { label: "Required steel area", latex: "A_{s,req}=\\rho_{req}b d" },
            { label: "Bar count", latex: "n_{bars}=\\dfrac{A_{s,req}}{A_b}" },
          ],
        },
      },
      {
        topicSlug: "ultimate-moment-capacity-of-doubly-reinforced-rc-beams",
        title: "Ultimate Moment Capacity of Doubly Reinforced RC Beams",
        reference: "ACI 318-14 Section 22.2, 22.3",
        summary:
          "When compression steel (As') is present, the section resists moment through two internal couples: the concrete–tension-steel couple and the compression-steel–tension-steel couple. Compression steel stress must be checked, not assumed at fy.",
        equations: {
          caption: "Eq. 3.26–3.30 — Doubly Reinforced Beam Analysis",
          rows: [
            {
              label: "Compression steel strain",
              latex: "\\varepsilon'_s = 0.003\\left(\\dfrac{c - d'}{c}\\right)",
              note: "compare to εy = fy/Es to confirm whether compression steel yields",
            },
            {
              label: "Nominal moment",
              latex: "M_n = C_c\\left(d - \\dfrac{a}{2}\\right) + C_s\\,(d - d')",
              note: "Cc = 0.85f'c·b·a; Cs = As'(fs' − 0.85f'c) if As' displaces concrete",
            },
            {
              label: "Concrete compression force",
              latex: "C_c=0.85f'_c b a",
            },
            {
              label: "Compression-steel force",
              latex: "C_s=A'_s(f'_s-0.85f'_c)",
            },
            {
              label: "Compression-steel stress",
              latex: "f'_s=E_s\\varepsilon'_s \\le f_y",
            },
          ],
        },
      },
      {
        topicSlug: "design-of-doubly-reinforced-rectangular-beams",
        title: "Design of Doubly-Reinforced Rectangular Beams",
        reference: "ACI 318-14 Section 9.3, 9.6",
        summary:
          "Used when Mu exceeds the tension-controlled capacity of a singly reinforced section (b, d fixed). The moment is split into a singly reinforced part (at ρmax) and a second couple carried by added tension + compression steel.",
        equations: {
          caption: "Eq. 3.31–3.35 — Required Steel Areas",
          rows: [
            {
              label: "Remaining moment, Mn2",
              latex: "M_{n2} = M_u/\\phi - M_{n1}",
              note: "Mn1 = moment capacity at ρmax (singly reinforced)",
            },
            {
              label: "Added steel",
              latex: "A_{s2} = A'_s = \\dfrac{M_{n2}}{f_y\\,(d - d')}",
              note: "assumes compression steel yields (fs' = fy) — verify with the strain check above",
            },
            {
              label: "Total tension steel",
              latex: "A_s=A_{s1}+A_{s2}",
            },
            {
              label: "Design strength check",
              latex: "\\phi M_n \\ge M_u",
            },
          ],
        },
      },
      {
        topicSlug: "approximate-moment",
        title: "Approximate Moment",
        reference: "ACI 318-14 Section 6.5",
        summary:
          "For continuous beams and one-way slabs meeting the applicability limits of Section 6.5.1 (≥ 2 spans, roughly equal spans, uniform load, Lr/L ≤ 3), approximate moment coefficients may be used instead of a full elastic analysis.",
        equations: {
          caption: "Eq. 3.12 — Approximate Moment (typical coefficients Cm)",
          rows: [
            {
              label: "Mu",
              latex: "M_u = C_m\\, w_u \\, \\ell_n^2",
              note: "Cm ranges ~1/24 to 1/9 depending on span location and support/continuity condition per Table 6.5.2",
            },
          ],
        },
      },
      {
        topicSlug: "design-of-one-way-rc-slab",
        title: "Design of One-Way RC Slab",
        reference: "ACI 318-14 Ch. 7, 24",
        summary:
          "One-way slabs are designed per unit (1 m) strip width using the same flexural provisions as beams. Shrinkage and temperature steel is required transverse to the main reinforcement.",
        equations: {
          caption: "Eq. 3.13 — Minimum Shrinkage & Temperature Reinforcement",
          rows: [
            {
              label: "ρs,min",
              latex: "\\rho_{s,min} = \\begin{cases} 0.0020 & f_y < 420\\text{ MPa} \\\\ 0.0018 & f_y = 420\\text{ MPa} \\end{cases}",
              note: "ACI 318-14 Section 24.4.3.2; As = ρs,min · (1000 mm) · h per meter width",
            },
            {
              label: "Main slab steel per metre width",
              latex: "A_s=\\rho_s(1000\\text{ mm})h",
            },
          ],
        },
        table: {
          caption: "Table 3.1 — Minimum Thickness, h (Deflection Not Computed)",
          headers: ["Support Condition", "Beams", "One-Way Slabs"],
          rows: [
            { "Support Condition": "Simply supported", Beams: "L/16", "One-Way Slabs": "L/20" },
            { "Support Condition": "One end continuous", Beams: "L/18.5", "One-Way Slabs": "L/24" },
            { "Support Condition": "Both ends continuous", Beams: "L/21", "One-Way Slabs": "L/28" },
            { "Support Condition": "Cantilever", Beams: "L/8", "One-Way Slabs": "L/10" },
          ],
        },
      },
    ],
  },
  {
    moduleSlug: "t-beam-analysis-and-design",
    sections: [
      {
        topicSlug: "analysis-and-design-of-rc-t-beams",
        title: "Analysis and Design of RC T-Beams",
        reference: "ACI 318-14 Section 6.3.2",
        summary:
          "When a slab casts monolithically with a beam, part of the slab acts as a compression flange. Effective flange width, be, is capped so the assumption of uniform stress across the flange stays valid.",
        equations: {
          caption: "Eq. 4.1 — Effective Flange Width, be",
          rows: [
            {
              label: "Interior (T-) beam — smallest of",
              latex: "b_e \\le \\min\\left(\\dfrac{\\ell_n}{4},\\; b_w + 16h_f,\\; \\text{c/c beam spacing}\\right)",
            },
            {
              label: "Edge (L-) beam — smallest of",
              latex: "b_e \\le \\min\\left(b_w + \\dfrac{\\ell_n}{12},\\; b_w + 6h_f,\\; b_w + \\tfrac{1}{2}(\\text{clear dist. to next web})\\right)",
            },
            {
              label: "Isolated T-beam",
              latex: "h_f \\ge 0.5\\,b_w, \\qquad b_e \\le 4\\,b_w",
            },
          ],
        },
      },
      {
        title: "Stress Block Check — Rectangular vs. T-Behavior",
        reference: "ACI 318-14 Section 22.2.2",
        summary:
          "A flanged section behaves as a rectangular beam of width be if the compression stress block depth a falls entirely within the flange thickness hf. Otherwise, the flange overhangs must be analyzed separately from the web.",
        equations: {
          caption: "Eq. 4.2–4.7 — T-Beam Stress Block and Capacity",
          rows: [
            {
              label: "Assumed-rectangular check",
              latex: "a = \\dfrac{A_s f_y}{0.85 f'_c \\, b_e} \\;\\; \\overset{?}{\\le}\\;\\; h_f",
              note: "if a ≤ hf, design as a rectangular beam of width be (Ch. 3 equations apply directly)",
            },
            {
              label: "If a > hf — flange + web couples",
              latex: "M_n = 0.85 f'_c (b_e - b_w) h_f \\left(d - \\dfrac{h_f}{2}\\right) + A_{sw} f_y \\left(d - \\dfrac{a_w}{2}\\right)",
              note: "Asw = tension steel balancing the web portion of the compression block, aw",
            },
            {
              label: "Flange moment capacity",
              latex: "M_f=0.85f'_c b_f h_f\\left(d-\\dfrac{h_f}{2}\\right)",
            },
            {
              label: "Web compression-block depth",
              latex: "M_1=\\dfrac{M_u}{\\phi}-M_f, \\qquad a=\\dfrac{A_s f_y}{0.85f'_c b_w}\\text{ (within web)}",
            },
            {
              label: "Web-only moment",
              latex: "M_1=0.85f'_c b_w(a-h_f)\\left(d-h_f-\\dfrac{a-h_f}{2}\\right)",
            },
            {
              label: "T-beam steel area",
              latex: "A_s=\\begin{cases}\\dfrac{0.85f'_c a b_f}{f_y} & a\\le h_f \\\\ \\dfrac{0.85f'_c[b_f h_f+b_w(a-h_f)]}{f_y} & a>h_f\\end{cases}",
            },
            {
              label: "T-beam reinforcement check",
              latex: "A_{s,req}=\\max(A_s,A_{s,min}), \\qquad A_{s,req}\\le A_{s,max}",
            },
          ],
        },
      },
    ],
  },
  {
    moduleSlug: "serviceability-requirements",
    sections: [
      {
        topicSlug: "serviceability-requirements-overview",
        title: "Serviceability Requirements",
        reference: "NSCP 2015 Sections 419.2.2.1, 419.2.3.1, 424.2.3.5 / ACI 318-14 Ch. 24",
        summary:
          "Where deflection is computed explicitly (not covered by the minimum-thickness table), Branson's effective moment of inertia, Ie, models the transition between uncracked and fully-cracked stiffness.",
        equations: {
          caption: "Eq. 5.1–5.6 — Serviceability Calculations",
          rows: [
            {
              label: "Effective moment of inertia, Ie",
              latex: "I_e = \\left(\\dfrac{M_{cr}}{M_a}\\right)^3 I_g + \\left[1-\\left(\\dfrac{M_{cr}}{M_a}\\right)^3\\right] I_{cr} \\;\\le\\; I_g",
            },
            { label: "Long-term deflection multiplier", latex: "\\lambda_{\\Delta} = \\dfrac{\\xi}{1+50\\rho'}" },
            { label: "Cracked-section inertia", latex: "I_{cr}=\\dfrac{b(kd)^3}{3}+nA_s(d-kd)^2" },
            { label: "Simply supported beam, uniform load", latex: "\\Delta=\\dfrac{5w\\ell^4}{384E I}" },
            { label: "Simply supported beam, midspan load", latex: "\\Delta=\\dfrac{P\\ell^3}{48E I}" },
            { label: "Cantilever, end load", latex: "\\Delta=\\dfrac{P\\ell^3}{3E I}" },
            { label: "Cantilever, uniform load", latex: "\\Delta=\\dfrac{w\\ell^4}{8E I}" },
          ],
        },
      },
      {
        title: "Allowable Deflection Limits",
        reference: "NSCP 2015 Section 424.2.2 / ACI 318-14 Table 24.2.2",
        summary: "Computed deflection must not exceed the limits below, based on member type and what it supports.",
        table: {
          caption: "Table 5.1 — Allowable Computed Deflection",
          headers: ["Member / Condition", "Deflection Considered", "Limit"],
          rows: [
            { "Member / Condition": "Flat roofs, elements not likely damaged", "Deflection Considered": "Immediate, live load", Limit: "L/180" },
            { "Member / Condition": "Floors, elements not likely damaged", "Deflection Considered": "Immediate, live load", Limit: "L/360" },
            { "Member / Condition": "Roof/floor, elements NOT likely damaged", "Deflection Considered": "Long-term + immediate live load", Limit: "L/240" },
            { "Member / Condition": "Roof/floor, elements likely damaged", "Deflection Considered": "Long-term + immediate live load", Limit: "L/480" },
          ],
        },
      },
      {
        title: "Time-Dependent Factor, ξ",
        reference: "NSCP 2015 Section 424.2.4.1.3 / ACI 318-14 Table 24.2.4.1.3",
        summary: "Used in the long-term multiplier λΔ above.",
        table: {
          caption: "Table 5.2 — ξ vs. Sustained Load Duration",
          headers: ["Duration", "ξ"],
          rows: [
            { Duration: "3 months", "ξ": "1.0" },
            { Duration: "6 months", "ξ": "1.2" },
            { Duration: "12 months", "ξ": "1.4" },
            { Duration: "5 years or more", "ξ": "2.0" },
          ],
        },
      },
    ],
  },
  {
    moduleSlug: "column-design",
    sections: [
      {
        topicSlug: "reinforced-concrete-column",
        title: "Reinforced Concrete Column",
        reference: "ACI 318-14 Ch. 10, 22.4",
        summary:
          "Columns resist axial load and bending simultaneously. Pure axial capacity is capped to reflect unavoidable minimum eccentricity, and longitudinal steel is bounded to ensure constructability and ductility.",
        equations: {
          caption: "Eq. 6.1 — Maximum Axial Capacity, φPn,max",
          rows: [
            { label: "Tied columns", latex: "\\phi P_{n,max} = 0.80\\,\\phi\\left[0.85f'_c(A_g - A_{st}) + f_y A_{st}\\right]" },
            { label: "Spiral columns", latex: "\\phi P_{n,max} = 0.85\\,\\phi\\left[0.85f'_c(A_g - A_{st}) + f_y A_{st}\\right]" },
          ],
        },
        table: {
          caption: "Table 6.1 — Longitudinal Reinforcement Limits",
          headers: ["Quantity", "Limit"],
          rows: [
            { Quantity: "Minimum reinforcement ratio", Limit: "1% of Ag" },
            { Quantity: "Maximum reinforcement ratio", Limit: "8% of Ag" },
            { Quantity: "Minimum bars — rectangular ties", Limit: "4" },
            { Quantity: "Minimum bars — spiral columns", Limit: "6" },
          ],
        },
      },
      {
        topicSlug: "analysis-of-short-columns-p-m-interaction",
        title: "Analysis of Short Columns — P-M Interaction",
        reference: "ACI 318-14 Section 22.4",
        summary:
          "A column's axial-moment capacity is plotted as a P-M interaction diagram. The balanced point separates compression-controlled failure (concrete crushes first) from tension-controlled failure (steel yields first).",
        equations: {
          caption: "Eq. 6.2 — Balanced Condition",
          rows: [
            {
              label: "Balanced neutral axis depth, cb",
              latex: "c_b = \\dfrac{600}{600+f_y}\\,d",
            },
            {
              label: "Balanced axial load, Pb",
              latex: "P_b = 0.85 f'_c\\, a_b\\, b + A'_s f'_s - A_s f_y",
              note: "ab = β1·cb; solve companion Mb by taking moments about the plastic centroid",
            },
          ],
        },
      },
      {
        topicSlug: "analysis-of-slender-columns-non-sway-columns",
        title: "Analysis of Slender Columns — Non-Sway Columns",
        reference: "ACI 318-14 Section 6.2.5, Section 6.6.4",
        summary:
          "Slenderness (P-Δ) effects may be neglected if the column's slenderness ratio falls below the code limit; otherwise the design moment is magnified.",
        equations: {
          caption: "Eq. 6.3 — Slenderness Check & Moment Magnification (non-sway)",
          rows: [
            {
              label: "Neglect slenderness if",
              latex: "\\dfrac{k\\,\\ell_u}{r} \\le 34 - 12\\left(\\dfrac{M_1}{M_2}\\right) \\le 40",
              note: "r ≈ 0.3h for rectangular sections; M1/M2 negative for single curvature",
            },
            {
              label: "Magnified moment",
              latex: "M_c = \\delta_{ns}\\, M_2, \\qquad \\delta_{ns} = \\dfrac{C_m}{1 - P_u/(0.75P_c)} \\ge 1",
            },
          ],
        },
      },
    ],
  },
  {
    moduleSlug: "shear-design-of-columns",
    sections: [
      {
        topicSlug: "shear-analysis-and-design-of-beams",
        title: "Shear Analysis and Design of Beams",
        reference: "NSCP 2015 Section 422.5 / ACI 318-14 Section 22.5",
        summary:
          "Beam shear design compares the factored shear Vu with the design shear strength φVn. The nominal strength is the sum of concrete contribution Vc and transverse-reinforcement contribution Vs, subject to the code limits.",
        equations: {
          caption: "Eq. 8.1–8.3 — Beam Shear Strength",
          rows: [
            { label: "Nominal shear strength", latex: "V_n = V_c + V_s" },
            { label: "Design shear strength", latex: "\\phi V_n \\ge V_u" },
            { label: "Vertical stirrups", latex: "V_s = \\dfrac{A_v f_{yt} d}{s}" },
          ],
        },
      },
      {
        title: "Long-Term Deflection",
        reference: "NSCP 2015 Section 424.2.4.1.3 / ACI 318-14 Section 24.2.4.1",
        summary: "Add the immediate deflection from sustained loads to the long-term creep and shrinkage effects.",
        equations: {
          caption: "Eq. 5.7–5.8 — Long-Term Deflection",
          rows: [
            { label: "Long-term multiplier", latex: "\\lambda_{\\Delta}=\\dfrac{\\xi}{1+50\\rho'}" },
            { label: "Total long-term deflection", latex: "\\Delta_{LT}=\\Delta_L+\\lambda_{\\Delta D}\\Delta_D+\\lambda_{\\Delta S}\\Delta_S" },
          ],
        },
      },
      {
        title: "Crack Control",
        reference: "NSCP 2015 Section 424.2.4.1 / ACI 318-14 Section 24.3",
        summary: "Limit the spacing of tension bars so cracks remain controlled under service loads.",
        equations: {
          caption: "Eq. 5.9 — Maximum Tension-Bar Spacing",
          rows: [
            { label: "Maximum spacing, first limit", latex: "s_{max}=380\\left(\\dfrac{280}{f_s}\\right)-2.5c_c" },
            { label: "Maximum spacing, second limit", latex: "s_{max}=300\\left(\\dfrac{280}{f_s}\\right)" },
          ],
        },
      },
      {
        topicSlug: "location-of-factored-shear",
        title: "Location of Factored Shear",
        reference: "NSCP 2015 Section 422.5.1 / ACI 318-14 Section 22.5.1",
        summary:
          "Determine Vu at the critical section specified by the code, normally near the face of the support for a beam. Include the effects of concentrated loads and support reactions when locating the governing section.",
      },
      {
        topicSlug: "minimum-transverse-reinforcement-area-beams",
        title: "Minimum Transverse Reinforcement Area",
        reference: "NSCP 2015 Section 422.5 / ACI 318-14 Sections 9.6.3, 22.5",
        summary:
          "Minimum stirrups provide a reliable crack-control and post-cracking load path even when the calculated concrete shear contribution is sufficient. Verify the required area using the governing concrete strength, web width, and steel grade.",
        equations: {
          caption: "Eq. 8.4 — Minimum Beam Stirrups",
          rows: [
            {
              label: "Minimum transverse steel",
              latex: "A_v \\ge A_{v,\\min}",
              note: "Use the larger applicable NSCP 2015 / ACI 318-14 expression and provide at least the required number of legs.",
            },
          ],
        },
      },
      {
        topicSlug: "maximum-spacing-shear-reinforcement-beams",
        title: "Maximum Spacing of Shear Reinforcement",
        reference: "NSCP 2015 Section 422.5.8 / ACI 318-14 Section 22.5.8",
        summary:
          "Stirrup spacing is limited by effective depth, web width, and the shear demand relative to the concrete contribution. Use the smaller code limit and reduce spacing where seismic detailing provisions apply.",
        table: {
          caption: "Table 8.1 — Typical Beam Stirrup Spacing Limits",
          headers: ["Condition", "Spacing limit"],
          rows: [
            { Condition: "Moderate required shear reinforcement", "Spacing limit": "min(d/2, 600 mm)" },
            { Condition: "High required shear reinforcement", "Spacing limit": "min(d/4, 300 mm)" },
          ],
        },
      },
      {
        topicSlug: "shear-analysis-and-design-of-columns",
        title: "Shear Analysis and Design of Columns",
        reference: "NSCP 2015 Section 422.5.6 / ACI 318-14 Section 22.5.6",
        summary:
          "Axial compression increases a column's concrete shear capacity relative to a beam with no axial load. Nu is taken positive for compression.",
        equations: {
          caption: "Eq. 7.1 — Concrete Shear Capacity with Axial Load",
          rows: [
            {
              label: "Vc (with axial compression)",
              latex: "V_c = 0.17\\left(1 + \\dfrac{N_u}{14A_g}\\right)\\lambda\\sqrt{f'_c}\\; b_w d",
              note: "Take Nu as positive for compression. Use the units and definitions given in the adopted code edition.",
            },
          ],
        },
        table: {
          caption: "Table 7.1 — Lateral Tie Spacing (Column Confinement)",
          headers: ["Limit", "Value"],
          rows: [
            { Limit: "16 × longitudinal bar diameter", Value: "governs if smallest" },
            { Limit: "48 × tie bar diameter", Value: "governs if smallest" },
            { Limit: "Least column dimension", Value: "governs if smallest" },
          ],
        },
      },
      {
        topicSlug: "minimum-transverse-reinforcement-area-columns",
        title: "Minimum Transverse Reinforcement Area for Columns",
        reference: "NSCP 2015 Sections 425.7.2.1–425.7.2.4 / ACI 318-14 Section 25.7.2",
        summary:
          "Ties or hoops restrain longitudinal bars, confine the core, and prevent premature buckling of the longitudinal reinforcement. Provide the code-required area and detailing for the column tie arrangement.",
        equations: {
          caption: "Eq. 8.2 — Column Transverse Reinforcement Check",
          rows: [
            {
              label: "Required tie area",
              latex: "A_{sh} \\ge A_{sh,\\min}",
              note: "The applicable minimum depends on the core dimensions, longitudinal steel ratio, concrete strength, tie steel strength, and seismic detailing category.",
            },
          ],
        },
      },
      {
        topicSlug: "minimum-spiral-reinforcement-ratio",
        title: "Minimum Spiral Reinforcement Ratio",
        reference: "NSCP 2015 Sections 425.7.3.1–425.7.3.5 / ACI 318-14 Section 25.7.3",
        summary:
          "A spiral must provide enough volumetric reinforcement to confine the concrete core and support the intended compression behavior. Compute the volumetric ratio from the core dimensions and spiral bar arrangement.",
        equations: {
          caption: "Eq. 8.3 — Spiral Reinforcement Ratio",
          rows: [
            {
              label: "Volumetric ratio",
              latex: "\\rho_s = \\dfrac{4A_{sp}}{s d_c}",
              note: "Use the core diameter dc and clear spiral pitch s as defined by the adopted code provisions.",
            },
          ],
        },
      },
      {
        topicSlug: "maximum-spacing-shear-reinforcement-columns",
        title: "Maximum Spacing of Shear Reinforcement for Columns",
        reference: "NSCP 2015 Sections 425.7.2–425.7.3 / ACI 318-14 Sections 25.7.2–25.7.3",
        summary:
          "Column tie and spiral spacing is limited to keep longitudinal bars laterally supported and the core adequately confined. The smallest applicable limit governs, with tighter spacing required in confinement regions where applicable.",
        table: {
          caption: "Table 8.3 — Common Column Tie Spacing Limits",
          headers: ["Limit", "Value"],
          rows: [
            { Limit: "Longitudinal-bar diameter multiple", Value: "16db" },
            { Limit: "Tie-bar diameter multiple", Value: "48dt" },
            { Limit: "Least column dimension", Value: "least column dimension" },
          ],
        },
      },
    ],
  },
];

const totalReferenceTopics = chapters.reduce((total, chapter) => total + chapter.sections.length, 0);

function SourceLabel({ reference }: { reference: string }) {
  return (
    <div className="mt-3 inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border border-[var(--blue)]/20 bg-[var(--blue)]/[0.05] px-2.5 py-1.5 text-[10px] leading-relaxed text-[var(--blue)] sm:text-[11px]">
      <span className="font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Code source</span>
      <span className="break-words">{reference}</span>
    </div>
  );
}

function EquationTable({
  eq,
  reference,
}: {
  eq: NonNullable<RefSection["equations"]>;
  reference: string;
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--blue)]/25 bg-[var(--blue)]/[0.04]">
      <div className="border-b border-[var(--blue)]/20 px-3 py-3 sm:px-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--blue)] sm:text-[11px]">
          Formula reference
        </div>
        <div className="mt-1 text-[12px] font-semibold text-[var(--text)] sm:text-[13px]">{eq.caption}</div>
        <SourceLabel reference={reference} />
      </div>
      <div className="divide-y divide-[var(--blue)]/15">
        {eq.rows.map((row, i) => (
          <div key={i} className="flex min-w-0 flex-col gap-2 px-3 py-3.5 sm:flex-row sm:items-start sm:gap-6 sm:px-4">
            <div className="shrink-0 text-[12px] font-semibold leading-relaxed text-[var(--text)] sm:w-[32%]">
              {row.label}
            </div>
            <div className="min-w-0 flex-1 overflow-x-auto text-[var(--text)]">
              <BlockMath math={row.latex} />
              {row.note && <div className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">{row.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeTable({
  table,
  reference,
}: {
  table: NonNullable<RefSection["table"]>;
  reference: string;
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--border)]">
      <div className="border-b border-[var(--border)] bg-[var(--bg)] px-3 py-3 sm:px-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:text-[11px]">
          Code table
        </div>
        <div className="mt-1 text-[12px] font-semibold text-[var(--text)] sm:text-[13px]">{table.caption}</div>
        <SourceLabel reference={reference} />
      </div>
      <table className="w-full border-collapse text-[12px] sm:text-[13px]">
        <thead>
          <tr className="bg-[var(--bg)]">
            {table.headers.map((h) => (
              <th key={h} className="border-b border-[var(--border)] px-3 py-2.5 text-left font-semibold text-[var(--text)] sm:px-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
              {table.headers.map((h) => (
                <td key={h} className="px-3 py-2.5 leading-relaxed text-[var(--text-muted)] sm:px-4">
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReferencesPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] px-3 py-5 text-[var(--text)] sm:px-6 sm:py-9">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[430px] opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 55% at 12% 0%, rgba(22, 140, 255, 0.12), transparent 72%), linear-gradient(to bottom, rgba(77, 124, 255, 0.05), transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1220px]">
        <header id="guide" className="overflow-hidden rounded-3xl border border-[#4d7cff]/25 bg-[var(--bg-surface)] shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_270px]">
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--blue)] sm:text-[11px]">
                <span className="rounded-full bg-[#4d7cff]/10 px-2.5 py-1">Design guide</span>
                <span className="text-[var(--text-faint)]">NSCP 2015 · ACI 318-14</span>
              </div>
              <h1 className="mt-3 max-w-3xl break-words text-[25px] font-extrabold leading-tight sm:text-[35px]">
                Reinforced Concrete Design Reference
              </h1>
              <p className="mt-3 max-w-2xl break-words text-[13px] leading-7 text-[var(--text-muted)] sm:text-[15px]">
                A simpler companion for the eight modules. Read the short explanation, check the code source, then use the formula or table.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#ch-introduction-to-rc-design"
                  className="inline-flex min-h-10 items-center rounded-lg bg-[var(--blue)] px-4 py-2 text-[12px] font-bold text-white transition hover:brightness-110"
                >
                  Start with Module 1
                </a>
                <span className="text-[11px] text-[var(--text-muted)]">Use the contents panel to jump between modules.</span>
              </div>
            </div>

            <div className="border-t border-[var(--border)] bg-[var(--bg-section)] p-5 sm:p-7 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">At a glance</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  [String(catalogModules.length), "modules"],
                  [String(totalReferenceTopics), "reference topics"],
                  ["SI", "working units"],
                  [String(chapters.filter((chapter) => chapter.sections.some((section) => section.equations)).length), "formula modules"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-3">
                    <div className="text-[16px] font-extrabold text-[var(--text)]">{value}</div>
                    <div className="mt-0.5 text-[10px] leading-snug text-[var(--text-muted)]">{label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-muted)]">
                Always confirm the adopted code edition, project loads, and detailing requirements before using a result.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="min-w-0 lg:sticky lg:top-20">
            <nav aria-label="Reference modules" className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 px-2 py-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Guide map</p>
                <span className="text-[10px] text-[var(--text-faint)]">{catalogModules.length} modules</span>
              </div>
              <ol className="mt-3 space-y-1">
                {catalogModules.map((m) => (
                  <li key={m.slug} className="min-w-0">
                    <a
                      href={`#ch-${m.slug}`}
                      className="group flex min-w-0 items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-[12px] leading-snug text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--blue)]"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[10px] font-bold text-[var(--blue)] group-hover:border-[var(--blue)]/50">
                        {m.index}
                      </span>
                      <span className="min-w-0 flex-1 break-words">{m.title}</span>
                      <span className="shrink-0 pt-0.5 text-[10px] text-[var(--text-faint)]">{m.topics.length}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-[11px] leading-relaxed text-[var(--text-muted)] sm:p-5">
              <p className="font-bold text-[var(--text)]">A simple study rhythm</p>
              <ol className="mt-3 space-y-2.5">
                <li className="flex gap-2"><span className="font-bold text-[var(--blue)]">1.</span><span>Understand the short explanation.</span></li>
                <li className="flex gap-2"><span className="font-bold text-[var(--blue)]">2.</span><span>Check the code source and assumptions.</span></li>
                <li className="flex gap-2"><span className="font-bold text-[var(--blue)]">3.</span><span>Apply the formula, then verify the result.</span></li>
              </ol>
            </div>
          </aside>

          <div className="min-w-0 space-y-6 sm:space-y-8">
            {chapters.map((chapter) => {
              const mod = catalogModules.find((m) => m.slug === chapter.moduleSlug);
              if (!mod) return null;
              const formulaCount = chapter.sections.filter((section) => section.equations).length;
              const tableCount = chapter.sections.filter((section) => section.table).length;

              return (
                <section
                  key={chapter.moduleSlug}
                  id={`ch-${chapter.moduleSlug}`}
                  className="min-w-0 scroll-mt-20 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm"
                >
                  <header className="border-b border-[var(--border)] bg-[var(--bg-section)] px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--blue)]/45 bg-[var(--blue)]/10 text-[13px] font-extrabold text-[var(--blue)]">
                          {mod.index}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--blue)]">Module {mod.index}</p>
                          <h2 className="mt-1 break-words text-[19px] font-extrabold leading-tight sm:text-[23px]">{mod.title}</h2>
                          <p className="mt-1.5 max-w-2xl break-words text-[12px] leading-relaxed text-[var(--text-muted)] sm:text-[13px]">{mod.description}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 text-[10px] text-[var(--text-muted)] sm:justify-end">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1">{chapter.sections.length} topics</span>
                        {formulaCount > 0 && <span className="rounded-full border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-2.5 py-1 text-[var(--blue)]">{formulaCount} formulas</span>}
                        {tableCount > 0 && <span className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1">{tableCount} tables</span>}
                      </div>
                    </div>
                  </header>

                  <div className="divide-y divide-[var(--border)]">
                    {chapter.sections.map((section, sectionIndex) => (
                      <article key={section.title} className="min-w-0 p-4 sm:p-6">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="hidden shrink-0 pt-0.5 text-[10px] font-bold tabular-nums text-[var(--text-faint)] sm:block">
                            {String(sectionIndex + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="break-words text-[16px] font-bold leading-snug text-[var(--text)] sm:text-[18px]">{section.title}</h3>
                            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">In plain language</p>
                            <p className="mt-1.5 max-w-3xl break-words text-[13px] leading-7 text-[var(--text-muted)] sm:text-[14px]">{section.summary}</p>
                            <SourceLabel reference={section.reference} />
                            {section.equations && (
                              <div className="min-w-0 max-w-full overflow-x-auto">
                                <EquationTable eq={section.equations} reference={section.reference} />
                              </div>
                            )}
                            {section.table && (
                              <div className="min-w-0 max-w-full overflow-x-auto">
                                <CodeTable table={section.table} reference={section.reference} />
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-4xl break-words border-t border-[var(--border)] pt-5 text-[11px] leading-relaxed text-[var(--text-muted)] sm:text-[12px]">
          Educational reference only. This page summarizes the supplied module material and does not replace the full NSCP 2015, ACI 318-14, project specifications, or professional engineering review.
        </p>
      </div>
    </main>
  );
}
