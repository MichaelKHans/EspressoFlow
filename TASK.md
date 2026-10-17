# 📋 ESPRESSO FLOW – TASK BOARD

Dette dokument bruges til hurtige opgaveindtastninger, især når du er på farten fra mobilen.

---

## 📌 Aktuelle Opgaver (FASE 4: Bean Scanner, AI OCR & Grinder Database)
- [x] Initialiser React + Vite + TypeScript web-applikationen med Tailwind CSS
- [x] Konfigurer "Espresso Warmth" designtema og Courier Prime typografi
- [x] Byg statiske juridiske sider for Vercel (`/privacy`, `/terms`, `/support`)
- [x] Opret GitHub repository `MichaelKHans/EspressoFlow` og deploy til Vercel
- [x] Byg ultra-let Canvas 7-segment OCR ciffer-dekoder (`src/lib/ocr7segment.ts`)
- [x] Implementer adaptiv thresholding (LED lysende tal vs. LCD mørke tal)
- [x] Byg "Vision Inspector" / "Align Scale" overlay
- [x] Step 0 stabil auto-tare (`0.0g` lås) og auto-start timer (`>= 0.1g`)
- [x] Støj- og dampsky-filter (`ScaleReadingFilter` for mikrovibrationer)
- [x] Hybrid Split-Timer: $T_{\text{pre}}$ (mætningstid) og $T_{\text{flow}}$ (aktiv flowtid)
- [x] The Golden Zone (1.2–1.6 g/s) og First Drip markør i `FlowChart.tsx`
- [x] Matematisk kanaliserings-detektor (`analyzeChanneling`) med spike g/s & tid
- [x] Espressomaskine vælger og justerbar pre-infusion skyder (0–15s)
- [x] Coffee Bean Vault (flere aktive poser i rotation, gemmer ratio & kværnindstilling)
- [x] Ristegradsvælger (Light / Medium / Med-Dark / Dark) med celledensitets-anbefalinger
- [x] Drikke-Ratio Presets (Ristretto 1:1.5, Standard 1:2.0, Lungo 1:2.5, Allongé 1:3.0)
- [x] Kværnkatalog inkl. Baratza Encore ESP (1–20 micro-steps), Eureka, DF64, Niche m.fl.
- [x] AI fotoscanning af kaffepose (OCR af ristedato, bønnetype, vaskeproces) via mobil kamera
- [x] Kværn-oversættelse for mikro-justeringer (f.eks. +/- 1 trin på Encore ESP = +/- 2.5s udtræk, Eureka delestreger)
- [x] $CO_2$ afgasnings-alarm for friskristede bønner (< 4 dage fra ristning)
- [x] **Fuldstændig Udryddelse af OCR-Flimren, 242 g/s Spikes, Active Brew Focus UX & "Sort Boks" Telemetri (v1.8.0 - AFSLUTTET):**
  - [x] Fjernet blokerende `-top-3` badge fra reticle, display er 100% frit
  - [x] Række 0 prioritet (+150 point) og timer straf (-300 point på 0:00) i `ocr7segment.ts`
  - [x] Monotonic Floor Clamping i `ScaleReadingFilter` (kaffe forsvinder ikke)
  - [x] Fysisk flow clamp (maks 6.0 g/s) i `espressoMath.ts`
  - [x] Kompakt cockpit viewfinder og ergonomisk stor Stop-knap
  - [x] "Sort Boks" telemetrimotor med automatisk Supabase sync og PC script `npm run sync:diag`

## 🎨 FASE 7: Rebranding til Flowbean & Fuld Nativ Ikon-Suite (v1.4.0 - AFSLUTTET)
- [x] Officielt navneskift til **Flowbean** (favner både Espresso, Pour Over og bønnerating)
- [x] Nyt 1024x1024 master app-logo i `assets/flowbean-master-icon.png` (porcelænsbønne + terracotta flow-kurve på `#2C2018`)
- [x] Løst manglende ikon på iOS / TestFlight (`ios-marketing` & fuld iPhone opløsningssuite i `Contents.json`)
- [x] Løst manglende ikon på Android (slettet overstyrende vector-drawable, opdateret `#2C2018` baggrund, genereret adaptive mipmap ikoner)
- [x] Mobil display-navn sat til 8 tegn (`Flowbean`) for nul prikker/afkortning under ikonet
- [x] Opdateret `Info.plist`, Android `strings.xml`, `capacitor.config.ts`, `package.json`, `index.html` og in-app header logo

