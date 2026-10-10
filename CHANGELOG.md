# 📜 FLOWBEAN – CHANGELOG

Alle væsentlige ændringer og milepæle i Flowbean dokumenteres i dette dokument i henhold til Semantisk Versionering (SemVer).

## [1.7.9] - 2026-10-10
### Etape 24: Knivskarp Roast Badge Kontrast, Persistent Basket Dose Hukommelse (17g) & Væskemekanisk Tids-Skalering
- **Knivskarp Roast Badge Kontrast (`MEDIUM-DARK` & Alle Ristningsgrader):**
  - **Identificeret Problem:** Badget under `ACTIVE COFFEE BEAN` og i Dial-In Studio anvendte en lyserød baggrund og bleg tekst (`text-[#E8C2B0]`), hvilket gjorde teksten ulæselig på den lyse pergament/latte-baggrund.
  - **Løsning:** Opdateret `getRoastBadgeStyles` i samtlige komponenter (`DrinkSelector.tsx`, `DialInWizardModal.tsx`, `App.tsx`) til en dyb, varm espressobrun palette (`bg-[#6E3B27]/15 text-[#542918] border-[#6E3B27]/40 font-bold` for medium-dark). Giver 100% krystalklar læsbarhed og overholder Espresso Warmth designmanualen.
- **Persistent Portafilter Kurv-Hukommelse (17g Basket & Custom Doser):**
  - **Identificeret Problem:** Når en barista med f.eks. en 17g portafilterkurv justerede Dry Dose til 17.0g i Dial-In Studio og trykkede "Save Calibration", nulstillede appen til opskriftens standard (18.0g / 36.0g) ved næste åbning eller på Bar-skærmen.
  - **Løsning:**
    - Udbygget `storage.ts` med `DrinkCalibration` og `loadDrinkCalibrations()` / `saveDrinkCalibration()`.
    - `DialInWizardModal.tsx` og `App.tsx` respekterer nu brugerens bønnekalibrering og gemte drikkekalibrering frem for statisk at overskrive med `drink.defaultDoseGrams`.
    - Når Dry Dose justeres i Dial-In Studio, auto-skalerer Target Yield proportionalt (f.eks. 17.0g in → 34.0g out ved ratio 1:2.0), så ekstraktionsforholdet bevares.
    - `DrinkSelector.tsx` modtager og viser nu `effectiveDose` (17.0g), `effectiveYield` (34.0g) og opdateret Target Output under koppen.
- **Dynamisk Væskemekanisk Tids-Skalering (`calculateTargetExtractionTime`):**
  - **Identificeret Problem:** "TIME WINDOW" i Dial-In Studio og på Bar-skærmen viste en statisk tid (~28s), uanset om dosis var reduceret til 17g, eller om der blev valgt en Ristretto eller Lungo ratio.
  - **Løsning:** Implementeret matematisk model for hydraulisk modstand i kaffepucken i `espressoMath.ts` ($R = (D/D_0)^{0.30}$). Tiden skalerer nu dynamisk med flow rate og væskemængde, så 17g/34g resulterer i ~26s, Ristretto i ~20-22s, og Lungo i ~34-38s.

## [1.7.8] - 2026-10-10
### Etape 23: Zoom-Hukommelse, Total Udrensning af Haptisk Forstyrrelse & Cross-Scale Benchmark Test-Suite
- **Persistent Zoom-Hukommelse (`flowbean_scale_zoom`):**
  - Kamera-zoomniveauet gemmes nu automatisk i `localStorage` og gendannes øjeblikkeligt ved hver åbning af Scale Cam, så baristaen slipper for at justere zoom gentagne gange.
- **Fuldstændig Udrensning af Haptisk Feedback (Nul Rystelser):**
  - **Identificeret Problem:** Haptisk feedback under vejning rystede telefonen i holderen/hånden, hvilket forstyrrede kameraets optiske fokus og i ekstreme tilfælde fik vibrationerne til at gå amok og skabe optisk sløring.
  - **Løsning:** Samtlige kald til `@capacitor/haptics` er fjernet fra skala-flowet (start, tare, target yield og channeling). Kameraet og appen er nu 100% rolige under hele ekstraktionen.
- **Cross-Scale Benchmark Test-Suite (16 Markedsledende Vægte Analyseret):**
  - Etableret offline test-suite baseret på virkelige espresso-udtræk fra:
    - *Timemore Nano* (side-by-side display med timer til venstre og vægt til højre)
    - *Timemore Black Mirror Basic 2*
    - *Acaia Lunar* (hvide LEDs på aluminiumsfront)
    - *MHW-3BOMBER Smart Scale* (vinklet frontpanel)
    - *SearchPean Tiny 2S* (blåhvide LEDs)
    - *Felicita Arc* (skrå front)
    - *Klassiske LCD-vægte* (mørke segmenter på lys baggrund)
  - Kortlagt og implementeret præcis adskillelse mellem Side-by-Side (Timer til venstre, Vægt til højre) og Stacked Dual-Row arkitekturer.

## [1.7.7] - 2026-10-10
### Etape 22: Skala-OCR Præcision & Robust Dobbelt-Række Parsing (Muvna/Acaia/Timemore) & Ren Viewfinder UX
- **Robust Dobbelt-Række Detektion (Vægt øverst vs. Timer nederst):**
  - **Identificeret Problem:** Refleksioner fra vægtkabinettets facetkanter skabte 5-7 støjpixels på tværs af rækker, hvilket fik 1D-projektionen til aldrig at falde under den naive tærskel på 3 pixels. Vægt og Timer smeltede dermed sammen til én 141px høj række.
  - **Løsning:** Implementeret central-fokuseret horisontal rækkeprojektion (centrale 88% af skærmbredden), 5-punkts moving average udjævning, adaptiv dynamisk rækketærskel (`Math.floor(maxRowCount * 0.16)`) og automatisk horisontal dal-splitter (valley detector), der klipper rækkerne 100% rent ved dalen mellem vægt og timer.
- **Eliminering af Blind '1'-Fast-Path:**
  - **Identificeret Problem:** Sammenvoksede kolonner med aspect ratio $< 0.48$ blev tvangsmatchet som "1", hvilket forvandlede hele displayet til falske "1 1 1"-aflæsninger.
  - **Løsning:** Erstattet med streng geometrisk validering, der kræver reelle lodrette segmentstrøg (`seg.b` eller `seg.c`) og afviser uforholdsmæssigt høje bokse.
- **LED Bradley-Roth Kontrast & Integreret Decimalpunktum Splitter:**
  - Hævet LED-bundstærsklen til `otsuThreshold * 0.60` for at eliminere lysdiffusion i acrylglas, der forbandt 4-tallet med decimalpunktummet.
  - Tilføjet automatisk dal-splitter for integrerede 7-segment decimalpunkter (`refinedSpans`), så punktummet adskilles rent fra det forudgående ciffer.
  - Tilføjet 4% ydre kantmaske for at afvise kabinet-refleksioner.
- **Forøget Offscreen Canvas Opløsning (480x240):**
  - Hævet fra 320x160 til 480x240 for skarpere detaljer på dot-matrix og perforerede LED-segmenter.
- **Ren, Uforstyrret Viewfinder UX & Fokusramme:**
  - **Identificeret Problem:** Ved tryk for fokus poppede en stor tekst-badge op (`🎯 Aligned & Focused`) lige under fingeren oven på vægttallene sammen med en blokerende grøn tekstboks.
  - **Løsning:** Fjernet alle dækkende tekst-badges fra fokuspunktet. Ved tap vises nu udelukkende en elegant, minimalistisk fokus-ring og krydssigte.
  - Erstattet den tunge grønne bounding box-tekst med en diskret, ultra-tynd smaragdgrøn ramme, så baristaen til enhver tid har 100% frit udsyn til vægtens cifre.

## [1.7.6] - 2026-10-07
### Etape 21: Ægte Pour Over Svanehalskedel Ikon & Komplet Sprog-Rensning (100% Engelsk ved Aktivt Engelsk)
- **Erstattet Forvirrende Vinglas-Ikon med Autentisk Pour Over Svanehalskedel (`PourOverKettleIcon`):**
  - **Identificeret Problem:** Den tidligere tragt-vektor i `CustomCoffeeIcons.tsx` lignede et drink- eller martiniglas på små knapper (`w-3.5 h-3.5`).
  - **Løsning:** Skabt et nyt, knivskarpt vektor-line-art ikon baseret på baristaernes klassiske svanehalskedel (gooseneck kettle) med konisk kedelkrop, svunget hældetud, ergonomisk modvægtshåndtag og låg med knop.
  - Også tilføjet `PourOverCarafeIcon` (Chemex/V60 decanter karaffel med tragt og hank).
  - `DripperIcon` opdateret til automatisk at bruge den nye svanehalskedel for perfekt kontrast mod espresso-koppen.
