# 📜 ESPRESSO FLOW – CHANGELOG

Alle væsentlige ændringer og milepæle i Espresso Flow dokumenteres i dette dokument i henhold til Semantisk Versionering (SemVer).

---

## [1.2.12] - 2026-09-27
### Genuine Bag Date OCR, Zero Date-Guessing & Accurate Roast Level Detection
- **Eliminated Fake/Guessed Roast Dates:**
  - Barcode scanning (EAN/UPC) identifies product identity, brand, and origin, but no longer invents or fabricates fake roast dates (previously defaulted to `today - 10 days`).
  - Barcode results now clearly state that retail barcodes lack batch production stamps.
- **Two-Step Optical Workflow (Step 2: Capture Roast Date on Bag):**
  - Added dedicated *Step 2* card when a barcode is scanned without an expiration/roast stamp.
  - Barista can tap `Take Photo of Date Stamp` (`Tag foto af datostempel`) to take a photo of the printed production/BBD stamp on the back of the bag.
  - Optical OCR parser automatically extracts:
    - **Production Date:** Prioritizes explicit `Production date:` / `Produktionsdatum` / `Datum výroby` / `Fecha de fabricación` stamps (e.g. `13/05/2026`) as confirmed roast date with 100% confidence.
    - **Best Before Date (BBD):** Extracts BBD and calculates estimated roast date (~12 months prior) only when no production date is printed.
  - Fallback option to pick date manually or adjust with calendar.
- **Accurate Commercial & Specialty Roast Level Detection:**
  - Fixed false `medium` roast default on dark roasts (such as Starbucks Espresso Roast).
  - OCR scans bag packaging for roast spectrum indicators (`DARK`, `Dark Roast`, `BLONDE`, `Intensity 10-12`, `Tueste Intenso`).
  - Added explicit roast level confirmation guide in UI so baristas can confirm against bag labeling.
  - Corrected Open Food Facts user typo ("Whole Bear" $\rightarrow$ "Whole Bean").

## [1.2.11] - 2026-09-27
### Uncluttered Viewfinder, External Camera Toolbar & Arm-to-Brew Scale Workflow
- **"Coffee Bar" Tab Navigation:**
  - Updated the first navigation tab label from "Bar" to "Coffee Bar" across all mobile and desktop viewports (`Coffee Bar`, `Scale`, `Logs`, `Gear`).
- **Clean, Unobstructed Camera Viewfinder:**
  - Removed all floating buttons, zoom controls, recenter chips, and the bottom telemetry bar from inside the live camera viewfinder.
  - Eliminated the flashing `Auto (LED)` polarity button issue (prevented frame-by-frame CSS invert flicker).
  - The live camera viewfinder is now 100% clean and clear, showing only the camera feed, targeting reticle, and tap feedback.
- **Dedicated External Camera Toolbar:**
  - Placed directly beneath the camera feed (`bg-[#1A1412]`): Zoom pills (`1.0x`, `1.8x`, `2.5x`), Box mode (`Compact` / `Standard`), `Center` reset, Display mode (`LED` / `LCD`), Torch toggle (`Zap`), and Diagnostic Inspector.
- **3-Phase Barista Control Deck & Scale Arming Workflow:**
  - **Phase 1: Alignment Mode:** Phone can be placed and adjusted freely against a cup or drip tray without starting the timer prematurely. Live video feed remains visible with targeting guidance.
  - **"I'm Ready • Arm Scale" Button:** User positions their phone, verifies digits, and taps "I'm Ready • Arm Scale".
  - **Phase 2: Armed Mode:** Scale arms and waits safely. The extraction timer auto-starts only when coffee actually flows (weight increases by ≥ 0.2g), or user taps "Start Shot Now". Includes "Adjust Alignment" to disarm if phone needs repositioning.
  - **Phase 3: Active Extraction:** Displays real-time flow rate, split timer, tare status, with quick "Reset" and "Stop & Save Shot" controls.

## [1.2.10] - 2026-09-27
### High-Contrast Recenter Button & Tap-to-Focus Viewfinder Guidance
- **High-Contrast Recenter Button (`⌖ Recenter`):**
  - Redesigned with solid dark espresso background (`#2C2018`), bold 2px bright amber border (`border-amber-400`), crisp amber text (`font-extrabold`), and drop shadow.
  - 100% legible against bright backgrounds, daylight, and white walls.
- **Prominent Tap-to-Focus Viewfinder Guidance:**
  - Added floating guidance badge in the live camera viewfinder: `👆 Tap scale digits to focus & target`.
  - Updated reticle crosshair prompt text: `[ 👆 TAP DIGITS TO FOCUS & ALIGN ]`.
  - Added persistent guidance to the bottom control bar on both mobile and desktop screens (`👆 Tap screen to target & focus scale • Auto-starts timer at 0.1g`).

## [1.2.9] - 2026-09-27
### Hidden Passcode Gate & Custom Admin Passcode Settings
- **Removed Passcode Hint from Login Screen:**
  - Completely removed the default passcode label (`Default master passcode: 9246 or espresso2026`) from the `/admin` login view for absolute access privacy.
- **Custom Admin Master Passcode:**
  - Added dedicated *Security & Passcode* tab in the Admin Hub (`KeyRound` icon).
  - Admin/owner can change the master passcode to any personal numeric PIN or alphanumeric password (minimum 4 characters).
  - Passcode confirmation validation, show/hide password toggle, and instant visual success feedback.
  - Option to reset back to factory default (`9246`) at any time.
  - Custom passcode persists safely in local browser storage (`localStorage`), surviving page reloads and browser closures.

## [1.2.8] - 2026-09-27
### Scale Cam Optical Zoom, Tap-to-Align, Compact Reticle & Anti-Glare Vision Engine
- **Digital Optical Zoom (1.0x, 1.8x, 2.5x):**
  - Instant optical canvas magnification directly in the camera feed (`1.8x` by default, with `1.0x` and `2.5x` toggle pills).
  - Digits now occupy large pixel-dense regions on the canvas, eliminating distance blur without needing to hold phone awkwardly close.
  - Automatically queries and activates device hardware continuous autofocus (`focusMode: 'continuous'`) and hardware zoom when supported by the mobile sensor.
