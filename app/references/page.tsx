"use client";

import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { modules } from "@/lib/data";

interface TableRow {
  [key: string]: string;
}

interface EqRow {
  label: string;
  latex: string;
  note?: string;
}

interface RefSection {
  topicSlug?: string; // matches a topic slug in lib/data.ts when applicable
  title: string;
  reference: string;
  summary: string;
  table?: { caption: string; headers: string[]; rows: TableRow[] };
  equations?: { caption: string; rows: EqRow[] };
}

interface RefChapter {
  moduleSlug: string; // must match modules[].slug in lib/data.ts
  sections: RefSection[];
}

// Content is grouped to mirror the 7 modules/topics defined in lib/data.ts exactly.
const chapters: RefChapter[] = [
  {
    moduleSlug: "introduction-to-rc-design",
    sections: [
      {
        topicSlug: "units-conversion",
        title: "Units Conversion",
        reference: "NSCP 2015 uses SI (metric) units throughout",
        summary:
          "All equations in this reference use SI units unless noted: force in N or kN, stress in MPa (N/mm²), length in mm.",
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
        reference: "ACI 318-19 Ch. 19",
        summary:
          "Concrete is specified by its 28-day compressive strength, f'c. Its modulus of elasticity and modulus of rupture (used for cracking checks) are both derived from f'c.",
        equations: {
          caption: "Eq. 1.1–1.2 — Concrete Properties (normalweight, λ = 1)",
          rows: [
            { label: "Modulus of elasticity, Ec", latex: "E_c = 4700\\sqrt{f'_c}\\ \\text{(MPa)}" },
            { label: "Modulus of rupture, fr", latex: "f_r = 0.62\\,\\lambda\\sqrt{f'_c}\\ \\text{(MPa)}" },
          ],
        },
      },
      {
        topicSlug: "reinforcing-steel",
        title: "Reinforcing Steel",
        reference: "NSCP 2015 / ASTM A615",
        summary:
          "Reinforcing bars are specified by grade (yield strength, fy). Steel is assumed elastic-perfectly-plastic: elastic up to fy, then yields at constant stress.",
        table: {
          caption: "Table 1.2 — Common Grades",
          headers: ["Grade", "fy", "Es"],
          rows: [
            { Grade: "Grade 40", fy: "275 MPa", Es: "200,000 MPa" },
            { Grade: "Grade 60", fy: "420 MPa", Es: "200,000 MPa" },
            { Grade: "Grade 75", fy: "520 MPa", Es: "200,000 MPa" },
          ],
        },
      },
      {
        topicSlug: "reinforced-concrete",
        title: "Reinforced Concrete",
        reference: "ACI 318-19 §22.2",
        summary:
          "Reinforced concrete works because steel and concrete bond together and share load: concrete resists compression, steel resists tension, and both are assumed to strain together (plane sections remain plane).",
      },
      {
        topicSlug: "design-codes",
        title: "Design Codes",
        reference: "NSCP 2015 §203 / ACI 318-19 Ch. 5, 21",
        summary:
          "Members are proportioned for the largest demand among the factored load combinations below, and nominal strength is reduced by φ to obtain design strength.",
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
        reference: "ACI 318-19 Table 21.2.2",
        summary: "φ accounts for variability in materials, workmanship, and the ductility of the failure mode.",
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
        reference: "NSCP 2015 / ACI 318-19 §22.2",
        summary:
          "As applied moment increases, a beam section passes through five behavioral stages — uncracked, cracked-elastic, service, steel yield, and ultimate — each with a different stiffness (slope of the M–φ curve).",
      },
      {
        topicSlug: "stage-1-2-uncracked-section",
        title: "Stage 1 & 2 — Uncracked Section",
        reference: "ACI 318-19 §24.2.3.5",
        summary:
          "Below the cracking moment, the full (gross) concrete section resists load elastically. Cracking occurs once extreme-fiber tensile stress reaches the modulus of rupture, fr.",
        equations: {
          caption: "Eq. 2.1 — Cracking Moment",
          rows: [{ label: "Mcr", latex: "M_{cr} = \\dfrac{f_r \\, I_g}{y_t}" }],
        },
      },
      {
        topicSlug: "stage-3-service-loads",
        title: "Stage 3 — Service Loads",
        reference: "Working-stress / elastic cracked-section theory",
        summary:
          "Beyond cracking, tension concrete is neglected and the cracked transformed section is used. The modular ratio n converts steel area to an equivalent concrete area.",
        equations: {
          caption: "Eq. 2.2 — Cracked Section (singly reinforced)",
          rows: [
            { label: "Modular ratio, n", latex: "n = \\dfrac{E_s}{E_c}" },
            {
              label: "Neutral axis depth, kd",
              latex: "\\tfrac{1}{2} b (kd)^2 = n A_s (d - kd)",
              note: "solve the quadratic for kd; Icr follows from the transformed section",
            },
          ],
        },
      },
      {
        topicSlug: "stage-4-reinforcing-steel-yields",
        title: "Stage 4 — Reinforcing Steel Yields",
        reference: "ACI 318-19 §21.2.2",
        summary:
          "As load increases further, tension steel reaches its yield strain, εy = fy/Es. Beyond this point, additional moment capacity comes mainly from increasing internal lever arm, not steel stress.",
      },
      {
        topicSlug: "stage-5-concrete-crushes",
        title: "Stage 5 — Concrete Crushes",
        reference: "ACI 318-19 §22.2.2.1",
        summary:
          "The section reaches its ultimate capacity when the extreme concrete compression fiber reaches its assumed crushing strain of 0.003. This is the basis of ultimate strength design.",
      },
      {
        topicSlug: "stage-5-based-on-nscp-2015",
        title: "Stage 5 — Based on NSCP 2015",
        reference: "NSCP 2015 §422 / ACI 318-19 §22.2.2.4",
        summary:
          "At the crushing strain, the actual nonlinear concrete stress distribution is replaced with the equivalent rectangular (Whitney) stress block for design, governed by β1.",
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
    moduleSlug: "flexural-design-of-beams-slabs",
    sections: [
      {
        topicSlug: "design-of-singly-reinforced-rc-beams",
        title: "Design of Singly Reinforced RC Beams",
        reference: "ACI 318-19 Ch. 9, 22",
        summary:
          "Tension steel alone resists the internal tension couple. ρ must fall between ρmin and ρmax so the section is ductile and tension-controlled (φ = 0.90).",
        equations: {
          caption: "Eq. 3.1–3.6 — Singly Reinforced Rectangular Section",
          rows: [
            { label: "Nominal moment coefficient", latex: "R_n = \\dfrac{M_u}{\\phi \\, b \\, d^2}" },
            { label: "Steel ratio coefficient", latex: "m = \\dfrac{f_y}{0.85 \\, f'_c}" },
            { label: "Required steel ratio", latex: "\\rho = \\dfrac{1}{m}\\left[1 - \\sqrt{1 - \\dfrac{2mR_n}{f_y}}\\right]" },
            { label: "Minimum steel ratio", latex: "\\rho_{min} = \\max\\left(\\dfrac{1.4}{f_y}, \\dfrac{\\sqrt{f'_c}}{4f_y}\\right)" },
            { label: "Balanced steel ratio", latex: "\\rho_b = \\dfrac{0.85 f'_c \\beta_1}{f_y}\\left(\\dfrac{600}{600+f_y}\\right)" },
            { label: "Maximum steel ratio", latex: "\\rho_{max} = 0.75\\,\\rho_b" },
          ],
        },
      },
      {
        topicSlug: "ultimate-moment-capacity-of-doubly-reinforced-rc-beams",
        title: "Ultimate Moment Capacity of Doubly Reinforced RC Beams",
        reference: "ACI 318-19 §22.2, 22.3",
        summary:
          "When compression steel (As') is present, the section resists moment through two internal couples: the concrete–tension-steel couple and the compression-steel–tension-steel couple. Compression steel stress must be checked, not assumed at fy.",
        equations: {
          caption: "Eq. 3.7–3.9 — Analysis (given As, As')",
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
          ],
        },
      },
      {
        topicSlug: "design-of-doubly-reinforced-rectangular-beams",
        title: "Design of Doubly-Reinforced Rectangular Beams",
        reference: "ACI 318-19 §9.3, 9.6",
        summary:
          "Used when Mu exceeds the tension-controlled capacity of a singly reinforced section (b, d fixed). The moment is split into a singly reinforced part (at ρmax) and a second couple carried by added tension + compression steel.",
        equations: {
          caption: "Eq. 3.10–3.11 — Required Steel Areas",
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
          ],
        },
      },
      {
        topicSlug: "approximate-moment",
        title: "Approximate Moment",
        reference: "ACI 318-19 §6.5",
        summary:
          "For continuous beams and one-way slabs meeting the applicability limits of §6.5.1 (≥ 2 spans, roughly equal spans, uniform load, Lr/L ≤ 3), approximate moment coefficients may be used instead of a full elastic analysis.",
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
        reference: "ACI 318-19 Ch. 7, 24",
        summary:
          "One-way slabs are designed per unit (1 m) strip width using the same flexural provisions as beams. Shrinkage and temperature steel is required transverse to the main reinforcement.",
        equations: {
          caption: "Eq. 3.13 — Minimum Shrinkage & Temperature Reinforcement",
          rows: [
            {
              label: "ρs,min",
              latex: "\\rho_{s,min} = \\begin{cases} 0.0020 & f_y < 420\\text{ MPa} \\\\ 0.0018 & f_y = 420\\text{ MPa} \\end{cases}",
              note: "ACI 318-19 §24.4.3.2; As = ρs,min · (1000 mm) · h per meter width",
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
      {
        title: "Shear Design of Beams",
        reference: "ACI 318-19 Ch. 22 (supplementary — not a listed topic, but required alongside flexural design)",
        summary:
          "Every beam designed for flexure above must also be checked for shear. Concrete alone provides Vc; stirrups are added once Vu exceeds 0.5φVc.",
        equations: {
          caption: "Eq. 3.14–3.15 — Shear Capacity",
          rows: [
            { label: "Concrete shear capacity", latex: "V_c = 0.17\\,\\lambda\\sqrt{f'_c}\\; b_w d" },
            { label: "Required stirrup spacing", latex: "s = \\dfrac{A_v f_{yt} d}{V_s}" },
          ],
        },
        table: {
          caption: "Table 3.2 — Maximum Stirrup Spacing",
          headers: ["Condition", "Maximum spacing"],
          rows: [
            { Condition: "Vs ≤ 0.33λ√f'c·bw·d", "Maximum spacing": "min(d/2, 600 mm)" },
            { Condition: "Vs > 0.33λ√f'c·bw·d", "Maximum spacing": "min(d/4, 300 mm)" },
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
        reference: "ACI 318-19 §6.3.2",
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
        reference: "ACI 318-19 §22.2.2",
        summary:
          "A flanged section behaves as a rectangular beam of width be if the compression stress block depth a falls entirely within the flange thickness hf. Otherwise, the flange overhangs must be analyzed separately from the web.",
        equations: {
          caption: "Eq. 4.2 — Depth Check & Two-Part Moment (a > hf case)",
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
        reference: "ACI 318-19 Ch. 24, Table 24.2.2",
        summary:
          "Where deflection is computed explicitly (not covered by the minimum-thickness table), Branson's effective moment of inertia, Ie, models the transition between uncracked and fully-cracked stiffness.",
        equations: {
          caption: "Eq. 5.1–5.2 — Effective Moment of Inertia & Long-Term Multiplier",
          rows: [
            {
              label: "Effective moment of inertia, Ie",
              latex: "I_e = \\left(\\dfrac{M_{cr}}{M_a}\\right)^3 I_g + \\left[1-\\left(\\dfrac{M_{cr}}{M_a}\\right)^3\\right] I_{cr} \\;\\le\\; I_g",
            },
            { label: "Long-term deflection multiplier", latex: "\\lambda_{\\Delta} = \\dfrac{\\xi}{1+50\\rho'}" },
          ],
        },
      },
      {
        title: "Allowable Deflection Limits",
        reference: "ACI 318-19 Table 24.2.2",
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
        reference: "ACI 318-19 Table 24.2.4.1.3",
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
        reference: "ACI 318-19 Ch. 10, 22.4",
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
        reference: "ACI 318-19 §22.4",
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
        reference: "ACI 318-19 §6.2.5, §6.6.4",
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
        topicSlug: "shear-analysis-and-design-of-columns",
        title: "Shear Analysis and Design of Columns",
        reference: "ACI 318-19 §22.5.6",
        summary:
          "Axial compression increases a column's concrete shear capacity relative to a beam with no axial load. Nu is taken positive for compression.",
        equations: {
          caption: "Eq. 7.1 — Concrete Shear Capacity with Axial Load",
          rows: [
            {
              label: "Vc (with axial compression)",
              latex: "V_c = 0.17\\left(1 + \\dfrac{N_u}{14A_g}\\right)\\lambda\\sqrt{f'_c}\\; b_w d",
              note: "Nu in N, Ag in mm²; verify current coefficients against your copy of ACI 318-19 Table 22.5.5.1 before use in a defense — the 2019 edition reorganized this table and added a size-effect factor, λs.",
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
    ],
  },
];

function EquationTable({ eq }: { eq: NonNullable<RefSection["equations"]> }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-[#4d7cff]/30 bg-[#4d7cff]/[0.04]">
      <div className="border-b border-[#4d7cff]/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#4d7cff]">
        {eq.caption}
      </div>
      <div className="divide-y divide-[#4d7cff]/15">
        {eq.rows.map((row, i) => (
          <div key={i} className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-4">
            <div className="shrink-0 pt-1 text-[11px] font-medium text-[var(--text)] sm:w-[34%]">
              {row.label}
            </div>
            <div className="min-w-0 flex-1 overflow-x-auto">
              <BlockMath math={row.latex} />
              {row.note && <div className="mt-1 text-[10px] italic text-[var(--text-muted)]">{row.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeTable({ table }: { table: NonNullable<RefSection["table"]> }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-[var(--border)]">
      <div className="border-b border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {table.caption}
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-[var(--bg)]">
            {table.headers.map((h) => (
              <th key={h} className="border-b border-[var(--border)] px-3 py-2 text-left font-semibold text-[var(--text)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
              {table.headers.map((h) => (
                <td key={h} className="px-3 py-2 text-[var(--text-muted)]">
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
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[760px]">
        <h1 className="text-[22px] font-extrabold">NSCP 2015 / ACI 318 Design Reference</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Organized to mirror the {modules.length} learning modules — each chapter below
          corresponds 1:1 to a module in <code className="text-[10px]">lib/data.ts</code>.
        </p>

        {/* Table of contents, pulled live from modules[] */}
        <nav className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Contents</p>
          <ol className="mt-2 space-y-1">
            {modules.map((m) => (
              <li key={m.slug}>
                <a href={`#ch-${m.slug}`} className="text-[12px] text-[#4d7cff] hover:underline">
                  Module {m.index}. {m.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-6 space-y-10">
          {chapters.map((chapter) => {
            const mod = modules.find((m) => m.slug === chapter.moduleSlug);
            if (!mod) return null;
            return (
              <section key={chapter.moduleSlug} id={`ch-${chapter.moduleSlug}`}>
                <h2 className="border-b border-[var(--border)] pb-2 text-[16px] font-extrabold">
                  Module {mod.index}. {mod.title}
                </h2>
                <p className="mt-1.5 text-[11.5px] text-[var(--text-muted)]">{mod.description}</p>

                <div className="mt-4 space-y-3">
                  {chapter.sections.map((section) => (
                    <div
                      key={section.title}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[13.5px] font-bold text-[var(--text)]">{section.title}</h3>
                        <span className="whitespace-nowrap text-[10px] text-[#4d7cff]">{section.reference}</span>
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-muted)]">{section.summary}</p>
                      {section.equations && <EquationTable eq={section.equations} />}
                      {section.table && <CodeTable table={section.table} />}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-8 text-[10px] text-[var(--text-muted)]">
          This summary is for educational reference only and does not replace the full
          text of NSCP 2015 or ACI 318-19. Always consult the official published
          standards for design and construction purposes.
        </p>
      </div>
    </div>
  );
}