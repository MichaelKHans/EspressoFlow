/**
 * Espresso Flow - Vivino-Style Coffee Catalog, Fuzzy Matching & Autocomplete Engine
 * Prevents typos, duplicates, and enriches beans with standardized specialty coffee metadata.
 */

import type { RoastLevel } from '../types/espresso';

export interface CatalogCoffeeItem {
  roaster: string;
  name: string;
  roastLevel: RoastLevel;
  originCountry: string;
  flavorNotes: string[];
  process?: 'washed' | 'natural' | 'honey' | 'anaerobic' | 'monsooned';
  altitudeMeters?: string;
  scaScore?: number;
  suitableFor?: string[];
  barcode?: string;
  notes?: string;
}

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
 */
export const VERIFIED_COFFEE_CATALOG: CatalogCoffeeItem[] = [
  // --- HEDEKAFFE (Ulfborg, Vestjylland, Danmark) ---
  {
    roaster: 'Hedekaffe',
    name: 'Ristemesterens Foretrukne Mellemristet',
    roastLevel: 'medium',
    originCountry: 'Sydamerika & Indonesien',
    flavorNotes: ['Mørk Chokolade', 'Ristede Nødder', 'Karamel'],
    process: 'washed',
    suitableFor: ['pure_espresso', 'flat_white', 'cortado', 'cappuccino'],
    barcode: '4056489503019',
    notes: 'Vestjysk skånsom langtidsristning af Arabica & Robusta. Blød og fyldig aroma uden bitterhed.',
  },
  {
    roaster: 'Hedekaffe',
    name: 'Økologisk Mørkristet Espresso',
    roastLevel: 'dark',
    originCountry: 'Peru & Honduras',
    flavorNotes: ['Mørk Chokolade', 'Ristede Nødder', 'Krydderier'],
    process: 'washed',
    suitableFor: ['flat_white', 'cappuccino', 'pure_espresso'],
    notes: 'Kraftig økologisk espresso med intens crema og lav syrlighed.',
  },
  {
    roaster: 'Hedekaffe',
    name: 'Vestjysk Blanding Helbønner',
    roastLevel: 'medium-dark',
    originCountry: 'Brasilien & Colombia',
    flavorNotes: ['Karamel', 'Ristede Nødder', 'Mælkechokolade'],
    process: 'natural',
    suitableFor: ['all_rounder', 'cortado', 'flat_white'],
    notes: 'Rund og afbalanceret hverdagsblanding med behagelig sødme.',
  },

  // --- COFFEE COLLECTIVE (København, Danmark) ---
  {
    roaster: 'Coffee Collective',
    name: 'Kieni Espresso (Nyeri, Kenya)',
    roastLevel: 'light',
    originCountry: 'Kenya',
    flavorNotes: ['Solbær', 'Rabarber', 'Citrus & Bergamot'],
    process: 'washed',
    altitudeMeters: '1800m',
    scaScore: 91,
    suitableFor: ['pure_espresso', 'americano'],
    barcode: '5711953000012',
    notes: 'Legendarisk lysristet specialty espresso med intens frugtsyre og bærsødme.',
  },
  {
    roaster: 'Coffee Collective',
    name: 'Takesi Espresso (Bolivia)',
    roastLevel: 'light',
    originCountry: 'Bolivia',
    flavorNotes: ['Jasmin & Blomster', 'Fersken & Abrikos', 'Vild Honning'],
    process: 'washed',
    altitudeMeters: '2200m',
    scaScore: 93,
    suitableFor: ['pure_espresso'],
    barcode: '5711953000029',
    notes: 'Dyrket på verdens højeste kaffefarm med exceptionel blomstret renhed.',
  },
  {
    roaster: 'Coffee Collective',
    name: 'Vista Hermosa Espresso (Guatemala)',
    roastLevel: 'medium',
    originCountry: 'Guatemala',
    flavorNotes: ['Mælkechokolade', 'Nødder', 'Røde Bær'],
    process: 'washed',
    altitudeMeters: '1600m',
    scaScore: 88,
    suitableFor: ['pure_espresso', 'flat_white', 'cortado'],
    notes: 'Klassisk sød og fyldig balance med bløde chokoladenoter.',
  },

  // --- LA CABRA (Aarhus & København) ---
  {
    roaster: 'La Cabra',
    name: 'San Fermin Espresso',
    roastLevel: 'light',
    originCountry: 'Colombia',
    flavorNotes: ['Røde Bær', 'Fersken & Abrikos', 'Karamel'],
    process: 'washed',
    scaScore: 89,
    suitableFor: ['pure_espresso', 'cortado'],
    notes: 'Livlig og frugtig colombiansk profil med funklende ren eftersmag.',
  },
  {
    roaster: 'La Cabra',
    name: 'Bob-o-link Espresso',
    roastLevel: 'medium',
    originCountry: 'Brasilien',
    flavorNotes: ['Mælkechokolade', 'Ristede Nødder', 'Sød Mandel'],
    process: 'natural',
    scaScore: 87,
    suitableFor: ['flat_white', 'cortado', 'cappuccino'],
    notes: 'Naturlig forarbejdet brasiliansk lot med blød krop og lav syre.',
  },

  // --- LAVAZZA (Torino, Italien) ---
  {
    roaster: 'Lavazza',
    name: 'Espresso Barista Gran Crema',
    roastLevel: 'medium-dark',
    originCountry: 'Sydamerika & Sydøstasien',
    flavorNotes: ['Mørk Chokolade', 'Ristede Nødder', 'Krydderier'],
    suitableFor: ['pure_espresso', 'cappuccino', 'flat_white'],
    barcode: '8000070025066',
    notes: 'Klassisk italiensk bar-blend med fløjlsblød crema og intens kakao-aroma.',
  },
  {
    roaster: 'Lavazza',
    name: 'Espresso Barista Perfetto',
    roastLevel: 'medium',
    originCountry: '100% Arabica',
    flavorNotes: ['Mælkechokolade', 'Karamel & Toffee', 'Jasmin & Blomster'],
    suitableFor: ['pure_espresso', 'cortado'],
    barcode: '8000070025080',
    notes: 'Aromatisk 100% Arabica med delikate blomsterundertoner og blid ristning.',
  },
  {
    roaster: 'Lavazza',
    name: 'Espresso Barista Intenso',
    roastLevel: 'dark',
    originCountry: 'Arabica & Robusta',
    flavorNotes: ['Mørk Chokolade', 'Krydderier', 'Cremet & Fyldig Krop'],
    suitableFor: ['cappuccino', 'flat_white', 'pure_espresso'],
    barcode: '8000070025059',
    notes: 'Ekstremt fyldig mørkristet espresso med vedvarende crema.',
  },
  {
    roaster: 'Lavazza',
    name: 'Qualità Oro 100% Arabica',
    roastLevel: 'medium',
    originCountry: 'Mellem- & Sydamerika',
    flavorNotes: ['Karamel & Toffee', 'Honning', 'Blomster'],
    suitableFor: ['pure_espresso', 'cortado', 'americano'],
    barcode: '8000070038806',
    notes: 'Lavazzas historiske mesterblend skabt i 1956. Sød, blød og gylden.',
  },
  {
    roaster: 'Lavazza',
    name: 'Crema e Gusto Classico',
    roastLevel: 'dark',
    originCountry: 'Brasilien & Sydøstasien',
    flavorNotes: ['Mørk Chokolade', 'Krydderier', 'Ristede Nødder'],
    suitableFor: ['flat_white', 'cappuccino'],
    barcode: '8000070010567',
    notes: 'Klassisk napolitansk profil med markant krop og behagelig bitterhed.',
  },
  {
    roaster: 'Lavazza',
    name: 'Super Crema Espresso',
    roastLevel: 'medium',
    originCountry: 'Brasilien & Indien',
    flavorNotes: ['Ristede Nødder', 'Brun Farin', 'Karamel'],
    suitableFor: ['pure_espresso', 'flat_white', 'cortado'],
    barcode: '8000070008502',
    notes: 'Harmonisk espresso med nøddeagtig aroma og elastisk tæt crema.',
  },

  // --- ILLY (Trieste, Italien) ---
  {
    roaster: 'Illy',
    name: 'Classico 100% Arabica Medium',
    roastLevel: 'medium',
    originCountry: '100% Arabica Blend (9 origins)',
    flavorNotes: ['Karamel & Toffee', 'Jasmin & Blomster', 'Mælkechokolade'],
    suitableFor: ['pure_espresso', 'cortado'],
    barcode: '8027785055003',
    notes: 'Klassisk italiensk elegance med perfekt balance mellem sødme og syre.',
  },
  {
    roaster: 'Illy',
    name: 'Intenso Bold Roast 100% Arabica',
    roastLevel: 'dark',
    originCountry: '100% Arabica Blend',
    flavorNotes: ['Mørk Chokolade', 'Tørret Frugt', 'Krydderier'],
    suitableFor: ['pure_espresso', 'cappuccino'],
    barcode: '8027785055027',
    notes: 'Fyldig mørkristet espresso med dyb kakaosmag.',
  },

  // --- PETER LARSEN KAFFE (Viborg, Danmark) ---
  {
    roaster: 'Peter Larsen Kaffe',
    name: 'Rød Helbønner Mellemristet',
    roastLevel: 'medium-dark',
    originCountry: 'Sydamerika & Afrika',
    flavorNotes: ['Karamel', 'Ristede Nødder', 'Mælkechokolade'],
    suitableFor: ['all_rounder', 'flat_white', 'cortado'],
    barcode: '5701046101017',
    notes: 'Traditionel dansk kaffeklassiker med blid sødme og god dybde.',
  },
  {
    roaster: 'Peter Larsen Kaffe',
    name: 'Økologisk Espresso Fairtrade',
    roastLevel: 'dark',
    originCountry: 'Honduras & Peru',
    flavorNotes: ['Mørk Chokolade', 'Ristede Nødder', 'Cremet & Fyldig Krop'],
    suitableFor: ['flat_white', 'cappuccino', 'pure_espresso'],
    barcode: '5701046101239',
    notes: 'Kraftfuld og sirupsagtig certificeret økologisk espresso.',
  },

  // --- BKI (Aarhus, Danmark) ---
  {
    roaster: 'BKI',
    name: 'Guld Kaffe Hele Bønner',
    roastLevel: 'medium',
    originCountry: 'Højlands-Arabica',
    flavorNotes: ['Ristede Nødder', 'Karamel', 'Milde Bær'],
    suitableFor: ['all_rounder', 'americano'],
    barcode: '5708537000103',
    notes: 'Aromatisk og velkendt dansk blanding af 100% Arabica bønner.',
  },
  {
    roaster: 'BKI',
    name: 'Espresso Barista Hele Bønner',
    roastLevel: 'dark',
    originCountry: 'Brasilien & Vietnam',
    flavorNotes: ['Mørk Chokolade', 'Krydderier', 'Cremet & Fyldig Krop'],
    suitableFor: ['cappuccino', 'flat_white'],
    barcode: '5708537000202',
    notes: 'Mørkristet til tæt crema og fyldig karakter i mælkedrikke.',
  },

  // --- PROLOG COFFEE (København, Kødbyen) ---
  {
    roaster: 'Prolog Coffee',
    name: 'Kainamui Espresso (Kirinyaga, Kenya)',
    roastLevel: 'light',
    originCountry: 'Kenya',
    flavorNotes: ['Solbær', 'Citrus & Bergamot', 'Røde Bær'],
    process: 'washed',
    scaScore: 90,
    suitableFor: ['pure_espresso'],
    notes: 'Københavnsk specialty ikon med sprudlende saftighed og frugtsyre.',
  },

  // --- APRIL COFFEE (København) ---
  {
    roaster: 'April Coffee',
    name: 'Volcan Azul Espresso (Costa Rica)',
    roastLevel: 'light',
    originCountry: 'Costa Rica',
    flavorNotes: ['Fersken & Abrikos', 'Karamel', 'Jasmin & Blomster'],
    process: 'honey',
    scaScore: 91,
    suitableFor: ['pure_espresso', 'cortado'],
    notes: 'Ultra-præcis skandinavisk ristning fokuseret på florale nuancer.',
  },

  // --- TIM WENDELBOE (Oslo, Norge) ---
  {
    roaster: 'Tim Wendelboe',
    name: 'Caballero Espresso (Honduras)',
    roastLevel: 'light',
    originCountry: 'Honduras',
    flavorNotes: ['Mælkechokolade', 'Røde Bær', 'Karamel'],
    process: 'washed',
    scaScore: 92,
    suitableFor: ['pure_espresso'],
    notes: 'Verdenskendt for direkte handel og exceptionel sødme og balance.',
  },
];

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
    const fullText = `${item.roaster} ${item.name} ${item.originCountry} ${item.flavorNotes.join(' ')}`.toLowerCase();
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
 * Vivino-style "Did You Mean...?" fuzzy match detector for roaster or bean typos
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

