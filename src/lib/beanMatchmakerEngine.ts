/**
 * Flowbean - Beandex Matchmaker™ Recommendation & Palate Engine
 * Pure, high-precision matching algorithm mapping barista preferences to curated coffee lots.
 */

import type { RoastLevel, PriceTier } from '../types/espresso';
import {
  ALL_VERIFIED_COFFEE_CATALOG,
  type CatalogCoffeeItem,
  resolveBeanPriceTier,
} from './coffeeCatalogData';

export type PreferredDrink = 'pure_espresso' | 'milk_drink' | 'filter_pour_over' | 'all_rounder';
export type AcidityTolerance = 'low' | 'balanced' | 'high';

export interface MatchmakerPreferences {
  preferredDrink: PreferredDrink;
  flavorTags: string[]; // e.g. ['dark_chocolate', 'caramel', 'blackcurrant']
  acidity: AcidityTolerance;
  priceTier: 'all' | PriceTier;
  preferredRoast?: 'all' | RoastLevel;
}

export interface CoffeeMatchResult {
  item: CatalogCoffeeItem;
  matchScore: number; // 0 to 100
  rationaleDa: string;
  rationaleEn: string;
  matchedFlavorTags: string[];
  resolvedPriceTier: PriceTier;
}

/**
 * Keyword mapper associating standard tag IDs with multilingual text matches
 */
const FLAVOR_KEYWORD_MAP: Record<string, string[]> = {
  dark_chocolate: ['mørk chokolade', 'chokolade', 'dark chocolate', 'kakao', 'cacao', 'cocoa'],
  milk_chocolate: ['mælkechokolade', 'chokolade', 'milk chocolate'],
  caramel: ['karamel', 'toffee', 'caramel', 'brun farin', 'rørsukker', 'brown sugar'],
  roasted_nuts: ['ristede nødder', 'nødder', 'hasselnød', 'hazelnut', 'almond', 'mandel'],
  almond: ['sød mandel', 'mandel', 'marcipan', 'almond'],
  red_berries: ['røde bær', 'red berries', 'jordbær', 'hindbær', 'kirsebær', 'cherry'],
  blackcurrant: ['solbær', 'blackcurrant', 'ribs', 'brombær', 'rabarber'],
  citrus: ['citrus', 'bergamot', 'citron', 'lime', 'grapefrugt', 'orange'],
  stone_fruit: ['fersken', 'abrikos', 'peach', 'apricot', 'nektarin', 'stenfrugt'],
  floral: ['jasmin', 'jasmine', 'blomster', 'floral', 'hvid te', 'lavendel'],
  spices: ['kanel', 'krydderier', 'spices', 'kardemomme', 'cedertræ'],
  honey: ['honning', 'honey', 'vild honning'],
  creamy_body: ['cremet', 'crema', 'fyldig krop', 'fløjlsblød', 'heavy body', 'silky'],
};

/**
 * Calculate personalized coffee matches from the master catalog
 */