- **Interactive Tap-to-Align & Recenter:**
  - Barista can tap anywhere on the live viewfinder to target the scale display dynamically (`🎯 Aligned & Focused` feedback ring).
  - Added dedicated *Recenter* button (`⌖ Recenter`) to instantly snap back to center.
- **Ultra-Compact Digits-Only Reticle (21:9):**
  - New *Compact* mode isolates only the active digits (aspect ratio 21:9), cutting out distracting cup surfaces, portafilter shadows, and drip tray glare.
  - User can toggle between *Compact* and *Standard* ROI bounding boxes.
- **Advanced 7-Segment Anti-Glare & Topological Filtering:**
  - **Hollow Inner Cavity Verification:** Probes top and bottom loop cavities (`upperHole`, `lowerHole`, `centerHole`). If both cavities are filled with light, it's flagged as a specular glare/reflection and disqualified from being read as an `'8'`.
  - **Fill Density Rejection:** Real 7-segment strokes have 20–55% fill density. Solid reflection smudges (>68% active pixels) are automatically rejected.
  - **Aspect Ratio Rejection:** Discards wide streaks and reflections from chrome drip trays.
- **Built-in Flashlight / Torch Toggle:**
  - Integrated `Torch` button on the live viewfinder for dark coffee bar setups and under-machine scale displays.

## [1.2.7] - 2026-09-27
### 100% English Global UI Across Admin Portal, Dial-In Studio & Equipment Fleet
- **Strict English Standard across All User-Facing Components:**
  - **Admin Portal (`/admin`):** Fully localized in professional English (Restricted Area PIN gate, trial metrics, lifetime unlocks, conversion rate, community bean star vault showcase, and Supabase cloud sync).
  - **Dial-In Wizard Studio:** 100% English workflow (Grinder & Setting for Bean, Stepless/Stepped indicators, Finer/Coarser controls, Dose/Yield/Ratio tuning, and Lock Calibration).
  - **Equipment & Grinder Fleet:** English UI for home bar grinder setup (Active on Bar, Set Active, Remove from setup, Add grinder from library, and Add Custom Grinder).
  - **Bean Vault & Favorite Rolodex:** English star rating bookmarking (`Favorite Beans Rolodex`), roast profiles, and bean deletion.
  - Multi-language engine preserved in background (`src/i18n/locales/`) for post-v1.0 localization packs.

## [1.2.6] - 2026-09-27
### Dedicated Admin Portal & Passcode Security Gate (/admin)
- **Lukket Admin-Sektion på Separat URL (`espressoflow.vercel.app/admin`):**
  - **Sikker Kode-Beskyttelse:** Admin-siden er låst bag en master-kode (`9246` eller `espresso2026`) med taktilt numerisk tastatur, vis/skjul kodeord, fejl-feedback og session-hukommelse.
  - **Omsætning & 7-Dages Trial Metrikker:**
    - Live overblik over antal aktive brugere i 7-dages prøveperiode.
    - Antal betalende livstidsbrugere ($4.99 / 49,- DKK engangskøb via RevenueCat).
    - Akkumuleret omsætning og konverteringsrate.
  - **Kaffebønne Stjerner & Ratings Kardotek:**
    - Viser overblik over alle bønner med stjerner givet af brugerne (1 til 5 stjerner `★`).
    - Gennemsnitlig rating, populære risterier og bønnespecifikke kværnkalibreringer.
    - Forberedt til central Supabase integration, der i næste fase fodrer en offentlig bønne-database på nettet som reklameside for appen.
  - **Smidig Navigation & Lås-Funktion:**
    - *"Kaffebaren"* knap fører direkte tilbage til appens forside.
    - *"Lås"* knap lukker øjeblikkeligt admin-sessionen ned for uvedkommende.
    - Diskret link i appens footer (`Admin 🔒`) for hurtig adgang.

## [1.2.5] - 2026-09-27
### Grinder Setup Management & Dial-In Favorite Grinder Picker
- **Mit Kværn-Setup i Beans & Gear (Personal Grinder Fleet):**
  - **Udstyrskort til Kaffekværne:** Tilføjet en dedikeret sektion *"Mit Kværn-Setup (Mine Kværne)"* i `Beans & Gear`, hvor baristaen kan overskue og konfigurere de kværne, der fysisk står på kaffebaren.
  - **Aktiv på Baren Indikator & 1-Klik Skift:** Tydelig grøn *"Aktiv på Baren"* badge med direkte *"Gør Aktiv"* knap på hver kværn i setup'et.
  - **Nem Tilføjelse & Fjernelse:** Tilføj eksisterende kvalitetskværne fra det indbyggede bibliotek (Baratza, Eureka, Niche, DF64, Varia, Sage, Comandante m.fl.) med 1 klik, eller opret helt brugerdefinerede kværne via *"Opret Brugerdefineret Kværn"*.
- **Vælg Favoritkværn Direkte i Dial-In Studio:**
  - **Taktil Kværnvælger i Trin 1:** Baristaen kan nu lynhurtigt vælge mellem kværnene i sit setup (eller fra hele biblioteket) direkte inde i Dial-In Studio via taktile chips (`Baratza Encore ESP`, `Eureka Specialita` osv.).
  - **Automatisk Tilpasning af Skala & Kværntrin:** Når en kværn vælges, skifter skala-enheden (f.eks. fra `micro-steps (1-20)` til `micrometric dial (0-5)`) og inputværdien opdateres dynamisk til den pågældende kværns standard eller bønnespecifikke kalibrering.
  - **Permanent Tilknytning til Bønnen:** Ved at trykke *"Lås Kalibrering på Bønnen"* gemmes den valgte kværn som bønnes faste favoritkværn (`bean.grinderName`) og synkroniseres 100% på tværs af Beans & Gear og Scale Monitor.

