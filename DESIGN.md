# ☕ Flowbean (Espresso Flow) – Design System & Stitch Prototyping Guide

> **Formål:** Dette dokument samler appens visuelle identitet, design-tokens, typografi og skærmbeskrivelser. Det er optimeret til direkte brug med AI-designværktøjer som **Google Stitch** (`stitch.withgoogle.com`), Figma AI eller v0 for at udforske nye layouts, mikro-interaktioner og æstetiske elevationer.

---

## 🎨 1. Brand Identitet & Designfilosofi

**Flowbean** er en specialiseret telemetri- og brygge-app til passionerede baristaer og specialty coffee-entusiaster.

- **Vibe:** "Espresso Warmth" – det perfekte møde mellem **analog kaffebar-varme** (naturligt pergament, varm mælk, mørkristet espresso, terracotta) og **laboratorie-præcision** (realtids flow-rate, 20-30 FPS telemetri, mono-typografi).
- **Følelse:** Taktil, organisk, rolig, eksklusiv og professionel.
- **Undgå:** Kolde tech-dashboards, neon/cyberpunk, generiske SaaS-blå farver og overfyldte skærme.

---

## 📐 2. Design Tokens & Farvepalette (Tailwind CSS v4)

Brug altid disse præcise tokens for at bevare genkendelighed og harmoni:

### Primære Farver (Espresso Warmth)
| Token | Hex | Beskrivelse / Brug |
|---|---|---|
| `--color-parchment` | `#FAF7F2` | Primær app-baggrund (varmt pergament / let kaffetone) |
| `--color-latte` | `#FFFDF9` | Kort, modaler og paneler (varm let mælketone) |
| `--color-espresso` | `#2C2018` | Hovedtekst, mørke knapper og accenter (mørkristet kaffe) |
| `--color-terracotta` | `#C26D52` | Primær handling, fremhævelser og CTA-elementer |
| `--color-taupe` | `#7A6E65` | Sekundær tekst, metadata og inaktive ikoner |
| `--color-line` | `#D0BDAA` | Fine rammer, separatorer og skillelinjer |
| `--color-line-strong` | `#C4B09B` | Tydelige rammer ved fokus eller aktive felter |
| `--color-sage` | `#72806B` | Balanceret smag, succesindikator, friskhed |
| `--color-rust` | `#B85B48` | Advarsel, channeling, bitterhed, stop-knap |

### Typografi
- **Primær UI Font:** `Inter` (Sans-serif) – Ren, moderne og læsevenlig til labels, knapper og navigation.
- **Telemetri & Tal Font:** `Courier Prime` (Monospace) – Brugt til alle vægttal, tidsstempler, flow rates ($g/s$) og ratios, så tal **aldrig hopper eller skifter bredde** i realtid.

---

## 📱 3. Kritiske Skærme & Prompt-Skabeloner til Google Stitch

Når du arbejder i **Google Stitch**, upload appens nuværende screenshots og brug disse strukturerede prompts:

### Skærm A: Scale Cam / Live Brew HUD (Kamera- & Bryggeskærm)
```text
Role & Context: Redesign the live brewing screen for "Flowbean", a specialty espresso telemetry app.
Visual Style: Warm, tactile, Claude-inspired parchment palette (#FAF7F2 background, #FFFDF9 cards, #2C2018 text, #C26D52 terracotta accents).

Key Layout Elements:
1. Live Camera Feed Viewport (top/center): Clean viewport showing digital espresso scale under the cup with a minimalist bounding target box.
2. Floating Telemetry Island (bottom/overlay):
   - Huge, legible digital weight display in Monospace (e.g., "36.4 g").
   - Live extraction timer (e.g., "00:27").
   - Live flow rate gauge/sparkline (e.g., "1.8 g/s") with a subtle extraction stability curve.
   - Real-time Channeling & Flow Spike alert banner (pulsing terracotta pill if water shoots through puck).
   - Target yield ratio progress indicator (e.g., "1:2.0 target reached").
3. Barista Ergonomics: Large, tactile "Stop Shot" / "Tare" buttons designed for one-handed operation while holding a portafilter or cup. Zero visual clutter.
```

