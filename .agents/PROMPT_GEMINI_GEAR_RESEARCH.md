# 📋 MASTER PROMPT TIL GEMINI 3.8: ESPRESSO FLOW / FLOWBEAN HARDWARE RESEARCH

> **Brugsvejledning:**
> 1. Kopiér hele koden i boksen herunder (fra `Du er en Senior Barista Tech Specialist...` til slutningen).
> 2. Indsæt den direkte i **Gemini 3.8 Chat** (f.eks. på [gemini.google.com](https://gemini.google.com)).
> 3. Når Gemini svarer med sit TypeScript-array, kan du blot kopiere svaret tilbage her i chatten til mig – så fletter jeg det direkte ind i appens gear-katalog og opretter de nødvendige silhuetter og billedstier!

```markdown
Du er en Senior Barista Tech Specialist og Kaffe-Hardware Ingeniør med speciale i specialty coffee udstyr, espressomaskiners hydraulik, kværnes partikeldistribution og manuelle bryggemetoder.

Jeg bygger mobilappen "Espresso Flow" / "Flowbean" (en professionel barista-app til dial-in, realtids flow-telemetri, ratio-beregning og gear-kalibrering). 

Jeg har brug for, at du researcher og leverer en udtømmende, 100% teknisk verificeret database over populære espressomaskiner, kaffekværne, manuelle bryggere (pour over / immersion) og svanehalskedler, som vi mangler i appen.

⚠️ KRAV TIL DATA-KVALITET:
- Du må IKKE gætte eller opfinde specifikationer. Hvert felt skal stemme overens med producentens officielle tekniske specifikationer og virkelige målinger fra kaffeverdenen (James Hoffmann, Lance Hedrick, Sprometheus, Coffee Chronicler osv.).
- Data skal leveres direkte i det præcise TypeScript-format defineret i bunden, så det kan indsættes direkte i appens kodebase.

---

### 1. Hvilket udstyr har vi ALLEREDE i appen (du skal IKKE gentage disse):
- **Kværne vi allerede har:** Baratza Encore ESP, Niche Zero, Eureka Mignon Specialita, Eureka Mignon Libra, Eureka Mignon Oro, Fellow Opus, Turin DF64 Gen 2, 1Zpresso J-Ultra, 1Zpresso K-Ultra, Timemore C3 ESP Pro, Comandante C40 MK4, Wilfa Uniform, Mahlkönig X54, De'Longhi KG79.
- **Espressomaskiner vi allerede har:** De'Longhi Dedica (EC680/685/885), Sage Bambino / Bambino Plus, Sage Barista Express / Touch, Sage Dual Boiler, Gaggia Classic Pro / Evo, Rancilio Silvia / Silvia Pro X, Lelit Bianca (E61 paddle), La Marzocco Linea Micra / Mini, Decent DE1, Ninja Luxe Café, De'Longhi La Specialista, Jura Z10, Philips LatteGo 5400.
- **Manuelle bryggere vi allerede har:** Bodum / Espro French Press, Hario V60 02, Chemex 6-Cup, Kalita Wave 185, AeroPress Original / XL, Moccamaster KBG Select.
- **Elkedler vi allerede har:** Fellow Stagg EKG, Timemore Fish Smart, Brewista Artisan, Hario Buono Electric.

---

### 2. HVAD DU SKAL FINDE OG BERIGE OS MED (Fokusér på disse eller lignende populære modeller):

#### A. Kværne (Elektriske Single-Dose & Håndkværne):
*Eksempler på modeller vi mangler:*
- Turin DF54
- Turin DF83 V2
- Fellow Ode Gen 2 (med Gen 2 burrs)
- Mazzer Philos
- Mazzer Super Jolly V Pro
- Mahlkönig EK43 / EK43S
- Baratza Sette 270 / 270Wi
- Baratza Virtuoso+
- Eureka Mignon Silenzio / Manuale / Zero
- 1Zpresso X-Pro S
- 1Zpresso J-Max
- Kingrinder K4 og Kingrinder K6
- Timemore Sculptor 064s og 078s
- Option-O Lagom P64 / Lagom Mini
- Weber Workshops Key / EG-1

**Hvad du skal finde for hver kværn:**
1. `burrSizeMm`: Knivdiameter i millimeter (fx 40, 54, 64, 78, 83, 98).
2. `burrType`: Knivtype og geometri (fx '64mm DLC Flat Burrs', '48mm Titanium Heptagonal Conical', '40mm M2 Conical').
3. `stepType`: 'stepped' (faste klik) eller 'stepless' (trinløs skrue).
4. `minSetting`: Laveste tal/indstilling på skalaen (typisk 0.0 eller 1.0).
5. `maxSetting`: Højeste tal på skalaen (fx 40, 60, 90).
6. `espressoMaxSetting` (valgfri): Hvis kværnen har en specifik espresso-zone (fx på DF54/DF64 er 0-25 typisk espresso).
7. `stepUnit`: Forklaring af skalaen (fx '0.015mm per click', 'micrometer dial', 'stepped marks').
8. `defaultSetting`: Det mest typiske dial-in startpunkt for en klassisk 18g i / 36g ud espresso på mellemristede bønner.

---

#### B. Espressomaskiner (Hjemme, Prosumer, Termoblok, E61, Manuel):
*Eksempler på modeller vi mangler:*
- Lelit Mara X (Kompakt E61 HX med brygprioritet)
- Lelit Victoria / Lelit Anna (PL41TEM)
- Profitec GO (Single Boiler med hurtig PID opvarmning)
- Profitec Pro 300 / 600 / 700
- ECM Synchronika
- Rocket Appartamento / Giotto
- Ascaso Steel UNO / DUO PID (Termoblok med elektronisk regulering)
- Ascaso Dream PID
- Cafelat Robot (Manuel håndtag / lever maskine)
- Flair 58 / Flair 58+ / Flair Pro 2
- Sage Barista Pro (ThermoJet med LCD)
- Sage Barista Touch Impress (Assisted tamping & auto-dosing)
- Wacaco Picopresso (Bærbar specialty espresso)
- Nuova Simonelli Oscar II
- Victoria Arduino E1 Prima
- Sanremo YOU
- De'Longhi Magnifica S / Magnifica Plus / Eletta Explore
- Miele CM 5310 / CM 6360

**Hvad du skal finde for hver espressomaskine:**
1. `pumpBar`: Fabrikstryk (fx 9.0 bar med OPV, 15.0 bar ureguleret vibrationspumpe, eller variabelt lever-tryk 1-12 bar).
2. `boilerType`: Varmesystem ('Thermoblock', 'ThermoJet Instant', 'Single Boiler', 'Heat Exchanger (HX)', 'Dual Boiler', 'Manual Lever').
3. `tempControl`: Temperaturregulering ('pid' = digital gradvis justering, 'stepped' = 3-trins knap, 'fixed' = fabriksfast termostat uden brugerkontrol).
4. `defaultTempC`: Standard bryggetemperatur i Celsius (typisk 92.5 eller 93.0).
5. `preInfusionControl`:
   - `'adjustable'`: Baristaen kan frit programmere sekunder (0-30s) eller styre det manuelt med paddle/knap.
   - `'fixed'`: Maskinen kører en låst fabriks-puls/for-vædning, som ikke kan ændres (fx 2-3s pre-infusion).
   - `'none'`: Fuld pumpe med det samme uden nogen form for præ-infusion (fx ren klassisk on/off pumpe).
6. `defaultPreInfusionSeconds`: Standard for-vædningstid i sekunder.
7. `preInfusionNote`: 1 præcis sætning om, hvordan præ-infusionen fysisk aktiveres eller fungerer på denne model.

---

#### C. Manuelle Bryggere (Pour Over & Filter):
*Eksempler på modeller vi mangler:*
- Fellow Stagg [X] & [XF] Dripper
- Origami Dripper (S / M)
- Kalita Wave 155 (lille udgave)
- April Coffee Brewer (Plastic / Glass)
- Orea V3 / Orea V4
- Hario Switch (Immersion hybrid 02 / 03)
- Clever Dripper (Large)
- Timemore Crystal Eye Dripper
- AeroPress Go / AeroPress Clear
- Bialetti Moka Express 3-cup / 6-cup
- Bialetti Brikka (Trykventil Moka)
- Delter Coffee Press
- Sibarist Fast Specialty Drip

**Hvad du skal finde for hver brygger:**
1. `subCategory`: Præcis undertype (fx 'Flat-Bottom Low-Bypass', 'Hybrid Steep-and-Release', 'Stovetop Pressure Moka', 'Conical Dripper').
2. `defaultCapacityMl`: Typisk anbefalet brygvolumen i ml (fx 250, 300, 500, 750 ml).
3. `description`: 1-2 fængende sætninger på dansk om bryggerens flow-hastighed, filtertype og ekstraktionsprofil.

---

#### D. Elkedler (Kettles):
*Eksempler på modeller vi mangler:*
- Fellow Stagg EKG Pro / Studio Edition
- Brewista Artisan Variable 0.9L / 1.0L
- Bonavita 1.0L Variable Temperature Gooseneck
- Cosori Smart Electric Gooseneck
- Wilfa Svart Pour / Precision
- Miroco Gooseneck Kettle

**Hvad du skal finde for hver kedel:**
1. `subCategory`: Tud-type og formål (fx 'Precision Gooseneck Variable PID', 'High-Flow Angled Spout').
2. `defaultCapacityMl`: Vandkapacitet i ml (fx 900 eller 1000).
3. `description`: 1 sætning på dansk om varmehastighed, ergonomisk balance og tudens flow-kontrol.

---

### 3. OUTPUT-FORMAT (LEVERES SOM TYPESCRIPT):

Svaret SKAL formateres som gyldige TypeScript objekter, opdelt i de 4 kategorier (`NEW_GRINDERS`, `NEW_MACHINES`, `NEW_BREWERS`, `NEW_KETTLES`), der overholder denne types:

```typescript
export interface GearSpecs {
  burrSizeMm?: number;
  burrType?: string;
  stepType?: 'stepped' | 'stepless';
  minSetting?: number;
  maxSetting?: number;
  espressoMaxSetting?: number;
  stepUnit?: string;
  defaultSetting?: string;
  pumpBar?: number;
  boilerType?: string;
  tempControl?: 'pid' | 'stepped' | 'fixed';
  defaultTempC?: number;
  defaultPreInfusionSeconds?: number;
  preInfusionControl?: 'adjustable' | 'fixed' | 'none';
  preInfusionNote?: string;
  defaultCapacityMl?: number;
}

export interface GearCatalogItem {
  id: string; // unik 'kebab-case' streng, fx 'grinder-df54' eller 'machine-profitec-go'
  name: string; // Fulde modelnavn
  brand: string; // Mærkenavn
  category: 'grinder' | 'machine' | 'brewer' | 'kettle';
  subCategory: string; // Kort undertype
  image: string; // Sti i formatet '/images/gear/[kategori]/[model].webp'
  description: string; // 1-2 velskrevne, fængende sætninger på DANSK
  specs: GearSpecs;
}
```

#### Eksempel på forventet output for en kværn:
```typescript
{
  id: 'grinder-df54',
  name: 'Turin DF54 Single Dose',
  brand: 'Turin',
  category: 'grinder',
  subCategory: '54mm Flat Burr Single Dose',
  image: '/images/gear/grinders/df54.webp',
  description: '54mm specialudviklede flade stålknive med trinløs mikrometer-justering og anti-statisk plasma generator til ultrahøj præcision.',
  specs: {
    burrSizeMm: 54,
    burrType: 'Custom Stainless Steel Flat Burrs',
    stepType: 'stepless',
    minSetting: 0.0,
    maxSetting: 90.0,
    espressoMaxSetting: 25.0,
    stepUnit: 'stepless dial (0-90)',
    defaultSetting: '14.0',
  },
}
```

#### Eksempel på forventet output for en espressomaskine:
```typescript
{
  id: 'machine-profitec-go',
  name: 'Profitec GO',
  brand: 'Profitec',
  category: 'machine',
  subCategory: 'Fast Heat-Up Single Boiler PID',
  image: '/images/gear/machines/profitec-go.webp',
  description: 'Tysk single boiler med hurtig opvarmning (5-7 min), eksternt justerbar OPV (9 bar) og integreret PID display med skudtimer.',
  specs: {
    pumpBar: 9.0,
    boilerType: '0.4L Brass Single Boiler',
    tempControl: 'pid',
    defaultTempC: 93.0,
    defaultPreInfusionSeconds: 0.0,
    preInfusionControl: 'none',
    preInfusionNote: 'Direkte 9 bar ekstraktion uden for-vædning',
  },
}
```

Lever mindst 8-12 nye modeller for Kværne, 8-12 for Espressomaskiner, og 6-8 for Manuelle Bryggere og Kedler.
```