---

## 🫗 FASE 8: Pour Over & Filterkaffe Integration (v1.5.0 - AFSLUTTET)
- [x] **Mobil-Optimeret Metode-Vælger i Coffee Bar (Model A):**
  - Tilføjet tommelfingervenlig 2-vejs toggle mellem `[ ☕ Espresso Bar ]` og `[ 🫗 Pour Over Bar ]` i Coffee Bar.
  - Slanket mobil-headeren ved at flytte sprogvælgeren ind i `⚙️ Indstillinger` (`hidden sm:block`), frigivet 60px vandret plads på smartphones.
- [x] **Specialty Filter Drikkeprofiler & Kande-Grafik:**
  - Tilføjet 6 specialty filtermetoder: V60 (Standard & 4:6 Kasuya), Chemex, Kalita Wave, AeroPress, French Press.
  - Udvidet `ArchitecturalCup` med ægte glaskande (Range Server med tragt) og pressekolbe.
- [x] **Scale Cam Pour Over Mode & Telemetri:**
  - Bloom-timer nedtælling (0–45s) med målvand (fx 45g–50g).
  - Pacing Guide Flow-Meter (mål 4.0–6.0 g/s) og deaktivering af kanaliseringsalarm i filtermode.
  - Dynamisk FlowChart tidsakse op til 4 minutter (240s) med minut-markeringer og Y-akse op til 500g.

## ☕ FASE 9: Barista Dial-In Intelligence & Next-Brew Coach (v1.9.0 - AFSLUTTET)
- [x] **1. Optisk Billedsøger-Justering (Top Viewfinder Alignment):**
  - Fixet `object-cover` koordinat-mapping i det øverste kameraview i `ScaleMonitor.tsx` med `viewfinderContainerRef`, så den grønne boks sidder 100% præcist over vægttallene (nøjagtig som i projektionen forneden).
- [x] **2. 4-Frame Damping på Hurtige Vægtudsving:**
  - Opgraderet `ScaleReadingFilter` i `src/lib/ocr7segment.ts` til at kræve 4 sammenhængende frames for spring $> 2.0g$, og clamp frame-til-frame stigning til fysisk maks flow (6.5 g/s), så hurtige lysglimt ignoreres fuldstændigt.
- [x] **3. Slutskærmen (Shot Summary Hero Decision Card):**
  - Skabt et ultra-tydeligt Barista-resultatkort øverst i `ShotSummaryModal.tsx`:
    - 🟢 **GOD BRYGNING:** Golden Zone (25–30s, optimalt flow, nul channeling) ➔ "Behold din kværnindstilling".
    - 🟡 **GIK FOR HURTIGT (< 24s):** "Underekstraheret / Sur ➔ Kværn FINERE (+X trin/klik)".
    - 🔴 **GIK FOR LANGSOMT (> 32s):** "Overekstraheret / Bitter ➔ Kværn GROVERE (-X trin/klik)".
    - ⚠️ **KANALISERING:** Flow-spike detekteret ➔ "Hold kværn – forbedr puck-prep (WDT)".
    - Direkte 1-klik knap: `[ Sæt kværn til {setting} ]` med instant update.
- [x] **4. Pre-Brew Coach på Startskærmen (Hukommelse til næste brygning):**
  - Implementeret `PreBrewCoachBanner.tsx` i cockpittet: Når brugeren vælger samme drik (f.eks. Double Espresso), hentes forrige skud automatisk via `storage.ts`.
  - Viser et fremtrædende "Brew Coach" banner over søgeren:
    - F.eks.: *"Sidste bryg gik for hurtigt. Stil kværnen FINERE til 13.0 før du brygger!"*
    - Direkte knap til at kvittere / opdatere kværntallet med 1 tap.

## 🧪 FASE 10: Multi-Metode Bryglaboratorium & Live Telemetri Spejl (v1.10.0 - AFSLUTTET)
- [x] **1. Udvidet Multi-Tab Scenario Deck i Vægtsimulatoren (`scale-simulator.html`):**
  - 5 faner: Espresso Lab (Optimal 1:2.0, For hurtig, For langsom, Kanalisering, Ristretto, Lungo), Filter Lab (V60, 4:6 Kasuya, Chemex, AeroPress), Custom Lab (Parametrisk), Kalibrering (0-9 test, quick-weights op til 500g) og Hardware Setup.
