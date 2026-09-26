# ☕ ESPRESSO FLOW APP – MASTER BLUEPRINT & ARKITEKTUR GUIDE
> **Koncept:** En mobil-først applikation til kaffe-entusiaster og baristaer, der i realtid aflæser espresso-vægtens taldisplay via telefonens kamera, måler flow rate ($g/s$), detekterer kanalisering (channeling) rent matematisk, scanner bønner og kværn, og guider brugeren til den perfekte dial-in.  
> **Sprog & Målgruppe:** **100% Engelsk (English-only)** – Globalt henvendt til kaffenørder og home baristas verden over. Nul i18n-kompleksitet, 1 enkelt primært sprog i App Store og Google Play.  
> **Æstetik:** "Espresso Warmth" – varm Claude UI æstetik med pergament, ristede kaffenuancer og analog skrivemaskine-typografi (Courier Prime).  
> **Forretningsmodel:** 7 dages fuld in-app prøveperiode efterfulgt af **$4.99 / 49,- DKK Lifetime Unlock** (Non-consumable In-App Purchase via Apple StoreKit & Google Play Billing med RevenueCat). Ingen abonnementstræthed – "Buy once, brew forever".  
> **Infrastruktur-omkostning:** **0 kr. til domæner** – 100% drevet af gratis Vercel underdomæner og genbrug af Apple Developer & Google Play opsætning.

---

