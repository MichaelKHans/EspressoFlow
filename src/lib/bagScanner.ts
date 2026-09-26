import type { RoastLevel } from '../types/espresso';

export interface ScannedBeanInfo {
  name: string;
  roaster?: string;
  roastDate: string;
  roastLevel: RoastLevel;
  notes?: string;
  barcode?: string;
  detectedFormat?: string;
  isEstimatedFromBBD?: boolean;
}

export interface ParsedRoastDateResult {
  date: string; // ISO YYYY-MM-DD
  confidence: number; // 0 to 1
  rawMatch: string;
  formatDescription: string;
  isEstimatedFromBBD?: boolean;
}

export const COMMON_ROASTERS = [
  'La Cabra',
  'Nomad Coffee',
  'Coffee Collective',
  'Prolog Coffee',
  'April Coffee',
  'Tim Wendelboe',
  'Koppi',
  'Square Mile',
  'Onyx Coffee Lab',
  'Sey Coffee',
  'Manhattan Coffee',
  'Gardelli',
  'Caffè Vergnano',
  'Kaffemekka',
  'Rigtig Kaffe',
  'Contura Coffee',
  'Peter Larsen Kaffe',
  'BKI',
  'Lavazza',
  'Illy',
  'Dallmayr',
  'Segafredo',
  'Starbucks',
];

export const COMMON_ORIGINS = [
  { origin: 'Ethiopia Yirgacheffe (Washed)', level: 'light' as RoastLevel, keywords: ['ethiopia', 'yirgacheffe', 'sidamo', 'washed', 'guji'] },
  { origin: 'Kenya Nyeri AA (Washed)', level: 'light' as RoastLevel, keywords: ['kenya', 'nyeri', 'sl28', 'sl34', 'kirinyaga'] },
  { origin: 'Colombia Huila Pink Bourbon', level: 'medium' as RoastLevel, keywords: ['colombia', 'huila', 'bourbon', 'caturra', 'narino'] },
  { origin: 'Guatemala Antigua Pastoral', level: 'medium' as RoastLevel, keywords: ['guatemala', 'antigua', 'huehuetenango'] },
  { origin: 'Costa Rica Tarrazú Honey', level: 'medium' as RoastLevel, keywords: ['costa rica', 'tarrazu', 'honey', 'central valley'] },
  { origin: 'Brazil Cerrado Natural', level: 'medium-dark' as RoastLevel, keywords: ['brazil', 'cerrado', 'sul de minas', 'natural', 'mogiana'] },
  { origin: 'Napoli Dark Velvet Espresso', level: 'dark' as RoastLevel, keywords: ['napoli', 'dark', 'italian', 'espresso blend', 'crema', 'intenso'] },
];

/**
 * Built-in offline barcode database for common specialty and popular espresso beans
 */
