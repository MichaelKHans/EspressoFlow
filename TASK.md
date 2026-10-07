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
