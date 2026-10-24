/**
 * Flowbean Brew Physics Taxonomy (Etape 0 – Multi-Gear Foundation)
 *
 * Instead of asking "which machine is this?", the math asks "which physics is this?".
 * Every drink + machine/brewer combination (official catalog OR user-created custom gear)
 * resolves to exactly one BrewPhysics class, which decides:
 *  - which learning signal is valid (hydraulic resistance vs. taste-only)
 *  - which grinder zone applies (espresso vs. filter)
 *  - whether shots may feed the grinder slope model in grindIntelligence.ts
 */

import type { DrinkRecipe } from '../types/espresso';

export type BrewPhysics =
  | 'pump_espresso'       // Electric pump ~9 bar (E61, Dedica non-pressurized, Bambino, ...)
  | 'manual_espresso'     // Hand-pumped / lever (Picopresso, Flair, Cafelat Robot, Nanopresso)
  | 'pressurized_basket'  // Double-wall valve basket – valve, not puck, controls flow
  | 'moka'                // Stovetop steam pressure 1.5–2.5 bar (Bialetti Moka / Brikka)
  | 'percolation'         // Gravity drip (V60, Kalita, Chemex, Orea, Origami, April)
  | 'immersion'           // Full steep (French Press, Clever, Hario Switch)
  | 'immersion_pressure'; // Steep + manual plunge (AeroPress, Delter)

export interface BrewPhysicsProfile {
  physics: BrewPhysics;
  /** Hydraulic resistance learning (T_norm slope) is physically valid */
  supportsResistanceLearning: boolean;
  /** Which grinder zone the physics belongs to */
  grinderZone: 'espresso' | 'filter';
  /** Primary learning signal available for this physics */
  learningSignal: 'contact_time' | 'flow_time_from_first_drip' | 'drawdown_weak' | 'taste_only';
}

const PROFILES: Record<BrewPhysics, BrewPhysicsProfile> = {
  pump_espresso: { physics: 'pump_espresso', supportsResistanceLearning: true, grinderZone: 'espresso', learningSignal: 'contact_time' },
  manual_espresso: { physics: 'manual_espresso', supportsResistanceLearning: true, grinderZone: 'espresso', learningSignal: 'flow_time_from_first_drip' },
  pressurized_basket: { physics: 'pressurized_basket', supportsResistanceLearning: false, grinderZone: 'espresso', learningSignal: 'taste_only' },
  moka: { physics: 'moka', supportsResistanceLearning: false, grinderZone: 'filter', learningSignal: 'taste_only' },
  percolation: { physics: 'percolation', supportsResistanceLearning: false, grinderZone: 'filter', learningSignal: 'drawdown_weak' },
  immersion: { physics: 'immersion', supportsResistanceLearning: false, grinderZone: 'filter', learningSignal: 'taste_only' },
  immersion_pressure: { physics: 'immersion_pressure', supportsResistanceLearning: false, grinderZone: 'filter', learningSignal: 'taste_only' },
};

const MANUAL_ESPRESSO_PATTERN = /picopresso|nanopresso|minipresso|flair|cafelat|robot|leverpresso|9barista|rok\b|uniterra/i;
const MOKA_PATTERN = /moka|brikka|bialetti|stovetop/i;
const IMMERSION_PRESSURE_PATTERN = /aeropress|delter/i;
const IMMERSION_PATTERN = /french press|stempel|clever|switch|chambord|espro/i;

export function getBrewPhysicsProfile(physics: BrewPhysics): BrewPhysicsProfile {
  return PROFILES[physics];
}

/**
 * Resolves the physics class for a drink in the context of the active machine or filter brewer.
 * Works for both official catalog gear and custom user-created gear (name-pattern based,
 * with an explicit override for custom gear that declares its own physics).
 */
export function resolveBrewPhysics(params: {
  drink?: Pick<DrinkRecipe, 'id' | 'method' | 'brewStyle'>;
  machineName?: string;
  filterBrewer?: string;
  explicitPhysics?: BrewPhysics;
}): BrewPhysics {
  const { drink, machineName, filterBrewer, explicitPhysics } = params;
  if (explicitPhysics) return explicitPhysics;

  const isFilterDrink = drink?.method === 'pour_over';

  if (!isFilterDrink) {
    if (machineName && MANUAL_ESPRESSO_PATTERN.test(machineName)) return 'manual_espresso';
    return 'pump_espresso';
  }

  const brewer = filterBrewer || '';
  if (MOKA_PATTERN.test(brewer)) return 'moka';
  if (drink?.id === 'aeropress' || IMMERSION_PRESSURE_PATTERN.test(brewer)) return 'immersion_pressure';
  if (drink?.id === 'french-press' || drink?.brewStyle === 'immersion' || IMMERSION_PATTERN.test(brewer)) return 'immersion';
  return 'percolation';
}

/**
 * Normalizes a gear display name into a stable, comparison-safe key.
 * "De'Longhi Dedica (EC685)" -> "delonghi-dedica-ec685"
 */
export function toGearKey(name?: string): string {
  if (!name) return 'any';
  const key = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return key || 'any';
}

/**
 * Minimum meaningful grind delta for a grinder, used by the learning sanity gates.
 * Stepped grinders: 0.5 (half-step digital/click). Stepless: 0.2 (matches Dial-In stepper).
 */
export function getMinMeaningfulStepDelta(grinderType?: 'stepped' | 'stepless'): number {
  return grinderType === 'stepless' ? 0.2 : 0.5;
}
