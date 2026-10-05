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
  const diffDays = Math.floor((Date.now() - roastDate.getTime()) / (1000 * 60 * 60 * 24));
  const isFuture = diffDays < 0;
  const daysOff = Math.max(0, diffDays);
  let freshnessScore = 100;
  if (isFuture) {
    freshnessScore = 50; // Unverified future date
  } else if (daysOff < 4) {
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

  if (isFuture) {
    reason += ' (Roast date is set in the future - please verify).';
  } else if (daysOff < 4) {
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

export interface DrinkOptimalBeanGuidance {
  idealRoastSummary: string;
  idealFlavorNotes: string;
  whyIdeal: string;
  recommendationForNextBag: string;
  isCurrentBeanOptimal: boolean;
}

/**
 * Returns barista guidance on the optimal bean profile for a given drink,
 * including a smart generic buying recommendation for users with only 1 bean.
 */
export function getOptimalBeanGuidanceForDrink(
  drink: DrinkRecipe,
  currentBean?: CoffeeBeanProfile
): DrinkOptimalBeanGuidance {
  const currentRoast = currentBean?.roastLevel;
  const isMilk = drink.category === 'milk';
  const isDessert = drink.category === 'dessert';
  const isLungoOrAmericano = drink.id === 'lungo' || drink.id === 'americano';
  const isRistretto = drink.id === 'ristretto';

  if (isMilk || isDessert) {
    const isOptimal = currentRoast === 'medium-dark' || currentRoast === 'medium';
    return {
      idealRoastSummary: 'Medium-Dark or Rich Medium Roast',
      idealFlavorNotes: 'Dark chocolate, toasted hazelnut, toffee & brown sugar (low citric acidity)',
      whyIdeal:
        'A full-bodied medium-dark roast delivers bold caramelized sugars that cut cleanly through the natural sweetness of steamed micro-foam without getting diluted or tasting sour.',
      recommendationForNextBag:
        currentRoast === 'light'
          ? `You are currently brewing with a Light roast. For ${drink.name}, consider picking up a Washed or Pulped Natural Medium-Dark roast next time for a deeper, richer chocolate body that punches through milk.`
          : `For ${drink.name}, look for a Latin American or Pacific Medium-Dark roast with tasting notes of chocolate, caramel, and nuts next time (no specific brand needed—just look for this roast and origin profile).`,
      isCurrentBeanOptimal: isOptimal,
    };
  }

  if (isLungoOrAmericano) {
    const isOptimal = currentRoast === 'light' || currentRoast === 'medium';
    return {
      idealRoastSummary: 'Washed Light to Medium Roast',
      idealFlavorNotes: 'Floral jasmine, crisp stone fruit, bergamot & tea-like clarity',
      whyIdeal:
        'Longer extraction and higher water volume easily leach harsh bitter tannins from dark roasts. A washed light-medium roast preserves refreshing sweetness and delicate origin florals.',
      recommendationForNextBag:
        currentRoast === 'dark' || currentRoast === 'medium-dark'
          ? `You are currently brewing with a darker roast. For ${drink.name}, try experimenting with a Washed Light or Medium roast next time to avoid astringency and enjoy sweet tea-like clarity.`
          : `For ${drink.name}, seek out an African or Central American Washed Light-to-Medium roast with floral or citrus notes for clean, vibrant extraction clarity.`,
      isCurrentBeanOptimal: isOptimal,
    };
  }

  if (isRistretto) {
    const isOptimal = currentRoast === 'medium-dark' || currentRoast === 'dark';
    return {
      idealRoastSummary: 'Medium-Dark to Dark Roast',
      idealFlavorNotes: 'Dense dark cocoa, molasses, roasted almond & thick tiger crema',
      whyIdeal:
        'A short 1:1 to 1:1.5 pull benefits from rapid cellular solubility. A darker roast yields maximum viscosity and rich tiger crema with virtually zero citric sharpness.',
      recommendationForNextBag:
        currentRoast === 'light'
          ? `A Light roast can be intensely sour in a short Ristretto. For ${drink.name}, we strongly recommend exploring a Medium-Dark roast next time for intense, syrupy chocolate body.`
          : `For ${drink.name}, look for a low-altitude or natural-processed Medium-Dark bean with heavy chocolate and baker's cocoa notes for optimal crema density.`,
      isCurrentBeanOptimal: isOptimal,
    };
  }

  // Pure Double / Single Espresso
  const isOptimal = currentRoast === 'medium' || currentRoast === 'medium-dark';
  return {
    idealRoastSummary: 'Sweet Medium Roast (or Balanced Medium-Dark)',
    idealFlavorNotes: 'Red berries, honey sweetness, milk chocolate & balanced citrus acidity',
    whyIdeal:
      'Balanced solubility yields the Golden Zone: crisp malic/citric acidity harmonizing with syrupy sweetness and lasting finish.',
    recommendationForNextBag:
      currentRoast === 'dark'
        ? `For pure espresso like ${drink.name}, try stepping into a Medium roast next time to taste nuanced fruit sweetness alongside classic chocolate without roast smokiness.`
        : currentRoast === 'light'
        ? `Light roast espressos require high temperature and long ratios. For a more traditional, syrupy ${drink.name}, try a balanced Medium roast next time.`
        : `For pure espresso, explore a Natural or Honey-processed Medium roast next time to experience explosive berry sweetness and syrupy body.`,
    isCurrentBeanOptimal: isOptimal,
  };
}
