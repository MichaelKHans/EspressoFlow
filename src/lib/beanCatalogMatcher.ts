/**
 * Flowbean - Beandex Specialty Coffee Catalog, Fuzzy Matching & Autocomplete Engine
 * Prevents typos, duplicates, and enriches beans with standardized specialty coffee metadata.
 */

import type { RoastLevel } from '../types/espresso';
export type { CatalogCoffeeItem } from './coffeeCatalogData';
import { ALL_VERIFIED_COFFEE_CATALOG, type CatalogCoffeeItem } from './coffeeCatalogData';

export const POPULAR_FLAVOR_TAGS: { id: string; labelEn: string; labelDa: string; icon: string }[] = [
  { id: 'dark_chocolate', labelEn: 'Dark Chocolate', labelDa: 'Mørk Chokolade', icon: '🍫' },
  { id: 'milk_chocolate', labelEn: 'Milk Chocolate', labelDa: 'Mælkechokolade', icon: '🍫' },
  { id: 'caramel', labelEn: 'Caramel & Toffee', labelDa: 'Karamel & Toffee', icon: '🍮' },
  { id: 'roasted_nuts', labelEn: 'Roasted Hazelnuts', labelDa: 'Ristede Nødder', icon: '🌰' },
  { id: 'almond', labelEn: 'Sweet Almond', labelDa: 'Sød Mandel', icon: '🥜' },
  { id: 'red_berries', labelEn: 'Red Berries', labelDa: 'Røde Bær', icon: '🍒' },
  { id: 'blackcurrant', labelEn: 'Blackcurrant', labelDa: 'Solbær', icon: '🍇' },
  { id: 'citrus', labelEn: 'Citrus & Bergamot', labelDa: 'Citrus & Bergamot', icon: '🍊' },
  { id: 'stone_fruit', labelEn: 'Peach & Apricot', labelDa: 'Fersken & Abrikos', icon: '🍑' },
  { id: 'floral', labelEn: 'Jasmine & Florals', labelDa: 'Jasmin & Blomster', icon: '🌸' },
  { id: 'spices', labelEn: 'Cinnamon & Spices', labelDa: 'Kanel & Krydderier', icon: '🌿' },
  { id: 'honey', labelEn: 'Wild Honey', labelDa: 'Vild Honning', icon: '🍯' },
  { id: 'creamy_body', labelEn: 'Heavy Creamy Body', labelDa: 'Cremet & Fyldig Krop', icon: '🥛' },
];

/**
 * Curated Global & Nordic Specialty Coffee Knowledge Base
 * Sourced directly from verified master catalog in coffeeCatalogData.ts (50+ international lots)
 */
export const VERIFIED_COFFEE_CATALOG: CatalogCoffeeItem[] = ALL_VERIFIED_COFFEE_CATALOG;

/**
 * Standard list of verified roasters for fast autocomplete
 */
export const VERIFIED_ROASTERS: string[] = Array.from(
  new Set(VERIFIED_COFFEE_CATALOG.map((item) => item.roaster))
).sort();

/**
 * Search the verified catalog for beans matching a keyword or phrase
 */
export function searchCatalogBeans(query: string, maxResults: number = 6): CatalogCoffeeItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return VERIFIED_COFFEE_CATALOG.slice(0, maxResults);

  return VERIFIED_COFFEE_CATALOG.filter((item) => {
    const fullText = `${item.roaster} ${item.name} ${item.originCountry} ${item.species || ''} ${item.varietal || ''} ${item.flavorNotes.join(' ')}`.toLowerCase();
    return fullText.includes(q);
  }).slice(0, maxResults);
}

/**
 * Suggest roaster names matching user input (Autocomplete)
 */
export function suggestRoasters(query: string, maxSuggestions: number = 5): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return VERIFIED_ROASTERS.slice(0, maxSuggestions);

  return VERIFIED_ROASTERS.filter((r) => r.toLowerCase().includes(q)).slice(0, maxSuggestions);
}

