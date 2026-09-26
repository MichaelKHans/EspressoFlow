# 📜 ESPRESSO FLOW – CHANGELOG

Alle væsentlige ændringer og milepæle i Espresso Flow dokumenteres i dette dokument i henhold til Semantisk Versionering (SemVer).

---

## [0.3.0] - 2026-09-26
### Added
- **Hybrid Split-Timer & Pre-Infusion Engine:** Måler automatisk split-tider for mætningstid ($T_{\text{pre}}$ fra pumpe-start til 1. dråbe ved $\ge 0.1g$) og aktiv flowtid ($T_{\text{flow}}$ fra 1. dråbe til stop).
- **The Golden Zone Flow Band:** Visuel 1.2–1.6 g/s zone på SVG-ekstraktionskurven (`FlowChart.tsx`), der øjeblikkeligt afslører under- eller overekstraktion.
- **Matematisk Kanaliserings-Detektor (`analyzeChanneling`):** Registrerer præcist tidsstempel, flow-spikes ($\ge 2.9$ g/s) og alvorsgrad (mild/severe) undervejs i brygget.
- **Espresso Maskine Profiler & Pre-Infusion Kontrol:** Tilføjet maskinvælger (Sage Dual Boiler, Barista Express, E61 Flow Control, La Marzocco Micra/Mini, Decent DE1, Straight 9-Bar) med justerbar pre-infusion skyder (0–15s).
- **Enhanced Logbook & Field Journal:** Viser nu præcise split-tider (`Pre: X.Xs • Flow: Y.Ys`), espressomaskine og detaljerede kanaliserings-advarsler.
- **Action-Oriented UX Refactor:** Omdøbt "Inspector" til "Align Scale", tilføjet "Demo Mode" og "Display: LED/LCD" for intuitiv mobilbetjening.

## [0.2.0] - 2026-09-26
### Added
- **7-Segment Canvas OCR Engine (`src/lib/ocr7segment.ts`):** Letvægts ciffer-dekoder med Otsu binarisering, kolonneprojektion og 7-segment segment-sampling (< 3ms latenstid, 15-20 FPS).
- **Vision Inspector:** Interaktivt diagnosepanel med binariseret preview, rå OCR tekststreng og ciffer-confidence.
- **Display Inversion Toggle:** Valgfri kontrasttilstand for LED (lyse tal på mørk baggrund) og LCD (mørke tal på lys baggrund).
- **Step 0 Auto-Tare & Auto-Start:** Automatisk detektering og låsning af `0.0g`, samt auto-start af ekstraktionstimer og flowkurve ved vægtstigning $\ge 0.1g$.
- **Outlier Rejection Filter (`ScaleReadingFilter`):** Matematisk støjfilter der kasserer damp-glitches og mikrovibrationer fra espressomaskinens vibrationspumpe.
- **Produktionsdomæne:** Sat op på det officielle underdomæne `https://espressoflow-app.vercel.app`.

## [0.1.0] - 2026-09-26
### Added
- **Master Blueprint:** Komplet arkitektur og blueprint dokument (`ESPRESSO_FLOW_APP_BLUEPRINT.md`).
- **Antigravity Governance:** Oprettet `.agents/rules/projektinstrukser.md`, `.agents/WORKFLOW.md`, `.agents/TASK.md`, `.agents/STATUS.md`, `ROADMAP.md` og `TASK.md`.
- **Forretningsmodel:** Fastlagt 7 dages in-app prøveperiode med $4.99 / 49,- DKK Lifetime Unlock (Non-consumable IAP) via RevenueCat.
