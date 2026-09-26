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
- [x] Cappuccino & Specialty Drinks Menu (1:1:1 Cappuccino med mikroskum-guide, Flat White, Espresso, Cortado, Lungo, Americano)
- [x] Visuel kop-anatomi med lagdelt volumen- og farvevisning
- [x] 3-Step Dial-In Wizard (`DialInWizardModal.tsx`) for hurtig 1-tap kalibrering af nye bønner
- [x] $CO_2$ afgasnings-alarm ved friskristede bønner (< 4 dage)

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
