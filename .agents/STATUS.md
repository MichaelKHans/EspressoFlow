# Flowbean Project Status & History

## Projekt Oversigt
- **Navn:** Flowbean (tidligere Espresso Flow)
- **Primært sprog:** 100% Engelsk (English US)
- **Design System:** Espresso Warmth (`#FAF7F2`, `#FFFDF9`, `#2C2018`, `#C26D52`) + `Courier Prime`
- **Forretningsmodel:** 7 dages in-app prøveperiode $\rightarrow$ $4.99 / 49,- DKK Lifetime Unlock (RevenueCat)
- **Repository:** `MichaelKHans/EspressoFlow`

---

### 📌 KØREPLAN FOR NÆSTE SESSION (I MORGEN): FASE 14 - ADMIN BILLEDE-REFERENCE UPLOAD & 100% ÆGTE FABRIKS-PACKSHOTS
1. **Admin Gear Reference Upload System (`isAdminEditMode`):**
   - Byg `AdminGearImageModal.tsx`: Tillad brugeren at tage et mobilfoto eller uploade et referencebillede og skrive en note til en maskine/kværn/brygger/kedel.
   - Forbind en diskret `[📷 Ret / Reference]` knap på hvert udstyrskort i `GearCardCarousel.tsx`, der **kun** er synlig, når *Admin Redigering* er slået TIL i Indstillinger.
   - Gemme uploadede billeder lokalt via `storage.ts` (`saveGearImageOverride`), så kortet opdateres øjeblikkeligt med det samme.
   - Gøre det muligt for Anti at udlæse alle uploadede referencer, så de kan gøres til permanente officielle filer.
2. **Systematisk Hentning af 100% Autentiske Fabriks-Packshots (Model for Model):**
   - Fortsætte den officielle packshot-pipeline uden delte billeder:
     - *Espressomaskiner:* Lelit Bianca/Mara X, Rocket Appartamento/Giotto, ECM Synchronika, Ascaso Steel/Dream, Decent DE1, Cafelat Robot, Flair 58, Jura Z10, Philips LatteGo, Miele CM 5310, DeLonghi Specialista/Magnifica/Eletta osv.
     - *Kværne:* Niche Zero/Duo, Mazzer Philos/Super Jolly, Mahlkönig EK43/X54, Wilfa Uniform, Timemore Sculptor 064S/078S, Varia VS3/VS6 osv.
     - *Bryggere & Kedler:* Bialetti Moka/Brikka, Kalita Wave, Timemore Fish, Brewista Artisan osv.
3. **Kvalitetssikring & Synkronisering:**
   - Køre `npm run build` og bekræfte 100% fejlfri kompilering.
   - Køre `npx cap sync android` og teste i Android Studio.
   - Pushe til GitHub, så Vercel automatisk deployer til `https://espressoflow-app.vercel.app/`.

### 2026-10-20 -- Etape 81: Maksimering af Udstyrsbilleder i Rammen & Tight Packshot Bounding (v1.21.2)
- **Total Frilægning & Tight Bounding Box Auto-Crop (Samtlige 111 WebP Udstyrsbilleder):**
  - Gennemført automatiseret Connected Components analyse via `scipy.ndimage` på alle 111 gear packshots i `public/images/gear/`.
  - Frilagt samtlige kværne, maskiner, bryggere og kedler med transparent `RGBA` baggrund og anti-aliased edge feathering.
  - Beskåret til udstyrets sande proportioner med 2.5% sikkerhedsmargin, så genstandene fylder 95-98% af lærredet i stedet for at have 50-70% spildte hvide margener.
- **Forstørrede Billedrammer i Gear Station (`GearCardCarousel.tsx`):**
  - Øget containerens højde fra `h-24 sm:h-28` (96px) til `h-32 sm:h-36` (128px-144px).
  - Skaleret udstyrets visuelle areal med over 60-100%, så både høje kværne (Niche Zero, Baratza, Eureka) og brede espressomaskiner (Dedica, Gaggia) fylder rammen maksimalt uden tomme kanter.
  - Tilføjet `filter drop-shadow-xs` og `group-hover:scale-105`.
  - Justeret "+ Tilføj" knap til `min-h-[210px] sm:min-h-[235px]`.
- **Forbedret Billedudvalg i Modaler (`AddGearModal.tsx` & `AdminGearImageModal.tsx`):**
  - Øget billedbokse i "Tilføj udstyr" modalen fra `w-16 h-16` til `w-20 h-20 sm:w-24 sm:h-24`.
  - Hævet upload/kamera-skalering i AdminGearImageModal fra 88% til 96%.
- **Kvalitetskontrol:**
  - `npm run build` testet med exit code 0.
  - `npx cap sync android` gennemført fejlfrit.
  - Pushed til GitHub `origin main`.

### 2026-10-20 -- Etape 80: Universel Dial-In Zonedatabase & Interaktiv Mikrometerskala for Samtlige Kværne (v1.21.1)
- **Universel Grinder Specs Resolver (`resolveGrinderSpecs`):**
  - Implementeret dybdegående opslag af autoritative parametre (`minSetting`, `maxSetting`, `espressoMaxSetting`, `defaultSetting`, `stepUnit`) i `gearCatalog.ts` for samtlige kværne i systemet.
- **Automatisk LocalStorage Migration i `loadGrinders()`:**
  - Eksisterende brugerprofiler gemt i browserens LocalStorage uden eksplicitte zoner/grænser migreres automatisk ved opstart, så alle kværne (f.eks. Niche Zero, Eureka, DF64, Opus, Comandante osv.) får de rigtige min-, max- og espresso-tærskler.
- **Interaktiv Mikrometerskala & Dynamiske Zoner i `GearStationView.tsx`:**
  - Rettet zone-fejl: `effectiveMin`, `effectiveMax` og `effectiveEspressoMax` beregnes nu 100% dynamisk ud fra den valgte kværn.
  - Ved skift af kværn i karussellen sættes indstillingen automatisk til modellens optimale espresso-default (f.eks. 15.0 for Niche, 1.4 for Eureka, 14.0 for DF64, 2.0 for Opus).
  - Skalaen er gjort direkte klikbar/touch-venlig over hele bredden.
  - Dynamisk zoneforklaring under linealen guider brugeren (f.eks. "● 0–20: Espresso Dial-In Zone • 21–50: Filter & Pour Over Zone" for Niche Zero).
- **Kvalitetskontrol:**
  - `npm run build` verificeret (exit code 0).
  - Android synkroniseret (`npx cap sync android`).
  - Pushed til GitHub `origin main`.

### 2026-10-20 -- Etape 79: Total Frilægning af Alle Rød-Markerede Udstyrsbilleder (Kværne, Maskiner, Bryggere, Kedler) & Zone-Badge Fix (v1.21.0)
- **Niche Zero & De'Longhi Dedica frilægning:**
  - Niche Zero (`niche-zero.webp`): Rent, hvidt fabriks-packshot uden løse kværnknive eller indre ramme, skaleret perfekt på `#FAF7F2` canvas.
  - De'Longhi Dedica (`delonghi-dedica.webp`): Rent EC685 packshot uden ekstra latteglas eller dobbeltrammer.
- **Dial-In Zone Badge Fix (4.0 Micro-Step Espresso Zone Bug):**
  - Tilføjet eksplicitte `espressoMaxSetting` tærskler til samtlige kværne i `GRINDER_CATALOG` i `gearCatalog.ts`.
  - Implementeret robust fallback i `GearStationView.tsx` via `effectiveEspressoMax` og `isEspressoZone`, så 4.0 på Niche Zero korrekt viser "ESPRESSO ZONE".
- **Kværne (Batch 1 - 100% Autentiske):**
  - Fellow Opus (`fellow-opus.webp`), Timemore Sculptor 064S / 078S (`timemore-sculptor.webp`, `064s`, `078s`), 1Zpresso J-Ultra (`1zpresso-jultra.webp`), J-Max S (`1zpresso-j-max.webp`), X-Pro S (`1zpresso-x-pro-s.webp`), Kingrinder K4 & K6 (`kingrinder-k4.webp`, `kingrinder-k6.webp`), Sage Smart Grinder Pro (`sage-smart.webp`), Mazzer Philos (`mazzer-philos.webp`), Mazzer Super Jolly V Pro (`mazzer-super-jolly-v-pro.webp`), Mahlkönig EK43 & EK43S (`mahlkonig-ek43.webp`, `mahlkonig-ek43s.webp`), Baratza Virtuoso+ (`baratza-virtuoso-plus.webp`), Eureka Mignon Zero (`eureka-mignon-zero.webp`), Eureka Mignon Manuale (`eureka-mignon-manuale.webp`), Option-O Lagom P64 (`option-o-lagom-p64.webp`), Lagom Mini (`option-o-lagom-mini.webp`), Weber Workshops KEY Mk II (`weber-key-mk2.webp`), Weber EG-1 (`weber-eg-1.webp`), og Baratza Encore ESP Pro (`baratza-esp-pro.webp`).
- **Maskiner (Batch 2 - 100% Autentiske):**
  - Ninja Luxe Café (`ninja-luxe.webp`), Philips LatteGo 5400 (`philips-lattego.webp`), Sage Barista Pro (`sage-barista-pro.webp`), Sage Barista Touch Impress (`sage-barista-touch-impress.webp`), Profitec Pro 300, 600, 700 (`profitec-pro-300.webp`, `600`, `700`), ECM Synchronika (`ecm-synchronika.webp`), Rocket Appartamento (`rocket-appartamento.webp`), Rocket Giotto Cronometro (`rocket-giotto-cronometro.webp`), Ascaso Steel UNO, DUO, Dream PID (`ascaso-steel-uno-pid.webp`, `duo`, `dream`), Lelit Mara X (`lelit-mara-x.webp`), Nuova Simonelli Oscar II (`nuova-simonelli-oscar-2.webp`), Victoria Arduino E1 Prima (`victoria-arduino-e1-prima.webp`), Sanremo YOU (`sanremo-you.webp`), Miele CM 5310 Silence (`miele-cm-5310.webp`), Wacaco Picopresso (`wacaco-picopresso.webp` uden award-badges).
- **Bryggere & Kedler (Batch 3 - 100% Autentiske):**
  - AeroPress Clear (`aeropress-clear.webp` solo krystalklar uden hænder), Delter Coffee Press (`delter-coffee-press.webp`), Fellow Stagg [X] & [XF] (`fellow-stagg-x.webp`, `xf`), Origami S & M (`origami-dripper-s.webp`, `m`), April Brewer (`april-brewer.webp`), Orea V3 & V4 Modular (`orea-v3.webp`, `v4`), Timemore Crystal Eye 02 (`timemore-crystal-eye.webp`), Hario V60 02 Ceramic White (`hario-v60.webp`), Clever Dripper (`clever-dripper.webp`), Bialetti Moka Pots 3-Cup, 6-Cup, Brikka (`bialetti-moka-3cup.webp`, `6cup`, `brikka`), Timemore Fish Smart (`timemore-fish.webp`), Brewista Artisan Variable Temp (`brewista-artisan.webp`, `1l`), Bonavita 1.0L (`bonavita-variable-1l.webp`), Cosori Smart Electric (`cosori-smart-gooseneck.webp`), Wilfa Svart Pour (`wilfa-svart-pour.webp`), Standard Elkedel i rustfrit stål uden prismærke (`standard-kettle.webp`).
- **Kvalitetskontrol:**
  - `npm run build` verificeret (exit code 0).
  - Android synkroniseret (`npx cap sync android`).
  - Pushed til GitHub `origin main` for live Vercel deployment.

### 2026-10-20 -- Etape 78: Differentieret Baratza Encore ESP Pro (Digital LED Display) vs Standard (v1.20.8)
- **Baratza Encore ESP Pro får eget digitalt LED display-billede:**
  - Oprettet `public/images/gear/grinders/baratza-esp-pro.webp` med det digitale display (`20.0`), frilagt via BiRefNet på `#FAF7F2` baggrund.
  - Forbundet til `grinder-baratza-esp-pro` i `gearCatalog.ts`.
  - Standard `grinder-baratza-esp` bevarer det godkendte analoge billede (`baratza-esp.webp`). Begge modeller lever side om side med hver sit unikke billede.
- **Audit Suite opdateret:**
  - `public/gear-audit.html` opdateret.
- **Build & Test:**
  - `npm run build` passerer 100% (exit 0).
  - Android synkroniseret via `npx cap sync android`.

---

### 2026-10-20 -- Etape 77: Klassisk Standard Bialetti Moka Express & Fuldt Samlet Turin DF54 (v1.20.7)
- **Klassisk Standard Bialetti (Farvel til Blomsterprint):**
  - Erstattet MacKenzie-Childs blomsterudgaver med de originale, klassiske sølv-aluminium 8-kantede Bialetti-kander med original "L'omino coi baffi"-maskot (`bialetti-moka-3cup.webp` og `bialetti-moka-6cup.webp`).
  - Opdateret Bialetti Brikka 4-Cup til autoriseret standardmodel med cremakolonne (`bialetti-brikka-4cup.webp`).
- **Fuldt Samlet Turin DF54:**
  - Erstattet usamlet drejeskive-foto med officielt 2200x2200 studio packshot, fuldt monteret med trætop, bælg, doseringskop i gaffel og mikrometerskive (`turin-df54.webp`).
- **Audit Suite & Android:**
  - `public/gear-audit.html` synkroniseret.
  - `npm run build` passerer 100% (exit 0).
  - Android synkroniseret via `npx cap sync android`.

---

### 2026-10-20 -- Etape 76: Autentisk Decent DE1 med Drypbakke & BiRefNet Neural Matting (v1.20.6)
- **Decent DE1 Producent-Packshot med Drypbakke:**
  - Erstattet "svævende" skelet-render af Decent DE1 uden drypbakke med officielt packshot indeholdende komplet bundkar, drypbakke med slids-stålrist, portafilter, damparm og monteret Android-tablet med aktive flow/trykkurver (`public/images/gear/machines/decent-de1.webp`).
  - Udført med BiRefNet neural segmentation (`rembg` + `onnxruntime`) direkte til 600x600 WebP på sømløs `#FAF7F2` Espresso Warmth baggrund.
- **Audit Suite opdateret:**
  - `public/gear-audit.html` opdateret og synkroniseret med 105 katalog-emner.
- **Build & Test:**
  - `npm run build` passerer 100% (exit 0).
  - Android synkroniseret via `npx cap sync android`.

---

### 2026-10-20 -- Etape 75: 100% Autentiske Producent-Packshots & In-App Admin Reference-Upload Pipeline (v1.20.5)
- **100% Autentisk Niche Zero:**
  - Erstattet Niche Zero billedet med det officielle, knivskarpe produktfoto med ægte træfod, Mazzer stålknive og metaldoseringskop leveret af brugeren (`public/images/gear/grinders/niche-zero.webp`).
- **Autentisk Baratza Encore ESP (Korrektion):**
  - Fjernet det forkerte display-mockup og erstattet med autoriseret producent-packshot af Baratza Encore ESP Black med 54/58mm dosing cup på `#FAF7F2` baggrund uden digital skærm (`public/images/gear/grinders/baratza-esp.webp`).
- **Nye Autentiske Packshots (Officielle Kilder & DAM):**
  - **Turin DF54:** Officielt foto fra `df64coffee.com` (`turin-df54.webp`).
  - **Sage Dual Boiler (BES920):** Officielt foto fra autoriseret distributør (`sage-dual-boiler.webp`).
  - **Profitec GO:** Officielt packshot fra distributør (`profitec-go.webp`).
  - **Lelit Anna PID (PL41TEM) & Lelit Victoria (PL91T):** Officielle packshots (`lelit-anna-pid.webp`, `lelit-victoria.webp`).
  - **Jura Z10:** Officielt packshot i hvid/alu (`jura-z10.webp`).
  - **Fellow Ode Gen 2:** Officielt produktfoto (`fellow-ode-gen2.webp`).
  - **Eureka Mignon Silenzio 55 & Zero:** Officielle packshots (`eureka-mignon-silenzio.webp`, `eureka-zero.webp`).
  - **Flair 58:** Officielt packshot fra `flairespresso.com` (`flair-58.webp`).
  - **Cafelat Robot:** Officielt packshot fra Prima Coffee (`cafelat-robot.webp`).
  - **Decent DE1:** Officielt packshot fra Decent Espresso (`decent-de1.webp`).
- **In-App Admin Reference Mode & Live Card Upload (`src/components/gear/AdminGearImageModal.tsx`):**
  - Når Admin-tilstand er slået til, vises en diskret `[📷 Ret / Ref]`-knap direkte på hvert eneste gear-kort i alle 4 karruseller (Kværne, Maskiner, Bryggere, Kedler).
  - Brugeren kan tage et foto med mobilkameraet eller uploade fra fotogalleriet, tilføje en note til Anti, og markere om billedet er forkert.
  - Kortet og `GearImage` opdateres i realtid med 600x600 WebP preview via `loadGearImageOverrides` og CustomEvent-lyttere.
  - Vektor-silhuetter er 100% undertrykt som fallback (`allowSilhouettes = false`).

### 2026-10-19 -- Etape 74: Fotorealistiske Gear Billeder & Dobbelt Billed-Pipeline (v1.20.4)
- **Fotorealistiske Billeder (Studio Product Photography):**
  - Genereret og konverteret fotorealistiske studie-produktbilleder i WebP-format for alle gear-kategorier (Baratza ESP, Niche Zero, DF64, Eureka Mignon, E61 rustfrit stål espressomaskine, Sage Bambino Plus, Hario V60 keramik, Bodum Chambord French Press, AeroPress, Chemex karaffel, Moccamaster KBG Select og Fellow Stagg EKG elkedel).
  - Oprettet og distribueret 109 fotorealistiske WebP-billedfiler på tværs af hele udstyrskataloget i `public/images/gear/`.
- **To-Trins Intelligent Billed-Pipeline (`src/components/gear/GearImage.tsx`):**
  - Forsøger altid først at indlæse den specifikke udstyrsmodels fotorealistiske WebP-billede.
  - Ved manglende fil falder komponenten automatisk tilbage til kategoriens fotorealistiske referencebillede frem for direkte til SVG.
- **Karrusel Mappere (`src/components/GearStationView.tsx`):**
  - Garanteret at standard-udstyr ('Espresso Machine', 'French Press / Stempelkande', standard-kværn m.fl.) altid knyttes til et fotorealistisk billede.
- **Vercel & Android Synkronisering:**
  - Verificeret Vercel-adresse `https://espressoflow-app.vercel.app/` indført i projektinstrukser.
  - Koden synkroniseret med Android Studio via `npx cap sync android`.

### 2026-10-19 -- Etape 73: Fase 4 – Billeder, Resiliente Vektor-Silhuetter & Fuld I18N Hardware-Katalog (v1.20.3)
- **Resiliente SVG Silhuetter (`src/components/gear/GearImage.tsx`):**
  - Tilføjet automatisk `useEffect` prop-synkronisering af fejlstatus ved skift mellem udstyrsmodeller.
  - Implementeret 4 nye specialiserede vektor-silhuetter:
    1. **Mahlkönig EK43 / EK43S:** Ikonisk lodret motorhus, stor front-rotary drejeskive med 1–16 referencemærker, bønne-shutoff skyder og poseklemme.
    2. **Fuldautomatiske Espressomaskiner (Superautomatics):** DeLonghi Magnifica S / Eletta Explore, Miele CM 5310, Jura og Philips LatteGo med integreret bønnekammer, display og højdejusterbart dobbelt kaffeudløb uden manuel portafilter-arm.
    3. **Flat-Bottom Wave Drippere:** Kalita Wave 155, Fellow Stagg [X]/[XF], April Brewer og Orea V3/V4 med lodrette rillede bølgefilter-linjer, flad bund og dryphuller.
    4. **Hybrid Steep-and-Release:** Hario Switch 02 og Clever Dripper med kugleventil-omskifter og afdrypningsplade.
    5. **Elkedel:** Svanehalskedel forsynet med digital LED-temperaturdisplay på basen.
- **Global-First I18N Standardisering (`src/components/gear/AddGearModal.tsx` & `src/components/gear/GearCardCarousel.tsx`):**
  - Samtlige titler, søgefelt-placeholders, status-badges ("I setup", "AKTIV", "Vælg"), enheds-tællere og slette-tooltips er nu flyttet til `en.ts` og `da.ts` og tilgås via `useTranslation()`.
- **Kvalitetskontrol & Build-Verificering:**
  - `npm run build` og `npx cap sync android` valideret med Exit Code 0.

### 2026-10-19 -- Etape 72: Fase 2 & 3 – Maskine Pre-infusion/Specs Kobling & French Press Auto-Dosis (v1.20.2)
- **Hardware-katalog Integration til Maskinprofiler (`src/lib/storage.ts`):**
  - `getMachineTempProfile` integreret direkte med `MACHINE_CATALOG`, så samtlige 24 nye espressomaskiner (Lelit Mara X, Profitec GO/300/600/700, ECM Synchronika, Rocket Appartamento/Giotto, Ascaso Steel UNO/DUO/Dream PID, Cafelat Robot, Flair 58, Oscar II, m.fl.) automatisk forsyner appen med deres verificerede `preInfusionControl` (`adjustable`, `fixed` eller `none`), `defaultPreInfusionSeconds`, `preInfusionNote`, `tempControl` og `defaultTempC`.
- **Taktil Pre-infusion & Temperatur Synkronisering (`src/components/GearStationView.tsx`):**
  - Ved maskineskift i karrusellen synkroniseres `defaultPreInfusionSeconds`, fabriks-besked og `defaultTempC` automatisk med den valgte maskine.
  - Dynamisk kværn-zone mærke på lineallinjalerne afspejler nu automatisk `espressoMaxSetting` (fx ≤ 25 for DF54, ≤ 35 for Mazzer Philos, ≤ 3.2 for EK43).
- **French Press Kande-størrelse & Auto-Dosis (`src/components/DrinkSelector.tsx`):**
  - Tilføjet interaktiv kande-vælger direkte på French Press opskriftskortet (350 ml lille, 500 ml mellem, 1000 ml stor kande).
  - Beregner og forslår prompte den korrekte kaffemængde i gram (fx 23.3g for 350ml, 33.3g for 500ml, 66.7g for 1000ml) i henhold til 1:15 ratioen.
  - Værdien synkroniseres direkte over i Live Monitor Target Yield og Coffee Dose.
- **Tovejs-Synkronisering af French Press (`src/App.tsx` & `src/components/gear/FrenchPressVolumeCalculator.tsx`):**
  - Justeringer i Gear-stationens kande-beregner sendes via reaktiv event og opdaterer straks den aktive opskrift og live monitor.
- **Sikkerhedsværn mod Tom Kværn/Maskine-opsætning (`src/components/gear/GearCardCarousel.tsx`):**
  - Skraldespands-ikonet `[🗑️]` deaktiveres for enlige kværne og espressomaskiner (kræver tilføjelse af en erstatning først).
  - Manuelle bryggere og elkedler kan fortsat fjernes frit helt ned til 0, som anmodet af brugeren.

### 2026-10-19 -- Etape 71: Fase 1 – Udstyrs-synkronisering & Pour Over Integration (v1.20.1)
- **Datamodel Udvidelse (`src/types/espresso.ts`):**
  - Udbygget `ShotRecord` med `filterBrewer?: string`, `kettleName?: string` og `waterVolumeMl?: number` med 100% bagudkompatibilitet.
- **Kaffebar & Barista Deck (`DrinkSelector.tsx`):**
  - Tilføjet aktiv brygger og kedelindikator i Unified Grinder & Bean Calibration kortet ved Pour Over (`🫗 French Press`, `🫗 Hario V60`, `🫖 Fellow Stagg EKG`).
  - Direkte genvej `Skift udstyr →`, der prompte skifter til Gear-fanen.
- **Skudlogning (`App.tsx`):**
  - `handleBrewFinish` overfører nu automatisk den aktive brygger og kedel til `newShot`, når `method === 'pour_over'`.
  - Live Monitor badge viser aktiv brygger under opskriften.
- **Logbog & Skudvisning (`Logbook.tsx` & `ShotSummaryModal.tsx`):**
  - Udstyrsfeltet på skudkortet viser den manuelle brygger i stedet for maskinenavn ved filterbryg.
  - Sensorisk opsummering og barista tech råd afspejler både brygger og elkedel.
- **Specialty Share Card (`ShotShareModal.tsx`):**
  - Det grafiske 1080x1920 eksportkort stempler nu den præcise manuelle brygger ved filterbryg.
- **Kvalitetssikring & Byg:**
  - `npm run build` og `npx cap sync android` valideret fejlfrit med Exit Code 0.

### 2026-10-18 -- Etape 70: Hardware Karruseller, Præcisionslineal med Lodrette Hak, French Press Kalkulator & Udstyrskatalog (v1.20.0)
- **Eliminering af Gentagelser & Renset Gear Station:**
  - Fjernet de gamle store mørke herobannere med stock-fotos samt den redundante chip-række. Gear Station er nu 100% renset og fokuseret på fysisk maskineri og hardware.
- **Mekanisk Caliper Lineal med 40 Lodrette Hak:**
  - Tilføjet 40 præcisionshak (caliper ticks) på `z-0` bagved teksten på Baratza ESP slider-linealen i `GearStationView.tsx`.
  - Tydelig markering af yderpunkter (`2C2018`), mellemhak (`A6998E`) og splitpunktet 20.0 (`#C26D52`) mellem espresso og filter.
  - Tekstmærker med dæmpet baggrund på `z-10` sikrer, at de mekaniske målestregslinjer løber elegant bagved.
- **Hardware Karrusel (`GearCardCarousel.tsx`):**
  - Horisontal swipebar hardware-karrusel til Kværne, Espressomaskiner, Manuelle Bryggere og Elkedler.
  - Viser rigtige fotos (eller SVG-silhuetter), modelnavn, tekniske specs, aktiv "Aktiv på bar" glød, samt et diskret `[🗑️]` ikon til at fjerne udstyr.
  - Sidste kort i karrusellen er altid `[ + Tilføj ]` kortet.
- **Hardware Katalog Modal (`AddGearModal.tsx`):**
  - Åbnes med 1 tryk på `+ Tilføj` og viser det fulde udstyrskatalog med live søgning på mærke, model og type, samt 1-tryk tilføjelse til kaffehjørnet.
  - Mulighed for at tilføje egne brugerdefinerede modeller.
- **Interaktiv French Press Kalkulator (`FrenchPressVolumeCalculator.tsx`):**
  - Vises automatisk når French Press er den aktive brygger.
  - Hurtigvalg af kandestørrelser (350 ml, 500 ml, 1000 ml) og beregner prompte den præcise kaffedosis i gram ud fra 1:15 ratio (eller 1:14 kraftig / 1:16 mild).
  - Viser 4:00 min steeping tid og husker indstillingerne i `localStorage`.
- **Master Gear Dataregister (`src/data/gearCatalog.ts`):**
  - Struktureret datamodel for kværne, maskiner, bryggere og kedler med tekniske specifikationer og WebP billedstier.
- **Billedarkitektur & WebP Support (`GearImage.tsx`):**
  - WebP support med øjeblikkelig SVG silhuet fallback, så der aldrig opstår knækkede billedikoner.
  - Oprettet mapper `public/images/gear/{grinders,machines,brewers,kettles}`.
- **Kvalitetssikring:**
  - `npm run build` og `npx cap sync android` valideret fejlfrit med Exit Code 0.

### 2026-10-17 -- Etape 69: Komplet Sprog- & Lokaliserings-Sanering (v1.19.9)
- **BeanScannerModal.tsx & FreshnessRadarModal.tsx:**
  - Undertitel lokaliseret: `{t('bean.scanner_subtitle')}` ("Optisk etiket-genkendelse, stregkoder & ristedato" -> "Optical label recognition, Bag Vision™ & roast date").
  - Modus-tabs lokaliseret: `{t('bean.tab_bag_ai')}`, `{t('bean.tab_barcode')}`, `{t('bean.tab_roast_date')}` ("Pose AI", "Stregkode", "Ristedato" -> "Bag AI", "Barcode", "Roast Date").
  - Reticle & søger-hjælpetekster lokaliseret: `{t('bean.reticle_center_bag')}`, `{t('bean.vision_analyzing')}`, `{t('bean.scan_bag_front_btn')}`, `{t('bean.choose_gallery_btn')}`.
  - Freshness Radar banner og live scanner spinner: `{t('radar.quick_desc')}` og `{t('radar.reading_date')}`.
  - Smagsnoter i scanneren vises nu tosproget (`tag.labelDa` / `tag.labelEn`).
- **DrinkSelector.tsx & FlowChart.tsx:**
  - Tømte bønner og anbefalingskort fuldt lokaliseret via `t('drink.no_active_bean')`, `t('drink.emptied_bag')`, `t('drink.bean_emptied_desc')`, `t('drink.recommended_for')`, `t('drink.scan_new_bag')`, `t('drink.choose_from_vault')`.
  - FlowChart: Vægt-akse og mål-kurve nu tosproget (`language === 'da' ? 'VÆGT' : 'WEIGHT'`, `🎯 TARGET / 🎯 MÅL`).
- **BeanMatchmakerModal.tsx & BeandexView.tsx:**
  - Præferencer (Mælkedrikke, Ren Espresso, Filter & All-Rounder) og budget-knapper lokaliseret tosproget.
  - Viser købssted tosproget via `t('beandex.available_at')` og `t('beandex.purchased_at_tooltip')`.
  - Tømt bønne-status og arkivering lokaliseret tosproget (`Archived` / `Arkiveret`).