- **Komplet Udrensning af Hårdkodede Danske Tekster i Engelsk Visning:**
  - **Identificeret Problem:** På trods af at appen kørte på engelsk, optrådte blandede eller rent danske tekster i baren og i modalerne:
    - `"Aktiv Kaffe / Selected Drink"` badge
    - `"Kalibreret Kværn & Bønne"` boks-overskrift
    - `"Åbn Dial-In Studio >"` link
    - `"Aktiv Kaffebønne"` & `"Kværn & Indstilling"` kort
    - `"Indstilling {nr}"` & `"Måltid: ~{tid}s"` telemetritekster
    - `"Alle justeringer foretages samlet i Dial-In Studio"` & `"Finjustér her →"`
    - `"⚠️ Vægt-sikkerhed:"` advarsel
    - `"Posefoto Tilføjet"` & `"Fjern"` i BeanScannerModal
    - `"Dato i fremtiden"` validering i BeanScannerModal
    - `"Luk"` og danske smagsnoter i BeandexView
  - **Løsning (Single Source of Language):**
    - Alle UI-strenge i `DrinkSelector.tsx`, `BeanScannerModal.tsx`, `BeandexView.tsx` og `App.tsx` er nu flyttet til `t(...)` med rene engelske standardtekster.
    - Når engelsk er aktivt, vises der **100% engelsk uden et eneste dansk ord**.
    - Danske oversættelser er defineret i `da.ts` og aktiveres kun, hvis dansk sprog vælges.

## [1.7.5] - 2026-10-07
### Etape 20: Fastforankret Flowbean Top-Banner & Sikring mod Top-Overlapning på Tværs af Modaler
- **Permanent Synligt Flowbean Top-Banner (`z-[70]`):**
  - **Identificeret Problem:** I v1.7.4 svævede modalerne med `z-[60]` og en løs `items-center` / `max-h` styling, hvilket fik høje modaler (såsom drikkevaretilpasseren i DrinkSelector og SettingsModal) til at strække sig hele vejen op i toppen af skærmen, hvor de dækkede for Flowbean top-banneret og kolliderede med mobilens Android statuslinje / ur (`21.56 ... 15%`).
  - **Flowbean Header Elevation (`z-[70]`):** Appens primære `<header id="app-header">` er nu hævet til `z-[70]` og er sticky `top-0` med `border-b-2 border-[#CBB8A3]`. Flowbean logoet, brand-titlen og handlingsknapperne forbliver dermed 100% synlige, knivskarpe og uforstyrrede foroven til enhver tid.
  - **Dynamisk Header-Højde Variabel (`--app-header-height`):** Tilføjet en reaktiv lytter i `App.tsx`, der måler den nøjagtige renderede højde af topbanneret (inkl. enhedens safe-area-inset-top) og eksporterer værdien som CSS-variabel til hele appen.
  - **Hurtig Hjem-Navigation & Modal Dismissal:** Tryk på Flowbean logoet eller brand-titlen i top-banneret lukker øjeblikkeligt enhver åben dialog via `closeAllActiveModals()` og returnerer rent til kaffebarens hovedoversigt.
- **Systematisk Top-Afgrænsning af Samtlige 10 Modaler:**
  - Samtlige modaler i appen (`DrinkSelector`, `SettingsModal`, `FreshnessInfoModal`, `DialInWizardModal`, `LegalModal`, `PaywallModal`, `CentralBeanVaultModal`, `BeanScannerModal`, `ShotSummaryModal` og `OnboardingWizard`) har fået:
    - `items-start justify-center` så de altid placerer sig pænt med start under top-banneret.
    - Top-padding bundet til: `paddingTop: 'calc(var(--app-header-height, calc(env(safe-area-inset-top, 0px) + 3.5rem)) + 0.5rem)'` (8px frihøjde direkte under Flowbean headerens bundkant).
    - Maksimal kort-højde begrænset til: `maxHeight: 'calc(100dvh - var(--app-header-height, calc(env(safe-area-inset-top, 0px) + 3.5rem)) - max(1.75rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem)))'`.
    - Indre rulning (`overflow-y-auto`) med faste sticky headers og footers. Modalerne kan dermed aldrig mere nå op over Flowbean banneret eller berøre telefonens statuslinje foroven, og de overlapper heller ikke Android systemknapperne i bunden.

## [1.7.4] - 2026-10-07
### Etape 19: Modal Arkitektur & U-fangbarhedssikring (Fix af "Kan ikke komme ud af Bar")
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

## [1.7.3] - 2026-10-07
### Etape 18: Global Flowbean Brand Konsistens, Rent Minimalistisk Footer-Format & Forstørret Mobil-Logo
- **100% Brand-Opdatering fra "Espresso Flow" til "Flowbean":**
  - Gennemført systematisk opdatering af alle udestående brandreferencer i Privacy Policy, Terms of Service (EULA), Support & FAQ, Onboarding Wizard, Lifetime Paywall og Settings på tværs af samtlige 11 sprogpakker (`en`, `da`, `de`, `es`, `fr`, `it`, `ja`, `ko`, `zh-CN`, `zh-TW`, `ar`).
  - Standardiseret `app.title` til `FLOWBEAN` i alle sprog.
- **Rent Minimalistisk Footer-Format (Fjernet © Ophavsretssymbol):**
  - Opdateret footeren fra det forældede `Espresso Flow © {year}` til et rent, moderne format: `Flowbean • {year} • Global Specialty Coffee`.
  - Fjerner enhver juridisk tvivl eller bekymring og giver et mere tidløst og internationalt udtryk.
- **Forstørret Logo Centreret i Mobil-Header (Uden at Udbygge Topbaren Ned):**
  - Forstørret logo-emblemet (`w-10 h-10 sm:w-11 sm:h-11`) med `object-cover scale-135`, så kaffebønnen og terracotta flow-kurven vokser markant ud til alle sider centreret fra midten.
  - Justeret containerens lodrette padding (`py-1.5 sm:py-2`), så topbarens samlede højde forbliver præcis 48-52px uden at skubbe indholdet nedad.

## [1.7.2] - 2026-10-07
### Etape 17: Mobil Navigation Sikring – Flydende Vinduer & Popups Løftet over Mobilmenu & Android Systemlinje
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

## [1.7.1] - 2026-10-07
### Etape 16: Telemetri Loop Stabilisering, Blå LED Flerciffer OCR (41.3g), Isotrop Retikel-Justering & Smagsprofil Reset
- **Løst Kritisk Telemetri & Kurve Reset Bug:**
  - **Identificeret Årsag:** Ekstraktions-timeren i `ScaleMonitor.tsx` genstartede og nulstillede `pointsRef.current = []` og `elapsedTime = 0.0s` for hver 100ms tick, fordi `onLivePointsUpdate` i `App.tsx` blev genoprettet ved hver re-render og lå i timer-effektens dependency array.
  - **Løsning:** Alle dynamiske props og callbacks er nu isoleret i synkroniserede `useRef`'er, timer-effekten afhænger udelukkende af `[isBrewing]`, og `App.tsx` ekstraktions-handlers er memoizet med `useCallback`.
  - **Millisekund-Præcis Tidtagning:** Ved stop af brygningen beregnes `finalTime` direkte fra `startTimeRef.current`, hvilket sikrer, at alle 200–300 telemetripunkter, yield, flow og tid gemmes og vises fejlfrit i både `Extraction Complete` og Logbogen.
- **Optimeret Computer Vision for Blå/Cyan LED Digitalvægte (41.3g vs 3):**
  - **Udvidet Klynge-Afstand (`maxGap`):** Øget klynge-afstanden til `bandH * 1.15`, så decimalpunktum og cifre i `41.3` ikke splittes op i isolerede fragmenter.
  - **Følsom LED Binarisering:** Sænket støjgulvet for lysende LED'er fra 50 til 20 og optimeret lokal kontrast-faktor fra 1.16 til 1.10 for at opfange matte blå/cyan segmenter bag mørkt vægtglas.
  - **Afslappet Ciffer-Validering:** Fjernet overstrenge diskvalifikationer for cifrene `4`, `1` og `0`, så ufuldstændige eller slørede segmenter genkendes korrekt.
  - **Dobbelt-Række Vægt-Prioritet:** I stableskalaer (Vægt øverst, Timer nederst) tildeles øverste række automatisk +40 point, mens rækker med kolon eller `0:00` timer-format nedprioriteres.
