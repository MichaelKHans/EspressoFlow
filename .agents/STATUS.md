# Espresso Flow Project Status & History

## Projekt Oversigt
- **Navn:** Espresso Flow
- **Primært sprog:** 100% Engelsk (English US)
- **Design System:** Espresso Warmth (`#FAF7F2`, `#FFFDF9`, `#2C2018`, `#C26D52`) + `Courier Prime`
- **Forretningsmodel:** 7 dages in-app prøveperiode $\rightarrow$ $4.99 / 49,- DKK Lifetime Unlock (RevenueCat)
- **Repository:** `MichaelKHans/EspressoFlow`

---

## 🕒 Historik & Gennemførte Opgaver

### 2026-09-26 -- Onboarding Wizard, Bean Vault Match Engine & Rist-Profilmatch (v0.5.9)
- **3-Step Onboarding Wizard (`OnboardingWizard.tsx`):** Ny brugere guides gennem kværn-valg (22 modeller), maskine-valg (18 modeller) og oprettelse af deres første kaffebønne med auto-ratio.
- **Bean Vault Match Engine (`beanMatcher.ts`):** Matematisk Roast Compatibility Matrix scorer alle bønner i vaulten mod den valgte drik. Viser match-procent og foreslår bedre bønner med 1-klik switch.
- **`idealRoastLevels` på alle 19 opskrifter:** Light (Lungo, Tonic, Allonge), Medium/Med-Dark (Cappuccino, Flat White, Latte, Americano), Dark (Ristretto, Macchiato, Affogato, Bombon, Mocha, Con Panna).
- **Persistent Machine Name:** Gemmes i `localStorage` og huskes mellem sessioner.

### 2026-09-26 -- Kollapsbart Drikke-Bibliotek & Per-Drik Kvaernhukommelse (v0.5.8)
- **Kollapsbart Drikke-Bibliotek:** Det store katalog med alle 19 specialitetsdrikke og arkitektoniske vektor-kopper er nu som standard elegant sammenfoldet under en ren *"Specialty Drink Library (19 recipes)"* expander. Hovedskærmen viser udelukkende den aktivt valgte drik, dens nøjagtige brygparametre, mælke/vand-guide og kværnhukommelse, så siden er super overskuelig uden endeløs rulning.
- **Per-Drik Kværnhukommelse & Smart Forbedrings-Engine (Grind Memory Engine):**
  - Husker den nøjagtige kværnindstilling for **hver enkelt drik** parret med den aktive kaffebønne og kværnmodel (`localStorage` nøgle: `${beanId}_${drinkId}`).
  - **Taktil Trin-Justering:** Hurtig-knapper `[-]` og `[+]` (0.5 trin) og direkte input med en taktil `[Lock Setting]` knap for permanent fastlåsning.
  - **Matematisk Flow-Analyse & Proaktiv Barista-Vejledning:** Sammenligner automatisk seneste skud i historikken med drikkens måltid ($\Delta t = t_{\text{actual}} - t_{\text{target}}$) og kværnens specifikation ($s/\text{step}$).
  - **1-Tap Anbefaling:** Ved for hurtigt løb (fx 21s vs 27s mål) anbefales automatisk fx "Grind 2.5 micro-steps FINER" med en direkte `[Apply 0.9]` handlingsknap.
  - **Golden Zone & Kanaliserings-Detektion:** Viser grønt "DIALED IN"-stempel i gyldne flow-zone (1.2–1.6 g/s) og advarer ved kanalisering med råd om WDT-nåle og jævnt tamp fremfor forhastet kværnjustering.
- **Automatisk Kværn-Synkronisering:** Når der skiftes drik på baren, opdateres kværnindstillingen automatisk i Scale Cam og shot-loggen.