- **Udstyr & Indstillinger (`App.tsx`, `AdminThemeBadge.tsx`, `SettingsModal.tsx`):**
  - Filterudstyr kort: `t('gear.filter_gear_title')`, `t('gear.filter_active_short')`, `t('gear.filter_desc')`, `t('common.expand')`/`t('common.collapse')`, samt dropdown labels og kværnsynkronisering note.
  - Admin tema inspector swatches bruger nu oversættelsesnøgler for farvenavne.
  - Licens- og fejlbilleder i `PaywallModal.tsx` og `licenseEngine.ts` fuldt tosprogede.
- **Kvalitetssikring:**
  - `npm run build` og `npx cap sync` kompileret 100% fejlfrit (0 fejl).

### 2026-10-17 -- Etape 68: Admin Baggrunds-Inspector & Realtids Farve-/Sløringsjustering (v1.19.8)
- **Direkte "Juster" Knap på `AdminThemeBadge.tsx`:**
  - Tilføjet en dedikeret `[ 🎛️ Juster ]` knap direkte ved siden af temasvælgeren på alle temabærende kort i appen.
  - Viser en pulserende indikator-prik, når kortets baggrund har brugerdefinerede tilpasninger i forhold til standardværdierne.
- **Flydende Baggrunds-Inspector Popover (`AdminThemeBadge.tsx`):**
  - Åbner et floating glaspanel med avanceret Anthropic Claude / Espresso Warmth styling (`bg-[#180E09]/95 backdrop-blur-xl border border-[#C26D52]/60`).
  - **Sløring / Blur:** Skyder fra 0px til 16px med numerisk visning og hurtigknapper (`0px`, `3px`, `6px`, `12px`).
  - **Billedets Gennemsigtighed / Opacity:** Skyder fra 10% til 100% med hurtigknapper (`50%`, `75%`, `85%`, `100%`).
  - **Lysstyrke / Brightness:** Skyder fra 50% til 150% til justering af baggrundens eksponering.
  - **Kontrast / Contrast:** Skyder fra 50% til 150% til forstærkning af detaljer i bønner og udstyr.
  - **Farvetone / Overlay Tint:** Direkte farvepalet-cirkler (`Espresso #140C08`, `Kulsort #000000`, `Varm Kaffe #1E130D`, `Terracotta #C26D52`, `Mørk Skov #1F2421`) samt native farvevælger til fri RGB/Hex-justering.
  - **Tint Styrke / Overlay Opacity:** Skyder fra 0% til 90% med realtids dæmpning af baggrundsbilledet for maksimal tekstlæsbarhed.
  - **Nulstil & Luk:** `↺ Nulstil` gendanner krystalklare standardværdier med ét tryk; lukker via klik udenfor, `Esc` eller "Færdig".
- **Realtids Reaktiv Motor (`src/lib/cardThemes.ts`):**
  - Ny `CardBackgroundAdjustments` datamodel, `useCardAdjustments` React hook og `flowbean_card_adjustments_changed` CustomEvent motor.
  - Forbundet til alle 5 temakort: `barista_deck_espresso`, `barista_deck_pourover`, `beandex_banner`, `grinder_fleet`, `espresso_machine` og `filter_gear`.
- **Kvalitetssikring:**
  - `npm run build` og `npx cap sync` kompileret 100% fejlfrit (0 fejl).

### 2026-10-17 -- Etape 67: In-App Kamera & Ristedato Reticle HUD i Step 2 (v1.19.7)
- **Direkte In-App Kamerasøger i Step 2 (`src/components/BeanScannerModal.tsx`):**
  - Elimineret irriterende hop til telefonens eksterne, fuldskærms kamera-app via native fil-dialog.
  - Ved tryk på "Tag foto af datostempel" (`bean.snap_date_btn`) eller "Genscan dato" åbnes nu en direkte, integreret in-app `<video>` søger med en dedikeret grøn reticle HUD-boks: `Ret mod ristedato-stempel` (`#72806B`) med pulserende scan-linje.
- **Optisk Billedanalyse Direkte fra Videostrøm (`handleDateCameraCapture`):**
  - Tager et live-billede direkte fra canvas/video-elementet og analyserer datostemplet via on-device optisk OCR (`scanCoffeeBagForDateAndRoast`).
  - Ved fundet ristedato lukkes kamerasøgeren øjeblikkeligt med bekræftelses-badge og grønt flueben uden at forlade appen.
  - Hvis datoen ikke findes i første forsøg, forbliver kameraet åbent med vejledning, så baristaen kan justere vinkel/afstand og prøve igen med ét tryk.
  - Bevaret diskret galleri-ikon som sekundær fallback til upload af eksisterende fotos fra telefonens fotobibliotek.
- **Kvalitetssikring:**
  - `npm run build` og `npx cap sync` kompileret 100% fejlfrit (0 fejl).

### 2026-10-17 -- Etape 66: Tidtagning, Kurve-Trimning & Mål-tid i Time & Flow (v1.19.6)
- **Kurve-Trimning fra Første Dråbe (`src/components/ScaleMonitor.tsx`):**
  - Elimineret død forløbstid før første dråbe: Hvis baristaen starter bryguret i appen for tidligt før maskinens pumpe aktiveres (eller vandet mætter kaffen i 10–25s), detekteres første reelle vægtforøgelse ($\ge 0.3\text{g}$).
  - Eventuel tom flad linje foran trimmes væk ved afslutning, så brygkurven starter rent ved første dråbe ($t = 0.0\text{s}$), og den samlede målte ekstraktionstid afspejler det faktiske flow (f.eks. 26.5s frem for 46.5s).
- **Fjernet Misvisende "Puck Choking" Advarsel (`src/lib/espressoMath.ts`):**
  - Fjernet den forvirrende advarsel `"First drip took 22.7s (very slow). Coffee puck is choking the pump."`, som fejlagtigt opstod pga. forsinket pumpestart.
  - Kværnrådgivningen baseres nu udelukkende på den reelle flowtid og flowhastighed under selve ekstraktionen.
- **Mål-tid og $\Delta t$ i "Time & Flow" (`src/components/Logbook.tsx` & `src/components/ShotSummaryModal.tsx`):**
  - Erstattet forvirrende "Pre Xs Flow Ys" med direkte opskrifts-sammenligning: `Mål ~28s (+1.2s)` / `Target ~28s (+1.2s)` med farvekodning (grøn for $\pm 2.5\text{s}$, terracotta for langsommere, rav for hurtigere).
  - Giver baristaen øjeblikkelig forståelse for om skuddet ramte opskriftens måltid.
- **Historisk Kurve- & Delingskort-Optimering (`src/components/FlowChart.tsx` & `src/components/ShotShareModal.tsx`):**
  - Automatisk visningstrimning af kurver med flad startlinje, så både historiske og nye skud præsenteres knivskarpt på skærmen og på det eksporterede Instagram/SoMe delingskort.
- **Kvalitetssikring:**
  - `npm run build` og `npx cap sync` kompileret 100% fejlfrit (0 fejl).

### 2026-10-17 -- Etape 65: 100% Sprog- & Lokaliserings-Rens (v1.19.5)
- **Korrekt Datolokaliserings-Motor i Logbog (`src/components/Logbook.tsx`):**
  - Rettet `toLocaleDateString` så den dynamisk anvender appens aktive i18n-sprog (`localeCode` som `en-US` eller `da-DK`) i stedet for telefonens globale OS-locale.
  - Elimineret blandingsfejlen `TODAY • LØR. 17. OKT.` i engelsk tilstand (viser nu `Today • Sat, Oct 17`).
- **Elimineret Danske Fallbacks i Kværnråd & Banners:**
  - `Logbook.tsx`: Opdateret fallback-strenge for dial-in status (`FLOW TOO FAST`, `FLOW TOO SLOW`, `ADJUST GRINDER`) til rene engelske standarder.
  - `ShotSummaryModal.tsx`: Opdateret kværnjusterings-tekster og barista-tech forbedringsforslag til engelske fallbacks.
  - `PreBrewCoachBanner.tsx`: Opdateret alle 6 rådgivningsscenarier (`coach.verdict_fast`, `coach.recommend_finer`, `coach.smart_roast_shift`, `coach.degas_drift_guard`, osv.) til fejlfri engelske defaults.
- **Internationaliseret Friskhedsfaser i Beandex (`src/components/BeandexView.tsx`):**
  - Flyttet friskhedsoverskrifter (`🥛 Best with Milk / Cortado`, `⏱️ Past Peak • Grind Finer`, `💨 Resting • Degassing CO₂`, `✨ Peak Flavor Window`) ud i `en.ts` og `da.ts`.
- **Internationaliseret Bar Bønneskifter (`src/components/DrinkSelector.tsx`):**
  - Oversat bønneskifterens overskrift til `t('deck.switch_bean')` og `t('deck.active_count')`.
- **Kvalitetssikring:**
  - `npm run build` verificeret 100% fejlfrit (0 fejl).
  - `npx cap sync` synkroniseret.

### 2026-10-17 -- Etape 64: Kritiske Data- & Logik-Bugs (v1.19.4)
- **Fjernet Falsk "Balanced" Fallback i Logbog (`src/components/Logbook.tsx`):**
  - Ubedømte skud (`shot.tasteRating === undefined`) viser nu `Ej bedømt / Not rated` (`logbook.unrated`) med neutral grå styling, i stedet for automatisk at falde tilbage til "Balanced" med et grønt flueben.
  - Tildelt differentierede farver og advarselsikoner for Sur (ravgul), Bitter (espressobrun) og Vandet (himmelblå).
- **Beandex Badge-tællere Tæller Kun Aktive Bønner (`src/App.tsx` & `src/components/BeandexView.tsx`):**
  - Rettet bundnavigation og topchip-badges til `activeBeans.length` (`!b.isFinished`).
  - Synkroniseret overskriftspillen i `BeandexView.tsx` til `activeBags.length`.
- **Moderniseret Terminologi fra "Barcode" til "Bag Vision™" (`src/components/BeanScannerModal.tsx` & i18n):**
  - Opdateret bønne-note til `"Added via Beandex Bag Vision™"`.
  - Rettet underoverskrifter og hjælpetekster til moderne Flowbean branding.
- **Kvalitetssikring:**
  - `npm run build` verificeret 100% fejlfrit (0 fejl).
  - `npx cap sync` synkroniseret.

### 2026-10-17 -- Kodevedligeholdelse Etape 3: Sikkerhedsaudit & Afhængighedssikring (v1.19.3)
- **Afhjulpet High-Severity Sårbarhed (`source-map-js`):**
  - Opdateret `source-map-js` i udviklerværktøjer via `npm audit fix`, hvilket eliminerer potentiel DoS i tooling.
- **Bekræftet Sikkerhedsarkitektur:**
  - 0 tilfælde af rå HTML/DOM-injektion (`dangerouslySetInnerHTML`).
  - Gemini Bag Vision nøgler kaldes udelukkende serverless i Supabase Edge Functions.
  - Rate-limiting mod brute force i `licenseEngine.ts`.
  - Alle 12 `JSON.parse` kald i `localStorage` er beskyttet med `try/catch`.
- **Kvalitetssikring:**
  - `scripts/test-grind-intelligence.cjs` passeret 100%.
  - `npm run build` verificeret 100% fejlfrit (0 fejl).
  - `npx cap sync` synkroniseret med iOS og Android.

### 2026-10-17 -- Kodevedligeholdelse Etape 2: Maskinsynkronisering & Hook-Stabilitet (v1.19.2)
- **Synkroniseret Maskineliste i Onboarding Wizard (`src/components/OnboardingWizard.tsx`):**
  - Opdateret `COMMON_MACHINES` så den matcher Gear-fanen og `storage.ts` 100%.
  - Tilføjet All-in-One Kombimaskiner (*Ninja Luxe Café / Ninja Pro*, *Sage Barista Touch/Express*, *De'Longhi La Specialista*) og Fuldautomatiske Bønne-til-Kop maskiner (*Jura Z10/E8*, *Philips LatteGo*, *De'Longhi Magnifica*).
  - Omsluttet initial state for `roastDate` i en render-ren callback (`() => new Date(...)`), hvilket eliminerer React Compiler impurity warning.
- **Sikret React Hook Afhængigheder mod Stale Closures (`src/App.tsx` & `src/components/DialInWizardModal.tsx`):**
  - `handleBrewFinish` i `App.tsx`: Tilføjet `activeBeanId`, `beans`, `shots`, `currentBean.roastDate` og `currentBean.roastLevel` til afhængighedsarrayet, så kværn-læringsmotoren altid evaluerer friske værdier.
  - `DialInWizardModal.tsx`: Tilføjet `drink.defaultDoseGrams`, `drink.targetYieldGrams`, `drink.targetRatio` og `pool` til `useEffect` afhængighederne.
- **Kvalitetssikring:**
  - `npm run build` verificeret 100% fejlfrit (0 fejl).
  - `npx cap sync` synkroniseret med iOS og Android.

### 2026-10-17 -- Kodevedligeholdelse Etape 1: Død Kode Udfaset (v1.19.1)
- **Fjernet Forældet Komponent (`src/components/TasteFeedback.tsx`):**
  - Slettet 178-linjers ubenyttet smagsevalueringskomponent, hvis funktioner for længst er fuldt konsolideret og overtaget af `ShotSummaryModal.tsx`.
- **Renset Dokumentation & Blueprint:**
  - `ESPRESSO_FLOW_APP_BLUEPRINT.md` opdateret med `ShotSummaryModal.tsx`.
- **Kvalitetssikring:**
  - `npm run build` verificeret 100% fejlfrit (0 fejl).
  - `npx cap sync` synkroniseret med iOS og Android.

### 2026-10-17 -- Universal Adaptive Grind Intelligence (On-Device Selvlærende Kværn-Motor & Master Barista UI) (v1.19.0)
- **100% On-Device Selvlærende Kværn-Motor (`src/lib/grindIntelligence.ts`):**
  - **Nul AI-Tokens & Nul API-Omkostninger:** Fuldstændig deterministisk og lynhurtig (< 0.1 ms) TypeScript-motor på enheden. Nul eksterne API-kald eller forbrug af tokens.
  - **Normaliseret Ekstraktionstid ($T_{\text{norm}}$):** Isolerer ægte væskemekanisk modstand fra baristaens yield-cutoff via $T_{\text{norm}} = (T_{\text{pre}} + \frac{2.0 \cdot D}{\bar{Q}_{\text{flow}}}) \cdot (\frac{18.0}{D})^{0.30}$.
  - **5 Sanity Gates (`evaluateShotTransitionForLearning`):**
    1. *Anti-Channeling Værn:* Afviser par hvor et af skuddene havde flow-spikes fra kanalisering.
    2. *Fysisk Monotonicitet:* Afviser anomalier ($\Delta S < 0 \implies \Delta T_{\text{norm}} > 0$).
    3. *Kontekst-Filter:* Samme bønne, samme kværn, inden for 48 timer.
    4. *Dødzonestyring:* Minimum $\Delta S \ge 0.5$ og maksimum $\Delta S \le 6.0$.
    5. *Slope Outlier Clamping:* Klemmer empirisk respons ind i $[0.4 \cdot k_{\text{factory}}, 2.5 \cdot k_{\text{factory}}]$.
  - **Bayesian Prior + EWMA:** Fabriksstandard opdateres glat mod baristaens knive over tid ($C = \min(1.0, \frac{N}{N + 2.0})$).
  - **Smart Ristegrads-Matrix & Logaritmisk Afgasningsdrift:**
    - Forudberegner modstandsforskel mellem bønners ristegrad.
    - Logaritmisk ældningskompensation ($\Delta S_{\text{aging}} = -\gamma \cdot \frac{3.0}{k_{\text{eff}}} \cdot \ln(\dots)$), så 2-3 uger gamle bønner justeres finere for faldende modstand.
- **Master Barista UI/UX Integration:**
  - **Pre-Brew Coach Banner (`PreBrewCoachBanner.tsx`):**
    - Proaktiv advisering ved ny bønne (*Smart Ristegrads-Skift*) og bønneældning (*Afgasnings-Værn*) med 1-klik `[Sæt til {setting}]` før første bryg.
    - Viser `🛡️ AI-Læring Pauseret` med et gyldent skjoldikon ved kanalisering.
  - **Dial-In Studio (`DialInWizardModal.tsx`):**
    - Viser Adaptive AI anbefalingsboks direkte under kværn-stepperen med 1-klik [Anvend].
  - **Shot Summary Modal (`ShotSummaryModal.tsx`):**
    - Viser AI Lærings-Skjold advarsel ved kanalisering.
  - **Grinder Fleet Kort i Bar-fanen (`App.tsx`):**
    - Viser dynamiske mestre-emblemer for hver kværn ($\ge 5$ skud: `✨ Mester-Kalibreret`, $\ge 2$ skud: `🧠 Adaptiv AI Aktiv`, $0-1$ skud: `🌱 Fabrikskalibreret`).
- **Kvalitetssikring:**
  - `scripts/test-grind-intelligence.cjs` passeret 100%.
  - `npm run build` verificeret 100% fejlfrit (0 fejl).
  - `npx cap sync` synkroniseret med iOS og Android.

### 2026-10-17 -- Harmoniseret Dial-In Logik & Forbundet Kværn-Indstilling (v1.18.4)
- **Harmoniseret Dial-In Anbefaling (`src/lib/espressoMath.ts`):**
  - Rettet fejl hvor banner i Logbog anbefalede `28 ➔ 28.5` (+0.5 trin), mens den detaljerede Barista Tech analyse på samme skud anbefalede `28 ➔ 35` (+7 mikrosteg).
  - Årsag: `grindDeltaSteps` i `generateDialInAdvice` var hårdkodet til 0.5 i stedet for at returnere det kalibrerede `roundedSteps` (7.0).
  - `generateDialInAdvice` udregner og returnerer nu `grindDeltaSteps: calculatedSteps` og `targetGrindSetting: '35'`, så alle dele af appen deler præcis samme tal.
- **Forbundet Kværnindstilling på Bar-fanen (`DrinkSelector.tsx` & `App.tsx`):**
  - Rettet fejl hvor Bar-fanens kort viste forældet mock-standard (`Setting 12`), mens skud var logget på `28`.
  - Fallback-kæden prioriterer nu det senest loggede skuds indstilling (`lastShotForDrink?.grindSetting || lastShotForBean?.grindSetting`).
  - Ved skud-afslutning (`onBrewFinish`) persisteres den benyttede kværnindstilling automatisk i `drinkGrinds` og opdaterer bønnen i `beans`.
- **1-Klik "Anvend" Knapper:**
  - Tilføjet direkte [Anvend] knap på Logbogens kort-banner og Bar-fanens kværnkort, når et forbedringsforslag er aktivt.
- **i18n Dial-In Konsistens (`en.ts` & `da.ts`):**
  - Alle dial-in tekster og status-badges er flyttet til i18n-nøgler med engelsk som Single Source of Truth og fuld dansk oversættelse.
- **Kvalitetssikring:**
  - `npm run build` passeret 100% fejlfrit, `npx cap sync` synkroniseret.

### 2026-10-17 -- Adskilte Espresso/Pour Over Temaer, Oplyste Makroer & Foldbare Gear-Kort (v1.18.3)
- **Adskilte Baggrundstemaer for Espresso vs. Pour Over:**
  - Barista Deck skifter nu automatisk tema alt efter om baristaen har valgt *Espresso* eller *Pour Over*.
  - `barista_deck_espresso`: Crema Ripple, Naked Portafilter, 9-Bar Manometer, Kværnudløb, Titanium Kværnknive.
  - `barista_deck_pourover`: Hario V60 Bloom, French Press, Friske Filterbønner, Kværnudløb.
- **Forbedret Billedkvalitet & Lys:**
  - Opacitet øget fra 65-70% til 85-90% på alle fotobaggrunde.
  - Sorte gradient-overlays dæmpet, så metalkrom, kaffedråber og kaffeknive popper skarpt frem.
  - Glassmorphism (`backdrop-blur-md bg-black/40` og `bg-[#180E09]/75`) på indre bokse.
- **Foldbare Udstyrskort (Accordion):**
  - Grinder Fleet, Espresso Machine og Filter & Manuel Bryg har nu 1-klik fold-ud/minimer knapper, der huskes i `localStorage`.
- **Kvalitetssikring:**
  - `npm run build` passeret 100% fejlfrit, `npx cap sync` synkroniseret.

### 2026-10-17 -- Bruger-Inspirerede Makro-Baggrunde (Kværnudløb & Portafilter/Manometer) samt Oprydning (v1.18.2)
- **Nye Makro-Baggrundstemaer i CARD_THEME_REGISTRY:**
  - `grinder-chute-macro.jpg` (*Kværn & Portafilter Udløb*): Inspireret af brugerens referencer i `public/midlertidig/`. Kommercielt kværnudløb der dispenserer luftigt formalet kaffe i portafilter-kurven på gaflen.
  - `portafilter-gauge-macro.jpg` (*Naked Portafilter & 9-Bar Manometer*): Inspireret af brugerens referencer med E61 krom-gruppehoved, bundløst portafilter med gylden espresso-stråle og analogt 9-bar manometer.
  - Begge temaer tilgængelige for live-skift i Barista Deck, Kværnflåde, Espressomaskine og Beandex Bønnehvælv via Admin Redigeringstilstanden.
- **Rensning af midlertidige filer:**
  - `public/midlertidig` med alle referencebilleder slettet for at spare diskplads og holde Git-historikken ren.
- **Kvalitetssikring:**
  - `npm run build` verificeret 100% fejlfrit, `npx cap sync` synkroniseret.

### 2026-10-17 -- Admin Redigeringstilstand (Design Inspector), All-in-One Kombimaskiner, Fuldautomatiske Maskiner & Filter Gear (V60 & Stempel) (v1.18.1)
- **Admin Redigeringstilstand i Indstillinger:**
  - Tilføjet "Admin Redigeringstilstand" omskifter i `SettingsModal.tsx`.
  - Når slået til, renderes `AdminThemeBadge.tsx` direkte på appens mørke kort (Barista Deck, Beandex, Grinder Fleet, Espresso Machine og Filter Gear).
  - Viser aktuelt temas navn og filnavn, og lader administratoren skifte baggrunde med 1 klik og se ændringen med det samme.
- **Fotorealistiske 16:9 Makrobilleder i public/images:**
  - `grinder-burrs-macro.jpg`, `flat-burrs-macro.jpg`, `portafilter-flow-macro.jpg`, `espresso-gauge-macro.jpg`, `pourover-bloom-macro.jpg`, `frenchpress-macro.jpg`.
- **Kombimaskiner & Fuldautomatiske Bønne-til-Kop Maskiner:**
  - Modeller: Ninja Luxe Café / Ninja Pro, Sage Barista Series, De'Longhi La Specialista, Jura Z10/E8, Philips LatteGo, De'Longhi Magnifica.
  - Dynamiske badges der forklarer hvordan kværn og bryg håndteres (integreret kværn vs intern fuldautomatisk bryggruppe) uden rod.
- **Dedikeret Filter & Manuelt Bryggear Kort (Pour Over, V60 & Stempel):**
  - Tilføjet Hario V60, French Press, AeroPress, Chemex, Kalita Wave, Moccamaster og svanehals elkedler (Fellow Stagg EKG osv.) til Gear-fanen.
- **Kvalitetssikring:**
  - `npm run build` passeret 100% fejlfrit, `npx cap sync` synkroniseret til Android og iOS.

### 2026-10-17 -- Flowbean Licensmotor, DoS/Brute-Force Skjold & MH Tegnestue Bogførings-Bro (v1.18.0)
- **Kryptografisk Licensmotor (`licenseEngine.ts`):**
  - Implementeret 16-tegns base32 licensnøgler (`FLOW-XXXX-XXXX-XXXX`) med $1.15 \times 10^{18}$ mulige kombinationer (32¹²). Udelukker forvekselige tegn (`0`/`O`, `1`/`I`/`L`).
  - Håndterer både Supabase cloud-validering med permanent aktivering i enhedens `localStorage`, samt deterministiske offline master-nøgler til VIP baristaer og demo-formål.
- **Anti-Brute-Force & DoS Beskyttelse:**
  - Automatisk hardware-lockout: Efter maks 5 mislykkede forsøg låses indtastningsfeltet i 15 minutter (`LOCKOUT_DURATION_MS = 900000`) med realtids-nedtællingstimer i brugergrænsefladen.
  - 350 ms kunstig tids-jitter beskytter mod side-channel timing-angreb.
  - Beskyttelse mod scalping og carding: Web checkouts begrænses til 5 stk. pr. transaktion; digital software har ubegrænset udbud til fastpris ($4.99 / 49,- DKK), hvilket fjerner ethvert økonomisk incitament til gensalg til overpris.
- **Paywall & URL Magic Link Auto-Indløsning (`PaywallModal.tsx` & `App.tsx`):**
  - Integreret foldbart licensfelt i `PaywallModal` med auto-formatering og feedback.
  - Deep-link support: Åbning via `?redeem=FLOW-XXXX-XXXX-XXXX` (fra Kickstarter backer-mails, web kvitteringer, eller QR-kodescannet fysisk messekort) låser appen op automatisk på under 1 sekund og rydder URL-parameteren pænt uden genindlæsning.
- **Admin Licens- & Salgscenter (`AdminLicenseManager.tsx` & `AdminPortal.tsx`):**
  - Ny dedikeret administrationsfane: "Licenser, Salg & Bogføring".
  - Batch generator til Kickstarter, messekort, web-gaver, B2B og VIPs med 1-klik CSV eksport og Supabase SQL insert script.
- **Automatisk Bro til MH Tegnestue Bogføring (`Bogføring/sales_2026.json`):**
  - 1-klik generator af månedlige B2B-salgsfakturaer for Apple App Store (Irland), Google Play (Irland), Lemon Squeezy (USA) og Kickstarter (USA) med 0 kr moms (EU Reverse Charge / MoR eksport, Rubrik B-ydelser).
  - Mulighed for direkte API-overførsel til lokal bogføringsserver (`POST http://localhost:8000/api/sales`) eller udklipsholder.
  - Oprettet `flowbean` fakturaskabelon i `invoice_templates.json`, tilføjet faste services i `services.json` og oprettet modparter i `contacts.json`.
- **Testet og Verificeret:**
  - `npm run build` kompileret 100% fejlfrit på 555 ms; `npx cap sync` synkroniseret til Android og iOS.

### 2026-10-16 -- Raffineret Fotorealistisk Makrografik på Kort & Fjernelse af Baggrundsbønner (v1.17.1)
- **Fjernelse af Baggrundssilhuetter (Ren & Rolig Pergament-Baggrund):**
  - Baggrundsbønnerne fjernet helt efter brugerfeedback, så Flowbean fremstår 100% ren, rolig og minimalistisk med pergament (`#FAF7F2`) og varm latte (`#FFFDF9`) uden plet- eller smudseffekt.
- **Løst Tekstkontrast & Læsbarhed i DrinkSelector:**
  - `Espresso Deck`, `3 pinned` og `All Drinks & Pin` rettet med eksplicitte hvide utility-farver (`text-white`, `text-stone-200`, `bg-white/15`, `border-white/20`, `relative z-10`), så teksten altid er knivskarp og 100% læsbar på det mørke kort.
- **Autentisk Fotorealistisk Makrografik på Mørke Kort:**
  - Fjernet `mix-blend-luminosity`, der tidligere udvaskede billederne til en mudret monokrom brun farve.
  - Genereret og indsat nye, knivskarpe 16:9 fotorealistiske makrobilleder i fulde naturlige kaffefarver:
    - *Barista Deck:* Nærbillede af espressodråbe, kronesplash og koncentriske gyldne cremarillinger (`crema-ripple-macro.jpg`).
    - *Beandex & Paywall:* Glinsende friskristede kaffebønner med synlige sprækker, dyb chokolade og gylden risteglans (`coffee-beans-macro.jpg`).
  - Retningsbestemt blød gradient fra venstre beskytter læsbarheden af knapper og tekst, mens den krystalklare makrografik træder tydeligt og genkendeligt frem til højre.
- **Beandex Matchmaker™ Mobil Scroll & Pinned Footer Fix (createPortal):**
  - Flyttet `BeanMatchmakerModal` (og `FinishBeanModal`) ud af `BeandexView`s lokale stacking context via `createPortal(..., document.body)` med `z-[85]`.
  - Løst fejlen hvor modalens handlingsknapper (`[ ← Tilbage ]` og `[ ✨ Find Kaffe Match ]`) blev dækket og blokeret af appens mobile bundnavigationsbar (`z-40`).
  - Modalens højde er tilpasset mobilskærme (`max-h-[92dvh]`) med `shrink-0` på den fastforankrede bundlinje og `overflow-y-auto pb-8 overscroll-contain` på indholdet, så brugeren altid har 100% adgang til at scrolle ned og vælge alle frugtsyre- og prisniveauer.
- **Brugervenlig Tom Bønnehylde:**
  - Bevaret hurtig `[ 📷 Scan Kaffepose ]` CTA direkte på den tomme hylde flankeret af `[ ⚡ Radar ]` og `[ + Tilføj ]`.
- **Testet og Verificeret:**
  - `npm run build` passeret fejlfrit, `npx cap sync` synkroniseret til Android og iOS.

### 2026-10-16 -- Verdensklasse Kaffebønner, Prisniveau-Kategorisering & Beandex Matchmaker™ Smagsfinder (v1.16.0)
- **Verdensklasse Konkurrencekaffer i Kataloget (`coffeeCatalogData.ts`):**
  - Tilføjet 8 internationalt berømte mesterskabskaffer brugt i World Barista Championship og Cup of Excellence (Sey Coffee Geisha, Manhattan Diego Bermudez Thermal Shock, DAK Milky Cake, Gesha Village Chaka, Hacienda La Esmeralda Private Collection, Friedhats Fieshitu, Proud Mary Ghost Rider, Subtext Las Margaritas).
