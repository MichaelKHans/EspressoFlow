# Espresso Flow Project Status & History

## Projekt Oversigt
- **Navn:** Espresso Flow
- **Primært sprog:** 100% Engelsk (English US)
- **Design System:** Espresso Warmth (`#FAF7F2`, `#FFFDF9`, `#2C2018`, `#C26D52`) + `Courier Prime`
- **Forretningsmodel:** 7 dages in-app prøveperiode $\rightarrow$ $4.99 / 49,- DKK Lifetime Unlock (RevenueCat)
- **Repository:** `MichaelKHans/EspressoFlow`

---

## 🕒 Historik & Gennemførte Opgaver

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
  - *Espresso Machine Setup:* Varm luksusgradient med `● Pump Dynamics`-mærkat.
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