export function calculateCoffeeMatches(
  prefs: MatchmakerPreferences,
  catalog: CatalogCoffeeItem[] = ALL_VERIFIED_COFFEE_CATALOG,
  maxResults: number = 5
): CoffeeMatchResult[] {
  const results: CoffeeMatchResult[] = catalog.map((item) => {
    let score = 0;
    const matchedTags: string[] = [];
    const itemPriceTier = resolveBeanPriceTier(item);
    const itemFlavorText = (item.flavorNotes || []).join(' ').toLowerCase();

    // -------------------------------------------------------------
    // 1. Drink Synergy (Max 30 points)
    // -------------------------------------------------------------
    const suitable = item.suitableFor || [];
    if (prefs.preferredDrink === 'milk_drink') {
      if (
        suitable.some((s) => ['flat_white', 'cappuccino', 'cortado'].includes(s)) ||
        item.roastLevel === 'medium' ||
        item.roastLevel === 'medium-dark' ||
        item.roastLevel === 'dark' ||
        (item.species && item.species.toLowerCase().includes('robusta'))
      ) {
        score += 30;
      } else {
        score += 15; // light single origin can still work in cortado
      }
    } else if (prefs.preferredDrink === 'pure_espresso') {
      if (suitable.includes('pure_espresso') || (item.scaScore && item.scaScore >= 88)) {
        score += 30;
      } else {
        score += 20;
      }
    } else if (prefs.preferredDrink === 'filter_pour_over') {
      if (suitable.includes('pour_over') || item.roastLevel === 'light') {
        score += 30;
      } else {
        score += 15;
      }
    } else {
      // all_rounder
      score += 28;
    }

    // -------------------------------------------------------------
    // 2. Flavor Notes Overlap (Max 35 points)
    // -------------------------------------------------------------
    if (prefs.flavorTags.length > 0) {
      let tagHits = 0;
      for (const tagId of prefs.flavorTags) {
        const keywords = FLAVOR_KEYWORD_MAP[tagId] || [tagId.replace('_', ' ')];
        const hasMatch = keywords.some((kw) => itemFlavorText.includes(kw));
        if (hasMatch) {
          tagHits++;
          matchedTags.push(tagId);
        }
      }

      if (tagHits >= 2) {
        score += 35;
      } else if (tagHits === 1) {
        score += 25;
      } else {
        score += 8;
      }
    } else {
      score += 25; // Neutral baseline when no specific flavor chosen
    }

    // -------------------------------------------------------------
    // 3. Acidity Preference (Max 15 points)
    // -------------------------------------------------------------
    if (prefs.acidity === 'low') {
      if (item.roastLevel === 'dark' || item.roastLevel === 'medium-dark') {
        score += 15;
      } else if (item.roastLevel === 'medium') {
        score += 12;
      } else {
        score += 4;
      }
    } else if (prefs.acidity === 'high') {
      if (item.roastLevel === 'light') {
        score += 15;
      } else if (item.roastLevel === 'medium') {
        score += 8;
      } else {
        score += 3;
      }
    } else {
      // balanced
      if (item.roastLevel === 'medium') {
        score += 15;
      } else {
        score += 10;
      }
    }

    // -------------------------------------------------------------
    // 4. Price Tier Preference (Max 15 points)
    // -------------------------------------------------------------
    if (prefs.priceTier === 'all' || prefs.priceTier === itemPriceTier) {
      score += 15;
    } else {
      // Adjacent tier partial credit
      const tierHierarchy: PriceTier[] = ['budget', 'standard', 'premium', 'ultra_rare'];
      const userIdx = tierHierarchy.indexOf(prefs.priceTier);
      const itemIdx = tierHierarchy.indexOf(itemPriceTier);
      if (Math.abs(userIdx - itemIdx) === 1) {
        score += 8;
      } else {
        score += 2;
      }
    }

    // -------------------------------------------------------------
    // 5. SCA Quality / Specialty Bonus (Max 5 points)
    // -------------------------------------------------------------
    if (item.scaScore && item.scaScore >= 90) {
      score += 5;
    } else if (item.scaScore && item.scaScore >= 87) {
      score += 3;
    }

    // Clamp score to max 99% (save 100% for absolute perfection)
    const finalScore = Math.min(99, Math.max(45, Math.round(score)));

    // Generate baristas rationales
    const { rationaleDa, rationaleEn } = generateRationale(item, prefs, matchedTags);

    return {
      item,
      matchScore: finalScore,
      rationaleDa,
      rationaleEn,
      matchedFlavorTags: matchedTags,
      resolvedPriceTier: itemPriceTier,
    };
  });

  // Sort descending by score
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, maxResults);
}

/**
 * Generate human-readable barista explanation for why this bean is a great match
 */
function generateRationale(
  item: CatalogCoffeeItem,
  prefs: MatchmakerPreferences,
  _matchedTags: string[]
): { rationaleDa: string; rationaleEn: string } {
  const notesStr = item.flavorNotes.slice(0, 3).join(', ');
  const roastStrDa =
    item.roastLevel === 'light' ? 'lysristning' : item.roastLevel === 'dark' ? 'mørkristning' : 'mellemristning';
  const roastStrEn = `${item.roastLevel} roast`;

  if (prefs.preferredDrink === 'milk_drink') {
    return {
      rationaleDa: `Fremragende til mælkedrikke takket være dens fyldige ${roastStrDa} og noter af ${notesStr}. Bevarer en intens kaffesmag i koppen.`,
      rationaleEn: `Exceptional in milk drinks thanks to its rich ${roastStrEn} and notes of ${notesStr}. Cuts smoothly through steamed milk.`,
    };
  }

  if (prefs.preferredDrink === 'pure_espresso') {
    return {
      rationaleDa: `Perfekt til ren espresso med en sublim balance, ${item.species || '100% Arabica'} og noter af ${notesStr}. ${item.scaScore ? `Bedømt til ${item.scaScore} SCA point.` : ''}`,
      rationaleEn: `Ideal for pure espresso with pristine balance, ${item.species || '100% Arabica'}, and notes of ${notesStr}. ${item.scaScore ? `Rated ${item.scaScore} SCA points.` : ''}`,
    };
  }

  if (prefs.acidity === 'high') {
    return {
      rationaleDa: `Sprudlende og saftig profil med livlig frugtsyre og elegante noter af ${notesStr}.`,
      rationaleEn: `Vibrant and juicy profile showcasing sparkling fruit acidity and complex notes of ${notesStr}.`,
    };
  }

  return {
    rationaleDa: `Meget harmonisk kaffe med ${roastStrDa}, blød krop og behagelige noter af ${notesStr}.`,
    rationaleEn: `Harmonious all-rounder with ${roastStrEn}, velvety body, and sweet notes of ${notesStr}.`,
  };
}