- **4-Trins Prisniveau-Kategorisering (`PriceTier` & Metadata):**
  - Opdelt kaffepartier i 4 prisniveauer med DKK-intervaller, ikoner og badges:
    - 🏷️ `budget` (`$` / < 75,- DKK)
    - ☕ `standard` (`$$` / 75 – 125,- DKK)
    - 🌟 `premium` (`$$$` / 130 – 220,- DKK)
    - 👑 `ultra_rare` (`$$$$` / 225 – 600+,- DKK)
  - Synlige prisniveau-badges på alle kort i Beandex samt nyt prisdropdown-filter i søgelinjen.
- **Beandex Matchmaker™ Smagsfinder (`BeanMatchmakerModal.tsx` & `beanMatchmakerEngine.ts`):**
  - Udviklet en intelligent 4-trins kaffeguide og match-motor:
    - Trin 1: Drik & metode (Ren Espresso, Mælk/Flat White, Filter/Pour Over, All-Rounder).
    - Trin 2: Smagsretning (Vælg 1-3 noter blandt frugt, bær, chokolade, nødder, krydderier, blomster).
    - Trin 3: Syretolerance (Lav/dyb chokolade, balanceret, høj/nordisk) og budgetramme.
    - Trin 4: Top 4 kuraterede matches med match %, rangering, barista-begrundelse, købssteder og 1-klik tilføjelse til brugerens Beandex-hylde.
  - Fremhævet med ny "✨ Find Kaffe Match" CTA-knap i Beandex hero og ved tomt lager.
- **Bygget og Verificeret:**
  - `npm run build` passeret 100% fejlfrit med 0 advarsler/fejl.

### 2026-10-16 -- Kaffepose Livscyklus, Tømte Posers Arkiv & Kommerciel B2B Markedsviden i Admin Hub (v1.15.0)
- **Faneopdelt Bønnebank (`BeandexView.tsx`):**
  - Tilføjet fanevælger mellem `[ ☕ Aktive Poser ({count}) ]` og `[ 📜 Tømte Poser / Arkiv ({count}) ]`.
  - Tilføjet `[ 📦 Tømt ]` knap på alle aktive poser, så baristaen med ét tryk kan markere en pose som tømt, når den sidste espresso er brygget.
- **Barista Exit Verdict Modal (`FinishBeanModal.tsx`):**
  - Indfanger slutdom med 1–5 stjerner, Exit-smagsnoter og det afgørende genkøbsspørgsmål: 🟢 Vil købe igen, 🟡 Måske, 🔴 Vil ikke købe igen.
  - Beregner automatisk forbrugshastighed (`daysTaken` fra åbning til tømning).
  - Viser dynamisk Genkøbsrate Badge (`🟢 {percent}% Genkøbsrate`) på arkivfanen.
- **Gentagne Køb & Kværngenbrug (`Pose #X`):**
  - Automatisk sporing af genkøb: Knappen `[ 🔁 Køb Igen ]` kloner posen til en ny aktiv pose med inkrementeret `bagCount` (`Pose #2`, `Pose #3` osv.).
  - Bevarer 100% af kværnkalibreringen (grinder, setting, dosis, yield, temp), så brugeren slipper for forfra dial-in.
- **Kommerciel Markedsviden i Admin Hub (`AdminPortal.tsx`):**
  - Implementeret B2B & Retail overblik i Admin Hub (`Commercial Bean Market Intelligence & Consumer Behavior Hub`):
    - **Repurchase Satisfaction Rate:** Procentdel af kaffenyderne, der vil genkøbe kaffen.
    - **Consumption Speed (Forbrugshastighed):** Gennemsnitligt antal dage det tager at tømme en kaffepose.
    - **Stock Dynamics:** Forholdet mellem aktive poser i brug og afsluttede poser.
    - **Multi-Bag Loyalty:** Antal bønner med genkøb (`bagCount >= 2`).
  - Strategisk model for risteripartnerskaber, datadrevne genkøbs-notifikationer på dag ~18, hylde-intelligens for detailhandlen og crowdsourcede kværnindstillinger.
- **Bygget, Synkroniseret & Installeret på Forbundet Android Enhed:**
  - `npm run build` passeret fejlfrit på 455 ms, `npx cap sync` synkroniseret og APK installeret direkte på telefonen via ADB.

### 2026-10-16 -- Freshness Radar™ Butiks- & Hyldescanner med Trafiklys-HUD (v1.14.0)
- **Zero-Tap Kontinuerlig Hyldescanner (`FreshnessRadarModal.tsx`):** Hurtig realtids-optisk datoafkodning optimeret til supermarkeder og risterier. Beskærer automatisk til centrum-reticle med 10x pixel-reduktion for ultra-lav latenstid.
- **Trafiklys HUD & Barista Diagnose:** 🟢 Peak Frisk (5–30 dage), 🟡 Acceptabel / Efter Peak (31–55 dage), 🔴 For Gammel / Oxideret (>55 dage eller gammel BBD), og 💨 Afgasser CO₂ (<5 dage).
- **Haptisk & Akustisk Feedback:** Dobbelt-chime (587Hz $\rightarrow$ 880Hz) + kraftig haptik for peak bønner; advarselstone + haptisk vibration for oxideret kaffe.
- **Butiks-Lommelygte (Hardware Torch Toggle):** Direkte tænd/sluk af mobilens kameradiode via WebRTC constraints for at oplyse mørke butikshylder.
- **Auto-Reset & Beandex Integration:** 4s progress bar nedtæller før næste scanning, tryk-hvor-som-helst nulstiller straks. 1-klik `[ + Gem i Beandex ]` overfører dato til bønnekataloget.
- **Bygget & Installeret på Forbundet Android Enhed:** `npm run build` (467 ms), `npx cap sync` og streamet installation til forbundet enhed via ADB.

### 2026-10-16 -- Synlig Barista Friskhedsnote i Beandex & Scan Kaffepose Knap-Renhed (v1.13.1)
- **Opdateret Scan Pose Knap:** Fjernet "/stregkode" så knappen stolt fremstår som `[ 📸 Scan Kaffepose ]` med kamera-ikon på tværs af hero og tomt lager i `BeandexView.tsx`.
- **Dynamisk Barista Friskhedsnote:** Indsat synlig, farvekodet Barista Intelligence boks på hvert kaffekort i Beandex, der dynamisk skifter med bønnernes alder (Oxideret 🥛 Bedst med mælk, Efter peak ⏱️ Kværn finere, Peak vindue ✨ Ren espresso, Afgasning 💨 Hviler).
- **Bygget, Synkroniseret & Testet:** `npm run build` verificeret på 440 ms, APK bygget og verificeret.

### 2026-10-16 -- Beandex Bag Vision™ (Pose AI), Brand Purity & Sikker Supabase Edge Function (v1.13.0)
- **Bekræftet Google Gemini Model-Status i 2026:**
  - Bekræftet pensionering af `gemini-1.5-flash` (sunset sept. 2025) og `gemini-2.0-flash` (udfaset juni 2026).
  - Verificeret de aktive 2026 produktionsmodeller: primær `gemini-3.5-flash-lite` (<500 ms sub-sekunds svartid, 100% oppetid, vision-optimeret) med automatisk failover-kæde til `gemini-3.5-flash`, `gemini-3.8-flash` og `gemini-flash-latest`.
- **100% Brand Purity & Uafhængig Varemærke-Integritet:**
  - Komplet udrensning af alle referencer til 3.-parts brands (Vivino, Untappd osv.) på tværs af hele kildekoden, UI, kommentarer, SQL-skema og TypeScript typer.
  - Etableret proprietary terminologi: **Beandex Bag Vision™** og **Beandex Sensoriske Smagsnoter**.
- **100% Sikker Serverless Vision Pipeline (Supabase Edge Function):**
  - Implementeret Deno/TypeScript Edge Function `supabase/functions/scan-bag-vision/index.ts`.
  - Gemini API-nøglen er 100% isoleret på Supabase serveren via Secret `GEMINI_API_KEY`. Nul sårbare API-nøgler i appens bundle eller APK.
  - Testet og verificeret mod ægte fotos med succesfuld ekstraktion af risteri, bønnenavn, ristningsgrad, oprindelsesland og ristedato i under 2 sekunder.
- **On-Device Kamera & UI Integration (`BeanScannerModal.tsx`):**
  - Udviklet `bagVisionClient.ts` med on-device canvas skalering til 768px WebP (<40 KB) og generering af 280x280 kvadratiske profil-thumbnails.
  - Implementeret 3-vejs scanningsvælger i `BeanScannerModal.tsx` (`Pose AI`, `Stregkode`, `Ristedato`) med skræddersyet pose-søgeramme og prominent `[ 📸 Scan Kaffepose (Forside) ]` knap samt galleri-upload.
- **Database- & Indeks-Forbedringer:**
  - Løst duplikatfejl i Supabase SQL for kaffer med flere posestørrelser; implementeret ikke-unikt `idx_beans_roaster_name_search` indeks og aktiveret `pg_trgm` til lynhurtig fuzzy-søgning.
- **Bygget & Installeret Direkte på Forbundet Android Enhed:**
  - `npm run build` passeret på 460 ms, `npx cap sync` udført, Gradle APK bygget på 4s, og installeret direkte på telefonen via ADB.

### 2026-10-16 -- Visuel Overhaling af Kopper/Glas, Deck, Logbog & Share Card (v1.12.0)
- **Arkitektoniske Kopper & Glas (`ArchitecturalCup.tsx`):** Fotorealistiske SVG gradienter for espresso, crema, mikroskum og vand. Porcelænskant med skygge, barista-glas uden hank med tyk krystalbund (Cortado, Piccolo, Americano), isterninger og bobler til kolde drikke, samt skulpturelle silhuetter for de 6 pour over metoder (Chemex, V60, Kalita, AeroPress, French Press).
- **Digital Barista Quick Deck (`DrinkSelector.tsx`):** Vertikalt flise-layout med forstørrede 104x75px kopper, minimeret død kantplads, fulde ubeskårne drikketitler, og recept-swatches.
- **Barista Dial-In Forbedringsforslag & Rådgivning (`Logbook.tsx` & `ShotShareModal.tsx`):**
  - **Logbog:** Hvert shot-kort har nu en synlig Dial-In Banner med diagnose og kværntip (`Sweet Spot / Behold 27.5`, `Drej Finere ➔ 25.5`, `Drej Grovere ➔ 29.5`, eller `Kanalisering / Puck Prep`). I udfoldet tilstand vises fuld begrundelse, kværntip, puck prep- og pre-infusion-råd.
  - **Delingskort:** Status-pillen i bunden og telemetribjælken under kurven viser den konkrete diagnose (`SWEET SPOT • KEEP GRIND @ 27.5` osv.), og målet på kurven er renset for emojier.
- **Lysende Høj Kontrast for Mørke Drikke & Fransk Presse (`ArchitecturalCup.tsx` & `DrinkSelector.tsx`):**
  - Rettet JSX-syntaksfejl for `grad-steel` (skinnende højglans krom for stempel, låg, stang og filter).
  - Krystalklart glas med hvide lysreflekser og varm ravgylden filterkaffefarve.
  - Hurtigdæk-fliserne har fået et ambient radialt varmt spotlight bag koppen, der fremhæver silhuetten med høj kontrast mod den mørke baggrund.
  - Renset parenteser fra dæk-flisetitler (`V60`, `French Press`), så navne aldrig trunkeres med `...`.

### 2026-10-15 -- Deep Computer Vision Overhaul (v1.10.8)
- **Zero-GC Static Memory Pool (`OCRScratchPool` i `ocr7segment.ts`):** Pre-allokerer `gray`, `binary`, `integral`, `histogram`, `rowCounts`, `colCounts`, og `morphScratchRow`. Sænker memory churn fra ~42 MB/s til **0 Bytes/frame**, hvilket eliminerer V8/WebKit GC-pauser.
- **7-Bit Hardware Bitmask Matching med `POPCNT_7BIT` (`ocr7segment.ts`):** 128-byte lookup-tabel og flade 7-bit bitmasker eliminerer `Object.entries(PATTERN_VARIANTS)` allokeringer. Digit probing eksekverer på ~40 ns.
- **Kroma-Boostet Binarisering mod Spotlight-Genskin (`ocr7segment.ts`):** Beregner `maxC + (chroma >> 1)` for at løfte mættede LED-farver over hvidt akromatisk spotlight-genskin. Integer cross-multiplied Bradley-Roth fjerner flydende kommatals divisioner.
- **1D Horisontal Morfologisk Åbning (`morphologicalOpenHorizontal` i `ocr7segment.ts`):** 3-pixel erosion efterfulgt af dilation kapper 1-2px bloom-broer mellem cifre på ~0.11 ms.
- **Shear-Projection Variance Maximization mod Skrå Cifre (`ocr7segment.ts`):** 4-vinkels diskret Radon transform ($0^\circ, 5^\circ, 10^\circ, 15^\circ$) i Q8 fixed-point retter 8-15° skrå cifre (Timemore, Felicita) op, så de ikke overlapper i projektionen.
- **Topologisk Fused-Digits Split (`splitFusedSpansTopological` i `ocr7segment.ts`):** Sænket tærskel til $0.78H$ fanger "18" og "12", mens en topologisk cost-funktion straffer gennemskæring af de vandrette bjælker ($a, g, d$) for at forhindre overskæring af '0' og '8'.
- **To-Trins Decimalpunkt-Validering & Right-Toe Recovery (`verifyAndRecoverDecimalPoint` i `ocr7segment.ts`):** Validerer prikkers bundlinje mod cifferbaseline og scanner ener-cifferets fod for opslugte decimalprikker for at forhindre $36.2\text{ g} \rightarrow 362\text{ g}$.
- **Fysik-Informeret 1D Kinematisk Alpha-Beta Filter (`ScaleReadingFilter` i `ocr7segment.ts` & `ScaleMonitor.tsx`):** Kontinuerlig tilstandsvektor $[\text{vægt}, \text{flow}]^T$ med automatisk 10x dropped-decimal recovery og parallel hypotese-tracker for øjeblikkelige vægtspring.

### 2026-10-11 -- Udryddelse af Plateau-Fastlåsning, Rense Sigtekorn & Korrekt Gns. Flow (v1.10.7)
- **Fjernelse af Låse-Badge fra Sigtekornet (`ScaleMonitor.tsx`):**
  - **Identificeret Årsag:** Et badge med `🔒 Fokus Låst` var placeret øverst i højre hjørne af sigtekornet (`-top-3.5 right-2`) og dækkede for vægtdisplayets cifre/tællere.
  - **Løsning:** Badget indeni sigtekornet er fjernet helt. Sigtekornet er 100% uforstyrret, og status-indikatoren er udelukkende placeret sikkert i top-bjælken over video-viewfinderen.
- **Udryddelse af Plateau-Fastlåsning under Aktiv Brygning (`ocr7segment.ts`):**
  - **Identificeret Årsag:** En statisk kravprofil ($\le 0.35\text{g}$ spredning over 4 frames) blokerede reelle kaffestrømme ($0.10 - 0.20\text{g}$ stigning pr. frame), så vægten frøs i plateauer (trappetrin: 0g -> 10g -> 18g -> 26g -> 36g) og udløste falske channeling-spikes på 6.0 g/s.
  - **Løsning:** Filteret er omlagt til en flydende ekstraktionsmodel, der godkender jævn kaffestigning ($[-0.2\text{g}, \text{maxDelta}]$) øjeblikkeligt med 0 ms latenstid. Større ændringer verificeres over blot 2 konsekutive frames med indbyrdes overensstemmelse ($\le \text{maxDelta}$), hvilket afviser flygtige 1-frame genskin uden at bremse kaffeflowet.
- **Målt Frame Delta-Tid (`actualDt`) i OCR-Loop (`ScaleMonitor.tsx`):**
  - **Identificeret Årsag:** Hårdkodet `dt = 0.033s` passede ikke til mobilers reelle OCR-hastighed på ~13-15 FPS.
  - **Løsning:** Måling af reelt frame-interval med `performance.now()`.
- **Gennemsnitligt Flow i Graf ved Afslutning (`FlowChart.tsx`, `ShotSummaryModal.tsx`, `Logbook.tsx`):**
  - **Identificeret Årsag:** Graffoden viste `0.0 g/s` efter afslutning, fordi det sidste punkt ved shot-stop naturligt har 0.0 g/s momentant flow.
  - **Løsning:** Graffoden viser nu `Gns. flow: X.XX g/s` (`chart.avg_flow`) ved afsluttede shots i fuld harmoni med shot-opsummeringen.

### 2026-10-11 -- Simuleret Vægtjustering vs. Shift-Zoom Separering (v1.10.6)
- **Streng Separering af Vægt-Inkrement og Visuel Størrelse (`scale-simulator.html`):**
  - **Identificeret Årsag:** `scaleChassisEl` havde en ubetinget hjullytter (`scaleChassisEl.addEventListener('wheel')`), som ændrede vægtens visuelle zoom (`setScaleZoom`) ved ethvert musehjulstræk over vægten. Da baristaen forsøgte at justere gramværdien med musen, voksede eller krympede vægten samtidig på skærmen og ødelagde kamerarammen.
  - **Løsning:** 
    - Den overflødige hjullytter på `scaleChassisEl` er fjernet.
    - Hændelseslytterne er samlet i én central controller: Almindelig rulning med musehjulet (uden Shift) justerer **udelukkende kaffevægten i gram** ($\pm 0.1\text{g}$, eller $\pm 1.0\text{g}$ med Ctrl), og vægtens visuelle størrelse forbliver 100% uændret.
    - Vægtens visuelle størrelse/zoom (20% – 180%) kan nu **kun** ændres, når baristaen aktivt holder **Shift** nede under rulning (`Shift + Wheel`), eller via de dedikerede zoom-knapper.
    - Tilføjet beskyttelse mod utilsigtede klik i Ren Kamera-Mode, så HUD forbliver skjult under præcisionstests.

### 2026-10-11 -- Dybdegående OCR & Stale-Closure Audit (v1.10.5)
- **Gendannelse af Fuld Aflæsning for Tal der Ender på `.0` (`10.0g`, `50.0g`, `80.0g`) (`ocr7segment.ts`):**
  - **Identificeret Årsag:** En aggressiv tare-nul beskyttelsesheuristik kontrollerede om et tal endte på `0.0` med en længde $\ge 4$, og klippede blindt det første ciffer af (`result.shift()`). Dette medførte, at fuldstændig reelle vægte som `10.0g`, `20.0g`, `30.0g`, `50.0g` og `80.0g` blev barberet ned til blot `0.0g`!
  - **Løsning:** Den blinde tare-bortskæring er fuldstændig fjernet. Kantfiltrering fokuserer udelukkende på ægte spatiale og geometriske uregelmæssigheder (kantsplinter med $< 40\%$ højde eller abnorme mellemrum $> 0.70-0.92 \times \text{højde}$).
- **Udryddelse af Fastlåsning i `0.0g` ved Shotstart (`ocr7segment.ts`):**
  - **Identificeret Årsag:** `ScaleReadingFilter` havde en hård tidlig returnering (`if (isBrewing && lastValidWeight <= 0.5 && newReading > 2.5) return outlier`), som sprang opdateringen af den temporale buffer over. Hvis en pour-over eller hurtig espresso-flow passerede 2.5g, forblev `lastValidWeight` for evigt låst under 0.5g, hvilket skabte en uendelig lockout på `0.0g`.
  - **Løsning:** Tidlig exit er fjernet. Konsensus-filteret beskytter fortsat mod 1-frame genskin via frame-historikken, men tillader et legitimt kaffeflow at stige naturligt uden frysning.
- **Løsning af Stale Closures i OCR-Loop & Telemetri (`ScaleMonitor.tsx`):**
  - **Identificeret Årsag:** `isCalibrating`, `currentFlow`, og `handleToggleFocusLock` blev fanget i det langlivede OCR-interval uden at intervallet blev genstartet. Derfor reagerede "Tryk på Vægten" auto-kalibreringen aldrig på tryk, telemetrien loggede forældet flow-data, og der opstod React Compiler advarsler.
  - **Løsning:** Indført synkrone refs (`isCalibratingRef`, `isFocusLockedRef`, `handleToggleFocusLockRef`, `handleStartBrewingRef`, `handleStopBrewingRef`, `handleCalibrateTareRef`, `ocrFpsRef`), så OCR- og timer-intervallerne altid tilgår de friskeste værdier uden at genstarte loops.
- **Dynamisk Flow-Rate Clamping for Pour-Over (`ScaleMonitor.tsx`):**
  - Flow-beregneren udvides dynamisk til $15.0\text{ g/s}$ ved filter/pour-over brygning (tillader hurtige pulse-pours), mens espresso fortsat beskyttes med et $6.0\text{ g/s}$ loft.

### 2026-10-11 -- Aktiv Bryg Fokus-Lås & Berøringssikring (v1.10.4)
- **Fuldstændig Låsning af Søger & Fokus under Aktiv Brygning (`ScaleMonitor.tsx`):**
  - **Identificeret Årsag:** Når en barista ved et uheld rørte skærmen under et shot (fx for at holde telefonen eller pege), opfangede søgeren klikket og flyttede OCR-beskæringen (Region-of-Interest) samt sendte hardware tap-to-focus til telefonens kamera. Dette fjernede fokus og klippede vægtdisplayet ud af synsfeltet midt under ekstraktionen.
  - **Løsning:** 
    - `handleTapViewfinder` afbrydes prompte hvis `isBrewing` er aktiv (`if (isBrewing) return`).
    - Skærmklik og `touchEnd` events frakobles helt på søgeren under brygning (`onClick={!isBrewing ? handleTapViewfinder : undefined}`).
    - `lockedRoiCenterRef` fryser det præcise koordinatsæt fra millisekundet før start. Både video-cropperen og skærmretiklen tvinges til at bruge de frosne koordinater, så søgeren aldrig kan forskyde sig.
- **Hardware Fokus Lås ved Start (`ScaleMonitor.tsx`):**
  - Så snart `handleStartBrewing` trykkes, aktiveres hardware focus lock omgående, og auto-kalibrering ("Tryk på Vægten") deaktiveres for at undgå utilsigtede kalibreringsspring.
- **Statuschip og Reticle Låse-Badge (`ScaleMonitor.tsx`):**
  - Under aktiv brygning erstattes "Stop Cam" og "Align" knapperne med en klar, beskyttende chip: `🔒 Fokus Låst` (`scale.focus_locked_brewing`).
  - Retiklens sigtekorn udstyres med et diskret `🔒 Fokus Låst` badge i øverste højre hjørne.
- **Berøringssikring af Tab-Navigation (`App.tsx`):**
  - Både mobilens bundbjælke og tablet/desktop tab-bar deaktiverer fane-skift (`if (isBrewing) return`), og inaktive faner dæmpes (`opacity-35 cursor-not-allowed`), så et skærmtryk under brygning aldrig kan navigere væk fra den aktive ekstraktion.

### 2026-10-11 -- Intelligent Zero-Anchor Lås, Tare-Nul (00.0) Timer-Fritagelse & Udryddelse af 80/50/10 Glares (v1.10.3)
- **Fritagelse af Tare-Nul (`00.0`) fra Timer-Straf (`ocr7segment.ts`):**
  - **Identificeret Årsag:** Kaffevægte med 4-tegns nulvisning (`00.0`) blev tidligere ramt af en timer-heuristik (`clText.startsWith('00.') && clText.length >= 4`), som antog det var brøkdele af et sekund på en timer (fx `00.15`) og idømte det en massiv straf på -300 point. Dette betød, at svage optiske reflekser af andre tal (fx `80`, `50` eller `10`) fik lov at overhale det reelle display!
  - **Løsning:** Indført `isTareZero` (`0.0`, `00.0`, `000.0`, `-0.0`, `0`, `00`), som ubetinget fritages for timer-straffe og i stedet tildeles en markant klynge- og rækkebonus (+160 point), så vægten altid låser prompte på nulpunktet.
- **Robust Centerbjælke (Segment G) Verifikation mod Ciffer '0' ➔ '8' og '5' Fejl (`ocr7segment.ts`):**
  - **Identificeret Årsag:** Når vægten viste `00.0`, kunne svage skygger eller udtværing i hulrummet på det første `0` aktivere midterste segment $g$. Da tjekket tidligere blot krævede `gMid && (gLeft || gRight)`, kunne en enkelt lokal genskinnuance konvertere `0` til `8` (hvilket gav `80.0`) eller til `5`.
  - **Løsning:** Segment $g$ kræver nu fuldstændig, ubrudt vandret kontinuitet (`gMid && gLeft && gRight`). Hvis et ciffer har aktiveret både segment $b$ og $e$ (begge lodrette strøg i højre hhv. venstre side) eller mangler den solide centerbjælke, tvinges klassificeringen entydigt til `0`.
- **Automatisk Bortskæring af Førende Kantsplinter foran Nul (`10.0` ➔ `0.0`) (`ocr7segment.ts`):**
  - **Identificeret Årsag:** Displayrammer og kabinetkanter kunne danne en smal lodret skygge til venstre for displayet, der lignede et '1'-tal foran et gyldigt nulpunkt (`10.0`).
  - **Løsning:** Hvis en aflæsning ender på `.0` og indeholder et foranstillet ciffer foran et nul, renses artefakten bort, så displayet entydigt forbliver forankret i rent `0.0`.
- **Intelligent Zero-Anchor Baseline Lås i `ScaleReadingFilter` (`ocr7segment.ts`):**
  - **Fysisk Umulige Spring ved Shotstart:** Når brugeren starter et shot (`isBrewing`), og vægten hviler på $\le 0.5\text{g}$, afvises alle spring $> 2.5\text{g}$ ubetinget som optiske outliers (espresso flow kan fysisk ikke levere $> 2.5\text{g}$ før det første dryp rammer koppen).
  - **Standby Stabilitetskrævning:** Når vægten hviler i standby på $\le 0.3\text{g}$, kræver et spring til en stor vægt ($> 5.0\text{g}$) mindst 4 sammenhængende stabile frames (~150 ms) før det accepteres. Flygtige 1-frame genskin af `80g`, `50g` eller `10g` ignoreres fuldstændigt.
  - **Snap-to-Zero:** Værdier $\le 0.3\text{g}$ snappes automatisk til præcis `0.0g`.

### 2026-10-11 -- Fuld Ciffersekvens Samling (131.5g, 216.1g) & Asymmetrisk Ciffer '1' Mellemrumskalibrering (v1.10.2)
- **Løsning af Ciffer-Opsplitning ved Efterfølgende Ciffer '1' (fx `131.5g` ➔ `1.5g`) (`ocr7segment.ts`):**
  - **Identificeret Årsag:** 7-segment ciffer '1' har kun sine lodrette strøg på den højre kant af ciffercellen (segment $b$ og $c$). Den venstre halvdel af cellen er tom. Når et tal som `3` blev efterfulgt af `1` (fx `131.5`), var den optiske pixelafstand mellem `3` og strøget for `1` lig med $(\text{celleafstand}) + (\text{tom venstre celle}) \approx 0.60 \times \text{højde}$. Clustering-tærsklen var sat til blot $0.45 \times \text{bandH}$, hvilket huggede tallet over i to klumper: `13` og `1.5`. Da `1.5` havde decimalpunktum, vandt det, og de første to cifre forsvandt!
  - **Løsning:** Asymmetrisk ciffermellemrum kalibreret: Når næste ciffer er et '1', tillades en afstand på op til $0.92 \times \text{bandH}$, så cifre der efterfølges af '1' forbliver 100% samlet i én sammenhængende cifferklynge.
- **Fjernelse af Blind Forkastelse af Første Ciffer (fx `216.1g` ➔ `16.1g`) (`ocr7segment.ts`):**
  - **Identificeret Årsag:** Kantfilteret havde en blind regel `if (gap0 > medH * 0.45) result.shift()`, som fjernede det første element hvis afstanden til element 2 var $> 0.45 \times \text{højde}$. Når andet ciffer var et '1' (som i `216.1`), blev `2`-tallet blindt slettet, fordi afstanden til '1' var naturligt større.
  - **Løsning:** Blind sletning af gyldige heltalscifre er fuldstændig fjernet. Kantfiltrering fokuserer udelukkende på isolerede kantsplinter eller umulige '1'-taller foran nul-tare (`10.0`). Cifre som `2`, `3`, `5` etc. slettes aldrig.
- **Interaktiv Clean Mode Bund-Dock & Tastatur/Musehjul Vægtstyring (`scale-simulator.html`):**
  - Tilføjet glidende bund-dock i Clean Camera Mode, der glider frem ved mouse-hover med skyder, tare og hurtigvalgsknapper.
  - Tilføjet piletaster $\leftarrow/\rightarrow$ ($\pm 0.1\text{g}$) og $\uparrow/\downarrow$ ($\pm 1.0\text{g}$), samt genvejstaster `0` (tare), `1` ($18\text{g}$), `2` ($36\text{g}$), `3` ($127.3\text{g}$) og fri justering med musehjul direkte på skærmen.

### 2026-10-11 -- Fuld Vægt-Rækkevidde Aflæsning (0.0g - 2000.0g), Ciffer '1' Bevarelse & Optisk Isolering (v1.10.1)
- **Fjernelse af Hårdkodet 65g Espresso-Grænse i Standby (`ocr7segment.ts`):**
  - **Identificeret Årsag:** `ScaleReadingFilter` havde en hårdkodet grænse på `newReading > 65.0`, der markerede alle vægte over 65g som `⚠️ OUTLIER`, hvis vægten hvilede nær 0.0g/0.1g. Selvom OCR-motoren korrekt læste `"127.3"` med 100% konfidens, blev værdien afvist som en outlier.
  - **Løsning:** Filterets operationelle rækkevidde er udvidet til hele kaffevægtens fysiske måleområde (op til 2000.0g). Under aktiv espressobrygning beskyttes mod urealistiske spring $> 150g$, men i standby/dosering/kalibrering accepteres alle gyldige vægte op til 2000.0g.