## [1.2.4] - 2026-09-27
### Mobile UX & Favorite Beans Rolodex
- **Top-Right Bønnesletning & Favorit Bønne-Kardotek:**
  - **Slet-knap Flyttet til Øverste Højre Hjørne:** Fjernet den forvirrende skraldespand i bunden af bønnekortet. Nu sidder der et diskret og intuitivt slette-ikon i øverste højre hjørne ved siden af `ACTIVE`-indikatoren på hver bønne i `Beans & Gear`.
  - **Nyt Kompakt Favorit Bønne-Kardotek:** Tilføjet et ultra-slankt kardotek under bønnelageret med:
    - 1-klik interaktive guldstjerner (1 til 5 stjerner `★`).
    - Kompakt visning af risteprofil-badge, navn, risteri og kværn.
    - Hurtig-aktivering med *"Vælg"* knap.
  - **Datamodel Forberedt til Supabase & Global Database:** Tilføjet `rating` (1-5) og `isFavorite` til `CoffeeBeanProfile`, som danner fundamentet for fremtidig crowdsourced kaffebase og offentlig webportal.

## [1.2.3] - 2026-09-27
### Visual Polish & Roast Level Badges
- **Farvekodede Bønneristnings-Badges på Coffee Bar:**
  - **Identisk Æstetik med Beans & Gear:** Bønnevælgeren på Coffee Bar (i det mørke Mokka-kort) og Dial-In Studio har nu fået nøjagtig samme karakteristiske, farvekodede pille-badges som under `Beans & Gear`:
    - `LIGHT`: Varm rav/gylden pille (`bg-amber-400/20 text-amber-300 border-amber-400/40`).
    - `MEDIUM`: Varm terracotta/fersken pille (`bg-[#C26D52]/25 text-[#FFB6A0] border-[#C26D52]/45`).
    - `MEDIUM-DARK`: Dyb kastanjebrun pille (`bg-[#A3684A]/30 text-[#E8C2B0] border-[#A3684A]/50`).
    - `DARK`: Mørk ristet espresso-pille med hvid kontrastkant (`bg-black/60 text-[#FAF7F2] border-white/25`).
  - **Hurtigt Visuelt Overblik:** Baristaen kan med det samme afkode bønnernes ristegrad direkte i hurtigvælgeren uden at skulle læse små grå hjælpetekster.

## [1.2.2] - 2026-09-27
### Interactive Dial-In Studio & Cross-Tab Synchronization
- **Fuld Interaktiv Dial-In Wizard & Bønnekalibrering (Mulighed 3):**
  - **Taktile Steppere & Direkte Input:** Dial-In vinduet er transformeret fra en statisk vejledning til et fuldt interaktivt barista-værktøj. Baristaen kan nu justere:
    - **Kværntrin (Burr Gap):** Finjuster med `−` / `+` knapper (eller tastatur) direkte tilknyttet den aktive kværn.
    - **Tør Dosis (In):** Juster med `−` / `+` (0.5g trin).
    - **Mål-Udbytte (Out):** Juster med `−` / `+` (1.0g trin).
    - **Realtids-Ratio:** Beregner øjeblikkeligt forholdet ($Yield / Dose$, f.eks. 1:2.0) med profil-mærkning (*Ristretto*, *Standard Normale*, *Lungo*).
  - **Lås Kalibrering på Bønnen:** Ved tryk på *"Lås Kalibrering på Bønnen & Start Scale Cam"* gemmes tallene permanent direkte på bønnen (`currentBean`), og Scale Cam måler mod de nye specifikke mål.
  - **Live Bønne-Kalibrering i Mokka-Kortet:** På det mørke mokka-kort på Barista Deck kan baristaen nu justere kværntrin og se dosis og udbytte direkte uden at åbne en modal, samt trykke *"Åbn Studio"* for fuld finjustering.
  - **100% Synkronisering med "Beans & Gear":** Ændringer foretaget i Dial-In Studio eller på Barista Deck slår øjeblikkeligt igennem i `Beans & Gear` (`Bean Vault`), hvor bønnekortet og hurtig-tuneren altid viser de senest kalibrerede værdier.

## [1.2.1] - 2026-09-27
### Mobile UX & Visual Anchoring
- **Top-Forankret Auto-Scroll & Hovedoverskrift som Anker:**
  - **Præcis Forankring under Sticky Navigation:** Når en kaffedrik vælges (via hurtigbåndet, "All Drinks & Deck" modalen eller oversigtskataloget), scroller skærmen nu med dynamisk offset (`window.scrollTo({ top: targetY, behavior: 'smooth' })`), så kaffens overskrift lander direkte i toppen af viewporten lige under den faste menulinje.
  - **Slut med Desorientering på Små Skærme:** På mindre mobilskærme blev overskriften tidligere skubbet af skærmen ved lodret centrering. Nu er kaffens navn (f.eks. **Cortado / Piccolo**, **Flat White**) altid det første, der møder baristaens øjne.
  - **Tydelig Visuel Anker-Badge:** Tilføjet pulserende terracotta-indikator (`● AKTIV KAFFE / SELECTED DRINK`) og fremhævet typografi på kaffens overskrift, så baristaen aldrig er i tvivl om, hvilken profil der brygges efter.

## [1.2.0] - 2026-09-27
### Added & Improved
- **Intelligent Kaffebønne-Pairing & Centreret Drikkestyring:**
  - **Automatisk Centreret Scroll ved Valg af Drik:** Når en barista klikker på en drik (i hurtigbåndet eller i oversigten), scroller skærmen nu glidende og centrerer automatisk over drikkens detaljekort, så man straks ser ekstraktionsprofilen og "Pull Shot on Scale Cam".
  - **Bønnevælger Flyttet Direkte til Kaffen:** Den overflødige bønneknap i toppen af Barista Deck er fjernet. Man vælger nu bønnen direkte nede ved den kaffedrik, man er i gang med at tilberede.
  - **Nyt Mørkt Flot Mokka Bønnekort:** Dyb, luksuriøs ristet mokka-æstetik (`#241A14` / `#2C2018`) med guld/pergament accenter, der præsenterer bønnevalg, ristegrad, ristedato og kværnindstilling samlet ét sted.
  - **Optimalt Valg (The Ideal Extraction Profile):** Viser den optimale bønnetype for netop den valgte drik (fx fyldig Mellem-mørk med chokolade/nødder til mælkedrikke vs. sød Mellemristet med røde bær til ren espresso vs. vasket lys til lungo).
  - **Smart Barista-Anbefaling til Næste Køb (Single-Bean Support):** Hvis baristaen kun har én bønne i samlingen, analyseres ristegraden, og der gives en konkret, venlig anbefaling til, hvilken type bønne (ristegrad, proces og smagsnoter – helt uden mærker) man med fordel kan købe næste gang for at løfte netop denne drik.
  - **Finkornet Standby-Vejledning til Telefonplacering:** Standby-visningen på Scale Cam guider nu præcist baristaen: *"Du kan stille og roligt placere telefonen på kaffestationen, på en kop eller mod maskinens drypbakke, så linsen peger mod vægtens display."*

