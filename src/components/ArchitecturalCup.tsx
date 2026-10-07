import React from 'react';
import type { DrinkRecipe } from '../types/espresso';

interface ArchitecturalCupProps {
  drink: DrinkRecipe;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const ArchitecturalCup: React.FC<ArchitecturalCupProps> = ({
  drink,
  size = 'md',
  showLabels = false,
  className = '',
}) => {
  const glassStyle = drink.glassStyle || (drink.category === 'milk' ? 'cup' : 'glass');

  // Mobile-first dimension scaling
  const pixelSizes = {
    xs: { width: 28, height: 24 },
    sm: { width: 44, height: 36 },
    md: { width: 68, height: 56 },
    lg: { width: 140, height: 110 },
  };

  const { width, height } = pixelSizes[size];

  // Unique ID for SVG clip path to avoid collisions when multiple cups render
  const clipId = `cup-clip-${drink.id}-${size}`;

  // SVG coordinates space: 140 x 100
  // Style-specific interior liquid limits (y=0 is top, y=100 is bottom)
  const styleBounds: Record<string, { yTop: number; yBottom: number }> = {
    cup: { yTop: 16, yBottom: 84 },
    demitasse: { yTop: 26, yBottom: 84 },
    glass: { yTop: 16, yBottom: 82 },
    'tall-glass': { yTop: 14, yBottom: 84 },
    server: { yTop: 22, yBottom: 84 },
    press: { yTop: 22, yBottom: 84 },
  };

  const { yTop, yBottom } = styleBounds[glassStyle] || styleBounds.cup;
  const totalLiquidHeight = yBottom - yTop;

  // Compute accumulated layer positions from TOP DOWN
  // In coffee physics, layer[0] is top (Crema / Foam) and the last layer is bottom (Espresso / Steamed Water / Milk)
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
          {/* Clip path for Standard Ceramic Cup */}
          <clipPath id={`${clipId}-cup`}>
            <path
              d="M 22 16 L 98 16 C 98 48 94 84 60 84 C 26 84 22 48 22 16 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Glass Tumbler (Cortado / Bombon / Affogato) */}
          <clipPath id={`${clipId}-glass`}>
            <path
              d="M 26 16 L 94 16 L 86 82 L 34 82 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Tall Glass (Latte / Tonic) */}
          <clipPath id={`${clipId}-tall`}>
            <path
              d="M 30 14 L 90 14 L 84 84 L 36 84 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Demitasse (Espresso / Ristretto / Macchiato) */}
          <clipPath id={`${clipId}-demitasse`}>
            <path
              d="M 28 26 L 92 26 C 92 54 88 84 60 84 C 32 84 28 54 28 26 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Glass Range Server (Pour Over V60 / Chemex / Kalita) */}
          <clipPath id={`${clipId}-server`}>
            <path
              d="M 42 22 L 78 22 L 94 84 L 26 84 Z"
              fill="#000"
            />
          </clipPath>

          {/* Clip path for Immersion Press (AeroPress / French Press) */}
          <clipPath id={`${clipId}-press`}>
            <path
              d="M 32 22 L 88 22 L 88 84 L 32 84 Z"
              fill="#000"
            />
          </clipPath>
        </defs>

        {/* --- CASE 1: CUP (Cappuccino, Flat White, Americano, Lungo) --- */}
        {glassStyle === 'cup' && (
          <g>
            {/* Proportional Curved Ear Handle */}
            <path
              d="M 94 28 C 122 28, 122 66, 91 66"
              fill="none"
              stroke="#2C2018"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Inner Handle Hole for realism */}
            <path
              d="M 95 35 C 112 35, 112 59, 93 59"
              fill="none"
              stroke="#FAF7F2"
              strokeWidth="2"
            />

            {/* Cup Body Background */}
            <path
              d="M 22 16 L 98 16 C 98 48 94 84 60 84 C 26 84 22 48 22 16 Z"
              fill="#FAF7F2"
            />

            {/* Liquid Layers (Clipped to cup interior) */}
            <g clipPath={`url(#${clipId}-cup)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="20"
                  y={layer.y}
                  width="80"
                  height={layer.height + 0.5} // +0.5 to prevent sub-pixel seams
                  fill={layer.color}
                />
              ))}
            </g>

            {/* Cup Outer Contour & Rim */}
            <path
              d="M 22 16 L 98 16 C 98 48 94 84 60 84 C 26 84 22 48 22 16 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Ceramic Rim Highlight */}
            <ellipse cx="60" cy="16" rx="38" ry="2" stroke="#2C2018" strokeWidth="1.5" fill="#FAF7F2" />

            {/* Saucer / Cup Foot */}
            <path
              d="M 46 84 L 74 84 L 76 88 L 44 88 Z"
              fill="#2C2018"
            />
          </g>
        )}

        {/* --- CASE 2: DEMITASSE (Espresso, Ristretto, Macchiato) --- */}
        {glassStyle === 'demitasse' && (
          <g>
            {/* Small Ceramic Demitasse Handle */}
            <path
              d="M 88 36 C 112 36, 112 66, 85 66"
              fill="none"
              stroke="#2C2018"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            {/* Demitasse Body Background */}
            <path
              d="M 28 26 L 92 26 C 92 54 88 84 60 84 C 32 84 28 54 28 26 Z"
              fill="#FAF7F2"
            />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-demitasse)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="25"
                  y={layer.y}
                  width="70"
                  height={layer.height + 0.5}
                  fill={layer.color}
                />
              ))}
            </g>

            {/* Outer Contour */}
            <path
              d="M 28 26 L 92 26 C 92 54 88 84 60 84 C 32 84 28 54 28 26 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
            />
            <ellipse cx="60" cy="26" rx="32" ry="2" stroke="#2C2018" strokeWidth="1.5" fill="#FAF7F2" />
            <path d="M 48 84 L 72 84 L 74 87 L 46 87 Z" fill="#2C2018" />
          </g>
        )}

        {/* --- CASE 3: GLASS TUMBLER (Cortado / Piccolo, Bombon, Affogato) --- */}
        {glassStyle === 'glass' && (
          <g>
            {/* Glass Background */}
            <path d="M 26 16 L 94 16 L 86 82 L 34 82 Z" fill="#FFFDF9" />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-glass)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="20"
                  y={layer.y}
                  width="80"
                  height={layer.height + 0.5}
                  fill={layer.color}
                />
              ))}
            </g>

            {/* Glass Facet & Outer Stroke */}
            <path
              d="M 26 16 L 94 16 L 86 82 L 34 82 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Heavy Glass Base */}
            <path d="M 33 82 L 87 82 L 85 88 L 35 88 Z" fill="#2C2018" opacity="0.85" />
            {/* Glass Rim */}
            <line x1="26" y1="16" x2="94" y2="16" stroke="#2C2018" strokeWidth="2" />
          </g>
        )}

        {/* --- CASE 4: TALL GLASS (Caffe Latte, Espresso Tonic) --- */}
        {glassStyle === 'tall-glass' && (
          <g>
            <path d="M 30 14 L 90 14 L 84 84 L 36 84 Z" fill="#FFFDF9" />

            <g clipPath={`url(#${clipId}-tall)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="25"
                  y={layer.y}
                  width="70"
                  height={layer.height + 0.5}
                  fill={layer.color}
                />
              ))}
            </g>

            {/* Outer Stroke */}
            <path
              d="M 30 14 L 90 14 L 84 84 L 36 84 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Heavy Bottom Glass Rim */}
            <path d="M 35 84 L 85 84 L 83 90 L 37 90 Z" fill="#2C2018" opacity="0.85" />
            <line x1="30" y1="14" x2="90" y2="14" stroke="#2C2018" strokeWidth="2" />
          </g>
        )}

        {/* --- CASE 5: GLASS RANGE SERVER (Pour Over V60, Chemex, Kalita) --- */}
        {glassStyle === 'server' && (
          <g>
            {/* Glass Handle */}
            <path
              d="M 86 36 C 114 36, 114 74, 91 74"
              fill="none"
              stroke="#2C2018"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Server Body Background */}
            <path d="M 42 22 L 78 22 L 94 84 L 26 84 Z" fill="#FFFDF9" />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-server)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="20"
                  y={layer.y}
                  width="85"
                  height={layer.height + 0.5}
                  fill={layer.color}
                />
              ))}
            </g>

            {/* Spout on Top Left */}
            <path d="M 42 22 L 35 18 L 38 25 Z" fill="#2C2018" />

            {/* Server Outer Stroke */}
            <path
              d="M 42 22 L 78 22 L 94 84 L 26 84 Z"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Base */}
            <path d="M 28 84 L 92 84 L 90 89 L 30 89 Z" fill="#2C2018" opacity="0.85" />
            <line x1="42" y1="22" x2="78" y2="22" stroke="#2C2018" strokeWidth="2" />
          </g>
        )}

        {/* --- CASE 6: IMMERSION PRESS (AeroPress / French Press) --- */}
        {glassStyle === 'press' && (
          <g>
            {/* Plunger Knob & Stem */}
            <line x1="60" y1="8" x2="60" y2="22" stroke="#2C2018" strokeWidth="3" />
            <ellipse cx="60" cy="8" rx="14" ry="3" fill="#C26D52" stroke="#2C2018" strokeWidth="1.5" />

            {/* Press Cylinder Background */}
            <path d="M 32 22 L 88 22 L 88 84 L 32 84 Z" fill="#FFFDF9" />

            {/* Liquid Layers */}
            <g clipPath={`url(#${clipId}-press)`}>
              {renderedLayers.map((layer, idx) => (
                <rect
                  key={idx}
                  x="30"
                  y={layer.y}
                  width="60"
                  height={layer.height + 0.5}
                  fill={layer.color}
                />
              ))}
            </g>

            {/* Plunger Filter Mesh Line inside */}
            <line x1="32" y1="25" x2="88" y2="25" stroke="#C26D52" strokeWidth="2" strokeDasharray="3 2" />

            {/* Side Handle */}
            <path
              d="M 88 34 C 112 34, 112 70, 88 70"
              fill="none"
              stroke="#2C2018"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            {/* Press Outer Stroke */}
            <rect
              x="32"
              y="22"
              width="56"
              height="62"
              fill="none"
              stroke="#2C2018"
              strokeWidth="3"
              rx="2"
            />
            {/* Base */}
            <path d="M 30 84 L 90 84 L 88 89 L 32 89 Z" fill="#2C2018" opacity="0.85" />
          </g>
        )}

        {/* Optional Schematic Leader Labels on large view (Image 3 Guide Style) */}
        {showLabels && size === 'lg' && (
          <g className="font-mono text-[9px] font-bold">
            {renderedLayers.map((layer, idx) => {
              const labelY = layer.y + layer.height / 2 + 3;
              return (
                <g key={`lbl-${idx}`}>
                  {/* Leader guide line */}
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