- **Tara 0.0g Lås-Fastholdelse (Temporal Lock Hysteresis):**
  - Tilføjet 800ms / 15-frame hysterese på `isDigitLocked`, så midlertidige cifre-blink under tryk på tara ikke får fokus eller "TARE LOCKED" til at forsvinde.
- **Isotrop 2:1 Retikel & Ciffer-Boks Justering i Kamera-Viewet:**
  - Optisk beskæring på videostrømmen er nu matematisk låst til et rent 2:1 billedforhold (`cropH = cropW / 2`), hvilket eliminerer enhver lodret strækning.
  - Retiklen i DOM'en skaleres nu dynamisk med `zoomLevel`, så den grønne ciffer-boks i søgeren sidder præcist oven på vægtens fysiske display ligesom i Vision Inspector.
- **Nulstillet Smagsprofil (Ingen Auto-Valg af Sweet & Balanced):**
  - Fjernet standardværdien `'balanced'`. Smagsprofil starter nu 100% blank i `ShotSummaryModal`, og alle 4 kort forbliver neutrale, indtil baristaen aktivt vælger sin smagsvurdering.
- **Logbog Kurve-Visning ved Genkaldelse:**
  - `Logbook.tsx` auto-ekspanderer nu seneste shot (eller `initialExpandedShotId`), så ekstraktionskurven med flow, vægt og tid vises øjeblikkeligt, når baristaen trykker *"View in Logbook"*.

## [1.7.0] - 2026-10-07
### Etape 15: Scale Cam 1:1 Billedforhold, Hardware Focus Lock & "Tryk på Vægten" Auto-Kalibrering (Android Synkroniseret)
- **Matematisk 1:1 Billedforhold & UV-Projektion:**
  - Løst forvrængningen mellem kamera, fokus-retikel og Vision Inspector:
    - **Vision Inspector Canvas:** Ændret fra 3:1 (240x80) til et ægte 2:1 format (320x160), så den binariserede projektion vises 100% uforvrænget pixel for pixel.
    - **Viewfinder Retikel-Boks:** Standardiseret til et rent 2:1 billedforhold (`aspect-2/1`, `baseW = 0.48 / 0.64`, `baseH = 0.24 / 0.32`) for både Compact og Standard visning.
    - **Object-Cover UV-Korrektion:** Implementeret præcis koordinat-transformation (`getNormalizedVideoCoords`), der tager højde for mobilens native videobilledforhold (16:9 / 4:3), så et tryk på skærmen rammer den underliggende videostrøm med millimeterpræcision.
- **Hardware Focus Lock & Anti-Shake Pansring mod Espressomaskine-Vibrationer:**
  - **Focus Lock (Lås Linseposition):** Forhindrer Continuous Auto Focus (CAF) i at "jage" (focus hunting), når espressomaskinens 50 Hz pumpe vibrerer. Fokus kan låses manuelt eller låses automatisk, så snart brygningen starter.
  - **Sub-pixel Anti-Shake Dæmpning:** Tilføjet en lavpas-filtreret eksponentiel udjævning (`smoothedBoundingBoxRef`), der absorberer mikroskopiske 50 Hz rystelser, så ciffer-rammen står som mejslet i sten under hele udtrækket.
  - **Fotolys (High-Shutter Torch):** Fotolyset kan tændes med ét klik, hvilket tvinger kameraets lukketid op på 1/250s–1/500s og eliminerer motion blur 100%.
- **"Tryk på Vægten" Dynamic Delta Trigger (Auto-Kalibrering):**
  - **Genial Barista-Kalibrering:** Ved at trykke på *"Auto-Kalibrer"* lytter kameraet efter et dynamisk spring i vægttallene ($\Delta W \ge 4.0$g).
  - Når baristaen trykker let på vægten med fingeren, identificerer algoritmen øjeblikkeligt vægt-klyngen, ignorerer eventuelle statiske timere (`00:00` / `00.00`), centrerer fokus-retiklen, låser hardware-fokus og kvitterer med et kraftigt haptisk stød samt *"🎯 Vægt Låst & Fokuseret!"*.
- **Timer vs. Vægt Adskillelse (`00.00` Timer Undertrykkelse):**
  - Tilføjet automatisk straf for tal, der starter med `00.` eller `00:`, hvilket forhindrer, at 4-cifrede timere forveksles med tara-vægten (`0.0g`).
- **Mobil Status Bar Farve & Tekst-Klarhed (Løst Hvid-på-Lys Fejl):**
  - **Krystalklar Mørk Typografi på Alle Mobiler:** Rettet statusbaren fra `style: 'DARK'` (hvid tekst) til `style: 'LIGHT'` (`@capacitor/status-bar`), så ur (`12.17`), batteri, WiFi og notifikationsikoner vises i skarp, mørk espresso/sort farve på den lyse pergament-baggrund (`#FAF7F2`).
  - **Native Android & iOS Support:** Tilføjet `android:windowLightStatusBar="true"` og `android:statusBarColor="#FAF7F2"` i Androids native `styles.xml`, samt runtime opstarts-initialisering via `StatusBar.setStyle({ style: Style.Light })`, så alle Android-telefoner og iPhones viser statusbaren 100% læseligt og harmonisk.
- **Android Studio Synkronisering (`npx cap sync android`):**
  - Hele opgraderingen er synkroniseret direkte ind i det native Android-projekt (`android/app/src/main/assets/public`), klar til kørsel på fysisk Android-enhed via Android Studio (`npm run mobile:open:android`).

## [1.6.0] - 2026-10-07
### Etape 14: Professionel 5-Faners Bundmenu (100% Vector Line-Art, Zero Emojis) & AeroPress/French Press Immersion Plunge Beskyttelse
- **Mobile Bottom Navigation Bar (Tommelfinger-Optimeret 5-Fane Bundmenu):**
  - Flyttet appens 5 primære destinationer (`[ Bar ]`, `[ Vægt ]`, `[ Beandex ]`, `[ Logbog ]`, `[ Udstyr ]`) til en fast bundmenu på smartphones (`md:hidden`) med iOS safe-area support (`pb-safe`).
  - **Streng Æstetisk Regel Håndhævet (Zero Emojis):** Alle ikoner i bundmenuen og decket er udskiftet med rene, professionelle 24x24 Lucide og SVG line-art vektorikoner (`Coffee`, `Camera`, skræddersyet `CoffeeBeanIcon`, `BookOpen`, `Sliders`, `DripperIcon`). Ingen emojis i kontrolfladen.
  - Frigjort mobil-headeren: Topheaderen på mobil er nu reduceret til en ren, slank 44px statusbar (Logo + Brand + Settings/Trial status). Center-switcheren og det øverste 4-kolonne bånd er skjult på mobil og bevaret for desktop/tablet (`md:flex`/`md:block`).
- **AeroPress & French Press Vægt-Beskyttelse & Immersion Flow Fysik:**
  - Håndteret fysikken for nedsænkning og stempelpresning: At presse et stempel direkte på en kaffevægt udøver 10–20 kg nedadrettet kraft, hvilket forårsager vejecelle-overbelastning (`EEEE` sensorfejl).
  - Indført `brewStyle: 'immersion'`, `steepSeconds`, og `plungeWarning: true` i `DrinkRecipe` og opskrifterne for AeroPress og French Press.
  - Scale Cam viser under trækketid en dedikeret Steep Countdown Timer i stedet for falske flow spikes.
  - Iøjnefaldende sikkerhedsadvarsel på både opskriftskort og live Scale Cam: *"⚠️ Løft bryggeren af vægten før du presser! Undgå overbelastning af vægtens vejecelle"*.
- **Rolig Metode-Omskifter i Coffee Bar (Ingen Uønsket Scroll-Hop):**
  - Rettet en uhensigtsmæssig scroll-adfærd: Når man skifter mellem `Espresso` og `Pour Over`, forbliver viewporten roligt i toppen af Barista Decket uden at hoppe ned til det store drikkekort.
  - Appen scroller nu først ned til ekstraktions- og kalibreringskortet, når baristaen aktivt klikker på en specifik drik fra baren eller kataloget.