### Skærm B: Shot Summary & Dial-In Modal (Resultat & Smagsevaluering)
```text
Role & Context: Redesign the post-espresso shot analysis modal for "Flowbean".
Visual Style: Warm, organic, specialty coffee lab aesthetics.

Key Layout Elements:
1. Hero Extraction Score Card:
   - Final Yield (e.g. 36.2g in 28s at 18.0g dose -> 1:2.01 ratio).
   - Visual flow curve chart showing extraction phases (pre-infusion, peak flow, blonding) with Channeling Spike pin/marker (e.g. "Spike @ 14s (3.8 g/s)").
2. Puck Health & Anomaly Badge: Indicator showing whether extraction was steady or suffered from micro-channeling / puck erosion.
3. Sensory Taste Dial (Tactile 3-point or 5-point slider/buttons):
   - Sour (Under-extracted) -> Balanced (Sweet spot) -> Bitter (Over-extracted).
4. Intelligent Dial-In Recommendation Pill:
   - Contextual advice (e.g. "Channeling detected: Keep grind setting, focus on WDT and even tamping" OR "Flow too fast: grind 1 notch finer").
5. Bean & Recipe Tagging: Subtle badge showing the active coffee bean and roast date.

### Skærm C: Beandex – Coffee Bean Vault & Cards (Bønnehvælving)
```text
Role & Context: Redesign the coffee bean collection ("Beandex") screen for specialty coffee enthusiasts.
Visual Style: Warm tactile cards resembling craft coffee packaging and textured paper tags.

Key Layout Elements:
1. Coffee Bean Cards:
   - Roastery name & Coffee origin/variety (e.g., "La Cabra - Ethiopia Guji").
   - Roast Date with a visual horizontal timeline ("Peak Flavor Window" showing Resting, Sweetness Peak, Past Peak).
   - Flavor Profile chips (e.g., "Bergamot", "Jasmine", "Peach").
   - Dialed-In Recipe Box: "18.0g In -> 36.2g Out @ 28s | Setting 3.2 on Niche Zero".
   - Direct Action CTA: "Start Brew with this Bean" button for 1-tap transition to scale camera.