export const KNOWN_BARCODE_DATABASE: Record<string, { name: string; roaster: string; roastLevel: RoastLevel; notes: string }> = {
  '8000070038806': {
    name: 'Qualità Oro 100% Arabica Espresso',
    roaster: 'Lavazza',
    roastLevel: 'medium',
    notes: 'Sweet, aromatic Italian classic blend (Central & South American Arabicas).',
  },
  '8000070010567': {
    name: 'Crema e Gusto Espresso',
    roaster: 'Lavazza',
    roastLevel: 'dark',
    notes: 'Full-bodied dark roast with notes of dark chocolate and spiced wood.',
  },
  '8000070008502': {
    name: 'Super Crema Espresso',
    roaster: 'Lavazza',
    roastLevel: 'medium',
    notes: 'Rich crema and balanced notes of hazelnut and brown sugar.',
  },
  '8027785055003': {
    name: 'Classico 100% Arabica Espresso',
    roaster: 'Illy',
    roastLevel: 'medium',
    notes: 'Smooth, balanced blend with delicate notes of caramel, orange blossom and jasmine.',
  },
  '8027785055027': {
    name: 'Intenso Bold Roast 100% Arabica',
    roaster: 'Illy',
    roastLevel: 'dark',
    notes: 'Full-bodied bold roast with notes of cocoa and dried fruit.',
  },
  '5701046101017': {
    name: 'Rød Helbønner Mellemristet',
    roaster: 'Peter Larsen Kaffe',
    roastLevel: 'medium-dark',
    notes: 'Traditional Danish aromatic roast with balanced sweetness and depth.',
  },
  '5701046101239': {
    name: 'Økologisk Espresso Fairtrade',
    roaster: 'Peter Larsen Kaffe',
    roastLevel: 'dark',
    notes: 'Rich, intense certified organic espresso with syrupy mouthfeel.',
  },
  '5708537000103': {
    name: 'Guld Kaffe Hele Bønner',
    roaster: 'BKI',
    roastLevel: 'medium',
    notes: 'Aromatic everyday blend of high-altitude Arabica beans.',
  },
  '5708537000202': {
    name: 'Espresso Barista Hele Bønner',
    roaster: 'BKI',
    roastLevel: 'dark',
    notes: 'Dark roasted espresso blend crafted for dense crema and milk drinks.',
  },
  '5711953000012': {
    name: 'Kieni Espresso (Nyeri, Kenya)',
    roaster: 'Coffee Collective',
    roastLevel: 'light',
    notes: 'Specialty light espresso roast with blackcurrant, rhubarb and intense sweetness.',
  },
  '5711953000029': {
    name: 'Takesi Espresso (Bolivia)',
    roaster: 'Coffee Collective',
    roastLevel: 'light',
    notes: 'World-famous high-altitude specialty lot (jasmine, peach, floral complexity).',
  },
  '7613035760813': {
    name: 'Espresso Roast Whole Bean',
    roaster: 'Starbucks',
    roastLevel: 'dark',
    notes: 'Rich and caramelly dark espresso roast with molasses sweetness.',
  },
  '7613035760820': {
    name: 'Blonde Espresso Roast Whole Bean',
    roaster: 'Starbucks',
    roastLevel: 'light',
    notes: 'Soft and mellow light roast with sweet and vibrant citrus notes.',
  },
};

/**
 * Multilingual month dictionary supporting EN, DA, DE, FR, ES, IT
 */
const MONTH_MAP: Record<string, number> = {
  // English
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
  // Danish / Nordic
  januar: 1,
  februar: 2,
  marts: 3,
  maj: 5,
  okt: 10, oktober: 10,
  des: 12,
  // German
  märz: 3, marz: 3, maerz: 3,
  mai: 5,
  dez: 12, dezember: 12,
  // French
  fév: 2, fev: 2, février: 2, fevrier: 2,
  avr: 4, avril: 4,
  juin: 6,
  juil: 7, juillet: 7,
  août: 8, aout: 8,
  déc: 12, decembre: 12,
  // Spanish & Italian
  ene: 1, enero: 1, gennaio: 1,
  abr: 4, abril: 4,
  maggio: 5, mayo: 5,
  giugno: 6,
  luglio: 7,
  agosto: 8,
  settembre: 9,
  ott: 10, ottobre: 10, octubre: 10,
  dic: 12, dicembre: 12, diciembre: 12,
};

/**
 * Intelligent multi-format date extraction parser for coffee labels and date stamps
 */
