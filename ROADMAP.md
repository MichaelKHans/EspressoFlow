# 🗺️ ESPRESSO FLOW – STRATEGISK ROADMAP

> **Mål:** Byg den førende globale mobilapp til live-analyse af espressoudtræk via OCR-kamera, flow-matematik og smart kværn-kalibrering.

---

## ☕ FASE 1: FUNDAMENT, DESIGN SYSTEM & DEPLOYMENT (AFSLUTTET)
- [x] Master Blueprint & Arkitektur Guide færdiggjort
- [x] .agents/ governance opsætning (projektinstrukser, workflow, status)
- [x] Initialisering af React 19 + Vite + TypeScript web app
- [x] Tailwind CSS konfiguration: "Espresso Warmth" palette (`parchment`, `latte`, `espresso`, `taupe`, `terracotta`)
- [x] `Courier Prime` skrivemaskine-typografi integration for jitter-frie tal
- [x] GitHub repository opsætning (`MichaelKHans/EspressoFlow`)
- [x] Vercel underdomæne live (`https://espressoflow-app.vercel.app`)

---

## 📷 FASE 2: LIVE SCALE SCANNER & STEP 0 KALIBRERING (AFSLUTTET)
- [x] Responsive kamera-viewfinder med sigtekorns-overlay
- [x] "Step 0" kalibrerings-flow (ret vinkel mod vægtdisplay, automatisk nul/tara-tjek `0.0g`)
- [x] Canvas-baseret 7-segment digitalvægt OCR-algoritme (lynhurtig, ultra-lav latenstid)
- [x] Display type toggle (mørke tal på lys baggrund vs. lysende LED-tal på mørk baggrund)
- [x] Støjfilter & Outlier Rejection (`ScaleReadingFilter`) for at forhindre mikrovibrationer fra pumpe
- [x] Vision Inspector (live binariseret preview og ciffer-diagnostik)
- [ ] **Kommende Scale Vision UX & Placering (Husk til senere):**
  - [ ] **Grøn Display Læsbarheds-Boks (Target Lock):** Vise live kamera i viewfinder med dynamisk grøn bounding box (`#10B981`) omkring vægtens cifre i opstartsfasen, når OCR har fundet gyldige, læsbare cifre med god kontrast (høj confidence), før selve brygningen starter.
  - [ ] **Ergonomisk Placerings-Vejledning:** Hjælpetekst i live viewfinder: *"Du kan stille og roligt placere telefonen på kaffestationen, på en kop eller mod maskinens drypbakke, så linsen peger mod vægtens display"*.
  - [ ] **Optisk Robusthed:** Polaritets-detektion mod spejlinger/overhead spots på blanke glasoverflader (Acaia/Timemore) og filtrering af mekaniske pumpevibrationer ved direkte kontakt med maskinen.

---

## 📈 FASE 3: FLOW RATE MATEMATIK, SPLIT-TIMER & KANALISERING (AFSLUTTET)
- [x] Auto-timer start, så snart vægten skifter fra `0.0g` til `0.1g`
- [x] Live flow rate beregning ($F(t) = \Delta Y / \Delta t$ i $g/s$) med støjfiltreret glidende gennemsnit
- [x] Terracotta ekstraktionskurve i realtid med The Golden Zone (1.2–1.6 g/s)
- [x] Hybrid Split-Timer for mætningstid ($T_{\text{pre}}$) og aktiv flowtid ($T_{\text{flow}}$)
- [x] Espressomaskine pre-infusion profiler og skyder (0–15s)
- [x] Matematisk kanalisering-alarm med flow spike-størrelse og tidsstempel
- [x] "How did it taste?" feedback motor (Sour / Bitter / Balanced / Watery) med pre-infusion og kværnanbefaling

---