- [x] **2. Nul-Videolatens Live Phone Telemetry Mirror:**
  - Letvægts streaming over Supabase Realtime (`anti-testbed-live`) med flydende widget på PC, der viser mobilens live OCR-vægt, nøjagtighed mod simulatoren ($\Delta\text{ g}$), flow, og automatisk spejling af appens Post-Shot Hero Decision Card.
- [x] **3. 2-Vejs Mobil Synkronisering:**
  - Automatisk `tare`, `start_shot` og `stop_shot` fra PC til mobil ved teststart og -stop.
- [x] **4. CLI Controller Udvidet (`sim-ctl.cjs`):**
  - Støtte for alle 10 brygscenarier via `--scenario`.

## 🔬 FASE 11: Fuld Vægt-Rækkevidde Aflæsning (0.0g - 2000.0g) & Ciffer '1' Bevarelse (v1.10.1 - AFSLUTTET)
- [x] **1. Fjernelse af Hårdkodet 65g Espresso-Grænse i Standby (`ocr7segment.ts`):**
  - Udvidet `ScaleReadingFilter` til det fulde fysiske måleområde op til 2000.0g, så vægte som `127.3g`, `250.0g` og `500.0g` ikke afvises som outliers under dosering, kalibrering eller pour-over.
- [x] **2. Afvisning af Ufuldstændige Brøk-Fragmenter som .1 (`ocr7segment.ts`):**
  - Indført krav om heltalsciffer før decimaltegn. Fragmenter som `".1"` afvises og kan ikke nulstille konsensusbufferen.
- [x] **3. Bevarelse af Førende Ciffer '1' i Sammensatte Tal (`ocr7segment.ts`):**
  - Ciffer '1' har færre tændte segmenter og er naturligt kortere. Kantfilteret beskytter nu '1' mod fejlagtig frasortering i tal som `127.3g`.
- [x] **4. Snappy Standby Trinrespons (2-Frame Konsensus):**
  - Trinrespons i standby bekræftes på blot 2 frames ($< 70\text{ ms}$), mens espressobrygning bevarer 4-frame damping mod dampskyer.
- [x] **5. Optisk Isolering & Ren Kamera-Mode (`scale-simulator.html`):**
  - Slukkede segmenter sat til 100% gennemsigtighed (`opacity: 0`), og tilføjet tastaturgenvej `C` og knap `📷 Ren Kamera-Mode`.

## ⚡ FASE 12: Udryddelse af Plateau-Fastlåsning, Rense Sigtekorn & Korrekt Gns. Flow (v1.10.7 - AFSLUTTET)
- [x] **1. Fjernelse af Låse-Badge fra Sigtekornet (`ScaleMonitor.tsx`):**
  - Fjernet badge med `🔒 Fokus Låst` fra retiklen; displayet og timerne er nu 100% frie for visuelle overlap.
- [x] **2. Udryddelse af Plateau-Fastlåsning under Aktiv Brygning (`ocr7segment.ts`):**
  - Omlagt `ScaleReadingFilter` til en kontinuerlig fremadrettet ekstraktionsmodel. Vægtstigninger godkendes prompte (0 ms forsinkelse), og trappetrin / falske 6.0 g/s channeling-spikes er udryddet.
- [x] **3. Målt Frame Delta-Tid (`actualDt`) i OCR-Loop (`ScaleMonitor.tsx`):**
  - OCR-filteret tilpasser sig dynamisk mobilens reelle framerate via `performance.now()`.
- [x] **4. Korrekt Gennemsnitligt Flow i Graf ved Afslutning (`FlowChart.tsx`, `ShotSummaryModal.tsx`, `Logbook.tsx`):**
  - Ekstraktionsgrafen viser nu `Gns. flow: X.XX g/s` (`chart.avg_flow`) ved afsluttede shots.

## 👁️ FASE 13: Deep Computer Vision Overhaul & Gemini 4 Argon Optimeringer (v1.10.8 - AFSLUTTET)
- [x] **1. Zero-GC Static Memory Pool (`OCRScratchPool` & Typed Buffers):**
  - Elimineret ~42 MB/s heap allocations ved 30 FPS. Pre-allokeret `Uint8Array`, `Int32Array` og 256-bin histogram i `ocrPool`.
