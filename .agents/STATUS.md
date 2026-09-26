# Espresso Flow Project Status & History

## Projekt Oversigt
- **Navn:** Espresso Flow
- **Primært sprog:** 100% Engelsk (English US)
- **Design System:** Espresso Warmth (`#FAF7F2`, `#FFFDF9`, `#2C2018`, `#C26D52`) + `Courier Prime`
- **Forretningsmodel:** 7 dages in-app prøveperiode $\rightarrow$ $4.99 / 49,- DKK Lifetime Unlock (RevenueCat)
- **Repository:** `MichaelKHans/EspressoFlow`

---

## 🕒 Historik & Gennemførte Opgaver

### 2026-09-26 – Mobil & Tablet Ergonomi, Kompakt Masterkort & Ingen Rullebjælker (v0.5.3)
- **Mobil & Tablet Responsive Ergonomi:** Fuld skalerbarhed for små skærme (375px–430px iPhone SE/standard) og tablets.
- **Kompakt Masterkort:** Arkitektonisk kop og 4 bryg-nøgletal vises samlet og overskueligt uden scroll-træthed.
- **`no-scrollbar` Utility:** Fjernet grimme browser-rullebjælker under vandrette ribbons for et ægte native app-look.
- **Kompakte Kvik-Bar Piller:** Drikke i hurtig-baren vises i slanke piller med mikro-kopper.

### 2026-09-26 – Proportionale Kophåndtag, Drikke-Specifikke Glas & Logbog Visuelle Silhuetter (v0.5.2)
- **Proportionalt Vektor-Kophåndtag (`ArchitecturalCup.tsx`):** Fuldstændig redesignet som en harmonisk, organisk C-bue i ægte keramik-proportioner.
- **Drik-Specifikke Glas:** Håndtag vises kun på kopper (`cup` og `demitasse`), mens Cortado, Bombón, Affogato og Espresso Tonic vises i ægte facetterede glas uden håndtag.
- **Visuelle Silhuetter i Logbogen (`Logbook.tsx`):** Hvert logkort viser nu sit eget miniature-tværsnit af koppen afhængigt af den bryggede kaffetype.
- **Filter-Pills med Ikon-Miniaturer:** Filter-knapperne i toppen af logbogen viser nu også mini-kopper for hver registreret kaffetype.

### 2026-09-26 – Blank Screen Fix, Logbog Sletning, Drikke-Opdeling, Billede 3 Kop-Stil & Nul Emojis (v0.5.1)
- **Produktions-Fix (Blank Skærm Løst):** Rettet Temporal Dead Zone (TDZ) initialization bug i `src/App.tsx`, hvor `currentGrinder` refererede til `grinderName` før dets statserklæring.
- **Logbog Sletning (`Logbook.tsx` & `storage.ts`):** Sikker sletning af fejlagtige logs med to-trins bekræftelse ("Delete? Check / Cancel").
- **Logbog Opdelt efter Drikke:** Dynamisk filterbånd for alle drikke (`All Drinks`, `Cappuccino`, `Double Espresso`, osv.) samt visning af drikkebadge på hver log-blok.
- **Drinks Bar Tilpasning ("Active Bar Deck"):** Vælg hvilke drikke der er fastgjort på din kvik-bar via "Customize Bar" modulet, med lokal persistens i `localStorage`.
- **Arkitektonisk Billede 3 Kop-Stil ("Coffee: The Essential Guide"):** Minimalistiske tværsnit-silhuetter med præcise lag, farver og ml-volumener.
- **100% Total Emoji Purge:** Samtlige emojis overalt i appen er fjernet og erstattet med professionelle Lucide vector-ikoner.

