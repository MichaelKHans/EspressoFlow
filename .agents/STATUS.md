# Espresso Flow Project Status & History

## Projekt Oversigt
- **Navn:** Espresso Flow
- **Primært sprog:** 100% Engelsk (English US)
- **Design System:** Espresso Warmth (`#FAF7F2`, `#FFFDF9`, `#2C2018`, `#C26D52`) + `Courier Prime`
- **Forretningsmodel:** 7 dages in-app prøveperiode $\rightarrow$ $4.99 / 49,- DKK Lifetime Unlock (RevenueCat)
- **Repository:** `MichaelKHans/EspressoFlow`

---

## 🕒 Historik & Gennemførte Opgaver

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
