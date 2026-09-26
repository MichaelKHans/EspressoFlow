import type { CoffeeBeanProfile, DrinkRecipe, RoastLevel } from '../types/espresso';

export interface BeanMatchResult {
  bean: CoffeeBeanProfile;
  matchScore: number; // 0-100
  reason: string;
}

/**
 * Roast level compatibility matrix.
 * Each pair [drinkIdeal, beanActual] returns a compatibility score (0-100).
 */
const ROAST_COMPATIBILITY: Record<RoastLevel, Record<RoastLevel, number>> = {
  light:          { light: 100, medium: 70, 'medium-dark': 30, dark: 10 },
  medium:         { light: 70,  medium: 100, 'medium-dark': 80, dark: 40 },
  'medium-dark':  { light: 20,  medium: 75, 'medium-dark': 100, dark: 85 },
  dark:           { light: 5,   medium: 35, 'medium-dark': 80, dark: 100 },
};

/**
 * Calculate how well a bean matches a drink recipe.
 * Considers roast level compatibility and freshness (days off roast).
 */
function scoreBeanForDrink(bean: CoffeeBeanProfile, drink: DrinkRecipe): BeanMatchResult {
  const idealLevels = drink.idealRoastLevels || ['medium'];

  // Best roast compatibility score across all ideal levels
  let bestRoastScore = 0;
  let bestMatchLevel: RoastLevel = 'medium';
  for (const ideal of idealLevels) {
    const score = ROAST_COMPATIBILITY[ideal]?.[bean.roastLevel] ?? 50;
    if (score > bestRoastScore) {
      bestRoastScore = score;
      bestMatchLevel = ideal;
    }
  }

  // Freshness bonus (7-21 days off roast is peak, <4 too fresh CO2, >30 stale)
  const roastDate = new Date(bean.roastDate);
  const daysOff = Math.max(0, Math.floor((Date.now() - roastDate.getTime()) / (1000 * 60 * 60 * 24)));
  let freshnessScore = 100;
  if (daysOff < 4) {
    freshnessScore = 60; // CO2 outgassing, too fresh
  } else if (daysOff <= 21) {
    freshnessScore = 100; // Peak window
  } else if (daysOff <= 35) {
    freshnessScore = 80; // Still good
  } else {
    freshnessScore = Math.max(30, 100 - (daysOff - 21) * 2); // Declining
  }

  // Weighted composite: 75% roast match, 25% freshness
  const compositeScore = Math.round(bestRoastScore * 0.75 + freshnessScore * 0.25);

  // Generate human-readable reason
  let reason = '';
  if (compositeScore >= 90) {
    reason = `Excellent match. ${bean.roastLevel} roast pairs naturally with ${drink.name}.`;
  } else if (compositeScore >= 70) {
    reason = `Good match. ${bean.roastLevel} roast works well for ${drink.name}.`;
  } else if (compositeScore >= 50) {
    reason = `Fair match. A ${bestMatchLevel} roast would be more ideal for ${drink.name}.`;
  } else {
    reason = `Low compatibility. ${drink.name} typically calls for a ${bestMatchLevel} roast profile.`;
  }

  if (daysOff < 4) {
    reason += ` Bean is only ${daysOff}d off roast (CO2 outgassing phase).`;
  } else if (daysOff > 35) {
    reason += ` Bean is ${daysOff}d off roast -- consider a fresher bag.`;
  }

  return {
    bean,
    matchScore: compositeScore,
    reason,
  };
}

/**
 * Match all beans in the vault against a specific drink recipe.
 * Returns beans sorted by match score (best first).
 */
export function matchBeansForDrink(beans: CoffeeBeanProfile[], drink: DrinkRecipe): BeanMatchResult[] {
  return beans
    .map((bean) => scoreBeanForDrink(bean, drink))
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get the best matching bean for a drink.
 */
export function getBestBeanForDrink(beans: CoffeeBeanProfile[], drink: DrinkRecipe): BeanMatchResult | null {
  const results = matchBeansForDrink(beans, drink);
  return results.length > 0 ? results[0] : null;
}

/**
 * Human-readable label for roast level.
 */
export const ROAST_LABELS: Record<RoastLevel, string> = {
  light: 'Light Roast',
  medium: 'Medium Roast',
  'medium-dark': 'Medium-Dark Roast',
  dark: 'Dark Roast',
};