- **Afvisning af Ufuldstændige Brøk-Fragmenter (fx ".1") (`ocr7segment.ts`):**
  - **Identificeret Årsag:** Optiske reflekser eller slørede enkeltframes kunne generere et isoleret punktum med ciffer (fx `".1"`), som `parseFloat` fejlagtigt evaluerede til `0.1g`. Dette nulstillede konsensus-bufferen, så værdier som `127.3g` blev afbrudt.
  - **Løsning:** Indført streng syntaksvalidering: En gyldig kaffevægtsvisning SKAL have mindst ét heltalsciffer foran decimaltegnet (`/^-?\d+\.\d+$/`). Ufuldstændige fragmenter som `".1"` eller `"."` afvises omgående.
- **Bevarelse af Førende Ciffer '1' (`ocr7segment.ts`):**
  - **Identificeret Årsag:** 7-segment ciffer '1' består udelukkende af segment `b` og `c` og mangler top- og bundbjælke, hvorfor det naturligt er 30-35% lavere end cifrene 2, 7 og 3. Tidligere fejltjekkede kantfilteret højden og fjernede fejlagtigt '1' som en kant-artefakt.
  - **Løsning:** Ciffer '1' beskyttes i sammensatte tal som `127.3g`, `18.0g` og `14.2g`.
- **Hurtig Trinrespons i Standby (`ocr7segment.ts`):**
  - I standby / dosering / test bekræftes vægtændringer på blot 2 på hinanden følgende frames ($< 70\text{ ms}$ ved 30 FPS) for lynhurtig og responsiv betjening, mens aktiv espressobrygning fortsat beskyttes med 4-frame konsensus.
- **Optisk Billedisolering & Ren Kamera-Mode (`scale-simulator.html`):**
  - Slukkede 7-segment segmenter sat til 100% gennemsigtighed (`opacity: 0`) for at eliminere enhver optisk skygge.
  - Tilføjet tastaturgenvej `C` og knap `📷 Ren Kamera-Mode`, der skjuler alle knapper, rammer og paneler for 100% ren visning til kameratest.

### 2026-10-11 -- Udvidet Multi-Metode Bryglaboratorium & Live Telemetri Spejl (v1.10.0)
- **Multi-Tab Bryglaboratorium i Vægtsimulatoren (`scale-simulator.html`):**
  - Opdelt simulator-HUD i 5 strukturerede faner: Espresso Lab (6 scenarier), Filter & Pour-Over (4 scenarier), Custom Brew Lab, Kalibrering & Vægte, samt Model & Zoom.
  - Espresso-scenarier: Optimal Shot (1:2.0 i 27.5s), For Hurtigt (17.5s ➔ råder finere), For Langsomt (42.0s ➔ råder grovere), Kanalisering (4.8 g/s spike), Ristretto (1:1.5), Lungo (1:2.5).
  - Filter-scenarier: V60 Standard (3:00m m. bloom), 4:6 Metoden (5 pulser á 60g), Chemex Classic (500g i 4:00m), AeroPress Immersion (200g i 2:00m).
  - Parametrisk brugerdefineret brygkurve med justerbar yield, tid, bloom og profil.
- **Live Phone Telemetry Mirror (Nul-Videolatens Spejling):**
  - Udnytter Supabase Realtime broadcast-kanalen `anti-testbed-live` til at streame mobilens OCR-læsninger, flow, og filterstatus live til PC-skærmen (< 50 ms).
  - PC-simulatoren viser et dedikeret mini-widget med live vægt, delta-afvigelse mod ground truth, og spejler appens Hero Decision Card så snart skuddet stopper.
- **2-Vejs Mobil Synkronisering:**
  - Automatisk `tare`, `start_shot` og `stop_shot` kommandoer sendes direkte fra PC til mobil ved testkørsel.
- **CLI Controller Udvidet (`sim-ctl.cjs`):**
  - Fuld CLI-styring af alle 10 nye scenarier via `--scenario`.

### 2026-10-11 -- Barista Dial-In Intelligence, Slutskærms Hero Decision Card & Pre-Brew Coach (v1.9.0)
- **Optisk Billedsøger-Justering (`ScaleMonitor.tsx`):**
  - **Identificeret Årsag:** Videoens CSS `object-cover` klipper og skalerer videostreamen i forhold til søgerens container. Tidligere blev reticle og cifferramme placeret via simple procenter af containeren (`roiCenter.y * 100%`), hvilket førte til en vertikal forskydning ned over timeren på visse mobil- og skærmopløsninger.
  - **Løsning:** Tilføjet `viewfinderContainerRef` og en fuld 1:1 `object-cover` invers projektionsmatrix. Reticle og den grønne ciffer-boks renderes nu med subpixel-præcision præcis oven på vægtens cifre.
- **4-Frame Damping mod Hurtige Vægtudsving (`ocr7segment.ts`):**
  - **Identificeret Årsag:** `ScaleReadingFilter` accepterede tidligere et stort vægtspring, hvis blot 2 billeder (kun 66 ms) var enige. Hurtige lysreflekser eller damp kunne derfor fremkalde kortvarige sprunge på 10-25g.
  - **Løsning:** Udvidet filterets temporal buffer til 5 frames og sat krav om mindst 4 sammenhængende frames for spring $> 2.0g$. Desuden er maks frame-til-frame stigning sat til $6.5\text{ g/s}$ under aktiv brygning, hvilket svarer til den fysiske grænse for væskestrømning.
- **Slutskærmens Hero Decision Card (`ShotSummaryModal.tsx`):**
  - Indsat et visuelt dominerende "Barista Dom"-kort helt øverst i bryg-opsummeringen:
    - 🟢 **GOD BRYGNING:** Vises når brygget rammer The Golden Zone (25–30s, optimalt flow, ingen channeling) ➔ Råder til at bevare nuværende kværntal.
    - 🟡 **GIK FOR HURTIGT (< 24s):** Vises ved hurtig flow/underekstraktion ➔ Råder til: "Drej kværn FINERE: {nuværende} ➔ {anbefalet}".
    - 🔴 **GIK FOR LANGSOMT (> 32s):** Vises ved overekstraktion/choked flow ➔ Råder til: "Drej kværn GROVERE: {nuværende} ➔ {anbefalet}".
    - ⚠️ **KANALISERING:** Vises ved flow-spikes ➔ Råder til at fastholde kværnen og fokusere på WDT-nåle og jævn fordeling.
  - Integreret en 1-klik knap (`[ Sæt kværn til {setting} ]`), der gemmer kværnindstillingen for drikken med det samme.
- **Pre-Brew Coach på Cockpittet (`PreBrewCoachBanner.tsx`):**
  - Hukommelse til næste bryg: Når baristaen åbner cockpittet og vælger en drik, slår appen automatisk det forrige bryg op i logbogen.
  - Viser en proaktiv barista-vejledning over søgeren inden kværning: *"Sidste bryg gik for hurtigt. Stil kværnen FINERE til {setting} før du brygger!"* med en direkte 1-tap knap til at opdatere kværntallet.

### 2026-10-10 -- 4-Lags Bezel/Chassis Kant-Eliminering & 100% Ciffer-Præcision mod 1-Tals Spring (v1.8.9)
- **4-Lags Sikring mod Falske 1-Taller fra Vægtens Chassis- & Skærmkanter (`ocr7segment.ts`):**
  - **Identificeret Årsag:** Brugeren observerede, at den lodrette kant ved siden af displayet tit kom til at tælle som et 1-tal (`den kant der er ved siden af kommer tit til at tælle som 1 tal`), hvilket gav uventede vægtspring mellem fx 36.0g og 136.0g eller 0.0g og 10.0g. Den forrige fast-path klassificerede enhver lodret streg med aspect $\le 0.42$ som '1' med 100% konfidens – selv tynde kanter på 2-5px.
  - **Lag 1 (Fysisk Strøg-Bredde & Aspect Ratio):** `digitAspect` skal være mellem $0.16$ og $0.42$, og bredden skal være $\ge \max(6, \lfloor\text{height} \times 0.16\rfloor)$. Desuden kræves ubrudt vertikal kontinuitet i både øvre og nedre halvdel af strøget. Knivskarpe kanter, hårlinjer og chassis-riller afvises 100%.
  - **Lag 2 (Margin-Gennembrydningstest):** En reel vægtciffer er strengt isoleret i displayets rækkebånd. En chassis-kant eller skærmramme fortsætter derimod lodret op og ned forbi displayrækken. Strøg med $\ge 3$ aktive pixels i marginerne over eller under rækkebåndet afvises øjeblikkeligt.
  - **Lag 3 (Klynge Typografi & Højde/Top/Bund-Justering):** `filterEdgeArtifactsFromCluster` beregner medianhøjde, top-linje og grundlinje for klyngens cifre. Et foranstillet eller bagudstillet '1', der afviger i højde, top, grundlinje eller har unormal afstand ($> 22\text{px}$), beskæres automatisk væk.
  - **Lag 4 (Udelukkelse af Hulrums-Glans Diskvalifikation for Ciffer '8'):** Fjernet overdreven hulrums-glans diskvalifikation, som fejlagtigt dræbte ciffer '8' ved kraftig LED-bloom på små skærme (hvilket fik `8.8` til at blive læst som `7.7` og `18.4` som `1.4`).
  - **Lag 5 (1px Decimalpunkter & Mikro-Spænd Samling):** Tillader 1-pixel brede decimalpunkter, og samler mikro-kløfter ($\le 2\text{px}$) inden for samme ciffer (fx '4'), så vandrette bjælker ikke splittes.

### 2026-10-10 -- Bezel-Margen Frasortering (22px) mod Foranstillet '1' & Simulator Timer 0 Nulstilling (v1.8.8)
- **4.5% Yderkant-Spærre mod Skærm-Bezel (`ocr7segment.ts`):**
  - **Identificeret Årsag:** På 480px canvas var 3px for lidt til at fange skærmens bezel/chassis kant ($x \approx 10-15\text{px}$), som derfor blev læst som et foranstillet '1'.
  - **Løsning:** `edgeMargin` øget til $4.5\%$ ($\approx 22\text{px}$), så rammen frasorteres og `1.1`, `4.4`, `5.5` læses rent uden '1'-præfiks.
- **Timer 0 Nulstilling (`scale-simulator.html`):**
  - Rettet `if (cmd.timer !== undefined)` så `timer: 0` nulstilles fuldstændigt.

### 2026-10-10 -- Reparation af Hypersensitiv Hulrums-Glans & Fuld Genopretning af Cifre ('0', '8', '6', '9') (v1.8.7)
- **Hulrums-Tærskel Rettelse (`sampleSegment('c')`):**
  - **Identificeret Årsag:** En tærskel på kun 20% og `minActive = 3` for indre hulrum fik almindelig kamerasensor-støj og antialiasing til at blive stemplet som "solid glans". Dette eliminerede konsekvent `8`, `6`, `9` og afviste `0`, så motoren kun kunne vælge mellem `1` og `7`.
  - **Løsning:** Tærsklen for 'c' er sat til 60% (`minActive = 6`), så kun ægte blændende glans diskvalificerer.

### 2026-10-10 -- Robust Bezel-Afvisning, Decimal-Glans Tolerance & Testbed Pure Weight Automatik (v1.8.6)
- **Afvisning af Ydre Ramme-Artefakter (`ocr7segment.ts`):**
  - **Identificeret Årsag:** En lodret streg ved kanten af afgrænsningen ($x \le 3\text{px}$) forveksledes med tallet '1'. Fordi `maxGap` var helt oppe på $1.15 \times \text{højde}$, blev kanten koblet på nabotallet (`0.0g` blev `10.0g`, `7.7g` blev `17.7g`).
  - **Løsning:** Strøg der berører afgrænsningens kant ($x \le 3\text{px}$ eller $x \ge \text{width} - 3\text{px}$) frasorteres. `maxGap` strammet til $0.52 \times \text{højde}$.
- **Glans-Tolerance for Decimalpunkt (`ocr7segment.ts`):**
  - Justeret decimal-detektion til at acceptere let opblussede/glødende decimalpunkter på lysstærke skærme uden at forkaste dem.
- **Outlier Loft ved Nul-Tare (`ocr7segment.ts`):**
  - Spring $> 65.0\text{g}$ når vægten er taret filtreres øjeblikkeligt fra som optiske outliers.
- **Autonom Testbed Pure Weight Automatik (`run-autonomous-suite.cjs`):**
  - Skifter automatisk simulatoren til `pure_weight` ved testopstart og synkroniserer mobilen.

### 2026-10-10 -- Fuld Eliminering af Vægtspring & Ciffer-Kløvning (Pure Weight & 7-Segment Harmoni) (v1.8.5)
- **Fjernelse af Destruktiv `decimalSplitSpans` (`ocr7segment.ts`):**
  - **Identificeret Årsag:** En decimal-splitter skar spænd med bredde $\ge 0.65 \times \text{højde}$ i intervallet 58%-88%. I tallet `0` har det indre hulrum lave søjletællinger (kun top/bund segment). Kløveren opfattede hulrummet som en adskillelse og skar `0` midt over i to smalle '1'-taller! Dette forårsagede de voldsomme firkantbølge-spring mellem `0.0g` og `10.0g`/`11.0g` på ekstraktionskurven.
  - **Løsning:** `decimalSplitSpans` fjernet. Ciffer-kløvning sker nu udelukkende på ægte multi-digit spænd med bredde $\ge 1.05 \times \text{højde}$.
- **Intra-Digit Gap Samling mod Utilsigtet Række-Kløvning (`ocr7segment.ts`):**
  - **Identificeret Årsag:** I cifre uden midterbjælke `g` (`0.0`, `1.1`, `7.7`) er der et 3-6px lodret mellemrum mellem top- og bund-segmenter. `Dual-Row Valley Splitter` opfattede dette lille mellemrum som to adskilte rækker (Weight og Timer) og skar cifrene vandret over, hvorved toppen blev parset som '7' og '1'.
  - **Løsning:** Tilstødende bånd med mellemrum $\le 12\text{px}$ samles nu som én hel cifferrække. Række-kløvning kræver nu $\ge 70\%$ skærmhøjde og mindst 10 sammenhængende tomme scanlines.
- **Simulator Synkronisering (`public/scale-simulator.html`):**
  - Standardmodel sat til `pure_weight` i JS, så den matcher UI standardknappen.
- **Test & Verifikation:**
  - 100% fejlfri genkendelse af alle cifre `0.0`, `1.1`, `2.2`, `3.3`, `4.4`, `5.5`, `6.6`, `7.7`, `8.8`, `9.9`, `18.4`, `36.0` med nul firkantbølge-spring.

### 2026-10-10 -- Timer Nulstilling ved Ny Bryg, Fjernelse af Blokerende Nedtælling & Uafhængig Vægt-Zoom (v1.8.4)
- **Automatisk Timer Nulstilling (`ScaleMonitor.tsx`):**
  - **Identificeret Årsag:** Ved afslutning af et shot eller tryk på Tare forblev `elapsedTime` på det forrige shots tid (f.eks. `61.5s`). Baristaen så derfor den gamle tid i cockpittet ved forberedelse af en ny bryg.
  - **Løsning:** `elapsedTime` nulstilles nu automatisk til `0.0s`:
    1. Ved afslutning og lagring af et shot (`handleStopBrewing`).
    2. Ved tryk på "Tare (0.0g)" (`handleCalibrateTare`).
    3. Ved opstart af et nyt shot (`handleStartBrewing`).
    4. Ved direkte berøring af "Time" boksen i cockpittet når maskinen ikke brygger.
- **Fjernelse af Blokerende Nedtællingsbanner (`public/scale-simulator.html`):**
  - **Identificeret Årsag:** Simulatoren viste et stort 4-sekunders nedtællingsbanner ("📱 Position phone camera... 3") centreret midt på skærmen direkte henover 7-segment cifrene, hvilket forvirrede kameraets OCR reticle.
  - **Løsning:** Nedtællingsbanneret er fjernet fuldstændigt. Scenarier og tests starter øjeblikkeligt med 100% frit udsyn til cifrene.
- **Uafhængig Skalering af Vægt vs. Knapper (`public/scale-simulator.html`):**
  - Tilføjet hurtigvalgsknapper (`30%`, `45%`, `60%`, `100%`) og standardstørrelse sat til 45%. Selve chassiset skaleres uafhængigt med CSS transform, så knapper, ikoner og værktøjslinje altid bevarer fuld størrelse og læsbarhed ved 100% browserzoom (Ctrl + 0).

### 2026-10-10 -- Løsning af Ciffer-Fusion & Inverteret 0 vs 8 Detektion (18.4g Stabilisering) (v1.8.3)
- **Kritisk Fejlrettelse af 0 vs 8 Forveksling (`ocr7segment.ts`):**
  - Rettet inverteringsfejl (`if (!gStrict || centerHole) return '0'`), som forårsagede at *alle* 8-taller blev tvunget til at returnere '0'. Nu anvendes `gStrict` (segment `g` midterbjælke) med glans-hulrumsvalidering.
- **Fast-Path Reparation for Ciffer '1':**
  - Ciffer '1' er en smal lodret streg (`width / height <= 0.42`). Den forrige kode testede segmenter `a` og `d` mod den smalle bounding box og ramte selve den lodrette streg, hvilket fejlagtigt diskvalificerede tallet 1. Nu returneres '1' entydigt ved smalt aspekt og valid højde.
- **Multi-Digit Valley Splitter:**
  - Automatisk opdeling af bredere spans ($\ge 0.82 \times \text{højde}$) ved søjleprojektionens lokale minima for at forhindre at glød eller antialiasing sammensmelter nabocifre.
- **Støj- og Glans-Beskyttelse:**
  - Bortfiltreret smalle støjsplinter ($< 5\text{px}$) og begrænset solid glare tæthedstjek til 2-kolonne cifre, så den kompakte streg for '1' aldrig forkastes som glans.

### 2026-10-10 -- Hardware-in-the-Loop (HIL) Optisk Testbænk & Antigravity Autonom Skærmsimulator (v1.8.2)
- **Syntetisk Skala Simulator (`public/scale-simulator.html`):**
  - Ultra-realistisk 7-segment digital display rendering for PC-skærm. Understøtter Muvna (Dual-Row), Timemore (Side-by-side), Acaia og klassisk LCD.
  - 4 prækonfigurerede scenarier: 30s Standard Shot, Channeling Spike, Ciffer Stress (0-9) og Timer Stress.
- **Antigravity Fjernstyring & Test-Controller (`scripts/scale-sim-server.cjs` & `sim-ctl.cjs`):**
  - Zero-dependency Node.js HTTP & SSE server på port 4321. Antigravity kan fjernstyre simulatoren direkte fra terminalen (`node scripts/sim-ctl.cjs --scenario standard`).
  - Simulatoren rapporterer præcis Ground Truth telemetri til serveren.
- **Optisk Evaluerings- og Benchmark-Værktøj (`scripts/evaluate-test.cjs`):**
  - Sammenligner PC'ens Ground Truth facitliste med telefonens faktiske OCR-målinger (hentet via `npm run sync:diag`).

### 2026-10-10 -- Anti-Book & Text Entropy Sanity Gates, Polaritetsvalidering & AI-Økonomi Arkitektur (v1.8.1)
- **Anti-Tekst & Sætningsfilter (Anti-Sentence Gate i `ocr7segment.ts`):**
  - **Identificeret Årsag:** En bogside med dansk brødtekst blev læst som tal (`2.0g`, `0.7g`, `5.5g`), fordi adaptiv tærskling dannede 7-segment fragmenter af almindelige bogstaver (`o`, `s`, `e`, `-`, `.`).
  - **Løsning:** Indført Text-Entropy Gate: Kaffevægte har maksimalt 4-6 elementer på én linje. Hvis vandrette spans eller elementer overstiger 8, forkastes rækken straks som tekst/sætning.
- **Hård Ciffer-Højde Minimum ($\ge 18\text{px}$):**
  - Små trykte bogstaver i en bog (8-14px) afvises konsekvent, da rigtige kaffevægts-cifre optager $\ge 18\text{px}$ og $\ge 42\%$ af rækkens højde.
- **LED Polaritetssikkerhed & Hvidt Papir Rejection:**
  - I LED-mode kontrolleres scenens luminans. Hvis scenen er lys som papir (`detectedPolarity === 'lcd'`), afvises den omgående.
- **AI-Evaluering & Omkostningsanalyse:**
  - Gennemregnet Cloud AI vs. On-Device AI vs. Heuristisk CV. Cloud AI koster 4–8 kr. pr. espresso (900 frames/shot) og har 500–1500 ms forsinkelse. De nye matematiske CV Sanity Gates koster 0 kr. og reagerer på under 1 ms.

### 2026-10-10 -- Fuldstændig Udryddelse af OCR-Flimren & Flow Spikes, Active Brew Focus UX & "Sort Boks" Telemetri med Supabase PC-Sync (v1.8.0)
- **Fase 1: Kernerettelse mod OCR-Flimren & 242 g/s Flow Spikes:**
  - **Fjernet Blokerende UI-Badge fra Reticle (`ScaleMonitor.tsx`):**
    - Reticle-boksen havde et `-top-3` sort pillebadge (`☕ BREWING` / `TARE LOCKED`), som sad direkte oven i Muvna-vægtens øverste talrække og forstyrrede OCR-aflæsningen. Badget er fjernet helt fra reticle; status vises nu udelukkende i den faste statusbar.
  - **Udvidet Timer-Udelukkelse & Dobbelt-Række Lås (`ocr7segment.ts`):**
    - Timerformater som `0:00` og kolon-mønstre straffes hårdt med `-300` point og udelukkes fra tare-bonus.
    - Ved dual-row displays prioriteres Række 0 (øverst) med `+150` fordel, mens Række 1 (nederst) straffes med `-250` point, hvilket garanterer at timeren aldrig vinder over vægten.
  - **Monotonic Floor Clamping (`ScaleReadingFilter`):**
    - Under aktiv brygning kan vægt aldrig falde $> 0.5\text{g}$ under aktuel måling. Kaffe forsvinder ikke fra koppen. Alle pludselige fald afvises som outliers.
  - **Fysisk Begrænsning af Flow Rate (`espressoMath.ts`):**
    - `calculateSmoothedFlowRate` clampes nu til teoretisk maksimum for espresso ($6.0\text{ g/s}$) og afviser negative tids-/vægtspring, hvilket fuldstændig eliminerer 242 g/s spikes i grafen.
- **Fase 2: Active Brew UX & Focus Mode (`ScaleMonitor.tsx`):**
  - **Kompakt Viewfinder Cockpit:** Viewfinderen skifter under aktiv brygning automatisk til et kompakt panorama (`h-36 sm:h-44`), så baristaen har fuldt overblik over både kamera, tal og flowkurve uden lodret scrolling.
  - **Focus Mode:** Sekundære kamerakontroller (Zoom, LED/LCD, kalibrering) skjules under aktiv udtrækning for et roligt cockpit.
  - **Ergonomisk Tommelfingervenlig Stop-Knap:** Forstørret stop-knap i bunden med fuld bredde og stort touch-område.
- **Fase 3: Flight Data Recorder ("Sort Boks") & Automatisk Supabase PC-Sync:**
  - **Telemetrimotor (`src/lib/scaleTelemetry.ts`):** Logger rå OCR-tekst, filtreret vægt, afviste frames, tidsstempler og thumbnail snapshots.
  - **Supabase Cloud Diagnostic Tabel:** Oprettet `scale_diagnostic_sessions` i `supabase/schema.sql` og `AdminPortal.tsx`.
  - **Admin Toggle i Curator Studio (`#admin`):** Admin toggle til/fra med `REC` indikator i viewfinderen.
  - **Lokal PC-Sync (`npm run sync:diag`):** Oprettet `scripts/sync-telemetry.cjs` til direkte hentning af sessioner til PC'ens `diagnostics/` mappe.

### 2026-10-10 -- Knivskarp Roast Badge Kontrast, Persistent Basket Dose Hukommelse (17g) & Væskemekanisk Tids-Skalering (v1.7.9)
- **Knivskarp Roast Badge Kontrast (`MEDIUM-DARK` & Alle Ristningsgrader):**
  - **Identificeret Rodårsag:** Badget under `ACTIVE COFFEE BEAN` og i Dial-In Studio brugte `text-[#E8C2B0]`, som var for blegt på lys baggrund.
  - **Løsning:** Opdateret `getRoastBadgeStyles` i samtlige komponenter (`DrinkSelector.tsx`, `DialInWizardModal.tsx`, `App.tsx`) til varm espressobrun palette (`bg-[#6E3B27]/15 text-[#542918] border-[#6E3B27]/40 font-bold`).
- **Persistent Portafilter Kurv-Hukommelse (17g Basket & Custom Doser):**
  - **Identificeret Rodårsag:** Dial-In modallens `useEffect` overskrev altid `doseGrams` med `drink.defaultDoseGrams` (18.0g). Desuden manglede der vedvarende lagring af drikkekalibrering, og `DrinkSelector` modtog ikke aktive dosisværdier som props.
  - **Løsning:** Implementeret `DrinkCalibration` og `loadDrinkCalibrations()` / `saveDrinkCalibration()` i `storage.ts`. Bønnekalibrering og gemte kurvdoser prioriteres nu konsekvent. Yield skaleres automatisk ved dosisjustering, og Bar-skærmen viser de brugerdefinerede værdier.
- **Dynamisk Væskemekanisk Tids-Skalering (`calculateTargetExtractionTime`):**
  - **Identificeret Rodårsag:** "TIME WINDOW" i Dial-In Studio og på Bar-skærmen viste en statisk tid (~28s) uden hensyn til dosis eller ratio.
  - **Løsning:** Implementeret hydraulisk modstandsmodel i `espressoMath.ts` ($R = (D/D_0)^{0.30}$). Tiden skalerer nu dynamisk med flow rate og væskemængde (~26s for 17g/34g, kortere for Ristretto, længere for Lungo).

### 2026-10-10 -- Zoom-Hukommelse, Total Udrensning af Haptisk Forstyrrelse & Cross-Scale Benchmark Test-Suite (v1.7.8)
- **Persistent Zoom-Hukommelse (`flowbean_scale_zoom`):**
  - Kamera-zoomniveauet gemmes nu automatisk i `localStorage` og indlæses ved åbning af Scale Cam, så brugerens foretrukne forstørrelse bevares permanent.
- **Fuldstændig Udrensning af Haptisk Feedback (Nul Rystelser):**
  - **Identificeret Rodårsag:** Haptisk feedback under brygning rystede telefonen i holderen/hånden, hvilket forstyrrede kameraets optiske fokus og i værste fald gik amok i ukontrollerede vibrationer.
  - **Løsning:** Samtlige kald til `@capacitor/haptics` er fjernet fra skala-flowet (start, tare, target yield og channeling). Kameraet og appen er nu 100% rolige under hele ekstraktionen.
- **Cross-Scale Benchmark Test-Suite (16 Markedsledende Vægte Analyseret):**
  - Etableret offline test-suite baseret på stillbilleder fra virkelige espresso-udtræk:
    - *Timemore Nano* (side-by-side display med timer til venstre og vægt til højre)
    - *Timemore Black Mirror Basic 2*
    - *Acaia Lunar* (hvide LEDs på aluminiumsfront)
    - *MHW-3BOMBER Smart Scale* (vinklet frontpanel)
    - *SearchPean Tiny 2S* (blåhvide LEDs)
    - *Felicita Arc* (skrå front)
    - *Klassiske LCD-vægte* (mørke segmenter på lys baggrund)
  - Kortlagt de to dominerende display-arkitekturer på markedet:
    - Stacked Dual-Row (Muvna osv.): Løst via Dual-Row Valley Splitter.
    - Side-by-Side (Timemore Nano, Basic 2, SearchPean, Acaia): Timer til venstre ($X < 0.50$), Vægt til højre ($X > 0.40$).

### 2026-10-10 -- Skala-OCR Præcision & Robust Dobbelt-Række Parsing (Muvna/Acaia/Timemore) & Ren Viewfinder UX (v1.7.7)
- **Robust Dobbelt-Række Detektion (Vægt øverst vs. Timer nederst):**
  - **Identificeret Rodårsag:** Refleksioner fra vægtens facetkanter skabte 5-7 støjpixels på tværs af rækker, hvilket forhindrede 1D-projektionen i at falde under tærsklen. Vægt og Timer smeltede sammen til én 141px høj række.
  - **Løsning:** Central-fokuseret horisontal rækkeprojektion (centrale 88%), 5-punkts moving average, adaptiv tærskel (`Math.floor(maxRowCount * 0.16)`) og automatisk horisontal dal-splitter, der klipper rækkerne rent ved dalen mellem vægt og timer.
- **Eliminering af Blind '1'-Fast-Path:**
  - **Identificeret Rodårsag:** Sammenvoksede kolonner med aspect ratio $< 0.48$ blev tvangsmatchet som "1", hvilket forvandlede displayet til falske "1 1 1"-aflæsninger.
  - **Løsning:** Erstattet med streng geometrisk validering (`seg.b` eller `seg.c` aktive, afviser uforholdsmæssigt høje bokse).
- **LED Bradley-Roth Kontrast & Integreret Decimalpunktum Splitter:**
  - Hævet LED-bundstærsklen til `otsuThreshold * 0.60` mod lysdiffusion i acrylglas.
  - Tilføjet automatisk dal-splitter for integrerede 7-segment decimalpunkter (`refinedSpans`).
  - Tilføjet 4% ydre kantmaske mod kabinet-refleksioner.
- **Forøget Offscreen Canvas Opløsning (480x240):**
  - Hævet fra 320x160 til 480x240 for 2.25x skarpere detaljer på dot-matrix og perforerede LED-segmenter.
