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

---

## 📌 Næste Opgaver: Bønne-Arkivering i Beandex ("Brugt op" / Finished Bags)
- [ ] **Bønne-Arkivering i Beandex ("Brugt op" / Finished Bags):**
  - Tilføj mulighed for at markere en kaffepose som "Opbrugt" / "Arkiveret" i stedet for bare at slette den.
  - Opret sektionering i Beandex: "Aktive kaffer" vs. "Arkiv / Kaffekirkegård" med fold-ud historik.
- [ ] **Personlige Genkøbs-Labels (Barista Repurchase Intent):**
  - Knapper / badges på arkiverede poser:
    - 🟢 "Vil købe igen" (`buy_again`)
    - 🟡 "Måske / Neutral" (`neutral`)
    - 🔴 "Vil ikke købe igen" (`never_again`)
  - Mulighed for en kort afsluttende dom/notat (fx "God med havremælk, for mørk til ren espresso").
- [ ] **Anonymiseret Markedsindsigt & Trends:**
  - Forberede anonym aggregering (fx *"84% af baristaer ville købe denne bønne igen"* i Central Bean Vault) uden personhenførbare data.
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