- [x] **2. 7-Bit Hardware Bitmask Matching (`POPCNT_7BIT`):**
  - Udskiftet 210-array iterationer med præberegnet Hamming-distance lookup table og 7-bit bitmask maskevalidering ($O(1)$ per ciffer).
- [x] **3. Specular Glare & Binarisering (Chroma-Boost, Integer Bradley-Roth & Morfologisk Åbning):**
  - Rød/blå/grøn LED-separering via chroma-luminans, integer-krydsmultiplikation i Bradley-Roth med lokal kontrastdelta (10), `ledFloor` loft på 85 for at afværge Otsu-overeksponering samt 1D 3x1 horisontal morfologisk åbning (`morphologicalOpenHorizontal`) mod vertikale lysglimt/ridser.
- [x] **4. Kursiv-Vinkel Detektion (Discrete Radon Sheared Projections):**
  - 4 parallelle vinkelkandidater ($0^\circ, 5^\circ, 10^\circ, 15^\circ$ med $\tan \theta \in [0.0, 0.09, 0.18, 0.26]$) med L2 energivarians-maksimering og dynamisk slant-forskydning i segment-probing.
- [x] **5. Topologisk Cut-Cost Segmentering af Sammenvoksede Cifre:**
  - `splitFusedSpansTopological` med penetrationsstraf på midterste/øverste/nederste bjælke ($a, g, d$), så '0' og '8' aldrig skæres over i midten trods kraftig blooming.
- [x] **6. Sub-Pixel & Morfologisk Decimalpunkts-Gendannelse:**
  - `verifyAndRecoverDecimalPoint` med baseline-forankring, Right-Toe fremsprings-tjek mod prik-opslugning i 3, 5, 6 samt mikrogab-scanning.
- [x] **7. 1D Kinematisk Alpha-Beta Kalman Filter & Auto-Healing af Tabt Prik:**
  - `ScaleReadingFilter` med kontinuert tilstandsvektor $[w, v]^T$, adaptiv støjfiltrering baseret på OCR-konfidens, automatisk $\times 10$ korrektion ved tabt decimalpunkt og parallel hypotese-tracker ved hurtige vægtspring.

## 🌊 FASE 14: Gemini 4 Argon Væskemekanik, Udryddelse af Falsk Kanalisering, Dobbelt Y-Akse & Shot Card Deling (v1.11.0 - AFSLUTTET)
- [x] **1. Trappetrins-Støj & 3Hz/10Hz Beat Aliasing Udryddet (`espressoMath.ts`):**
  - Implementeret OLS (Ordinary Least Squares) over reelle vægttrin i glidende 1.6s tidsvindue med EMA-dæmpning i `calculateSmoothedFlowRate`. Eliminerer den savtakkede savtak-flowbølge ($0.3 \leftrightarrow 2.4\text{ g/s}$).
- [x] **2. 3-Faset Ekstraktionsisolering & Udryddelse af Falsk Kanaliseringsalarm (`espressoMath.ts`):**
  - Ekstraktionen er opdelt i Fysisk Fase 1 ($0 \le t < T_{\text{drip}}$), Fase 2 Onset ($T_{\text{drip}} \le t < T_{\text{drip}} + 3.5\text{s}$) og Fase 3 Steady-State.
  - Væskestigning ved First Drip kan aldrig mere udløse en kanaliseringsalarm.
  - Den binære kanaliserings-veto er fjernet; kværnjusteringer blokeres aldrig af falske alarmer.
  - Tilføjet Flow Stability Index (FSI %) og Flow Profil (`declining`, `flat`, `accelerating`, `gushing`, `choked`).
- [x] **3. Udryddelse af 42.7g -> 12.0g Slutvægt-Kollaps (`ocr7segment.ts`):**
  - `validBrewStepsCount >= 8` lås forhindrer nedadgående selv-heling under aktiv brygning (kaffe kan ikke fordampe fra koppen).
  - Ciffer '4' -> '1' (+30g korruption) opdages og heles prompte under aktiv ekstraktion.
