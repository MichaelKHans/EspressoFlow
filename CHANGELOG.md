# 📜 ESPRESSO FLOW – CHANGELOG

Alle væsentlige ændringer og milepæle i Espresso Flow dokumenteres i dette dokument i henhold til Semantisk Versionering (SemVer).

---

## [0.5.6] - 2026-09-26
### Fixed
- **Synlighed af Fastgjorte Drikke i Quick Bar Deck:** Løst problemet med at kun 3 af de fastgjorte drikke var synlige på mobil. Baren ombryder nu automatisk (`flex flex-wrap`), så samtlige fastgjorte drikke (fx alle 6: Cappuccino, Double Espresso, Flat White, Cortado, Latte, Americano) vises på 2 kompakte rækker på mobilen uden at være gemt bag en usynlig vandret rullebjælke.
- **Direkte Valg af Drikke i Vælger-Modalen:** I modulet med alle 12 specialitetsdrikke kan man nu trykke direkte på hvilken som helst drik for øjeblikkeligt at vælge den til brygning og lukke modalen. Samtidig har hver drik fået en dedikeret "Pin / Pinned"-knap til at tilføje/fjerne den fra sin hurtig-bar.
- **Hurtig-Skift Knap på Masterkortet:** Tilføjet en "Switch"-knap direkte ved siden af drikkens navn i Masterkortet, så man altid med 1 tryk kan skifte til en vilkårlig af de 12 kaffeopskrifter uden at skulle lede.
- **"+ More" Knap i Quick Baren:** Tilføjet en stiplet `+ More (X)` knap direkte i forlængelse af de fastgjorte drikke, der åbner det samlede drikkekatalog.

## [0.5.5] - 2026-09-26
### Fixed
- **Crema & Væskelag Retning i Koppen (`ArchitecturalCup.tsx`):** Rettet den kritiske beregningsfejl, hvor væskelagene blev tegnet nedefra og op, hvilket placerede crema/skum i bunden og kaffen i toppen. Alle 12 drikke renderes nu korrekt fra toppen og ned: Crema og mikroskum ligger elegant øverst, mens espressokrop, dampet vand og sød kondenseret mælk ligger i bunden.
- **Drik-Specifikke Væskehøjder:** Præcise koordinater for demitasse (`yTop=26`), almindelig kop (`yTop=16`), facetglas (`yTop=16`) og højt glas (`yTop=14`), så lagene flugter perfekt med glaskanten.

### Changed
- **Løft af Hovedmenuen & Taktil Segmenteret Kontrol:** Den flade tekstmenu med bundstreg er udskiftet med en eksklusiv, taktil segmenteret pill-navigationsbjælke (`bg-[#F0E8DC]`) med mørkristede aktive knapper (`#2C2018`) og diskret feltjournal-tæller på Logbook.
- **Fjernelse af Stjerner på Coffee Bar:** Udskiftet `<Sparkles>` med en ren, professionel `<Coffee>` espressokop på Coffee Bar fanen og i Digital Barista Deck banneret.
- **Scale Cam Fane Ikon:** Fanebladet for Scale Cam har nu fået et logisk og præcist `<Camera>` vektorikon i stedet for kaffekoppen, så man tydeligt skelner mellem kaffebaren og kamera-monitoren.

## [0.5.4] - 2026-09-26
### Added
- **Steamed Water Guide til Americano & Long Black:** Implementeret barista-teknikken med mikroskopisk damp-luftet varmt vand i stedet for almindeligt kedelvand for en markant blødere og rundere smagsprofil.
- **Dedikeret "Steamed Water Guide"-kort i DrinkSelector:** Viser præcis anbefalet temperatur (78°C), vandmængde (110ml) og metode (*Steam Wand Micro-Aeration*).
- **Opdateret Lag-Fysik for Americano:** Koppens arkitektoniske tværsnit viser nu 110ml dampet varmt vand i bunden, 45ml fyldig espresso-krop og 25ml intakt crema på toppen, der bevares takket være overfladespændingen i det mikroluftede vand.
- **Barista Dial-In Pro Tip:** Trin-for-trin instruktion i at dampe 110ml filtreret vand i kanden med dampdysen til ca. 78°C før espressoen trækkes direkte ovenpå.