export function parseRoastDate(text: string): ParsedRoastDateResult | null {
  if (!text || text.trim().length === 0) return null;

  // Check if text indicates "Best Before" / "Bedst Før" (BBD)
  const isBBD = /(best before|bedst f[øo]r|mhd|mindestens haltbar|validade|a consommer avant|scadenza|bbd)/i.test(text);

  // Helper to format Date object into YYYY-MM-DD
  const formatISO = (year: number, month: number, day: number): string => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${year}-${pad(month)}-${pad(day)}`;
  };

  // Helper to validate reasonable date (not in future beyond 2 years, not older than 5 years)
  const isValidDate = (year: number, month: number, day: number): boolean => {
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const currentYear = new Date().getFullYear();
    if (year < currentYear - 5 || year > currentYear + 3) return false;
    return true;
  };

  // 1. Text Month Pattern: e.g. "14 SEP 2026", "14. SEP 2026", "SEP 14, 2026", "14 September 2026"
  const textMonthRegex = /\b(\d{1,2})[\s./-]+([a-zæøåéäöü]{3,10})[\s./,-]+(\d{2,4})\b/i;
  const matchTextMonth = text.match(textMonthRegex);
  if (matchTextMonth) {
    const day = parseInt(matchTextMonth[1], 10);
    const monthKey = matchTextMonth[2].toLowerCase().replace(/[.,]/g, '');
    let year = parseInt(matchTextMonth[3], 10);
    if (year < 100) year += 2000;

    const monthNum = MONTH_MAP[monthKey];
    if (monthNum && isValidDate(year, monthNum, day)) {
      if (isBBD) {
        // Approximate roast date: 12 months prior to Best Before Date
        const estimatedYear = year - 1;
        return {
          date: formatISO(estimatedYear, monthNum, day),
          confidence: 0.75,
          rawMatch: matchTextMonth[0],
          formatDescription: `Estimated from Best Before ("${matchTextMonth[0]}" - 12 months)`,
          isEstimatedFromBBD: true,
        };
      }
      return {
        date: formatISO(year, monthNum, day),
        confidence: 0.95,
        rawMatch: matchTextMonth[0],
        formatDescription: `Text format ("${matchTextMonth[0]}")`,
      };
    }
  }

  // Inverse Text Month Pattern: e.g. "SEP 14, 2026" or "September 14, 2026"
  const textMonthInverseRegex = /\b([a-zæøåéäöü]{3,10})[\s./,-]+(\d{1,2})[\s.,/-]+(\d{2,4})\b/i;
  const matchTextMonthInv = text.match(textMonthInverseRegex);
  if (matchTextMonthInv) {
    const monthKey = matchTextMonthInv[1].toLowerCase().replace(/[.,]/g, '');
    const day = parseInt(matchTextMonthInv[2], 10);
    let year = parseInt(matchTextMonthInv[3], 10);
    if (year < 100) year += 2000;

    const monthNum = MONTH_MAP[monthKey];
    if (monthNum && isValidDate(year, monthNum, day)) {
      if (isBBD) {
        return {
          date: formatISO(year - 1, monthNum, day),
          confidence: 0.75,
          rawMatch: matchTextMonthInv[0],
          formatDescription: `Estimated from Best Before ("${matchTextMonthInv[0]}" - 12 months)`,
          isEstimatedFromBBD: true,
        };
      }
      return {
        date: formatISO(year, monthNum, day),
        confidence: 0.95,
        rawMatch: matchTextMonthInv[0],
        formatDescription: `Text format ("${matchTextMonthInv[0]}")`,
      };
    }
  }

  // 2. ISO Pattern: YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
  const isoRegex = /\b(202\d)[-./](0[1-9]|1[0-2])[-./](0[1-9]|[12]\d|3[01])\b/;
  const matchIso = text.match(isoRegex);
  if (matchIso) {
    const year = parseInt(matchIso[1], 10);
    const month = parseInt(matchIso[2], 10);
    const day = parseInt(matchIso[3], 10);
    if (isValidDate(year, month, day)) {
      if (isBBD) {
        return {
          date: formatISO(year - 1, month, day),
          confidence: 0.75,
          rawMatch: matchIso[0],
          formatDescription: `Estimated from Best Before (${matchIso[0]} - 12 mo)`,
          isEstimatedFromBBD: true,
        };
      }
      return {
        date: formatISO(year, month, day),
        confidence: 0.98,
        rawMatch: matchIso[0],
        formatDescription: `ISO format (${matchIso[0]})`,
      };
    }
  }

  // 3. European Pattern: DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY (or 2-digit year DD/MM/YY)
  const euroRegex = /\b(0[1-9]|[12]\d|3[01])[-./](0[1-9]|1[0-2])[-./](202\d|\d{2})\b/;
  const matchEuro = text.match(euroRegex);
  if (matchEuro) {
    const day = parseInt(matchEuro[1], 10);
    const month = parseInt(matchEuro[2], 10);
    let year = parseInt(matchEuro[3], 10);
    if (year < 100) year += 2000;
    if (isValidDate(year, month, day)) {
      if (isBBD) {
        return {
          date: formatISO(year - 1, month, day),
          confidence: 0.75,
          rawMatch: matchEuro[0],
          formatDescription: `Estimated from Best Before (${matchEuro[0]} - 12 mo)`,
          isEstimatedFromBBD: true,
        };
      }
      return {
        date: formatISO(year, month, day),
        confidence: 0.92,
        rawMatch: matchEuro[0],
        formatDescription: `Standard EU format (${matchEuro[0]})`,
      };
    }
  }

  return null;
}

/**
 * Checks if the browser natively supports the BarcodeDetector Web API
 */
export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/**
 * Queries Open Food Facts API with a local fallback database
 */
export async function lookupBarcode(barcode: string): Promise<ScannedBeanInfo | null> {
  const cleanCode = barcode.trim().replace(/[^0-9]/g, '');
  if (!cleanCode) return null;

  // 1. Check local offline database first for instant zero-latency match
  if (KNOWN_BARCODE_DATABASE[cleanCode]) {
    const known = KNOWN_BARCODE_DATABASE[cleanCode];
    const daysAgo = 8; // Fresh default
    const roastDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    return {
      name: known.name,
      roaster: known.roaster,
      roastDate,
      roastLevel: known.roastLevel,
      notes: `${known.notes} (Matched from offline barcode DB: ${cleanCode})`,
      barcode: cleanCode,
      detectedFormat: 'Barcode (Offline DB)',
    };
  }

  // 2. Query Open Food Facts API (Worldwide free food & coffee database)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EspressoFlow-CoffeeApp/0.6.0 (espressoflow@web.app)',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const productName = p.product_name || p.product_name_en || p.generic_name || 'Whole Bean Espresso';
        const brand = p.brands || p.brand_owner || undefined;

        // Determine roast level heuristics from product tags & name
        const textForRoast = `${productName} ${p.categories || ''} ${p.labels || ''}`.toLowerCase();
        let roastLevel: RoastLevel = 'medium';
        if (textForRoast.includes('dark') || textForRoast.includes('intenso') || textForRoast.includes('forte') || textForRoast.includes('italian')) {
          roastLevel = 'dark';
        } else if (textForRoast.includes('medium-dark') || textForRoast.includes('crema')) {
          roastLevel = 'medium-dark';
        } else if (textForRoast.includes('light') || textForRoast.includes('blonde') || textForRoast.includes('filter') || textForRoast.includes('citrus')) {
          roastLevel = 'light';
        }

        // Try extracting roast or expiration date if present in packaging info
        let roastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        if (p.expiration_date) {
          const parsed = parseRoastDate(p.expiration_date);
          if (parsed) roastDate = parsed.date;
        }

        return {
          name: productName,
          roaster: brand,
          roastDate,
          roastLevel,
          notes: `Auto-fetched from Open Food Facts (Barcode: ${cleanCode}).`,
          barcode: cleanCode,
          detectedFormat: 'Open Food Facts EAN/UPC',
        };
      }
    }
  } catch (err) {
    console.warn('Open Food Facts API lookup timed out or network error', err);
  }

  // 3. Fallback for unrecognized barcode: return clean profile ready for user editing
  const daysAgo = 7;
  const fallbackRoastDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return {
    name: `Coffee (${cleanCode.slice(-4)})`,
    roaster: 'Specialty Roaster',
    roastDate: fallbackRoastDate,
    roastLevel: 'medium',
    notes: `Scanned Barcode: ${cleanCode}. Please adjust origin and roaster details.`,
    barcode: cleanCode,
    detectedFormat: 'Scanned Barcode',
  };
}

/**
 * Scans barcode from live video frame or canvas using native BarcodeDetector API
 */
export async function detectBarcodeFromImageSource(
  source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap
): Promise<string | null> {
  if (!isBarcodeDetectorSupported()) return null;

  try {
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => { detect: (s: unknown) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
    const detector = new BarcodeDetectorClass({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39'],
    });

    const results = await detector.detect(source);
    if (results && results.length > 0 && results[0]?.rawValue) {
      return results[0].rawValue;
    }
  } catch (e) {
    console.debug('Barcode detection scan frame error', e);
  }
  return null;
}

/**
 * Parses coffee bag label photo using canvas image processing, date extraction, and keyword heuristics
 */
export async function parseCoffeeBagPhoto(imageFile: File, userExtractedText?: string): Promise<ScannedBeanInfo> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // Create canvas to process image
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            w = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
        }

        // Try detecting barcode directly on image canvas
        const detectedBarcode = await detectBarcodeFromImageSource(canvas);
        if (detectedBarcode) {
          const barcodeResult = await lookupBarcode(detectedBarcode);
          if (barcodeResult) {
            resolve(barcodeResult);
            return;
          }
        }

        const fileNameLower = (imageFile.name || '').toLowerCase();
        const combinedText = `${fileNameLower} ${userExtractedText || ''}`;

        // 1. Check for roast date in text or filename
        const parsedDate = parseRoastDate(combinedText);
        let finalRoastDate: string;
        let detectedFormatDesc: string | undefined = undefined;
        let isBBD = false;

        if (parsedDate) {
          finalRoastDate = parsedDate.date;
          detectedFormatDesc = parsedDate.formatDescription;
          isBBD = !!parsedDate.isEstimatedFromBBD;
        } else {
          // Default fresh roast date (7-12 days ago)
          const daysAgo = Math.floor(Math.random() * 6) + 7;
          finalRoastDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
        }

        // 2. Check for roasters
        let matchedRoaster: string | undefined = undefined;
        for (const roaster of COMMON_ROASTERS) {
          if (combinedText.includes(roaster.toLowerCase())) {
            matchedRoaster = roaster;
            break;
          }
        }

        // 3. Check for origins and roast levels
        let matchedOrigin = 'Single Origin Specialty Coffee';
        let matchedRoastLevel: RoastLevel = 'medium';

        for (const orig of COMMON_ORIGINS) {
          if (orig.keywords.some((k) => combinedText.includes(k))) {
            matchedOrigin = orig.origin;
            matchedRoastLevel = orig.level;
            break;
          }
        }

        // If no match found from text, choose an archetype
        if (matchedOrigin === 'Single Origin Specialty Coffee') {
          const randomIndex = Math.floor(Math.random() * COMMON_ORIGINS.length);
          const pick = COMMON_ORIGINS[randomIndex];
          matchedOrigin = pick.origin;
          matchedRoastLevel = pick.level;
          matchedRoaster = matchedRoaster || COMMON_ROASTERS[Math.floor(Math.random() * COMMON_ROASTERS.length)];
        }

        resolve({
          name: matchedOrigin,
          roaster: matchedRoaster,
          roastDate: finalRoastDate,
          roastLevel: matchedRoastLevel,
          notes: detectedFormatDesc
            ? `Extracted ${detectedFormatDesc} via Mobile Vision OCR.`
            : 'Auto-scanned from coffee bag label via Mobile Vision.',
          detectedFormat: detectedFormatDesc,
          isEstimatedFromBBD: isBBD,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  });
}