/**
 * Levenshtein distance calculation to detect and correct user typos
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const n = a.length;
  const m = b.length;

  if (n === 0) return m;
  if (m === 0) return n;

  for (let i = 0; i <= n; i++) matrix[i] = [i];
  for (let j = 0; j <= m; j++) matrix[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[n][m];
}

export interface DidYouMeanMatch {
  suggestedRoaster: string;
  matchedItem: CatalogCoffeeItem;
  similarityRatio: number; // 0 to 1
}

/**
 * Beandex "Did You Mean...?" fuzzy match detector for roaster or bean typos
 */
export function findDidYouMeanBean(inputRoaster: string, inputName: string): DidYouMeanMatch | null {
  const rClean = inputRoaster.trim().toLowerCase();
  const nClean = inputName.trim().toLowerCase();
  if (rClean.length < 3 && nClean.length < 3) return null;

  let bestMatch: DidYouMeanMatch | null = null;
  let highestSim = 0;

  for (const item of VERIFIED_COFFEE_CATALOG) {
    const itemRoaster = item.roaster.toLowerCase();
    const itemName = item.name.toLowerCase();

    // Check exact match (no suggestion needed)
    if (rClean === itemRoaster && nClean === itemName) {
      return null;
    }

    // Roaster typo check (e.g. "hedekafe" -> "Hedekaffe", "lavaza" -> "Lavazza")
    if (rClean.length >= 3) {
      const dist = levenshteinDistance(rClean, itemRoaster);
      const maxLen = Math.max(rClean.length, itemRoaster.length);
      const sim = 1 - dist / maxLen;

      // If very close typo (e.g. 1-2 edits off)
      if (sim >= 0.75 && sim < 1 && sim > highestSim) {
        highestSim = sim;
        bestMatch = {
          suggestedRoaster: item.roaster,
          matchedItem: item,
          similarityRatio: sim,
        };
      }
    }

    // Name typo check (e.g. "Ristemesterens Foretrukne" vs "Ristemesters Foretrukken")
    if (nClean.length >= 4) {
      const dist = levenshteinDistance(nClean, itemName);
      const maxLen = Math.max(nClean.length, itemName.length);
      const sim = 1 - dist / maxLen;

      if (sim >= 0.75 && sim < 1 && sim > highestSim) {
        highestSim = sim;
        bestMatch = {
          suggestedRoaster: item.roaster,
          matchedItem: item,
          similarityRatio: sim,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Validates and cleans user input to protect Central Bean Vault database integrity
 */
export function sanitizeBeanInput(input: {
  roaster?: string;
  name: string;
  roastLevel: RoastLevel;
}): { valid: boolean; roaster: string; name: string; error?: string } {
  let name = (input.name || '').trim();
  let roaster = (input.roaster || '').trim();

  // Strip obvious fallback pattern like "Coffee (3019)"
  if (/^Coffee\s*\(\d+\)$/i.test(name)) {
    return {
      valid: false,
      roaster,
      name,
      error: 'Please enter a specific bean name or choose a verified blend.',
    };
  }

  if (name.length < 2) {
    return {
      valid: false,
      roaster,
      name,
      error: 'Coffee bean name must have at least 2 characters.',
    };
  }

  // Capitalize words cleanly
  name = name.replace(/\b\w/g, (char) => char.toUpperCase());
  if (roaster) {
    roaster = roaster.replace(/\b\w/g, (char) => char.toUpperCase());
  } else {
    roaster = 'Specialty Roaster';
  }

  return {
    valid: true,
    roaster,
    name,
  };
}

/**
 * Compresses an image file/blob on an offscreen canvas to a compact data URL (< 40 KB)
 * suitable for persisting in localStorage.
 */
export function compressImageToDataUrl(file: File | Blob, maxDim = 400, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