## [1.1.3] - 2026-09-27
### Business Model & UX Clarity
- **Fuld Afskaffelse af Forvirrende "PRO" Nomenklatur:**
  - **Én Samlet App Model (7-Dages Prøveperiode $\rightarrow$ $4.99 / 49,- DKK Engangslivstidskøb):** Da alle brugere skal betale for appen efter de 7 dages prøveperiode for at fortsætte med at brygge, findes der ikke en kunstig opdeling mellem "gratis brugere" og "Pro brugere". Derfor er enhver reference til "PRO" saneret overalt i appen.
  - **Topbar Helt Fri for Badges Efter Køb:** Når en bruger har låst appen op, forsvinder adgangschipen i headeren 100%. Brugeren mødes af en helt ren, rolig og uforstyrret topbar med brand-ikon og logo.
  - **Diskret Prøveperiode-Status:** Under de 7 dages prøveperiode vises en diskret `🛡️ 7d` chip, så baristaen altid ved, hvor mange dage der er tilbage.
  - **Automatisk Låsning Efter Prøveperiode:** Hvis prøveperioden udløber uden køb, åbnes "Unlock Lifetime Access" modalen automatisk ved opstart, så appen ikke kan bruges gratis på ubestemt tid.
  - **Nyt Licenskort i Indstillinger:** Under Gear/Indstillinger kan baristaen altid se status på prøveperioden, låse op for altid ($4.99 / 49,- DKK) eller gendanne tidligere køb ("Restore Purchases") ved skift af telefon.

## [1.1.2] - 2026-09-27
### Architecture & Strategy
- **Global-First Launch Arkitektur & Slank UI Streamlining:**
  - **Sprogvælger Skjult til Efter Lancering (`ENABLE_MULTI_LANGUAGE = false`):** I overensstemmelse med strategisk produktfokus slås den aktive sprogvælger midlertidigt fra i UI'en (både i topheaderen og i indstillingskortet), så appen fremstår 100% ren, minimalistisk og stilren med international specialty coffee terminologi (SCA standard).
  - **Arkitektur & Oversættelser Bevares 100% Intakt:** Alle 11 gennemførte sprogordbøger (`en`, `da`, `de`, `it`, `fr`, `es`, `ja`, `ko`, `zh-CN`, `zh-TW`, `ar`) ligger fuldt bevarede i `src/i18n/locales/`. Vi kan forberede og perfektionere oversættelserne løbende i kulissen, og aktivere dem med et enkelt flag i v1.1 efter udgivelse på iOS App Store og Google Play.
  - **100% Fuldført i18n-Binding på Kritiske Moduler:** Alle hårde strenge i `Logbook`, `FlowChart`, `TasteFeedback` og `ScaleMonitor` er forbundet til `useTranslation()`, med typesikker fallback og fuld understøttelse af fremtidige sprogudvidelser.
  - **Ultra-Clean Header:** Topbaren indeholder nu udelukkende kaffelogo, app-titel og den elegante PRO/Trial status-chip – nul visuel støj eller klemmende menuelementer på smalle mobilskærme.

## [1.1.1] - 2026-09-26
### Improved & Fixed
- **Mobil UX & Top-Header Streamlining (Stilren & Minimalistisk Kaffe-Æstetik):**
  - **Single-Line Zero-Clutter Header:** Fjernet den pladskrævende undertitel og den grå versionsbadge fra mobilvisningen, så toppen altid fremstår som en ultraskarpt skåret 44px minimalistisk luksusbar med brand-ikon og logo.
  - **Ingen Tekstbrud på Status-Chips:** Adgangschips ("PRØVEPERIODE: 7D", "PERIODO DI PROVA", "TESTPHASE" osv.) knækkede tidligere over på to kluntede linjer på mobiler. Nu vises et elegant `🛡️ 7d` (eller `🛡️ PRO`) chip på mobile viewports, der aldrig bryder eller klemmer.
  - **Symmetrisk 4-Tabs Navigation:** Rettet ugyldig `xs:` breakpoint i Tailwind v4 til `sm:`, så menulinjen på mobil konsekvent viser knivskarpe, ultra-korte 1-ords labels (`Bar`, `Vægt`, `Logs`, `Udstyr`) uanset sprogets længde (tysk, italiensk, fransk m.fl.).
  - **Struktureret 2-Trins Telemetribar (Quick Context Bar):** Erstattet kaotisk `flex-wrap` (hvor kværnindstilling landede isoleret på sin egen linje) med et ryddeligt instrumentbræt: Øverste række viser kaffebønne + ristedato, mens nederste række er opdelt i 4 symmetriske celler (`FORHOLD`, `DOSIS`, `UDBYTTE`, `KVÆRN`).
  - **Skærm-Klippede Tekster Løst:** Rettet overflødig `truncate` i Scale Monitor, så `0.0g Låst` aldrig afkortes til `0.0g Locke`.