- [x] **4. First Drip (0.2s) Stabilitet & Mid-Shot Tare Nulstilling (`ScaleMonitor.tsx`):**
  - Hvis brugeren tærer vægten undervejs i skuddet ($W \le 0.3\text{g}$), nulstilles `firstDropTimeRef` øjeblikkeligt.
  - 2-frame konfirmation mod 1-frame mikrovibrationer ved skudstart.
  - Gennemsnitligt flow beregnes nu udelukkende på den reelle flowfase ($T_{\text{flow}}$), så pre-infusion ikke trækker gns. flow ned på 0.24 g/s.
- [x] **5. Flow-Graf med Dobbelt Y-Akse & Gylden Crema Målzone (`FlowChart.tsx`):**
  - Venstre Y-akse: Vægt i koppen ($0\text{g}, 15\text{g}, 30\text{g}, 45\text{g}$).
  - Højre Y-akse: Flowhastighed ($0, 1, 2, 3, 4\text{ g/s}$) i terracotta.
  - The Golden Zone (1.2–1.8 g/s) restylet fra svag grå til varm gylden crema med stiplede linjer og tydelig målemblem (`🎯 MÅL: 1.2–1.8 g/s`).
- [x] **6. Barista Shot Card Deling & Viral Promotion (`ShotShareModal.tsx`, `ShotSummaryModal.tsx`, `Logbook.tsx`):**
  - 1080x1350 Canvas Shot Card med Flowbean branding, nøgletal, udstyr, smuk kurve og link (`espressoflow.vercel.app`).
  - Native mobil Web Share API (`navigator.share`) på iOS og Android samt fallback download/kopiering.

## 📱 FASE 15: Nativ Android/iOS Shot Card Deling via Capacitor Plugins & Graf-Afgrænsning (v1.11.1 - AFSLUTTET)
- [x] **Nativ Android/iOS Share Bridge (`@capacitor/share` & `@capacitor/filesystem`):**
  - Installeret og synkroniseret `@capacitor/share` og `@capacitor/filesystem` til Android og iOS.
  - Billedet skrives direkte til enhedens native Cache-mappe via `Filesystem.writeFile`, så Androids `FileProvider` kan udlevere filen til systemets delingsmenu.
  - Åbner Androids native Share Intent, hvor brugeren kan vælge Instagram Stories, WhatsApp, Messenger, Google Fotos eller gemme lokalt.
- [x] **Canvas Clipping Path (`ctx.clip()`) & Udryddelse af Graf-Overlap:**
  - Tilføjet streng canvas-clipping (`ctx.save() / ctx.clip() / ctx.restore()`) på grafområdet i `ShotShareModal.tsx`.
  - Vægtkurven kan under ingen omstændigheder tegne uden for grafkassen eller kollidere med KPI-tallene ovenover.
- [x] **Mid-Shot Tare Isolering på Delingskortet:**
  - Registrerer automatisk hvis koppen stod utaret på vægten før start og klipper grafen ved tare-tidspunktet. Fjerner det uønskede 65g plateau og lodrette fald.
- [x] **Glat Flow-Kurve på Kortet (Moving Average):**
  - Ujævn trappetrins-støj på gemte skud udglattes med en 3-punkts glidende gennemsnitskurve på delingskortet for et flot, professionelt look.
- [x] **Mobil Ergonomi & Toast-Feedback:**
  - Tilføjet flydende toast-notifikation ("Kopieret til udklipsholder!", "Billede gjort klar til deling!").
  - 2-kolonne knap-layout i bunden med fuld tekst og ikoner på mobilen.

## 🏆 FASE 16: Komplet Visuel Overhaling af Kopper/Glas, Digital Barista Deck, Logbog & Det Ultimative Specialty Share Card (v1.12.0 - AFSLUTTET)
- [x] **Etape 1: `ArchitecturalCup.tsx` & `drinkRecipes.ts` (Materialitet, Gradienter & Keramikkant):**
  - Fuld lineær gradient palet i SVG `<defs>` for ægte espresso, gylden crema, mikroskum, filterkaffe og krystalklart vand.
  - Tydelig porcelænsgodstykkelse (~2.5px porcelæn med skyggekant) og skitseret standring, der popper mod mørke baggrunde.
  - Autentiske barista-glas uden hank, tyk krystalbund (sham), lodret lysrefleks og Gibraltar facetter til Cortado/Piccolo.
  - Americano i glas (`glassStyle: 'glass'`) med varm ravfarvet vandbase og flydende espresso/crema.