### 2026-09-26 – Digital Barista Deck, Smart Drink Selector & Cappuccino (v0.5.0)
- **Digital Barista Deck (`DrinkSelector.tsx`):** Startskærm med tidsstyret barista-hilsen ("Good morning, Barista"), active vault bag chip og Quick Favorites ribbon.
- **Cappuccino & Specialty Drinks Menu (`drinkRecipes.ts`):** Fuld integration af Cappuccino (18g $\rightarrow$ 36g base med 130ml fløjsblød mikroskum ved 62°C), Double Espresso, Flat White, Cortado, Lungo og Americano.
- **Visuel Kop-Anatomi & Lag-Fysik:** Interaktiv tværsnits-silhuet af koppen med procenter og farver for skum, mælk og espressocrema.
- **1-Tap Scale Cam Lock:** Automatisk låsning af opskrift, dosis, yield og mælkevejledning i Scale Cam med ét tryk.
- **3-Step Dial-In Wizard (`DialInWizardModal.tsx`):** Guider trinvis gennem start-formalingsgrad kalibreret til brugerens Baratza Encore ESP Pro eller anden kværn, puck prep og kalibreringsskud.

### 2026-09-26 – Fase 4: Bean Vault, CremaShop Kværnkatalog, Dial-In Engine & AI Bag Scanner (v0.4.0)
- **CremaShop.dk Espressokværne Katalog:** 20+ topmodeller fra CremaShop (Baratza Encore ESP Pro, Eureka Specialità 16CR/Manuale/Silenzio/Zero/Libra 65, Varia VS3 Gen 2/VS4/VS6, Sage Smart/Dose Control Pro, Timemore Bricks 01S/Whirly 01S, Fellow Opus, DeLonghi KG79 m.fl.).
- **Matematisk Kværn-Kalibrering (`GRINDER_CALIBRATIONS`):** Konverterer flow-tidsfejl ($\Delta t$) til præcise micro-steps, divisions eller ticks for den valgte kværn.
- **Kværn-Specifikt Dial-In Badge:** `TasteFeedback.tsx` viser skræddersyede justeringstrin (f.eks. *"On your Baratza Encore ESP Pro: Adjust 1.5 micro-steps finer (e.g. from 15 to 13.5)"*).
- **AI Coffee Bag Label Photo Scanner:** Tag eller upload foto af kaffeposens label direkte fra telefonen via mobil kamera-trigger. Scanner bønne, risteri, ristedato og ristegrad.
- **Fase 4 Afsluttet:** 100% implementeret, `npm run build` valideret fejlfrit, klar til mobil-test.

### 2026-09-26 – Bean Vault, Ristegrader, Ratio Presets & Kværnkatalog (v0.3.1)
- **Coffee Bean Vault:** Brugeren kan oprette og skifte mellem sine åbne kaffeposer i huset med ét klik. Hver pose husker sin specifikke kværn, dial-indstilling og ekstraktionsratio.
- **Ristegrad Vælger (Light, Medium, Med-Dark, Dark):** Interaktive knapper og badges med ekstraktionsvejledning om celledensitet og syrebalance.
- **Drikke-Ratio Presets:** Hurtigvalg for Ristretto (1:1.5), Standard (1:2.0), Modern Lungo (1:2.5) og Allongé (1:3.0) med øjeblikkelig genberegning af målvægt.
- **Kværnkatalog & Baratza Encore ESP:** Fuld integration af Baratza Encore ESP (med micro-step range 1–20), Baratza Sette 270, Eureka Mignon, DF64 Gen 2, Niche Zero, Fellow Opus, Sage/Breville, Timemore Sculptor, 1Zpresso, Comandante og support for custom kværne.
- **Ristegrads-bevidst Smagsfeedback:** Barista Dial-In tilpasser kværn- og ratioråd efter bønnernes risteprofil.