## [1.1.0] - 2026-09-26
### Added & Improved
- **Universal Scale OCR Engine 2.0 (Alle Kaffe- & Køkkenvægte, LED/LCD, Glare Resistance & Side-by-Side):**
  - **Bradley-Roth 2D Adaptiv Binarisering:** $O(1)$ integral-billede tærskling evaluerer lokal kontrast i et dynamisk vindue ($W/14$). Modstår ekstreme modlys-glimt, overhead spots fra køkkenemhætter og kraftige skygger uden at drukne fine 7-segment segmenter.
  - **Zero-Tap Auto-Polaritet (LED & LCD):** Intelligent baggrunds-histogram skelner automatisk mellem lysende LED/OLED displays (hvid, cyan, rød eller blå på mørk baggrund) og klassiske reflekterende LCD displays (mørke tal på lys grå baggrund, fx Soehnle, Taylor, standard køkkenvægte).
  - **Rumlig Token-Klyngedannelse (Spatial Clustering):** Deler detekterede elementer i et rækkebånd op i rumligt sammenhængende tal-blokke. Adskiller og isolerer automatisk side-by-side timere (`0:15`) fra vægten (`18.5g`), som set på Acaia Lunar, Acaia Pearl og Timemore Black Mirror.
  - **Topologisk Fast-Path for Ciffer '1':** Tynde lodrette streger ($W/H < 0.42$) genkendes nu direkte med 100% konfidens uden at fejlkategorisere som '8' ved smalle stregbredder.
  - **3-Frame Temporal Konsensus Filter:** `ScaleReadingFilter` anvender et glidende 3-frame konsensus-buffer, der eliminerer 1-frame optisk damp eller optiske transienter, men låser straks på reelle vægttrin og $0.0g$ tara uden forsinkelse.
  - **Opgraderet Vision Inspector & Display Mode Styring:** Header-chip lader baristaen cykle mellem `Auto (LED/LCD)`, `LED` og `LCD`, mens Vision Inspector live rapporterer detekteret polaritet og layouttype (`Side-by-side (Isolated Timer)`, `Stacked Dual-Row`, `Single Row`).