- [x] **Etape 2: `ArchitecturalCup.tsx` & `types/espresso.ts` (Isterninger, Desserter & Unikke Pour Over Silhuetter):**
  - Kolde drikke (Iced Latte, Espresso Tonic, Cold Brew) med vinklede isterninger og kulsyrebobler.
  - Desserter: Affogato fior di latte gelato-kugle, Con Panna skulpturel flødeskumstop.
  - Unikke Pour Over silhuetter: Chemex timeglas med trækrave og lædersnor, V60 med 60° spiralriller, Kalita med flad bund og bølgekant, AeroPress uden hank med måleskala og bajonethætte, French Press med stålgitter og stempel.
- [x] **Etape 3: `DrinkSelector.tsx` (Digital Barista Deck & Typografi):**
  - Symmetrisk 2-kolonne Quick Deck (`grid grid-cols-2 sm:grid-cols-3 gap-2.5`) med forstørrede kopper (`w-10 h-11`).
  - Master-kort: Runde farveprikker i lag-forklaringen (ikke afkrydsningsfelter), samlet Grinder & Bean calibration card uden box-in-box tunghed.
  - Specialty Menu Modal tekst-afkortnings fix (`font-sans text-xs` `${ml}ml • ${category} • 1:${ratio}`) og forstørret kop (`w-11 h-12`).
- [x] **Etape 4: `FlowChart.tsx`, `Logbook.tsx`, `ShotShareModal.tsx` & i18n:**
  - `FlowChart.tsx`: Strikt SVG `<clipPath id="chart-area-clip">` og clamping forhindrer udbrud; responsiv header (`flex-col sm:flex-row gap-1.5`) holder kurveoverskrift på én linje på mobil.
  - `Logbook.tsx`: Fjernet det store tomme venstre kvadrat (~80px sparet pr. kort), miniature cup indsat direkte i headeren ved siden af `#130` og kaffenavnet, `whitespace-nowrap` på alle badges, i18n konsistens (`Share Card`, `telemetry_points`).
  - `ShotShareModal.tsx`: Det ultimative specialty share card med kop-silhuet ved siden af titel, renset udstyrsstreng (parenteser fjernet), sandfærdig dynamisk bundstatus (`Status: Channeling (X.X g/s)` eller `Status: Golden Zone`), ingen uformelle emojis, og rent `flowbean.app` domæne.

