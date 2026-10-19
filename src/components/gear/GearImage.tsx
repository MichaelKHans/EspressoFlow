import React, { useState, useEffect } from 'react';

interface GearImageProps {
  src?: string;
  alt: string;
  category: 'grinder' | 'machine' | 'brewer' | 'kettle';
  className?: string;
  subType?: string;
}

export const GearImage: React.FC<GearImageProps> = ({
  src,
  alt,
  category,
  className = 'w-full h-full object-contain',
  subType,
}) => {
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  const altLower = alt.toLowerCase();
  const subLower = (subType || '').toLowerCase();

  // Normalize potential singular vs plural image paths
  const normalizedSrc = src
    ? src
        .replace('/images/gear/grinder/', '/images/gear/grinders/')
        .replace('/images/gear/machine/', '/images/gear/machines/')
        .replace('/images/gear/brewer/', '/images/gear/brewers/')
        .replace('/images/gear/kettle/', '/images/gear/kettles/')
    : undefined;

  if (hasError || !normalizedSrc) {
    return (
      <div
        className="w-full h-full flex items-center justify-center p-2 select-none"
        title={alt}
      >
        {/* =========================================================================
            1. GRINDER SILHOUETTES
           ========================================================================= */}
        {category === 'grinder' && (
          (subLower.includes('manual') || altLower.includes('1zpresso') || altLower.includes('kingrinder') || altLower.includes('comandante')) ? (
            /* Manual Hand Grinder with Top Crank & Wooden Knob */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Crank Arm & Wooden Knob */}
              <circle cx="48" cy="10" r="3.5" fill="#C26D52" stroke="#2C2018" strokeWidth="1.5" />
              <path d="M48 10 C38 6, 26 8, 32 14" stroke="#2C2018" strokeWidth="2.5" />
              <circle cx="32" cy="14" r="2.5" fill="#2C2018" />
              {/* Top Cap */}
              <rect x="25" y="14" width="14" height="4" rx="1.5" fill="#D0BDAA" stroke="#2C2018" strokeWidth="1.5" />
              {/* Knurled Upper Body */}
              <rect x="24" y="18" width="16" height="20" rx="2" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              <line x1="26" y1="24" x2="38" y2="24" stroke="#A6998E" strokeDasharray="1 1.5" strokeWidth="1.5" />
              <line x1="26" y1="28" x2="38" y2="28" stroke="#A6998E" strokeDasharray="1 1.5" strokeWidth="1.5" />
              <line x1="26" y1="32" x2="38" y2="32" stroke="#A6998E" strokeDasharray="1 1.5" strokeWidth="1.5" />
              {/* External Adjustment Collar Ring */}
              <rect x="22" y="38" width="20" height="5" rx="1" fill="#C26D52" stroke="#2C2018" strokeWidth="1.5" />
              {/* Catch Cup */}
              <rect x="24" y="43" width="16" height="15" rx="2" fill="#2C2018" fillOpacity="0.12" stroke="#2C2018" strokeWidth="1.8" />
            </svg>
          ) : (subLower.includes('single-dose') || altLower.includes('df54') || altLower.includes('df83') || altLower.includes('df64') || altLower.includes('philos') || altLower.includes('lagom') || altLower.includes('sculptor') || altLower.includes('zero')) ? (
            /* Modern Single-Dose Tilted / Low-Retention Grinder */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Silicone Bellows / Single-Dose Hopper */}
              <ellipse cx="32" cy="10" rx="10" ry="2" stroke="#2C2018" strokeWidth="2" />
              <path d="M22 10 L25 18 L39 18 L42 10 Z" fill="#D0BDAA" fillOpacity="0.3" stroke="#2C2018" strokeWidth="1.6" />
              {/* Aluminum Tilted Body */}
              <path d="M24 18 L40 18 L38 46 L22 46 Z" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              {/* Micrometric Dial Indicator */}
              <line x1="23" y1="24" x2="39" y2="24" stroke="#C26D52" strokeWidth="2.5" />
              <circle cx="31" cy="24" r="1.5" fill="#FAF7F2" stroke="#C26D52" />
              {/* Anti-Static Chute */}
              <path d="M28 32 L34 32 L32 38 L30 38 Z" fill="#2C2018" />
              {/* Magnetic Dosing Cup */}
              <rect x="25" y="40" width="12" height="14" rx="2" fill="#2C2018" fillOpacity="0.2" stroke="#2C2018" strokeWidth="1.5" />
              {/* Heavy Base Foot */}
              <line x1="16" y1="56" x2="48" y2="56" stroke="#2C2018" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (altLower.includes('ek43') || subLower.includes('unimodal')) ? (
            /* Commercial Unimodal Reference Grinder (EK43 / EK43S) */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Tall Glass Hopper */}
              <path d="M22 6 L42 6 L38 18 L26 18 Z" fill="#D0BDAA" fillOpacity="0.25" stroke="#2C2018" strokeWidth="1.5" />
              <ellipse cx="32" cy="6" rx="10" ry="1.5" stroke="#2C2018" strokeWidth="1.8" />
              {/* Hopper Shut-off Slide */}
              <line x1="22" y1="18" x2="42" y2="18" stroke="#C26D52" strokeWidth="2.5" />
              {/* Massive Vertical Motor Column */}
              <rect x="22" y="18" width="20" height="36" rx="2" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              {/* Iconic Large Rotary Front Dial with Reference Markers */}
              <circle cx="32" cy="30" r="6" fill="#2C2018" stroke="#C26D52" strokeWidth="1.8" />
              <circle cx="32" cy="30" r="2" fill="#FAF7F2" />
              <line x1="32" y1="24" x2="32" y2="26" stroke="#C26D52" strokeWidth="1.5" />
              <line x1="38" y1="30" x2="36" y2="30" stroke="#C26D52" strokeWidth="1.5" />
              <line x1="32" y1="36" x2="32" y2="34" stroke="#C26D52" strokeWidth="1.5" />
              <line x1="26" y1="30" x2="28" y2="30" stroke="#C26D52" strokeWidth="1.5" />
              {/* Bag Clamp Lever & Dispensing Spout */}
              <path d="M28 40 L36 40 L34 46 L30 46 Z" fill="#2C2018" />
              <line x1="36" y1="41" x2="43" y2="43" stroke="#C26D52" strokeWidth="2.2" strokeLinecap="round" />
              {/* Heavy Pedestal Base Plate */}
              <rect x="14" y="54" width="36" height="5" rx="1.5" fill="#2C2018" stroke="#2C2018" strokeWidth="1.8" />
            </svg>
          ) : (
            /* Commercial / Hopper Electric Grinder */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Bean Hopper on top */}
              <path d="M20 8 L44 8 L38 22 L26 22 Z" fill="#D0BDAA" fillOpacity="0.25" />
              <line x1="22" y1="8" x2="42" y2="8" strokeWidth="2.2" />
              <ellipse cx="32" cy="8" rx="12" ry="2" />
              {/* Grinder Body */}
              <rect x="22" y="22" width="20" height="30" rx="3" fill="#2C2018" fillOpacity="0.08" />
              {/* Adjustment Collar / Dial */}
              <line x1="20" y1="26" x2="44" y2="26" stroke="#C26D52" strokeWidth="2.5" />
              <circle cx="32" cy="26" r="1.5" fill="#C26D52" />
              {/* Ground coffee chute */}
              <path d="M29 34 L35 34 L33 40 L31 40 Z" fill="#2C2018" fillOpacity="0.4" />
              {/* Dosing cup / Base */}
              <rect x="26" y="44" width="12" height="12" rx="2" fill="#FAF7F2" />
              <line x1="16" y1="58" x2="48" y2="58" strokeWidth="2.2" />
            </svg>
          )
        )}

        {/* =========================================================================
            2. ESPRESSO MACHINE SILHOUETTES
           ========================================================================= */}
        {category === 'machine' && (
          (subLower.includes('lever') || altLower.includes('robot') || altLower.includes('flair') || altLower.includes('picopresso')) ? (
            /* Manual Lever Espresso Machine (Cafelat Robot, Flair 58) */
            <svg
              className="w-full h-full max-w-[90px] max-h-[90px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Dual Lever Arms */}
              <circle cx="16" cy="14" r="3" fill="#C26D52" />
              <line x1="16" y1="14" x2="28" y2="24" strokeWidth="2.5" stroke="#2C2018" />
              <circle cx="48" cy="14" r="3" fill="#C26D52" />
              <line x1="48" y1="14" x2="36" y2="24" strokeWidth="2.5" stroke="#2C2018" />
              {/* Top Pressure Gauge / Piston Cylinder */}
              <circle cx="32" cy="18" r="4.5" fill="#FAF7F2" stroke="#C26D52" strokeWidth="1.5" />
              <line x1="32" y1="18" x2="34" y2="16" stroke="#C26D52" strokeWidth="1.5" />
              {/* Central Heated Cylinder */}
              <rect x="26" y="24" width="12" height="16" rx="2" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              {/* 58mm Portafilter Handle */}
              <rect x="24" y="40" width="16" height="4" rx="1" fill="#2C2018" />
              <line x1="38" y1="42" x2="52" y2="44" strokeWidth="2.5" stroke="#7A6E65" strokeLinecap="round" />
              {/* Base Feet */}
              <path d="M18 56 L46 56" stroke="#2C2018" strokeWidth="3" strokeLinecap="round" />
              <line x1="22" y1="46" x2="18" y2="56" stroke="#2C2018" strokeWidth="2" />
              <line x1="42" y1="46" x2="46" y2="56" stroke="#2C2018" strokeWidth="2" />
            </svg>
          ) : (subLower.includes('e61') || altLower.includes('bianca') || altLower.includes('mara') || altLower.includes('synchronika') || altLower.includes('appartamento') || altLower.includes('giotto') || altLower.includes('pro 600') || altLower.includes('pro 700')) ? (
            /* Traditional E61 Chrome Grouphead & Manometers */
            <svg
              className="w-full h-full max-w-[90px] max-h-[90px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Chrome Body */}
              <rect x="12" y="10" width="40" height="42" rx="3" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              {/* Cup Rail */}
              <line x1="16" y1="8" x2="48" y2="8" stroke="#7A6E65" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="8" x2="18" y2="10" stroke="#7A6E65" strokeWidth="1.5" />
              <line x1="46" y1="8" x2="46" y2="10" stroke="#7A6E65" strokeWidth="1.5" />
              {/* Dual Manometers (Pump & Steam) */}
              <circle cx="20" cy="20" r="4" fill="#FAF7F2" stroke="#C26D52" strokeWidth="1.5" />
              <circle cx="44" cy="20" r="4" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.5" />
              {/* Iconic E61 Heavy Brass Mushroom & Group */}
              <path d="M28 14 L36 14 L34 26 L30 26 Z" fill="#D0BDAA" stroke="#2C2018" strokeWidth="1.6" />
              {/* E61 Lever / Paddle */}
              <circle cx="39" cy="26" r="2" fill="#C26D52" />
              <line x1="39" y1="26" x2="43" y2="28" stroke="#C26D52" strokeWidth="2" strokeLinecap="round" />
              {/* Portafilter */}
              <rect x="25" y="32" width="14" height="4" rx="1" fill="#2C2018" />
              <line x1="37" y1="34" x2="49" y2="37" strokeWidth="2.5" stroke="#2C2018" strokeLinecap="round" />
              {/* Drip Tray */}
              <rect x="10" y="52" width="44" height="6" rx="2" fill="#2C2018" fillOpacity="0.1" stroke="#2C2018" strokeWidth="1.8" />
            </svg>
          ) : (subLower.includes('superautomatic') || subLower.includes('bean-to-cup') || altLower.includes('magnifica') || altLower.includes('eletta') || altLower.includes('miele') || altLower.includes('jura') || altLower.includes('lattego')) ? (
            /* Bean-to-Cup Superautomatic */
            <svg
              className="w-full h-full max-w-[90px] max-h-[90px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Hopper on Top */}
              <rect x="20" y="8" width="24" height="6" rx="2" fill="#D0BDAA" fillOpacity="0.3" stroke="#2C2018" strokeWidth="1.5" />
              {/* Main Chassis Body */}
              <rect x="14" y="14" width="36" height="42" rx="3" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              {/* Digital Display / Touch Screen */}
              <rect x="20" y="18" width="24" height="8" rx="1.5" fill="#2C2018" stroke="#2C2018" strokeWidth="1.2" />
              <line x1="24" y1="22" x2="32" y2="22" stroke="#C26D52" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="38" cy="22" r="1" fill="#FAF7F2" />
              {/* Central Height-Adjustable Dual Coffee Dispenser */}
              <rect x="25" y="28" width="14" height="10" rx="1.5" fill="#D0BDAA" stroke="#2C2018" strokeWidth="1.5" />
              <line x1="28" y1="38" x2="28" y2="41" stroke="#2C2018" strokeWidth="2" strokeLinecap="round" />
              <line x1="36" y1="38" x2="36" y2="41" stroke="#2C2018" strokeWidth="2" strokeLinecap="round" />
              {/* Milk / Steam Frother Wand */}
              <path d="M44 26 L48 26 L48 42 L46 44" stroke="#7A6E65" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Chrome Drip Grid */}
              <rect x="12" y="52" width="40" height="6" rx="2" fill="#2C2018" fillOpacity="0.1" stroke="#2C2018" strokeWidth="1.8" />
              <line x1="16" y1="52" x2="48" y2="52" stroke="#2C2018" strokeDasharray="2 2" />
            </svg>
          ) : (
            /* Modern Thermoblock / PID Compact Machine */
            <svg
              className="w-full h-full max-w-[90px] max-h-[90px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Machine Top & Cup Warmer */}
              <rect x="14" y="10" width="36" height="42" rx="4" fill="#2C2018" fillOpacity="0.06" stroke="#2C2018" strokeWidth="1.8" />
              <line x1="18" y1="14" x2="46" y2="14" stroke="#D0BDAA" strokeWidth="1.5" />
              {/* Pressure / Telemetry Gauge */}
              <circle cx="24" cy="22" r="5" fill="#FAF7F2" stroke="#C26D52" strokeWidth="1.5" />
              <line x1="24" y1="22" x2="26" y2="20" stroke="#C26D52" strokeWidth="1.5" />
              {/* Power / Steam Switch */}
              <circle cx="40" cy="22" r="2.5" fill="#2C2018" />
              {/* Grouphead & Portafilter */}
              <rect x="24" y="30" width="16" height="4" rx="1" fill="#2C2018" />
              <path d="M27 34 L37 34 L35 40 L29 40 Z" fill="#2C2018" fillOpacity="0.2" />
              <line x1="37" y1="36" x2="48" y2="39" strokeWidth="2.5" stroke="#7A6E65" strokeLinecap="round" />
              {/* Drip Tray */}
              <rect x="12" y="52" width="40" height="6" rx="2" fill="#D0BDAA" fillOpacity="0.3" strokeWidth="1.8" />
              <line x1="16" y1="52" x2="48" y2="52" strokeDasharray="2 2" stroke="#2C2018" />
            </svg>
          )
        )}

        {/* =========================================================================
            3. FILTER & MANUAL BREWER SILHOUETTES
           ========================================================================= */}
        {category === 'brewer' && (
          (altLower.includes('french') || altLower.includes('stempel') || subLower.includes('immersion') && !altLower.includes('aeropress')) ? (
            /* French Press Silhuette */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Glass Carafe */}
              <rect x="20" y="16" width="24" height="38" rx="2" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              <line x1="18" y1="16" x2="20" y2="18" stroke="#2C2018" strokeWidth="1.8" />
              {/* Plunger Knob & Rod */}
              <circle cx="32" cy="8" r="3" fill="#C26D52" stroke="#2C2018" strokeWidth="1.5" />
              <line x1="32" y1="11" x2="32" y2="34" strokeWidth="2" stroke="#2C2018" />
              {/* Metal Mesh Filter Disc */}
              <line x1="21" y1="34" x2="43" y2="34" stroke="#C26D52" strokeWidth="3" />
              {/* Handle */}
              <path d="M44 22 C52 22, 52 44, 44 46" strokeWidth="2.5" stroke="#7A6E65" />
              {/* Metal Frame Holder & Base */}
              <path d="M19 28 L45 28" stroke="#D0BDAA" strokeWidth="1.5" />
              <path d="M19 44 L45 44" stroke="#D0BDAA" strokeWidth="1.5" />
              <line x1="18" y1="54" x2="46" y2="54" strokeWidth="2.2" stroke="#2C2018" />
            </svg>
          ) : (altLower.includes('moka') || altLower.includes('brikka') || subLower.includes('moka')) ? (
            /* Bialetti Moka Pot Octagonal Silhouette */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Top Lid Knob */}
              <polygon points="32,8 35,12 29,12" fill="#C26D52" stroke="#2C2018" strokeWidth="1.5" />
              {/* Upper Pot (Faceted Octagonal) */}
              <path d="M22 14 L42 14 L44 32 L20 32 Z" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              {/* Spout */}
              <path d="M20 18 L15 16 L20 22" stroke="#2C2018" strokeWidth="1.8" fill="#FAF7F2" />
              {/* Center Waist Ring */}
              <rect x="22" y="32" width="20" height="3" fill="#2C2018" />
              {/* Lower Water Boiler */}
              <path d="M22 35 L42 35 L39 54 L25 54 Z" fill="#D0BDAA" fillOpacity="0.3" stroke="#2C2018" strokeWidth="1.8" />
              {/* Safety Valve */}
              <circle cx="24" cy="40" r="1.5" fill="#C26D52" />
              {/* Bakelite Handle */}
              <path d="M43 18 C52 20, 52 42, 41 44" stroke="#2C2018" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (altLower.includes('aeropress') || altLower.includes('delter')) ? (
            /* AeroPress Cylinder & Plunger */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Top Plunger Flange */}
              <rect x="20" y="8" width="24" height="4" rx="1.5" fill="#2C2018" stroke="#2C2018" strokeWidth="1.5" />
              {/* Plunger Inner Tube */}
              <rect x="24" y="12" width="16" height="18" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.6" />
              {/* Rubber Seal Ring */}
              <rect x="23" y="27" width="18" height="4" rx="1" fill="#C26D52" />
              {/* Main Outer Chamber Cylinder */}
              <rect x="22" y="24" width="20" height="26" rx="2" fill="#2C2018" fillOpacity="0.08" stroke="#2C2018" strokeWidth="1.8" />
              {/* Volume Numbers (1, 2, 3, 4) */}
              <circle cx="32" cy="32" r="1.5" fill="#C26D52" />
              <circle cx="32" cy="38" r="1.5" fill="#C26D52" />
              <circle cx="32" cy="44" r="1.5" fill="#C26D52" />
              {/* Bottom Filter Cap */}
              <rect x="18" y="50" width="28" height="6" rx="2" fill="#2C2018" stroke="#2C2018" strokeWidth="1.8" />
            </svg>
          ) : altLower.includes('chemex') ? (
            /* Chemex Hourglass Carafe with Wood Collar */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M18 10 L46 10 L35 30 L48 54 L16 54 L29 30 Z"
                fill="#FAF7F2"
                stroke="#2C2018"
                strokeWidth="1.8"
              />
              {/* Wooden Collar & Leather Tie */}
              <rect x="27" y="28" width="10" height="6" rx="1" fill="#C26D52" stroke="#2C2018" strokeWidth="1.2" />
              <circle cx="32" cy="31" r="1" fill="#FAF7F2" />
              <ellipse cx="32" cy="54" rx="16" ry="2" fill="#2C2018" fillOpacity="0.1" />
            </svg>
          ) : (subLower.includes('flat-bottom') || subLower.includes('wave') || altLower.includes('kalita') || altLower.includes('stagg') || altLower.includes('orea') || altLower.includes('april')) ? (
            /* Flat-Bottom Low-Bypass Wave Dripper */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Flat-Bottom Cylinder Cup */}
              <path d="M18 14 L46 14 L42 36 L22 36 Z" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              <line x1="15" y1="14" x2="49" y2="14" strokeWidth="2.2" stroke="#2C2018" strokeLinecap="round" />
              {/* Corrugated Vertical Wave Filter Flutes */}
              <line x1="25" y1="16" x2="27" y2="34" stroke="#C26D52" strokeWidth="1.6" />
              <line x1="32" y1="16" x2="32" y2="34" stroke="#D0BDAA" strokeWidth="1.6" />
              <line x1="39" y1="16" x2="37" y2="34" stroke="#C26D52" strokeWidth="1.6" />
              {/* Flat Base Drainage Holes Flange */}
              <rect x="18" y="36" width="28" height="4" rx="1" fill="#C26D52" stroke="#2C2018" strokeWidth="1.5" />
              {/* Server Base with Coffee Level */}
              <rect x="20" y="42" width="24" height="15" rx="2" fill="#2C2018" fillOpacity="0.08" stroke="#2C2018" strokeWidth="1.6" />
              <line x1="16" y1="57" x2="48" y2="57" strokeWidth="2.2" stroke="#2C2018" strokeLinecap="round" />
            </svg>
          ) : (subLower.includes('steep-and-release') || altLower.includes('switch') || altLower.includes('clever')) ? (
            /* Hybrid Steep-and-Release Brewer */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Glass Cone */}
              <path d="M14 14 L50 14 L36 38 L28 38 Z" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              <line x1="12" y1="14" x2="52" y2="14" strokeWidth="2.2" stroke="#2C2018" strokeLinecap="round" />
              {/* Internal V60 Spiral Ribs */}
              <path d="M22 18 C26 24, 28 30, 31 36" stroke="#C26D52" strokeWidth="1.5" fill="none" />
              <path d="M42 18 C38 24, 36 30, 33 36" stroke="#C26D52" strokeWidth="1.5" fill="none" />
              {/* Silicone Base with Ball-Valve Switch Lever */}
              <rect x="24" y="38" width="16" height="8" rx="2" fill="#2C2018" stroke="#2C2018" strokeWidth="1.5" />
              {/* Switch Lever Paddle */}
              <rect x="38" y="40" width="8" height="4" rx="1" fill="#C26D52" stroke="#2C2018" strokeWidth="1.2" />
              <circle cx="43" cy="42" r="1" fill="#FAF7F2" />
              {/* Decanter Plate */}
              <line x1="18" y1="56" x2="46" y2="56" strokeWidth="2.2" stroke="#2C2018" strokeLinecap="round" />
            </svg>
          ) : (
            /* Standard V60 / Origami Dripper */
            <svg
              className="w-full h-full max-w-[85px] max-h-[85px] text-[#2C2018]/75"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Dripper Cone */}
              <path d="M14 14 L50 14 L36 40 L28 40 Z" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
              <line x1="12" y1="14" x2="52" y2="14" strokeWidth="2.2" stroke="#2C2018" />
              {/* Internal Flow Ribs */}
              <path d="M22 20 L30 36" stroke="#C26D52" strokeWidth="1.5" />
              <path d="M32 16 L34 38" stroke="#D0BDAA" strokeWidth="1.5" />
              <path d="M42 20 L38 36" stroke="#C26D52" strokeWidth="1.5" />
              {/* Glass Server / Carafe Base */}
              <rect x="22" y="44" width="20" height="14" rx="2" fill="#2C2018" fillOpacity="0.05" stroke="#2C2018" strokeWidth="1.6" />
              <line x1="18" y1="58" x2="46" y2="58" strokeWidth="2.2" stroke="#2C2018" />
            </svg>
          )
        )}

        {/* =========================================================================
            4. KETTLE SILHOUETTES
           ========================================================================= */}
        {category === 'kettle' && (
          <svg
            className="w-full h-full max-w-[90px] max-h-[90px] text-[#2C2018]/75"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Kettle Body */}
            <path d="M22 22 L42 22 L46 48 L18 48 Z" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.8" />
            {/* Lid & Knob */}
            <ellipse cx="32" cy="22" rx="10" ry="2" fill="#D0BDAA" fillOpacity="0.3" stroke="#2C2018" strokeWidth="1.5" />
            <circle cx="32" cy="18" r="2" fill="#C26D52" stroke="#2C2018" strokeWidth="1.5" />
            {/* Gooseneck Spout */}
            <path
              d="M19 44 C8 42, 6 24, 15 16 C17 14, 18 16, 17 18 C9 26, 12 40, 20 42"
              fill="none"
              stroke="#2C2018"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Handle */}
            <path d="M43 24 C54 26, 52 44, 45 46" stroke="#2C2018" strokeWidth="2.5" strokeLinecap="round" />
            {/* Base Plate with Digital LED Control */}
            <line x1="16" y1="52" x2="48" y2="52" strokeWidth="2.5" stroke="#7A6E65" />
            <rect x="24" y="53" width="10" height="3" rx="0.5" fill="#2C2018" />
            <circle cx="39" cy="54.5" r="1.5" fill="#C26D52" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} transition-opacity duration-200`}
      loading="lazy"
    />
  );
};