2. Quick Actions: Scan Bag OCR button, Add New Bean CTA, Filter by Active / Finished Bags.
```

### Skærm D: Barista Deck & Coffee Bar (Forside / Hovedskærm)
```text
Role & Context: Redesign the main "Coffee Bar / Barista Deck" frontpage for "Flowbean".
Visual Style: High-end specialty coffee lounge meets precision barista station. Warm parchment (#FAF7F2), warm latte (#FFFDF9), espresso dark roast (#2C2018), and terracotta (#C26D52).

Key Layout Elements:
1. Method & Station Switcher (Top):
   - Tactile dual switch: [ ☕ Espresso Bar ] vs [ 🫗 Pour Over Bar ] with warm terracotta indicator and smooth pill tabs.
2. Active Coffee Bean Spotlight (Hero Tile):
   - Shows active hopper bean (e.g., "La Cabra • Guji Uraga, Ethiopia • Light Roast").
   - Quick freshness status dot (e.g., "Day 12 • Peak Flavor Window").
   - 1-tap "Switch Bean" or "Scan Bag" quick trigger.
3. Architectural Drink Menu Carousel:
   - Horizontal tactile cards for drinks: Double Espresso, Cortado, Flat White, Cappuccino, Americano, Pour Over.
   - Distinctive drink iconography or minimal architectural cup line-art showing liquid volume ratios (e.g., 1:2 extraction vs 1:4 with silky steamed micro-foam).
   - "DIALED IN" green badge or "NEEDS DIAL-IN" amber badge.
4. Active Drink Recipe Cockpit (Bottom Hero):
   - Selected drink title with dose (e.g. 18.0g), target yield (36.0g), and ratio (1:2.0).
   - Big, commanding, tactile CTA: "PULL SHOT ON SCALE CAM" (Large terracotta action button).
   - Secondary "Dial-In Studio" tuning pill.
```

### Skærm E: Barista Gear & Machinery Station (Gear / Udstyrssiden)
```text
Role & Context: Complete premium redesign of the "Gear & Equipment Station" for "Flowbean". Replace clunky form dropdowns with tactile, hardware-inspired barista workstation modules.
Visual Style: Precision coffee engineering aesthetic. Looks like physical craft coffee equipment (brushed aluminum, textured dark walnut, knurled knobs, laser-etched monospace gauges). Palette: #2C2018, #180E09, #D4A373, #C26D52, #72806B on #FAF7F2.

Key Layout Elements:
1. Grinder Fleet Station (Top Module):
   - Hero Active Grinder Card: Shows current on-bar grinder (e.g., "Baratza Encore ESP Pro" or "Niche Zero").
   - Burr Specification Badge: "40mm M2 Conical Steel" or "64mm Flat SSP DLC".
   - Dial-in Position Gauge: Visual tactile dial showing current calibrated setting (e.g., "Step 15.0 • Micro-Stepped").
   - Fleet Switcher Carousel: Horizontal cards/pills to quickly switch between active grinders or tap "+ Add Grinder to Bar".
   - Burr Learning Status indicator: "Factory Baseline" or "Adaptive Intelligence Active (18 shots learned)".
2. Espresso Machine & Pump Rig (Middle Module):
   - Machine Identity Showcase: (e.g., "De'Longhi Dedica EC685" or "Breville Dual Boiler" or "Linea Micra").
   - Pump Dynamics Tag: "15-Bar Ulka Pulse Pre-Infusion" vs "Rotary Commercial 9-Bar".
   - Safe Pre-Infusion Target Gauge: Tactile slider flanked by [-] and [+] steppers (e.g., "5.0s Pre-Wet Target") with labelled zones (0s Direct 9-bar, 5-8s Specialty Sweet Spot, 15s Long Lever Soak).
   - PID & Boiler Thermostat Card: Digital temperature gauge ("93.0°C / 199.4°F") with quick 3-step or 1°C precision adjuster.
3. Pour Over & Filter Barware (Bottom Module):
   - Active Brewer Card: Minimalist silhouette (e.g., "Hario V60 02 Ceramic" or "Kalita Wave 185" or "Chemex 6-Cup") with flow geometry badge ("Conical Spiral Ribs").
   - Gooseneck Kettle Unit: (e.g., "Fellow Stagg EKG") with calibrated flow-rate restriction notes.
4. Barista Ergonomics: Everything feels like hardware modules on a modern espresso bench. Zero generic HTML dropdowns.
```

---

## 🚀 4. Best Practice Workflow med Google Stitch

1. **Tag 2–3 screenshots af den nuværende app:**
   - Kør `npm run dev` i browseren (eller på mobil) og tag klare screenshots af de skærme, du vil have idéer til.
2. **Åbn Google Stitch (`https://stitch.withgoogle.com/`):**
   - Opret et nyt projekt.
   - Upload dine screenshots som **Reference Images**.
3. **Indsæt design-kontekst:**
   - Kopiér prompten fra sektion 3 ovenfor svarende til den skærm, du designer.
   - Tilføj de specifikke hex-farver fra sektion 2, så Stitch bevarer "Espresso Warmth"-temaet.
4. **Iterér og udvælg detaljer:**
   - Bed Stitch om specifikke variationer (fx: *"Explore a cleaner bottom sheet layout for the telemetry"* eller *"Give the taste rating a more tactile, ceramic button look"*).
5. **Implementering i Flowbean:**
   - Når du finder layouts, knap-former eller grafelementer, du kan lide: Tag et screenshot eller eksportér fra Stitch, og vis det til Anti.
   - Anti implementerer det lynhurtigt i ren Tailwind CSS v4 med fuld hensyntagen til zero-latency og offline arkitektur!