## [1.0.0] - 2026-09-26
### Added
- **Global i18n Fase 3: Sydeuropas Kaffekultur & Global 1.0 Milepæl (Italien, Frankrig & Spanien):**
  - **Italien (`it` - Italiano) 🇮🇹:** 100% ordbog dedikeret til espressoens fødeland (Milano, Rom, Napoli, Firenze). Autentiske italienske SCA-fagtermer (*Rapporto di estrazione, Dose macinata, Resa in tazza, Grado di macinatura, Pre-infusione, Canalizzazione, Taratura*).
  - **Frankrig (`fr` - Français) 🇫🇷:** 100% ordbog skræddersyet til Frankrigs blomstrende specialty coffee miljø (Paris, Lyon, Bordeaux) (*Ratio d'extraction, Dose de café, Rendement, Finesse de mouture, Pré-infusion, Canalisation, Calibrage*).
  - **Spanien (`es` - Español) 🇪🇸:** 100% ordbog henvendt til Spaniens specialty kaffe-epicentre (Barcelona, Madrid, Valencia) samt det store latinamerikanske marked (*Ratio de extracción, Dosis de café, Rendimiento, Molienda, Pre-infusión, Canalización, Calibración*).
  - **Automatisk Browser-Detektering:** Genkender automatisk `it`, `fr` og `es` ved opstart via `navigator.language`.
  - **11 Globale Verdenssprog:** Sprogvælger i header og settings tilbyder nu 11 landeflag (`🇬🇧 EN`, `🇮🇹 IT`, `🇫🇷 FR`, `🇪🇸 ES`, `🇩🇪 DE`, `🇩🇰 DA`, `🇰🇷 KO`, `🇯🇵 JA`, `🇨🇳 ZH-CN`, `🇹🇼 ZH-TW`, `🇦🇪 AR`).

## [0.9.1] - 2026-09-26
### Fixed & Improved
- **Scale Cam OCR Revolution: Præcisions-aflæsning af Digitale Kaffevægte (Blue LED & Dual-Display):**
  - **Løst Viewfinder Flexbox Layout-Bug:** `<video>` elementet er nu `absolute inset-0 w-full h-full object-cover`. Tidligere blev videoen mast sammen i venstre halvdel (50% bredde) pga. flex container, mens sigtekassen svævede over et tomt sort felt i højre halvdel. Nu dækker kameraet 100% af søgeren, og sigtekassen er perfekt centreret.
  - **Dual-Display Adskillelse (Vægt øverst vs. Timer nederst):** Ny horisontal række-bånd analyse isolerer automatisk vægttallene (f.eks. `39.5` eller `0.3`) fra timertal (`0:00` med kolon `:`). Slut med "Frankenstein-tal", hvor vægt og timer smeltede sammen!
  - **Max-RGB Boost for Blå/Cyan/Hvide LED-segmenter:** Standard Rec.601 luminans undertrykker blå farve (kun 11% vægt). Binariseringen tager nu `Math.max(r, g, b)` i LED-tilstand, så klare blå og cyan LED-segmenter opnår fuld 255 intensitet for fejlfri Otsu-tærskling.
  - **Stramme Bounding Boxes & 7-Segment Slant-Kompensering:** Præcis `minY`/`maxY` afgrænsning pr. ciffer samt vinkeljusterede sonderinger med segment-diskvallifikationer (f.eks. udelukkelse af midterbjælke for '1' og '0') eliminerer falske læsninger.
  - **Live Emerald Green "Digit Lock" Bounding Box:** Viewfinderens sigtekasse skifter dynamisk til solid smaragdgrøn (`#10B981`) med pulserende `[ LOCKED: 39.5g ]` statuschip i det øjeblik, vægtcifrene identificeres med $\ge 70\%$ tillid, så baristaen har 100% visuel kontrol inden brygning.

## [0.9.0] - 2026-09-26
### Added
- **Global i18n Fase 2: Asiatisk Vækst & Golfens Luksusmarked (Kina, Taiwan & Dubai/UAE):**
  - **Kina (`zh-CN` - 简体中文):** 100% komplet ordbog (87 nøgler) tilpasset Kinas gigantiske specialty coffee marked (Shanghai, Beijing, Shenzhen) med SCA terminologi (粉水比, 咖啡粉重, 萃取液重, 研磨度, 预浸泡, 通道效应, 校准).
  - **Taiwan (`zh-TW` - 繁體中文):** 100% komplet ordbog (87 nøgler) skræddersyet til Taiwans verdensberømte barista- og risterimiljø (粉水比, 咖啡粉重, 萃取量, 研磨刻度, 預浸潤, 通道效應).
  - **Dubai & Golfen (`ar` - العربية):** 100% komplet arabisk ordbog (87 nøgler) henvendt til De Forenede Arabiske Emirater og Mellemøstens luksuskaffescene (قهوة مختصة, نسبة الاستخلاص, جرعة البن, محصول الاستخلاص, درجة الطحن, الترطيب المسبق, التدفق القنوي).
  - **Dynamisk RTL (Højre-mod-venstre) Support:** `document.documentElement.dir` skifter automatisk til `rtl`, når arabisk vælges, og tilbage til `ltr` for øvrige sprog.
  - **Opdateret Sprogvælger:** Nu med 8 globale sprog (`🇬🇧 EN`, `🇩🇪 DE`, `🇩🇰 DA`, `🇰🇷 KO`, `🇯🇵 JA`, `🇨🇳 ZH-CN`, `🇹🇼 ZH-TW`, `🇦🇪 AR`).

## [0.8.1] - 2026-09-26
### Added & Improved
- **Dybdegående Fuld-App Lokalisering (Onboarding Wizard, Paywall & Legal Center):**
  - **Onboarding Wizard (`OnboardingWizard.tsx`):** 100% flersproget station-opsætning (Kværnvælger, Maskinevalg, Første kaffebønne, Ristegrader, Skip-knap og Scan Pose) tilkoblet `useTranslation()` på tværs af alle 5 sprog (EN, DA, DE, KO, JA).
  - **PRO Paywall Modal (`PaywallModal.tsx`):** Komplet oversættelse af livstidsadgang ($4.99 / 49,- DKK), 7-dages prøveperiode status, feature-liste, Restore Purchases og sikker in-app betaling.
  - **Legal & Support Center (`LegalModal.tsx` & Footer):** Fuld oversættelse af Privacy Policy (100% lokal on-device OCR uden cloud-streaming garanti), EULA/brugervilkår, samt FAQ og support-kontakt på EN, DA, DE, KO og JA.
  - **Varm Placerings-Vejledning i Viewfinder:** *"Du kan stille og roligt placere telefonen på kaffestationen, på en kop eller mod maskinens drypbakke, så linsen peger mod vægtens display"*.

## [0.8.0] - 2026-09-26
### Added
- **Global i18n Fase 1: Østasien Specialty Epicentre (Sydkorea & Japan):**
  - **Sydkorea (`ko` - 한국어):** Komplet 48-nøgles ordbog skræddersyet til Sydkoreas pulserende specialty kaffemiljø med SCA barista-terminologi (추출 비율, 도징량, 추출량, 분쇄도, 다이얼인).
  - **Japan (`ja` - 日本語):** Komplet 48-nøgles ordbog med respekt for Japans legendariske kissaten- og specialty præcisionskultur (粉量, 抽出量, 挽き目, 比率, ダイヤルイン).
  - **Dynamisk Sprogvælger:** Header dropdown og Settings sprogkort afspejler automatisk alle registrerede sprog dynamisk med landeflag (`🇰🇷 한국어`, `🇯🇵 日本語`).
  - **Automatisk Detektering:** Genkender automatisk koreansk og japansk via `navigator.language` og persisterer i `localStorage`.

## [0.7.2] - 2026-09-26
### Added
- **Intelligent Scale Cam Standby & Manuel "Start Camera" Flow:**
  - Scale Cam starter nu i en rolig, strømbesparende Standby-tilstand i stedet for at starte kameraet øjeblikkeligt ved fane-skift.
  - Viser en flot vejledende standby-skærm, der giver brugeren god tid til at placere telefonen stabilt mod espressomaskinen eller på et stativ rettet mod vægtens display.
  - Prominent `[📷 Start Camera]` knap aktiverer kamera og OCR-måling først når brugeren er klar.
  - `[Stop Cam]` knap i headeren gør det nemt at slukke kamerastrømmen når som helst.

## [0.7.1] - 2026-09-26
### Added & Fixed
- **Shot Reset / Cancel Knap & Auto-Trigger Beskyttelse:**
  - Tilføjet en prominent `[Reset]` knap ved siden af `[Stop & Save Shot]` samt direkte inde i viewfinderens statuslinje.
  - Tillader øjeblikkelig afbrydelse og nulstilling af falske eller utilsigtede skudstarter uden at gemme fejlagtige målinger i logbogen.
  - `isZeroDetected` starter nu som `false`, så kameraet ikke længere starter et skud af sig selv, før en gyldig `0.0g` tare eller et manuelt tryk på `[Tare (0.0g)]` er registreret.

## [0.7.0] - 2026-09-26
### Added
- **Global-First Letvægts i18n Motor (Flersprogethed):**
  - Implementeret ultra-hurtig, typesikker zero-dependency i18n arkitektur i `src/i18n/`.
  - Single Source of Truth på engelsk (`en.ts`) med komplet fail-safe fallback, hvis nøgler mangler i andre sprog.
  - Tilføjet pilot-sprogpakker for **Tysk (Deutsch)** og **Dansk (Dansk)** med fuld bevarelse af universelle specialty coffee termer (Pre-infusion, Channeling, Ratio, Dose, Yield, Dial-in).
  - Sprogvælger integreret i headeren og som dedikeret kort under *Beans & Gear* indstillinger.
  - Automatisk sprogdetektering via enhedens `navigator.language` med lagring i `localStorage`.
  - Projektregler opdateret i `.agents/rules/projektinstrukser.md` til global-first i18n standard.

## [0.6.6] - 2026-09-26
### Improved
- **Intelligent Mellem-Skærm Top-Navigation (Breakpoints til 380px+):**
  - Justeret menulinjens responsive breakpoints med ny `--breakpoint-xs: 380px`.
  - Viser fulde navne (`Coffee Bar`, `Scale Cam`, `Logbook`, `Beans & Gear`) på alle standard og større mobiltelefoner samt tablets, hvor der er plads.
  - Bevarer ultrakompakte etiketter (`Bar`, `Scale`, `Logs`, `Gear`) udelukkende på skærme under 380px for at garantere nul layout-brud.

## [0.6.5] - 2026-09-26
### Added
- **Pose- & Stregkodescanning direkte i Onboarding Wizard (Trin 3):**
  - Tilføjet en markant `[Scan Bag]` knap direkte i velkomstguidens bønnetrin.
  - Åbner kameraet/stregkodescanneren og udfylder automatisk bønnenavn, risteri, risteprofil og ristedato direkte ind i formularen.
  - Førstegangsbrugere kan nu oprette hele deres kaffestation på sekunder ved blot at scanne deres pose.

## [0.6.4] - 2026-09-26
### Added
- **Skip Mulighed i Førstegangs-Onboarding Wizard:**
  - Tilføjet en prominent `[Skip ✕]` knap i øverste højre hjørne af onboarding-vinduet.
  - Tilføjet `[Skip Setup]` knap i navigationen på Trin 1.
  - Brugeren kan nu til enhver tid springe velkomstguiden over og gå direkte til espressostationen med standardindstillingerne intakt.

## [0.6.3] - 2026-09-26
### Added & Fixed
- **100% Mobil-Responsiv Top-Navigation (`grid grid-cols-4`):**
  - Fixet afskæring af knapperne i toppen på mobilskærme (`Coffee Bar` og `Beans & Gear` blev tidligere klippet i kanterne).
  - Skiftet fra horisontalt overflow til et perfekt balanceret 4-kolonne grid (`Bar`, `Scale`, `Logs`, `Gear`), der altid passer 100% på alle mobilskærme fra 320px til 480px uden afskæring.
- **Scale Cam Mobiloptimeret Viewfinder Header & Kontrol-Bar:**
  - Fixet horisontalt overløb hvor `[Live Camera]` knappen blev skåret af i højre side på mobil.
  - Gjort kamera/simulator skifteren super tydelig: `[📷 Live OCR]` vs `[🧪 Start Camera]` med farvekodning.
  - Standardiseret så Scale Cam forsøger at tænde det rigtige kamera automatisk som standard, med elegant fejlhåndtering og fallback til simulatorsæt, hvis kameraet er spærret.
- **Fjernet Tekst-Overlap i Viewfinder (Tare & Target):**
  - `Step 0 Tare: 0.0g` og `Target: 18g in -> 36g out` kolliderede tidligere og overlappede hinanden på små skærme.
  - Samlet i en ren, enkelt bund-statusbjælke i viewfinderen, der aldrig kan kollidere.

## [0.6.2] - 2026-09-26
### Added
- **De'Longhi Dedica EC685 / EC680 Espressomaskine Support:**
  - Integreret De'Longhi Dedica (EC680 / EC685 / EC885) og De'Longhi La Specialista i Onboarding Wizard og Equipment Setup.
  - Automatisk pre-infusion kalibrering: 2.0s puls pre-infusion (svarer præcist til Dedicaens fabriksforvædning inden 15-bars vibrationstrykket topper).
  - Permanent maskin-hukommelse via `saveMachineName()`.
- **Mobiloptimeret Inline Quick Dial-In Tuner på Bønnekort:**
  - Når et bønnekort i Bean Vault er aktivt, folder en superkompakt og taktil justeringssektion sig ud **direkte inde i selve bønnekortet**.
  - **Kværntal med `[-]` og `[+]` mikrotrin (0.5 trin):** Juster kværnens collar direkte dér hvor fingeren er uden at rulle ned.
  - **1-Tap Ristegradsvælger:** Hurtigskift mellem Light, Medium, Med-Dark og Dark med det samme.
  - **Dose & Yield Real-Time Sync:** Finjuster kaffedosis (fx 18g) og målvægt (fx 36g) direkte på kortet.
  - **Assigned Grinder Selector:** Skift hvilken kværn bønnen er tilknyttet med 1 klik.
  - Løser mobil-udfordringen, hvor indstillingerne tidligere lå langt nede under skærmkanten.

## [0.6.1] - 2026-09-26
### Added
- **Per-Bønne Kværn-Tilknytning (Assigned Grinder Per Bean):**
  - **Kværnvælger ved Oprettelse:** "Add Coffee Bean To Vault" formularen har nu en dedikeret *"Assigned Grinder"* dropdown, så du kan parre enhver ny bønne med præcis den kværn, du bruger til den (fx en fladknivskværn til frugtige lysristede bønner og en konisk kværn til espresso blends).
  - **Tydelig Kværn-Indikation i Bean Vault:** Bønnekortene viser nu kværn-brand og indstilling (fx `Eureka: 1.4` eller `Baratza: 15`) i stedet for kun et anonymt tal.
  - **Kværnvælger i Bean & Barcode Vision Scanner:** `BeanScannerModal` tillader nu direkte valg mellem dine registrerede kværne ved scanning af nye poser.
  - **Automatisk Kværn-Skift:** Når du trykker på en bønne i Bean Vault, opdateres den aktive kværnmodel automatisk på hele espressostationen.

## [0.6.0] - 2026-09-26
### Added
- **Bean & Barcode Vision Scanner Modal (`BeanScannerModal.tsx`):**
  - **Live Camera Viewfinder med Laser-Reticle:** Optisk scanning direkte i browseren via telefonens kamera (`facingMode: 'environment'`) med animeret måleramme og scan-linje.
  - **Stregkode-Scanning via Native `BarcodeDetector` Web API:** Registrerer lynhurtigt EAN-13, EAN-8, UPC-A, UPC-E og QR-koder direkte fra kamera-streamet eller uploadet billede.
  - **Open Food Facts Global Database Integration:** Slår automatisk scannede stregkoder op mod Open Food Facts API'et og udfylder lynhurtigt produktnavn, risteri/brand, oprindelse og udleder ristegrad (Light/Medium/Dark).
  - **Offline Kaffebase for Kendte Bønner:** Indbygget lynhurtig offline database med de mest populære bønner (Lavazza Qualità Oro, Illy Classico/Intenso, Peter Larsen Kaffe Rød/Økologisk Espresso, BKI Guld/Espresso, Coffee Collective Kieni/Takesi, Starbucks Espresso/Blonde).
  - **Intelligent Multi-Format Ristedato OCR-Engine:** Optisk genkendelse af ristedatoer på emballage uanset format:
    - Numeriske formater: `DD.MM.YYYY`, `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`, `DD/MM/YY`.
    - Månedsnavne på tværs af 6 sprog (Engelsk, Dansk, Tysk, Fransk, Spansk, Italiensk), fx `14 SEP 2026`, `12 MAJ 2026`, `18 OKT`, `14 September 2026`.
    - **Best Before / BBD Heuristik:** Hvis posen kun har en "Bedst Før" dato (fx Illy/Lavazza), beregner motoren den sandsynlige ristedato (~12 måneder før) med tydelig angivelse.
  - **$CO_2$ Afgasnings- & Friskhedsindikator:** Realtids-vurdering af bønnernes alder i dage fra ristning (Advarsel om uroligt flow ved < 4 dage, *The Golden Window* ved 7–28 dage, og finere kværnanbefaling for ældre bønner).
  - **1-Tap Gem til Bean Vault:** Tilføj direkte til bønne-rotationen med forudindstillede kværn- og ratio-parametre tilpasset den scannede ristegrad.

## [0.5.9] - 2026-09-26
### Added
- **Førstegangs-Onboarding Wizard (3-Step Station Setup):** Ny brugere mødes nu af en elegant 3-trins velkomstguide, der samler hele espressostationen:
  - **Trin 1 -- Vælg Din Kværn:** 22 præ-kalibrerede kværn-profiler fra CremaShop.dk kataloget (Baratza, Eureka, Varia, Niche, DF64, Sage, Fellow, Comandante m.fl.) med automatisk micro-step fysik.
  - **Trin 2 -- Vælg Din Maskine:** 18 populære espressomaskiner (Sage, Rancilio, Lelit, ECM, La Marzocco, Rocket, Gaggia, Flair, Cafelat Robot m.fl.) med mulighed for at skrive en brugerdefineret model.
  - **Trin 3 -- Din Første Bønne:** Indtast navn, risteri, ristningsgrad og ristdato for den kaffebønne du har åben lige nu. Appen sætter automatisk ratio, yield og kværnindstilling baseret på ristningsgraden.
- **Smart Bønne-Anbefaling (Bean Vault Match Engine):**
  - Hver drik viser nu et `Bean Vault Match` kort med en procentuel match-score for den aktive bønne baseret på en matematisk **Roast Compatibility Matrix** (`light/medium/medium-dark/dark` kryds-score) og friskhedsfaktor (dage off roast).
  - Hvis der findes en bedre bønne i din Bean Vault, anbefales den med en direkte `[Switch]` knap, der straks skifter den aktive bønne og opdaterer hele stationen.
- **19 Opskrifter med Rist-Profilmatch (`idealRoastLevels`):**
  - Alle 19 drikke-opskrifter har nu en deklareret `idealRoastLevels` egenskab:
    - **Light roast-drikke:** Modern Lungo, Espresso Tonic, Cafe Allonge.
    - **Medium/Med-Dark-drikke:** Cappuccino, Flat White, Latte, Americano, Cortado, Iced Latte, Shakerato, Piccolo.
    - **Dark roast-drikke:** Ristretto, Macchiato, Affogato, Cafe Bombon, Mocha, Con Panna.
- **Persistent Machine Name:** Maskinnavnet gemmes nu i `localStorage` og huskes mellem sessioner.

## [0.5.8] - 2026-09-26
### Added
- **Kollapsbart Drikke-Bibliotek (Collapsible Drink Library):** Det store katalog med alle 19 specialitetsdrikke og arkitektoniske vektor-kopper er nu som standard elegant sammenfoldet under en ren *"Specialty Drink Library (19 recipes)"* expander. Hovedskærmen viser udelukkende den aktivt valgte drik, dens nøjagtige brygparametre, mælke/vand-guide og kværnhukommelse, så siden er super overskuelig uden endeløs rulning.
- **Per-Drik Kværnhukommelse & Smart Forbedrings-Engine (Grind Memory Engine):**
  - Appen husker nu den nøjagtige kværnindstilling for **hver enkelt drik** parret med den aktive kaffebønne og kværnmodel (`localStorage` nøgle: `${beanId}_${drinkId}`).
  - **Taktil Trin-Justering:** Hurtig-knapper `[-]` og `[+]` (0.5 trin) og direkte input med en taktil `[Lock Setting]` knap for permanent fastlåsning.
  - **Matematisk Flow-Analyse & Proaktiv Barista-Vejledning:** Sammenligner automatisk seneste skud i historikken med drikkens måltid ($\Delta t = t_{\text{actual}} - t_{\text{target}}$) og kværnens specifikation ($s/\text{step}$).
  - **1-Tap Anbefaling:** Ved for hurtigt løb (fx 21s vs 27s mål) anbefales automatisk fx "Grind 2.5 micro-steps FINER" med en direkte `[Apply 0.9]` handlingsknap.
  - **Golden Zone & Kanaliserings-Detektion:** Viser grønt "DIALED IN"-stempel i gyldne flow-zone (1.2–1.6 g/s) og advarer ved kanalisering med råd om WDT-nåle og jævnt tamp fremfor forhastet kværnjustering.
- **Automatisk Kværn-Synkronisering:** Når der skiftes drik på baren, opdateres kværnindstillingen automatisk i Scale Cam og shot-loggen.

## [0.5.7] - 2026-09-26
### Added
- **Single Espresso / Solo (`single-espresso`):** Klassisk italiensk enkelt-shot ekstraktion (9.0g dosis $\rightarrow$ 18.0g yield på ~26s i demitasse) med skræddersyet kværn-vejledning til enkeltkurve (single baskets).
- **Caffè Mocha (`mocha`):** 240ml højglas med ægte 70% mørk chokolade-ganache, dobbeltskud espresso, 140ml silkeblød mælk og kakao-pudret mikroskum.
- **Espresso Con Panna (`con-panna`):** Dobbelt espresso toppet med en generøs krone af kold, fløjlsblød piskefløde i demitasse kop.
- **Iced Caffè Latte (`iced-latte`):** Dobbelt espressoskud floatet over 180ml iskold sødmælk (4°C) og klare isterninger i højt glas.
- **Caffè Shakerato (`shakerato`):** Den italienske sommer-ikon – dobbeltskud rystet kraftigt i cocktailshaker med is og sirup til et tykt, Guinness-lignende gyldent skumlag.
- **Café Allongé (`allonge`):** Moderne nordisk/fransk forlænget specialty ekstraktion (1:3 ratio, 18g $\rightarrow$ 54g) for maksimal frugtsødme og floral klarhed.
- **Piccolo Latte (`piccolo`):** Australsk barista-favorit i 100ml glas – enkelt ristretto (10g $\rightarrow$ 15g) toppet med mikro-tekstureret mælk og latte art.
- **Udvidet Drikke-Bibliotek:** Kataloget rummer nu 19 specialitetsopskrifter med fulde lagdelte arkitektoniske vektor-kopper.

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
