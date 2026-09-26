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

## 📷 FASE 2: LIVE SCALE SCANNER & STEP 0 KALIBRERING
- [ ] Responsive kamera-viewfinder med sigtekorns-overlay
- [ ] "Step 0" kalibrerings-flow (ret vinkel mod vægtdisplay, automatisk nul/tara-tjek `0.0g`)
- [ ] Canvas-baseret 7-segment digitalvægt OCR-algoritme (lynhurtig, ultra-lav latenstid)
- [ ] Display type toggle (mørke tal på lys baggrund vs. lysende LED-tal på mørk baggrund)
- [ ] Støjfilter / Glidende gennemsnit (moving average) for at forhindre mikrovibrationer fra pumpe

---

## 📈 FASE 3: FLOW RATE MATEMATIK & KANALISERING
- [ ] Auto-timer start, så snart vægten skifter fra `0.0g` til `0.1g`
- [ ] Live flow rate beregning ($F(t) = \Delta Y / \Delta t$ i $g/s$)
- [ ] Terracotta ekstraktionskurve i realtid
- [ ] Matematisk kanalisering-alarm (hvis flowet springer voldsomt op undervejs)
- [ ] "How did it taste?" feedback motor (Sour / Bitter / Balanced / Watery) med kværnanbefaling

---

## 🏷️ FASE 4: BEAN SCANNER & GRINDER PROFILES
- [ ] Kaffe-journal og logbog over tidligere bryg
- [ ] AI fotoscanning af kaffepose (OCR af ristedato, bønnetype, oprindelse)
- [ ] Kværnprofiler (DF64, Eureka Mignon, Fellow Opus, Sage/Breville m.fl.) med trinvise klik-anbefalinger
- [ ] $CO_2$ afgasnings-alarm ved friskristede bønner

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