## 🏷️ FASE 4: BEAN VAULT, CREMASHOP KVÆRNKATALOG, DIAL-IN ENGINE & DIGITAL BARISTA DECK (AFSLUTTET)
- [x] Kaffe-journal og logbog over tidligere bryg med split-tider og kanalisering
- [x] Coffee Bean Vault (multi-bag management) med husket formalingsgrad og ratio per pose
- [x] CremaShop.dk Kværnkatalog (Baratza Encore ESP Pro, Eureka Specialità/Libra/Zero/Manuale, Varia VS3/VS4/VS6, Sage Smart/Dose, Timemore, DF64, Niche, Fellow m.fl.)
- [x] Matematisk kværn-kalibreringsberegner (`GRINDER_CALIBRATIONS`) med præcise micro-steps/divisions
- [x] Ristegrads-profiler (Light, Medium, Med-Dark, Dark) og ratio-presets (Ristretto, Standard, Lungo, Allongé)
- [x] AI fotoscanning af kaffepose (`parseCoffeeBagPhoto`) via mobil kamera-trigger
- [x] Digital Barista Deck (`DrinkSelector.tsx`): Smart touch-dashboard som på digitale luksusmaskiner
- [x] Udvidet Specialty Drinks Menu (19 opskrifter: Cappuccino, Flat White, Espresso, Single Espresso, Shakerato, Allongé m.fl.)
- [x] Kollapsbart Drikke-Bibliotek med lynhurtig kategori-filtrering (All, Milk, Black, Dessert)
- [x] Per-Drik Kværnhukommelse (`${beanId}_${drinkId}`) med trin-justering og låsning
- [x] Matematisk Smart Forbedrings-Engine (sammenligner $\Delta t$ mod mål og foreslår præcise kværntrin med 1-klik `[Apply]`)
- [x] Visuel arkitektonisk kop-anatomi med realistisk top-down lagdeling og volumen-fordeling
- [x] Steamed Water Guide til Americano & Long Black (Micro-Aeration ved 78°C)
- [x] 3-Step Dial-In Wizard (`DialInWizardModal.tsx`) for hurtig 1-tap kalibrering af nye bønner
- [x] $CO_2$ afgasnings-alarm ved friskristede bønner (< 4 dage)

## 🌐 GLOBAL I18N FLERSPROGETHED (FASE-OPDELT UDRULNING)
- [x] **Arkitektur & Fundament (v0.7.0):** Letvægts zero-dependency typesikker ordbog med automatisk fallback til engelsk.
- [x] **Basis sprogpakker:** Engelsk (EN), Tysk (DE) og Dansk (DA).
- [x] **Fase 1: Østasien Specialty Epicentre (v0.8.0):**
  - [x] 🇰🇷 **Sydkorea (한국어 - `ko.ts`):** Komplet ordbog med SCA specialty barista-termer.
  - [x] 🇯🇵 **Japan (日本語 - `ja.ts`):** Komplet ordbog med kissaten- & specialty præcisionstermer.
- [x] **Fase 2: Asiatisk Vækst & Golfens Luksusmarked (v0.9.0):**
  - [x] 🇨🇳 **Kina (简体中文 - `zh-CN.ts`):** Komplet ordbog tilpasset Kinas eksploderende specialty coffee marked (Shanghai m.fl.) med SCA standardtermer.
  - [x] 🇹🇼 **Taiwan (繁體中文 - `zh-TW.ts`):** Komplet ordbog tilpasset Taiwans barista-mesterskabs standarder.
  - [x] 🇦🇪/🇸🇦 **Dubai & Golfen (العربية - `ar.ts`):** Komplet arabisk ordbog med automatisk RTL (`dir="rtl"`) layout-understøttelse.
- [ ] **Fase 3: Sydeuropas Kaffekultur:**
  - [ ] 🇮🇹 Italien (Italiano - `it.ts`)
  - [ ] 🇪🇸 Spanien & Latinamerika (Español - `es.ts`)
  - [ ] 🇫🇷 Frankrig (Français - `fr.ts`)

---

## 💎 FASE 5: REVENUECAT & STORE INTEGRATION
- [ ] 7 dages fuld in-app prøveperiode logik
- [ ] Pro Lifetime Unlock paywall ($4.99 / 49,- DKK)
- [ ] RevenueCat integration (`@revenuecat/purchases-capacitor`)
- [ ] "Restore Purchases" mekanik til Apple StoreKit 2 & Google Play Billing

---

## 🚀 FASE 6: IOS & ANDROID CI/CD (TESTFLIGHT & PLAY STORE)
- [ ] Capacitor opsætning (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`)
- [ ] Fastlane CI/CD pipeline (`ios-build.yml`) via eksisterende Apple Developer certifikater
- [ ] Android App Bundle (`.aab`) generering og intern test i Google Play Console