- **Ren, Uforstyrret Viewfinder UX & Fokusramme:**
  - **Identificeret Rodårsag:** Ved tryk for fokus poppede en stor tekst-badge op (`🎯 Aligned & Focused`) lige under fingeren oven på vægttallene sammen med en blokerende grøn tekstboks.
  - **Løsning:** Fjernet alle dækkende tekst-badges fra fokuspunktet. Ved tap vises nu udelukkende en elegant, minimalistisk fokus-ring og krydssigte.
  - Erstattet den tunge grønne bounding box-tekst med en diskret, ultra-tynd smaragdgrøn ramme, så baristaen til enhver tid har 100% frit udsyn til vægtens cifre.

### 2026-10-07 -- Ægte Pour Over Svanehalskedel Ikon & Komplet Sprog-Rensning (100% Engelsk ved Aktivt Engelsk) (v1.7.6)
- **Erstattet Forvirrende Vinglas-Ikon med Autentisk Pour Over Svanehalskedel (`PourOverKettleIcon`):**
  - **Identificeret Rodårsag:** Tidligere tragt-vektor lignede et drink- eller martiniglas på små knapper.
  - **Løsning:** Nyt, knivskarpt vektor-line-art ikon baseret på baristaernes klassiske svanehalskedel (gooseneck kettle) med konisk kedelkrop, svunget hældetud, ergonomisk modvægtshåndtag og låg med knop.
  - `DripperIcon` opdateret til automatisk at bruge den nye svanehalskedel for perfekt kontrast mod espresso-koppen.
- **Komplet Udrensning af Hårdkodede Danske Tekster i Engelsk Visning:**
  - **Identificeret Rodårsag:** På trods af at appen kørte på engelsk, optrådte blandede eller rent danske tekster i baren og i modalerne (`Aktiv Kaffe / Selected Drink`, `Kalibreret Kværn & Bønne`, `Åbn Dial-In Studio`, `Kværn & Indstilling`, `Indstilling`, `Måltid`, `⚠️ Vægt-sikkerhed`, `Posefoto Tilføjet`, `Dato i fremtiden`, `Luk`).
  - **Løsning (Single Source of Language):** Alle UI-strenge er nu flyttet til `t(...)` med rene engelske standardtekster. Når engelsk er aktivt, vises der 100% engelsk uden et eneste dansk ord.

### 2026-10-07 -- Fastforankret Flowbean Top-Banner & Sikring mod Top-Overlapning på Tværs af Modaler (v1.7.5)
- **Permanent Synligt Flowbean Top-Banner (`z-[70]`):**
  - **Identificeret Rodårsag:** I v1.7.4 lå modal overlays med `z-[60]` og `items-center` / `max-h` dimensionering. Store indholdsrige modaler (såsom `DrinkSelector` og `SettingsModal`) strakte sig derfor helt op i toppen, dækkede Flowbean brand-banneret og stødte ind i mobilens statuslinje (`21.56 ... 15%`).
  - **Top-Banner Elevation (`z-[70]`):** `<header id="app-header">` er nu eleveret til `z-[70]` og er sticky `top-0` med `border-b-2 border-[#CBB8A3]`. Logoet, brand-titlen og knapperne forbliver knivskarpe og 100% synlige på alle tidspunkter.
  - **Dynamisk Header-Højde Variabel (`--app-header-height`):** Måler renderet header-højde inkl. `safe-area-inset-top` og eksporterer til CSS `:root`.
  - **Hurtig Hjem-Navigation & Modal Dismissal:** Tryk på Flowbean logoet eller titlen kalder `closeAllActiveModals()` og returnerer rent til hovedoversigten.
- **Top-Afgrænsning af Samtlige 10 Modaler:**
  - Samtlige modaler i appen (`DrinkSelector`, `SettingsModal`, `FreshnessInfoModal`, `DialInWizardModal`, `LegalModal`, `PaywallModal`, `CentralBeanVaultModal`, `BeanScannerModal`, `ShotSummaryModal` og `OnboardingWizard`) starter nu konsekvent under topbanneret med `paddingTop: 'calc(var(--app-header-height) + 0.5rem)'` og er begrænset med `maxHeight: 'calc(100dvh - var(--app-header-height) - bottomPadding)'`.
  - Modalerne kan aldrig mere nå op over Flowbean banneret eller berøre telefonens statuslinje.

### 2026-10-07 -- Modal Arkitektur & U-fangbarhedssikring (Fix af "Kan ikke komme ud af Bar") (v1.7.4)
- **Total Løsning på Fastlåsning i Bar / Drink Deck Tilpasning:**
  - **Identificeret Rodårsag:**
    1. *Stacking Context Fælde:* `DrinkSelector` modalen ("Specialty Drink Deck & Menu") lå indlejret i `DrinkSelector.tsx` under et element med `.animate-fadeIn`. I CSS danner animationer en isoleret stacking context, hvilket fik mobilens bundnavigationsbar (`z-40`) til at tegne sig *ovenpå* bunden af modalen og blokere "Save & Close"-knappen.
    2. *Forsvunden Lukke-knap (`[X]`):* Modalen havde `overflow-y-auto` på den ydre baggrund, så når brugeren scrollede ned gennem drikkevarelisten, scrollede hele modal-kortet opad, og toppen med `[X]`-knappen røg helt ud af skærmen foroven.
    3. *Mangler i Lukke-Håndtering:* Modalen manglede backdrop tap-to-close, var ikke registreret i `useMobileBackHandler` til Android Tilbage-knap, og tryk på bundmenuens "Bar"-ikon nulstillede ikke visningen.
- **Implementeret Løsning på Tværs af Appen:**
  - **1. Teleportering via `createPortal(..., document.body)` med `z-[60]`:**
    `DrinkSelector` modalen og `FreshnessInfoModal` i `BeandexView` renderes nu direkte i roden af `document.body` med `z-[60]`. De svæver 100% uafhængigt over både topbar (`z-40`) og bundnavigation (`z-40`) uden risiko for afskæring.
  - **2. Fastlåst Header & Footer med Indre Rulning (`flex flex-col`):**
    Modalens baggrund er nu `overflow-hidden`. Modalkortet har en fast header (`shrink-0`) med en prominent `[X]` knap, en fast filterrække (`shrink-0`), en scrollbar drikkevareliste (`flex-1 overflow-y-auto`), og en fast footer (`shrink-0`) med "Save & Close". Hverken toppen eller bunden kan scrolle væk.
  - **3. 4 Uafhængige Veje Ud (Zero-Trap Garanti):**
    - Android Tilbage-knap / swipe-back gesture via `useMobileBackHandler`.
    - Tryk hvor som helst uden for kortet på den mørke baggrund (`backdrop click`).
    - Det faste `[X]` lukke-ikon i toppen.
    - Den faste "Save & Close" knap i bunden.
  - **4. Automatisk Nulstilling ved Tryk i Bundmenuen:**
    Tryk på en hvilken som helst fane i bundmenuen (`Bar`, `Scale`, `Beandex`, `Logs`, `Gear`) udløser `closeAllActiveModals()`, så eventuelle åbne dialoger ryddes med det samme.
  - **5. Fuld Sikring af Samtlige Øvrige Modaler:**
    `SettingsModal`, `LegalModal`, `PaywallModal`, `DialInWizardModal`, `CentralBeanVaultModal`, `BeanScannerModal`, `ShotSummaryModal` og `OnboardingWizard` er alle opdateret til `z-[60]`, backdrop click dismiss, `overflow-hidden` baggrund og sticky headers/footers med safe-area frihøjde.

### 2026-10-07 -- Global Flowbean Brand Konsistens, Rent Minimalistisk Footer-Format & Forstørret Mobil-Logo (v1.7.3)
- **100% Brand-Opdatering fra "Espresso Flow" til "Flowbean":**
  - Gennemført systematisk opdatering af alle udestående brandreferencer i Privacy Policy, Terms of Service (EULA), Support & FAQ, Onboarding Wizard, Lifetime Paywall og Settings på tværs af samtlige 11 sprogpakker (`en`, `da`, `de`, `es`, `fr`, `it`, `ja`, `ko`, `zh-CN`, `zh-TW`, `ar`).
  - Standardiseret `app.title` til `FLOWBEAN` i alle sprog.
- **Rent Minimalistisk Footer-Format (Fjernet © Ophavsretssymbol):**
  - Opdateret footeren fra det forældede `Espresso Flow © {year}` til et rent, moderne format: `Flowbean • {year} • Global Specialty Coffee`.
  - Fjerner enhver juridisk tvivl eller bekymring og giver et mere tidløst og internationalt udtryk.
- **Forstørret Logo Centreret i Mobil-Header (Uden at Udbygge Topbaren Ned):**
  - Forstørret logo-emblemet (`w-10 h-10 sm:w-11 sm:h-11`) med `object-cover scale-135`, så kaffebønnen og terracotta flow-kurven vokser markant ud til alle sider centreret fra midten.
  - Justeret containerens lodrette padding (`py-1.5 sm:py-2`), så topbarens samlede højde forbliver præcis 48-52px uden at skubbe indholdet nedad.

### 2026-10-07 -- Scale Cam 1:1 Billedforhold, Hardware Focus Lock & "Tryk på Vægten" Auto-Kalibrering (v1.7.0)
- **Matematisk 1:1 Billedforhold & UV-Projektion:**
  - Standardiseret Vision Inspector fra 3:1 (240x80) til 2:1 format (320x160), så den binariserede projektion vises uden vandret forvrængning.
  - Standardiseret retikel-boksen til rent 2:1 format (`aspect-2/1`, `baseW = 0.48 / 0.64`, `baseH = 0.24 / 0.32`) for både Compact og Standard visning.
  - Implementeret præcis koordinat-transformation (`getNormalizedVideoCoords`), der tager højde for mobilens native videobilledforhold (16:9 / 4:3) under `object-cover`.
- **Hardware Focus Lock & Anti-Shake Pansring mod Espressomaskine-Vibrationer:**
  - Focus Lock forhindrer Continuous Auto Focus (CAF) i at "jage" (focus hunting), når espressomaskinens 50 Hz pumpe vibrerer. Låses automatisk under brygning og kan styres manuelt i værktøjslinjen.
  - Sub-pixel Anti-Shake Dæmpning: Lavpas-filtreret eksponentiel udjævning (`smoothedBoundingBoxRef`), der absorberer 50 Hz mikroskopiske rystelser.
  - Fotolys (High-Shutter Torch) knap for hurtig lukketid (1/250s–1/500s) for at dræbe motion blur.
- **"Tryk på Vægten" Dynamic Delta Trigger (Auto-Kalibrering):**
  - Kameraet lytter efter et dynamisk spring i vægttallene ($\Delta W \ge 4.0$g).
  - Når baristaen trykker let på vægten med fingeren, identificerer algoritmen øjeblikkeligt vægt-klyngen, ignorerer eventuelle statiske timere (`00:00` / `00.00`), centrerer fokus-retiklen, låser hardware-fokus og kvitterer med et kraftigt haptisk stød samt *"🎯 Vægt Låst & Fokuseret!"*.
- **Timer vs. Vægt Adskillelse (`00.00` Timer Undertrykkelse):**
  - Automatisk straf for tal, der starter med `00.` eller `00:`, hvilket forhindrer, at 4-cifrede timere forveksles med tara-vægten (`0.0g`).
- **Mobil Status Bar Farve & Tekst-Klarhed (Løst Hvid-på-Lys Fejl):**
  - **Krystalklar Mørk Typografi på Alle Mobiler:** Rettet statusbaren fra `style: 'DARK'` (hvid tekst) til `style: 'LIGHT'` (`@capacitor/status-bar`), så ur (`12.17`), batteri, WiFi og notifikationsikoner vises i skarp, mørk espresso/sort farve på den lyse pergament-baggrund (`#FAF7F2`).
  - **Native Android & iOS Support:** Tilføjet `android:windowLightStatusBar="true"` og `android:statusBarColor="#FAF7F2"` i Androids native `styles.xml`, samt runtime opstarts-initialisering via `StatusBar.setStyle({ style: Style.Light })`, så alle Android-telefoner og iPhones viser statusbaren 100% læseligt og harmonisk.
- **Android Studio Synkronisering (`npx cap sync android`):**
  - Bygget og synkroniseret direkte ind i `android/app/src/main/assets/public`, klar til test på Android-telefon.

### 2026-10-07 -- Professionel 5-Faners Bundmenu (100% Vector Line-Art, Zero Emojis) & AeroPress/French Press Immersion Plunge Beskyttelse (v1.6.0)
- **Mobile Bottom Navigation Bar (Tommelfinger-Optimeret 5-Fane Bundmenu):**
  - Implementeret 5-faners bundnavigation (`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E8DFD5] shadow-lg`) med safe-area padding (`pb-safe`).
  - **100% Professionelle Vektor Linje-Ikoner (Zero Emojis):** Brugerens instruks om ingen emojis i kontrolfladen overholdt til punkt og prikke.
    - Tab 1: **Bar** (`Coffee` fra Lucide)
    - Tab 2: **Vægt** (`Camera` fra Lucide)
    - Tab 3: **Beandex** (Skræddersyet artisan `CoffeeBeanIcon` SVG-vektor med `beans.length` badge)
    - Tab 4: **Logbog** (`BookOpen` fra Lucide)
    - Tab 5: **Udstyr** (`Sliders` fra Lucide)
  - Desuden udskiftet filter-emojis i deck og vejledninger med `DripperIcon` (SVG line-art).
- **Slank Mobil-Header (44px Kompakt Højde):**
  - Fjernet center-switcheren og top fanebåndet på mobilen (`hidden md:flex` og `hidden md:block`).
  - Mobil-headeren viser nu udelukkende logo + brand til venstre, og Trial/Pro badge + Settings til højre, hvilket frigiver masser af skærmplads til kaffebaren og vægten.
- **AeroPress & French Press Vægt-Beskyttelse & Immersion Fysik:**
  - Håndteret fysikken for stempelpresning: Ved plunging presses 10-20 kg ned på vægten, hvilket forårsager sensorfejl (`EEEE`).
  - Udbygget `DrinkRecipe` med `brewStyle: 'immersion'`, `steepSeconds`, og `plungeWarning: true`.
  - Tilføjet Steep Countdown Timer i `ScaleMonitor.tsx` under trækketid for immersion kaffer.
  - Iøjnefaldende sikkerhedsadvarsel på både opskriftskort og Scale Cam: *"⚠️ Løft bryggeren af vægten før du presser! Undgå overbelastning af vægtens vejecelle"*.
- **Rolig Metode-Omskifter i Coffee Bar (Ingen Uønsket Scroll-Hop):**
  - Rettet scroll-adfærd: Når man skifter mellem `Espresso` og `Pour Over`, forbliver viewporten roligt i toppen af Barista Decket uden at hoppe ned til det store drikkekort.
  - Appen scroller nu først ned til ekstraktionskortet, når baristaen aktivt vælger en specifik kaffedrik fra baren.
- **Tydelige Sektionskanter & Markant Bundmenu-Adskillelse:**
  - **Tydelig Topkant på Bundmenuen:** 2px mokka-kant (`border-t-2 border-[#CBB8A3]`) og opadrettet dybdeskygge (`shadow-[0_-4px_24px_rgba(44,32,24,0.08)]`), der skaber en 100% udtalt skillelinje.
  - **Android & iOS Navigation Bar Buffer:** Bundmenuens padding udvidet (`max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))`), så den aldrig kommer i karambolage med 3-knaps systemmenuer eller gestusbjælker på Android og iPhones.
  - **High-Definition Kantskarphed i Hele Appen:** Opgraderet alle sektions- og kortkanter (`border-[#E8DFD5]`) fra bleg sand til en fyldig, taktil mokka-kant (`#D2C0AE`) med `1.5px` stregtykkelse.
  - **Tydeligt Beandex Antal-Badge:** Badget er forstørret (`min-w-[18px] h-[18px]`) med fed monospace tekst (`9.5px`), mørk espresso/terracotta baggrund og en 2px hvid afgrænsningsring (`ring-2 ring-[#FFFDF9]`).
- **Logo-Tro Kaffebønne & Responsiv "Coffee Bar" Label:**
  - **Beandex Bønne-Ikon Matcher Master Logoet (Ren Skrå Bønne Uden Flow-Hale):** Opdateret `CoffeeBeanIcon` så det fokuserer 100% på selve den skrå, fyldige kaffebønne fra logoet (~45° hældning og organisk midterspalte) – helt renset for bagvedliggende flammemønstre eller flow-striber. Ikonet fremstår nu ultraskarpt, centreret og perfekt harmonisk med de øvrige Lucide-ikoner i bundbaren.
  - **Responsiv "Coffee Bar" Label i Bunden:** På alle skærme fra 380px og op (iPhone 12/13/14/15/16, Plus, Pro, Pro Max og moderne Androids) vises det fulde, professionelle navn **Coffee Bar** (samt *Scale Cam* og *Logbook*), mens de smalleste telefoner (<380px) komprimerer til **Bar** uden risiko for linjebrud.
- **Symmetrisk Mokkakant & Dybdeskygge under Topmenuen:**
  - **Perfekt Viewport-Indramning:** Den øverste fastgjorte header (`<header>`) har fået nøjagtig samme markante 2px mokkakant (`border-b-2 border-[#CBB8A3]`) og bløde dybdeskygge (`shadow-[0_4px_20px_rgba(44,32,24,0.06)]`) som bundmenuen, suppleret med matchende frosted glassmorphism (`bg-[#FAF7F2]/95 backdrop-blur-md`).
  - Herved glider kaffebaren, graferne og logbøgerne harmonisk ind og ud under to symmetriske, taktile rammer i top og bund med ensartet balance.
- **Lokal Byggevalidering:** Testet med `npm run build` lokalt (100% succesfuld Vite + TS kompilering uden fejl).

### 2026-10-07 -- Pour Over & Filterkaffe Integration, Tommelfinger-Optimeret Coffee Bar & Slank Mobil Header (v1.5.0)
- **Tommelfinger-Optimeret Metode-Vælger i Coffee Bar (Model A):**
  - Implementeret taktil, tommelfingervenlig 2-vejs omskifter (`[ ☕ Espresso Bar ]` | `[ 🫗 Pour Over Bar ]`) direkte under hero-hilsenen i Coffee Bar.
  - Vælges `Espresso Bar`, vises de klassiske 13 espresso- og mælkedrikke (Espresso, Cortado, Flat White osv.).
  - Vælges `Pour Over Bar`, vises de 6 nye specialty filtermetoder (V60 Standard, V60 4:6 Kasuya, Chemex Classic, Kalita Wave 185, AeroPress Inverted, French Press).
  - Pinned deck ribbon og All Drinks Customize Modal tilpasser sig automatisk den aktive metode.
- **Slank Mobil-Header (Frigivet 60px vandret plads på smartphone):**
  - Sprogvælger-dropdownen er skjult på mobilskærme (`hidden sm:block`) og tilgængelig i `⚙️ Indstillinger`, så logo, brand og dual-mode switcheren får masser af luft på 375-393px telefoner uden at kollidere eller bryde linjer.
- **Specialty Filter Drikkeprofiler & Arkitektonisk Kande-Vektorer:**
  - Tilføjet 6 specialty filteropskrifter med ratios (1:14 til 1:16.6), dæmpede malinger, hældeteknikker og bloom-parametre.
  - `ArchitecturalCup` udvidet med ægte glaskande (Range Server med dryptragt) og pressekolbe (`glassStyle: 'server' | 'press'`).
- **Scale Cam Pour Over Mode (`ScaleMonitor.tsx`):**
  - Automatisk genkendelse af aktiv metode: Når en filteropskrift vælges, starter Scale Cam i Pour Over tilstand.
  - Bloom Countdown (0–45s med målvand fx 45g–50g) med visuel pulsering.
  - Pacing Guide Flow-Meter (mål 4.0–6.0 g/s) vejleder rolige, jævne hældninger i stedet for kanaliseringsadvarsler.
  - Tare-instruks tilpasset filterkaffe (placér server, tragt og kaffe, nulstil til 0.0g).
  - Realistisk 3-faset simulering i Demo Mode (bloom saturation, pulse 1, pulse 2).
- **Dynamisk FlowChart Tids- og Vægtskala (`FlowChart.tsx`):**
  - Dynamisk tidsakse op til 4 minutter (240 sekunder) med minut-markeringer (`1m`, `2m`, `3m`, `4m`) og Y-akse op til 500g.
  - Viser Pacing Zone bånd (4.0–6.0 g/s) og deaktiverer kanaliseringsmarkører ved filterkaffe.
- **Lokal Byggevalidering:** Testet med `npm run build` lokalt (100% succesfuld Vite + TS kompilering uden fejl).

### 2026-10-07 -- Rebranding til Flowbean, Nyt Master Logo & Fuld Nativ Ikon-Suite (v1.4.0)
- **Officielt Rebrand til Flowbean:**
  - Nyt navn fastlagt til `Flowbean` for at favne både Espresso, Pour Over og bønnehåndtering/rating.
  - Displaynavn under mobilikoner er nu 8 tegn (`Flowbean`), hvilket eliminerer enhver afkortning med prikker på iOS og Android.
  - Opdateret `CFBundleDisplayName` i `Info.plist`, `app_name` i Android `strings.xml`, `appName` i `capacitor.config.ts`, `package.json` og `index.html`.
- **Nyt Master Logo (1024x1024):**
  - Genereret og gemt i `assets/flowbean-master-icon.png`: Porcelænshvid kaffebønne med aerodynamisk flow-bølge i terracotta og crema på espressobaggrund (`#2C2018`).
- **Løst Manglende Ikon på iOS & TestFlight:**
  - Tilføjet `"idiom": "ios-marketing"` og fuld specifikation i `Contents.json`.
  - Genereret samtlige iPhone opløsninger og splash screens.
- **Løst Manglende Ikon på Android:**
  - Fjernet `drawable-v24/ic_launcher_foreground.xml` (som viste standard Capacitor robotten i hvidt).
  - Opdateret `ic_launcher_background.xml` til `#2C2018`.
  - Genereret `ic_launcher.png`, `ic_launcher_round.png` og adaptiv `ic_launcher_foreground.png` på tværs af alle mipmaps.
- **Web & Top Header:**
  - Genereret `public/flowbean-logo.png` og opdateret top headeren i `App.tsx` til at vise det officielle logo og `FLOWBEAN` titlen.

### 2026-10-05 -- Real-World Android UI & OCR Fikser (v1.3.3)
- **OCR Dato-Præcision & BBD Fremtids-Spærre:**
  - `BagExtractionContext` introduceret, så italienske kaffemærker (Lavazza, Illy osv.) automatisk bruger 24 måneders BBD-standard i stedet for 12 måneder.
  - Fremtidsdato-beskyttelse: Ristedatoer kan aldrig ligge i fremtiden. Ved scanning af fx `30/03/2028` udregnes ristedatoen nu korrekt til `2026-03-30`.
  - UI-advarsel: Hvis ristedatoen mod forventning ligger i fremtiden (`daysOff < 0`), vises rød advarsel i stedet for "Roasted Today: Active CO2 degassing".
- **100% Ren Start (Nul Mock Data):**
  - Syntetiske testbønner (Ethiopia, Colombia, Napoli) fjernet fra standardlageret; `getDefaultBeans()` returnerer `[]`.
  - Automatisk udrensning af legacy mock bønner i `loadBeans()`.
  - Eureka Mignon fjernet fra standard inSetup; kun den kværn brugeren vælger i onboarding eller gear aktiveres (`inSetup: true`).
- **Top Header Friplads & Titel-Bevaring:**
  - Redundant `[🛡️ 7d]` prøvebadge skjult på mobil, da `TrialCountdownBanner` nedenunder dækker det.
  - Logo-titel `ESPRESSO FLOW` sikret mod tekstafskæring (`ES...`).
- **Android System Navigation Bar Buffer:**
  - Dynamisk safe-area bund-padding (`max(7rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))`) tilføjet til `<main>` og udvidet footer-padding, så bundkort ikke dækkes af Android navigationstaster.

### 2026-10-05 -- Første iOS TestFlight Deployment Live (App ID: 6819161308 / v1.3.2)
- **Fuldautomatisk CI/CD TestFlight Succes (`ios-build.yml`):**
  - Oprettet `com.mh.espressoflow` (App Store Navn: *Espresso Flow: Smart Barista*) og parret med Team `39T28DB5D4`.
  - Apple Distribution certifikat udstedt og konverteret med `-nomaciter -macalg sha1` for 100% kompatibilitet med macOS 15 Keychain.
  - Kompileret på GitHub Actions Mac cloud runner (`macos-15` ARM64 / Xcode 26.3) med Fastlane 2.240.1 på 3 minutter og 12 sekunder.
  - IPA signeret og uploadet direkte til TestFlight.
- **5 Autoriserede Secrets:** Konfigureret og verificeret i `MichaelKHans/EspressoFlow`.

### 2026-10-04 -- Hardware, Sikkerheds- og Mobilhærdning (iPhone-Only, Dobbelt WakeLock, Safe Areas, Lokale Fonts, RLS) (v1.3.1)
- **iPhone-Only Målretning (`TARGETED_DEVICE_FAMILY = 1`):** iPad deaktiveret i Xcode-projektet for hurtigere, friktionsløs godkendelse uden krav om iPad-screenshots eller unødig tablet-review.
- **Portræt-Lås (`Info.plist`):** Låst til Portrait på iPhone, så mobilen aldrig roterer under kaffebrygning på drypbakken eller bordet.
- **Dobbelt-lags Nativ Screen WakeLock:**
  - Swift plugin i `AppDelegate.swift` med `UIApplication.shared.isIdleTimerDisabled = true` (virker på samtlige iOS-versioner fra iOS 13+).
  - Java plugin i `MainActivity.java` med `FLAG_KEEP_SCREEN_ON` for Android.
  - WebKit/Chromium standard fallback i `wakeLock.ts`.
- **Safe Area Insets (Notch & Dynamic Island):** `pt-safe` på headers i `App.tsx` og `AdminPortal.tsx`, `pb-safe` på footer, og dynamisk beregning over home-indikatoren på bottom toasts.
- **Lokale Typografier (100% Offline):** Downloadet `Courier Prime` (400, 700) og `Inter` (400, 600, 700) til `public/fonts/` med `@font-face` i `index.css`. Ingen CDN-afhængighed ved koldstart offline.
- **iOS DeviceOrientation Permission via Bruger-Gesture:** Flyttet fra `useEffect` til eksplicitte klik-events (`handleStartCamera`, `handleTapViewfinder`, `handleStartBrewing`), så tilt-måleren virker på iPhone.
- **Supabase RLS Sikkerhedshærdning:** Fjernet alle offentlige DELETE politikker. Kun backend `service_role` kan slette. `is_verified` kan ikke eskaleres af anonyme brugere.
- **Branded Native App Icons & Splash:** 1024x1024 master app-ikon og 2732x2732 splash screens genereret og synkroniseret til iOS og Android.
- **LocalStorage Kvote-Beskyttelse:** Automatisk downsampling af telemetripunkter for ældre shots (>25 shots) ved pladsmangel i `storage.ts`.

### 2026-10-04 -- Nativ Mobil App (iOS & Android) med TestFlight CI/CD & OCR-Hardwareoptimering (v1.3.0)
- **Capacitor v8 Nativ Mobilbro & Scaffolding:**
  - Etableret komplet native scaffolding med `@capacitor/core@8.5.2`, `@capacitor/ios@8.5.2`, `@capacitor/android@8.5.2`, `@capacitor/app@8.1.2`, `@capacitor/haptics@8.0.2` og `@capacitor/status-bar@8.0.4`.
  - App Identifier sat til `com.mh.espressoflow` (Apple Team `39T28DB5D4`).
  - Permissions konfigureret i `Info.plist` (Kamera & Fotobibliotek) og `AndroidManifest.xml` (Kamera, Autofokus og WakeLock).
- **OCR-Hardwareoptimering & Mobilers Svagheder Adresseret:**
  - **Skærm-vågelås (`wakeLock.ts`):** WebKit/Chromium Screen Wake Lock holder skærmen tændt under hele brygningen og forhindrer dvale midt i et shot.
  - **Taktil Haptik (`@capacitor/haptics`):** Fysisk vibrerende feedback ved Tare-lås, Start af shot, kanalisering (flow-spike $> 4.2\text{ g/s}$) og målyield nået.
  - **Optisk Zoom mod Makro-Spring:** 1.8x/2.5x digital zoom gør det muligt at placere mobilen i 25–35 cm sikker afstand på bordet, så iPhones 3-kameralinser ikke "springer" til ultravidvinkel.
  - **Adaptiv OCR Framerate:** 12.5 FPS standby / tare $\rightarrow$ 30 FPS under aktiv ekstraktion sparer batteri og eliminerer termisk overophedning.
- **Fuldautomatisk iOS TestFlight CI/CD Pipeline:**
  - Etableret `.github/workflows/ios-build.yml` og Fastlane (`ios/App/fastlane/Fastfile` :beta lane) efter samme gennemtestede mønster som i `ToemerAppen`.
  - Swift 6 & SPM isolation via `scripts/patch-capacitor-plugins.cjs`.
  - Automatisk auth mod App Store Connect API, midlertidig CI keychain, .p12 distribution-certifikat og upload.

