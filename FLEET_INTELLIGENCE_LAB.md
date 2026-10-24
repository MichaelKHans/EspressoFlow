# 🧠 FLOWBEAN LAB & FLEET INTELLIGENCE – MASTER VISION & DATAGUIDE

> **Dokumentstatus:** Aktiv Strategisk & Matematisk Blueprint  
> **Gældende version:** v1.21.9  
> **Formål:** Dette dokument fastlægger den langsigtede vision, datastruktur, matematiske modeller og privatlivsprincipper for Flowbeans globale flådelæring (Fleet Intelligence) og det kvalitative forskningspanel (Flowbean Lab). Dokumentet skal konsulteres ved fremtidige samtaler og udviklingsetaper om emnet.

---

## 📑 INDHOLDSFORTEGNELSE
1. [Vision: Tesla-Style Flådelæring for Specialty Coffee](#1-vision-tesla-style-flådelæring-for-specialty-coffee)
2. [Hvad kan vi opnå ved at samle denne data? (De 5 Strategiske Milepæle)](#2-hvad-kan-vi-opnå-ved-at-samle-denne-data-de-5-strategiske-milepæle)
3. [Jernhårde Sikkerheds- & GDPR-Principper](#3-jernhårde-sikkerheds--gdpr-principper)
4. [Teknisk Datamodel & Vektor-Arkitektur (<450 Bytes)](#4-teknisk-datamodel--vektor-arkitektur-450-bytes)
5. [Matematisk & Væskemekanisk Grundlag (Darcy-Ergun & Bayes)](#5-matematisk--væskemekanisk-grundlag-darcy-ergun--bayes)
6. [Fællesskabsdrevet Udstyrskatalog (Crowdsourcing Workflow)](#6-fællesskabsdrevet-udstyrskatalog-crowdsourcing-workflow)
7. [Fremtidig Udviklingskøreplan for Flowbean Lab](#7-fremtidig-udviklingskøreplan-for-flowbean-lab)

---

## 1. VISION: TESLA-STYLE FLÅDELÆRING FOR SPECIALTY COFFEE

En enkelt hjemmebarista brygger typisk 1 til 3 shots om dagen med 1 espressomaskine og 1 kværn. Hvis baristaen køber en ny pose bønner (f.eks. en lysristet etiopisk kaffe), kræver det traditionelt 3–5 mislykkede eller suboptimale shots at ramme det ideelle dial-in punkt (grind setting, ratio, yield).

Når 10.000 baristaer bruger Flowbean verden over, brygges der over **30.000 shots om dagen** på tværs af hundredvis af kværn- og maskinkombinationer.

**Flowbean Fleet Intelligence** forvandler denne distribuerede aktivitet til et levende, kollektivt kaffelaboratorium:
- Hver gang en bruger brygger et shot, udledes en ultrakompakt anonym telemetrivektor.
- Bønners hydrodynamiske modstandsprofil, afgasningskurve og optimale ratio læres af flåden.
- En ny bruger, der åbner samme pose bønner på en tilsvarende kværn, modtager øjeblikkeligt en **"Fleet Verified"** præcis anbefaling allerede ved **første shot**.

---

## 2. HVAD KAN VI OPNÅ VED AT SAMLE DENNE DATA? (DE 5 STRATEGISKE MILEPÆLE)

### 1. "Fleet Verified" Instant Dial-In (Nul Kaffespild)
- Når 10+ brugere uafhængigt har fundet et balanceret shot i Golden Zone (24–30s, balanceret smag) for en specifik bønne og kværnmodel, udregnes et globalt Bayesian prior.
- Nye brugere slipper for at gætte: Kværnindstillingen er forudindstillet med millimeterpræcision fra dag ét.

### 2. Væskemekanisk Kryds-Udstyrs Translation (Cross-Device Prediction)
- Brugeren har dialed en bønne ind på en 51 mm De'Longhi Dedica og skifter nu til en 58 mm E61 maskine (eller en 52 mm Wacaco Picopresso).
- Fordi vi kender bønnen og den præcise kurvegeometri ($A_{51} \approx 20.4\text{ cm}^2$, $A_{58} \approx 26.4\text{ cm}^2$), kan appen udregne det ændrede puckdybde-forhold og præcist forudsige den korrekte kværnjustering på forhånd.

### 3. Kvalitativ Forskning: Baskets, Kanalisering & Udstyrsfejl
- Ved at analysere tusindvis af 1Hz flowkurver kan vi se:
  - Hvor ofte opstår kanalisering (channeling) på 51 mm ventilkurve vs. 58 mm præcisionskurve?
  - Hvilke kværne mister kalibrering over tid?
  - Hvilke risteprofiler kræver længere pre-infusion for at undgå gushing?
- Dette giver uvurderlig indsigt, som kan visualiseres i Admin Portalens "Flowbean Lab".

### 4. "Shadow Mode" Validering af Ny AI-Matematik
- Når vi udvikler en ny dial-in algoritme eller opdaterer støjfiltre, kan vi lade den nye kode køre i "Shadow Mode" i skyen mod indkommende telemetri:
  - *"Ville den nye model have forudsagt et mere præcist shot end den version, brugeren havde på telefonen?"*
  - Matematikken kan bevises med 99.9% konfidens, **før** den udrulles i en officiel App Store / Google Play opdatering.

### 5. Remote Parameter Tuning uden App-Opdateringer
- Globale konstanter (f.eks. bønners basis-densitet, $CO_2$-afgasningshalveringstid, temperaturkorrektioner) kan fintunes direkte fra Admin Panelet i Supabase, så alle telefoner øjeblikkeligt modtager smartere beregninger uden en langsom opdateringscyklus hos Apple/Google.

---

## 3. JERNHÅRDE SIKKERHEDS- & GDPR-PRINCIPPER

For at beskytte brugerens privatliv og holde databasen lynhurtig gælder følgende principper:

1. **NUL Private Fotos til Skyen:**
   - Brugerens personlige fotos af deres maskine, kværn eller køkken forbliver **100% på deres egen enhed** i IndexedDB (`flowbean_media_v1`). De uploades aldrig til Supabase.
2. **NUL Personhenførbare Data (PII):**
   - Telemetri indeholder intet navn, ingen e-mail, ingen IP-adresse og ingen personlige smagsnoter.
   - Enheden identificeres udelukkende med et tilfældigt, lokalt genereret enhedsfingerprint (`barista_xxxxxxxx`).
3. **Ultrakompakt (<450 Bytes pr. Shot):**
   - Rå video og billeder uploades aldrig under almindelig brygning. Kun den nedskalerede 1Hz flowkurve og slutmetrikker sendes. 10.000 shots optager mindre end 4.5 MB i databasen.
4. **Fuld Bruger-Kontrol (Opt-Out):**
   - Telemetri kan til enhver tid slås fra med et enkelt klik i appens Indstillinger (`flowbean_fleet_telemetry_opt_in_v1`).

---

## 4. TEKNISK DATAMODEL & VEKTOR-ARKITEKTUR (<450 BYTES)

### 4.1 Supabase Tabel: `fleet_shot_telemetry`
```sql
CREATE TABLE IF NOT EXISTS fleet_shot_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  math_version VARCHAR(20) NOT NULL,
  machine_key VARCHAR(100) NOT NULL,
  grinder_key VARCHAR(100) NOT NULL,
  physics_class VARCHAR(40) NOT NULL,
  basket_diameter_mm NUMERIC(4,1),
  dose_g NUMERIC(5,2) NOT NULL,
  yield_g NUMERIC(5,2) NOT NULL,
  brew_time_s NUMERIC(5,2) NOT NULL,
  pre_infusion_s NUMERIC(5,2),
  grind_setting VARCHAR(30),
  flow_curve_1hz JSONB DEFAULT '[]',
  taste_rating INT CHECK (taste_rating >= 1 AND taste_rating <= 5),
  channeling_detected BOOLEAN DEFAULT FALSE,
  ai_predicted_time_s NUMERIC(5,2),
  user_override_delta NUMERIC(5,2),
  user_fingerprint VARCHAR(64)
);
```

### 4.2 TypeScript Telemetri-Vektor Interface
Defineret i `src/lib/supabase.ts` og afsendt via `src/lib/fleetTelemetry.ts`:
```typescript
export interface FleetShotTelemetryVector {
  mathVersion: string;         // fx 'v1.21.9'
  machineKey: string;          // fx 'lelit-mara-x'
  grinderKey: string;          // fx 'baratza-encore-esp-pro'
  physicsClass: string;        // fx 'pump_espresso', 'manual_espresso'
  basketDiameterMm?: number;   // 58.0, 54.0, 52.0, 51.0
  doseG: number;               // fx 18.00
  yieldG: number;              // fx 36.20
  brewTimeS: number;           // fx 27.4
  preInfusionS?: number;       // fx 5.0
  grindSetting: string;        // fx '15.0'
  flowCurve1Hz?: number[];     // fx [0, 0.2, 1.2, 1.5, 1.5, 1.4, 1.3...] (maks 60 tal)
  tasteRating?: number;        // 1-5 stjerner
  channelingDetected?: boolean;
  aiPredictedTimeS?: number;   // Hvad forudsagde appen inden brygningen?
  userOverrideDelta?: number;  // Hvor meget overstyrede brugeren slideren med?
  userFingerprint?: string;    // Anonym enhedsnøgle
}
```

---

## 5. MATEMATISK & VÆSKEMEKANISK GRUNDLAG (DARCY-ERGUN & BAYES)

### 5.1 Hydraulisk Modstand og Kurveareal (Darcy-Ergun Ligning)
Kaffepuckens hydrauliske modstand $R$ for en given kaffedosering følger Ergun-forholdet:
$$R \propto \frac{\text{Dosis}}{k \cdot A^2}$$
Hvor:
- $A$ er kurvens tværsnitsareal ($A = \pi \cdot r^2$).
- Fordi arealet indgår i anden potens ($A^2$), har en 51 mm kurve (Dedica: $A \approx 20.4\text{ cm}^2$) en dramatisk højere puckhøjde og modstand end en 58 mm kurve ($A \approx 26.4\text{ cm}^2$) ved samme 18g dosering.
- Flådemodellen bruger dette til at translatere modstandskoefficienten på tværs af maskinstørrelser.

### 5.2 Hierarkisk Bayesian Flådemodel (Burr Offset vs. Bønneegenskaber)
Et gennemsnit på tværs af alle brugere fejler, fordi to identiske kværne (f.eks. to Baratza ESP) sjældent har nøjagtig samme fabrikskalibrerede nulpunkt.

Flådemodellen opdeles derfor hierarkisk:
$$\text{Indstilling}_{i, u} = \underbrace{\beta_{\text{bønne}} + \beta_{\text{maskine}} + \beta_{\text{kværnmodel}}}_{\text{Flådens Globale Sandhed}} + \underbrace{u_i}_{\text{Brugerens Lokale Burr Offset}}$$
- **Flåden lærer:** Hvor mange trin bønnen kræver i forhold til en standard-reference.
- **Appen på enheden lærer:** Brugerens individuelle offset $u_i$.
- På den måde virker flåde-anbefalingen præcist, selvom brugerens kværn er justeret en smule anderledes end naboens.

---

## 6. FÆLLESSKABSDREVET UDSTYRSKATALOG (CROWDSOURCING WORKFLOW)

1. **Bruger Opretter Udstyr:**
   - I `AddGearModal.tsx` trykkes `+ Opret brugerdefineret udstyr`.
   - `CustomGearCreatorModal.tsx` åbnes: Brugeren indtaster mærke, model, kurvestørrelse (58/54/52/51mm), ventildesign, kedeltype, kværntype osv.
   - Brugeren tager et foto (gemmes 100% lokalt i `gearImageStorage.ts` via IndexedDB).
2. **Anonym Indsendelse:**
   - Hvis "Bidrag til fællesskabet" er markeret, sendes kun de tekniske data til `crowdsourced_gear_submissions` med status `'pending'`.
3. **Admin Moderation:**
   - I Admin Portalen under fanen **Supabase Sync** vises **"Gear Moderation & Fællesskabskø"**.
   - Admin kan se mærke, model og tekniske specs.
   - Med et enkelt klik på **"Godkend til katalog"** markeres udstyret som `'approved'` og bliver automatisk en del af det globale bibliotek.

---

## 7. FREMTIDIG UDVIKLINGSKØREPLAN FOR FLOWBEAN LAB

| Etape | Status | Indhold |
| :--- | :--- | :--- |
| **Etape 1: Fundament & Taksonomi** | **Gennemført (v1.21.8)** | `BrewPhysics` 7-delt klassifikation, maskine-isolation i Gate 3, sammensatte kalibreringsnøgler. |
| **Etape 2: IndexedDB Medielager** | **Gennemført (v1.21.9)** | `gearImageStorage.ts` løser browserens 5MB kvotelimit. |
| **Etape 3: "Opret Eget Udstyr" Wizard** | **Gennemført (v1.21.9)** | `CustomGearCreatorModal.tsx` integreret i `AddGearModal.tsx`. |
| **Etape 4: Telemetrimotor & Queue** | **Gennemført (v1.21.9)** | `fleetTelemetry.ts` med 1Hz flowkurve-sampling og opt-out. |
| **Etape 5: Supabase Tabeller & Migrering** | **Gennemført (v1.21.9)** | Tabeller og RLS scripts i `20261024_crowdsourced_gear_and_telemetry.sql`. |
| **Etape 6: Admin Flowbean Lab Dashboard** | *Næste Etape* | Visuelt analysepanel i Admin Portal: Channeling heatmap, basket 51 vs 58 mm grafer, override rate måler. |
| **Etape 7: Bayesian Flåde-Konsensus Engine** | *Planlagt* | Supabase Edge Function der beregner globale priors og serverer "Fleet Verified" badges i appen. |