## 👁️ FASE 14: Beandex Bag Vision™ (Pose-Scanning AI) & 100% Brand Purity (v1.13.0 - AFSLUTTET)
- [x] **1. Grundig Undersøgelse af Google Gemini Model-Kataloget:**
  - Bekræftet pensionering af `gemini-1.5-flash` (udfaset sept. 2025) og `gemini-2.0-flash` (udfaset juni 2026).
  - Verificeret de aktive 2026 modeller (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`) med 100% oppetid og sub-sekunds svartid.
- [x] **2. 100% Brand Purity (Udryddelse af 3.-parts varemærker):**
  - Komplet udrensning af alle referencer til 3.-parts brands (Vivino, Untappd osv.) i UI, kildekode, kommentarer, SQL-skema og typer.
  - Standardiseret proprietary terminologi: **Beandex Bag Vision™** og **Beandex Sensoriske Smagsnoter**.
- [x] **3. 100% Sikker Serverless Vision Pipeline (Mulighed B):**
  - Oprettet `supabase/functions/scan-bag-vision/index.ts` i Deno/TypeScript.
  - Google Gemini API-nøglen er isoleret i Supabase Secrets (`GEMINI_API_KEY`) – nul nøgler eller sårbarheder i klientkode/APK.
  - Resilient automatisk failover-kæde over aktive Gemini modeller.
- [x] **4. On-Device Billedbehandling & UI Integration (`BeanScannerModal.tsx`):**
  - Implementeret `bagVisionClient.ts` med on-device canvas binarisering, 768px WebP komprimering (<40 KB) og 280x280 thumbnail generation.
  - Tilføjet 3-vejs mode selector (`Pose AI`, `Stregkode`, `Ristedato`) med skræddersyet pose-søgeramme og `[ 📸 Scan Kaffepose (Forside) ]`.
  - Verificeret med ægte billede via Supabase Edge Function med succesfuldt metadata-udtræk.
- [x] **5. Database & Schema Forbedringer:**
  - Rettet duplikat-fejl i Supabase for kaffeindekser; oprettet `idx_beans_roaster_name_search` og slået `pg_trgm` til for fuzzy-søgning.
- [x] **6. Beandex Knap-Renhed & Synlig Barista Friskhedsnote (v1.13.1):**
  - Opdateret hero og empty-state knap i Beandex til `[ 📸 Scan Kaffepose ]` med kamera-ikon i stedet for stregkode.
  - Tilføjet permanent synlig Barista Freshness Note boks på hvert bønnekort, der dynamisk opdaterer rådgivning og brygge-fokus (Oxideret 🥛 Bedst med mælk, Efter peak ⏱️ Kværn finere, Peak vindue ✨ Ren espresso, Afgasning 💨 Hviler).

---

## ⚡ FASE 10: Freshness Radar™ (Butiks- & Hyldescanner - v1.14.0 AFSLUTTET)
- [x] **Freshness Radar (Supermarket Shelf Zero-Tap Date Scanner):**
  - [x] Lynhurtig kontinuerlig OCR-scanning for ristedatoer og holdbarhedsdatoer på supermarkedshylder.
  - [x] Trafiklys HUD: 🟢 Peak Frisk (5–30d) / 🟡 Acceptabel (31–55d) / 🔴 Gammel (>55d) / 💨 Afgasser (<5d).
  - [x] Hardware Flashlight / Torch toggle til mørke butikshylder.
  - [x] Taktil haptik-vibration og syntetiseret audio-chime ved godkendt fund.
  - [x] 4s auto-reset progress bar og øjeblikkelig 1-tap genaktivering til næste pose.
  - [x] 1-tap "Gem i Beandex" med auto-udfyldt dato samt direkte genvej til Beandex Bag Vision AI.

---

## 📦 FASE 11: Kaffepose Livscyklus, Tømte Posers Arkiv & Kommerciel B2B Markedsviden (v1.15.0 AFSLUTTET)
- [x] **Bønne-Arkivering i Beandex ("Brugt op" / Finished Bags):**
  - [x] Fanevælger i Beandex: `[ ☕ Aktive Poser ({count}) ]` vs. `[ 📜 Tømte Poser / Arkiv ({count}) ]`.
  - [x] 1-klik `[ 📦 Tømt ]` på aktive poser, som åbner Barista Exit Verdict modalen i stedet for at slette posen.
- [x] **Barista Exit Verdict Modal (`FinishBeanModal.tsx`):**
  - [x] 1–5 stjerner bedømmelse og afsluttende smagsnoter/indtryk.
  - [x] Det afgørende genkøbsspørgsmål:
    - 🟢 "Vil købe igen" (`buy_again`)
    - 🟡 "Måske / Neutral" (`neutral`)
    - 🔴 "Vil ikke købe igen" (`never_again`)
  - [x] Automatisk beregning af forbrugshastighed (`daysTaken` fra åbningsdato til tømningsdato).
  - [x] Dynamisk Genkøbsrate Badge (`🟢 {percent}% Genkøbsrate`) på arkivfanen.
- [x] **Gentagne Køb & Kværn-Genbrug (`Pose #X`):**
  - [x] Når en pose genkøbes (via `[ 🔁 Køb Igen ]` i arkivet eller scanning af samme bønne), inkrementeres `bagCount` (`Pose #2`, `Pose #3` osv.).
  - [x] Bevarer 100% af kværnens dial-in data (kværn, indstilling, dosis, yield, temp).
- [x] **Kommerciel Markedsviden i Admin Hub (`AdminPortal.tsx`):**
  - [x] Tilføjet "Commercial Bean Market Intelligence & Consumer Behavior Hub" til Admin Hub:
    - Repurchase Satisfaction Rate (% der vil genkøbe kaffebønnen).
    - Consumption Speed (gennemsnitligt antal dage om en pose).
    - Stock Dynamics (aktive poser i omløb vs tømte poser).
    - Multi-Bag Loyalty (antal poser med genkøb `bagCount >= 2`).
  - [x] Kommerciel model til risteripartnerskaber, datadrevne genkøbs-påmindelser, hylde-intelligens og community presets.
- [x] **Supabase Sky-Synkronisering (`supabase.ts`):**
  - [x] `syncBeanRepurchaseVerdict` synkroniserer anonyme genkøbsbedømmelser direkte til Supabase.

---

## 🎯 FASE 12: Feedback-Gennemgang & Barista UX Optimering (7-Siders Audit)
- [x] **Etape 1: Kritiske Data- & Logik-Bugs (v1.19.4):**
  - Fjernet falsk "Balanced" fallback i Logbog ved ubedømte skud.
  - Beandex badge-tællere tæller kun aktive uafsluttede bønner (`!b.isFinished`).
  - Moderniseret terminologi fra "Barcode" til "Beandex Bag Vision™".
- [x] **Etape 2: 100% Sprog- & Lokaliserings-Rens (v1.19.5):**
  - Rettet datolokaliserings-motor i Logbog til appens aktive i18n-sprog (`localeCode` en-US / da-DK).
  - Elimineret hårde danske fallbacks i `Logbook.tsx`, `ShotSummaryModal.tsx` og `PreBrewCoachBanner.tsx`.
  - Internationaliseret Beandex friskhedsfaser og bønneskifter i `en.ts` og `da.ts`.
- [x] **Etape 3: Tidtagning, Kurve-Trimning & Mål-tid i "Time & Flow" (v1.19.6):**
  - Kurvetrimning fra første dråbe ($t = 0.0\text{s}$) i `ScaleMonitor.tsx` for at eliminere død flad startlinje.
  - Fjernet misvisende "Puck Choking" advarsel fra `espressoMath.ts`.
  - Måltid og $\Delta t$ i "Time & Flow" kort (`Logbook.tsx` & `ShotSummaryModal.tsx`) med opskrifts-sammenligning.
  - Automatisk kurvetrimning for historiske skud og delingskort i `FlowChart.tsx` og `ShotShareModal.tsx`.
- [x] **Etape 4: In-App Kamera & Ristedato Reticle HUD i Step 2 (v1.19.7):**
  - Hold den direkte `<video>` søger kørende i `BeanScannerModal.tsx` Step 2 med den dedikerede "Ret mod Ristedato Stempel" grønne reticle-boks i stedet for at åbne det eksterne native kamera via fil-dialog.
  - Optisk OCR capture direkte fra videostrøm via `handleDateCameraCapture`.
- [x] **Etape 5: Admin Baggrunds-Inspector (v1.19.8):**
  - Direkte "Juster" knap på `AdminThemeBadge.tsx`, der åbner en flydende popover til realtids-justering af baggrundssløring (blur 0–16px), farvetone overlay, opacitet (10–100%) og lysstyrke/kontrast, gemt i `localStorage`.
  - Reaktiv motor (`src/lib/cardThemes.ts` & `useCardAdjustments`) forbundet til alle 5 temabærende kort i appen.
- [x] **Etape 6: Komplet Sprog- & Lokaliserings-Sanering (v1.19.9):**
  - Fuld eliminering af hårdkodede danske ord i `BeanScannerModal.tsx`, `DrinkSelector.tsx`, `BeanMatchmakerModal.tsx`, `BeandexView.tsx`, `PaywallModal.tsx`, `FlowChart.tsx`, `ScaleMonitor.tsx` og `App.tsx`.
  - Tosprogede modale faner (`Bag AI`, `Barcode`, `Roast Date`), reticle guides, radar descriptions og udstyrs-kort.
  - Engelsk fallback i overensstemmelse med Rule 4; 100% nøgleparitet i `en.ts` og `da.ts`.

---

## 📌 Næste Opgaver
- [ ] **Opdatering af Vilkår & Privatlivspolitik (`LegalModal.tsx`):**
  - Ajourføre Privacy Policy og Terms of Service til 100% at afspejle den aktuelle arkitektur:
    - 100% on-device OCR uden videostreaming til eksterne servere.
    - Local-first lagring i browser/app SQLite/LocalStorage.
    - Valgfri anonym synkronisering af kaffedata og fremtidig aggregeret markedsindsigt.
    - Klare vilkår for 7-dages gratis prøveperiode og $4.99 / 49,- DKK engangskøb (Lifetime Pro).

---

## 💡 Idéer & Fremtidige Noter
- [ ] Bluetooth BLE support som sekundær luksus-option for Acaia / Timemore vægte
- [ ] Lydeffekter: Diskret analog mekanisk "klik"-lyd ved tare og start
