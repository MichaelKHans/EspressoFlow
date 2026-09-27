import type { RoastLevel } from '../types/espresso';

export interface ScannedBeanInfo {
  name: string;
  roaster?: string;
  roastDate: string; // ISO YYYY-MM-DD or empty string '' if not yet scanned
  hasExplicitRoastDate?: boolean;
  roastLevel: RoastLevel;
  notes?: string;
  barcode?: string;
  detectedFormat?: string;
  isEstimatedFromBBD?: boolean;
  bestBeforeDate?: string;
}

export interface ParsedRoastDateResult {
  date: string; // ISO YYYY-MM-DD
  confidence: number; // 0 to 1
  rawMatch: string;
  formatDescription: string;
  isEstimatedFromBBD?: boolean;
}

export interface BagDateAndRoastExtraction {
  roastDate: string | null; // ISO YYYY-MM-DD
  bestBeforeDate: string | null; // ISO YYYY-MM-DD
  isEstimatedFromBBD: boolean;
  detectedRoastLevel: RoastLevel | null;
  confidence: number;
  formatDescription: string | null;
  rawMatchedSnippet?: string;
  rawText: string;
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
 * Extracts roast level profile from packaging text or keywords
 */
export function extractRoastLevelFromText(text: string): RoastLevel | null {
  if (!text) return null;
  const t = text.toLowerCase();

  // Dark Roast patterns (Specialty, Italian & Commercial)
  if (
    /\b(dark|dark\s*roast|m[øo]rk|m[øo]rkristet|intenso|espresso\s*roast|french\s*roast|italian\s*roast|intensity\s*(?:10|11|12)|intensitet\s*(?:10|11|12)|tueste\s*intenso|ciemno\s*palona|tmav[eě]\s*pražen[aá])\b/i.test(t)
  ) {
    return 'dark';
  }

  // Medium-Dark patterns
  if (
    /\b(medium[- ]dark|mellem[- ]m[øo]rk|crema|intensity\s*[7-9]|intensitet\s*[7-9])\b/i.test(t)
  ) {
    return 'medium-dark';
  }

  // Light / Blonde patterns
  if (
    /\b(blonde|blonde\s*roast|light|light\s*roast|lysristet|lys|filter|nordic|intensity\s*[1-6]|intensitet\s*[1-6])\b/i.test(t)
  ) {
    return 'light';
  }

  // Medium patterns
  if (
    /\b(medium|medium\s*roast|mellemristet|mellem|středně\s*pražen[aá]|średnio\s*palona)\b/i.test(t)
  ) {
    return 'medium';
  }

  return null;
}

/**
 * Robust multi-lingual date & roast level extraction engine from coffee bag text/stamps
 */
export function extractDatesAndRoastFromBagText(text: string): BagDateAndRoastExtraction {
  if (!text || text.trim().length === 0) {
    return {
      roastDate: null,
      bestBeforeDate: null,
      isEstimatedFromBBD: false,
      detectedRoastLevel: null,
      confidence: 0,
      formatDescription: null,
      rawText: text || '',
    };
  }

  const formatISO = (year: number, month: number, day: number): string => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${year}-${pad(month)}-${pad(day)}`;
  };

  const isValidDate = (year: number, month: number, day: number): boolean => {
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const currentYear = new Date().getFullYear();
    if (year < currentYear - 5 || year > currentYear + 3) return false;
    return true;
  };

  const parseDateCandidate = (raw: string): { iso: string; year: number; month: number; day: number } | null => {
    // 1. European: DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
    const euro = raw.match(/\b(0?[1-9]|[12]\d|3[01])[-./](0?[1-9]|1[0-2])[-./](202\d|\d{2})\b/);
    if (euro) {
      const day = parseInt(euro[1], 10);
      const month = parseInt(euro[2], 10);
      let year = parseInt(euro[3], 10);
      if (year < 100) year += 2000;
      if (isValidDate(year, month, day)) {
        return { iso: formatISO(year, month, day), year, month, day };
      }
    }

    // 2. ISO: YYYY-MM-DD or YYYY.MM.DD
    const iso = raw.match(/\b(202\d)[-./](0?[1-9]|1[0-2])[-./](0?[1-9]|[12]\d|3[01])\b/);
    if (iso) {
      const year = parseInt(iso[1], 10);
      const month = parseInt(iso[2], 10);
      const day = parseInt(iso[3], 10);
      if (isValidDate(year, month, day)) {
        return { iso: formatISO(year, month, day), year, month, day };
      }
    }

    // 3. Text Month: e.g. "14 SEP 2026", "14. maj 2026"
    const textMonth = raw.match(/\b(0?[1-9]|[12]\d|3[01])[\s./-]+([a-zæøåéäöü]{3,10})[\s./,-]+(202\d|\d{2})\b/i);
    if (textMonth) {
      const day = parseInt(textMonth[1], 10);
      const mKey = textMonth[2].toLowerCase().replace(/[.,]/g, '');
      let year = parseInt(textMonth[3], 10);
      if (year < 100) year += 2000;
      const month = MONTH_MAP[mKey];
      if (month && isValidDate(year, month, day)) {
        return { iso: formatISO(year, month, day), year, month, day };
      }
    }

    return null;
  };

  // 1. Check for labeled Production / Roast Date (HIGHEST PRIORITY)
  const prodRegex = /(?:production\s*date|production|prod\.?\s*date|datum\s*v[yý]roby|data\s*produkcji|fecha\s*de\s*fabricaci[oó]n|produktionsdatum|produktionsdato|fremstillingsdato|roasted\s*on|roast\s*date|ristedato|ristet|herstelldatum|data\s*di\s*produzione|date\s*de\s*production)[\s:\-\/.]*([0-9]{1,2}[-.\/][0-9]{1,2}[-.\/][0-9]{2,4}|[0-9]{4}[-.\/][0-9]{1,2}[-.\/][0-9]{1,2}|[0-9]{1,2}\s+[a-zæøåéäöü]{3,10}\s+[0-9]{2,4})/i;
  const prodMatch = text.match(prodRegex);
  let confirmedRoastDate: string | null = null;
  let prodSnippet: string | undefined = undefined;

  if (prodMatch && prodMatch[1]) {
    const candidate = parseDateCandidate(prodMatch[1]);
    if (candidate) {
      confirmedRoastDate = candidate.iso;
      prodSnippet = prodMatch[0];
    }
  }

  // 2. Check for labeled Best Before Date (BBD)
  const bbdRegex = /(?:best\s*before|best\s*by|bedst\s*f[øo]r|b[aä]st\s*f[oö]re|parasta\s*ennen|mindestens\s*haltbar|mhd|najlepiej\s*spo[zż]y[cć]\s*przed|minim[aá]ln[ií]\s*trvanlivost\s*do|consumir\s*preferentemente\s*antes\s*del|a\s*consommer\s*(?:de\s*pr[eé]f[eé]rence\s*)?avant|da\s*consumarsi\s*preferibilmente\s*entro|valability|validade)[\s:\-\/.]*([0-9]{1,2}[-.\/][0-9]{1,2}[-.\/][0-9]{2,4}|[0-9]{4}[-.\/][0-9]{1,2}[-.\/][0-9]{1,2}|[0-9]{1,2}\s+[a-zæøåéäöü]{3,10}\s+[0-9]{2,4})/i;
  const bbdMatch = text.match(bbdRegex);
  let confirmedBBD: string | null = null;
  let estimatedFromBBD = false;

  if (bbdMatch && bbdMatch[1]) {
    const candidate = parseDateCandidate(bbdMatch[1]);
    if (candidate) {
      confirmedBBD = candidate.iso;
      // If no explicit production date exists, approximate roast date: 12 months prior
      if (!confirmedRoastDate) {
        const estYear = candidate.year - 1;
        confirmedRoastDate = formatISO(estYear, candidate.month, candidate.day);
        estimatedFromBBD = true;
      }
    }
  }

  // 3. Fallback: Standalone date if no labeled date was detected
  if (!confirmedRoastDate) {
    const standaloneCandidate = parseDateCandidate(text);
    if (standaloneCandidate) {
      confirmedRoastDate = standaloneCandidate.iso;
    }
  }

  const detectedRoastLevel = extractRoastLevelFromText(text);

  let formatDesc: string | null = null;
  if (confirmedRoastDate) {
    if (estimatedFromBBD && confirmedBBD) {
      formatDesc = `Estimated from Best Before (${confirmedBBD} - 12 mo)`;
    } else if (prodSnippet) {
      formatDesc = `Production Date (${confirmedRoastDate})`;
    } else {
      formatDesc = `Roast Date Stamp (${confirmedRoastDate})`;
    }
  }

  return {
    roastDate: confirmedRoastDate,
    bestBeforeDate: confirmedBBD,
    isEstimatedFromBBD: estimatedFromBBD,
    detectedRoastLevel,
    confidence: confirmedRoastDate ? (estimatedFromBBD ? 0.8 : 0.98) : 0,
    formatDescription: formatDesc,
    rawMatchedSnippet: prodSnippet || bbdMatch?.[0],
    rawText: text,
  };
}

/**
 * Intelligent multi-format date extraction parser for coffee labels and date stamps (Backwards compatible)
 */
export function parseRoastDate(text: string): ParsedRoastDateResult | null {
  const result = extractDatesAndRoastFromBagText(text);
  if (!result.roastDate) return null;

  return {
    date: result.roastDate,
    confidence: result.confidence,
    rawMatch: result.rawMatchedSnippet || result.roastDate,
    formatDescription: result.formatDescription || 'Detected Date',
    isEstimatedFromBBD: result.isEstimatedFromBBD,
  };
}

/**
 * Checks if the browser natively supports the BarcodeDetector Web API
 */
export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/**
 * Queries Open Food Facts API with a local fallback database
 * NEVER invents or fakes a roast date -- retail barcodes only identify product SKU!
 */
export async function lookupBarcode(barcode: string): Promise<ScannedBeanInfo | null> {
  const cleanCode = barcode.trim().replace(/[^0-9]/g, '');
  if (!cleanCode) return null;

  // 1. Check local offline database first for instant zero-latency match
  if (KNOWN_BARCODE_DATABASE[cleanCode]) {
    const known = KNOWN_BARCODE_DATABASE[cleanCode];
    return {
      name: known.name,
      roaster: known.roaster,
      roastDate: '', // DO NOT FAKE ROAST DATE! Barcode lacks batch date
      hasExplicitRoastDate: false,
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
        let productName = p.product_name || p.product_name_en || p.generic_name || 'Whole Bean Espresso';
        // Correct common Open Food Facts user typo ("Whole Bear" -> "Whole Bean")
        productName = productName.replace(/whole\s+bear/i, 'Whole Bean');

        const brand = p.brands || p.brand_owner || undefined;

        // Determine roast level heuristics from product tags & name
        const textForRoast = `${productName} ${brand || ''} ${p.categories || ''} ${p.labels || ''} ${p.generic_name || ''}`.toLowerCase();
        let roastLevel: RoastLevel = 'medium';
        if (
          textForRoast.includes('dark') ||
          textForRoast.includes('espresso roast') ||
          textForRoast.includes('intenso') ||
          textForRoast.includes('forte') ||
          textForRoast.includes('italian') ||
          textForRoast.includes('french roast') ||
          textForRoast.includes('intensity 1') ||
          textForRoast.includes('intensitet 1')
        ) {
          roastLevel = 'dark';
        } else if (textForRoast.includes('medium-dark') || textForRoast.includes('crema') || textForRoast.includes('mellem-mørk')) {
          roastLevel = 'medium-dark';
        } else if (textForRoast.includes('light') || textForRoast.includes('blonde') || textForRoast.includes('filter') || textForRoast.includes('lysristet')) {
          roastLevel = 'light';
        }

        // Try extracting expiration date if present in API packaging metadata
        let roastDate = '';
        let hasExplicitDate = false;
        let isBBD = false;

        if (p.expiration_date) {
          const parsed = parseRoastDate(p.expiration_date);
          if (parsed) {
            roastDate = parsed.date;
            hasExplicitDate = true;
            isBBD = !!parsed.isEstimatedFromBBD;
          }
        }

        return {
          name: productName,
          roaster: brand,
          roastDate, // Empty by default when barcode doesn't have batch stamp
          hasExplicitRoastDate: hasExplicitDate,
          roastLevel,
          notes: `Auto-fetched from Open Food Facts (Barcode: ${cleanCode}).`,
          barcode: cleanCode,
          detectedFormat: 'Open Food Facts EAN/UPC',
          isEstimatedFromBBD: isBBD,
        };
      }
    }
  } catch (err) {
    console.warn('Open Food Facts API lookup timed out or network error', err);
  }

  // 3. Fallback for unrecognized barcode: return clean profile ready for user editing (never fake date)
  return {
    name: `Coffee (${cleanCode.slice(-4)})`,
    roaster: 'Specialty Roaster',
    roastDate: '',
    hasExplicitRoastDate: false,
    roastLevel: 'medium',
    notes: `Scanned Barcode: ${cleanCode}. Please scan roast date stamp or enter details.`,
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
 * Parses coffee bag label photo using image OCR, date extraction, and packaging heuristics
 */
export async function parseCoffeeBagPhoto(imageFile: File, userExtractedText?: string): Promise<ScannedBeanInfo> {
  // 1. Try detecting barcode first
  try {
    const imgBitmap = await createImageBitmap(imageFile);
    const detectedBarcode = await detectBarcodeFromImageSource(imgBitmap);
    if (detectedBarcode) {
      const barcodeResult = await lookupBarcode(detectedBarcode);
      if (barcodeResult) {
        return barcodeResult;
      }
    }
  } catch (e) {
    console.debug('Bitmap barcode detection error', e);
  }

  // 2. Perform OCR on the bag image using Tesseract.js / native TextDetector
  let ocrExtraction: BagDateAndRoastExtraction = {
    roastDate: null,
    bestBeforeDate: null,
    isEstimatedFromBBD: false,
    detectedRoastLevel: null,
    confidence: 0,
    formatDescription: null,
    rawText: userExtractedText || '',
  };

  try {
    const { scanCoffeeBagForDateAndRoast } = await import('./bagOcr');
    ocrExtraction = await scanCoffeeBagForDateAndRoast(imageFile);
  } catch (ocrErr) {
    console.warn('OCR processing error on bag photo', ocrErr);
  }

  const combinedText = `${(imageFile.name || '').toLowerCase()} ${ocrExtraction.rawText || ''} ${userExtractedText || ''}`;

  // 3. Match roaster
  let matchedRoaster: string | undefined = undefined;
  for (const roaster of COMMON_ROASTERS) {
    if (combinedText.includes(roaster.toLowerCase())) {
      matchedRoaster = roaster;
      break;
    }
  }

  // 4. Match origin and roast level
  let matchedOrigin = 'Single Origin Specialty Coffee';
  let matchedRoastLevel: RoastLevel = ocrExtraction.detectedRoastLevel || 'medium';

  for (const orig of COMMON_ORIGINS) {
    if (orig.keywords.some((k) => combinedText.includes(k))) {
      matchedOrigin = orig.origin;
      if (!ocrExtraction.detectedRoastLevel) {
        matchedRoastLevel = orig.level;
      }
      break;
    }
  }

  return {
    name: matchedOrigin,
    roaster: matchedRoaster,
    roastDate: ocrExtraction.roastDate || '',
    hasExplicitRoastDate: !!ocrExtraction.roastDate,
    roastLevel: matchedRoastLevel,
    notes: ocrExtraction.formatDescription
      ? `Extracted ${ocrExtraction.formatDescription} via Mobile Vision OCR.`
      : 'Scanned from coffee bag label via Mobile Vision.',
    detectedFormat: ocrExtraction.formatDescription || 'Optical Vision Scan',
    isEstimatedFromBBD: ocrExtraction.isEstimatedFromBBD,
    bestBeforeDate: ocrExtraction.bestBeforeDate || undefined,
  };
}
