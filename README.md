# ☕ Espresso Flow

> **Precision Scale OCR & Flow Dynamics for Specialty Coffee Enthusiasts & Baristas**

Espresso Flow transforms any ordinary kitchen or coffee scale into a high-precision extraction lab using optical computer vision and real-time fluid dynamics.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-0.1.0-orange.svg)](package.json)
[![Status](https://img.shields.io/badge/Status-Active%20Development-success.svg)](ROADMAP.md)

---

## 🌟 Key Features

- **7-Segment Scale OCR Vision:** Reads digital LED/LCD scale displays in real time directly on device with zero cloud lag and zero server costs.
- **Real-Time Flow Dynamics:** Calculates instantaneous and rolling flow rates ($F = \Delta Y / \Delta t$ in $g/s$) at 10-20 FPS.
- **Mathematical Channeling Detection:** Identifies turbulent water breakout and puck micro-channels through rate spikes.
- **Espresso Warmth Aesthetics:** Editorial warm palette (`#FAF7F2` parchment, `#FFFDF9` latte, `#2C2018` espresso, `#C26D52` terracotta) combined with monospace `Courier Prime` typography for jitter-free numbers.
- **Barista Dial-In Advisor:** Generates step-by-step grinder recommendations and puck prep instructions based on post-shot taste feedback.
- **Analog Field Logbook:** Local-first extraction history with ratios, brew times, and tasting notes.
- **Cross-Platform Ready:** Built with React 19, Vite, TypeScript, and Tailwind CSS v4, optimized for offline Capacitor iOS/Android packaging.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8
- **Styling:** Tailwind CSS v4 ("Espresso Warmth" design tokens)
- **Typography:** `Courier Prime` (Monospace stability) & `Inter`
- **Mobile Bridge:** Capacitor v7/v8 (iOS & Android)
- **In-App Purchases:** RevenueCat (`@revenuecat/purchases-capacitor`)
- **Hosting:** Vercel (subdomain `espressoflow-app.vercel.app`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation
```bash
git clone https://github.com/MichaelKHans/EspressoFlow.git
cd EspressoFlow
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 📜 Business Model

- **Free Download:** Available worldwide with 100% English UI.
- **7-Day Full Access Trial:** Test camera OCR and extraction flow on your scale with zero friction.
- **Lifetime Pro Unlock:** One-time non-consumable purchase of **$4.99 USD / 49,- DKK** via Apple StoreKit 2 and Google Play Billing. No recurring subscription fatigue.

---

## 📄 Legal & Compliance

- [Privacy Policy](https://espressoflow-app.vercel.app/privacy)
- [Terms of Service](https://espressoflow-app.vercel.app/terms)
- [Support Center](https://espressoflow-app.vercel.app/support)