## [0.5.3] - 2026-09-26
### Added
- **Mobil & Tablet Først Responsive Ergonomi:** Komplet tilpasning af layouts til små telefonskærme (375px–430px iPhone SE, standard og Pro) samt tablets.
- **Kompakt Side-om-Side Masterkort:** På mobiler præsenteres den arkitektoniske kop og de 4 nøgletal (Dry Dose, Target Yield, Ratio, Target Time) nu i en overskuelig, integreret visning uden behov for uendelig scrolling.
- **Ingen Vandrette Rullebjælker (`no-scrollbar`):** Tilføjet CSS utilities til at skjule browser-rullebjælker på vandrette touch-lister som Quick Bar Ribbon og kategori-filtre.
- **Kompakte Kvik-Bar Piller:** Hurtig-knapperne i baren er optimeret med afkortede drikkenavne og mikro-kopper for hurtig 1-tap betjening på enhver skærmstørrelse.

## [0.5.2] - 2026-09-26
### Added
- **Proportionalt Vektor-Kophåndtag (`ArchitecturalCup.tsx`):** Det tidligere firkantede/lille håndtag er fuldstændig redesignet som en harmonisk, organisk C-bue i ægte keramik-proportioner matchende Image 3 ("Coffee The Essential Guide").
- **Drik-Specifik Glasform:** Håndtag vises nu kun på rigtige kaffekopper (`cup` og `demitasse`), mens Cortado, Café Bombón, Affogato og Espresso Tonic vises i ægte facetterede glas-tumblere uden håndtag.
- **Visuelle Drikke-Silhuetter i Logbogen (`Logbook.tsx`):** Hver enkelt log i den analoge logbog har nu sit eget dedikerede miniature-tværsnit af koppen afhængigt af den bryggede kaffetype (Cappuccino, Double Espresso, Flat White osv.), hvilket giver et eksklusivt og visuelt feltjournal-udtryk.
- **Filter-Pills med Ikon-Miniaturer:** Filter-knapperne i toppen af logbogen viser nu også mini-kopper for hver registreret kaffetype.

## [0.5.1] - 2026-09-26
### Fixed
- **Blank Screen Fix on Production (Vercel):** Løst Temporal Dead Zone (TDZ) ReferenceError i `src/App.tsx`, hvor `currentGrinder` refererede til `grinderName` før dets statserklæring.
- **100% Emoji Purge:** Total udrensning af samtlige emojis i hele kildekoden (`TasteFeedback`, `FlowChart`, `DrinkSelector`, `App.tsx`), erstattet med præcise Lucide vector-ikoner (`Target`, `Flame`, `Clock`, `Lightbulb`, `FlaskConical`, `Coffee`, `Layers`, `Sliders`).

### Added
- **Sletning af Logbogs-indtastninger (`Logbook.tsx` & `storage.ts`):** Sikker sletning af individuelle bryg-logs ved fejl med 2-trins bekræftelses-knap ("Delete? Check / Cancel") så utilsigtede tryk på mobilen undgås.
- **Logbog Opdelt efter Drikke:** Dynamisk filterbånd i toppen af logbogen med filtre for "All Drinks", "Cappuccino", "Double Espresso", "Flat White" osv., samt dedikeret drikkebadge på alle log-kort.
- **Tilpasning af Drinks Bar ("Active Bar Deck"):** Brugeren kan nu frit vælge hvilke drikke der vises på den daglige kvik-bar via "Customize Bar" modulet (`loadActiveBarDrinkIds` / `saveActiveBarDrinkIds`), mens hele 12-drikkes biblioteket altid kan tilgås i kataloget.
- **Arkitektonisk Billede 3 Kop-Stil:** Implementeret Swiss-guide inspireret kop-anatomi ("Coffee The Essential Guide") med præcise væskelag, farvekodning, og specifikation af volumen i ml per lag for alle specialitetsdrikke.

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
