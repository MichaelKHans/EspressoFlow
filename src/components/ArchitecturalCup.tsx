import React from 'react';
import type { DrinkRecipe } from '../types/espresso';

interface ArchitecturalCupProps {
  drink: DrinkRecipe;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export const ArchitecturalCup: React.FC<ArchitecturalCupProps> = ({
  drink,
  size = 'md',
  showLabels = false,
  className = '',
  variant = 'auto',
}) => {
  const glassStyle = drink.glassStyle || (drink.category === 'milk' ? 'cup' : 'glass');

  // Mobile-first dimension scaling
  const pixelSizes = {
    xs: { width: 28, height: 24 },
    sm: { width: 48, height: 38 },
    md: { width: 104, height: 75 },
    lg: { width: 140, height: 110 },
  };

  const { width, height } = pixelSizes[size];

  // Unique ID for SVG clip paths & gradients to prevent collisions
  const clipId = `cup-clip-${drink.id}-${size}`;

  // Style-specific interior liquid limits (y=0 is top, y=100 is bottom)
  const styleBounds: Record<string, { yTop: number; yBottom: number }> = {
    cup: { yTop: 16, yBottom: 82 },
    demitasse: { yTop: 26, yBottom: 82 },
    glass: { yTop: 16, yBottom: 78 }, // leaves bottom 6 units for thick crystal sham
    'tall-glass': { yTop: 14, yBottom: 80 }, // leaves bottom 6 units for thick crystal sham
    server: { yTop: 38, yBottom: 84 }, // server liquid sits inside bottom carafe
    kalita: { yTop: 38, yBottom: 84 },
    chemex: { yTop: 48, yBottom: 84 }, // Chemex liquid sits in lower flask
    aeropress: { yTop: 26, yBottom: 82 },
    'french-press': { yTop: 28, yBottom: 82 },
    press: { yTop: 28, yBottom: 82 },
  };

  const { yTop, yBottom } = styleBounds[glassStyle] || styleBounds.cup;
  const totalLiquidHeight = yBottom - yTop;

  // Compute accumulated layer positions from TOP DOWN
  let currentTopY = yTop;
  const renderedLayers = drink.layers.map((layer) => {
    const layerHeight = (layer.percentage / 100) * totalLiquidHeight;
    const y = currentTopY;
    currentTopY += layerHeight;
    return {
      ...layer,
      y,
      height: layerHeight,
    };
  });

  // Layer fill gradient selector
  const getLayerFill = (layerName: string, fallbackColor: string) => {
    const lower = layerName.toLowerCase();
    if (lower.includes('crema') || lower.includes('foam head') || lower.includes('amber')) {
      return `url(#${clipId}-grad-crema)`;
    }
    if (lower.includes('water') || lower.includes('aerated') || lower.includes('tonic')) {
      return `url(#${clipId}-grad-water)`;
    }
    if (lower.includes('foam') || lower.includes('milk') || lower.includes('cream') || lower.includes('condensed')) {
      return `url(#${clipId}-grad-milk)`;
    }
    if (drink.category === 'filter') {
      return `url(#${clipId}-grad-filter)`;
    }
    if (
      lower.includes('espresso') ||
      lower.includes('ristretto') ||
      lower.includes('nectar') ||
      lower.includes('core') ||
      lower.includes('body') ||
      lower.includes('clarity')
    ) {
      return `url(#${clipId}-grad-espresso)`;
    }
    return fallbackColor;
  };

  const isDarkBg = variant === 'dark' || variant === 'auto';
  const ceramicRimColor = isDarkBg ? '#FAF7F2' : '#FFFFFF';
  const porcelainOutline = isDarkBg ? '#E6D7C8' : '#D4C3B3';

  // Identify specific signature drink styles
  const isColdDrink = drink.id === 'iced-latte' || drink.id === 'espresso-tonic' || drink.id === 'shakerato';
  const isAffogato = drink.id === 'affogato';
  const isConPanna = drink.id === 'con-panna';

  return (
    <div className={`flex flex-col items-center select-none font-mono ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 140 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Linear Gradients for Rich Materiality */}
          {/* 1. Espresso Gradient: Rich roasted mokka (#1C100B) to warm mahogany (#4A2511) */}
          <linearGradient id={`${clipId}-grad-espresso`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1C100B" />
            <stop offset="100%" stopColor="#4A2511" />
          </linearGradient>

          {/* 2. Filterkaffe Gradient: Radiant, translucent red-golden amber (#6E2B12 to #D47738) */}
          <linearGradient id={`${clipId}-grad-filter`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#6E2B12" />
            <stop offset="60%" stopColor="#A84820" />
            <stop offset="100%" stopColor="#D47738" />
          </linearGradient>

          {/* 3. Americano Steamed Water Gradient: Warm crystal amber (#B88B68 to #DFD3C3) */}
          <linearGradient id={`${clipId}-grad-water`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#B88B68" />
            <stop offset="50%" stopColor="#CBB199" />
            <stop offset="100%" stopColor="#DFD3C3" />
          </linearGradient>

          {/* 4. Crema Gradient: Warm golden-terracotta (#B85D38 to #E09A6C) */}
          <linearGradient id={`${clipId}-grad-crema`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#B85D38" />
            <stop offset="100%" stopColor="#E09A6C" />
          </linearGradient>

          {/* 5. Steamed Milk & Micro-foam Gradient: Soft cream (#EFE3D5) to pure white (#FFFFFF) */}
          <linearGradient id={`${clipId}-grad-milk`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#EFE3D5" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* 6. Wood Collar Gradient (Chemex) */}
          <linearGradient id={`${clipId}-grad-wood`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C69263" />
            <stop offset="50%" stopColor="#A87144" />
            <stop offset="100%" stopColor="#7A4D27" />
          </linearGradient>

          {/* 7. Steel Metal Gradient (French Press - Gleaming Polished Chrome) */}
          <linearGradient id={`${clipId}-grad-steel`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="35%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Clip path for Standard Ceramic Cup */}
          <clipPath id={`${clipId}-cup`}>
            <path
              d="M 23 16 L 97 16 C 97 48 93 82 60 82 C 27 82 23 48 23 16 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Demitasse */}
          <clipPath id={`${clipId}-demitasse`}>
            <path
              d="M 29 26 L 91 26 C 91 53 87 82 60 82 C 33 82 29 53 29 26 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Glass Tumbler */}
          <clipPath id={`${clipId}-glass`}>
            <path
              d="M 26 16 L 94 16 L 86 78 L 34 78 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Tall Glass */}
          <clipPath id={`${clipId}-tall`}>
            <path
              d="M 30 14 L 90 14 L 84 80 L 36 80 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for V60 Server */}
          <clipPath id={`${clipId}-server`}>
            <path
              d="M 40 38 L 80 38 L 94 84 L 26 84 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Chemex Lower Flask */}
          <clipPath id={`${clipId}-chemex`}>
            <path
              d="M 52 48 L 68 48 L 94 84 L 26 84 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for AeroPress Brew Chamber */}
          <clipPath id={`${clipId}-aeropress`}>
            <path
              d="M 40 26 L 80 26 L 80 82 L 40 82 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for French Press Immersion Beaker */}
          <clipPath id={`${clipId}-french-press`}>
            <path
              d="M 34 28 L 86 28 L 86 82 L 34 82 Z"
              fill="#000"
            />
          </clipPath>
        </defs>

        {/* --- CASE 1: CERAMIC CUP (Cappuccino, Flat White, Mocha, Lungo, Allongé) --- */}
        {glassStyle === 'cup' && (
          <g>
            {/* Curved Ceramic Handle with High-Contrast Outer Porcelain Shell */}
            <path
              d="M 94 28 C 122 28, 122 66, 91 66"
              fill="none"
              stroke={porcelainOutline}
              strokeWidth="7.5"
              strokeLinecap="round"
            />
            <path
              d="M 94 28 C 122 28, 122 66, 91 66"
              fill="none"
              stroke="#2C2018"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M 95 35 C 112 35, 112 59, 93 59"
              fill="none"
              stroke={ceramicRimColor}
              strokeWidth="2.5"
            />

            {/* Standring / Foot under cup */}
            <path
              d="M 44 82 L 76 82 L 74 87 L 46 87 Z"
              fill={porcelainOutline}
              stroke="#2C2018"
              strokeWidth="1.5"
            />

            {/* Outer Ceramic Shell (~2.5px wall thickness) */}
            <path
              d="M 20 16 L 100 16 C 100 50 96 84 60 84 C 24 84 20 50 20 16 Z"
              fill={ceramicRimColor}
              stroke={porcelainOutline}
              strokeWidth="2"
            />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-cup)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="18"
                  y={layer.y}
                  width="84"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}

              {renderedLayers.slice(0, -1).map((layer, idx) => (
                <ellipse
                  key={`meniscus-${idx}`}
                  cx="60"
                  cy={layer.y + layer.height}
                  rx="34"
                  ry="1.5"
                  fill="rgba(255,255,255,0.18)"
                />
              ))}
            </g>

            {/* Cappuccino 3D Micro-Foam Dome */}
            {drink.id === 'cappuccino' && (
              <path
                d="M 22 16 Q 60 8 98 16 Z"
                fill={`url(#${clipId}-grad-milk)`}
                stroke="#2C2018"
                strokeWidth="1.2"
              />
            )}

            {/* Cup Outer Rim Contour */}
            <path
              d="M 22 16 L 98 16 C 98 48 94 82 60 82 C 26 82 22 48 22 16 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <ellipse
              cx="60"
              cy="16"
              rx="38"
              ry="2.5"
              stroke="#2C2018"
              strokeWidth="1.5"
              fill={ceramicRimColor}
            />
          </g>
        )}

