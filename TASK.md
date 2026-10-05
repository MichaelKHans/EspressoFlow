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

## 📱 FASE 6: Nativ Mobil App & TestFlight (AFSLUTTET)
- [x] Initialiser Capacitor v8 for iOS og Android (`ios/` og `android/`)
- [x] Etabler TestFlight byggepipeline (`.github/workflows/ios-build.yml` og `Fastfile` :beta)
- [x] Forbedr OCR hardware-robusthed (Screen WakeLock, taktil haptik, zoom mod makro-spring, 12.5 FPS $\rightarrow$ 30 FPS adaptiv frekvens)
- [x] Opret `com.mh.espressoflow` App Identifier i Apple Developer Portal / App Store Connect (App ID: 6819161308)
- [x] Konfigurer de 5 Apple Secrets i GitHub Repo Settings for `MichaelKHans/EspressoFlow`
- [x] Løs Android real-world issues (OCR dato fremtidsspærre, 100% ren start uden testdata, topbar friplads og bundnavigation buffer - v1.3.3)

---

## 📌 Næste Opgaver (Morgen / Næste session): Bønne-Arkivering, Genkøbs-Labels & Juridisk Ajourføring
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
