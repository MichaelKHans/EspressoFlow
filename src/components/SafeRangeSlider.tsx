import React, { useRef, useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';

export interface SafeRangeSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accentColor?: string;
  theme?: 'dark' | 'light';
  ariaLabel?: string;
  className?: string;
  showSteppers?: boolean;
}

/**
 * SafeRangeSlider – Mobile-friendly Range Slider with Scroll-Shield & Stepper Buttons
 *
 * Solves the classic mobile UX problem where vertical page scrolling triggers accidental
 * value jumps on raw HTML5 <input type="range"> elements:
 * 1. Requires deliberate horizontal dragging (cancels immediately if vertical scroll is detected).
 * 2. Eliminates accidental "tap-to-jump" on the track when brushing past it during scrolling.
 * 3. Provides tactile [-] and [+] stepper buttons for effortless single-finger micro-adjustments.
 */
export const SafeRangeSlider: React.FC<SafeRangeSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  accentColor = '#D4A373',
  theme = 'dark',
  ariaLabel = 'Range Slider',
  className = '',
  showSteppers = true,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    isTracking: boolean;
    hasLockedHorizontal: boolean;
    pointerId: number | null;
  }>({
    startX: 0,
    startY: 0,
    isTracking: false,
    hasLockedHorizontal: false,
    pointerId: null,
  });

  // Calculate decimal precision from step
  const stepDecimals = step.toString().includes('.')
    ? step.toString().split('.')[1].length
    : 0;

  const clampAndRound = useCallback(
    (rawVal: number) => {
      const clamped = Math.max(min, Math.min(max, rawVal));
      const stepped = Math.round((clamped - min) / step) * step + min;
      return Number(stepped.toFixed(stepDecimals));
    },
    [min, max, step, stepDecimals]
  );

  const calculateValueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return value;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return clampAndRound(min + pct * (max - min));
    },
    [min, max, clampAndRound, value]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary button
    if (e.button !== 0) return;

    gestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isTracking: true,
      hasLockedHorizontal: false,
      pointerId: e.pointerId,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture.isTracking) return;

    const dx = e.clientX - gesture.startX;
    const dy = e.clientY - gesture.startY;

    // Phase 1: Determine gesture intent (Scroll vs Drag)
    if (!gesture.hasLockedHorizontal) {
      // If user moved vertically more than horizontally and exceeds 8px -> It's a SCROLL!
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        gesture.isTracking = false;
        setIsDragging(false);
        return;
      }

      // If user moved horizontally more than vertically and exceeds 6px -> It's a SLIDER DRAG!
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        gesture.hasLockedHorizontal = true;
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore setPointerCapture errors if pointer already left
        }
      } else {
        return;
      }
    }

    // Phase 2: Active Horizontal Dragging
    const newVal = calculateValueFromPointer(e.clientX);
    if (newVal !== value) {
      onChange(newVal);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (gesture.pointerId !== null && e.currentTarget.hasPointerCapture(gesture.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(gesture.pointerId);
      } catch {
        // ignore
      }
    }
    gestureRef.current = {
      startX: 0,
      startY: 0,
      isTracking: false,
      hasLockedHorizontal: false,
      pointerId: null,
    };
    setIsDragging(false);
  };

  const handleStep = (direction: -1 | 1) => {
    const next = clampAndRound(value + direction * step);
    if (next !== value) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // ignore
        }
      }
      onChange(next);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleStep(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleStep(-1);
    }
  };

  // Visual percentage
  const percentage = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;

  const isDark = theme === 'dark';
  const trackBgClass = isDark ? 'bg-black/40 border border-white/10' : 'bg-[#E8DFD5] border border-[#DECFC0]';
  const stepperBtnClass = isDark
    ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 text-[#FAF7F2] border border-white/10'
    : 'bg-[#FAF7F2] hover:bg-[#F2ECE3] active:bg-[#E8DFD5] text-[#2C2018] border border-[#D0BDAA] shadow-xs';

  return (
    <div className={`flex items-center gap-2 select-none touch-none ${className}`}>
      {/* Decrement Stepper Button */}
      {showSteppers && (
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={value <= min}
          aria-label={`Decrease ${ariaLabel}`}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${stepperBtnClass}`}
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}

      {/* Interactive Track Area */}
      <div
        ref={trackRef}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className="relative flex-1 py-3 cursor-pointer group focus:outline-none"
        style={{ touchAction: 'pan-y' }} // Tell browser that vertical scroll is always permitted
      >
        {/* Track Groove */}
        <div className={`w-full h-2 rounded-full overflow-hidden ${trackBgClass}`}>
          {/* Filled Bar */}
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${percentage}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>

        {/* Tactile Thumb Knob */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-md border-2 transition-transform duration-75 pointer-events-none ${
            isDragging ? 'scale-125' : 'group-hover:scale-110'
          }`}
          style={{
            left: `${percentage}%`,
            backgroundColor: '#FFFDF9',
            borderColor: accentColor,
            boxShadow: isDragging ? `0 0 10px ${accentColor}80` : undefined,
          }}
        />
      </div>

      {/* Increment Stepper Button */}
      {showSteppers && (
        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={value >= max}
          aria-label={`Increase ${ariaLabel}`}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${stepperBtnClass}`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