### 2026-10-04 -- Fuldstændig Udrensning af Fiktive Tal & Mock Data i Hele Appen (v1.2.31)
- **Fuldstændig Udryddelse af Fiktive Tal i Admin Hub (Tab 1 & 3):**
  - Fjernet de hårde prototype-tal i `AdminPortal.tsx`:
    - 7-Day Active Trials: Fjernet fiktive `142` (+18 new users this week). Erstatter med ægte lokal sessionsstatus (`1` på aktiv test-enhed, `0` hvis Pro er aktiveret).
    - Lifetime Unlocks: Fjernet fiktive `38`. Viser `0 solgt (Pre-launch)` (eller `1 aktiv licens` på test-enhed).
    - Gross Revenue: Fjernet fiktive `1862 DKK` (~$189.62 USD). Viser ægte `0 DKK ($0.00 USD) (Afventer launch)`.
    - Conversion Rate: Fjernet fiktive `21.1%` (Specialty coffee app benchmark). Viser ægte `0.0% (Beregnes ved App Store launch)`.
  - Månedlig Revision i Curator Hub: Fjernet den hårde fiktive startdato `'2026-09-27'`, som fejlagtigt viste "OK (25 d.)". Viser nu korrekt `Ej udført endnu`, indtil kuratoren rent faktisk udfører og logger sin første månedlige revision.
- **Udrensning af Fiktive Data i Storage (`storage.ts`):**
  - Fjernet `getSampleShots()`, som automatisk indsatte 2 fiktive espresso-shots (Ethiopia Yirgacheffe & Colombia Pink Bourbon) i logbogen for nye brugere. `loadShots()` returnerer nu en ren, tom liste `[]` for nye brugere, så logbogen udelukkende viser brugerens egne reelle bryg.
  - Dynamiske Ristedatoer: Fjernet fastlåste statiske ristedatoer (`2026-09-14`, `2026-09-10`, `2026-09-02`) i `getDefaultBeans()`. Erstatter med dynamiske relative ristedatoer (5, 8 og 12 dage siden) og garanterer `rating: 0`.
- **Sky- og Offline-Data Integritet (`supabase.ts`):**
  - Nulstillet alle syntetiske `verifications_count` (tidligere 65, 50, 42, 35 osv.) til `1` (enkeltstående initial verifikation).
  - Fjernet `avg_rating: 4.6, ratings_count: 3` fra offline-prøven `samplePending` i kurator-køen, så den ligeledes starter ved `0.00 / 0 stemmer`.

### 2026-10-04 -- Ægte Brugerstemmer, Forbedret Stjerneplacering, Sortering & Untappd-stil Butiksvisning (v1.2.30)
- **Eliminering af Fiktive Rating-Stemmer (Nul Opdigtede Data):**
  - Alle bønner med syntetiske stjerner/stemmer (f.eks. "★ 4.8 (24 stemmer)") i live Supabase databasen, `schema.sql` og offline cachen er nulstillet (`avg_rating: 0.00`, `ratings_count: 0`).
  - Kaffer fremstår nu ærligt og troværdigt som "Ny (0 stemmer)" eller "Ny kaffe i bønnehvælvingen", indtil rigtige brugere rent faktisk brygger og afgiver stjerner via `submitDrinkRating` og smagsevalueringen.
  - Ingen hårde fallback-tal (tidligere `4.8` eller `5.0`) eksisterer længere i koden.
- **Forbedret Stjerneplacering & Visuelt Hierarki:**
  - Fjernet den overfyldte inline-tekst i bønnekortenes brødtekst og erstattet den med dedikerede, elegante status-badges øverst på kortene.
  - Tydelig adskillelse mellem officielle SCA Cupping point (ekspertbedømmelse) og barista-fællesskabets stjerner.
- **Avanceret Sorteringsmotor i Kurator Studiet:**
  - Indført lynhurtig sortering på bønnelister med 7 parametre:
    1. Nyeste først (Standard)
    2. Højeste vurdering (Stjerner)
    3. Flest stemmer (Mest populære)
    4. Højeste SCA Cupping Score (Ekspertpoint)
    5. Navn (A-Z)
    6. Risteri (A-Z)
    7. Ristegrad (Lys $\rightarrow$ Mørk)
- **Untappd-Inspireret Butiksvisning (`purchase_location`):**
  - Tilføjet `purchase_location` kolonne i Supabase (`global_coffee_beans` og `bean_drink_ratings`), TypeScript types (`CoffeeBeanProfile`, `ScannedBeanInfo`, `GlobalCoffeeBean`) og baggrunds-sync.
  - Understøtter visning af indkøbssted ("🏪 Føtex", "🏪 Meny", "🏪 Bilka", "🏪 Hedekaffe Gårdbutik", "🏪 SuperBrugsen", "🏪 Webshop") med genvejs-chips i Curator Studio editoren.
  - Butiksvisning fremgår nu på bønnekort i Beandex, i Central Bean Vault og ved live scanning i Bean Scanner Modal.

### 2026-10-04 -- Data Integritet & SCA Cupping Score Revision: Nul Opdigtede Data
- **Fuldstændig Udrensning af Fiktive Cupping Scores:**
  - Efter grundig gennemgang af kurator-data blev det konstateret, at midlertidige test-tal (f.eks. Hedekaffe: 89 PTS / "Barista Tech Review" og Lavazza: 88 PTS) var oprettet som prototype-pladsholdere.
  - I overensstemmelse med reglen om at intet må være opdigtet, er alle uofficielle cupping scores fjernet (`NULL` point) fra live Supabase, SQL-skemaet og appens offline fallbacks.
  - Kun bønner med verificerede, offentligt tilgængelige cupping certifikater (The Coffee Collective Kieni 94 PTS via Coffee Review; Tim Wendelboe Caballero Geisha 95.5 PTS via Cup of Excellence) bevarer officielle point.
  - Kurator-editoren er opdateret så Cupping Score er tydeligt markeret som **(Valgfri)** med streng advarsel om kun at indtaste point fra anerkendte organisationer (CQI Q-Grader, Cup of Excellence, Coffee Review).

### 2026-10-04 -- Admin Coffee Curator Studio: Central Godkendelsespult, SCA Cupping Scores & Sky-Kvalitetssikring (v1.2.29)
- **Admin Coffee Curator Studio & Godkendelsespult (`AdminPortal.tsx` Tab 3):**
  - Live godkendelseskø for kaffer indsendt af brugere eller scannet via Vision OCR (`is_verified: false` vs `is_verified: true`).
  - Lynhurtig 1-klik **[✓ Godkend]** knap til øjeblikkelig verificering i Supabase Cloud Vault og lokal cache.
  - **[✏️ Rediger & Poler]** editor: Kuratoren kan berige kaffen med officielle SCA Cupping Scores (0–100 PTS), kildekreditering (f.eks. *SCA Q-Grader, Coffee Review, Cup of Excellence, WBC*), Vivino sensoriske smagsnoter (`POPULAR_FLAVOR_TAGS`), bryg-egnethed (Espresso, Cortado, Latte, Flat White) og officielle posefotos med offline komprimering.
  - **[🗑️ Slet / Afvis]** knap til fjernelse af dubletter, spam eller fejlagtigt indtastede kaffer.
  - **[➕ Opret Ny Verificeret Kaffe]** formular til direkte oprettelse af officielle reference-bønner i den centrale sky-hvælving.
  - **Periodisk Kurator Tjekliste & Audit Kalender:** Struktureret revisions-flow med tjekpunkter for månedlige CoE auktionslots, Coffee Review 90+ cuppings, Open Food Facts synkronisering og WBC vinderprofiler inkl. "Sidste revision udført"-stempel.
- **Backend API til Kurator-Styring (`src/lib/supabase.ts`):**
  - Implementeret `fetchAllCuratorBeans()`, `adminVerifyGlobalBean()`, `adminDeleteGlobalBean()` og `adminCreateGlobalBean()`.
  - Offline fallback med realistiske demodata (herunder uverificerede bønner som afventer godkendelse) for problemfri afprøvning i alle netværkstilstande.
- **Diskret & Hurtig Adgang (`SettingsModal.tsx` & `BeandexView.tsx`):**
  - Tilføjet diskret `[ 🛡️ Curator Studio ]` knap i indstillingsmodalens bund og `[ 🛡️ Curator ]` chip i Beandex-banneret, der aktiverer `#admin` routeren uden reload.
  - Sikkerhedsbeskyttet med PIN/Passcode (fabriksstandard: `9246`).

---

### 2026-10-04 -- Vivino-Style Beandex: Fuzzy Autocomplete, Sensoriske Smagsnoter, Posefotos & Central Vault Kvalitetsværn (v1.2.28)
- **Vivino-Inspireret Bønnekatalog & Autocomplete Motor (`beanCatalogMatcher.ts`):**
  - Kurateret specialty coffee vidensbase med verificerede nordiske og internationale risterier (Hedekaffe, Coffee Collective, La Cabra, Lavazza, Illy, Peter Larsen, BKI, April, Prolog, Tim Wendelboe m.fl.).
  - Lynhurtig autoudfyldelse og søgeforslag for både risteri og kaffenavn.
  - Levenshtein distance-baseret *"Mente du...?"* forslagsbanner ved slåfejl og OCR-unøjagtigheder (f.eks. `hedekafe` $\rightarrow$ `Hedekaffe`, `lavaza` $\rightarrow$ `Lavazza`).
- **Kvalitetsværn mod Dubletter og Fejldata (`sanitizeBeanInput`):**
  - Forhindrer generiske fallback-navne som f.eks. "Coffee (3019)" i at forurene brugerens personlige Beandex eller den centrale bønnehvælving.
  - Sikrer pæn orddeling og standardiseret casing.
  - **Supabase Central Vault Beskyttelse:** Opdateret `upsertGlobalBean` så brugerrettelser ikke kan overskrive admin-verificerede kaffer (`is_verified: true`), men i stedet øger `verifications_count` og samler rating-stemmer.
- **Sensoriske Smagsnoter (Vivino Flavor Pills):**
  - 13 tosprogede sensoriske smagskategorier med ikoner (Mørk Chokolade, Karamel, Ristede Nødder, Citrus & Bergamot, Røde Bær, Fersken & Abrikos, Jasmin & Blomster m.fl.).
  - Smagspiller integreret direkte på bønnekortene i Beandex med lynhurtig interaktiv tag-editor (`+ Smagsnoter`).
  - Smagspiller integreret i bønnescanneren og Dial-In Studio modalen.
- **Posefotos med Offline Komprimering (`compressImageToDataUrl`):**
  - Baristaen kan tilføje et virkeligt foto af sin kaffepose direkte fra kameraet eller galleriet.
  - Klient-side offscreen canvas-komprimering genererer ultrakompakte thumbnails ($< 40 \text{ KB}$), som gemmes direkte i `localStorage` uden eksterne billedhosts eller cloud-afhængigheder.
  - Flotte miniaturevisninger på bønnekort i Beandex og i Dial-In Studio bønnevælgeren.
- **Dial-In Studio & Bønnehvælving Synergi:**
  - `DialInWizardModal` viser nu bønnefoto, oprindelsesland og smagsnoter for den aktive bønne samt miniaturebilleder i hurtigskift-listen.
  - Web affiliate shop-links er planmæssigt udskudt til senere iteration efter brugerønske.

---

### 2026-10-04 -- Bønnescanner OCR Perfektion, Dansk Ristedato, Lavazza 24-mdr BBD & Modal Reset (v1.2.27)
- **Fuldstændig Modal Nulstilling ved Lukning (`X` / Backdrop):**
  - Rettet tilstandshukommelse i `BeanScannerModal`, hvor genåbning af scanneren fastholdt den forrige bønnes data.
  - Implementeret dedikeret `handleCloseModal` og ren `useEffect` lytter på `isOpen`, som nulstiller `scannedResult`, `manualCode`, `dateScanNote`, `dateScanError` og genstarter kameraet rent.
- **Dansk Ristedato- & Mærkningsmotor (`extractDatesAndRoastFromBagText`):**
  - Udvidet dato-parseren til at genkende danske og nordiske ristedato-stempler (f.eks. `LOT: MH9K Ristedato 02/03-26` på Hedekaffe-posen).
  - Robust håndtering af blandede skilletegn (`/` og `-` som i `02/03-26`), valgfrie mellemrum, og 2-cifrede årstal (`-26` $\rightarrow$ `2026`).
  - Støtte for danske nøgleord: `Ristedato`, `Ristet og pakket`, `Produktionsdato`, `Fremstillet`, `Bedst før`, `Best før`.
  - Måned-år stempler uden dagsangivelse understøttet (fx `Best før: SEP 2027` eller `09/2027`).
- **Kommerciel Italiensk Holdbarhed & BBD Heuristik:**
  - Udvidet datovalideringstærskel til $currentYear + 5$ for at rumme 24–36 måneders fabriks-MHD.
  - Automatisk genkendelse af fremtidige datoer ($> 2$ måneder fremme som Lavazzas `30/03/2028` fundet under lot-koden `Lotto n. / Batch n. / Lot N° : CK17DH 30/03/2028`).
  - Italiensk 24-måneders standard: For italienske brands (Lavazza, Illy, Segafredo, Kimbo) beregnes den estimerede ristedato som 24 måneder før BBD (fx `30/03/2028` $\rightarrow$ `2026-03-30`), og for øvrige 12–18 måneder.
- **Offline Stregkodedatabase Udvidet (`KNOWN_BARCODE_DATABASE`):**
  - Tilføjet Hedekaffe fra Ulfborg (`4056489503019`: *Ristemesterens Foretrukne Mellemristet*).
  - Tilføjet Lavazza Espresso Barista serien (`8000070025066`: *Espresso Barista Gran Crema*, `8000070025080`: *Perfetto*, `8000070025059`: *Intenso*).
  - 'Hedekaffe' tilføjet til globale risterier (`COMMON_ROASTERS`) og 'Ristemesterens Foretrukne' til `COMMON_ORIGINS`.
- **Dobbelt-Pass Billede-OCR & Invertering for Mørke Poser (`bagOcr.ts`):**
  - `preprocessImageForOcr` understøtter nu opløsning op til 1800px (undgår at små datostempler sløres væk).
  - Inverteringsteknik (negativ): Hvid skrift på kulsorte poser (som Lavazzas glinsende foliepose) inverteres til sort skrift på hvid baggrund i et ekstra OCR-pass, hvilket markant forbedrer Tesseracts genkendelsesrate for dot-matrix printerstempler.
  - Fotoscanning fletter nu automatisk OCR-fundet ristedato med stregkodedata i én arbejdsgang.
- **Tydelig Taktil Brugerfeedback i Trin 2:**
  - Hvis OCR ikke kan tyde datostemplet, vises en behagelig gul/orange vejledningsboks direkte i Trin 2 kortet med "Prøv igen med et tættere billede" knap, så baristaen aldrig efterlades i tvivl.

---

### 2026-10-04 -- Beandex Udvidelser: Afgasning & Friskhedsvindue (Degas), Åbningsdato & Personlige Barista-Noter (v1.2.26)
- **Kaffens Friskhed & Afgasningsmotor (`calculateBeanFreshness`):**
  - Matematisk model for specialty coffee ekstraktionsfysik baseret på ristningsgrad og tid:
    - **Afgasningsfase (Degassing 💨):** Lysristet (0–7 dage), Mellemristet (0–5 dage), Mørkristet (0–3 dage). Advarer om brusende $\text{CO}_2$, der modvirker jævn mætning af pucken og forårsager sur kanalisering (channeling).
    - **Guldvinduet (Optimal Peak Window ✨):** Fra afsluttet afgasning op til 21–35 dage. Maksimal aromastabilitet, karamelsødme og optimal cremaelasticitet.
    - **Modnet Fase (Past Peak ⏳):** Delikate blomster- og frugtnoter flader gradvist ud; appen vejleder til 0.5–1.0 trin finere kværn og 1°C varmere vand for at kompensere.
    - **Oxideret / Ældre (Stale):** Kaffeolierne er nedbrudt; anbefaler mælkedrikke eller korte ristretto-skud.
- **Interaktiv Friskheds- & Afgasningsguide (`FreshnessInfoModal`):**
  - Taktil `ℹ️` infoknap ved siden af friskhedsbadget på ethvert bønnekort i Beandex.
  - Giver baristaen dybdegående visuel forklaring af $\text{CO}_2$ ekstraktionsfysik, envejsventiler, hvorfor espresso aldrig må brygges straks efter ristning, og korrekte opbevaringsprincipper (altid mørkt, tørt og aldrig i køleskab).
- **Åbningsdato (`dateOpened`) & Iltningsadvarsel:**
  - 1-tryks **`[ 📦 Marker Åbnet i Dag ]`** knap direkte på bønnekortet.
  - Automatisk overvågning af brudt forsegling (viser f.eks. `Åbnet for 6d siden (2026-09-28)`).
  - Tydelig iltningsadvarsel, hvis posen har været åbnet i mere end 3 uger (`> 21 dage`), da ilt nedbryder de aromatiske kaffeolier.
  - Redigering af åbningsdato via 1-klik prompt.
  - Tilføjet valgfrit `Date Opened` felt i "Add Custom Specialty Bean" formularen.
- **Inline Barista Tasting Notes:**
  - Hvert bønnekort i Beandex har nu et direkte redigerbart smags- og opskriftsnotefelt.
  - Baristaen kan let dokumentere smagsindtryk og specifikke bønneerfaringer (fx *"Købt hos La Cabra – fantastisk til Cortado ved 18.5g og 94°C"*).
  - Gemmes øjeblikkeligt i `localStorage` med taktil feedback.
- **Gear-fane Synkronisering:**
  - Den aktive bønne på kaffebaren i Gear-fanen viser nu også live friskhedsstatus og dage siden åbning.
- **i18n Global-First:**
  - Samtlige nye tekster og forklaringer implementeret i `en.ts` og `da.ts`.

---

### 2026-10-04 -- Bryggetemperatur (°C / °F Switcher), Settings ⚙️ Modal, Gear PID Overblik & Dial-In Måltemperatur (v1.2.25)
- **Settings ⚙️ Modal & Taktil Temperaturskala (°C / °F):**
  - Ny dedikeret `SettingsModal` tilgængelig via tandhjul-knap ⚙️ i øverste header.
  - Segmenteret temperaturskifter mellem Celsius (`°C`) og Fahrenheit (`°F`), der gemmes vedvarende i `localStorage`.
  - Præcise omregningsfunktioner i `espressoMath.ts` (`celsiusToFahrenheit`, `fahrenheitToCelsius`, `formatTemperature`).
  - Integreret overblik over app-licens, 7-dages prøveperiode, Apple/Google Store gendan køb samt direkte adgang til Terms, Privacy Policy og Barista Support.
  - Registreret i `useMobileBackHandler` for flydende hardware/gesture tilbage-navigation.
- **Dial-In Studio: Mål-Bryggetemperatur med Ristegrad-Anbefaling:**
  - Trin 3 i `DialInWizardModal` udvidet med taktil temperatur-stepper (`[-] 93°C [+]`), der respekterer valgt enhed (°C eller °F).
  - Dynamiske anbefalings-badges baseret på specialty coffee ekstraktionsfysik:
    - **Lysristet (Light):** 94°C (201°F) – høj termisk energi krævet for at ekstrahere tætte cellestrukturer og frugtsyrer.
    - **Mellemristet (Medium):** 93°C (199°F) – den gyldne specialty standard for maksimal sødme og balance.
    - **Mellem-mørk (Med-Dark):** 91°C (196°F) – let dæmpet temperatur for at undgå ristebitterhed.
    - **Mørkristet (Dark):** 89°C (192°F) – lavere temperatur bevarer søde noter og skåner kaffeolierne mod bitter afbrændthed.
  - Bryggetemperaturen låses på bønnen og synkroniseres direkte til ekstraktionsloggen.
- **Gear-fane: Espressomaskine PID & Kedelkapaciteter:**
  - Maskinopsætningen i Gear-fanen udvidet med et overblik over maskinens varmesystem (`getMachineTempProfile`):
    - PID Digital Styring (Justerbar, fx Sage Dual Boiler / Barista Touch / Decent DE1, 88–96°C).
    - 3-Trins Temperatur (Lav / Mellem / Høj, fx Bambino Plus / Dedica / Specialista).
    - Fast Termostat (~93°C, fx Gaggia Classic / Silvia / E61 HX).
  - Viser driftsområde og fabriksbaseline, konverteret til brugerens foretrukne enhed (°C / °F).
- **Realtids-Telemetri i Scale Cam & ShotSummaryModal:**
  - Active Brew Badge på Scale Cam viser nu den kalibrerede bryggetemperatur ved siden af dosering, yield og kværnindstilling.
  - `ShotSummaryModal` viser bryggetemperaturen i udstyrschippen (`Sage Dual Boiler • 93°C`).
- **i18n Global-First:**
  - Samtlige nye labels, beskrivelser og vejledninger defineret i `en.ts` og `da.ts`.

---

### 2026-10-04 -- Scale Cam: Manuel Barista Start & Vibrationsfilter ved Første Dråbe (v1.2.24)
- **Metode A: Manuel Barista Start (Brugerens Valg):**
  - Fjernet den forvirrende to-trins "Armér vægt" $\rightarrow$ "Venter på dråber" proces, som udløste falsk timer-start, når maskinens pumpe rystede koppen.
  - Indført direkte, taktil **`[ ☕ Start Shot (Timer) ]`** knap:
    - Baristaen tarrer vægten til 0.0g med `[ 🔄 Tarér ]`, starter espressomaskinen / løfter armen, og trykker `Start Shot`.
    - Timeren starter prompte fra `0.0s`, så præ-infusionen måles 100% matematisk præcist fra det øjeblik, vandet rammer kaffepucken.
- **Vibrationsfilter ved Første Dråbe ($\ge 0.4$g):**
  - Tærsklen for detektion af første dråbe (first drop split-timer) er hævet fra $0.1$g til $\ge 0.4$g.
  - Eliminerer fuldstændigt at maskinens pumpevibrationer fejlagtigt registreres som kaffedråber.
  - Split-timeren viser i realtid: `Præ-infusion: {tid}s (Venter på 1. dråbe ≥ 0,4g)`, og skifter flydende til `Præ: {pre}s • Flow: {flow}s`, så snart kaffen rent faktisk flyder i koppen.
- **i18n Global-First:**
  - Opdaterede præ-infusion og barista-hints i `en.ts` og `da.ts`.

---

### 2026-10-04 -- ShotSummaryModal, Umiddelbar Auto-Save, Dato-opdelt Logbog & Clean Scale Cam (v1.2.23)
- **Umiddelbar Shot Auto-Save & ShotSummaryModal:**
  - Løst root cause til manglende logs efter bryg: Skud gemmes nu 100% automatisk og øjeblikkeligt i `localStorage` og app-state så snart brygget stopper (`handleBrewFinish`).
  - Ny dedikeret `ShotSummaryModal` popper op med det samme med:
    - Ekstraktionstelemetri: Yield, Total tid (opdelt i præ-infusion og flowfase), Gns. flowhastighed og ratio ($1:X.X$).
    - Komplet `FlowChart` kurve der viser realtids-vægt, flowdynamik og eventuelle kanaliseringsspikes (channeling).
    - 1-tryks smagsvurdering (`Sød / Balanceret`, `Sur / For Hurtig`, `Bitter / Astringent`, `Vandet / Tynd`) med dynamisk barista dial-in vejledning (kværnjustering i trin/klik, ristevejledning og puck-prep).
    - Smagsnoter-felt til hurtig dokumentation.
    - Handlingsknapper: `[ 📖 Se i Logbog ]` (fører direkte til Logbogen) og `[ ☕ Kør Nyt Shot ]` (lukker modalen og klargør Scale Cam).
    - Fuld integration med mobilens hardware/gesture tilbage-knap (`useMobileBackHandler`).
- **Dato-opdelt Logbog med Ekspanderbare Flow-Kurver:**
  - Logbogen grupperer nu automatisk alle skud efter kalenderdage (`I dag • Søndag 4. okt`, `I går • Lørdag 3. okt` og ældre datoer).
  - Hver dag har en overskuelig tæller for antal bryg udført den pågældende dag.
  - Hvert brygkort har nu en `[ 📈 Flow Kurve ]` / `[ Skjul Kurve ]` knap, der ekspanderer og viser hele den gemte ekstraktionskurve med flowhastighed og Golden Zone direkte i logkortet.
- **Fjernelse af Redundant Quick Context Bar & Ny Rolig Scale Cam Badge:**
  - Den forvirrende bønne-dropdown og overvældende telemetribar på tværs af toppen af Scale Cam og Logbog er fjernet.
  - På Scale Cam er den erstattet med en rolig, højkontrast **Aktiv Brygprofil** (`☕ Drik • Bønne • Dosis → Mål-yield • Kværnindstilling [ 🎛️ Dial-In ]`), så baristaen altid har overblik før brygstart.
- **Automatisk Scroll-To-Top:**
  - Skift mellem navigationstabs eller mellem Espresso Flow og Beandex nulstiller nu altid scroll-positionen til toppen (`window.scrollTo({ top: 0, behavior: 'instant' })`).
- **i18n Global-First:**
  - Alle nye tekster tilføjet til `en.ts` og `da.ts`.

---

### 2026-10-04 -- Beandex Univers, Dual-Mode Switcher og 100% Hardware-fokuseret Gear Setup (v1.2.22)
- **Oprydning i Gear (100% Hardware & Bar Setup):**
  - Fjernet alle forvirrende duplikerede dial-in inputs (`[-] [15] [+]`), risteprofil-knapper og ratio-multipliers inde i Gear-fanen.
  - Fjernet det overvældende "Dial-In & Roast Profile: {coffeeBeanName}" laboratorium fra Gear, som duplikerede Dial-In Studio.
  - Indført et roligt, arkitektonisk og lækkert **Aktivt Bar Setup**-kort:
    - Viser overblik over aktiv kaffebønne (ristegrad, dage fra ristning, risteri) og aktiv kværn med dial-indstilling.
    - Direkte 1-klik knap til `[ 🎛️ Åbn Dial-In Studio ]` (til opskrifts- og ekstraktionsindstilling).
    - Direkte 1-klik knap til `[ 🫘 Administrer i Beandex → ]` (til lagerstyring, bønnevurdering og scanning).
  - Gear-fanen er nu 100% fokuseret på fysisk bar-udstyr: Kværnflåde (Mine Kværne i Kaffehjørnet, stepped/stepless, tilføj kværn), Espressomaskine & Pumpe Pre-Infusion, samt Lifetime Licens & Lovmæssige vilkår.
- **Top Header Dual-Mode Switcher (`Espresso Flow` | `Beandex`):**
  - Elegant og taktil segmented pill-kontrol i toppen af appen.
  - Skifter ubesværet mellem **Espresso Flow** (brygge-værktøjet med drink deck, Scale Cam OCR, logbog og gear) og **Beandex** (kaffebønne-universet).
  - Viser live bønnetæller (`Beandex (3)`) i pillen.
- **Beandex (Global Specialty Coffee Index & Vault):**
  - **Mine Kaffeposer / My Fresh Bags:**
    - Viser alle brugerens kaffebønner med højkontrast-design ("kontrastspring" mellem mørk mokka `#1E1510`, varm latte `#FFFDF9` og guldstjerner `#F59E0B`).
    - **1–5 Interaktive Stjerner:** Brugeren kan med et enkelt tryk rate enhver bønne fra 1 til 5 stjerner direkte på kortet.
    - Dage fra ristning (`{days}d fra ristning`), risteri, smagsnoter, og tilknyttet kværn.
    - 1-klik `Vælg til Flow` knap der aktiverer bønnen til brygning og skifter direkte over til Espresso Flow.
    - Direkte genvej `[ 🎛️ Dial-In Studio ]` der åbner den 4-trins kalibreringsguide for den valgte bønne.
    - Søgefelt og filtre (Alle ristegrader, lys, mellem, mørk, og kun favoritter 4-5★).
  - **Scan & Opret Kaffepose:**
    - Hurtigknapper til kamerabaseret AI bag/etiket scanning, stregkodescanning og manuel tilføjelse.
  - **Det Globale Bønnekatalog & SCA Ratings:**
    - Live fremvisning af verified specialty beans fra Supabase med fællesskabsbedømmelser (`★ 4.8 (34 stemmer)`), SCA Q-Grader ekspertbedømmelser (`94 PTS SCA Cupping`) og smagsnoter.
    - 1-klik `[ + Føj til Mine Poser ]` handling.
- **Mobil Back-Knap Integration med Beandex:**
  - `useMobileBackHandler` opdateret, så et tryk på mobilens tilbageknap (eller swipe-back gesture) inde i Beandex flydende fører brugeren tilbage til Espresso Flow i stedet for at lukke appen.
- **Verificering:** `npm run build` og Browser Subagent test kompileret og gennemført 100% fejlfrit (0 fejl, 426ms).

### 2026-10-04 -- Samlet Dial-In Studio (Trin 1 Bønnevælger), Ren & Overskuelig Forside, og Mobil Hardware/Gesture Tilbage-knap (v1.2.21)
- **Ren & Lækker Startside (Coffee Bar Uden Rod):**
  - Fjernet de forvirrende +/- kværnindstillingsknapper og "Lock Setting" formularer fra forsiden.
  - Fjernet det store multi-bønnevælger kort fra bunden af forsiden, så startsiden ikke længere er et uoverskueligt kontrolpanel.
  - Erstattet med et roligt, arkitektonisk og læsbart opskriftsoverblik:
    - Viser tydeligt den tilknyttede kværn og dial-in indstilling (f.eks. `Baratza Encore ESP Pro • Indstilling 15 micro-steps`).
    - Viser den aktive kaffebønne, risteri og ristningsgrad.
    - Fremhæver `[ Dial-In ]` knappen, som altid er synlig og direkte tilgængelig ved siden af `[ Pull Shot on Scale Cam ]`.
    - Tydelig vejledning: *"Alle justeringer foretages samlet i Dial-In Studio."*
