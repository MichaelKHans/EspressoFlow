# 📜 ESPRESSO FLOW – CHANGELOG

Alle væsentlige ændringer og milepæle i Espresso Flow dokumenteres i dette dokument i henhold til Semantisk Versionering (SemVer).

---

## [0.5.0] - 2026-09-26
### Added
- **Digital Barista Deck & Smart Drink Selector (`DrinkSelector.tsx`):** Startskærmen byder nu brugeren velkommen som på en prosumer digital espressomaskine med tidsstyret barista-hilsen, active vault bag chip og hurtig-vælger.
- **Cappuccino & Specialty Drinks Menu (`drinkRecipes.ts`):** Komplet support for Cappuccino (18g $\rightarrow$ 36g base med 130ml fløjsblød mikroskum ved 62°C), Double Espresso, Flat White (dobbelt ristretto base), Cortado / Piccolo (1:1 spansk ratio), Modern Lungo og Americano.
- **Visuel Kop-Anatomi & Lag-Fysik:** Hvert drikkekort viser en grafisk lagdelt tværsnits-silhuet af koppen med præcise volumener og farver for skum, mælk og espressocrema.
- **Quick Favorites Ribbon:** Hurtig-knapper i toppen til 1-klik valg af dine mest populære drikke (Cappuccino, Espresso, Flat White, Cortado).
- **1-Tap Scale Cam Lock:** Ét tryk på en drik låser automatisk mål-dosis, yield, ekstraktionstid og mælkevejledning direkte ind i Scale Cam uden behov for manuel opsætning.
- **3-Step Dial-In Wizard (`DialInWizardModal.tsx`):** For drikke og bønner der endnu ikke er indstillet, guider wizard'en i 3 trin gennem start-formalingsgrad (kalibreret for brugerens Baratza Encore ESP Pro eller anden kværn), puck prep og automatisk prøve-bryg.

## [0.4.0] - 2026-09-26
### Added
- **CremaShop.dk Espresso Grinder Catalog:** Komplet katalog over bestseller-espressokværne fra CremaShop.dk med forudindstillede formalingsgrader og trin-enheder (Baratza Encore ESP Pro, Eureka Mignon Specialità 16CR/Manuale/Silenzio/Zero/Libra 65, Varia VS3 Gen 2/VS4/VS6, Sage Smart Grinder Pro/Dose Control Pro, Timemore Bricks 01S/Whirly 01S, Fellow Opus, DF64 Gen 2, DeLonghi KG79, m.fl.).
- **Matematisk Kværn-Kalibrerings-Beregner (`GRINDER_CALIBRATIONS`):** Udfører præcis trinberegning for brugerens specifikke kværn baseret på ekstraktionstidsafvigelse ($\Delta t$) og smagsfeedback.
- **Kværn-Specifikt Dial-In Badge i Smagsfeedback:** `TasteFeedback.tsx` viser nu et fremhævet trin-anbefalingskort direkte kalibreret til brugerens kværn (f.eks. *"On your Baratza Encore ESP Pro: Adjust 1.5 micro-steps finer (e.g. from 15 to 13.5) to compensate for ~4s flow variance"*).
- **AI Coffee Bag Photo Scanner (`parseCoffeeBagPhoto`):** Integreret mobil kamera-trigger i Bean Vault via `<input type="file" accept="image/*" capture="environment">`. Brugeren kan tage et foto af kaffeposens etiket, hvorefter appen automatisk detekterer bønnenavn, risteri, ristedato og ristegrad.
- **Fase 4 Gennemført:** Bean Vault, CremaShop Grinder Catalog, Grinder Dial-In Engine og Mobile Bag Scanner er 100% implementeret og lokalt build-verificeret.

## [0.3.1] - 2026-09-26
### Added
- **Coffee Bean Vault (Multi-Bag Management):** Mulighed for at have flere aktive kaffeposer i omløb og skifte bønne med ét klik. Hver pose gemmer bønnenavn, risteri, ristedato, ristegrad, ekstraktionsratio, samt den specifikke kværn og formalingsgrad, der er dialed in for dén bønne.
- **Ristegrad Profiler (Light, Medium, Med-Dark, Dark):** 4 interaktive knapper med farvekodede badges. Appen foreslår automatisk den optimale ekstraktionsratio og pre-infusion afhængig af bønnernes celledensitet og syreniveau.
- **Drikke-Ratio Presets (Ristretto, Standard, Modern Lungo, Allongé):** 1-klik presets der dynamisk genberegner flydende yield baseret på din tørre dosis ($18\text{g} \rightarrow 27\text{g} / 36\text{g} / 45\text{g} / 54\text{g}$).
- **Udvidet Kværnkatalog inkl. Baratza Encore ESP:** Fuld integration af **Baratza Encore ESP** (med micro-step espresso range 1–20), Baratza Sette, Eureka Mignon, DF64 Gen 2, Niche Zero, Fellow Opus, Sage/Breville, Timemore Sculptor, 1Zpresso, Comandante og mulighed for at tilføje egne custom kværne.
- **Ristegrads-bevidst Smagsfeedback:** Barista Dial-In rådgiveren tager nu højde for, om du brygger en hård lysristet eller porøs mørkristet bønne, når den anbefaler kværn- og ratiotilpasninger.

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
