# Elementa — chemistry learning lab

Route: `/education/chemistry`. Linked from desktop/mobile Education navigation and the sitemap. It follows Mechanica Lab’s experiment-library, adjustable-model, live-observation and explanation structure with an independent visual style and scoped CSS.

## Learning pathways

Class filters indicate suggested teaching levels, not exhaustive chapter coverage or an official syllabus certification. Students can explore any class without an account.

| Suggested class | Activities |
| --- | --- |
| 6 | Transparent/translucent/opaque materials; basic separation; changes of state |
| 7 | Acid/base identification using litmus; physical versus chemical changes |
| 8 | Particle arrangements and motion; electrical conductivity and graphite exception |
| 9 | Separation revision; mass percentage of solutions; selected neutral atoms and shells; molecular formulae and mass |

## Sources and scope

Reviewed 17 September 2026:

- Existing [Mechanica Lab](https://www.nabendu.org/education/physics) and its source implementation.
- [CBSE Class IX Science, 2026–27](https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/ScienceSt_SecP1_2026-27.pdf): the three chemistry topics are Exploring Mixtures and their Separation, Structure of an Atom, and Atoms and Molecules. Our nine labs are selected concepts and foundation/revision activities, not the entire syllabus.
- [NCERT textbook portal](https://ncert.nic.in/textbook.php) for teacher access to the current textbook editions.
- [CIET/NCERT Grade 6 activities](https://www.ciet.ncert.gov.in/activity/grade6): materials and separation activities support the Class 6 topic selection. The search index was accessible; direct page and chapter PDF retrieval timed out during the review. Do not describe the lower-grade mappings as an exhaustive verification of current chapter order.

All learning explanations and quiz questions are original. No textbook images or passages are reproduced.

## Models and constraints

### 3D studio controls

All nine experiments render live Three.js geometry, including glassware, material samples, litmus, a circuit, phase changes, particles, nuclei and molecular models. The studio uses the supplied cell-studio video as a layout reference: cream panels, a large central model, a library on the left and controls on the right.

- **Orbit:** drag the background to rotate, scroll/pinch or use the +/− buttons to zoom, right-drag to pan. Framing adapts to portrait screens.
- **Move objects:** drag apparatus or individual molecular/atomic parts along their local work plane. Movement is bounded; orbiting pauses while moving. This rearranges the teaching model, not a physics or chemical reaction simulation. Experiment buttons determine the scientific outcomes.
- **Labels:** hide/show annotations. Clicking an object also identifies it in the status caption.
- **Separate atoms:** opens the molecular assembly for inspection; this does not represent a chemical reaction or dissociation energy.
- **Reset view:** restores camera and object positions. **Reset lab** also restores experimental inputs while preserving notebook entries.
- **Expand:** opens the studio across the viewport; **Close studio** or Escape restores the page and page scrolling. Once an object is selected in Move objects mode, the arrow keys also reposition it.

Lighting and reflections are generated locally; the scene needs no external HDR or model download. Geometry uses bounded counts and a capped device pixel ratio. The old SVG illustrations are no longer used by the lab viewer.

- 48 particles remain present across solid/liquid/gas choices; movement and distances are schematic, not a molecular-dynamics simulation. Motion speed does not represent a calibrated temperature.
- Atom models use selected neutral atoms up to chlorine. A single isotope is shown per element; mass number is distinct from average atomic mass.
- Ball-and-stick molecules show H₂O, O₂ and CO₂. Atomic masses H=1, C=12 and O=16 are classroom approximations. Molecular geometry, scales and conventional colours are explained.
- Concentration = salt / (salt + water) × 100. Sliders use 0–15 g salt and 50–200 g water, within a typical room-temperature salt solubility limit. No mixing-volume assumption is made.
- Litmus classifies typical samples as acidic/basic/neutral. It is not a pH meter or a safety test.
- Separation is a qualitative before/after representation. Evaporation does not recover liquid water. Ordinary filtration cannot remove dissolved salt.
- Conductivity uses a qualitative 3 V model; identical lamp brightness is not equal conductivity.

## Accessibility, persistence and maintenance

Controls use native buttons, fieldsets, labelled sliders and a textarea. Observations and quiz feedback are available as text; colour and WebGL are not the only means of conveying results. Reduced-motion preference starts 3D motion paused; users can pause/resume. A 3D error boundary keeps text and controls available.

Notebook and completed checks use `nabendu-chemistry-v1` in localStorage. There is no account or server submission. Corrupt/unavailable storage falls back to the current visit. Reset lab resets the experiment and current answer but preserves notes and completed checks.

Content/helpers: `lib/education/chemistry.ts`. UI: `components/education/chemistry`. Styles and metadata: `app/education/chemistry`. Run `node --test tests/chemistry.test.cjs`, `npx tsc --noEmit`, and scoped Next lint. Browser checks should include desktop/mobile, all labs, quiz retry, reset, notes persistence and keyboard controls.