## 📑 INDHOLDSFORTEGNELSE
1. [Hvorfor 100% Engelsk (Global-First & Nul Kompleksitet)](#1-hvorfor-100-engelsk-global-first--nul-kompleksitet)
2. [Arkitektur: 0 kr. til Domæner (Vercel-Strategien for iOS & Android)](#2-arkitektur-0-kr-til-domæner-vercel-strategien-for-ios--android)
3. [Abonnementsmodel: Månedlig Subskription på iOS & Android (RevenueCat)](#3-abonnementsmodel-månedlig-subskription-på-ios--android-revenuecat)
4. [Design System: "Espresso Warmth" (Claude UI & Skrivemaskine-Æstetik)](#4-design-system-espresso-warmth-claude-ui--skrivemaskine-æstetik)
5. [Kamera & Vægtaflæsning: OCR Computer Vision & Kalibrering (Trin 0)](#5-kamera--vægtaflæsning-ocr-computer-vision--kalibrering-trin-0)
6. [AI Kværn-Kalibrering & Bønne-Scanning (Bag + Beans)](#6-ai-kværn-kalibrering--bønne-scanning-bag--beans)
7. [Espresso Flow Matematik, Kanalisering & Smags-Feedback](#7-espresso-flow-matematik-kanalisering--smags-feedback)
8. [iOS CI/CD & Fastlane Pipeline (TestFlight)](#8-ios-cicd--fastlane-pipeline-testflight)
9. [Android Klargøring, Signering & Google Play Console (AAB)](#9-android-klargøring-signering--google-play-console-aab)
10. [Teknologistak & Projektstruktur (English-Only, No i18n)](#10-teknologistak--projektstruktur-english-only-no-i18n)
11. [Trin-for-trin Køreplan ved Projektstart](#11-trin-for-trin-køreplan-ved-projektstart)

---

## 1. HVORFOR 100% ENGELSK (GLOBAL-FIRST & NUL KOMPLEKSITET)

Valget om at bygge appen **udelukkende på engelsk** er et strategisk mestertræk:

1. **Kaffeverdenen Taler Allerede Engelsk:**  
   Espresso-fagtermer er universelle over hele kloden: *dial-in, yield, flow rate, channeling, puck prep, WDT, grind finer, single origin, degassing*. Hverken en tysk, japansk eller dansk kaffenørd forventer eller ønsker oversatte begreber.
2. **Kæmpe Tidsbesparelse (Nul i18n Overhead):**  
   I TømrerAppen brugte vi timer på 10 sprogfiler (`da`, `en`, `de`, `sv` osv.), JSON-nøgler og sprogvælgere. I Espresso Flow skrives alle tekster, knapper og logbøger direkte som ren engelsk tekst i koden.
3. **Én Enkelt Indsendelse i App Store & Google Play:**  
   * **Primary Language:** Sættes til `English (U.S.)`.
   * **Global Rækkevidde:** Appen distribueres automatisk til alle 175 lande i App Store og alle lande i Google Play, men du skal kun uploade **ét sæt screenshots** og **én beskrivelse**.
4. **Juridiske Sider på Engelsk:**  
   Både Terms of Service (EULA), Privacy Policy og Support skrives på engelsk på dit gratis Vercel-domæne.

---

## 2. ARKITEKTUR: 0 KR. TIL DOMÆNER (VERCEL-STRATEGIEN)

### Hvorfor du IKKE behøver at købe domæner (`.dk` / `.com`)
Apple App Store og Google Play har strenge regler om gennemsigtighed, men **de kræver IKKE et betalt eller custom domæne**.  
De kræver udelukkende fungerende internet-adresser til:
1. **Privacy Policy URL** (påkrævet): Din privatlivspolitik (GDPR / datahåndtering).
2. **Support URL / E-mail** (påkrævet): Et sted hvor internationale brugere kan få hjælp.

### Sådan fungerer Vercel gratis subdomæner:
Når du opretter dit projekt på Vercel og forbinder det til GitHub, tildeler Vercel dig automatisk et permanent, gratis, lynhurtigt SSL-krypteret underdomæne:
- F.eks.: `https://espressoflow.vercel.app` eller `https://espresso-scale.vercel.app`

Dette giver dig flg. kontaktpunkter helt kvit og frit på engelsk:
* `https://espressoflow.vercel.app/privacy` (Privacy Policy til App Store Connect & Google Play)
* `https://espressoflow.vercel.app/terms` (Terms of Service / EULA til App Store Connect)
* `https://espressoflow.vercel.app/support` (Support & FAQ til App Store Connect)
* `https://espressoflow.vercel.app/api/webhooks/revenuecat` (Webhook endpoint)

---

## 3. FORRETNINGSMODEL: 7-DAGES TRIAL + LIFETIME UNLOCK (REVENUECAT)

Kaffenørder hader månedlige abonnementer ("subscription fatigue"), men betaler med glæde en engangspris svarende til én kop kaffe på en espressobar (**$4.99 USD / 49,- DKK**) for at eje et professionelt måleværktøj for evigt.

For at fjerne enhver tvivl om, hvorvidt kameraet virker på brugerens specifikke vægt, tilbydes **7 dages fuld gratis prøveperiode** direkte i appen fra første åbning.

Med RevenueCat (`@revenuecat/purchases-capacitor`) behøver du kun at konfigurere ét produkt og skrive købsflowet én gang i React/TypeScript:
* **iOS:** Åbner automatisk Apple StoreKit 2 Non-Consumable Purchase (Face ID / Touch ID / Apple Pay).
* **Android:** Åbner automatisk Google Play Billing Non-Consumable (Google Pay 1-klik).
* **Cross-platform PRO:** Brugerens køb genkendes på tværs af enheder og kan gendannes med ét klik ("Restore Purchases").

---

### A. App Store Connect Opsætning (iOS)
1. **Type:** `Non-Consumable In-App Purchase`
2. **Product Details:**
   * Reference Name: `EspressoFlow PRO Lifetime`
   * Product ID: `com.mh.espressoflow.lifetime`
   * Pricing Tier: **Tier 5 ($4.99 USD / 49,- DKK / €4.99)**.
3. **In-App Free Trial Logik:**
   * Appen logger installationstidspunktet lokalt (`installDate`).
   * I de første 7 dage er samtlige funktioner 100% ulåste (`isWithinTrial`).
   * På dag 8 vises paywallen til at låse op permanent for $4.99 engangskøb.

---

### B. Google Play Console Opsætning (Android)
1. **Type:** In-App Product (Non-consumable / one-time)
   * Product ID: `espressoflow_lifetime`
   * Price: **$4.99 USD / 49,- DKK**.
2. **Google Cloud Service Account til RevenueCat:**
   * Knyt servicekonto-JSON under *Project Settings -> Google Play* i RevenueCat.

---

### C. Fælles Cross-Platform Kodeeksempel (`src/lib/purchases.ts`)
```typescript
import { Purchases, PurchasesOfferings } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export const REVENUECAT_APPLE_KEY = "appl_espresso_flow_key_here";
export const REVENUECAT_GOOGLE_KEY = "goog_espresso_flow_key_here";
export const ENTITLEMENT_ID = "pro_lifetime";

export async function initPurchases(userId?: string) {
  const platform = Capacitor.getPlatform();
  if (platform !== 'ios' && platform !== 'android') return;

  const apiKey = platform === 'ios' ? REVENUECAT_APPLE_KEY : REVENUECAT_GOOGLE_KEY;
  await Purchases.configure({ apiKey, appUserID: userId || null });
}

export async function purchaseLifetimePro(): Promise<{ success: boolean; error?: string }> {
  try {
    const platform = Capacitor.getPlatform();
    if (platform !== 'ios' && platform !== 'android') {
      return { success: false, error: 'In-App Purchase is only available on mobile' };
    }

    const offerings: PurchasesOfferings = await Purchases.getOfferings();
    const lifetimePackage = offerings.current?.lifetime;
    if (!lifetimePackage) return { success: false, error: 'Could not load lifetime package' };

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: lifetimePackage });
    return { success: !!customerInfo.entitlements.active[ENTITLEMENT_ID] };
  } catch (err: any) {
    if (err.userCancelled) return { success: false, error: 'Purchase cancelled' };
    return { success: false, error: err.message || 'An error occurred during purchase' };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; isPro: boolean }> {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return { success: true, isPro: !!customerInfo.entitlements.active[ENTITLEMENT_ID] };
  } catch {
    return { success: false, isPro: false };
  }
}

// 7-day local trial check helper
export function checkAccessStatus(isProPurchased: boolean, installedAtMs: number): { hasAccess: boolean; isTrial: boolean; daysRemaining: number } {
  if (isProPurchased) return { hasAccess: true, isTrial: false, daysRemaining: 0 };
  const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - installedAtMs;
  const remaining = Math.max(0, Math.ceil((TRIAL_DURATION_MS - elapsed) / (24 * 60 * 60 * 1000)));
  return {
    hasAccess: elapsed < TRIAL_DURATION_MS,
    isTrial: elapsed < TRIAL_DURATION_MS,
    daysRemaining: remaining,
  };
}
```

### Jernhårde Store Krav på Paywallen (Engelsk):
1. Overskrift: *"EspressoFlow PRO – $4.99 / 49 DKK (Lifetime Access)"*.
2. Tagline: *"No recurring fees. Pay once, dial in forever."*
3. Features: *"Unlimited real-time scale OCR & flow curves, channeling detection, coffee bean journal, smart grind dial-in"*.
4. Gendan-knap: *"Restore Purchases"* (`restorePurchases()`).
5. Links: *"Terms of Service"* og *"Privacy Policy"* (`https://espressoflow.vercel.app/terms` og `/privacy`).

---

## 4. DESIGN SYSTEM: "ESPRESSO WARMTH" (CLAUDE UI & SKRIVEMASKINE-ÆSTETIK)

Inspireret af Anthropic Claudes varme, dæmpede "editorial" look kombineret med en klassisk analog barista-journal / feltnotesbog.

### 🎨 Farvepalet (Palette Breakdown)
* **Canvas / Background:** Varm creme / pergament (`#FAF7F2`) – behageligt for øjnene i et morgenbelyst køkken.
* **Cards & Containers:** Blød off-white / latte (`#FFFDF9`) med 1px fin dæmpet ramme.
* **Primary Text:** Dark Espresso / Roasted Bean (`#2C2018`) – blødere end kulsort, men med knivskarp kontrast.
* **Secondary Text / Labels:** Muted Taupe / Earth (`#7A6E65`).
* **Dividers & Lines:** Fine 1px linjer i warm-gray / clay (`#E8DFD5`) – ingen tunge kasser!
* **Accent (Buttons & Graph):** Terracotta / Clay Red (`#C26D52`) – Claudes ikoniske varme signaturfarve.
* **Status Colors:**
  * 🟢 **Perfect Flow:** Muted Sage / Olive (`#72806B`).
  * 🔴 **Channeling / Alert:** Muted Rust / Brick (`#B85B48`).

---

### 🖋️ Typografi: Hvorfor Skrivemaskine-Font (`Courier Prime`) er Genial
1. **Monospace Stabilitet under Brygning:**  
   Da alle tal og tegn fylder præcis det samme i bredden, hopper tallene (`18.1g` $\rightarrow$ `18.2g` $\rightarrow$ `18.3g`) **ikke** rundt på skærmen, når vægten stiger i realtid. Det giver et roligt og laboratorie-præcist indtryk.
2. **Autentisk Analog Barista-Stemning:**  
   Giver følelsen af en personlig feltnotebog frem for et koldt medicinsk instrument.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        parchment: '#FAF7F2',   // Warm parchment canvas
        cardBg: '#FFFDF9',      // Soft latte card background
        espresso: '#2C2018',    // Dark roast primary text
        taupe: '#7A6E65',       // Muted secondary taupe
        terracotta: '#C26D52',  // Claude terracotta accent
        lineColor: '#E8DFD5',   // Subtle 1px dividers
        sage: '#72806B',        // Muted sage green (optimal)
        rust: '#B85B48',        // Dusty rust red (channeling)
      },
      fontFamily: {
        typewriter: ['"Courier Prime"', 'monospace'],
      },
    },
  },
};
```

---

### 📜 Sådan ser layoutet ud på rent Engelsk (ASCII Mockup)
```
===========================================================
[LOG BOOK #042] -- ESPRESSO DIAL-IN
===========================================================
> BEAN........: Ethiopia Yirgacheffe
> ROAST DATE..: AUG 12 (14 days off roast)
> TARGET......: 18.0g IN --> 36.0g OUT [28-30s]
-----------------------------------------------------------
LIVE CAMERA SCALE MONITOR
-----------------------------------------------------------
+-----------------------------------------------------+
|                                                     |
|                 [ O C R   A C T I V E ]             |
|                 CURRENT WEIGHT : 18.4 g             |
|                 FLOW RATE      :  1.2 g/s           |
|                                                     |
+-----------------------------------------------------+
-----------------------------------------------------------
EXTRACTION PROFILE & FLOW RATE (g/s)
-----------------------------------------------------------
30g |               _.-'
15g |          _.-''
 0g +-----------------------------------
    00s       10s       20s       30s
-----------------------------------------------------------
BARISTA RECOMMENDATION & DIAL-IN
-----------------------------------------------------------
[!] FLOW WAS SLIGHTLY TOO FAST MID-SHOT.
--> GRINDER ADJUSTMENT: Step down from 3.5 to 3.0 (finer)
--> PUCK PREPARATION..: Use WDT needle tool to eliminate channeling.
===========================================================
[ SAVE BATCH ]                           [ RETRY SHOT ]
===========================================================
```

---

## 5. KAMERA & VÆGTAFLÆSNING: OCR COMPUTER VISION & KALIBRERING (TRIN 0)

### Hvorfor vi KUN filmer vægten (og IKKE kaffestrålen)
At filme et bottomless portafilter med et mobilkamera kræver 120 fps, laboratoriebelysning og er sårbart over for sprit og dråber.  
**Vægtens tal over tid afslører præcis det samme – men 100% matematisk og pålideligt!**

### Kalibrerings-knappen ("Step 0" Calibration)
1. Brugeren stiller mobilen op ad en kop på bordet med kameraet mod vægtens display.
2. Tryk på **"Calibrate Scale"**: Appen tegner en **terracotta/grøn ramme** over tallene.
3. Appen laver et automatisk **"tare/zero"-tjek**:
   * Den bekræfter på skærmen: *"Zero detected! Reading 0.0g."*
4. **Auto-Start Timer:** Så snart vægten skifter fra `0.0g` til `0.1g`, starter appens timer og flowmåling automatisk uden berøring.

### 7-Segment OCR & Støjfilter
Espressovægte benytter 7-segment LED/LCD skærme.  
Vi kører et letvægts Canvas filter (kontrast + threshold), som isolerer cifrene.  
**Støjfilter:** Hvis en dampsky eller et skærmblink et kort sekund aflæser `88.2g` i stedet for `18.2g`, kasserer filteret målingen automatisk.

---

## 6. AI KVÆRN-KALIBRERING & BØNNE-SCANNING (BAG + BEANS)

### 1. Bønne-scanning via AI Kamera (Quick Onboarding)
* **Billede 1: The Coffee Bag (Label OCR)**
  * Aflæser automatisk: Roaster, Bean variety (e.g. 100% Arabica), Origin/Region, Roast Date, Tasting notes (e.g. *"chocolate, citrus, blueberry"*).
  * **$CO_2$ Degassing Alert:** Hvis kaffen er ristet for under 3–5 dage siden, advarer appen: *"Coffee was roasted 2 days ago. Expect active CO2 degassing and fluctuating flow rate."*
* **Billede 2: The Coffee Beans**
  * Analyserer ristningsgrad (light vs. dark roast) og overfladeolie.
  * Mørke, olierede bønner er porøse og kræver grovere kværn og lavere temperatur.
  * Lyse bønner er hårde og kræver finere kværn og højere temperatur.

---

### 2. Kværn-Profil & Specifikke "Click"-Anbefalinger
Kværne bruger vidt forskellige skalaer (Fellow Opus, Eureka Mignon, DF64, Sage Smart Grinder Pro osv.).  
Appen lader brugeren vælge sin kværnmodel og giver præcise anbefalinger:
* *"Step down from 3.5 to 3.0 (grind finer)"*
* Appen lærer kværnens følsomhed over tid (*"On this grinder, 0.5 steps shifts extraction time by approx. 4 seconds"*).

---

## 7. ESPRESSO FLOW MATEMATIK, KANALISERING & SMAGS-FEEDBACK

### Standard Espresso Formler
* **Dose ($D$):** Vægt af tør kaffe i portafilteret (f.eks. $18.0\text{ g}$).
* **Yield ($Y$):** Vægt af brygget espresso i koppen (standard 1:2 ratio $\rightarrow 36.0\text{ g}$).
* **Realtime Flow Rate ($F$):**
  $$F(t) = \frac{\Delta Y}{\Delta t} \quad [\text{g/s}]$$

### Matematisk Detektering af Kanalisering (Channeling)
* **Perfect Shot:** Flowet er stabilt og lineært omkring $1.2 - 1.5\text{ g/s}$.
* **Channeling Detected:** Flowet starter roligt, men knækker pludseligt og skyder op på $3.5 - 4.0\text{ g/s}$ midtvejs. Vandet har brudt en kanal igennem kaffepucken.

### Enkel Smags-Feedback efter Brygning (Taste Engine)
Efter skuddet spørger appen helt simpelt:
> *"How did it taste?"*  
> `[ Sour ]` `[ Bitter ]` `[ Balanced / Great ]` `[ Watery ]`

Ved at kombinere **smagsfeedback** med **den matematiske flowkurve** sammensættes det perfekte råd til næste kop!

---

## 8. IOS CI/CD & FASTLANE PIPELINE (TESTFLIGHT)

Da du allerede har en aktiv **Apple Developer Program konto (`39T28DB5D4`)**, genbruger du **95% af workflowet direkte**!

### Genbrug fra TømrerAppen:
1. `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID` og `APP_STORE_CONNECT_PRIVATE_KEY`.
2. `APPLE_CERTIFICATE_BASE64` + adgangskode.

### Det eneste nye hos Apple:
1. Opret App ID `com.mh.espressoflow` i Apple Developer Portal.
2. Opret appen i App Store Connect med **Primary Language = English (U.S.)**.
3. Kør `gh workflow run ios-build.yml` – og du har **Build 1 i TestFlight på din iPhone på under 3 minutter!**

---

## 9. ANDROID KLARGØRING, SIGNERING & GOOGLE PLAY CONSOLE (AAB)

### 1. Tilføj Android Platform til Projektet
```bash
npm install @capacitor/android
npx cap add android
```

### 2. Android Kameratilladelser (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
<uses-permission android:name="android.permission.INTERNET" />
```

### 3. Byg `.aab` Fil og Installer på 5 Minutter via Internt Testspor
1. Generer din keystore (nøgle til signering):
   ```bash
   keytool -genkey -v -keystore espressoflow-release.keystore -alias espressoflow -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Byg produktionsfilen:
   ```bash
   npx cap sync android
   cd android && ./gradlew bundleRelease
   ```
3. Upload `app-release.aab` til **Google Play Console -> Internal Testing**:
   * Tilføj din egen Gmail, og du kan hente appen direkte på din Android-telefon uden at afvente godkendelse!
   * Sæt **Default Language = English (United States)**.

---

## 10. TEKNOLOGISTAK & PROJEKTSTRUKTUR (ENGLISH-ONLY, NO I18N)

Du kan frit vælge mellem **React + Vite** eller **Next.js 16** (begge hostes 100% gratis på Vercel og pakkes med Capacitor):

```
espresso-flow/
├── .github/
│   └── workflows/
│       └── ios-build.yml          <-- Automated TestFlight CI/CD
├── android/                       <-- Native Android project
│   └── app/src/main/
│       └── AndroidManifest.xml    <-- Camera permissions
├── ios/                           <-- Native iOS project
│   ├── App/App/Info.plist         <-- NSCameraUsageDescription
│   └── App/fastlane/Fastfile      <-- Fastlane TestFlight upload
├── public/
│   └── assets/                    <-- Coffee icons and graphics
├── src/
│   ├── app/ (or views/)
│   │   ├── page.tsx               <-- Live camera scanner & logbook
│   │   ├── beans/page.tsx         <-- Bean scanning & AI label OCR
│   │   ├── grinder/page.tsx       <-- Grinder profiles & calibration
│   │   ├── privacy/page.tsx       <-- English Privacy Policy (Vercel)
│   │   ├── terms/page.tsx         <-- English Terms of Service (Vercel)
│   │   └── support/page.tsx       <-- English Support page (Vercel)
│   ├── components/
│   │   ├── ScaleScanner.tsx       <-- Camera stream + crosshairs (Step 0)
│   │   ├── TypewriterLog.tsx      <-- Analog typewriter logbook (Courier Prime)
│   │   ├── FlowChart.tsx          <-- Realtime g/s chart in terracotta
│   │   ├── TasteFeedback.tsx      <-- "How did it taste?" feedback
│   │   └── PaywallModal.tsx       <-- Monthly PRO ($3.99/mo) with Apple/Google Pay
│   ├── lib/
│   │   ├── ocr.ts                 <-- 7-segment digital scale OCR
│   │   ├── espressoMath.ts        <-- Flow rate, ratio, and channeling logic
│   │   └── purchases.ts           <-- Unified RevenueCat integration
│   └── types/
│       └── espresso.ts            <-- Types for shots, grinders, and beans
├── capacitor.config.ts            <-- Capacitor config (iOS + Android)
├── tailwind.config.js             <-- "Espresso Warmth" palette & Courier Prime
└── package.json
```

---

## 11. TRIN-FOR-TRIN KØREPLAN VED PROJEKTSTART

1. **Opret nyt GitHub Repository (`MichaelKHans/EspressoFlow`)**:
   - Initialiser projektet og forbind til Vercel (gratis underdomæne `espressoflow.vercel.app`).
2. **Kopier de 5 GitHub Secrets over til iOS CI/CD**:
   - Genbrug dine eksisterende Apple secrets direkte fra TømrerAppen.
3. **Klargør App ID i Apple Developer & Google Play Console**:
   - Sæt **Primary Language til English (US)** på begge platforme.
   - Indsæt det gratis Vercel privacy link (`https://espressoflow.vercel.app/privacy`).
4. **Opret Fælles Månedligt Abonnement i RevenueCat**:
   - Opret projekt *"Espresso Flow"*.
   - Knyt Apple App og Google Play App.
   - Opret Entitlement `pro` ($3.99 / month med 7-day free trial).
5. **Opsæt "Espresso Warmth" Design Systemet**:
   - Konfigurer Tailwind med pergament (`#FAF7F2`), Claude terracotta (`#C26D52`) og Courier Prime skrivemaskine-skrift.
6. **Byg Kamera Vægtaflæsning & Step 0 Kalibrering**:
   - Byg sigtekorns-komponenten og nulstil/tara tjekket (`0.0g`).
   - Forbind OCR filteret med live flow grafen ($g/s$).
7. **Byg Kværn-vælger & Taste Feedback Motoren**:
   - Kværnindstilling i clicks og *"How did it taste?"* feedback.
8. **Byg & Test på iPhone (TestFlight) og Android (Internal Testing)**:
   - Kør iOS workflowet (`gh workflow run ios-build.yml`) og Android (`./gradlew bundleRelease`).
   - Nyd en kop perfekt espresso foran kameraet på dine egne telefoner!
