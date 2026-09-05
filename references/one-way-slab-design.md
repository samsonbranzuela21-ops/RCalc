# One-way slab design basis

## Simplified problem-entry workflow

The current interface follows the user's photographed classroom problem. Only seven numeric givens are visible initially: exterior and interior beam spacings, beam width, superimposed dead load, live load, concrete strength, and bar diameter. Steel grade and span count are simple selections. Grade 60 is explicitly represented as fy =420 MPa. Optional settings contain cover, concrete unit weight, aggregate size, a supplied thickness, exterior restraint, and the special short-span coefficient row.

`designSlabProblem` derives clear spans by subtracting the equal beam width from the center-to-center spacings. It solves both end and interior span types using a common thickness. Two-span systems solve both spans as end spans. Three-span systems use equal exterior spans on either side of the interior span; four-or-more systems assume repeating typical interior spacing and use the governing other-support-face demand.

Automatic thickness starts at the greater of the two support-condition thickness screens and the bar/cover fit requirement, rounded upward to 10 mm. It increases in 10 mm increments, recalculating self-weight and both designs, until all checks pass. The automatic search is limited to 1,000 mm; this is an implementation limit, not a code maximum. Invalid table prerequisites are not hidden by changing thickness. A manually supplied thickness is checked without being increased.

The photographed example defaults are 4.2 m /4.5 m beam spacings, 300 mm beams, superimposed dead load 2.8 kPa, live load 2.4 kPa, fc =28 MPa, Grade 60 steel, and 10 mm bars. With the displayed indoor, 24 kN/m³ concrete and continuing-span assumptions, the result is clear spans 3.9 m /4.2 m, thickness 180 mm, d =155 mm, and wu =12.384 kPa. Bottom bars in both span types and exterior top bars are 10 mm @240 mm; first interior support top bars are @220 mm; governing other interior support faces are @225 mm. Shrinkage bars are @240 mm.

The 2.8 m equal-spacing example can use the standard highlighted 1/14 positive and 1/10 negative rows. The special 1/12 slab row remains explicit under optional settings; it is not silently substituted for the user's highlighted method.

Updated verification: 18 calculation tests pass, including seven classroom-problem tests. TypeScript, ESLint, and production build pass. Browser checks pass for the seven visible givens, one-click example, both 30-step span solutions, coefficient selection, automatic/manual thickness, invalid/empty inputs, mobile/desktop light and dark layouts, and card/legacy navigation. No KaTeX or runtime errors were observed. Form, section diagram, and mobile result screenshots were visually inspected. Tests: `node --test tests/one-way-slab.test.mjs tests/one-way-slab-problem.test.mjs`.

## Source provenance

The user supplied a transcription of Module 4 – Reinforced Concrete: moment table on pages 12–13; one-way slabs on pages 14–16. The original PDF is not present in this workspace and has not been independently read. The module's own worked-example sequence cannot be verified against the original; the implementation follows the user's requested 30-step solution sequence and the transcribed table. No coefficients have been inferred from the old calculator.

The transcribed title is **NSCP Table 406.5.2 — Approximate Moments for Non-prestressed Continuous Beams and One-way Slabs**.

| Moment | Case | Coefficient |
| --- | --- | --- |
| Positive | End span, discontinuous end integral with support | 1/14 |
| Positive | End span, discontinuous end unrestrained | 1/11 |
| Positive | Interior span, all conditions | 1/16 |
| Negative | Interior face of exterior support, integral spandrel beam | 1/24 |
| Negative | Interior face of exterior support, integral column | 1/16 |
| Negative | Exterior face of first interior support, two spans | 1/9 |
| Negative | Exterior face of first interior support, more than two spans | 1/10 |
| Negative | Other faces of interior supports | 1/11 |
| Negative | Faces of all supports, slabs with all spans ≤3 m | 1/12 |
| Negative | Faces of all supports, beam stiffness condition stated by user | 1/12; displayed for reference, not selectable in a slab calculator |

One-way classification follows the transcription: support on two opposite sides OR longer/shorter panel span >2. Main bars run along the selected spanning direction, perpendicular to the supporting beams; four-side-supported panels must span in the short direction.

## Supplemental ACI provisions

The code edition used is ACI 318-14, not ACI 318-18. The module transcription controls the metric table values. Remaining formulas use the metric ACI 318-14 provisions listed below. Code references are identified as ACI references rather than inventing NSCP section numbers not supplied by the user.