        {/* --- CASE 2: DEMITASSE (Espresso Solo, Doppio, Ristretto, Macchiato, Con Panna) --- */}
        {glassStyle === 'demitasse' && (
          <g>
            {/* Demitasse Handle */}
            <path
              d="M 88 36 C 112 36, 112 66, 85 66"
              fill="none"
              stroke={porcelainOutline}
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            <path
              d="M 88 36 C 112 36, 112 66, 85 66"
              fill="none"
              stroke="#2C2018"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 89 42 C 104 42, 104 60, 87 60"
              fill="none"
              stroke={ceramicRimColor}
              strokeWidth="2"
            />

            {/* Standring / Foot under Demitasse */}
            <path
              d="M 46 82 L 74 82 L 72 86 L 48 86 Z"
              fill={porcelainOutline}
              stroke="#2C2018"
              strokeWidth="1.5"
            />

            {/* Outer Ceramic Shell */}
            <path
              d="M 26 26 L 94 26 C 94 56 90 84 60 84 C 30 84 26 56 26 26 Z"
              fill={ceramicRimColor}
              stroke={porcelainOutline}
              strokeWidth="2"
            />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-demitasse)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="24"
                  y={layer.y}
                  width="72"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}

              {renderedLayers.slice(0, -1).map((layer, idx) => (
                <ellipse
                  key={`meniscus-demi-${idx}`}
                  cx="60"
                  cy={layer.y + layer.height}
                  rx="28"
                  ry="1.5"
                  fill="rgba(255,255,255,0.18)"
                />
              ))}
            </g>