### 2026-09-26 – Fase 3: Flow Rate Matematik, Split-Timer & Pre-Infusion (v0.3.0)
- **Hybrid Split-Timer:** Indført to-faset timer, der måler $T_{\text{pre}}$ (tid fra pumpe tændes til første dråbe rammer vægten ved $\ge 0.1g$) og $T_{\text{flow}}$ (aktiv udtrækstid).
- **The Golden Zone (1.2–1.6 g/s):** Integreret specialty coffee flow-zone direkte i SVG-diagrammet (`FlowChart.tsx`) med visuel divider for First Drip og channeling spike markør.
- **Kanaliserings-Detektor (`analyzeChanneling`):** Registrerer præcist tidspunkt, flow-acceleration og spikestørrelse (mild/severe) ved gennembrud i kaffepucken.
- **Espresso Maskine Profiler & Pre-Infusion:** Vælger i 'Grinder & Beans' til espressomaskiner (Sage Dual Boiler, Barista Express, E61 Flow Control, La Marzocco Micra/Mini, Decent DE1, Straight 9-Bar) med justerbar pre-infusion skyder (0–15s).
- **Opdateret Logbog:** Viser detaljerede split-tider (`Pre: X.Xs • Flow: Y.Ys`), espressomaskine og kanaliseringsstatus for tidligere bryg.
- **Action-Oriented UX Refactor:** Omdøbt "Inspector" til "Align Scale", "Sim Mode" til "Demo Mode" og tilføjet "Display: LED/LCD" for maksimal brugervenlighed.

### 2026-09-26 – Fase 2: 7-Segment OCR Engine & Vision Inspector (v0.2.0)
- **7-Segment Canvas OCR Algoritme:** Bygget letvægts OCR ciffer-dekoder i `src/lib/ocr7segment.ts` baseret på Otsu binarisering, kolonneprojektion og 7-segment segment-sampling. Afvikles lokalt i browseren/Capacitor på < 3ms latenstid ved 15-20 FPS uden memory leaks.
- **Vision Inspector:** Tilføjet interaktivt diagnosepanel til skala-aflæsning, der viser binariseret skærm, probes og ciffer-confidence i realtid.
- **Display Inversion:** Fuld understøttelse af både LED (lysende tal) og LCD (mørke tal på grå baggrund).
- **Step 0 Auto-Tare & Auto-Start:** Automatisk detektering og låsning af `0.0g` (Step 0) samt berøringsfri start af ekstraktionstimer og flowkurve ved vægtstigning $\ge 0.1g$.
- **Støj- & Dampskyfilter:** `ScaleReadingFilter` afviser midlertidige optiske udfald fra damp eller pumpevibrationer.
- **Produktionsdomæne & Redirect:** Oprettet og konfigureret `https://espressoflow-app.vercel.app` som det officielle produktionsdomæne med 307 redirect fra beta.

### 2026-09-26 – Oprettelse af Styringsgrundlag & Web App (v0.1.0)
- **Blueprint Opdatering:** Tilpasset forretningsmodellen i `ESPRESSO_FLOW_APP_BLUEPRINT.md` til 49 kr. Lifetime Unlock med 7 dages prøveperiode.
- **Antigravity Governance:** Etableret `.agents/rules/projektinstrukser.md`, `.agents/WORKFLOW.md`, `TASK.md`, `ROADMAP.md` og `CHANGELOG.md` inspireret af det gennemprøvede setup i TømrerAppen.
- **Web App Foundation:** Scaffoldet og bygget React 19 + TypeScript + Vite + Tailwind CSS v4.
- **UI & Design System:** Implementeret "Espresso Warmth" tema med pergament (`#FAF7F2`), Claude terracotta (`#C26D52`) og `Courier Prime` skrivemaskine-typografi for jitter-frie vægttal.
- **Scale Monitor & Flow dynamics:** Skabt live Scale Cam Viewfinder med Step 0 kalibrerings-sigtekorn, realtids flow-beregning ($g/s$), terracotta flow-kurve, kanalisering-detektering og Barista Dial-In smagsfeedback.
- **Analog Logbog:** Integreret lokal logbog i feltjournal-format med historik over bryg.
- **Juridiske Sider & Paywall:** Bygget Privacy Policy, Terms of Service og Support modaler med URL deep-linking (`/privacy`, `/terms`, `/support`) klar til Vercel og App Store Connect godkendelse.
- **Lokal Verifikation:** Bekræftet 100% fejlfri compilation med `npm run build` og valideret i browser via `browser_subagent`.
- **GitHub Repository:** Oprettet og pushet til `https://github.com/MichaelKHans/EspressoFlow` på grenen `main`.