- §6.5.1: coefficient-method prerequisites; Table 6.5.2: moment locations; Table 6.5.4: support-face shear factors. Input checks cover constant sections, uniform loading, two or more spans, live load ≤3D and adjacent spans differing by ≤20%.
- Table 5.3.1: evaluate both gravity combinations 1.4D and 1.2D + 1.6L.
- Table 7.3.1.1 and §7.3.1.1.1: normalweight slab thickness screening using panel support-center spacing and the metric (0.4 + fy/700) multiplier. The selected end span uses /24; interior span uses /28. This is a screen assuming no deflection-sensitive attachments; it is not an explicit deflection calculation.
- §7.3.3.1: tensile strain must be at least 0.004, also explicitly supplied by the user.
- Table 7.6.1.1 and §24.4.3.2: minimum steel ratio 0.002 for fy <420 MPa; otherwise max(0.0018 ×420/fy, 0.0014). Same steel material is used for flexure and temperature reinforcement.
- §7.7.2.3: main spacing ≤min(3h, 450 mm); §7.7.2.4 / §24.4.3.3: shrinkage spacing ≤min(5h, 450 mm), also supplied in the transcription.
- Table 24.3.2, §24.3.2.1: main-bar crack-control spacing additionally limits spacing, using the permitted fs =2fy/3 estimate. Metric limit is min(380 ×280/fs −2.5cc, 300 ×280/fs).
- §25.2.1 and §26.4.2.1: clear bar spacing accounts for 25 mm, bar diameter and 4/3 aggregate size. Practical center spacing is in 5 mm increments. Minimum constructible spacing never silently overrides a failed area check.
- Table 20.6.1.3.1: 20 mm cover for sheltered cast-in-place slabs with bars no larger than 32 mm. Other exposures and larger bars are outside this implementation.
- §22.2.2.4: rectangular compression block; beta1 =0.85 through 28 MPa, declining by 0.05 per 7 MPa to a floor of 0.65. As is solved from the smaller root of the flexural quadratic with trial phi =0.90, followed by a provided-section strain and strength check.
- Table 21.2.2: phi is verified from strain with epsilonY =fy/Es and the 0.005 tension-controlled limit. A failed 0.004 minimum is never adequate. Displayed capacity is an unaccepted trial model when the yield/strain assumptions fail.
- §22.5.5.1: a conservative normalweight support-face shear screen, Vc =0.17 sqrt(fc) bd, phiV =0.75. End spans use 1.15wuLn/2, interior spans wuLn/2. No reduction to a critical section at d is taken.

Sources consulted:

- [ACI 318-14 publication](https://www.concrete.org/store/productdetail.aspx?ItemID=318U14&Language=English&Units=US_Units)
- [ACI-authored code, archived copy](https://unaribas.com/wp-content/uploads/2021/04/aci-318-14.pdf)
- [StructurePoint one-way slab design example, flexural design](https://structurepoint.org/publication/html/DE-One-Way-Slab-ACI-14-spBeam-v1000/DE-One-Way-Slab-ACI-14-v1000/05/05.htm?rhtocid=_6)

## Modeling assumptions and scope

The current form designs both representative span types, not a complete arbitrary floor. Its section illustration follows the problem figure. Floor dimensions are unknown and are neither requested nor reported in the strip workflow. The low-level calculation retains its previous floor-geometry mode for compatibility and regression checks. The user must verify the stated table conditions for any remaining spans that differ from the repeating layout.

Positive moment uses the selected clear span. Negative moments at an interior support use the average of the two adjoining clear spans. An exterior support has only one adjoining span, so its clear span is used there; no fictitious span is created. The end-span diagram places the exterior end on the left. A mirrored end span has the same calculated magnitudes with mirrored placement.

The 1/12 all-support slab option is explicit and validates all entered spans ≤3 m; its label requires all system spans to meet that limit. An unrestrained exterior end remains unrestrained and has zero negative design moment. The beam-stiffness row is retained in the reference table but cannot be used to design a slab.

Only normalweight concrete, nonprestressed steel, sheltered exposure, and uniformly distributed gravity loads are supported. Partitions entered as permanent dead load are not duplicated in live load. Bar cutoff, anchorage, development, fire resistance, openings, load redistribution and a full-floor analysis are separate work. Same main bar diameter and cover apply to each zone, but each zone independently determines required steel and spacing. Equal final spacing can legitimately result when minimum reinforcement governs.

## Verification

Run `node --test tests/one-way-slab.test.mjs` (Node 24 supports TypeScript stripping), `npx tsc --noEmit --incremental false`, and `npm run build`. Test fixtures include independent load/moment calculations, table rows, adjacent-span averaging, strip-width scaling, invalid inputs, minimum steel, strain, and failed adequacy checks.

Earlier floor-input version verified on 2026-09-05 (superseded by the simplified workflow and updated verification above):

- All 11 calculation tests pass.
- TypeScript and ESLint checks pass for the changed source.
- Production build succeeds and generates both slab routes. A stale development route-type file was resolved with `npx next typegen` before the successful checks.
- Headless Edge checks against the final production build pass: calculator-card navigation, legacy redirect, floor area updates, support-dependent coefficients and moments, adjacent-span inputs, clearing stale results, empty/invalid input handling, full-solution toggle, all 30 numbered cards, and no KaTeX or browser runtime errors.
- Desktop 1440 px and mobile 390 px layouts checked in light and dark themes. No page-level mobile horizontal overflow; wide diagrams and formulas scroll within their containers. Diagram and quadratic-solution screenshots visually inspected.
- Default selected end span: floor area 240 m², factored area load 13.896 kN/m², moments +21.92590 kN·m at midspan, −12.79011 kN·m at the exterior support and −30.69626 kN·m at the first interior support.

## Files created or modified

- `app/calculators/one-way-slab-design/page.tsx`: new client route with one default export; layout delegated to the calculator component.
- `app/calculators/one-way-slab/page.tsx`: redirects the old route to the new calculator.
- `components/OneWaySlabCalculator.tsx`: simplified problem-givens form, derived clear spans, optional settings, combined recommendations and end/interior solution selection.
- `components/OneWaySlabSolution.tsx`: 30 numbered KaTeX solution cards with separate reinforcement-zone calculations.
- `components/OneWaySlabDiagram.tsx`: continuous slab section matching the photographed problem, with beam spacings, clear spans, thickness and reinforcement.
- `lib/one-way-slab.ts`: module table, classification, validation, independent reinforcement designs and adequacy checks.
- `lib/data.ts`: calculator-card destination and description.
- `tests/one-way-slab.test.mjs`: independent calculation and validation regression tests.
- `tests/one-way-slab-problem.test.mjs`: supplied example, two/three/repeating spans, equal spacing, automatic/manual thickness and invalid givens.
- `references/one-way-slab-design.md`: source provenance, provisions, assumptions and verification record.