### 2026-09-26 – Single Espresso (Solo) & Udvidet Specialty Drikke-Bibliotek (v0.5.7)
- **Single Espresso / Solo (`single-espresso`):** Klassisk 9g single basket ekstraktion $\rightarrow$ 18g yield i demitasse kop med dial-in råd til tragtformede kurve.
- **6 Nye Specialty Drikke Tilføjet:** Caffè Mocha (mørk chokolade ganache + mikroskum), Espresso Con Panna (kold piskeflødekrone), Iced Caffè Latte (floatet shot over kold mælk og is), Caffè Shakerato (shaket kold espresso-fløjl), Café Allongé (1:3 forlenget ekstraktion) og Piccolo Latte (enkelt ristretto + micro-foam).
- **19 Komplette Opskrifter:** Biblioteket rummer nu 19 verdenskendte specialitetsdrikke med fulde lagdelte arkitektoniske vektor-kopper.
- **Opdateret DrinkId Typesystem:** Tilføjet samtlige nye drikke-ID'er til typesystemet i `espresso.ts`.

### 2026-09-26 – Quick Deck Synlighed, Direkte Drikkevalg & Switch Knap (v0.5.6)
- **Fuld Synlighed for Alle Fastgjorte Drikke (`DrinkSelector.tsx`):** Hurtig-baren ombryder nu automatisk (`flex flex-wrap`), så alle 6 fastgjorte drikke (Cappuccino, Doppio, Flat White, Cortado, Latte, Americano) vises på 2 overskuelige rækker uden at være gemt bag en usynlig horisontal rullebjælke.
- **Direkte Valg i Specialitets-Modalen:** Tryk på en hvilken som helst af de 12 drikke vælger og låser den straks til brygning og lukker modalen.
- **Dedikerede "Pin / Pinned" Knapper:** Hver drik i modalen har sin egen faste pin-knap til at tilføje/fjerne den fra topbaren.
- **Hurtig-Skift Knap på Masterkortet:** Tilføjet "Switch"-knap direkte ved siden af drikkens overskrift for lynhurtigt skift mellem opskrifter.
- **"+ More" Knap på Baren:** Viser det resterende antal drikke direkte i bjælken med 1-klik adgang til alle opskrifter.

### 2026-09-26 – Crema Top-Down Fysik, Menuløft & Ikon-Sanering (v0.5.5)
- **Crema & Væskelag Retning Løst (`ArchitecturalCup.tsx`):** Rettet renderingen så væskerne opbygges oppefra og ned. Crema og mikroskum ligger nu øverst i koppen som i virkeligheden, mens espresso, vand og mælk danner bunden.
- **Drik-Specifikke Top- og Bundgrænser:** Justeret koordinater for demitasse (26px), standard kop (16px), facetglas (16px) og højt glas (14px) for perfekt kophøjde.
- **Hovedmenu Løft & Taktil Segmenteret Kontrol:** Den flade tekststreg i navigationen er udskiftet med en eksklusiv segmenteret kapselbjælke med mørkristede aktive knapper (`#2C2018`) og ren badge-tæller på Logbook.
- **Stjerner Fjernet fra Coffee Bar:** Udskiftet `<Sparkles>` med det korrekte `<Coffee>` kop-ikon på fanen og i Digital Barista Deck.
- **Scale Cam Fane Ikon:** Udskiftet kop-ikon med et præcist `<Camera>` vektorikon til kameravægt-OCR.

### 2026-09-26 – Steamed Water Guide til Americano/Long Black & Micro-Aeration (v0.5.4)
- **Steamed Water Guide til Americano / Long Black:** Integreret barista-metoden med mikroskopisk damp-luftet varmt vand (~78°C, 110ml) i stedet for fladt kedelvand.
- **Dedikeret Steamed Water Guide i DrinkSelector:** Viser temperatur, volumen og dampmetode i Masterkortet på lige fod med mælkeguider.
- **Opdateret Lag-Fysik & Kop-Anatomi:** 110ml dampet vand, 45ml espresso base og 25ml intakt, fløjsblød crema bevaret via overfladespænding.
- **Barista Dial-In Pro Tip:** Trin-for-trin guide til dampning med dampdysen i mælkekanden før skuddet trækkes ovenpå.

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
