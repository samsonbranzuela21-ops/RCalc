export type Module1Illustration =
  | "units"
  | "concrete"
  | "steel"
  | "reinforced-concrete"
  | "codes";

export interface Module1Formula {
  label: string;
  math: string;
  note?: string;
}

export interface Module1Section {
  id: string;
  title: string;
  summary: string;
  paragraphs?: string[];
  bullets?: string[];
  formulas?: Module1Formula[];
  note?: string;
}

export interface Module1TopicContent {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  illustration: Module1Illustration;
  objectives: string[];
  sections: Module1Section[];
  checkQuestion: string;
  checkAnswer: string;
}

export const module1Topics: Module1TopicContent[] = [
  {
    slug: "units-conversion",
    eyebrow: "01 · Foundation skill",
    title: "Units Conversion",
    summary:
      "Use one consistent unit system before substituting values into reinforced-concrete equations.",
    illustration: "units",
    objectives: [
      "Recognize the SI units used in reinforced-concrete design.",
      "Convert lengths, forces, stresses, and moments without losing powers of ten.",
      "Keep kN·m input moments consistent with N·mm calculation equations.",
    ],
    sections: [
      {
        id: "si-system",
        title: "The working SI system",
        summary: "Most calculations in this site use millimetres, newtons, and megapascals.",
        bullets: [
          "Length: mm for section dimensions, bar spacing, cover, and effective depth.",
          "Force: N in equations; kN is convenient for reporting loads and reactions.",
          "Stress: MPa, which is exactly N/mm².",
          "Moment: kN·m for input and reporting, but N·mm when multiplied by mm-based section quantities.",
        ],
        note:
          "A value is not complete until its unit is known. Write the unit beside every intermediate result while learning.",
      },
      {
        id: "conversion-rules",
        title: "Core conversion rules",
        summary: "These relationships are enough for most introductory RC calculations.",
        formulas: [
          {
            label: "Length",
            math: String.raw`1\,\text{m}=1000\,\text{mm},\qquad 1\,\text{in}=25.4\,\text{mm}`,
          },
          {
            label: "Force",
            math: String.raw`1\,\text{kN}=1000\,\text{N}`,
          },
          {
            label: "Stress",
            math: String.raw`1\,\text{MPa}=1\,\text{N/mm}^2`,
          },
          {
            label: "Moment",
            math: String.raw`1\,\text{kN}\cdot\text{m}=10^6\,\text{N}\cdot\text{mm}`,
          },
        ],
      },
      {
        id: "worked-example",
        title: "Worked conversion example",
        summary: "Convert each quantity before using it in the same equation.",
        paragraphs: [
          "For a 4.50 m beam span, the millimetre value is 4,500 mm. A 180 kN·m factored moment becomes 180 × 10⁶ N·mm. If f′c = 28 MPa, the same stress is 28 N/mm²; no additional factor is required.",
        ],
        formulas: [
          {
            label: "Example",
            math: String.raw`4.50\,\text{m}=4.50(1000)=4500\,\text{mm}`,
            note: String.raw`180\,\text{kN}\cdot\text{m}=180(10^6)=180{,}000{,}000\,\text{N}\cdot\text{mm}`,
          },
        ],
      },
      {
        id: "design-check",
        title: "Quick design check",
        summary: "Before pressing calculate, check the unit family of every input.",
        bullets: [
          "Are b, h, d, cover, and bar diameters all in mm?",
          "Are f′c and fy both in MPa?",
          "If the equation uses N·mm, was the input kN·m multiplied by 10⁶?",
          "Does the answer magnitude make sense compared with the input?",
        ],
      },
    ],
    checkQuestion: "What factor converts kN·m to N·mm?",
    checkAnswer: "Multiply by 10⁶. One kilonewton is 1,000 newtons and one metre is 1,000 millimetres.",
  },
  {
    slug: "concrete",
    eyebrow: "02 · Material behavior",
    title: "Concrete Properties",
    summary:
      "Concrete provides stiffness and strong compression resistance, while its tensile resistance is limited and brittle.",
    illustration: "concrete",
    objectives: [
      "Identify the ingredients and common forms of concrete.",
      "Interpret f′c, Ec, fr, density, and Poisson’s ratio.",
      "Recognize the difference between service behavior and ultimate compression behavior.",
    ],
    sections: [
      {
        id: "ingredients",
        title: "What concrete contains",
        summary: "Concrete is a composite material rather than a single ingredient.",
        bullets: [
          "Cement and water form the paste that binds the aggregates.",
          "Fine aggregate is commonly sand; coarse aggregate is commonly gravel or crushed stone.",
          "Air voids are present even in properly compacted concrete.",
          "Admixtures may modify setting time, workability, strength development, or durability.",
        ],
        note:
          "The water–cement ratio strongly affects strength and durability, but the final design value must come from the specified mixture and project requirements.",
      },
      {
        id: "strength-and-stiffness",
        title: "Strength and stiffness parameters",
        summary: "These parameters appear repeatedly in analysis and design equations.",
        formulas: [
          {
            label: "Specified compressive strength",
            math: String.raw`f'_c=\text{specified concrete compressive strength at the reference age}`,
            note: "The reference age is commonly 28 days unless the project specification says otherwise.",
          },
          {
            label: "Normalweight concrete modulus",
            math: String.raw`E_c\approx4700\sqrt{f'_c}\ \text{MPa}`,
            note: "Use the applicable code expression and modification factor for the concrete type being designed.",
          },
          {
            label: "Modulus of rupture",
            math: String.raw`f_r=0.62\lambda\sqrt{f'_c}\ \text{MPa}`,
            note: "For normalweight concrete, lambda = 1.0 in the introductory form.",
          },
        ],
      },
      {
        id: "stress-strain",
        title: "Concrete stress–strain behavior",
        summary: "Concrete is approximately linear only over an early portion of its loading history.",
        paragraphs: [
          "As compression increases, the response becomes nonlinear. A simplified strength-design model uses a rectangular equivalent compression block, while serviceability calculations may use elastic or effective-stiffness models. Do not use one model for every limit state without checking the method being applied.",
        ],
        bullets: [
          "Concrete is efficient in compression.",
          "Concrete tension cracks at a relatively small strain compared with compression strength.",
          "For many ultimate-strength RC calculations, the extreme compression strain is taken as 0.003.",
          "The 0.003 value belongs to a strength-design idealization; it is not a statement that all concrete remains linear until that point.",
        ],
      },
      {
        id: "material-selection",
        title: "Selecting a concrete value",
        summary: "Use the specified material, not a convenient assumed value.",
        bullets: [
          "Confirm f′c, exposure class, density, aggregate type, and age from the project documents.",
          "Use λ or other code factors when the concrete is lightweight or otherwise nonstandard.",
          "Check whether the calculation is for strength, serviceability, cracking, or deflection before selecting Ec or fr.",
        ],
      },
    ],
    checkQuestion: "Why is concrete usually paired with reinforcing steel in a beam?",
    checkAnswer: "Concrete is strong in compression but weak and crack-sensitive in tension; reinforcing steel carries much of the tension after cracking.",
  },
  {
    slug: "reinforcing-steel",
    eyebrow: "03 · Reinforcement behavior",
    title: "Reinforcing Steel",
    summary:
      "Reinforcing bars provide tensile resistance, ductility, and a reliable force path when bonded to concrete.",
    illustration: "steel",
    objectives: [
      "Explain why deformed bars are used in reinforced concrete.",
      "Relate yield strength, modulus of elasticity, and yield strain.",
      "Read a simplified reinforcing-steel stress–strain diagram.",
    ],
    sections: [
      {
        id: "purpose-and-bond",
        title: "Purpose of reinforcing steel",
        summary: "Steel complements the weaknesses of concrete.",
        bullets: [
          "It carries tension in flexural members after concrete cracks.",
          "It can carry compression where required, subject to stability and detailing limits.",
          "It improves ductility, allowing warning before a fully brittle failure.",
          "Deformations on the bar surface improve mechanical interlock and bond with concrete.",
        ],
      },
      {
        id: "stress-strain",
        title: "Stress–strain properties",
        summary: "The elastic slope and yield point control many introductory calculations.",
        formulas: [
          {
            label: "Elastic modulus",
            math: String.raw`E_s\approx200{,}000\ \text{MPa}`,
          },
          {
            label: "Yield strain",
            math: String.raw`\varepsilon_y=\dfrac{f_y}{E_s}`,
          },
          {
            label: "Elastic stress",
            math: String.raw`f_s=E_s\varepsilon_s\qquad\text{when }|f_s|<f_y`,
          },
        ],
        paragraphs: [
          "After yielding, the simplified elastic–perfectly plastic model limits the calculated stress to approximately fy. Actual bars may strain-harden beyond yield; use the model required by the design procedure.",
        ],
      },
      {
        id: "bar-sizes-and-grades",
        title: "Bar sizes and grades",
        summary: "Bar diameter and grade affect area, spacing, development, and capacity.",
        bullets: [
          "Metric bar diameters commonly encountered in RC work include 10, 12, 16, 20, 25, 28, 32, 36, 40, and 50 mm; availability must be confirmed for the project.",
          "The bar area is based on diameter: Ab = πdb²/4.",
          "fy is the specified yield strength; do not confuse it with the applied steel stress fs.",
          "Use the specified standard and grade for the project. Do not infer a grade from color, appearance, or a supplier label alone.",
        ],
        formulas: [
          {
            label: "Area of one round bar",
            math: String.raw`A_b=\dfrac{\pi d_b^2}{4}`,
          },
        ],
      },
      {
        id: "worked-example",
        title: "Worked example: yield strain",
        summary: "A small strain value can still represent a large steel stress.",
        formulas: [
          {
            label: "For fy = 420 MPa",
            math: String.raw`\varepsilon_y=\dfrac{420}{200{,}000}=0.00210`,
            note: "That is about 0.21% strain. Compare the calculated strain with εy before assuming that the bar has yielded.",
          },
        ],
      },
    ],
    checkQuestion: "What must be checked before assuming that tension steel has yielded?",
    checkAnswer: "Compare the compatible steel strain εs with the yield strain εy = fy/Es. If εs is smaller, use fs = Esεs instead of fy.",
  },
  {
    slug: "reinforced-concrete",
    eyebrow: "04 · Composite action",
    title: "Reinforced Concrete Basics",
    summary:
      "Reinforced concrete works because bonded concrete and steel act together while carrying different parts of the internal force system.",
    illustration: "reinforced-concrete",
    objectives: [
      "Describe composite action between concrete and reinforcing steel.",
      "Identify where compression and tension occur in a typical beam.",
      "Connect cracking, yielding, and crushing to the design workflow.",
    ],
    sections: [
      {
        id: "composite-action",
        title: "How the materials act together",
        summary: "Bond transfers force between the steel and surrounding concrete.",
        paragraphs: [
          "Before cracking, concrete and steel share strain according to their stiffness and location. After the concrete in the tension zone cracks, the reinforcing bars bridge the cracks and carry most of the tensile force. The compression zone remains useful because concrete has high compression capacity.",
        ],
        bullets: [
          "Compatibility: bonded materials have compatible deformation at the same location.",
          "Equilibrium: internal compression and tension must balance for a section without axial force.",
          "Constitutive behavior: concrete and steel stresses come from their respective material models.",
        ],
      },
      {
        id: "beam-zones",
        title: "Compression zone and tension zone",
        summary: "The bending direction determines which face is in compression and which face is in tension.",
        bullets: [
          "For a typical simply supported beam under positive moment, the top concrete is in compression and the bottom reinforcement is in tension.",
          "The neutral axis is the location where longitudinal strain is approximately zero in the idealized section.",
          "The effective depth d is measured from the compression face to the centroid of the tension reinforcement group.",
          "For doubly reinforced sections, compression steel may supplement the concrete compression block.",
        ],
      },
      {
        id: "behavior-stages",
        title: "Typical flexural behavior",
        summary: "A beam moves through recognizable stages as moment increases.",
        bullets: [
          "Uncracked elastic stage: concrete tension is still below its cracking strength.",
          "Cracked service stage: tension concrete is cracked and steel carries most tension; deflection and crack width matter.",
          "Yielding stage: tension steel reaches fy and the section becomes more ductile.",
          "Ultimate stage: the compression zone approaches its limiting strain and the section reaches nominal strength.",
        ],
        note:
          "The stages are a learning model. Actual behavior depends on reinforcement ratio, confinement, loading history, bond, and detailing.",
      },
      {
        id: "design-sequence",
        title: "Basic design sequence",
        summary: "Use a repeatable sequence so the calculation can be checked.",
        bullets: [
          "Establish loads and factored combinations.",
          "Select trial dimensions and materials.",
          "Calculate required reinforcement from strength equations.",
          "Check strain state, minimum and maximum steel, spacing, cover, and detailing.",
          "Check serviceability, shear, development, and constructability.",
        ],
      },
    ],
    checkQuestion: "What are the three ideas that must agree in a section analysis?",
    checkAnswer: "Compatibility gives strain, the material laws give stress, and equilibrium balances the internal forces and moments.",
  },
  {
    slug: "design-codes",
    eyebrow: "05 · Code framework",
    title: "Design Codes: NSCP 2015 and ACI 318",
    summary:
      "Codes turn material behavior and structural theory into enforceable rules for loads, strength, serviceability, and detailing.",
    illustration: "codes",
    objectives: [
      "Understand the roles of NSCP 2015 and ACI 318 in RC design.",
      "Separate analysis assumptions from code-required checks.",
      "Build a traceable design workflow that can be reviewed by another engineer.",
    ],
    sections: [
      {
        id: "code-roles",
        title: "What each document does",
        summary: "Use the governing project edition and do not treat a summary page as a substitute for the official code.",
        bullets: [
          "NSCP 2015 is the Philippine structural code framework used to establish local requirements, loads, materials, and structural design provisions.",
          "ACI 318 provides the reinforced-concrete design and detailing framework adopted or referenced by the applicable code provisions.",
          "Project specifications, government requirements, material standards, and approved drawings can add requirements beyond a basic equation.",
        ],
        note:
          "This learning module explains concepts and common equations. For a real project, verify the exact adopted edition, amendments, load combinations, exposure requirements, and professional review requirements.",
      },
      {
        id: "design-workflow",
        title: "Code-based design workflow",
        summary: "A code-compliant design is a chain of checks, not one capacity equation.",
        bullets: [
          "Define use, geometry, support conditions, materials, exposure, and design life.",
          "Determine dead, live, wind, seismic, and other applicable actions using the governing load provisions.",
          "Create required load combinations and obtain design actions from analysis.",
          "Check strength: flexure, shear, axial action, and combined actions where applicable.",
          "Check serviceability: deflection, cracking, vibration, and durability-related limits.",
          "Complete detailing: cover, spacing, development, anchorage, lap splices, transverse reinforcement, and constructability.",
        ],
      },
      {
        id: "code-reading",
        title: "How to read a code equation",
        summary: "Record the reference and assumptions next to every important result.",
        bullets: [
          "Identify the symbol definitions and unit system.",
          "Check limits and conditions before applying the equation.",
          "Use the correct strength-reduction factor φ and the correct material factor.",
          "Distinguish nominal strength Mn from design strength φMn.",
          "Record the clause, table, or adopted reference used for the check.",
        ],
      },
      {
        id: "reference-map",
        title: "Where this site fits",
        summary: "Use the reference page to move from this overview to the code topics used by the calculators.",
        bullets: [
          "The learning modules explain the concepts in a guided order.",
          "The calculators expose assumptions and intermediate values so students can audit the result.",
          "The NSCP / ACI reference page provides the site’s organized code-reference index.",
        ],
      },
    ],
    checkQuestion: "Why should a designer record the code reference and assumptions beside a result?",
    checkAnswer: "A second reviewer can reproduce the calculation, verify the limits, and identify whether the correct code edition and design model were used.",
  },
];

export function getModule1Topic(slug: string) {
  return module1Topics.find((topic) => topic.slug === slug) ?? null;
}