            {/* Con Panna Signature Whipped Cream Peak (rising wave over rim) */}
            {isConPanna && (
              <g>
                <path
                  d="M 38 27 Q 48 16 60 14 Q 72 12 76 20 Q 82 27 82 27 Z"
                  fill="#FFFDF5"
                  stroke="#2C2018"
                  strokeWidth="1.5"
                />
                <path
                  d="M 50 20 Q 64 16 70 23"
                  stroke="#E8DFD5"
                  strokeWidth="1.5"
                  fill="none"
                />
              </g>
            )}

            {/* Outer Contour & Rim */}
            <path
              d="M 28 26 L 92 26 C 92 54 88 82 60 82 C 32 82 28 54 28 26 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
            />
            <ellipse
              cx="60"
              cy="26"
              rx="32"
              ry="2.5"
              stroke="#2C2018"
              strokeWidth="1.5"
              fill={ceramicRimColor}
            />
          </g>
        )}

        {/* --- CASE 3: WARM BARISTA GLASS TUMBLER (Americano, Cortado / Piccolo, Bombon, Affogato, Shakerato) --- */}
        {glassStyle === 'glass' && (
          <g>
            {/* Crystal Glass Wall Background */}
            <path
              d="M 25 15 L 95 15 L 87 84 L 33 84 Z"
              fill="rgba(255, 253, 249, 0.95)"
              stroke={porcelainOutline}
              strokeWidth="1.5"
            />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-glass)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="20"
                  y={layer.y}
                  width="80"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}

              {renderedLayers.slice(0, -1).map((layer, idx) => (
                <ellipse
                  key={`meniscus-glass-${idx}`}
                  cx="60"
                  cy={layer.y + layer.height}
                  rx="28"
                  ry="1.2"
                  fill="rgba(255,255,255,0.22)"
                />
              ))}

              {/* Affogato Signature: Artisanal Vanilla Gelato Scoop submerged in espresso */}
              {isAffogato && (
                <g>
                  {/* Gelato shadow */}
                  <ellipse cx="60" cy="58" rx="19" ry="8" fill="rgba(28,16,11,0.3)" />
                  {/* Gelato scoop dome */}
                  <circle cx="60" cy="50" r="17" fill="#FFFDF5" stroke="#E6D7C8" strokeWidth="1.5" />
                  {/* Vanilla bean flecks & melt swirl */}
                  <path d="M 50 48 Q 58 54 68 47" stroke="#CBB8A3" strokeWidth="1.5" fill="none" opacity="0.6" />
                  <circle cx="56" cy="44" r="0.8" fill="#4A2511" />
                  <circle cx="64" cy="46" r="0.8" fill="#4A2511" />
                  <circle cx="61" cy="52" r="0.8" fill="#4A2511" />
                </g>
              )}

              {/* Shakerato: 2 Floating Ice Cubes in Glass */}
              {drink.id === 'shakerato' && (
                <g>
                  <rect x="42" y="34" width="14" height="13" rx="2.5" transform="rotate(-8 49 40)" fill="rgba(235, 248, 255, 0.6)" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1" />
                  <line x1="44" y1="36" x2="52" y2="37" stroke="#FFF" strokeWidth="1" strokeLinecap="round" />
                  <rect x="62" y="38" width="14" height="13" rx="2.5" transform="rotate(12 69 44)" fill="rgba(235, 248, 255, 0.6)" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1" />
                  <line x1="64" y1="40" x2="72" y2="41" stroke="#FFF" strokeWidth="1" strokeLinecap="round" />
                </g>
              )}
            </g>

            {/* Thick Crystal Glass Sham Base */}
            <path
              d="M 34 78 L 86 78 L 84 84 L 36 84 Z"
              fill="rgba(255, 255, 255, 0.35)"
              stroke="#2C2018"
              strokeWidth="1.5"
            />
            <ellipse cx="60" cy="78" rx="26" ry="1.5" fill="rgba(255,255,255,0.4)" />

            {/* Gibraltar / Duralex Facets (Cortado & Piccolo) */}
            {(drink.id === 'cortado' || drink.id === 'piccolo') && (
              <g opacity="0.45">
                <line x1="42" y1="28" x2="40" y2="76" stroke="#2C2018" strokeWidth="1" strokeDasharray="6 2" />
                <line x1="60" y1="28" x2="60" y2="76" stroke="#2C2018" strokeWidth="1" strokeDasharray="6 2" />
                <line x1="78" y1="28" x2="80" y2="76" stroke="#2C2018" strokeWidth="1" strokeDasharray="6 2" />
              </g>
            )}

            {/* Vertical Specular Highlight Line on Left */}
            <line
              x1="32"
              y1="20"
              x2="37"
              y2="76"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Outer Glass Wall (NO handle!) */}
            <path
              d="M 26 16 L 94 16 L 86 84 L 34 84 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <line x1="26" y1="16" x2="94" y2="16" stroke="#2C2018" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* --- CASE 4: TALL HIGHBALL GLASS (Caffe Latte, Iced Latte, Espresso Tonic) --- */}
        {glassStyle === 'tall-glass' && (
          <g>
            {/* Tall Glass Body Background */}
            <path
              d="M 29 13 L 91 13 L 85 86 L 35 86 Z"
              fill="rgba(255, 253, 249, 0.95)"
              stroke={porcelainOutline}
              strokeWidth="1.5"
            />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-tall)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="24"
                  y={layer.y}
                  width="72"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}

              {renderedLayers.slice(0, -1).map((layer, idx) => (
                <ellipse
                  key={`meniscus-tall-${idx}`}
                  cx="60"
                  cy={layer.y + layer.height}
                  rx="26"
                  ry="1.2"
                  fill="rgba(255,255,255,0.22)"
                />
              ))}

              {/* Cold Drinks Special: 3 Floating Angled Ice Cubes */}
              {isColdDrink && (
                <g>
                  {/* Ice Cube 1 (Upper left) */}
                  <rect
                    x="40"
                    y="24"
                    width="15"
                    height="14"
                    rx="3"
                    transform="rotate(-10 47 31)"
                    fill="rgba(235, 248, 255, 0.6)"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="1.2"
                  />
                  <line x1="42" y1="26" x2="52" y2="28" stroke="#FFF" strokeWidth="1" strokeLinecap="round" />

                  {/* Ice Cube 2 (Upper right) */}
                  <rect
                    x="64"
                    y="28"
                    width="15"
                    height="14"
                    rx="3"
                    transform="rotate(14 71 35)"
                    fill="rgba(235, 248, 255, 0.6)"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="1.2"
                  />
                  <line x1="66" y1="30" x2="76" y2="32" stroke="#FFF" strokeWidth="1" strokeLinecap="round" />

                  {/* Ice Cube 3 (Mid center) */}
                  <rect
                    x="50"
                    y="45"
                    width="16"
                    height="15"
                    rx="3"
                    transform="rotate(-4 58 52)"
                    fill="rgba(235, 248, 255, 0.55)"
                    stroke="rgba(255, 255, 255, 0.85)"
                    strokeWidth="1.2"
                  />
                  <line x1="52" y1="47" x2="62" y2="49" stroke="#FFF" strokeWidth="1" strokeLinecap="round" />

                  {/* Espresso Tonic Special: Ascending Carbonation Micro-Bubbles */}
                  {drink.id === 'espresso-tonic' && (
                    <g fill="rgba(255, 255, 255, 0.65)">
                      <circle cx="44" cy="74" r="0.9" />
                      <circle cx="52" cy="70" r="0.8" />
                      <circle cx="68" cy="72" r="1.0" />
                      <circle cx="75" cy="67" r="0.7" />
                      <circle cx="48" cy="62" r="0.9" />
                      <circle cx="64" cy="58" r="0.8" />
                      <circle cx="72" cy="52" r="0.9" />
                      <circle cx="42" cy="48" r="0.7" />
                    </g>
                  )}
                </g>
              )}
            </g>

            {/* Massive Solid Glass Sham Base */}
            <path
              d="M 36 80 L 84 80 L 82 86 L 38 86 Z"
              fill="rgba(255, 255, 255, 0.35)"
              stroke="#2C2018"
              strokeWidth="1.5"
            />
            <ellipse cx="60" cy="80" rx="24" ry="1.5" fill="rgba(255,255,255,0.4)" />

            {/* Vertical Specular Line */}
            <line
              x1="35"
              y1="18"
              x2="39"
              y2="78"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Outer Stroke (NO handle on tall glasses!) */}
            <path
              d="M 30 14 L 90 14 L 84 86 L 36 86 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <line x1="30" y1="14" x2="90" y2="14" stroke="#2C2018" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* --- CASE 5: V60 RANGE SERVER (Standard & 4:6 Kasuya) --- */}
        {(glassStyle === 'server' || drink.id === 'v60' || drink.id === 'v60-kasuya') && (
          <g>
            {/* Glass Handle */}
            <path
              d="M 86 44 C 114 44, 114 76, 91 76"
              fill="none"
              stroke={porcelainOutline}
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 86 44 C 114 44, 114 76, 91 76"
              fill="none"
              stroke="#2C2018"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            {/* Server Carafe Body Background */}
            <path d="M 40 38 L 80 38 L 94 84 L 26 84 Z" fill="#FFFDF9" stroke={porcelainOutline} strokeWidth="1.5" />

            {/* Liquid Layers (Clipped inside bottom carafe) */}
            <g clipPath={`url(#${clipId}-server)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="20"
                  y={layer.y}
                  width="85"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}
            </g>

            {/* Spout on Top Left */}
            <path d="M 40 38 L 33 34 L 36 41 Z" fill="#2C2018" />

            {/* Server Carafe Outer Contour */}
            <path
              d="M 40 38 L 80 38 L 94 84 L 26 84 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Base */}
            <path d="M 28 84 L 92 84 L 90 89 L 30 89 Z" fill="#2C2018" opacity="0.85" />

            {/* Iconic Conical V60 Dripper mounted on top */}
            <g>
              {/* Dripper Base Ring */}
              <ellipse cx="60" cy="38" rx="24" ry="2.5" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1.5" />
              {/* 60-degree Conical Dripper Cone */}
              <path d="M 34 16 L 86 16 L 68 37 L 52 37 Z" fill="#FAF7F2" stroke="#2C2018" strokeWidth="2.5" strokeLinejoin="round" />
              {/* Spiral Ribs inside V60 */}
              <path d="M 42 18 Q 50 26 56 36" stroke="#C26D52" strokeWidth="1.2" fill="none" opacity="0.75" />
              <path d="M 54 18 Q 60 25 64 36" stroke="#C26D52" strokeWidth="1.2" fill="none" opacity="0.75" />
              <path d="M 68 18 Q 70 26 72 36" stroke="#C26D52" strokeWidth="1.2" fill="none" opacity="0.75" />
              {/* Top Cone Rim */}
              <line x1="34" y1="16" x2="86" y2="16" stroke="#2C2018" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* --- CASE 6: CHEMEX CLASSIC (Hourglass with Wood Collar & Leather Tie) --- */}
        {glassStyle === 'chemex' && (
          <g>
            {/* Chemex Lower Carafe Background */}
            <path d="M 52 48 L 68 48 L 94 84 L 26 84 Z" fill="#FFFDF9" stroke={porcelainOutline} strokeWidth="1.5" />

            {/* Liquid Layers in Lower Flask */}
            <g clipPath={`url(#${clipId}-chemex)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="20"
                  y={layer.y}
                  width="85"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}
            </g>

            {/* Chemex Base */}
            <path d="M 28 84 L 92 84 L 90 89 L 30 89 Z" fill="#2C2018" opacity="0.85" />

            {/* Hourglass Glass Outer Contour */}
            {/* Upper Funnel */}
            <path
              d="M 32 16 L 88 16 L 68 46 L 52 46 Z"
              fill="rgba(255, 253, 249, 0.4)"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Lower Flask */}
            <path
              d="M 52 50 L 68 50 L 94 84 L 26 84 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Pouring Channel Spout on Top Left */}
            <path d="M 32 16 L 26 12 L 30 19 Z" fill="#2C2018" />

            {/* Iconic Wood Collar at Neck */}
            <rect
              x="50"
              y="44"
              width="20"
              height="10"
              rx="2"
              fill={`url(#${clipId}-grad-wood)`}
              stroke="#4A2511"
              strokeWidth="1.5"
            />
            {/* Leather Tie & Bead */}
            <line x1="50" y1="49" x2="70" y2="49" stroke="#2C2018" strokeWidth="1.5" />
            <circle cx="68" cy="54" r="2.5" fill="#FAF7F2" stroke="#2C2018" strokeWidth="1" />
            <line x1="68" y1="56" x2="69" y2="62" stroke="#4A2511" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {/* --- CASE 7: KALITA WAVE 185 (Flat-bottom Wave Dripper on Glass Server) --- */}
        {glassStyle === 'kalita' && (
          <g>
            {/* Glass Handle */}
            <path
              d="M 86 44 C 114 44, 114 76, 91 76"
              fill="none"
              stroke={porcelainOutline}
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 86 44 C 114 44, 114 76, 91 76"
              fill="none"
              stroke="#2C2018"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            {/* Server Carafe Body */}
            <path d="M 40 38 L 80 38 L 94 84 L 26 84 Z" fill="#FFFDF9" stroke={porcelainOutline} strokeWidth="1.5" />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-server)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="20"
                  y={layer.y}
                  width="85"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}
            </g>

            {/* Server Outer Contour & Base */}
            <path
              d="M 40 38 L 80 38 L 94 84 L 26 84 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M 28 84 L 92 84 L 90 89 L 30 89 Z" fill="#2C2018" opacity="0.85" />

            {/* Kalita Flat-Bottom Dripper with Wavy Filter Flutes */}
            <g>
              {/* Dripper Base Ring */}
              <rect x="42" y="36" width="36" height="3" fill="#D8D2C9" stroke="#2C2018" strokeWidth="1.2" rx="1" />
              {/* Flat-bottom Dripper Cone */}
              <path d="M 36 18 L 84 18 L 76 36 L 44 36 Z" fill="#FAF7F2" stroke="#2C2018" strokeWidth="2.5" strokeLinejoin="round" />
              {/* Iconic Wave Pleat Ridges */}
              <path d="M 42 18 Q 45 27 47 36" stroke="#C26D52" strokeWidth="1.2" fill="none" opacity="0.8" />
              <path d="M 52 18 Q 54 27 55 36" stroke="#C26D52" strokeWidth="1.2" fill="none" opacity="0.8" />
              <path d="M 62 18 Q 63 27 63 36" stroke="#C26D52" strokeWidth="1.2" fill="none" opacity="0.8" />
              <path d="M 72 18 Q 72 27 71 36" stroke="#C26D52" strokeWidth="1.2" fill="none" opacity="0.8" />
              {/* Top Dripper Rim */}
              <line x1="36" y1="18" x2="84" y2="18" stroke="#2C2018" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* --- CASE 8: AEROPRESS (Inverted Immersion Chamber - NO Handle!) --- */}
        {glassStyle === 'aeropress' && (
          <g>
            {/* Top Plunger Flange & Seal */}
            <rect x="46" y="10" width="28" height="6" rx="2" fill="#2C2018" stroke="#2C2018" strokeWidth="1.5" />
            <rect x="50" y="16" width="20" height="10" fill="#4A382C" stroke="#2C2018" strokeWidth="1.5" />
            {/* Rubber Plunger Seal */}
            <ellipse cx="60" cy="26" rx="19" ry="2" fill="#1C100B" />

            {/* AeroPress Transparent Cylinder Body (NO handle!) */}
            <rect x="40" y="26" width="40" height="56" fill="#FFFDF9" stroke={porcelainOutline} strokeWidth="1.5" rx="1" />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-aeropress)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="38"
                  y={layer.y}
                  width="44"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}

              {/* AeroPress Scale Numbers (#1, #2, #3, #4) */}
              <g fill="#C26D52" fontSize="6" fontWeight="bold" opacity="0.85">
                <text x="44" y="38">④</text>
                <text x="44" y="52">③</text>
                <text x="44" y="66">②</text>
                <text x="44" y="78">①</text>
              </g>
            </g>

            {/* Cylinder Outer Stroke */}
            <rect
              x="40"
              y="26"
              width="40"
              height="56"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              rx="1"
            />

            {/* Bottom Filter Cap (Perforated Hexagonal Cap) */}
            <rect x="36" y="82" width="48" height="6" rx="2" fill="#1C100B" stroke="#2C2018" strokeWidth="1.5" />
            <line x1="42" y1="85" x2="78" y2="85" stroke="#FFF" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
          </g>
        )}

        {/* --- CASE 9: FRENCH PRESS (Cafetière with Spout, Steel Cage, Plunger & Mesh Filter) --- */}
        {(glassStyle === 'french-press' || glassStyle === 'press') && (
          <g>
            {/* Plunger Knob & Steel Rod (Gleaming Chrome) */}
            <circle cx="60" cy="8" r="4.5" fill={`url(#${clipId}-grad-steel)`} stroke="#FFFFFF" strokeWidth="1" />
            <line x1="60" y1="12" x2="60" y2="28" stroke={`url(#${clipId}-grad-steel)`} strokeWidth="3" />

            {/* Domed Steel Lid */}
            <path d="M 32 26 Q 60 20 88 26 Z" fill={`url(#${clipId}-grad-steel)`} stroke="#FFFFFF" strokeWidth="1" />

            {/* Glass Beaker Body */}
            <rect x="34" y="28" width="52" height="54" fill="#FFFDF9" stroke={porcelainOutline} strokeWidth="1.5" rx="1" />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-french-press)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="30"
                  y={layer.y}
                  width="60"
                  height={layer.height + 0.5}
                  fill={getLayerFill(layer.name, layer.color)}
                />
              ))}

              {/* Transverse Metal Mesh Filter Coil */}
              <line x1="34" y1="36" x2="86" y2="36" stroke="#2C2018" strokeWidth="2.5" />
              <line x1="34" y1="38" x2="86" y2="38" stroke={`url(#${clipId}-grad-steel)`} strokeWidth="2" strokeDasharray="3 1.5" />

              {/* Vertical Glass Specular Highlight Line on Left */}
              <line
                x1="38"
                y1="30"
                x2="38"
                y2="80"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>

            {/* Curved Steel Handle with High-Contrast Outer Shell */}
            <path
              d="M 86 36 C 114 36, 114 74, 86 74"
              fill="none"
              stroke={porcelainOutline}
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 86 36 C 114 36, 114 74, 86 74"
              fill="none"
              stroke="#2C2018"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M 86 36 C 114 36, 114 74, 86 74"
              fill="none"
              stroke={`url(#${clipId}-grad-steel)`}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Steel Cage Bands (Top, Vertical & Bottom) */}
            <line x1="34" y1="30" x2="86" y2="30" stroke={`url(#${clipId}-grad-steel)`} strokeWidth="2.5" />
            <line x1="36" y1="30" x2="36" y2="82" stroke={`url(#${clipId}-grad-steel)`} strokeWidth="2.5" />
            <line x1="84" y1="30" x2="84" y2="82" stroke={`url(#${clipId}-grad-steel)`} strokeWidth="2.5" />

            {/* Outer Beaker Stroke & Spout */}
            <rect
              x="34"
              y="28"
              width="52"
              height="54"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              rx="1"
            />
            {/* Small Pour Spout */}
            <path d="M 34 28 L 29 25 L 32 31 Z" fill={`url(#${clipId}-grad-steel)`} stroke="#2C2018" strokeWidth="1" />

            {/* Steel Stand Base with Chrome Feet */}
            <path d="M 30 82 L 90 82 L 88 88 L 32 88 Z" fill={`url(#${clipId}-grad-steel)`} stroke="#2C2018" strokeWidth="1" />
            <circle cx="36" cy="88" r="2.5" fill={`url(#${clipId}-grad-steel)`} stroke="#2C2018" strokeWidth="1" />
            <circle cx="84" cy="88" r="2.5" fill={`url(#${clipId}-grad-steel)`} stroke="#2C2018" strokeWidth="1" />
          </g>
        )}

        {/* Optional Schematic Leader Labels on large view */}
        {showLabels && size === 'lg' && (
          <g className="font-mono text-[9px] font-bold">
            {renderedLayers.map((layer, idx) => {
              const labelY = layer.y + layer.height / 2 + 3;
              return (
                <g key={`lbl-${idx}`}>
                  <line
                    x1="98"
                    y1={labelY - 3}
                    x2="114"
                    y2={labelY - 3}
                    stroke="#2C2018"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.5"
                  />
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {size === 'lg' && drink.cupVolumeMl && (
        <span className="text-[10px] font-mono text-[#7A6E65] mt-1 font-bold">
          {drink.cupVolumeMl}ml Total Volume
        </span>
      )}
    </div>
  );
};