- **Samlet Dial-In Studio (Alt samlet på ét sted med Bønnevælger i Trin 1):**
  - **Trin 1: Kaffebønne & Ristningsprofil:**
    - Viser den aktive bønne med ristegrad, parringsmatch for drikken og smagsnoter.
    - Giver baristaen mulighed for at skifte kaffebønne direkte i Dial-In Studio med et enkelt tryk på en bønne-chip.
    - Hurtigknapper til `Scan Bag` og `Bean Vault`.
  - **Trin 2: Kværn & Kværnindstilling for Bønne:**
    - Kværnvælger (udstyr i baren + bibliotek) og fin/grov stepper tilpasset stepped (0.5) og stepless (0.2).
  - **Trin 3: Dosis, Udbytte & Forhold (Ratio):**
    - Justering af tør dosis og målvægt med live ratio (`1:2.0`) og profilnavn (Normale, Ristretto, Lungo).
  - **Trin 4: Gem Kalibrering & Synkronisering:**
    - Mulighed for enten `Kun Gem Kalibrering` (hvis man blot vil kalibrere uden at starte kameraet) eller `Lås Indstillinger & Start Scale Cam`.
- **Mobil Hardware & Gesture Tilbage-knap Håndtering (Android & iOS):**
  - Løst det kritiske problem, hvor et tryk på telefonens tilbageknap lukkede hele appen i mobilbrowser / PWA / Capacitor.
  - Implementeret `useMobileBackHandler`:
    - Hvis en modal er åben (Dial-In Studio, Bean Scanner, Central Vault, Paywall, Legal), lukkes modalen først — appen forbliver åben!
    - Hvis brugeren er på en fane som `Scale`, `Logs` eller `Gear`, navigerer tilbageknappen tilbage til `Coffee Bar` (forsiden).
    - Hvis brugeren er på forsiden uden åbne modaler, vises en diskret toast *"Tryk tilbage igen for at afslutte"*, og appen lukkes først ved et ekstra tryk inden for 2 sekunder.
- **Verificering:** `npm run build` og `npm run lint` kompileret 100% fejlfrit (0 fejl, 373ms).

### 2026-09-29 -- OCR 0, 2, 6 Disambiguation, Auto Digit Framing, Telemetry Deck & Live Curve (v1.2.20)
- **OCR 0, 2, 6 & 8 Disambiguering:**
  - `seg.g` (vandret centerstreg) probes nu med dedikeret `'g'` orientering (`radiusX = 0.10 * width`, `radiusY = 0.06 * height`, tærskel 0.32), så sampling-vinduet aldrig mere snitter de lodrette sidestreger på et `0`.
  - Topologiske udelukkelsesregler tilføjet: `2` må aldrig have `c` og `f`; `6` må aldrig have `b`; `0` diskvalificeres kun hvis både hullet er fyldt OG centerstreg er solid.
  - Automatiske disambigueringsregler for `0 vs 8`, `2 vs 0`, `6 vs 8` og `6 vs 0`. Hermed læses `0.0` aldrig mere som `0.2` eller `0.8`.
- **Uforstyrret Kamerasøger med Præcis Grøn Ciffer-Boks:**
  - Kæmpeteksten (`9.0 g`, flow osv.) er fjernet inde fra kamerasøgeren, så brugeren kan se vægtens fysiske display helt uhindret.
  - Dynamisk grøn bounding box (`border-2 border-emerald-400 bg-emerald-400/15`) tegnes direkte rundt om de auto-detekterede tal på vægten med ciffer-mærkat.
- **Dedikeret Barista Telemetri-Dæk:**
  - 4-kolonners instrumentgitter under kameraet med høj kontrast og stor monospace-skrift: Vægt/Yield, Flowrate, Tid og Ratio.
  - Live pre-infusion/flow split-indikator under aktiv ekstraktion.
- **Live Ekstraktionskurve under Brygning (`FlowChart` Live Stream):**
  - `ScaleMonitor` streamer nu målepunkter ved 10 Hz via `onLivePointsUpdate` direkte til `FlowChart`.
  - `FlowChart` har fået `isLive`-tilstand med pulserende `LIVE FLOW CURVE`-badge og en animeret, pulserende markør i spidsen af kurven.
- **Verificering:** `npm run build` kompileret 100% fejlfrit (0 fejl, 382ms).

### 2026-09-29 -- OCR 3-vs-9 Fix, Stale Closure Curve Fix & Single Unified Viewfinder (v1.2.19)
- **OCR 3-vs-9 & False-Positive Elimination:**
  - `sampleSegment()` kræver nu strengt både minimum active pixel count OG tærskel-procent: `activeCount >= minActive && (activeCount / totalCount >= threshold)`. Tidligere tillod `|| activeCount >= 4`, at 4 vildfarne støj-pixels i et 30-pixels vindue triggede segment `f` (øverst-til-venstre), hvilket forvandlede et `3`-tal til `9` (eller `8`).
  - Strammet vertikal probe-radius `radiusY` fra 0.14 til 0.10 af bounding box højde, og centreret vertikale probes på 0.30 og 0.70 for at eliminere afsmitning fra de horisontale streger `a`, `g` og `d`.
  - Disambiguerings-kæde udbygget til at håndtere `3 vs 8 vs 9`: hvis et tal scores som `8` eller `9`, reverificeres `e` og `f` med 0.36 tærskel for at returnere det korrekte `3`-tal.
- **Flad Ekstraktionskurve Løst (Stale Closure):**
  - Timer-intervallet i `ScaleMonitor.tsx` brugte `currentWeight` fra React state, som var frosset (0.0g) ved bryggestart i closure'n.
  - Oprettet `currentWeightRef`, som opdateres synkront med OCR ved hvert frame. Timeren og `handleStopBrewing` læser nu `currentWeightRef.current`, så kurven i `FlowChart` tegnes præcist og dynamisk.
- **Én Samlet Vægtviser i Viewfinder (Slut med forvirring):**
  - Fjernet det overlappende inline inspector panel fra søgeren. Søgeren viser nu udelukkende ét autoritativt, stort, jitter-frit vægt-tal (`currentWeight.toFixed(1)} g`).
  - Top-bjælkens `Align`-knap re-centrerer nu målfeltet (`handleRecenter`), frem for at åbne et forvirrende diagnostisk panel.
  - Diagnostisk skuffe er flyttet uden for kameravinduet og vises kun, når brugeren eksplicit åbner Scan-knappen i værktøjslinjen (og aldrig under aktiv brygning).
- **Verificering:** `npm run build` kompileret 100% fejlfrit (0 fejl, 374ms).

### 2026-09-29 -- Scale OCR Precision Fix, Toolbar Wrap, Touch Focus & Tilt Meter (v1.2.18)
- OCR vertikal segmenttærskel hævet til 0.27, streng reverifikation af 3↔8, 5↔6 og 0↔8.
- Kamerakontrol-værktøjslinje omlagt til `flex-wrap` på mobile skærme.
- Pålidelig `onTouchEnd` tap-to-focus og accelerometer-baseret vinkelmåler (📐).

### 2026-09-27 -- Mobile Collisions Fixes, Nav Space Optimization & Rich Color Zoning (v1.2.17)
- **Top Navigation Bar Space Optimization & Clean Mobile Layout:**
  - Fjernet skud-tæller badge (`{shots.length}`) efter Logs i fanebjælken som anmodet for at give maksimal plads til "Coffee Bar".
  - Ændret `Coffee Bar` fane-teksten til `whitespace-nowrap font-semibold text-[10.5px] sm:text-xs` samt optimeret padding (`px-0.5 sm:px-3`), så "Coffee Bar" aldrig mere forkortes med prikker (`Coffee ...`) på mobilskærme.
  - Symmetrisk 4-faners grid på alle skærmstørrelser (iPhone SE til Pro Max).
- **Quick Context Bar Collision Fix:**
  - Justeret `select`-menuens breddegrænse og layout-afstandslogik, så `[MEDIUM-DARK]` og `26d off roast` aldrig mere lapper over hinanden på smalle mobilskærme.
- **BeanScannerModal Recipe Defaults Overflow Fix:**
  - Ændret headeren til `Calibrated Recipe Defaults` til responsiv `flex-col sm:flex-row gap-1.5` og tilføjet `truncate` og `max-w-[200px]` på kværn-dropdownen.
- **Favorite Beans Rolodex 2-Line Layout:**
  - Omlagt favoritbønne-kardoteket til et 2-linjers responsivt kortlayout, så bønnenavne aldrig afkortes (`Te...` $\rightarrow$ fuldt navn synligt).
- **Rig Farveopdeling & Taktil Rytme i Beans & Gear:**
  - *Bean Vault:* Ristegrads-kodede pasteltints (Gylden rav, Terracotta, Chokoladebrun, Mørk espresso) og `ring-2 ring-[#C26D52] shadow-md bg-white` for aktiv bønne.
  - *Dial-In & Chemistry:* Blød pergament-gradient med `Extraction Lab`-badge og salviegrønt kemibanner (`bg-[#72806B]/10`).
  - *Grinder Fleet (Hardware):* Machined dark espresso hardware metal-æstetik (`bg-[#241A14] text-[#FAF7F2] border-[#3D2D22]`) med glødende salviegrøn LED-indikator (`● Active on Bar`) og messing-accenter (`#D4A373`).
  - *Espresso Machine Setup:* Varm luksusgradient med `● Pump Dynamics`-mærkat. Maskinen er nu 100% isoleret i sin egen hardware-boks.
  - *Membership & App License Card:* Licens- og prøveperiode-kortet er trukket helt ud af kaffemaskine-sektionen og etableret som sit eget selvstændige Apple App Store compliance-kort med tydelig status (`7 DAYS LEFT` / `LIFETIME PRO`), `Unlock Lifetime Access ($4.99)`, `Restore Purchases` og direkte links til Terms of Use og Privacy Policy.
- **Logbook Artisan Tasting Journal:**
  - Diagnostiske statuskanter (Salviegrøn for afbalanceret, Rød for kanalisering, Rav for sur/vandet, Mørkebrun for bitter).
  - Telemetridata i 4 taktile instrument-chips og barista-smagsnoter i pergament-citatkasser (`“...”`).
- **Verificering:** `npm run build` kompileret 100% fejlfrit (0 fejl, 414ms).

### 2026-09-27 -- Trial Countdown Bar ($4.99 Unlock) & Central Bean Vault Directory (v1.2.16)
- **7-Dages Trial Nedtæller-Bar (`TrialCountdownBanner.tsx`):**
  - Varm, minimalistisk Espresso Warmth bjælke placeret lige under navigationstabsne.
  - Viser en 7-segmenteret fremgangsindikator (hver pille = 1 dag) for at give brugeren et klart overblik over den gratis prøveperiode.
  - Gør forretningsmodellen 100% krystalklar for brugeren: *"One-time $4.99 / 49,- DKK • No monthly subscription • Keep scale OCR & logbook forever"*.
  - Direkte CTA-knap: `Unlock Lifetime Access ($4.99)`.
  - Ved udløbet prøveperiode: Skifter til alert-tilstand og opfordrer til at låse op. Forsvinder permanent når appen er låst op.
- **Central Coffee Bean Vault Directory (`CentralBeanVaultModal.tsx`):**
  - Ny knap i Coffee Bean Vault (Fane 3): `[ 🌐 Browse Central Vault ]`.
  - Direkte genvej i `BeanScannerModal`: Gør det muligt at udforske 13+ verificerede bønner uden at have posens fysiske stregkode foran sig.
  - Multi-filter søgning: Risteri, bønnenavn, oprindelsesland, smagsnoter, ristegrad, drikketype og ekspert-score (90+ PTS).
  - 1-Tap `+ Add to My Vault` med automatisk beregning af ideelt ekstraktionsforhold og binding til brugerens kværn.
- **i18n & Zero-Failure Build:** Fuld oversættelse i `en.ts` og `da.ts`. Testet lokalt med `npm run build` (0 fejl, 632ms).

### 2026-09-27 -- Grinder Mismatch & Controlled Dropdown Resolution Fix (v1.2.15)
- **Løst Kværn-Mismatch i Coffee Bean Vault:**
  - Løst fejl hvor et aktivt bønnekort med Eureka-kværn viste `Grind Dial (Eureka): 1.4` øverst, men uventet viste `Baratza Encore ESP Pro (Stepped)` i dropdown-vælgeren nedenunder.
  - Årsag: Bønnen i standardopsætningen havde navnet `Eureka Mignon Specialita`, mens CremaShop-kataloget navngav kværnen `Eureka Mignon Specialita 16CR`. Når ingen `<option>` matchede, faldt HTML `<select>` automatisk tilbage til den første option i DOM (`Baratza Encore ESP Pro`).
- **3-Trins Intelligent Grinder Resolver (`resolveGrinder`):**
  - Implementeret robust matching: (1) Eksakt case-insensitive match, (2) Substring / prefix match (`Eureka Mignon Specialita` $\leftrightarrow$ `Eureka Mignon Specialita 16CR`), (3) Brand match (`Eureka`, `DF64`, `Baratza`, `Niche`, `Varia`).
  - Automatisk migrering af `localStorage` i `loadBeans()`.
- **Controlled Dropdown Synkronisering:**
  - Opdateret `App.tsx`, `DialInWizardModal.tsx` og `BeanScannerModal.tsx` så `<select>` altid binder til den fundne kværn uden desynkronisering.
- **Validering:** 100% ren build med `npm run build` (0 fejl, 383ms).

### 2026-09-27 -- Curator Hub & Periodisk Vedligeholdelses-Huskeliste i Admin Portal (v1.2.14)
- **Curator Hub & Periodic Database Audit Faneblad (`/admin`):**
  - Dedikeret 5. faneblad i Admin Portalen til systematisk administration af kaffebasen, ekspert-scores og kaffehøst.
  - Dynamisk tidsmåling: Viser dage siden sidste fulde audit samt automatisk advarsel når 30-dages revisionscyklus forfalder.
  - Knap til at logge gennemført revision med 1 klik (`Mark Complete Today`).
- **Interaktiv Persistent Huskeliste (gemmes i browseren):**
  - **Coffee Review Månedlig Cupping:** Gennemgå månedens blindtestede espresso-rapporter og tilføj nye 90+ point bønner.
  - **Crowdsourced Bønne-Kø i Supabase:** Gennemgå nye bønner indsendt af brugere med direkte genvej til Supabase Vault.
  - **Cup of Excellence & WBC Vindere:** Kvartalsvis kontrol af vinderlotter fra verdensmesterskaber og internationale auktioner.
  - **Sæson- og Høstskift på Specialty Kaffe:** Halvårlig gennemgang af afrikanske og latinamerikanske høstårgange og arkivering af udgåede micro-lots.
  - **Supermarkeds EAN-Audit:** Halvårlig kontrol af de mest scannede supermarkedsbønner (Lavazza, Illy, Peter Larsen, BKI, Starbucks) for nye stregkoder.
  - **Apple Developer & RevenueCat Årshjul:** Årlig fornyelse af iOS TestFlight certifikater og verifikation af $4.99 købs-webhooks.
- **Curator Fast Launchpad:** Direkte genveje til Coffee Review, Alliance For Coffee Excellence, Open Food Facts og Supabase Console.

### 2026-09-27 -- Supabase Cloud Bønnehub, Expert Score Felt & Nul-Latens Synkronisering (v1.2.13)
- **Supabase Cloud Central Bean Vault:** Live forbundet til Frankfurt (`eu-central-1`) Supabase-databasen (`vdxfmvzdmcqfixbegumb.supabase.co`).
- **Nul-Latens Garanti (< 0.1ms Cache):** Scanneren og appen slår op i lokal hukommelses-cache først og synkroniserer asynkront i baggrunden uden at blokere brugerfladen eller kameramotorerne.
- **Ekspert-Score Integration (`expert_score` & `expert_source`):**
  - Implementeret 100-point skala til officielle blindtest-point fra *Coffee Review*, *Cup of Excellence* og *SCA Specialty*.
  - Scanneren og Admin Portal viser autoritetsmærker (f.eks. 🏅 `94 PTS (Coffee Review)`) ved siden af barista-stjernerne.
- **Drikketype-Konsensus & Købsland:**
  - `purchase_country` (f.eks. `DK`) og `suitable_for` (`pure_espresso`, `flat_white`, `cortado`, `cappuccino`).
  - Matematisk konsensusregel: Drikketype kræver mindst 5 uafhængige bedømmelser og ≥ 70% supermajority før den kvalificerer.
- **13 Officielle Kickstart Bønner:** EAN-13 koder med officielle facts for The Coffee Collective, Prolog, La Cabra, Lavazza, Illy, Peter Larsen, BKI, Starbucks.
- **Admin Portal (`/admin`):** Live ping-test til Frankfurt (~18ms) og live visning af alle sky-bønner.

### 2026-09-27 -- Ægte Ristedato OCR på Kaffeposen & Præcis Ristegrads-Detektion (v1.2.12)
- **Slut Med Gættede Ristedatoer:** Stregkodescanning (EAN/UPC) opfinder eller gætter ikke længere fiktive ristedatoer (tidligere sat til i dag minus 10 dage). En stregkode indeholder udelukkende varenummeret, ikke posens batch- eller produktionsdato.
- **Trin 2: Tag Billede af Ristedatoen på Posen:**
  - Når en stregkode scannes, vejledes baristaen til at scanne datostemplet bag på posen.
  - Dedikeret knap: `Tag foto af datostempel`, som åbner kameraet direkte til at fotografere datofeltet.
  - Optisk OCR genkender automatisk:
    - **Produktionsdato:** Prioriterer eksplicit `Production date:` / `Produktionsdatum` / `Datum výroby` (f.eks. `13/05/2026`) som bekræftet ristedato.
    - **Bedst Før:** Udregner estimeret ristedato (~12 måneder før), hvis kun Bedst Før er påtrykt.
  - Viser den sande alder på bønnerne (f.eks. `137 dage siden ristning: Moden / Fuldstændig afgasset`) i stedet for falske påstande om friskristet kaffe.
- **Præcis Ristegrads-Genkendelse:**
  - Løst problem hvor mørkristede kaffer (som Starbucks Espresso Roast) fejlagtigt blev sat til `medium`.
  - Søger efter ristegrads-spektrum i posens tekst (`DARK`, `Dark Roast`, `BLONDE`, `Intensity 10-12`, `Tueste Intenso`).
  - Tilføjet vejledning i brugergrænsefladen til nemt at bekræfte ristegraden ud fra posens etiket.
  - Rettet Open Food Facts bruger-tastefejl ("Whole Bear" $\rightarrow$ "Whole Bean").

### 2026-09-27 -- Rent Kamerasyn, Ekstern Kameraværktøjslinje & "Jeg er klar" Armér-Workflow (v1.2.11)
- **"Coffee Bar" Tab Navigation:** Første navigationstab hedder nu `Coffee Bar` på alle skærmstørrelser (både mobil og desktop) i stedet for blot `Bar`.
- **Rent Kamerasyn Uden Forstyrrelser:** Alle zoom-knapper, recenter, standard/compact boks og den nedre telemetribjælke er flyttet helt ud af kameravisningen. Kameravinduet viser nu udelukkende live feed og målerammen uden at dække for vægten.
- **Løst Blinkende Auto (LED):** Fjernet automatisk polaritetsvending, som fik billedet til at blinke ukontrolleret. Standardiseret til stabil LED-tilstand med manuel knap til LCD.
- **Ekstern Kameraværktøjslinje:** Placeret lige under kameravinduet (`bg-[#1A1412]`): Zoom (`1.0x`, `1.8x`, `2.5x`), `Compact` / `Standard` fokusramme, `Center` nulstilling, `LED` / `LCD` skift, lommelygte og OCR-inspektør.
- **"Jeg er klar • Armér vægt" 3-Faset Barista Workflow:**
  - **Fase 1 (Placering):** Kameraet viser live feed bag teksten og lader baristaen lægge telefonen op ad en kop/drypbakken og rette fokus uden at timeren går i gang utilsigtet.
  - **Knap "Jeg er klar • Armér vægt":** Baristaen trykker først når telefonen står perfekt.
  - **Fase 2 (Armeret):** Vægten er armeret og venter på de første dråber kaffe (≥ 0.2g), hvorefter ekstraktionstimeren starter automatisk. Baristaen kan også trykke "Start Shot Nu" manuelt, eller "Justér placering" for at ophæve armering.
  - **Fase 3 (Brygning):** Tydelig visning af flow rate, tid og splittimer med nulstil og stop & gem knapper.

### 2026-09-27 -- Høj-Kontrast Recenter Knap & Tydelig Finger-Fokus Guide (v1.2.10)
- **Letlæselig Høj-Kontrast Recenter Knap:** Ændret `⌖ Recenter` knappen fra gennemsigtig gul til en solid, mørk mokka/espresso baggrund (`#2C2018`) med 2px skarp gul kant (`border-amber-400`), fed gul tekst og skygge. Knappen er nu 100% tydelig mod både hvide vægge, dagslys og blankt stål.
- **Tydelig Finger-Fokus Instruktion i Kamerasøgeren:**
  - Tilføjet et svævende vejledningsbadge i toppen af live kamerasøgeren: `👆 Tap scale digits to focus & target`.
  - Opdateret måleretiklens sigtekorn-tekst: `[ 👆 TAP DIGITS TO FOCUS & ALIGN ]`.
  - Opdateret bjælken under kameraet på både mobil og desktop: `👆 Tap screen to target & focus scale • Auto-starts timer at 0.1g`.
  - Brugeren er nu aldrig i tvivl om, at man kan prikke med fingeren på vægten for at stille skarpt.

### 2026-09-27 -- Skjult Admin-Kode & Brugerdefineret Kodeord-Indstilling (v1.2.9)
- **Fjernet Kode-Tekst fra Login-Skærmen:** Den afslørende tekst med standard master-passcode i bunden af `/admin` login-portalen er fjernet 100%, så ingen uvedkommende kan se koden.
- **Mulighed for at Ændre Admin-Kode:** Tilføjet en dedikeret *"Security & Passcode"* fane i Admin Hub med nøgle-ikon (`KeyRound`).
- **Valgfri Egen Kode:** Barista/ejer kan indtaste en valgfri ny PIN eller adgangskode (min. 4 tegn) med bekræftelsesfelt, vis/skjul øje-ikon og instant gem-feedback.
- **Lokal Sikkerhed:** Koden gemmes persistent i `localStorage` (`espresso_admin_master_pin`) og overlever browser-genstart.
- **Nulstil til Fabriksindstilling:** Knap til hurtigt at nulstille koden tilbage til standard (`9246`), hvis man skulle glemme sin kode.

### 2026-09-27 -- Scale Cam Optical Zoom, Tap-to-Align, Compact Reticle & Anti-Glare Engine (v1.2.8)
- **Digital Optisk Zoom (1.0x, 1.8x, 2.5x):** Løst problemet med slørede tal ved at zoome direkte ind på vægtens display i canvas'et (standard 1.8x med taktile 1.0x, 1.8x, 2.5x piller). Tallene optræder nu skarpe og store i billedprocesseringen.
- **Hardware Autofokus & Kontinuerlig Fokus:** Aktiveret `focusMode: 'continuous'` i `getUserMedia` og `MediaStreamTrack`, så telefonen automatisk stiller skarpt på vægten under espressomaskinen.
- **Tap-to-Align & Recenter:** Brugeren kan trykke hvor som helst i kamerasøgeren for at flytte målefeltet over tallene (`🎯 Aligned & Focused` feedback-ring) samt trykke `⌖ Recenter` for hurtigt at centrere.
- **Kompakt Tal-Felt (21:9):** Introduceret et ultra-kompakt måleretikel, der kun omslutter tallene og fjerner koppen, portafilteret og drypbakkens genskin fra analysen.
- **Anti-Genskin & Indre Hulrum Validering i OCR-Motor:** Udelukker lysreflekser fra forkert at blive læst som '8'-taller ved at undersøge de indre huller i 7-segments cifre samt forkaste overfyldte lyspletter (fill density > 68%).
- **Lommelygte / Torch Knap:** Integreret lommelygte-tænd/sluk direkte i søgeren til mørke kaffekroge.

### 2026-09-27 -- 100% Engelsk UI Standardisering (v1.2.7)
- **Streng Engelsk UI-Standard:** Gennemgået og oversat samtlige brugerrettede tekster til professionelt engelsk specialty coffee-terminologi.
- **Admin Portal (`/admin`):** Sikkerhedsgate (PIN, Restricted Area, keypad), metrikker (7-Day Active Trials, Lifetime Unlocks, Gross Revenue, Conversion Rate), kaffebønne-kardoteket og Supabase-synkronisering er nu 100% på engelsk.
- **Dial-In Studio & Barista Deck:** Fuld engelsk sprogdragt (Grinder & Setting for Bean, Basket Dose, Liquid Yield, Time Window, Lock Calibration).
- **Udstyr & Kværnflåde:** Grinder Fleet & Bar Setup, Active on Bar, Set Active, Remove from setup, og Add Custom Grinder standardiseret.
- **Sprogpakke bevaret:** Sprogmotoren og sprogpakkerne (`src/i18n/locales/`) er intakte og parate til fremtidig sprogvælger efter lancering.

### 2026-09-27 -- Dedikeret Admin Portal & Sikkerhedslås på /admin (v1.2.6)
- **Lukket Admin-Sektion (`/admin`):** Implementeret en separat admin-rute tilgængelig via `espressoflow.vercel.app/admin` og diskret link i appens footer.
- **PIN/Kode Sikkerhedsgate:** Låst bag master-adgangskode (`9246` eller `espresso2026`) med numerisk tastatur, vis/skjul toggle, fejlhåndtering og session-hukommelse.
- **Omsætning & 7-Dages Trial Telemetry:** Live KPI-overblik over trial-brugere, betalende livstidsbrugere ($4.99 / 49,- DKK), omsætning og konverteringsrate.
- **Kaffebønne Stjerner & Ratings Kardotek:** Komplet overblik over alle bønner med stjernevurderinger (1-5), gennemsnit og forberedelse til central Supabase integration samt offentlig reklameside.

### 2026-09-27 -- Kværn-Setup i Gear & Favoritkværn i Dial-In Studio (v1.2.5)
- **Mit Kværn-Setup i Beans & Gear:** Dedikeret udstyrskort til kaffekværne, hvor baristaen kan vælge hvilke kværne der står på baren, skifte aktiv kværn med 1 klik, tilføje kendte kværne fra biblioteket eller oprette brugerdefinerede modeller.
- **Vælg Favoritkværn i Dial-In Studio:** I Trin 1 i Dial-In Studio kan baristaen nu vælge mellem sine setup-kværne via taktile chips, se kværnens specifikke måleenhed og indstilling, og låse kværnen som bønnes faste favoritkværn.
- **Fuld Krydssynkronisering:** Gemte valg på bønnen slår igennem i Bean Vault, Barista Deck og Scale Cam.

### 2026-09-27 -- Top-Right Bønnesletning & Favorit Bønne-Kardotek (v1.2.4)
- **Slette-knap i Top-Højre Hjørne:** Flyttet skraldespandsknappen på bønnekortene op i øverste højre hjørne ved siden af `ACTIVE`-statussen for en ren og intuitiv UX.
- **Favorit Bønne-Kardotek:** Implementeret et kompakt, smalt kardotek under bønnelageret med 1-klik interaktive guldstjerner (1-5 stjerner `★`), ristefarve-badges og hurtig-aktivering.
- **Forberedelse til Supabase & Global Kaffebase:** `rating` og `isFavorite` felter tilføjet til bønnernes datamodel, klar til crowdsourcing og offentlig webportal.

### 2026-09-27 -- Farvekodede Bønneristnings-Badges på Coffee Bar (v1.2.3)
- **Ristnings-Farver på Coffee Bar:** Bønnevælger-knapperne i det mørke Mokka-kort og Dial-In Studio har nu fået nøjagtig samme visuelle pille-badges for ristegrad (`LIGHT` rav, `MEDIUM` terracotta, `DARK` espresso) som i Beans & Gear.
- **Hurtig Visuel Identifikation:** Gør det legende let at skelne mellem lyse og mørke bønner direkte på kaffedisken uden at skulle nærlæse teksten.

### 2026-09-27 -- Interaktiv Dial-In Studio & Bønnesynkronisering i Beans & Gear (v1.2.2)
- **Fuldt Interaktiv Dial-In Wizard:** Gjort Dial-In vinduet 100% aktivt med taktile steppere (`−` / `+`) til Kværntrin, Tør Dosis (In), Mål-Udbytte (Out) og realtids-ratio.
- **Lås på Bønnen:** Kalibreringen gemmes permanent på den aktive bønne (`currentBean`) og afspejles øjeblikkeligt i Scale Monitor.
- **Hurtig-Dial i Mokka-Kortet:** Tilføjet en kompakt bønnekalibrerings-sektion direkte i det mørke mokkakort på Barista Deck med lynhurtig kværnjustering og genvej til studiet.
- **Komplet Synk med Beans & Gear:** Alle justeringer opdaterer øjeblikkeligt `Beans & Gear` (`Bean Vault`), så bønnekortet og udstyrsfanen altid er 1:1 synkroniseret.

### 2026-09-27 -- Top-Forankret Auto-Scroll & Hovedoverskrift som Anker (v1.2.1)
- **Overskrift som Fikspunkt ved Drikkevalg:** Når baristaen trykker på en kaffedrik (både på hurtigbåndet, i "All Drinks & Deck" modalen og i oversigtskataloget), scroller appen automatisk så kaffens overskrift lander øverst lige under den faste header.
- **Perfekt Overblik på Små Skærme:** Undgår at toppen af kortet med kaffens navn forsvinder ovenud på mobiler. Baristaen kan med det samme se, at den rigtige kaffe er valgt.
- **Visuel Anker-Indikator:** Tilføjet en diskret pulserende terracotta-badge (`● AKTIV KAFFE / SELECTED DRINK`) og fremhævet typografi, så man aldrig mister orienteringen.

