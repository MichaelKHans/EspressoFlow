import React, { useMemo } from 'react';

export type AmbientViewType = 'drinks' | 'monitor' | 'logbook' | 'equipment' | 'beandex';

export interface AmbientBeanBackgroundProps {
  activeTab: 'drinks' | 'monitor' | 'logbook' | 'equipment';
  activeMode: 'flow' | 'beandex';
  isBrewing?: boolean;
}

type BeanShape = 'arabica' | 'geisha' | 'peaberry' | 'pacamara' | 'speck';

interface BeanItem {
  id: string;
  shape: BeanShape;
  top: string;
  left: string;
  sizePx: number;
  rotationDeg: number;
  blurPx: number;
  opacity: number;
  animClass: string;
  delaySec: number;
}

/**
 * High-definition botanical SVG coffee bean silhouettes
 * Rendered with soft out-of-focus gaussian blur (bokeh) & warm espresso tones
 */
const SilhouettePath: React.FC<{ shape: BeanShape }> = ({ shape }) => {
  switch (shape) {
    case 'geisha':
      // Elongated, slender, tapered shape characteristic of Geisha/Typica lots
      return (
        <svg viewBox="0 0 70 160" className="w-full h-full fill-current">
          {/* Outer bean body */}
          <path d="M 35,4 C 58,18 68,55 67,95 C 66,132 52,156 35,156 C 18,156 4,132 3,95 C 2,55 12,18 35,4 Z" />
          {/* Center curved fissure (negative space cutout) */}
          <path
            d="M 35,14 Q 42,45 31,80 Q 22,115 35,146"
            stroke="#FAF7F2"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case 'peaberry':
      // Compact, spherical round bean from single-seeded coffee cherries
      return (
        <svg viewBox="0 0 110 110" className="w-full h-full fill-current">
          <circle cx="55" cy="55" r="50" />
          <path
            d="M 55,14 Q 63,40 50,58 Q 38,76 55,96"
            stroke="#FAF7F2"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case 'pacamara':
      // Oversized, broad, robust "Elephant Bean" silhouette
      return (
        <svg viewBox="0 0 130 160" className="w-full h-full fill-current">
          <path d="M 65,5 C 110,18 126,58 125,105 C 124,142 102,155 65,155 C 28,155 6,142 5,105 C 4,58 20,18 65,5 Z" />
          <path
            d="M 65,16 Q 80,55 58,95 Q 40,128 65,145"
            stroke="#FAF7F2"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case 'speck':
      // Geometric micro-grind particle silhouette for equipment & grind distribution
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full fill-current">
          <polygon points="20,4 36,15 31,35 9,33 4,18" />
        </svg>
      );

    case 'arabica':
    default:
      // Standard balanced Arabica bean with classic curved S-crease
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full fill-current">
          <path d="M 50,5 C 84,18 96,52 95,90 C 94,124 78,135 50,135 C 22,135 6,124 5,90 C 4,52 16,18 50,5 Z" />
          <path
            d="M 50,16 Q 62,50 44,78 Q 30,105 50,124"
            stroke="#FAF7F2"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
  }
};

/**
 * Returns tailored, sparsely distributed bean silhouettes for each specific view
 * Ensures generous negative space, gentle positioning in the periphery, and distinct terroir
 */
function getBeansForView(view: AmbientViewType): BeanItem[] {
  switch (view) {
    case 'drinks':
      // Coffee Bar: 5 classic Arabica beans drifting upward like warm aroma vapors
      return [
        {
          id: 'cb-1',
          shape: 'arabica',
          top: '12%',
          left: '6%',
          sizePx: 95,
          rotationDeg: -22,
          blurPx: 18,
          opacity: 0.055,
          animClass: 'animate-ambient-bean-a',
          delaySec: 0,
        },
        {
          id: 'cb-2',
          shape: 'arabica',
          top: '28%',
          left: '88%',
          sizePx: 80,
          rotationDeg: 35,
          blurPx: 20,
          opacity: 0.045,
          animClass: 'animate-ambient-bean-b',
          delaySec: 4,
        },
        {
          id: 'cb-3',
          shape: 'geisha',
          top: '68%',
          left: '4%',
          sizePx: 110,
          rotationDeg: 12,
          blurPx: 22,
          opacity: 0.048,
          animClass: 'animate-ambient-bean-c',
          delaySec: 2,
        },
        {
          id: 'cb-4',
          shape: 'arabica',
          top: '78%',
          left: '86%',
          sizePx: 90,
          rotationDeg: -40,
          blurPx: 19,
          opacity: 0.05,
          animClass: 'animate-ambient-bean-d',
          delaySec: 6,
        },
        {
          id: 'cb-5',
          shape: 'peaberry',
          top: '48%',
          left: '92%',
          sizePx: 60,
          rotationDeg: 18,
          blurPx: 16,
          opacity: 0.04,
          animClass: 'animate-ambient-bean-a',
          delaySec: 8,
        },
      ];

    case 'monitor':
      // Scale Cam / Live Monitor: Ultra-sparse (only 3 beans) in outer edges with deep blur (24-28px)
      // Guarantees zero distraction and maximum camera/OCR focus
      return [
        {
          id: 'mon-1',
          shape: 'arabica',
          top: '8%',
          left: '4%',
          sizePx: 75,
          rotationDeg: -15,
          blurPx: 24,
          opacity: 0.035,
          animClass: 'animate-ambient-bean-c',
          delaySec: 0,
        },
        {
          id: 'mon-2',
          shape: 'geisha',
          top: '14%',
          left: '90%',
          sizePx: 85,
          rotationDeg: 28,
          blurPx: 26,
          opacity: 0.03,
          animClass: 'animate-ambient-bean-b',
          delaySec: 3,
        },
        {
          id: 'mon-3',
          shape: 'peaberry',
          top: '84%',
          left: '6%',
          sizePx: 65,
          rotationDeg: 45,
          blurPx: 24,
          opacity: 0.032,
          animClass: 'animate-ambient-bean-d',
          delaySec: 7,
        },
      ];

    case 'beandex':
      // Beandex: Botanical specialty varietal showcase (Geisha, Peaberry, Pacamara, Arabica)
      return [
        {
          id: 'bx-1',
          shape: 'geisha',
          top: '10%',
          left: '5%',
          sizePx: 115,
          rotationDeg: -18,
          blurPx: 20,
          opacity: 0.055,
          animClass: 'animate-ambient-bean-a',
          delaySec: 0,
        },
        {
          id: 'bx-2',
          shape: 'pacamara',
          top: '22%',
          left: '87%',
          sizePx: 125,
          rotationDeg: 42,
          blurPx: 24,
          opacity: 0.048,
          animClass: 'animate-ambient-bean-b',
          delaySec: 2,
        },
        {
          id: 'bx-3',
          shape: 'peaberry',
          top: '52%',
          left: '3%',
          sizePx: 70,
          rotationDeg: -10,
          blurPx: 17,
          opacity: 0.045,
          animClass: 'animate-ambient-bean-c',
          delaySec: 5,
        },
        {
          id: 'bx-4',
          shape: 'arabica',
          top: '64%',
          left: '91%',
          sizePx: 95,
          rotationDeg: -32,
          blurPx: 21,
          opacity: 0.05,
          animClass: 'animate-ambient-bean-d',
          delaySec: 1,
        },
        {
          id: 'bx-5',
          shape: 'geisha',
          top: '82%',
          left: '12%',
          sizePx: 100,
          rotationDeg: 25,
          blurPx: 22,
          opacity: 0.042,
          animClass: 'animate-ambient-bean-a',
          delaySec: 7,
        },
      ];

    case 'logbook':
      // Logbook: Roasted beans with horizontal drifting timeline feel
      return [
        {
          id: 'lb-1',
          shape: 'arabica',
          top: '14%',
          left: '8%',
          sizePx: 90,
          rotationDeg: -25,
          blurPx: 19,
          opacity: 0.05,
          animClass: 'animate-ambient-bean-b',
          delaySec: 1,
        },
        {
          id: 'lb-2',
          shape: 'peaberry',
          top: '36%',
          left: '89%',
          sizePx: 68,
          rotationDeg: 20,
          blurPx: 17,
          opacity: 0.045,
          animClass: 'animate-ambient-bean-c',
          delaySec: 4,
        },
        {
          id: 'lb-3',
          shape: 'arabica',
          top: '68%',
          left: '5%',
          sizePx: 100,
          rotationDeg: 15,
          blurPx: 22,
          opacity: 0.048,
          animClass: 'animate-ambient-bean-a',
          delaySec: 2,
        },
        {
          id: 'lb-4',
          shape: 'geisha',
          top: '80%',
          left: '86%',
          sizePx: 95,
          rotationDeg: -35,
          blurPx: 20,
          opacity: 0.042,
          animClass: 'animate-ambient-bean-d',
          delaySec: 6,
        },
      ];

    case 'equipment':
    default:
      // Gear / Equipment: Calibration bean silhouettes mixed with subtle micro-particles
      return [
        {
          id: 'eq-1',
          shape: 'arabica',
          top: '12%',
          left: '7%',
          sizePx: 85,
          rotationDeg: -12,
          blurPx: 18,
          opacity: 0.05,
          animClass: 'animate-ambient-bean-a',
          delaySec: 0,
        },
        {
          id: 'eq-2',
          shape: 'speck',
          top: '32%',
          left: '92%',
          sizePx: 45,
          rotationDeg: 45,
          blurPx: 14,
          opacity: 0.038,
          animClass: 'animate-ambient-bean-c',
          delaySec: 3,
        },
        {
          id: 'eq-3',
          shape: 'geisha',
          top: '72%',
          left: '6%',
          sizePx: 95,
          rotationDeg: 30,
          blurPx: 21,
          opacity: 0.045,
          animClass: 'animate-ambient-bean-b',
          delaySec: 2,
        },
        {
          id: 'eq-4',
          shape: 'speck',
          top: '78%',
          left: '88%',
          sizePx: 50,
          rotationDeg: -20,
          blurPx: 15,
          opacity: 0.04,
          animClass: 'animate-ambient-bean-d',
          delaySec: 5,
        },
      ];
  }
}

/**
 * AmbientBeanBackground
 * 100% GPU-accelerated background layer of out-of-focus bokeh coffee bean silhouettes.
 * Zero CPU overhead, zero layout thrashing, click-through (pointer-events-none),
 * and automatically dimmed during active brewing.
 */
export const AmbientBeanBackground: React.FC<AmbientBeanBackgroundProps> = ({
  activeTab,
  activeMode,
  isBrewing = false,
}) => {
  const currentView: AmbientViewType = activeMode === 'beandex' ? 'beandex' : activeTab;
  const beans = useMemo(() => getBeansForView(currentView), [currentView]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-opacity duration-1000 ${
        isBrewing ? 'opacity-20' : 'opacity-100'
      }`}
    >
      {beans.map((bean) => (
        <div
          key={bean.id}
          className={`absolute text-[#2C2018] ${bean.animClass}`}
          style={{
            top: bean.top,
            left: bean.left,
            width: `${bean.sizePx}px`,
            height: `${bean.sizePx * 1.3}px`,
            filter: `blur(${bean.blurPx}px)`,
            opacity: bean.opacity,
            transform: `rotate(${bean.rotationDeg}deg) translate3d(0, 0, 0)`,
            animationDelay: `${bean.delaySec}s`,
            animationPlayState: isBrewing ? 'paused' : 'running',
          }}
        >
          <SilhouettePath shape={bean.shape} />
        </div>
      ))}
    </div>
  );
};