- **Tydelige Sektionskanter & Markant Bundmenu-Adskillelse:**
  - **Tydelig Topkant på Bundmenuen:** Bundmenuen har fået en markant 2px mokka-kant (`border-t-2 border-[#CBB8A3]`) kombineret med en subtil opadrettet skygge (`shadow-[0_-4px_24px_rgba(44,32,24,0.08)]`), så der er et krystalklart visuelt skel mellem indholdet og navigationsbaren.
  - **Universel Android & iOS Tilpasning:** Bundmenuens padding er udvidet (`max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))`), så den altid holder minimum 12px frihøjde over Androids system-navigationsbjælke (3-knapsbar el. gestusbjælke) og iOS Home Indicator uden overlap.
  - **High-Definition Kantskarphed i Hele Appen:** Opgraderet alle sektions- og kortkanter (`border-[#E8DFD5]`) fra bleg sandfarve til en fyldig, taktil mokka-tone (`#D2C0AE` / `--color-line: #D0BDAA`) med `1.5px` stregtykkelse, så samtlige sektioner fremstår knivskarpt adskilte.
  - **Tydeligt Beandex Antal-Badge:** Badget er forstørret (`min-w-[18px] h-[18px]`) med fed monospace tekst (`9.5px`), dyb espresso/terracotta baggrund og en 2px ren hvid afgrænsningsring (`ring-2 ring-[#FFFDF9]`), så bønneantallet altid er øjeblikkeligt læsbart.
- **Logo-Tro Kaffebønne & Responsiv "Coffee Bar" Label:**
  - **Beandex Bønne-Ikon Matcher Master Logoet (Ren Skrå Bønne Uden Flow-Hale):** Opdateret `CoffeeBeanIcon` så det fokuserer 100% på selve den skrå, fyldige kaffebønne fra logoet (~45° hældning og organisk midterspalte) – helt renset for bagvedliggende flammemønstre eller flow-striber. Ikonet fremstår nu ultraskarpt, centreret og perfekt harmonisk med de øvrige Lucide-ikoner i bundbaren.
  - **Responsiv "Coffee Bar" Label i Bunden:** På alle skærme fra 380px og op (iPhone 12/13/14/15/16, Plus, Pro, Pro Max og moderne Androids) vises det fulde, professionelle navn **Coffee Bar** (samt *Scale Cam* og *Logbook*), mens de smalleste telefoner (<380px) elegant komprimerer til **Bar** uden risiko for linjebrud.
- **Symmetrisk Mokkakant & Dybdeskygge under Topmenuen:**
  - **Perfekt Viewport-Indramning:** Den øverste fastgjorte header (`<header>`) har fået nøjagtig samme markante 2px mokkakant (`border-b-2 border-[#CBB8A3]`) og bløde dybdeskygge (`shadow-[0_4px_20px_rgba(44,32,24,0.06)]`) som bundmenuen, suppleret med matchende frosted glassmorphism (`bg-[#FAF7F2]/95 backdrop-blur-md`).
  - Herved glider kaffebaren, graferne og logbøgerne harmonisk ind og ud under to symmetriske, taktile rammer i top og bund med ensartet balance.

## [1.5.0] - 2026-10-07
### Etape 13: Pour Over & Filterkaffe Integration, Tommelfinger-Optimeret Coffee Bar & Slank Mobil Header
- **Mobil-Optimeret Metode-Vælger i Coffee Bar (Model A):**
  - Løst pladsmangel på mobilskærme uden at belaste top-headeren: Tilføjet en taktil, tommelfingervenlig 2-vejs omskifter (`[ ☕ Espresso Bar ]` | `[ 🫗 Pour Over Bar ]`) direkte under hilsenen i Coffee Bar.
  - Vælges `Espresso Bar`, vises de klassiske 13 espresso- og mælkedrikke (Espresso, Cortado, Flat White, Cappuccino osv.).
  - Vælges `Pour Over Bar`, vises de 6 nye specialty filtermetoder (V60 Standard, V60 4:6 Kasuya, Chemex Classic, Kalita Wave 185, AeroPress Inverted, French Press).
  - Pinned deck og Customize Modal tilpasser sig automatisk den valgte bryggemetode.
- **Slank Mobil-Header (Frigivet 60px på Smartphone):**
  - Sprogvælger-dropdownen er skjult på mobilskærme (`hidden sm:block`) og tilgængelig i `⚙️ Indstillinger`, hvilket giver masser af vandret luft til logo, brand og dual-mode switcheren på 375-393px telefoner.
- **Specialty Filter Drikkeprofiler & Arkitektonisk Kande-Grafik (`ArchitecturalCup.tsx`, `drinkRecipes.ts`):**
  - Tilføjet 6 specialty filteropskrifter med ratios (1:14 til 1:16.6), dæmpede malinger, hældeteknikker og bloom-parametre.
  - `ArchitecturalCup` udvidet med ægte glaskande (Range Server med dryptragt) og cylindrisk pressekolbe (`glassStyle: 'server' | 'press'`).
- **Scale Cam Pour Over Mode (`ScaleMonitor.tsx`):**
  - Automatisk genkendelse af aktiv metode: Når en filteropskrift vælges, starter Scale Cam i Pour Over tilstand.
  - Bloom Countdown (0–45 sekunder med målvand fx 45g–50g) med visuel pulsering.
  - Pacing Guide Flow-Meter (mål 4.0–6.0 g/s) vejleder rolige, jævne hældninger i stedet for kanaliseringsadvarsler.
  - Tare-instruks tilpasset filterkaffe (placér server, tragt og kaffe, nulstil til 0.0g).
  - Realistisk 3-faset simulering i Demo Mode (bloom saturation, pulse 1, pulse 2).
- **Dynamisk FlowChart Tids- og Vægtskala (`FlowChart.tsx`):**
  - Dynamisk tidsakse op til 4 minutter (240 sekunder) med minut-markeringer (`1m`, `2m`, `3m`, `4m`) og Y-akse op til 500g.
  - Viser Pacing Zone bånd (4.0–6.0 g/s) og deaktiverer kanaliseringsmarkører ved filterkaffe.
- **Datamodeller & i18n:**
  - Udvidet `BrewMethod`, `PourOverGuide`, `glassStyle` og `ShotRecord`.
  - Tilføjet engelske og danske oversættelser for alle nye pour over elementer.

## [1.4.0] - 2026-10-07
### Etape 12: Rebranding til Flowbean, Nyt Master Logo & Fuld Nativ Ikon-Suite (iOS TestFlight & Android)
- **Officielt Rebrand til Flowbean:**
  - Navnet skiftet fra *Espresso Flow* til **Flowbean** for at favne både Espresso, Pour Over (filterkaffe) og bønne-rating/håndtering.
  - Display-navn på mobilen er præcis 8 tegn (`Flowbean`), hvilket forhindrer enhver form for afkortning med prikker (`...`) på iPhones og Android-enheser.
  - Opdateret `CFBundleDisplayName` i iOS `Info.plist`, `app_name` i Android `strings.xml`, `appName` i `capacitor.config.ts`, `package.json` og `index.html`.
- **Nyt Prisvindende Flowbean Master Logo:**
  - Skabt nyt officielt master logo i `assets/flowbean-master-icon.png` (1024x1024): Porcelænshvid minimalistisk kaffebønne i harmonisk forening med en aerodynamisk flow-bølge i terracotta (`#C26D52`) og gylden crema på en dyb mørkristet espressobaggrund (`#2C2018`).
- **Løst Manglende Ikon på iOS & TestFlight (`ios/App/App/Assets.xcassets`):**
  - Tilføjet `"idiom": "ios-marketing"` og `"idiom": "universal"` i `Contents.json`, som er påkrævet af App Store Connect og TestFlight for at vise ikonet i oversigten og på installerede TestFlight-enheder.
  - Genereret samtlige native iPhone opløsninger (20pt, 29pt, 40pt, 60pt @2x og @3x) samt splash screens (2732x2732), så ikonet altid fremstår knivskarpt på enhver iPhone-skærm.