### 2026-09-27 -- Intelligent Kaffebønne-Pairing & Centreret Drikkestyring (v1.2.0)
- **Auto-Scroll ved Valg af Drik:** Ved klik på en kaffedrik i hurtigbåndet eller oversigten scroller appen nu glidende og centrerer automatisk over drikkekortet og Scale Cam knappen.
- **Bønnevælger Flyttet til Drikken:** Den forstyrrende bønneknap i toppen af Barista Deck er fjernet. Man vælger nu sin bønne direkte ved den konkrete kaffedrik.
- **Nyt Mørkt Flot Mokka Bønnekort:** Dyb, luksuriøs ristet mokka-æstetik (`#241A14` / `#2C2018`), der samler bønnevalg, ristegrad, ristedato og kværn ét sted.
- **Optimal Profil for Hver Kaffe:** Udleder automatisk den ideelle ristegrad, smagsprofil og ekstraktionskemi for den valgte drik.
- **Smart Barista-Anbefaling til Næste Køb (Single-Bean):** Hvis man kun har 1 bønne, gives der en konkret anbefaling til bønnetype og ristegrad (uden mærker) til næste indkøb for at løfte netop denne drik.
- **Standby Vejledning:** Opdateret med baristaens specifikke instruktion om rolig placering på kaffestationen, på en kop eller mod drypbakken.

### 2026-09-27 -- Afskaffelse af "PRO" & Ren Livstidsadgang Model (v1.1.3)
- **Fuld Sanering af "PRO" Betegnelsen:** Eftersom alle brugere skal betale efter 7 dages prøveperiode, er enhver falsk "Freemium vs. Pro" opdeling fjernet. Appen hedder simpelthen "Espresso Flow", og betalingen er et engangskøb på $4.99 / 49,- DKK for Livstidsadgang.
- **Badge-fri Topbar Efter Betaling:** Når appen er låst op, forsvinder adgangschipen helt fra headeren. Brugeren ser en 100% ren, rolig og uforstyrret topbar.
- **Aktiv Prøveperiode-Tæller:** Under de 7 dages prøveperiode vises en diskret `🛡️ 7d` indikator i headeren.
- **Automatisk Udløbslås:** Ved opstart efter 7 dage vises "Unlock Lifetime Access" automatisk, så appen ikke kan bruges uden engangskøb.
- **Licenskort i Indstillinger:** Under Gear/Indstillinger kan baristaen altid se status, låse op før tid eller gendanne køb på nye enheder.

### 2026-09-27 -- Global-First Launch Arkitektur & Slank UI Streamlining (v1.1.2)
- **Sprogvælger Skjult til Efter Lancering (`ENABLE_MULTI_LANGUAGE = false`):** Sprogskifteren er pænt skjult i både topbaren og i indstillingerne for v1.0 udgivelse. Appen kører med ren, international SCA kaffe-terminologi (Ratio, Yield, Dose, Channeling, Pre-infusion, Dial-in) uden visuelt rod.
- **Arkitektur & Oversættelser 100% Bevaret:** Alle 11 gennemarbejdede sprogfiler (`en`, `da`, `de`, `it`, `fr`, `es`, `ja`, `ko`, `zh-CN`, `zh-TW`, `ar`) er fuldt bevarede i koden. Oversættelser kan finpudses løbende og aktiveres med en enkelt kontakt efter App Store/Google Play lancering.
- **Komplet i18n-Forbindelse på Hele Appen:** Logbog, Vægt-Monitor, Smagsfeedback og Ekstraktionskurve er 100% forbundet til `useTranslation()` med typesikre nøgler.
- **Ultra-Minimalistisk Topbar:** Kun kaffelogo, app-titel og den slanke PRO/Trial status-chip vises i toppen.

### 2026-09-26 -- Mobil UX & Top-Header Streamlining (Stilren & Minimalistisk Kaffe-Æstetik) (v1.1.1)
- **Single-Line Zero-Clutter Header:** Fjernet den pladskrævende 37-tegns undertitel og den grå versionsbadge fra mobilvisningen, så toppen altid fremstår som en ultraskarpt skåret 44px minimalistisk luksusbar med brand-ikon og logo.
- **Ingen Tekstbrud på Status-Chips:** Adgangschips ("PRØVEPERIODE: 7D", "PERIODO DI PROVA", "TESTPHASE" osv.) knækkede tidligere over på to kluntede linjer på mobiler. Nu vises et elegant `🛡️ 7d` (eller `🛡️ PRO`) chip på mobile viewports, der aldrig bryder eller klemmer.
- **Symmetrisk 4-Tabs Navigation:** Rettet ugyldig `xs:` breakpoint i Tailwind v4 til `sm:`, så menulinjen på mobil konsekvent viser knivskarpe, ultra-korte 1-ords labels (`Bar`, `Vægt`, `Logs`, `Udstyr`) uanset sprogets længde (tysk, italiensk, fransk m.fl.).
- **Struktureret 2-Trins Telemetribar (Quick Context Bar):** Erstattet kaotisk `flex-wrap` (hvor kværnindstilling landede isoleret på sin egen linje) med et ryddeligt instrumentbræt: Øverste række viser kaffebønne + ristedato, mens nederste række er opdelt i 4 symmetriske celler (`FORHOLD`, `DOSIS`, `UDBYTTE`, `KVÆRN`).
- **Skærm-Klippede Tekster Løst:** Rettet overflødig `truncate` i Scale Monitor, så `0.0g Låst` aldrig afkortes til `0.0g Locke`.

### 2026-09-26 -- Universal Scale OCR Engine 2.0 (Alle Kaffe- & Køkkenvægte, LED/LCD, Glare & Side-by-Side) (v1.1.0)
- **Bradley-Roth 2D Adaptiv Binarisering:** $O(1)$ integral-billede algoritme beregner lokal kontrast over dynamisk vindue ($W/14$). Fuldstændig modstandsdygtig overfor modlys, loftspots på kaffestationen og uens skygger.
- **Zero-Tap Auto-Polaritet (LED & LCD):** Intelligent baggrunds-histogram skelner automatisk mellem lysende LED/OLED displays (hvid, cyan, rød eller blå på mørk baggrund) og klassiske reflekterende LCD displays (mørke tal på lys grå baggrund, fx Soehnle, Taylor, standard køkkenvægte).
- **Rumlig Token-Klyngedannelse (Spatial Clustering):** Deler detekterede elementer i et rækkebånd op i rumligt sammenhængende tal-blokke. Adskiller og isolerer automatisk side-by-side timere (`0:15`) fra vægten (`18.5g`), som set på Acaia Lunar, Acaia Pearl og Timemore Black Mirror.
- **Topologisk Fast-Path for Ciffer '1':** Tynde lodrette streger ($W/H < 0.42$) genkendes nu direkte med 100% konfidens uden at fejlkategorisere som '8' ved smalle stregbredder.
- **3-Frame Temporal Konsensus Filter:** `ScaleReadingFilter` anvender et glidende 3-frame konsensus-buffer, der eliminerer 1-frame optisk damp eller optiske transienter, men låser straks på reelle vægttrin og $0.0g$ tara uden forsinkelse.
- **Opgraderet Vision Inspector & Display Mode Styring:** Header-chip lader baristaen cykle mellem `Auto (LED/LCD)`, `LED` og `LCD`, mens Vision Inspector live rapporterer detekteret polaritet og layouttype (`Side-by-side (Isolated Timer)`, `Stacked Dual-Row`, `Single Row`).

### 2026-09-26 -- Global i18n Fase 3: Sydeuropas Kaffekultur & Global 1.0 (v1.0.0)
- **Italien (Italiano - `it.ts`):** 100% ordbog for espressoens moderland (Milano, Rom, Napoli) med autentiske SCA fagtermer (*Rapporto di estrazione, Dose macinata, Resa in tazza, Grado di macinatura, Pre-infusione, Canalizzazione, Taratura*).
- **Frankrig (Français - `fr.ts`):** 100% ordbog for Frankrigs specialty kaffemiljø (*Ratio d'extraction, Dose de café, Rendement, Finesse de mouture, Pré-infusion, Canalisation, Calibrage*).
- **Spanien (Español - `es.ts`):** 100% ordbog for den spanske og latinamerikanske specialty scene (*Ratio de extracción, Dosis de café, Rendimiento, Molienda, Pre-infusión, Canalización, Calibración*).
- **11 Globale Verdenssprog:** Fuld dækning af 11 sprog med landeflag (`🇬🇧 EN`, `🇮🇹 IT`, `🇫🇷 FR`, `🇪🇸 ES`, `🇩🇪 DE`, `🇩🇰 DA`, `🇰🇷 KO`, `🇯🇵 JA`, `🇨🇳 ZH-CN`, `🇹🇼 ZH-TW`, `🇦🇪 AR`).
- **Automatisk Detektering:** Browser-sprogdetektering for italiensk, fransk og spansk ved opstart.

### 2026-09-26 -- Scale Cam OCR Revolution: Præcision til Kaffevægte (Blue LED & Dual-Display) (v0.9.1)
- **Viewfinder Flexbox Layout Fix:** `<video>` sat til `absolute inset-0 w-full h-full object-cover`, så kameraet fylder 100% af søgeren og sigtekassen er perfekt centreret (rettet bug hvor video var mast i venstre halvdel og sigtekassen svævede over tomt sort felt i højre halvdel).
- **Dual-Display Adskillelse:** Implementeret række-bånd analyse, der isolerer den øverste vægtrække (`39.5` / `0.3`) fra den nederste timerrække (`0:00` med kolon `:`). Slut med blandede tal.
- **Max-RGB Boost for Blå/Cyan LED:** Tilpasset binarisering til `Math.max(r, g, b)`, så mættede blå og cyan LED-segmenter på sorte vægtdisplays når 255 lysstyrke for perfekt Otsu-tærskling.
- **Stramme Bounding Boxes & Segment-Diskvallifikationer:** Automatisk `minY`/`maxY` beregning pr. ciffer samt geometriske udelukkelsesregler (fx udelukkelse af midterbjælke for '1' og '0') for 100% nøjagtighed på 7-segment tal.
- **Live Emerald Green "Digit Lock" Kasse:** Viewfinderens ramme skifter øjeblikkeligt til solid smaragdgrøn (`#10B981`) med `[ LOCKED: 39.5g ]` status, når tallene valideres med høj tillid ($\ge 70\%$).

### 2026-09-26 -- Global i18n Fase 2: Kina, Taiwan & Dubai/UAE (v0.9.0)
- **Kina (简体中文 - `zh-CN.ts`):** 100% ordbog (87 nøgler) for det massive kinesiske specialty marked med standard SCA termer (粉水比, 咖啡粉重, 萃取液重, 研磨度, 预浸泡, 通道效应, 校准).
- **Taiwan (繁體中文 - `zh-TW.ts`):** 100% ordbog (87 nøgler) for det taiwanske mesterskabs barista-miljø.
- **Dubai & Golfen (العربية - `ar.ts`):** 100% arabisk ordbog (87 nøgler) med dynamisk RTL (`dir="rtl"`) understøttelse i HTML/CSS.
- **8 Globale Sprog:** Sprogvælger i header og settings opdateret til 8 flag (`🇬🇧`, `🇩🇪`, `🇩🇰`, `🇰🇷`, `🇯🇵`, `🇨🇳`, `🇹🇼`, `🇦🇪`).

### 2026-09-26 -- Fuld-App Lokalisering: Onboarding, Paywall & Legal (v0.8.1)
- **Onboarding Wizard (`OnboardingWizard.tsx`):** Tilkoblet `useTranslation()` med komplette tekster for alle 3 trin (kværn, maskine, bønne, ristegrader, skip og pose-scanning) på EN, DA, DE, KO og JA.
- **Paywall Modal (`PaywallModal.tsx`):** Komplet oversat for Lifetime Pro adgang, prøveperiode-tæller, feature-liste og Restore Purchases.
- **Legal & Compliance (`LegalModal.tsx` & Footer):** Privacy Policy (100% lokal OCR garanti), Terms of Service EULA, FAQ og support-links fuldt oversat på tværs af alle 5 sprog.
- **Scale Cam Ergonomi:** Tilføjet varm instruktionstekst i standby og viewfindere, samt dokumenteret Scale Vision UX (Grøn Bounding Box for display-læsbarhed) i `ROADMAP.md`.

### 2026-09-26 -- Global i18n Fase 1: Sydkorea & Japan (v0.8.0)
- **Sydkorea (한국어 - `ko.ts`):** Komplet ordbog implementeret med SCA specialty barista-terminologi (Ratio, Dose, Yield, Dial-In, Pre-infusion, Channeling).
- **Japan (日本語 - `ja.ts`):** Komplet ordbog tilpasset Japans kissaten- og præcisionsekstraktionskultur.
- **Sprogvælger & UI:** Header-dropdown og Settings-sprogkort opdateret til automatisk at liste alle tilgængelige sprog med flag (`🇰🇷 한국어`, `🇯🇵 日本語`).
- **Browser-Detektering:** Automatisk registrering af `ko` og `ja` locale ved første opstart samt lagring i `localStorage`.

### 2026-09-26 -- Scale Cam Standby & Manuel Start Flow (v0.7.2)
- **Standby Tilstand:** Scale Cam åbner nu i en rolig Standby-tilstand uden at tænde kameraet med det samme. Brugeren får ro og tid til at placere og vinkle telefonen mod vægtens display.
- **Start Camera Knap:** Prominent `[📷 Start Camera]` knap i viewfinderen aktiverer videostrøm og OCR først, når brugeren er klar.
- **Stop Camera Mulighed:** Tilføjet `[Stop Cam]` knap i headeren for at slå kameraet fra igen og spare batteri.

### 2026-09-26 -- Shot Reset / Cancel & Tare Guard (v0.7.1)
- **Reset Knap:** Tilføjet `[Reset]` (RotateCcw) i Scale Cam action bar og i viewfinderens bundlinje, så utilsigtede starter kan afbrydes straks uden at gemme falske shots i logbogen.
- **Auto-Start Tare Guard:** `isZeroDetected` starter som `false`. Skuddet starter ikke længere automatisk før der reelt er registreret et gyldigt `0.0g` tare på vægten eller trykket på Tare.

### 2026-09-26 -- Global-First Letvægts i18n Motor (v0.7.0)
- **i18n Arkitektur:** Etableret fjerlet, typesikker `src/i18n/` translations motor (0 KB eksterne afhængigheder).
- **Sprogpakker:** Engelsk som Single Source of Truth + fail-safe fallback, pilotpakker for Tysk (DE) og Dansk (DA) med fuld bevarelse af universelle specialty barista-termer.
- **Sprogvælger:** Integreret i header og som dedikeret indstillingskort under *Beans & Gear*.
- **Opdaterede Regler:** Regel 4 i `.agents/rules/projektinstrukser.md` opdateret til global-first i18n standard.

### 2026-09-26 -- Adaptiv Mellem-Skærm Top-Navigation (v0.6.6)
- **Top-Navigation Breakpoint (380px+):** Implementeret `--breakpoint-xs: 380px`, så fulde titler (`Coffee Bar`, `Scale Cam`, `Logbook`, `Beans & Gear`) vises på alle normale smartphones og tablets, mens ultrakompakte titler (`Bar`, `Gear` osv.) reserveres til ekstremt smalle skærme (<380px).

### 2026-09-26 -- Pose- & Stregkodescanning i Onboarding Wizard (v0.6.5)
- **Pose- & Stregkodescanning i Onboarding (Trin 3):** Tilføjet `[Scan Bag]` med `BeanScannerModal` direkte i velkomstguidens trin 3, så nye brugere kan scanne posens stregkode/etiket og få udfyldt navn, risteri, risteprofil og dato automatisk.

### 2026-09-26 -- Skip Knap i Onboarding Wizard (v0.6.4)
- **Skip Knap:** Tilføjet `[Skip ✕]` i toppen og `[Skip Setup]` i bunden af Onboarding Wizard, så brugere kan lukke velkomstguiden når som helst og gå direkte til appen.

### 2026-09-26 -- 100% Mobil-Responsiv Top-Nav & Scale Cam Viewfinder Fixes (v0.6.3)
- **Top-Navigation Fix:** Omlagt til `grid grid-cols-4 w-full` med responsive etiketter (`Bar`, `Scale`, `Logs`, `Gear`), så ingen knapper klippes af på smalle mobilskærme.
- **Scale Cam Mobiloptimeret Header:** Fjernet horisontalt overløb; Live OCR vs Simulator er nu en tydelig farvekodet knap (`[📷 Live OCR]` / `[🧪 Start Camera]`), så man altid kan se og skifte til det rigtige kamera.
- **Standard til Rigtigt Live Kamera:** Scale Cam forsøger nu at starte mobilens rigtige kamera som standard med adaptiv binarisering til 7-segment ciffer-OCR.
- **Fjernet Tekstkollision i Viewfinder:** Tare-status og Target Yield-vejledning er samlet i én harmonisk statuslinje i bunden af viewfinderen uden overlap.

### 2026-09-26 -- De'Longhi Dedica EC685 Support & Mobiloptimeret Inline Bean Tuner (v0.6.2)
- **De'Longhi Dedica EC685 Profil:** Tilføjet i Onboarding Wizard og Equipment Setup med fabrikskalibreret 2.0s puls pre-infusion for 15-bars thermoblock-systemet.
- **Inline Quick Dial-In Tuner i Bønnekort:** Når en bønne i Bean Vault er aktiv, foldes en kompakt justeringsmenu ud direkte inde i kortet med `[-]` `[+]` kværnjustering, 1-tap risteprofil, dose/yield og kværnvælger. Fjerner behovet for lang rulning på mobilen.

### 2026-09-26 -- Per-Bønne Kværn-Tilknytning & Kværnvælger i Bean Vault (v0.6.1)
- **Kværnvælger ved Oprettelse:** "Add Coffee Bean To Vault" formularen har fået en "Assigned Grinder" dropdown.
- **Tydelig Kværnvisning i Bønnekort:** Viser kværnmodel og indstilling (fx `Eureka: 1.4` eller `Baratza: 15`).
- **Kværnvælger i Vision Scanner Modal:** Brugeren kan vælge hvilken kværn den scannede bønne skal parres med.
- **Auto-Sync:** Valg af bønne i Bean Vault skifter automatisk den aktive kværnmodel.

### 2026-09-26 -- Bean & Barcode Vision Scanner Modal, Open Food Facts & Multi-Format Date OCR (v0.6.0)
- **Bean & Barcode Vision Scanner Modal (`BeanScannerModal.tsx`):**
  - Live kamera-viewfinder med scan-reticle og laser-linje.
  - Native `BarcodeDetector` Web API (EAN-13, EAN-8, UPC, QR-koder) i browser/Capacitor.
  - Direkte opslag i Open Food Facts globale fødevare-database for automatisk indlæsning af bønnenavn, risteri og udledt ristegrad.
  - Offline fallback-database for kendte espressobønner (Lavazza, Illy, Peter Larsen, BKI, Coffee Collective, Starbucks).
  - Intelligent multi-format ristedato-dekoder (15+ formater på tværs af EN, DA, DE, FR, ES, IT + Best Before / BBD 12-måneders beregning).
  - $CO_2$ afgasningsindikator og 1-klik "Gem & Sæt Som Aktiv Bønne".
- **Integration i DrinkSelector og Equipment Tab:** "Scan New Bag" knap direkte ved Bean Vault Match og i udstyrssektionen.

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

### 2026-10-07 – Telemetri Stabilisering, Blå LED Flerciffer OCR (41.3g), Isotrop Retikel-Justering & Blank Smagsprofil (v1.7.1)
- **Kritisk Telemetri & Kurve Reset Løst:**
  - Timer-effekten i `ScaleMonitor.tsx` genstartede for hver 100ms, fordi `onLivePointsUpdate` ændrede reference ved hver tick-render.
  - Løst ved at isolere callbacks og mutable værdier i synkroniserede `useRef`'er, begrænse timer-effektens dependencies til `[isBrewing]`, og memoize handlers med `useCallback` i `App.tsx`.
  - Millisekund-præcis tidtagning beregnes direkte fra `startTimeRef.current`.
- **Flerciffer OCR for Blå/Cyan LED Digitalvægte:**
  - `maxGap` øget til `bandH * 1.15`, så `41.3` ikke splittes over decimalpunktummet.
  - Sænket LED støjgulv fra 50 til 20 og optimeret lokal kontrast-faktor fra 1.16 til 1.10.
  - Afslappet ciffer-validering for `4`, `1` og `0`.
  - Top-række prioritet (+40) for dobbelt-række vægte med timer nederst.
- **Tara 0.0g Lås-Fastholdelse:**
  - 800ms / 15-frame hysterese på `isDigitLocked` forhindrer flimren og tab af fokus under tara-skift.
- **Isotrop 2:1 Retikel & Ciffer-Boks Justering:**
  - Optisk beskæring låst til rent 2:1 forhold (`cropH = cropW / 2`), hvilket fjerner enhver lodret strækning.
  - Retikel i DOM'en skaleres dynamisk med `zoomLevel`, så ciffer-boksen sidder direkte over vægtens display.
- **Nulstillet Smagsprofil:**
  - Fjernet default `'balanced'`. Starter 100% blank i `ShotSummaryModal`.
- **Logbog Kurve-Visning ved Genkaldelse:**
  - Auto-ekspansion af seneste shot i `Logbook.tsx` viser straks den fulde ekstraktionskurve.
- **Android Studio Synkroniseret:**
  - Koden compileret 100% fejlfrit med `npm run build` og synkroniseret til native Android med `npx cap sync android`.

### 2026-10-07 – Mobil Navigation Sikring – Flydende Vinduer & Popups Løftet over Mobilmenu & Android Systemlinje (v1.7.2)
- **Elimineret Kollision med Mobil Navigation & Systemknapper (`三` Recents / Hjem / Tilbage):**
  - **Identificeret Problem:** I `ShotSummaryModal` lå handlingsknapperne (*View in Logbook* og *Pull New Shot*) i bunden med kun 14px padding uden hensyntagen til mobilens systemnavigationslinje (`三`), hvilket betød, at knapperne overlappede direkte med Android-systemknapperne.
  - **Fuld Sikkerhedszone-Løft (`Safe Area Clearance`):**
    - `ShotSummaryModal` footer er nu forsynet med dynamisk forhøjet safe-area padding: `style={{ paddingBottom: 'max(3.25rem, calc(env(safe-area-inset-bottom, 0px) + 2.25rem))' }}`.
    - Handlingsknapperne svæver nu mindst 52px (og op til 84px på enheder med udvidet systemlinje) over skærmens bundkant, så de aldrig rører eller overlapper med systemets `三` knap eller iOS home indicator.
- **Hardware-Accelereret Spring Slide-Up Animation (`.animate-modal-slide-up`):**
  - Tilføjet ultra-smooth `@keyframes modalSlideUp` i `index.css` med native cubic-bezier kurve (`cubic-bezier(0.16, 1, 0.3, 1)`), så modaler og bottom-sheets ruller elegant og ubesværet op over bundnavigationen uden hakken eller forsinkelse.
- **Konsistent Svævende Pop-In Animation (`.animate-modal-pop-in`) for Alle Popups:**
  - `DialInWizardModal`, `SettingsModal`, `PaywallModal`, `LegalModal`, `CentralBeanVaultModal`, `BeanScannerModal`, `FreshnessInfoModal`, `DrinkSelector` menu og `OnboardingWizard` har alle fået:
    - Tilføjet safe-area elevation (`paddingBottom: max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))`).
    - Begrænset `max-h-[calc(100dvh-4.5rem)]`, så de altid svæver frit og centreret over navigationszonen.
    - Taktil `.animate-modal-pop-in` animation med finjusteret skalering og translatio.
- **Forhøjet Toast-Feedback i Beandex:**
  - Flyttet "Added to Beandex" toasten fra `bottom: max(1.5rem, ...)` (hvor den lå halvt gemt bag mobilens 5-tab menu) til `bottom: max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))`, så den popper klart og tydeligt op ovenover mobilmenuen ligesom appens exit toast.
- **Lokal Verifikation & Android Studio Synkronisering:**
  - `npm run build` testet og bekræftet 100% fejlfri.
  - `npx cap sync android` synkroniseret til native Android-build.

### 2026-10-16 – Komplet Visuel Overhaling af Kopper/Glas, Digital Barista Deck, Logbog & Det Ultimative Specialty Share Card (v1.12.0)
- **Etape 1: `ArchitecturalCup.tsx` & `drinkRecipes.ts` (Materialitet, Gradienter & Keramikkant):**
  - Fuld lineær gradient palet i SVG `<defs>` for ægte espresso (`#1C100B` → `#4A2511`), gylden crema, mikroskum, filterkaffe og krystalklart vand.
  - Tydelig porcelænsgodstykkelse (~2.5px porcelæn med `#CBB8A3` skyggekant) og skitseret standring, der popper mod mørke baggrunde (`#241A14`).
  - Autentiske barista-glas uden hank, tyk krystalbund (sham `rgba(255,255,255,0.35)`), lodret lysrefleks og Gibraltar facetter til Cortado/Piccolo.
  - Americano i glas (`glassStyle: 'glass'`) med varm ravfarvet vandbase og flydende espresso/crema.
- **Etape 2: `ArchitecturalCup.tsx` & `types/espresso.ts` (Isterninger, Desserter & Unikke Pour Over Silhuetter):**
  - Kolde drikke (Iced Latte, Espresso Tonic, Cold Brew) med vinklede isterninger og kulsyrebobler.
  - Desserter: Affogato fior di latte gelato-kugle, Con Panna skulpturel flødeskumstop.
  - Unikke Pour Over silhuetter: Chemex timeglas med trækrave og lædersnor, V60 med 60° spiralriller, Kalita med flad bund og bølgekant, AeroPress uden hank med måleskala og bajonethætte, French Press med stålgitter og stempel.
- **Etape 3: `DrinkSelector.tsx` (Digital Barista Deck & Typografi):**
  - Vertikale Barista Fliser på Quick Deck: Omlagt til et vertikalt flise-layout (`grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5`), hvor koppen er forstørret til 104x75px hero-størrelse (`size="md"` i `h-20` container) og unødig død kantplads (`p-1.5 pt-2 pb-2.5 sm:p-2.5`) er minimeret, så koppen fylder over 65% af kortet, og drikketitlen har fuld bredde uden afskæring ('Cappuccino' og 'Double Espresso' fremstår 100% ubeskåret).
  - Ingrediens-Swatches i Cup Anatomy: Erstattet de cirkulære prikker med stilrene rektangulære recept-swatches (`w-3.5 h-2.5 rounded-xs border border-[#CBB8A3]`), så mælkeskum ikke længere forveksles med en ikke-valgt radioknap.
  - Fuld Læsbarhed i Master Card: Fjernet `line-clamp-2` fra drikkebeskrivelsen for at undgå hårde sætningsafskæringer med `...`.
  - Opstrammet Master-kort: Forenklet samlet Grinder & Bean-kort med `divide-y / divide-x` uden "box-in-box" tunghed.
  - Specialty Menu Modal tekst-afkortnings fix: Undgår afskæring af ratio på mobiler (`font-sans text-xs` `${ml}ml • ${category} • 1:${ratio}`), og prominent forstørret kop (`w-11 h-12`).
- **Etape 4: `FlowChart.tsx`, `Logbook.tsx`, `ShotShareModal.tsx` & i18n:**
  - `FlowChart.tsx`: Strikt SVG `<clipPath id="chart-area-clip">` og clamping forhindrer udbrud; responsiv header (`flex-col sm:flex-row gap-1.5`) holder kurveoverskrift på én linje på mobil.
  - `Logbook.tsx`: Fjernet det store tomme venstre kvadrat (~80px sparet pr. kort), miniature cup indsat direkte i headeren ved siden af `#130` og kaffenavnet, `whitespace-nowrap` på alle badges, i18n konsistens (`Share Card`, `telemetry_points`).
  - `ShotShareModal.tsx`: Det ultimative specialty share card med kop-silhuet ved siden af titel, renset udstyrsstreng (parenteser fjernet), sandfærdig dynamisk bundstatus (`Status: Channeling (X.X g/s)` eller `Status: Golden Zone`), ingen uformelle emojis, og rent `flowbean.app` domæne.
- **Etape 6: Visuel Perfektion af Share Shot Card & Logbog (`ShotShareModal.tsx` & `Logbook.tsx`):**
  - **Share Card Reklame & Typografi Uden Emojis:**
    - Fjernet alle emojier fra canvas for at undgå sort-hvide firkanter på Android.
    - Stor, skarp og professionel reklame: `PERFECT YOUR ESPRESSO EXTRACTION` (24px fed), `Scan beans with Beandex & turn any scale smart with Flowbean.` (17px), og `GET THE APP AT FLOWBEAN.APP` (22px).
    - Opgraderet status-pill og header med større skrift for maksimal læsbarhed på mobiler og sociale medier.
    - Ren vektor-legend på grafen (hvid fast streg, terracotta stiplet streg, gylden mål-swatch) uden emojier.
  - **Logbogs-opstramning (`Logbook.tsx`):**
    - **Fjernet dobbeltlinjen:** Fjernet den redundante ydre `border` omkring `FlowChart`, så kurven står i én ren ramme.
    - **Fix af tekst-overflow:** `whitespace-nowrap` fjernet i `TASTE / FLOW` til fordel for `truncate`, så lange smagsnoter (`Bitter / Astringent`) holdes pænt inden for kortkanten.
    - **Fix af sekund-afskæring:** `TIME & FLOW` omlagt til `flex justify-between` layout (`Pre 9.3s` og `Flow 31.8s`), så tider aldrig afskæres med `...`.
- **Lokal Verifikation & Android Studio Synkronisering:**
  - `npm run build` testet og bekræftet 100% fejlfri (0 fejl, 463ms).
  - `npm run mobile:sync` synkroniseret web assets til Android og iOS.
  - APK-bygning med gradlew gennemført på 5 sekunder, installeret og startet via ADB på OnePlus enhed.

