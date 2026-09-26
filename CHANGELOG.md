# 📜 ESPRESSO FLOW – CHANGELOG

Alle væsentlige ændringer og milepæle i Espresso Flow dokumenteres i dette dokument i henhold til Semantisk Versionering (SemVer).

---

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