- **Løst Manglende Ikon på Android (`android/app/src/main/res`):**
  - Fjernet den redundante `drawable-v24/ic_launcher_foreground.xml` (som viste standard Capacitor robotten i hvidt på moderne Android 7+ enheder).
  - Opdateret `ic_launcher_background.xml` til den varme espressofarve `#2C2018`.
  - Genereret komplette sæt af `ic_launcher.png`, `ic_launcher_round.png` og adaptiv `ic_launcher_foreground.png` for alle densiteter (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
- **Web & In-App Header Integration:**
  - Genereret `public/flowbean-logo.png`, `public/apple-touch-icon.png` og favicons.
  - Integreret det officielle Flowbean logo i appens top bar (`src/App.tsx`) ved siden af `FLOWBEAN` titlen.

## [1.3.3] - 2026-10-05
### Etape 11: Real-World Android UI & OCR Fikser (Dato-Sikkerhed, Ren Start, Top Bar & Navigation Bar Space)
- **OCR Dato-Præcision & Fremtidssikring (`bagScanner.ts`, `bagOcr.ts`, `BeanScannerModal.tsx`):**
  - Tilføjet `BagExtractionContext` (`roaster`, `beanName`, `shelfLifeYears`) til OCR motoren. Italienske mærker som Lavazza og Illy identificeres automatisk med 24 måneders BBD-standard i stedet for 12 måneder.
  - Streng fremtids-spærre: En estimeret eller scannet ristedato kan ALDRIG ligge i fremtiden. Ved udløbsdatoer i fremtiden (fx `30/03/2028`) trækkes automatisk 24 eller 36 måneder, så datoen matcher den reelle produktionsdato (`2026-03-30`).
  - Håndteret fremtidsdatoer i UI: Hvis en bruger indtaster en dato i fremtiden (`daysOff < 0`), vises en advarsel i stedet for at melde "Roasted Today: Active CO2 degassing".
- **100% Ren Start Uden Gammel Testdata (`storage.ts`, `App.tsx`):**
  - Fjernet syntetiske demobønner (`Ethiopia Yirgacheffe`, `Colombia Huila Pink Bourbon`, `Napoli Dark Velvet Espresso`) fra standardlageret (`getDefaultBeans` returnerer nu et tomt array `[]`).
  - Automatisk udrensning af legacy testbønner i `loadBeans()`, så eksisterende og nye brugere altid starter med en ren bønneboks (Beandex) med kun deres egne scannede kaffer.
  - Rettet kværn-opsætning: Kun den kværn brugeren vælger under intro/onboarding (`result.grinderId`) markeres som aktiv i deres personlige setup (`inSetup: true`). Eureka Mignon er ikke længere slået til som standard ved siden af Baratza.
- **Top Header Rummelighed & Titel-Bevaring (`App.tsx`):**
  - Fjernet den overflødige `[🛡️ 7d]` prøveknap fra den øverste menulinje på mobil, da den store `TrialCountdownBanner` kortet under allerede indeholder al information og handlingsknap.
  - Fastlåst `shrink-0` og optimeret typografi på `ESPRESSO FLOW` logo-titlen, så navnet aldrig mere forkortes til `ES...` på mindre mobilskærme.
- **Android System Navigation Bar Buffer (`App.tsx`):**
  - Tilføjet dynamisk bund-padding (`style={{ paddingBottom: 'max(7rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))' }}`) på `<main>` og udvidet footer-padding.
  - Eliminerer overlap mellem Androids 3-knaps navigation (tilbage, hjem, apps) og appens nederste handlingskort og knapper ("Americano / Long Black" og "Switch >").

## [1.3.2] - 2026-10-05
### Etape 10: Første iOS TestFlight Deployment Live (App ID: 6819161308)
- **Fuldautomatisk CI/CD TestFlight Succes (`ios-build.yml`):**
  - App ID `com.mh.espressoflow` (App Store Navn: *Espresso Flow: Smart Barista*) oprettet og parret med Apple Developer Team `39T28DB5D4`.
  - Apple Distribution certifikat udstedt og pakket i legacy PKCS12 format med `-nomaciter -macalg sha1` for 100% kompatibilitet med macOS 15 Keychain importeren.
  - Automatisk kørsel på GitHub Actions Mac cloud runner (`macos-15` ARM64 / Xcode 26.3) med Fastlane 2.240.1.
  - IPA-fil arkiveret, signeret med officiel App Store Provisioning Profile og uploadet direkte til TestFlight på 3 minutter og 12 sekunder.
- **5 Autoriseede Secrets Verificeret:**
  - `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_PRIVATE_KEY`, `APPLE_CERTIFICATE_BASE64` og `APPLE_CERTIFICATE_PASSWORD` aktivt konfigurerede i `MichaelKHans/EspressoFlow`.

## [1.3.1] - 2026-10-04
### Etape 9: Hardware & Sikkerheds-Hærdning (iPhone-Only, Native WakeLock, Safe Areas, Lokale Skrifttyper, RLS Lockdown)
- **iPhone-Only Målretning & Portræt-Lås:**
  - Konfigureret `TARGETED_DEVICE_FAMILY = 1` i Xcode-projektet for udelukkende at målrette iPhone (eliminerer krav om iPad-screenshots og uoptimeret tablet-godkendelse).
  - Låst orientering til `UIInterfaceOrientationPortrait` i `Info.plist`, så baristaens telefon aldrig roterer utilsigtet under brygningen.
- **Dobbelt-lags Nativ Screen WakeLock Bridge:**
  - Implementeret native Capacitor plugin `NativeScreenLock` i Swift (`AppDelegate.swift`) med `UIApplication.shared.isIdleTimerDisabled = true`, der virker på samtlige iOS-versioner (iOS 13+).
  - Implementeret native `NativeScreenLock` i Java (`MainActivity.java`) med `FLAG_KEEP_SCREEN_ON` for Android.
  - Forbundet via `src/lib/wakeLock.ts` med automatisk fallback til standard HTML5 Screen Wake Lock på web.
- **Safe Area Insets (Notch, Dynamic Island & Home Bar):**
  - Implementeret CSS utilities (`pt-safe`, `pb-safe`) og root CSS variabler i `src/index.css`.
  - Opdateret sticky headers i `App.tsx` og `AdminPortal.tsx` med `pt-safe`, så menulinjer ikke glider ind bag Dynamic Island eller statusbaren.
  - Opdateret bottom toasts og footers med dynamisk beregning over iOS home indicator (`max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))`).
- **100% Lokale Skrifttyper (Nul CDN-Afhængighed):**
  - Downloadet og integreret `Courier Prime` (400, 700) og `Inter` (400, 600, 700) i `public/fonts/`.
  - Registreret `@font-face` i `src/index.css`, så skrivemaskine-tal aldrig hopper og UI indlæses lynhurtigt – selv ved første koldstart offline.
- **iOS DeviceOrientation Tilladelse via Bruger-Gesture:**
  - Flyttet `DeviceOrientationEvent.requestPermission()` fra passiv `useEffect` til eksplicitte touch/klik events (`handleStartCamera`, `handleStartBrewing`, `handleTapViewfinder`, `handleRecenter`), hvilket eliminerer iOS sikkerhedsafvisning af tilt-måleren.
- **Supabase RLS Sikkerhedshærdning (`schema.sql`):**
  - Fjernet alle offentlige `DELETE` politikker fra databasen. Ingen anonyme brugere kan slette bønner eller stemmer.
  - Beskyttet `is_verified` kolonnen mod uautoriseret eskalering fra anonyme klienter.
- **Branded Native App Icons & Splash Screens:**
  - Genereret 1024x1024 master app-ikon og 2732x2732 splash screens med Espresso Warmth æstetikken (mørkristet `#2C2018`, terracotta `#C26D52` og gylden crema-dråbe) for både iOS og Android.
- **LocalStorage Hukommelses- og Kvote-Beskyttelse (`storage.ts`):**
  - Automatisk nedsampling af 10Hz telemetripunkter for ældre historiske shots (>25 shots) ved pladsmangel, så brugerens logbog aldrig korrumperes eller mister overblikket.

## [1.3.0] - 2026-10-04
### Etape 8: Nativ Mobil App (iOS & Android) – TestFlight Pipeline, Skærm WakeLock, Taktil Haptik & Adaptiv OCR
- **Capacitor v8 Nativ Mobil Container (`ios/` & `android/`):**
  - Fuldstændig native scaffolding med `@capacitor/core@8.5.2`, `@capacitor/ios@8.5.2`, `@capacitor/android@8.5.2`, `@capacitor/app@8.1.2`, `@capacitor/haptics@8.0.2` og `@capacitor/status-bar@8.0.4`.
  - Bundle Identifier konfigureret til `com.mh.espressoflow`.
  - Hardwaretilladelser oprettet: Kamera (`NSCameraUsageDescription`, `android.permission.CAMERA`), Fotobibliotek (`NSPhotoLibraryUsageDescription`) og Wake Lock (`android.permission.WAKE_LOCK`).
  - Mørk kaffebruun statusbar (`#2C2018`) for sømløs visuel integration med appens varme æstetik.
- **Hardware- og OCR-Robusthed mod Mobilers Svagheder:**
  - **Skærm-vågelås (`src/lib/wakeLock.ts`):** Forhindrer skærmen i at gå i dvale eller slukke midt under et 30-sekunders espresso-shot via HTML5 Screen Wake Lock standard API (WebKit iOS 16.4+ & Android Chromium).
  - **Taktil Haptisk Feedback (`@capacitor/haptics`):**
    - Let haptisk klik ved detektering af Tare/Nul-vægt (`0.0g`).
    - Tungt haptisk klik ved start af shot (`handleStartBrewing`).
    - Markant advarsels-vibration hvis der opstår kanaliserings-spike ($> 4.2\text{ g/s}$).
    - Succes-vibration når målyield nås.
  - **Adaptiv OCR Billedhastighed:** 80 ms (~12.5 FPS) i standby/tare-søgning sparer batteri og forhindrer overophedning $\rightarrow$ 33 ms (~30 FPS) under aktiv brygning for ultrapræcis ekstraktionsdynamik.
  - **Optisk Zoom mod Makro-Spring:** 1.8x/2.5x zoommulighed forhindrer iPhone 13 Pro–16 Pro i at springe til ultravidvinkel-linsen på tæt hold og tillader 25–35 cm bar-afstand.
- **Fuldautomatisk iOS TestFlight CI/CD Pipeline (`.github/workflows/ios-build.yml`):**
  - Byggemiljø på `macos-15` med Xcode 26.3, Node.js 22.x LTS, Ruby 3.3 og Fastlane.
  - Dedikeret Fastlane `:beta` lane med automatisk Apple AuthKey p8 API-autentificering, midlertidig CI keychain, .p12 distribution-certifikat import og direkte upload til TestFlight.
  - Kompatibel med Apple Developer Team `39T28DB5D4` (Mh Tegnestue).
- **Swift 6 & SPM Plugin Isolation (`scripts/patch-capacitor-plugins.cjs`):**
  - Automatisk patching af `call.reject` $\rightarrow$ `call.errorHandler?(nil)` for problemfri kompilering i Swift 6.

## [1.2.29] - 2026-10-04
### Etape 7: Admin Coffee Curator Studio – Central Godkendelsespult, SCA Cupping Scores & Sky-Kvalitetssikring
- **Admin Coffee Curator Studio & Godkendelsespult (`AdminPortal.tsx` Tab 3):**
  - Live godkendelseskø for bønner indsendt af brugere eller scannet via Vision OCR (`is_verified: false` vs `is_verified: true`).
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

## [1.2.28] - 2026-10-04
### Etape 6: Vivino-Style Beandex – Bønne-Autocomplete, "Mente du...?" Fuzzy Matching, Sensoriske Smagsnoter, Posefotos & Central Vault Kvalitetsværn
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

## [1.2.27] - 2026-10-04
### Etape 5: Bønnescanner OCR Perfektion, Dansk Ristedato, Lavazza 24-mdr BBD & Modal Reset
- **Fuldstændig Modal Nulstilling ved Lukning (`X` / Backdrop):**
  - Rettet fejl hvor `BeanScannerModal` beholdt det forrige scanningsresultat, hvis brugeren lukkede modalen på krydset `X` for at scanne en ny pose.
  - Implementeret dedikeret `handleCloseModal` og ren `useEffect` lytter på `isOpen`, som nulstiller `scannedResult`, `manualCode`, `dateScanNote`, `dateScanError` og genstarter kameraet rent, så der altid startes på en frisk scanning.
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

## [1.2.26] - 2026-10-04
### Etape 4: Beandex Udvidelser – Afgasning & Friskhedsvindue (Degas), Åbningsdato & Personlige Barista-Noter
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

## [1.2.25] - 2026-10-04
### Etape 3: Bryggetemperatur (°C / °F Switcher), Settings ⚙️ Modal, Gear PID Overblik & Dial-In Måltemperatur
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

## [1.2.24] - 2026-10-04
### Scale Cam: Metode A - Manuel Barista Start & Vibrationsfilter ved Første Dråbe
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

## [1.2.23] - 2026-10-04
### ShotSummaryModal (Umiddelbar Brygoverblik & Kurve), Dato-opdelt Logbog & Clean Scale Cam
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

## [1.2.22] - 2026-10-04
### Beandex Univers (Bønne-Lager & 1-5 Stjerner), Dual-Mode Switcher og Oprydning i Gear (100% Hardware-fokus)
- **Oprydning i Gear / Equipment (100% Hardware & Bar Setup):**
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
- **i18n Global-First:**
  - Fuld internationalisering med `en.ts` som Single Source of Truth og komplette danske oversættelser i `da.ts`.

---

## [1.2.21] - 2026-10-04
### Samlet Dial-In Studio (Trin 1 Bønnevælger), Ren & Overskuelig Forside, og Mobil Hardware/Gesture Tilbage-knap
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

---

## [1.2.20] - 2026-09-29
### OCR 0, 2, 6 Disambiguation, Auto-Detected Digit Framing, Barista Telemetry Deck & Live Flow Curve
- **OCR 0 vs 2 vs 6 vs 8 Disambiguation (Critical Precision Fix):**
  - *Root Cause for 0.0 being read as 0.2:* `seg.g` (horizontal center bar) sampled with a wide radius (`0.16 * width`), which on narrow coffee scale digits (14-18px) touched the inner side segments `e/f` and `b/c`, producing false active pixels. Line 322 previously disqualified `0` completely on `(seg.g || centerHole)`. When `0` was eliminated, digit `2` (which lacked topology disqualification) scored 5/7 and was chosen, turning `0.0` into `0.2`.
  - *Fix:* Added `'g'` orientation in `sampleSegment()` with a compact radius (`0.10 * width`, `0.06 * height`) and strict 0.32 fill threshold, completely preventing side bar bleed on `0`.
  - Added strict topology constraints:
    - Digit `2`: `if (digit === '2' && (seg.c && seg.f)) continue;` (A `2` cannot have bottom-right `c` and top-left `f`).
    - Digit `6`: `if (digit === '6' && seg.b) continue;` (A `6` cannot have top-right `b`).
    - Digit `0`: `if (digit === '0' && (centerHole && seg.g)) continue;` (Only disqualified if both center cavity is filled and center bar detected).
  - Added multi-way disambiguation handlers for `0 vs 8`, `2 vs 0`, `6 vs 8`, and `6 vs 0` using targeted strict probes.
- **Uncluttered Viewfinder with Real-Time Digit Bounding Box:**
  - Removed the giant text overlay from the center of the camera targeting box that previously obscured the physical scale.
  - Dynamically renders an emerald-green bounding box (`border-2 border-emerald-400 bg-emerald-400/15`) with a crisp text badge (`0.0g`) right around the auto-detected digits directly on the physical scale display. The scale display remains 100% visible and unobstructed.
  - Retained clean corner brackets and a slim status pill (`[ 🟢 TARE LOCKED ]` / `[ ☕ BREWING ]`) on the top edge.
- **Dedicated Barista Telemetry Deck:**
  - Added a high-visibility 4-segment instrument grid directly below the camera deck:
    - **Yield / Weight:** `{currentWeight.toFixed(1)}g` in large monospace
    - **Flow Rate:** `{currentFlow.toFixed(1)} g/s`
    - **Time:** `{elapsedTime.toFixed(1)}s`
    - **Ratio:** `1:{(targetDose > 0 ? (currentWeight / targetDose).toFixed(1) : '2.0')}`
  - During extraction, an active pre-infusion vs flow split indicator displays live saturation progress.
- **Real-Time Live Extraction Curve (`FlowChart` Live Stream):**
  - Added `onLivePointsUpdate` callback streaming extraction data points from `ScaleMonitor` at 10 Hz directly into `FlowChart`.
  - Added `isLive` mode to `FlowChart`: Displays a pulsing `LIVE FLOW CURVE` badge and a live pulsating cursor tip at the head of the ascending weight line.
  - Baristas can now simultaneously aim at the counter, see their scale numbers, and watch the extraction curve develop live in real time.

---

## [1.2.19] - 2026-09-29
### OCR 3-vs-9 Fix, Stale Closure Curve Fix & Single Unified Viewfinder Weight Display
- **OCR 3-vs-9 & False-Positive Elimination (Critical Fix):**
  - *Root Cause:* In `sampleSegment()`, the return condition `(activeCount / totalCount >= threshold || activeCount >= minActive)` used an OR logic (`||`), allowing as few as 4 stray noise/glare pixels in a 30-pixel patch to trigger segment `f` (top-left) as lit, completely bypassing both the 27% baseline and the 36% strict disambiguation threshold. On a digit `3`, any ambient glare in the top-left caused it to match `9` (and `8`).
  - *Fix:* Changed condition to strictly require BOTH minimum count AND minimum fill ratio: `activeCount >= minActive && (activeCount / totalCount >= threshold)`.
  - Tightened vertical probe radius `radiusY` from `0.14` to `0.10` of bounding box height, and re-centered vertical probe sample points to `0.30` and `0.70` (preventing bleed from horizontal bars `a`, `g`, and `d`).
  - Enhanced disambiguation logic for `3 vs 8 vs 9`: if matched as `8` or `9`, strict re-sampling verifies segments `e` and `f` without false-positive leakage.
- **Extraction Dynamics Curve & Live Weight Fix (Stale Closure):**
  - *Root Cause:* The 10 Hz timer `setInterval` in `ScaleMonitor.tsx` closed over `currentWeight` (which was 0.0 or 0.2g when brewing started) without re-evaluating on state changes. Every data point pushed to `pointsRef.current` during extraction recorded the stale 0.2g weight, resulting in a completely flat extraction curve after the shot completed.
  - *Fix:* Introduced `currentWeightRef` synchronized with OCR updates on every frame. The timer loop and `handleStopBrewing` now read `currentWeightRef.current`, ensuring live weight progression is faithfully recorded and graphed in `FlowChart`.
- **Single Unified Weight Display (Slut med dobbelt-visning & forvirring):**
  - Removed the inline inspector overlay from inside the camera viewfinder. The viewfinder now shows exclusively ONE clear, large, jitter-free weight readout (`currentWeight.toFixed(1)} g`).
  - Header `Align` button now directly re-centers the target focus box (`handleRecenter`) instead of toggling an ambiguous diagnostic overlay.
  - Diagnostic drawer is moved outside the camera stream and only appears below the camera deck when explicitly opened via the diagnostic Scan tool in the toolbar.

---

## [1.2.18] - 2026-09-29
### Scale OCR Precision Fix, Toolbar Wrapping, Inline Inspector Overlay, Touch Focus & Tilt Meter
- **OCR 3-vs-8 Disambiguation (Critical Fix):**
  - Root cause: Vertical segment probes (e, f) used a 20% fill threshold that was too low — ambient light and reflections falsely triggered segments, causing digit `3` to be misread as `8` (and `5` as `6`).
  - Fix: Raised vertical segment threshold from 0.20 to 0.27 (27%). Added strict re-verification at 0.36 (36%) for confusable pairs: `3↔8` (segments e+f), `5↔6` (segment e), and `0↔8` (segment g). Minimum active pixel count for vertical probes raised from 3 to 4.
  - Added `overrideThreshold` parameter to `sampleSegment()` for targeted disambiguation probing.
- **Toolbar Wrapping (Mobile Overflow Fix):**
  - Replaced `overflow-x-auto` with `flex-wrap` on the camera controls toolbar. Removed `shrink-0` from all 3 sub-groups (Zoom, ROI, Display). Reduced padding from `px-3 py-2` to `px-2 py-1.5`.
  - Controls now gracefully wrap to 2 rows on narrow (360px) mobile screens instead of requiring horizontal scrolling.
- **Inline Vision Inspector Overlay:**
  - Inspector panel is now rendered as a semi-transparent overlay (`bg-[#1A1412]/85 backdrop-blur`) inside the camera viewfinder, so the user can see the scale alignment AND digit recognition simultaneously without scrolling.
  - The external inspector drawer is hidden during live camera mode; it only appears in standby/demo mode as fallback.
- **Touch-to-Focus Precision:**
  - Added `onTouchEnd` with `preventDefault()` for precise touch coordinates (avoids the ~300ms click delay and coordinate offset on mobile).
  - Uses `changedTouches[0]` (available on touchend) for exact lift-off position instead of `touches[0]`.
  - Hardware focus now uses `single-shot` focus mode (prioritized over `continuous`) for sharper tap targeting.
  - Added `pointsOfInterest` constraint targeting for supported Android devices.
- **Tilt Angle Indicator (New Feature):**
  - Live `DeviceOrientationEvent` (accelerometer) tilt meter displayed as a badge in the viewfinder top-right corner.
  - Color-coded: 🟢 Green (20–50° — optimal viewing angle), 🟡 Amber (10–20° or 50–60°), 🔴 Red (<10° or >60°).
  - iOS 13+ permission request handled automatically. Badge is `pointer-events-none` and disappears outside live mode.

---

## [1.2.17] - 2026-09-27
### Mobile Overflow Fixes, Nav Space Optimization & Rich Color Zoning for Beans, Gear & Logbook
- **Top Navigation Bar Space Optimization & Clean Mobile Layout:**
  - Fjernet skud-tælleren (`{shots.length}`) efter Logs i fanebjælken som anmodet af brugeren for at frigøre maksimal plads til "Coffee Bar".
  - Ændret `Coffee Bar` fane-teksten til `whitespace-nowrap font-semibold text-[10.5px] sm:text-xs` samt optimeret padding (`px-0.5 sm:px-3`), så "Coffee Bar" aldrig mere forkortes med prikker (`Coffee ...`) på mobilskærme.
  - Symmetrisk, harmonisk 4-faners fordeling over alle mobilbredder.
- **Quick Context Bar (Ristegrad vs. Dage-siden-ristning Collision Fix):**
  - Justeret `select`-menuens maksimale bredde (`max-w-[110px] xs:max-w-[145px] sm:max-w-xs`) og gjort afstanden mere responsiv, så `[MEDIUM-DARK]`-badge og `26d off roast` aldrig mere lapper over hinanden på smalle mobilskærme.
- **Bean & Barcode Vision Scanner Modal (Recipe Defaults Overflow Fix):**
  - Ændret headeren til `Calibrated Recipe Defaults` til `flex-col sm:flex-row gap-1.5` og tilføjet `truncate` og `max-w-[200px]` på kværn-dropdownen, så lange kværnnavne som *Baratza Encore ESP Pro* aldrig løber ud over kortets højre kant.
- **Favorite Beans Rolodex (Slut med afkortede bønnenavne):**
  - Omlagt favoritbønne-kardoteket til et 2-linjers responsivt kortlayout:
    - *Linje 1:* Ristegrads-badge + fuldt bønnenavn (får hele bredden fri uden `Te...` eller `Ethiopi...` afkortning) + `[Active]` / `[Select]` knap.
    - *Linje 2:* 5 interaktive stjerner + risteri + `Grind: X` kværnindstilling.
- **Rig Farveopdeling & Taktil Rytme i Beans & Gear (Slut med monolitisk beige):**
  - *Zone 1 - Bean Vault & Roasts:* Bønnekortene er nu ristegrads-kodede med subtile pasteltints og kanter (Gylden rav for Lys, Terracotta for Medium, Chokoladebrun for Mellem-Mørk, Mørk espresso for Mørk), mens det aktive kort fremhæves med en `ring-2 ring-[#C26D52] shadow-md bg-white`.
  - *Zone 2 - Extraction & Dial-In Lab Studio:* Elegant blød pergament-gradient med `Extraction Lab`-badge og salviegrønt kemibanner (`bg-[#72806B]/10`).
  - *Zone 3 - Grinder Fleet & Bar Setup (Hardware):* Machined dark espresso hardware metal-æstetik (`bg-[#241A14] text-[#FAF7F2] border-[#3D2D22]`) med glødende salviegrøn LED-indikator (`● Active on Bar`), messing-accenter (`#D4A373`) og mørke knapper, som matcher ægte kaffemaskine- og kværnhardware.
  - *Zone 4 - Espresso Machine Setup:* Varm luksusgradient med `● Pump Dynamics`-mærkat. Maskinen er nu 100% isoleret i sin egen hardware-boks.
  - *Zone 5 - Membership & App License Card:* Licens- og prøveperiode-kortet er trukket helt ud af kaffemaskine-sektionen og etableret som sit eget selvstændige Apple App Store compliance-kort med tydelig status (`7 DAYS LEFT` / `LIFETIME PRO`), `Unlock Lifetime Access ($4.99)`, `Restore Purchases` og direkte links til Terms of Use og Privacy Policy.
- **Logbook Artisan Tasting Journal (Diagnostisk farvekant & måleinstrument-chips):**
  - Hvert kaffeskud har nu en venstrestatuskant:
    - 🟢 Salviegrøn (`border-l-[#72806B]`): Sød og afbalanceret ekstraktion.
    - 🔴 Crimson rød (`border-l-red-500`): Kanalisering (channeling flow spike detekteret).
    - 🟡 Ravgylden (`border-l-amber-500`): Sur eller vandet ekstraktion.
    - 🟤 Mørk ristet brun (`border-l-[#8C6046]`): Bitter ekstraktion.
  - Telemetridata opdelt i 4 taktile instrument-chips (Ratio, Tid & Flow, Kværn & Maskine, Smag & Fysik).
  - Baristanoter indrammet i et pergament-citatfelt med terracotta-anførselstegn (`“...”`).
- **Kompilering & Test:** Verificeret 100% fejlfri build med `npm run build` (0 fejl, 414ms).

---

## [1.2.16] - 2026-09-27
### Trial Countdown Bar ($4.99 Unlock) & Central Coffee Bean Vault Directory
- **7-Dages Trial Countdown Banner (`TrialCountdownBanner.tsx`):**
  - Elegant, fast integreret prøveperiode-bjælke under hovednavigationen for alle ikke-oplåste brugere.
  - Viser en 7-segmenteret visuel fremgangsindikator (hver pille repræsenterer en dag af prøveperioden).
  - Tydelig tæller for resterende dage (`7-Day Free Trial: X Days Left`) med krystalklar tryghedsbesked: *"One-time $4.99 / 49,- DKK • No subscription • Keep scale OCR & logbook forever"*.
  - Direkte CTA-knap: `Unlock Lifetime Access ($4.99)` med genvej til `PaywallModal`.
  - Når prøveperioden udløber, skifter baren til et tydeligt advarselsbanner med opfordring til at låse op. Forsvinder permanent, så snart brugeren har låst op.
- **Central Coffee Bean Vault Modal (`CentralBeanVaultModal.tsx`):**
  - Tilføjet ny knap i Coffee Bean Vault (Fane 3): `[ 🌐 Browse Central Vault ]`.
  - Tilføjet direkte genvej i `BeanScannerModal`: *"Don't have the bag barcode? Browse Central Bean Vault"*.
  - Giver adgang til at udforske og søge i alle verificerede specialty bønner fra skyen (`Supabase`) og det lokale EAN-13 bag-katalog (13+ verificerede bønner) uden at skulle scanne en fysisk pose.
  - Omfattende søgning og filtre:
    - Søg på risteri, bønnenavn, oprindelsesland og smagsnoter.
    - Filtrer på ristegrad (`Light`, `Medium`, `Dark`), drikketype (`Flat White`, `Pure Espresso`, `Cortado`, `Cappuccino`) og købsland (`DK`, `IT`, `NO` osv.).
    - Filter til kun at vise ekspert-bedømte bønner (`90+ PTS`).
  - **1-Tap "Add to My Vault":** Tilføjer bønnen direkte til brugerens egen bar, beregner automatisk ideelt ekstraktionsforhold (1:2.5 for lys, 1:1.5 for mørk, 1:2 for medium) og binder den til den aktive kværn.
- **Flersproget i18n:** Fuld understøttelse i `src/i18n/locales/en.ts` og `src/i18n/locales/da.ts`.
- **Kompilering & Test:** Verificeret 100% fejlfri build med `npm run build` (0 fejl, 632ms).

## [1.2.15] - 2026-09-27
### Grinder Sync & Controlled Dropdown Resolution Fix in Bean Vault
- **Løsning på Grinder Mismatch i Coffee Bean Vault:**
  - Løst visuel desynkronisering mellem Quick Dial-In (`Grind Dial (Eureka): 1.4`) og Assigned Grinder dropdownen (`Baratza Encore ESP Pro (Stepped)`).
  - Årsag lokaliseret: Standardbønnerne i databasen var gemt med `grinderName: 'Eureka Mignon Specialita'`, mens kværnkataloget navngav modellen `'Eureka Mignon Specialita 16CR'`. Fordi strengen ikke matchede nogen `<option>`, faldt HTML `<select>` tilbage til den første option i DOM'en (`Baratza Encore ESP Pro`), mens tekstoverskriften læste `bean.grinderName.split(' ')[0]`.
- **Intelligent Grinder Resolver (`resolveGrinder`):**
  - Implementeret 3-trins fallback matching i `src/lib/storage.ts`: (1) Exact case-insensitive match, (2) Substring / prefix match (`"Eureka Mignon Specialita"` $\leftrightarrow$ `"Eureka Mignon Specialita 16CR"`), (3) Brand prefix match (`Eureka`, `DF64`, `Baratza`, `Niche`, `Varia`).
  - Automatisk migrering af `localStorage` ved opstart i `loadBeans()` så eksisterende gemte bønner på telefonen øjeblikkeligt normaliseres uden datatab.
- **Controlled Select Binding i alle komponenter:**
  - Opdateret `src/App.tsx`, `DialInWizardModal.tsx` og `BeanScannerModal.tsx` til at anvende `resolveGrinder` i `<select value={...}>`, så dropdown altid vælger og fremhæver den korrekte kværn.
- **Kompilering & Test:**
  - Verificeret 100% fejlfri build med `npm run build` i Vite & TypeScript.

## [1.2.14] - 2026-09-27
### Curator Hub & Periodic Maintenance Checklist in Admin Portal
- **Curator Hub & Periodic Database Audit Tab (`/admin`):**
  - Added dedicated 5th tab in the Admin Portal for database curators and specialty coffee maintenance.
  - Automated audit schedule tracking with dynamic status badge: tracks days since last audit and alerts when the 30-day review cycle is due.
  - One-click `Mark Complete Today` button to log completed review sessions.
- **Interactive Persistent Curator Checklist:**
  - **Coffee Review Monthly Cupping:** Monthly tracking of new 90+ point blind-tasted espresso lots.
  - **Crowdsourced Bean Queue in Supabase:** Review pending user-scanned beans with direct shortcut to Cloud Vault.
  - **Cup of Excellence & WBC Winning Lots:** Quarterly tracking of world competition lots and auction releases.
  - **Specialty Crop Harvest & Seasonality Refresh:** Bi-annual review of harvest arrivals and archiving expired micro-lots.
  - **Supermarket EAN-13 Packaging Audit:** Bi-annual audit of high-volume commercial blends (Lavazza, Illy, Peter Larsen, BKI, Starbucks) for barcode/packaging updates.
  - **Apple Developer & RevenueCat Health Check:** Annual verification of iOS TestFlight distribution certificates & $4.99 unlock webhooks.
  - Checkbox state dynamically saved to `localStorage` with real-time completion progress bar.
- **Curator Fast Launchpad:**
  - Direct 1-click external navigation to Coffee Review, Alliance For Coffee Excellence, Open Food Facts, and Supabase Frankfurt Console.

## [1.2.13] - 2026-09-27
### Supabase Central Bean Vault, Expert Score Badges & Zero-Latency Sync
- **Supabase Cloud Infrastructure & Central Bean Vault:**
  - Connected live to Frankfurt (`eu-central-1`) Supabase project (`vdxfmvzdmcqfixbegumb.supabase.co`).
  - Added `src/lib/supabase.ts` client with in-memory LRU caching (< 0.1ms lookups) and optimistic background synchronization.
  - Zero-latency guarantee: app never waits or blocks on network calls during brewing or camera scanning.
- **Authoritative `expert_score` & `expert_source` Integration:**
  - Added official expert benchmarks (0-100 scale) for verified beans (e.g. 94.0 PTS from *Coffee Review*, 96.0 PTS from *Cup of Excellence*, 91.5 PTS from *SCA Specialty*).
  - Displays prominent expert badges (e.g. 🏅 `94 PTS (Coffee Review)`) next to community star ratings in scanner preview and Admin Portal.
- **Beverage Suitability Consensus & Country Filtering:**
  - Added `purchase_country` (e.g., 'DK') and `suitable_for` tags (`pure_espresso`, `flat_white`, `cortado`, `cappuccino`, `modern_espresso`).
  - Implemented 70% consensus rule: drink-suitability tags require ≥ 5 verified votes and ≥ 70% supermajority to avoid guessing.
- **Live Diagnostics in Admin Portal (`/admin`):**
  - Added live ping diagnostic to Frankfurt with roundtrip latency display (~18ms).
  - Added live database viewer showing all verified beans, expert scores, ratings, and barcodes directly from cloud.
- **13 Verified Scandinavian & Italian Kickstart Seed Beans:**
  - Hand-curated initial database with real manufacturer EAN barcodes, official cupping notes, and expert scores (The Coffee Collective, Prolog, La Cabra, Lavazza, Illy, Peter Larsen, BKI, Starbucks).

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
