# Column ties and spiral detailing

Source: the user's supplied transcription of Module 8, **Shear Analysis and Design of Columns Using NSCP 2015**. No claim is made that an original PDF was available or read.

The Column Analysis card replaces Bar Spacing Check and opens `/calculators/column-ties-check`. Calculation logic is in `lib/column-ties-check.ts`; calculator, diagram, and 15-step solution are separate components.

## Implemented module provisions

| Section | Rule |
| --- | --- |
| 425.7.2.1 | Ties: clear spacing ≥ 4dagg/3; minimum tie diameter 10 mm for db ≤ 32 mm, 12 mm for db ≥ 36 mm. |
| 425.7.2.2 | Maximum tie center spacing = min(16db, 48dt, least column dimension). |
| 425.7.2.3 | Corner and alternate bars laterally supported by tie corners with included angle ≤ 135°; unsupported bars within 150 mm clear in each direction of a supported bar along the tie. |
| 425.7.2.4 | Circular ties: compliant laps, standard hooks engaging a longitudinal bar, adjacent overlaps staggered. |
| 425.7.3.1–2 | Continuous evenly spaced deformed spiral; cast-in-place diameter ≥ 10 mm; max(25,4dagg/3) ≤ clear spacing ≤ 75 mm. |
| 425.7.3.3 | rhoRequired = 0.45(Ag/Ac − 1)fc/fy,spiral; rhoProvided = 4Asp/(dc × pitch). Core diameter and area are measured to the outside of the spiral. |
| 425.7.3.4–5 | At least 1.5 extra turns at each end; compliant mechanical or welded splice if present. |

ACI 318-14 §§25.7.2–25.7.3 supply related transverse reinforcement context ([official contents](https://www.concrete.org/portals/0/files/pdf/318-14-tableofcontents.pdf)). The supplied NSCP metric rules control this implementation. AISC is not used.

## Explicit modeling limits

- Rectilinear bars are single, unbundled bars equally spaced along each face; circular bars are equally spaced around a ring. Bar-count input ranges are diagram constraints, not code minimum reinforcement requirements.
- The user marks bars restrained by actual tie/cross-tie corners. No cross-tie arrangement is inferred from the marks. Clear lateral distances are perimeter center distances minus longitudinal bar diameter. Consecutive unsupported bars fail the alternate-bar check; missing corner support fails separately.
- Cover locates reinforcement; no unsupplied exposure-cover limit is invented. Longitudinal bar overlap is detected.
- Longitudinal diameters strictly between 32 and 36 mm are rejected because the transcription does not define their minimum tie size.
- Closed-tie enclosure, circular laps/hooks/staggering, spiral continuity, and splice compliance use explicit drawing confirmations. Unknown details are INCOMPLETE, never PASS. No numerical lap, hook extension, or splice-strength requirement was supplied.
- Spiral pitch must satisfy both clear spacing and reinforcement ratio. The result shows the ratio-derived maximum pitch separately.
- ADEQUATE means all implemented module checks pass for the entered layout and confirmations. Seismic confinement, axial/shear strength, longitudinal reinforcement ratios, bundled bars, and other unsupplied provisions are outside this check.

## Verification

`node --test tests/column-ties-check.test.mjs` covers independent numerical examples, tie-size transitions, all spacing controls, inclusive clear-gap boundaries, 150 mm lateral support, individual arrangement failures, circular details, spiral core geometry/ratios, anchorage/splices, invalid inputs, and complete solution structure.

Verified: all 12 column tests and 18 existing slab tests pass; TypeScript, scoped ESLint, and production Next.js build pass. Production browser checks cover the card/route, all three modes, invalid input, stale-result clearing, bar-support toggling, every solution step, KaTeX rendering, light/dark themes, and page widths down to 320 px without horizontal overflow. The existing P–M example still calculates and displays its worked solution (DCR 0.361, SAFE).

Created files: `app/calculators/column-ties-check/page.tsx`, `components/ColumnTiesCalculator.tsx`, `components/ColumnTiesDiagram.tsx`, `components/ColumnTiesSolution.tsx`, `lib/column-ties-check.ts`, `tests/column-ties-check.test.mjs`, and this reference. Modified `lib/data.ts` to replace the Bar Spacing Check card in Column Analysis. Earlier slab and cracking-moment work remains in the workspace.
