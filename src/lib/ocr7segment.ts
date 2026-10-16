/**
 * 7-Segment OCR Computer Vision Engine for Digital Coffee Scales
 * Lightweight, zero-dependency, ultra-fast canvas processing (< 3ms latency)
 */

export interface SegmentProbeResult {
  a: boolean; // Top
  b: boolean; // Top-Right
  c: boolean; // Bottom-Right
  d: boolean; // Bottom
  e: boolean; // Bottom-Left
  f: boolean; // Top-Left
  g: boolean; // Center
}

export interface DigitDetection {
  char: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
  segments: SegmentProbeResult;
}

export interface CandidateInfo {
  weight: number | null;
  rawText: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  hasDecimal: boolean;
  hasColon: boolean;
  score: number;
}

export interface OCRResult {
  weight: number | null;
  rawText: string;
  confidence: number;
  digits: DigitDetection[];
  thresholdUsed: number;
  isStableZero: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
  detectedPolarity?: 'led' | 'lcd';
  autoPolarityUsed?: 'led' | 'lcd';
  layoutType?: 'single' | 'stacked' | 'side-by-side';
  allCandidates?: CandidateInfo[];
}

// 7-segment bit patterns for digits 0-9 and '-'
// Segments: [a, b, c, d, e, f, g]
// Multiple variants accommodate manufacturer font differences (e.g. 6 with/without top bar, 7 with segment f)
const PATTERN_VARIANTS: Record<string, number[][]> = {
  '0': [
    [1, 1, 1, 1, 1, 1, 0], // standard 0
    [1, 1, 1, 1, 1, 0, 0], // faint f
    [1, 1, 1, 1, 0, 1, 0], // faint e
    [0, 1, 1, 1, 1, 1, 0], // faint a
    [1, 1, 1, 0, 1, 1, 0], // faint d
  ],
  '1': [
    [0, 1, 1, 0, 0, 0, 0], // standard right side
    [0, 0, 0, 0, 1, 1, 0], // rare left side
    [0, 1, 1, 0, 0, 0, 1], // faint g center bleed
  ],
  '2': [
    [1, 1, 0, 1, 1, 0, 1], // standard 2
    [1, 1, 0, 1, 1, 0, 0], // 2 with faint g
  ],
  '3': [
    [1, 1, 1, 1, 0, 0, 1], // standard 3
    [1, 1, 1, 1, 0, 0, 0], // 3 with faint g
  ],
  '4': [
    [0, 1, 1, 0, 0, 1, 1], // standard 4
    [0, 1, 1, 0, 0, 0, 1], // 4 with faint f
    [1, 1, 1, 0, 0, 1, 1], // closed top 4
  ],
  '5': [[1, 0, 1, 1, 0, 1, 1]],
  '6': [
    [1, 0, 1, 1, 1, 1, 1], // standard 6 (with top bar)
    [0, 0, 1, 1, 1, 1, 1], // 6 without top bar
  ],
  '7': [
    [1, 1, 1, 0, 0, 0, 0], // standard 7
    [1, 1, 1, 0, 0, 1, 0], // 7 with segment f
  ],
  '8': [[1, 1, 1, 1, 1, 1, 1]],
  '9': [
    [1, 1, 1, 1, 0, 1, 1], // standard 9 (with bottom bar)
    [1, 1, 1, 0, 0, 1, 1], // 9 without bottom bar
  ],
  '-': [[0, 0, 0, 0, 0, 0, 1]],
};

// ── Zero-GC Static Memory Pool for 30 FPS Canvas Processing ──
export class OCRScratchPool {
  public width = 0;
  public height = 0;
  public gray!: Uint8Array;
  public binary!: Uint8Array;
  public binaryBackup!: Uint8Array;
  public integral!: Int32Array;
  public histogram = new Uint32Array(256);
  public rowCounts!: Int32Array;
  public smoothedRows!: Float32Array;
  public colCounts!: Int32Array;
  public scratchCols!: Int32Array;
  public morphScratchRow!: Uint8Array;

  public ensureCapacity(w: number, h: number): void {
    if (this.width === w && this.height === h) return;
    this.width = w;
    this.height = h;
    const numPixels = w * h;
    this.gray = new Uint8Array(numPixels);
    this.binary = new Uint8Array(numPixels);
    this.binaryBackup = new Uint8Array(numPixels);
    this.integral = new Int32Array((w + 1) * (h + 1));
    this.rowCounts = new Int32Array(h);
    this.smoothedRows = new Float32Array(h);
    this.colCounts = new Int32Array(w);
    this.scratchCols = new Int32Array(w);
    this.morphScratchRow = new Uint8Array(w);
  }
}

export const ocrPool = new OCRScratchPool();

// Precomputed 7-bit population count lookup table (0..127) for O(1) Hamming distance
const POPCNT_7BIT = new Uint8Array(128);
for (let i = 0; i < 128; i++) {
  let c = 0;
  let n = i;
  while (n > 0) {
    n &= n - 1;
    c++;
  }
  POPCNT_7BIT[i] = c;
}

// Flattened, zero-allocation 7-segment bitmask table: (a<<6)|(b<<5)|(c<<4)|(d<<3)|(e<<2)|(f<<1)|g
interface CompiledPattern {
  char: string;
  mask: number;
}

const COMPILED_PATTERNS: readonly CompiledPattern[] = Object.entries(PATTERN_VARIANTS).flatMap(
  ([char, variants]) =>
    variants.map((p) => ({
      char,
      mask:
        (p[0] << 6) |
        (p[1] << 5) |
        (p[2] << 4) |
        (p[3] << 3) |
        (p[4] << 2) |
        (p[5] << 1) |
        p[6],
    }))
);

/**
 * Calculates optimal binarization threshold using Otsu's method.
 * Uses pooled 256-element histogram to avoid array allocation per frame.
 */
export function calculateOtsuThreshold(grayPixels: Uint8Array, histBuffer?: Uint32Array): number {
  const histogram = histBuffer || ocrPool.histogram;
  histogram.fill(0);
  const total = grayPixels.length;
  for (let i = 0; i < total; i++) {
    histogram[grayPixels[i]]++;
  }

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * histogram[t];

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let bestThreshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const betweenVariance = wB * wF * (mB - mF) * (mB - mF);

    if (betweenVariance > maxVariance) {
      maxVariance = betweenVariance;
      bestThreshold = t;
    }
  }

  return bestThreshold;
}

/**
 * Computes a 2D Integral Image (summed-area table) for O(1) constant-time local window filtering.
 * Reuses pooled Int32Array to eliminate zero-page faults and GC pauses.
 */
export function computeIntegralImage(
  gray: Uint8Array,
  width: number,
  height: number,
  outIntegral?: Int32Array
): Int32Array {
  if (!outIntegral) {
    ocrPool.ensureCapacity(width, height);
  }
  const S = outIntegral || ocrPool.integral;
  const sWidth = width + 1;

  for (let x = 0; x <= width; x++) S[x] = 0;
  for (let y = 0; y <= height; y++) S[y * sWidth] = 0;

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const grayRowOffset = y * width;
    const sPrevRowOffset = y * sWidth;
    const sCurrRowOffset = (y + 1) * sWidth;

    for (let x = 0; x < width; x++) {
      rowSum += gray[grayRowOffset + x];
      S[sCurrRowOffset + (x + 1)] = S[sPrevRowOffset + (x + 1)] + rowSum;
    }
  }

  return S;
}

/**
 * High-speed 1D Horizontal Morphological Opening (3x1 structuring element).
 * Breaks 1-2px horizontal specular bloom bridges between digits without
 * thinning horizontal bars (a, g, d) or vertical strokes >= 3px wide.
 */
export function morphologicalOpenHorizontal(
  binary: Uint8Array,
  scratchRow: Uint8Array,
  width: number,
  marginX: number,
  marginY: number,
  height: number
): void {
  const xStart = marginX + 1;
  const xEnd = width - marginX - 2;
  const yEnd = height - marginY;

  for (let y = marginY; y < yEnd; y++) {
    const rowOffset = y * width;
    // Pass 1: 3-pixel Horizontal Erosion into scratchRow
    scratchRow[marginX] = 0;
    scratchRow[width - marginX - 1] = 0;
    for (let x = xStart; x <= xEnd; x++) {
      const idx = rowOffset + x;
      scratchRow[x] = binary[idx - 1] & binary[idx] & binary[idx + 1];
    }
    // Pass 2: 3-pixel Horizontal Dilation back into binary
    for (let x = xStart; x <= xEnd; x++) {
      binary[rowOffset + x] = scratchRow[x - 1] | scratchRow[x] | scratchRow[x + 1];
    }
  }
}

/**
 * Converts ImageData to a high-contrast binary map with Bradley-Roth adaptive thresholding.
 * Suppresses specular spotlight glare, handles deep shadows, and automatically distinguishes LED from LCD displays.
 * Reuses zero-GC static buffers from OCRScratchPool.
 */
export function binarizeROI(
  imageData: ImageData,
  isDarkDigitsOnLight: boolean = false,
  useAdaptiveThreshold: boolean = true
): { binary: Uint8Array; width: number; height: number; threshold: number; detectedPolarity: 'led' | 'lcd' } {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  ocrPool.ensureCapacity(width, height);
  const gray = ocrPool.gray;
  const binary = ocrPool.binary;

  let sumLuminance = 0;
  for (let i = 0; i < numPixels; i++) {
    const idx = i << 2;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Rec.601 standard luminance: Y = 0.299R + 0.587G + 0.114B
    const lum = (r * 77 + g * 150 + b * 29) >> 8;
    sumLuminance += lum;

    if (isDarkDigitsOnLight) {
      gray[i] = lum;
    } else {
      // LED Mode: Coffee scales use vibrant Blue, Cyan, White or Red LEDs.
      // Boost chromatic LED pixels while avoiding boosting flat white spotlight glare
      const maxC = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const minC = r < g ? (r < b ? r : b) : (g < b ? g : b);
      const chroma = maxC - minC;
      const boosted = maxC + (chroma >> 1);
      gray[i] = boosted > 255 ? 255 : boosted;
    }
  }

  const avgLuminance = sumLuminance / numPixels;
  const detectedPolarity: 'led' | 'lcd' = avgLuminance < 115 ? 'led' : 'lcd';
  const otsuThreshold = calculateOtsuThreshold(gray);

  if (!useAdaptiveThreshold) {
    const threshold = isDarkDigitsOnLight
      ? Math.min(180, otsuThreshold)
      : Math.max(60, otsuThreshold);
    for (let i = 0; i < numPixels; i++) {
      binary[i] = isDarkDigitsOnLight
        ? (gray[i] < threshold ? 1 : 0)
        : (gray[i] > threshold ? 1 : 0);
    }
    return { binary, width, height, threshold, detectedPolarity };
  }

  // 2D Integral Image for Bradley-Roth Adaptive Thresholding
  const S = computeIntegralImage(gray, width, height);
  const sWidth = width + 1;
  const windowRadius = Math.max(8, Math.floor(width / 14)); // adaptive window ~22px

  // Integer-only Bradley-Roth + Local Contrast Gate (Zero float divisions!)
  const minContrastDelta = 10;
  const ledFloor = Math.max(28, Math.min(85, (otsuThreshold * 70) >> 7)); // Capped at 85 so spotlight reflection doesn't poison threshold
  const lcdCeiling = Math.min(210, (otsuThreshold * 147) >> 7);

  const marginX = Math.max(3, Math.floor(width * 0.04));
  const marginY = Math.max(3, Math.floor(height * 0.04));

  for (let y = marginY; y < height - marginY; y++) {
    const y1 = y - windowRadius < 0 ? 0 : y - windowRadius;
    const y2 = y + windowRadius >= height ? height - 1 : y + windowRadius;
    const dyCount = y2 - y1 + 1;
    const sRow1 = y1 * sWidth;
    const sRow2 = (y2 + 1) * sWidth;
    const rowOffset = y * width;

    for (let x = marginX; x < width - marginX; x++) {
      const x1 = x - windowRadius < 0 ? 0 : x - windowRadius;
      const x2 = x + windowRadius >= width ? width - 1 : x + windowRadius;
      const count = (x2 - x1 + 1) * dyCount;
      const sum = S[sRow2 + x2 + 1] - S[sRow1 + x2 + 1] - S[sRow2 + x1] + S[sRow1 + x1];
      const pixelVal = gray[rowOffset + x];
      const scaledPixel = pixelVal * count;

      if (isDarkDigitsOnLight) {
        // LCD: active if locally darker than background with minimum contrast delta
        const isLocallyDark = (scaledPixel << 7) <= sum * 109 && (sum - scaledPixel) >= minContrastDelta * count;
        binary[rowOffset + x] = isLocallyDark && pixelVal < lcdCeiling ? 1 : 0;
      } else {
        // LED: active if locally brighter than background with minimum contrast delta
        const isLocallyBright = (scaledPixel << 7) >= sum * 143 && (scaledPixel - sum) >= minContrastDelta * count;
        binary[rowOffset + x] = isLocallyBright && pixelVal >= ledFloor ? 1 : 0;
      }
    }
  }

  // Outer margin mask (4% on each side) to reject metallic bevels, scale casing, and rim flare
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    if (y < marginY || y >= height - marginY) {
      for (let x = 0; x < width; x++) binary[rowOffset + x] = 0;
    } else {
      for (let x = 0; x < marginX; x++) binary[rowOffset + x] = 0;
      for (let x = width - marginX; x < width; x++) binary[rowOffset + x] = 0;
    }
  }

  // 1D Horizontal Morphological Opening: Breaks 1-2px glare bloom bridges between digits
  if (height >= 40) {
    morphologicalOpenHorizontal(binary, ocrPool.morphScratchRow, width, marginX, marginY, height);
  }

  return { binary, width, height, threshold: otsuThreshold, detectedPolarity };
}

/**
 * Samples a specific relative coordinate within a digit bounding box
 * Incorporates 7-segment italic slant compensation and adaptive kernel size
 */
function sampleSegment(
  binary: Uint8Array,
  canvasW: number,
  box: { x: number; y: number; width: number; height: number },
  relX: number,
  relY: number,
  orientation: 'h' | 'v' | 'c' | 'g' = 'c',
  overrideThreshold?: number,
  slantTan: number = 0.08
): boolean {
  // Dynamic italic slant compensation for typical 7-segment digital coffee displays
  const slantOffset = (0.5 - relY) * slantTan;
  const effectiveRelX = Math.max(0.05, Math.min(0.95, relX + slantOffset));

  const centerX = Math.floor(box.x + box.width * effectiveRelX);
  const centerY = Math.floor(box.y + box.height * relY);

  const radiusX = orientation === 'h' ? Math.max(2, Math.floor(box.width * 0.16))
    : orientation === 'g' ? Math.max(1, Math.floor(box.width * 0.10))
    : Math.max(1, Math.floor(box.width * 0.08));
  const radiusY = orientation === 'v' ? Math.max(2, Math.floor(box.height * 0.10))
    : orientation === 'g' ? Math.max(1, Math.floor(box.height * 0.06))
    : Math.max(1, Math.floor(box.height * 0.08));

  let activeCount = 0;
  let totalCount = 0;

  for (let dy = -radiusY; dy <= radiusY; dy++) {
    for (let dx = -radiusX; dx <= radiusX; dx++) {
      const px = centerX + dx;
      const py = centerY + dy;
      if (px >= 0 && px < canvasW && py >= 0) {
        totalCount++;
        if (binary[py * canvasW + px] === 1) {
          activeCount++;
        }
      }
    }
  }

  // Orientation-aware thresholds:
  // - vertical segments (b,c,e,f) require 0.27
  // - center horizontal bar 'g' requires 0.32 to ensure it is a real center bar, not bleed from '0'
  // - cavity holes ('c') require 0.60 (solid glare detection), preventing sensor noise from killing '0','8','6','9'
  // - outer horizontal bars (a,d) require 0.20
  // CRITICAL: Must satisfy BOTH minimum count AND minimum fill ratio so stray noise pixels never bypass threshold!
  const threshold = overrideThreshold ?? (
    orientation === 'c' ? 0.60 :
    orientation === 'v' ? 0.27 :
    orientation === 'g' ? 0.32 :
    0.20
  );
  const minActive = Math.min(
    orientation === 'c' ? 6 :
    (orientation === 'v' || orientation === 'g' ? 4 : 3),
    totalCount
  );
  return totalCount > 0 && activeCount >= minActive && (activeCount / totalCount >= threshold);
}

/**
 * Identifies the 7 segments of a digit bounding box with multi-variant pattern scoring
 */
function probeDigitSegments(
  binary: Uint8Array,
  canvasW: number,
  box: { x: number; y: number; width: number; height: number },
  slantTan: number = 0.08
): { segments: SegmentProbeResult; matchChar: string; confidence: number } {
  // Relative probe positions cleanly centered within standard 7-segment strokes:
  // Left vertical column (f, e) is centered at x=0.18 (box stroke span: ~0.10 - 0.26)
  // Right vertical column (b, c) is centered at x=0.82 (box stroke span: ~0.74 - 0.90)
  // Top horizontal bar a at y=0.10, bottom horizontal bar d at y=0.90
  // Multi-point horizontal verification for center bar g (left 0.35, mid 0.50, right 0.65)
  const gLeft = sampleSegment(binary, canvasW, box, 0.35, 0.50, 'g', 0.28, slantTan);
  const gMid = sampleSegment(binary, canvasW, box, 0.50, 0.50, 'g', 0.32, slantTan);
  const gRight = sampleSegment(binary, canvasW, box, 0.65, 0.50, 'g', 0.28, slantTan);
  const hasSolidGBar = gMid && gLeft && gRight;

  const seg: SegmentProbeResult = {
    a: sampleSegment(binary, canvasW, box, 0.50, 0.10, 'h', undefined, slantTan), // Top horizontal
    b: sampleSegment(binary, canvasW, box, 0.82, 0.30, 'v', undefined, slantTan), // Top-Right vertical (centered in stroke)
    c: sampleSegment(binary, canvasW, box, 0.82, 0.70, 'v', undefined, slantTan), // Bottom-Right vertical (centered in stroke)
    d: sampleSegment(binary, canvasW, box, 0.50, 0.90, 'h', undefined, slantTan), // Bottom horizontal
    e: sampleSegment(binary, canvasW, box, 0.18, 0.70, 'v', undefined, slantTan), // Bottom-Left vertical (centered in stroke)
    f: sampleSegment(binary, canvasW, box, 0.18, 0.30, 'v', undefined, slantTan), // Top-Left vertical (centered in stroke)
    g: hasSolidGBar, // Center horizontal requires true horizontal continuity
  };

  // Special fast-path for digit '1':
  // In 7-segment digital displays, all digits (0, 2-9) require two vertical columns and an inner hollow space,
  // giving them an aspect ratio of width / height >= 0.48.
  // The digit '1' is the unique single-column character with a narrow aspect ratio (0.16 <= width / height <= 0.42).
  // Enforce minimum stroke thickness and vertical continuity to reject razor-thin bezel lines, casing seams and scratches.
  const digitAspect = box.width / box.height;
  const minStrokeW = Math.max(5, Math.floor(box.height * (slantTan >= 0.18 ? 0.14 : 0.16)));
  if (digitAspect >= 0.16 && digitAspect <= 0.42 && box.width >= minStrokeW && box.height >= 16) {
    const upperStroke = sampleSegment(binary, canvasW, box, 0.50, 0.30, 'v', 0.20, slantTan);
    const lowerStroke = sampleSegment(binary, canvasW, box, 0.50, 0.70, 'v', 0.20, slantTan);
    if (upperStroke && lowerStroke) {
      return {
        segments: { a: false, b: true, c: true, d: false, e: false, f: false, g: false },
        matchChar: '1',
        confidence: 0.98,
      };
    }
  }

  // Probe inner hollow cavities to reject solid glares, reflections, and filled spots
  // In true 7-segment digital characters, loops have empty dark cavities between strokes
  const upperHole = sampleSegment(binary, canvasW, box, 0.50, 0.30, 'c', undefined, slantTan);
  const lowerHole = sampleSegment(binary, canvasW, box, 0.50, 0.70, 'c', undefined, slantTan);

  const sampleMask =
    ((seg.a ? 1 : 0) << 6) |
    ((seg.b ? 1 : 0) << 5) |
    ((seg.c ? 1 : 0) << 4) |
    ((seg.d ? 1 : 0) << 3) |
    ((seg.e ? 1 : 0) << 2) |
    ((seg.f ? 1 : 0) << 1) |
    (seg.g ? 1 : 0);

  let bestMatch = '?';
  let minHamming = 8;

  for (let i = 0; i < COMPILED_PATTERNS.length; i++) {
    const { char, mask } = COMPILED_PATTERNS[i];
    // Topological disqualifications (identical logic, zero allocations)
    if (char === '1' && (seg.a && seg.d)) continue;
    if (char === '-' && (sampleMask & 0b1111110) !== 0) continue;
    if (char === '2' && (seg.c && seg.f)) continue; // '2' has NO segment c (bottom-right) or f (top-left)
    if (char === '6' && (seg.b || lowerHole)) continue; // '6' has NO segment b (top-right) & bottom loop must be hollow
    if (char === '7' && (seg.d || seg.g)) continue; // '7' has NO bottom bar d or center bar g!
    if (char === '3' && (seg.e && seg.f)) continue;
    if (char === '9' && upperHole) continue; // '9' top loop must be hollow

    const hamming = POPCNT_7BIT[sampleMask ^ mask];
    if (hamming < minHamming) {
      minHamming = hamming;
      bestMatch = char;
      if (hamming === 0) break; // Perfect match early break
    }
  }

  const bestScore = minHamming <= 7 ? (7 - minHamming) / 7 : -1;

  // ── Confusable-pair disambiguation with stricter re-verification ──

  // 0 vs 8: Both share outer segments a,b,c,d,e,f.
  // Center bar g: if center bar has solid horizontal width (hasSolidGBar is true), it is an '8'. If hollow cavity, strictly '0'.
  if ((bestMatch === '8' || bestMatch === '0') && bestScore >= 0.65) {
    if (!hasSolidGBar) {
      return {
        segments: { ...seg, g: false },
        matchChar: '0',
        confidence: Math.max(0.95, bestScore),
      };
    } else {
      return {
        segments: { ...seg, g: true },
        matchChar: '8',
        confidence: Math.max(0.95, bestScore),
      };
    }
  }

  // 5 topology check:
  // Digit '5' requires a, f, g, c, d. It strictly forbids b (top-right) and e (bottom-left).
  // If either b or e is present, or if center bar g is not solid, it is a '0' (or '8').
  if (bestMatch === '5') {
    if (seg.b || seg.e || !hasSolidGBar) {
      return {
        segments: { ...seg, g: hasSolidGBar },
        matchChar: '0',
        confidence: Math.max(0.92, bestScore),
      };
    }
  }

  // 2 vs 0: Digit '2' has segments a,b,d,e,g (no c, no f).
  // Digit '0' has outer loop a,b,c,d,e,f (no g).
  // If matched as '2', but vertical segments c (bottom-right) and f (top-left) are active:
  if (bestMatch === '2' && bestScore >= 0.70) {
    const cStrict = sampleSegment(binary, canvasW, box, 0.82, 0.70, 'v', 0.28, slantTan);
    const fStrict = sampleSegment(binary, canvasW, box, 0.18, 0.30, 'v', 0.28, slantTan);
    if (cStrict && fStrict) {
      return {
        segments: seg,
        matchChar: '0',
        confidence: Math.max(0.90, bestScore),
      };
    }
  }

  // 6 vs 8: Digit '6' has segments a,c,d,e,f,g (NO segment b top-right).
  // If matched as '8', re-verify segment b:
  if (bestMatch === '8' && bestScore >= 0.70) {
    const bStrict = sampleSegment(binary, canvasW, box, 0.88, 0.30, 'v', 0.36, slantTan);
    if (!bStrict) {
      return {
        segments: seg,
        matchChar: '6',
        confidence: Math.max(0.85, bestScore * 0.95),
      };
    }
  }

  // 6 vs 0: Both share c,d,e,f. '6' has center g and no b. '0' has b and no g.
  if (bestMatch === '6' && bestScore >= 0.70) {
    const bStrict = sampleSegment(binary, canvasW, box, 0.88, 0.30, 'v', 0.32, slantTan);
    if (bStrict && seg.a && seg.d) {
      return {
        segments: seg,
        matchChar: '0',
        confidence: Math.max(0.88, bestScore),
      };
    }
  }

  // 3 vs 8 vs 9:
  // Digit 3: segments a,b,c,d,g. (e = 0, f = 0)
  // Digit 8: segments a,b,c,d,e,f,g. (e = 1, f = 1)
  // Digit 9: segments a,b,c,d,f,g. (e = 0, f = 1)
  if (bestMatch === '8' && bestScore >= 0.70) {
    const eStrict = sampleSegment(binary, canvasW, box, 0.12, 0.70, 'v', 0.36, slantTan);
    const fStrict = sampleSegment(binary, canvasW, box, 0.12, 0.30, 'v', 0.36, slantTan);
    if (!eStrict && !fStrict) {
      return {
        segments: seg,
        matchChar: '3',
        confidence: Math.max(0.85, bestScore * 0.95),
      };
    }
    if (!eStrict && fStrict) {
      return {
        segments: seg,
        matchChar: '9',
        confidence: Math.max(0.82, bestScore * 0.92),
      };
    }
  }

  // 3 vs 9: Both share a,b,c,d,g. Difference is f (top-left).
  if (bestMatch === '9' && bestScore >= 0.70) {
    const fStrict = sampleSegment(binary, canvasW, box, 0.12, 0.30, 'v', 0.36, slantTan);
    if (!fStrict) {
      return {
        segments: seg,
        matchChar: '3',
        confidence: Math.max(0.85, bestScore * 0.95),
      };
    }
  }

  // 5 vs 6: Both share a,c,d,f,g. Difference is e (bottom-left).
  if (bestMatch === '6' && bestScore >= 0.70) {
    const eStrict = sampleSegment(binary, canvasW, box, 0.12, 0.70, 'v', 0.36, slantTan);
    if (!eStrict) {
      return {
        segments: seg,
        matchChar: '5',
        confidence: Math.max(0.82, bestScore * 0.93),
      };
    }
  }

  // 0 vs 8 safety net:
  if (bestMatch === '8' && bestScore >= 0.70 && !seg.g) {
    return {
      segments: seg,
      matchChar: '0',
      confidence: Math.max(0.85, bestScore * 0.95),
    };
  }

  return {
    segments: seg,
    matchChar: bestScore >= 0.70 ? bestMatch : '?',
    confidence: bestScore,
  };
}

interface ParsedElement {
  type: 'digit' | 'dot' | 'colon' | 'minus';
  char: string;
  box: { x: number; y: number; width: number; height: number };
  confidence: number;
  segments?: SegmentProbeResult;
}

interface RowCandidate {
  yStart: number;
  yEnd: number;
  weight: number | null;
  rawText: string;
  confidence: number;
  digits: DigitDetection[];
  isStableZero: boolean;
  hasDecimal: boolean;
  hasColon: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  layoutType: 'single' | 'stacked' | 'side-by-side';
  score: number;
}

// Discrete candidate slant tangents: 0°, ~5.1°, ~10.2°, ~14.6°
export const SLANT_CANDIDATES = [0.0, 0.09, 0.18, 0.26] as const;

/**
 * Estimates dominant 7-segment italic slant (tan(theta)) and computes the
 * shear-compensated vertical column projection in a single pass.
 * Executes in ~0.14ms with zero heap allocations when passed pre-allocated buffers.
 */
export function computeShearedColumnProjection(
  binary: Uint8Array,
  width: number,
  yStart: number,
  yEnd: number,
  outColCounts: Int32Array,
  scratchCounts: Int32Array
): number {
  const yMid = (yStart + yEnd) >> 1;
  const xMin = Math.floor(width * 0.12);
  const xMax = Math.floor(width * 0.88);
  let bestSlant = 0.08;
  let maxEnergy = -1;
  let minEnergy = Infinity;

  // Step by 2 vertically during slant estimation to halve CPU cost
  for (let sIdx = 0; sIdx < SLANT_CANDIDATES.length; sIdx++) {
    const slant = SLANT_CANDIDATES[sIdx];
    // Fixed-point Q8 slope: round(slant * 256)
    const slantFP = (slant * 256) | 0;
    scratchCounts.fill(0, 0, width);

    for (let y = yStart; y < yEnd; y += 2) {
      const rowOffset = y * width;
      const shiftX = ((yMid - y) * slantFP) >> 8;
      const startX = Math.max(xMin, -shiftX);
      const endX = Math.min(xMax, width - 1 - shiftX);

      for (let x = startX; x <= endX; x++) {
        // Project along the sheared ray back to canonical x at yMid
        if (binary[rowOffset + x + shiftX] === 1) {
          scratchCounts[x]++;
        }
      }
    }

    // Compute L2 energy sum(P(x)^2): peaks are tallest & valleys deepest at true slant
    let energy = 0;
    for (let x = xMin; x <= xMax; x++) {
      const c = scratchCounts[x];
      energy += c * c;
    }

    if (energy > maxEnergy) {
      maxEnergy = energy;
      bestSlant = slant;
    }
    if (energy < minEnergy) {
      minEnergy = energy;
    }
  }

  // Gate: If only a horizontal minus '-' is present, L2 energy is flat across slopes.
  // If maxEnergy varies by < 5% across candidates, default to standard slant 0.08.
  if (minEnergy > 0 && (maxEnergy - minEnergy) / minEnergy < 0.05) {
    bestSlant = 0.08;
  }

  // Compute full-resolution column projection at the winning slant angle
  const bestSlantFP = (bestSlant * 256) | 0;
  outColCounts.fill(0, 0, width);

  for (let y = yStart; y < yEnd; y++) {
    const rowOffset = y * width;
    const shiftX = ((yMid - y) * bestSlantFP) >> 8;
    const startX = Math.max(0, -shiftX);
    const endX = Math.min(width - 1, width - 1 - shiftX);

    for (let x = startX; x <= endX; x++) {
      if (binary[rowOffset + x + shiftX] === 1) {
        outColCounts[x]++;
      }
    }
  }

  return bestSlant;
}

/**
 * Parses scale digits from a binary map with dual-row (stacked) and side-by-side (Timer + Weight) layout detection
 */
function parseDigitsFromBinary(
  binary: Uint8Array,
  width: number,
  height: number,
  threshold: number,
  detectedPolarity: 'led' | 'lcd'
): OCRResult {
  // 1. Central-Focused Horizontal Row Projection: Find vertical row bands
  // Concentrates on central 88% of display width to eliminate any remaining side reflections
  ocrPool.ensureCapacity(width, height);
  const centralX1 = Math.floor(width * 0.06);
  const centralX2 = Math.floor(width * 0.94);
  const centralW = centralX2 - centralX1;
  const rowCounts = ocrPool.rowCounts;
  rowCounts.fill(0, 0, height);
  let maxRowCount = 0;
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = centralX1; x < centralX2; x++) {
      if (binary[y * width + x] === 1) count++;
    }
    rowCounts[y] = count;
    if (count > maxRowCount && count < centralW * 0.65) maxRowCount = count;
  }
  if (maxRowCount === 0) {
    for (let y = 0; y < height; y++) {
      if (rowCounts[y] > maxRowCount) maxRowCount = rowCounts[y];
    }
  }

  // Smooth rowCounts with a 5-point moving average to eliminate single-line noise spikes
  const smoothedRows = ocrPool.smoothedRows;
  smoothedRows.fill(0, 0, height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    let n = 0;
    for (let dy = -2; dy <= 2; dy++) {
      const py = y + dy;
      if (py >= 0 && py < height) {
        sum += rowCounts[py];
        n++;
      }
    }
    smoothedRows[y] = sum / n;
  }

  // Dynamic row threshold: adapts to actual digit stroke intensity
  const rowThreshold = Math.max(3, Math.floor(maxRowCount * 0.16));
  const minRowH = Math.max(26, Math.floor(height * 0.12)); // Real digital scale rows are >= 26px (rejects small book text)
  const rawRowBands: { start: number; end: number }[] = [];
  let inRow = false;
  let rowStart = 0;

  for (let y = 0; y < height; y++) {
    if (smoothedRows[y] >= rowThreshold) {
      if (!inRow) {
        inRow = true;
        rowStart = y;
      }
    } else {
      if (inRow) {
        inRow = false;
        if (y - rowStart >= minRowH) {
          rawRowBands.push({ start: rowStart, end: y });
        }
      }
    }
  }
  if (inRow && height - rowStart >= minRowH) {
    rawRowBands.push({ start: rowStart, end: height });
  }

  // Merge Intra-Digit Gaps:
  // In 7-segment digits (especially '0', '7', '1' with no center bar 'g'),
  // a small gap of 2-8px separates top and bottom vertical segments.
  // Adjacent bands separated by <= 12px belong to the same digit row!
  const mergedRowBands: { start: number; end: number }[] = [];
  for (const b of rawRowBands) {
    if (mergedRowBands.length === 0) {
      mergedRowBands.push({ ...b });
    } else {
      const prev = mergedRowBands[mergedRowBands.length - 1];
      const gap = b.start - prev.end;
      if (gap <= Math.max(12, Math.floor(height * 0.08))) {
        prev.end = b.end; // Merge top and bottom halves into single row
      } else {
        mergedRowBands.push({ ...b });
      }
    }
  }

  // Dual-Row Valley Splitter: If row is overly tall (H >= height * 0.70) and contains both Weight + Timer,
  // split at the most prominent horizontal valley between the two rows
  const rowBands: { start: number; end: number }[] = [];
  for (const b of mergedRowBands) {
    const bH = b.end - b.start;
    if (bH >= Math.floor(height * 0.70)) {
      const searchY1 = b.start + Math.floor(bH * 0.25);
      const searchY2 = b.start + Math.floor(bH * 0.75);
      let minVal = Infinity;
      let splitY = -1;
      let lowRowCount = 0;
      for (let y = searchY1; y <= searchY2; y++) {
        if (smoothedRows[y] <= Math.max(rowThreshold * 1.2, Math.floor(maxRowCount * 0.12))) {
          lowRowCount++;
        }
        if (smoothedRows[y] < minVal) {
          minVal = smoothedRows[y];
          splitY = y;
        }
      }
      if (
        splitY !== -1 &&
        lowRowCount >= 10 &&
        minVal <= Math.max(rowThreshold, Math.floor(maxRowCount * 0.10)) &&
        splitY - b.start >= minRowH &&
        b.end - splitY >= minRowH
      ) {
        rowBands.push({ start: b.start, end: splitY });
        rowBands.push({ start: splitY, end: b.end });
        continue;
      }
    }
    rowBands.push(b);
  }

  const candidateBands = rowBands.length > 0 ? rowBands : [{ start: 0, end: height }];
  const isStackedDual = candidateBands.length > 1;

  // 2. Parse Each Row Candidate
  const evaluatedRows: RowCandidate[] = [];

  for (let rIdx = 0; rIdx < candidateBands.length; rIdx++) {
    const band = candidateBands[rIdx];
    const bandH = band.end - band.start;

    // Column projection within this specific row band with shear-compensation
    const colCounts = ocrPool.colCounts;
    const slantTan = computeShearedColumnProjection(
      binary,
      width,
      band.start,
      band.end,
      colCounts,
      ocrPool.scratchCols
    );

    const colThreshold = Math.max(2, Math.floor(bandH * 0.04));
    const rawSpans: { start: number; end: number }[] = [];
    let inSpan = false;
    let spanStart = 0;

    for (let x = 0; x < width; x++) {
      if (colCounts[x] >= colThreshold) {
        if (!inSpan) {
          inSpan = true;
          spanStart = x;
        }
      } else {
        if (inSpan) {
          inSpan = false;
          if (x - spanStart >= 1) {
            rawSpans.push({ start: spanStart, end: x });
          }
        }
      }
    }
    if (inSpan && width - spanStart >= 1) {
      rawSpans.push({ start: spanStart, end: width });
    }

    // Merge intra-digit micro-gaps (<= 2px) to prevent thin horizontal bar dips (like in '4') from splitting a digit
    const mergedRawSpans: { start: number; end: number }[] = [];
    for (const s of rawSpans) {
      if (mergedRawSpans.length === 0) {
        mergedRawSpans.push({ ...s });
      } else {
        const prev = mergedRawSpans[mergedRawSpans.length - 1];
        if (s.start - prev.end <= 2) {
          prev.end = s.end;
        } else {
          mergedRawSpans.push({ ...s });
        }
      }
    }

    // Topologically-aware multi-digit splitter:
    // Separates fused digits (including narrow '1'+digit pairs at W >= 0.78*bH)
    // by penalizing cuts that sever horizontal bars (a, g, d).
    function splitFusedSpansTopological(
      inputSpans: { start: number; end: number }[],
      counts: Int32Array | number[],
      binaryData: Uint8Array,
      canvasW: number,
      yStart: number,
      yEnd: number,
      colThresh: number
    ): { start: number; end: number }[] {
      const bH = yEnd - yStart;
      const result: { start: number; end: number }[] = [];

      // Row offsets for horizontal bar tracks a (10%), g (50%), and d (90%)
      const yA = (yStart + Math.floor(bH * 0.10)) * canvasW;
      const yG = (yStart + Math.floor(bH * 0.50)) * canvasW;
      const yD = (yStart + Math.floor(bH * 0.90)) * canvasW;
      // Upper and lower cavity midpoints (30% and 70%)
      const yUpper = (yStart + Math.floor(bH * 0.30)) * canvasW;
      const yLower = (yStart + Math.floor(bH * 0.70)) * canvasW;

      const barPenaltyWeight = Math.max(4, Math.floor(bH * 0.22));

      for (let i = 0; i < inputSpans.length; i++) {
        const s = inputSpans[i];
        const w = s.end - s.start + 1;

        // 0.78 * bH catches fused '1' + digit (e.g. "18", "12") as well as 2+ wide digits
        if (w >= Math.floor(bH * 0.78)) {
          const sX1 = s.start + Math.max(5, Math.floor(w * 0.18));
          const sX2 = s.start + Math.min(w - 5, Math.floor(w * 0.82));
          let peakVal = 0;
          for (let x = s.start; x <= s.end; x++) {
            if (counts[x] > peakVal) peakVal = counts[x];
          }

          let minCost = Infinity;
          let bestValleyX = -1;
          let rawValleyCount = Infinity;

          for (let x = sX1; x <= sX2; x++) {
            const rawCount = counts[x];
            // Count how many horizontal bar tracks (a, g, d) are active at column x
            const horizBarsActive = binaryData[yA + x] + binaryData[yG + x] + binaryData[yD + x];
            // Check if vertical cavity tracks are open at column x
            const cavityActive = binaryData[yUpper + x] + binaryData[yLower + x];
            // True inter-digit gaps have horizBarsActive === 0; hollow digit centers have horiz bars active
            const cost = rawCount + horizBarsActive * barPenaltyWeight + cavityActive * 2;

            if (cost < minCost) {
              minCost = cost;
              bestValleyX = x;
              rawValleyCount = rawCount;
            }
          }

          // If span is only moderately wide (0.78 <= w/bH < 1.05), require either zero horizontal bars
          // at the cut point OR a deep valley to avoid splitting a single wide digit '0' or '8'
          const isModerateSpan = w < Math.floor(bH * 1.05);
          const barsAtBest =
            bestValleyX !== -1
              ? binaryData[yA + bestValleyX] + binaryData[yG + bestValleyX] + binaryData[yD + bestValleyX]
              : 3;

          const maxAllowedValley = isModerateSpan
            ? Math.max(colThresh * 2, Math.floor(peakVal * 0.28))
            : Math.max(colThresh * 2, Math.floor(peakVal * 0.42), Math.floor(bH * 0.25));

          if (
            bestValleyX !== -1 &&
            rawValleyCount <= maxAllowedValley &&
            (!isModerateSpan || barsAtBest === 0)
          ) {
            // Guard against broken horizontal bars on single digit '0':
            // If splitting a span of width W < 1.05H produces two narrow fragments both < 0.38H, reject split!
            const leftW = bestValleyX - s.start + 1;
            const rightW = s.end - bestValleyX;
            if (isModerateSpan && leftW < bH * 0.38 && rightW < bH * 0.38) {
              result.push(s);
              continue;
            }

            const left = { start: s.start, end: bestValleyX };
            const right = { start: bestValleyX + 1, end: s.end };
            result.push(
              ...splitFusedSpansTopological([left, right], counts, binaryData, canvasW, yStart, yEnd, colThresh)
            );
            continue;
          }
        }
        result.push(s);
      }
      return result;
    }

    const spans = splitFusedSpansTopological(mergedRawSpans, colCounts, binary, width, band.start, band.end, colThreshold);

    // Anti-Sentence / Text-Entropy Gate:
    // Coffee scale displays have at most 4-8 elements across a single band (e.g. "0:15  18.4g").
    // A printed line of text from a book or newspaper contains dozens of characters.
    // If the horizontal span count exceeds 8, this band is a sentence/text block, NOT a digital scale!
    if (spans.length > 8) {
      continue;
    }

    const elements: ParsedElement[] = [];
    let rowHasColon = false;
    const slantFP = (slantTan * 256) | 0;
    const yMid = (band.start + band.end) >> 1;

    for (const span of spans) {
      let spanMinY = band.end;
      let spanMaxY = band.start;
      let activePixels = 0;

      for (let y = band.start; y < band.end; y++) {
        const shiftX = ((yMid - y) * slantFP) >> 8;
        const x1 = Math.max(0, span.start + shiftX);
        const x2 = Math.min(width - 1, span.end + shiftX);
        const rowOffset = y * width;
        for (let x = x1; x <= x2; x++) {
          if (binary[rowOffset + x] === 1) {
            if (y < spanMinY) spanMinY = y;
            if (y > spanMaxY) spanMaxY = y;
            activePixels++;
          }
        }
      }

      if (activePixels < 2) continue; // Noise artifact

      const spanW = span.end - span.start + 1;
      const spanH = spanMaxY - spanMinY + 1;

      // Decimal Point check (small blob in bottom half of digit band, accommodates blooming/LED glow)
      const isNarrow = spanW <= Math.max(12, Math.floor(bandH * 0.42));
      const isShort = spanH <= Math.max(14, Math.floor(bandH * 0.48));
      const isBottom = spanMinY >= band.start + Math.floor(bandH * 0.38);

      if (isNarrow && isShort && isBottom) {
        elements.push({
          type: 'dot',
          char: '.',
          box: { x: span.start, y: spanMinY, width: spanW, height: spanH },
          confidence: 1.0,
        });
        continue;
      }

      // Timer Colon ':' (two dots with empty gap in vertical center)
      if (isNarrow && spanH >= bandH * 0.40) {
        let centerPixels = 0;
        const midY1 = band.start + Math.floor(bandH * 0.42);
        const midY2 = band.start + Math.floor(bandH * 0.58);
        for (let y = midY1; y <= midY2; y++) {
          for (let x = span.start; x <= span.end; x++) {
            if (binary[y * width + x] === 1) centerPixels++;
          }
        }

        // A true colon has NO active pixels in the vertical center gap between the two dots
        if (centerPixels <= 1) {
          elements.push({
            type: 'colon',
            char: ':',
            box: { x: span.start, y: spanMinY, width: spanW, height: spanH },
            confidence: 0.95,
          });
          rowHasColon = true;
          continue;
        }
      }

      // Minus Sign '-' (horizontal bar in center)
      const isMinusAspect = spanW >= spanH * 1.2;
      const isCenterVertical = spanMinY >= band.start + bandH * 0.3 && spanMaxY <= band.start + bandH * 0.7;
      if (isMinusAspect && isShort && isCenterVertical) {
        elements.push({
          type: 'minus',
          char: '-',
          box: { x: span.start, y: spanMinY, width: spanW, height: spanH },
          confidence: 0.90,
        });
        continue;
      }

      // Unit letter filtering ('g', 'oz', 'ml' on far right with non-digit bit pattern)
      if (spanW <= bandH * 0.55 && spanH <= bandH * 0.70 && span.start > width * 0.68) {
        // Skip isolated unit markers
        continue;
      }

      // Reject border-touching artifacts (screen bezel frame, camera crop boundary, edge glares)
      const edgeMargin = Math.max(16, Math.floor(width * 0.045));
      if (span.start <= edgeMargin || span.end >= width - edgeMargin) {
        continue;
      }

      // Reject narrow noise slivers (not wide enough for a digital digit stroke)
      if (spanW < Math.max(5, Math.floor(bandH * 0.10))) {
        continue;
      }

      // Reject solid glares and specular reflections for 2-column digits (aspect >= 0.40):
      // True 2-column 7-segment digits consist of thin strokes with hollow loops (fill density ~20-55%).
      // Solid glare spots, metal reflections, and light flares typically exceed 68% density.
      // (Single-column digit '1' with aspect < 0.40 is naturally a solid vertical stroke).
      const boxArea = spanW * spanH;
      const fillDensity = activePixels / boxArea;
      if (spanW >= spanH * 0.40 && fillDensity > 0.68 && spanW >= 8 && spanH >= 12) {
        continue;
      }

      // Reject non-character aspect ratios (too wide for a single 7-segment digit)
      if (spanW > spanH * 1.35 && spanH >= 12) {
        continue;
      }

      // 7-Segment Digit
      // Real espresso scale digits are >= 18px tall and occupy >= 42% of the row band height.
      // Small printed book/paper letters (8-14px) are rejected here.
      if (spanH >= Math.max(18, Math.floor(bandH * 0.42))) {
        const box = {
          x: span.start,
          y: spanMinY,
          width: spanW,
          height: spanH,
        };

        const result = probeDigitSegments(binary, width, box, slantTan);
        if (result.matchChar !== '?') {
          elements.push({
            type: 'digit',
            char: result.matchChar,
            box,
            confidence: result.confidence,
            segments: result.segments,
          });
        }
      }
    }

    // Reject row if detected elements exceed 7 (scale displays have at most 5-6 digits/symbols)
    if (elements.length > 7) {
      continue;
    }

    // 3. Spatial Token Clustering: Group elements into contiguous tokens based on spatial proximity
    // Consecutive digits within the same number are spaced close together (gap <= bandH * 0.50)
    // Wide gaps or colons indicate a distinct token (e.g. side-by-side timer vs weight, or isolated glare)
    const clusters: ParsedElement[][] = [];
    let currentCluster: ParsedElement[] = [];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (currentCluster.length === 0) {
        currentCluster.push(el);
      } else {
        const prev = currentCluster[currentCluster.length - 1];
        const gap = el.box.x - (prev.box.x + prev.box.width);
        // Bounded gap threshold: 7-segment digit '1' only has strokes on the right edge of its cell,
        // so any digit preceding '1' has an empty cell half between them (~0.60 * bandH).
        // Side-by-side timer and weight are separated by a large gulf (>= 1.2 * bandH) or colon ':'.
        const maxGap = el.type === 'digit' && el.char === '1'
          ? Math.max(28, Math.floor(bandH * 0.92))
          : Math.max(20, Math.floor(bandH * 0.70));

        if (gap > maxGap || el.type === 'colon' || prev.type === 'colon') {
          clusters.push(currentCluster);
          currentCluster = [el];
        } else {
          currentCluster.push(el);
        }
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    /**
     * Filters out chassis edge artifacts, bezel borders, and casing lines from a token cluster.
     * On 7-segment digital displays, all digits in a numeric sequence share the exact same
     * height, top line, bottom baseline, and regular inter-digit pitch.
     * Vertical edges that mistakenly pass single-stroke checks have abnormal heights,
     * piercing margins, shifted baselines, or excessive gaps.
     */
    function filterEdgeArtifactsFromCluster(elements: ParsedElement[]): ParsedElement[] {
      if (elements.length < 2) return elements;

      const digits = elements.filter((e) => e.type === 'digit');
      if (digits.length < 2) return elements;

      const heights = digits.map((d) => d.box.height).sort((a, b) => a - b);
      const tops = digits.map((d) => d.box.y).sort((a, b) => a - b);
      const bottoms = digits.map((d) => d.box.y + d.box.height).sort((a, b) => a - b);

      const medH = heights[Math.floor(heights.length / 2)];
      const medTop = tops[Math.floor(tops.length / 2)];
      const medBot = bottoms[Math.floor(bottoms.length / 2)];

      const maxHDiff = Math.max(7, Math.floor(medH * 0.25));
      const maxTopDiff = Math.max(6, Math.floor(medH * 0.20));
      const maxBotDiff = Math.max(6, Math.floor(medH * 0.20));

      let result = [...elements];

      // A coffee scale display has standard 1-decimal resolution (e.g. 0.0g or 36.2g)
      // Check if there is a decimal point
      const dotIdx = result.findIndex((e) => e.type === 'dot');
      if (dotIdx !== -1) {
        // In coffee scale displays: dot is followed by exactly 1 decimal digit (tenths place)
        // Any trailing elements after (dotIdx + 1) are edge borders, unit 'g', or optical flare!
        while (result.length > dotIdx + 2) {
          result.pop();
        }
      }

      // 1. Inspect first element if it's an edge artifact mimicking digit '1'
      // Legitimate multi-digit numbers (e.g. 216.1, 131.5, 127.3, 18.0, 10.0, 50.0, 80.0) are preserved.
      // An edge artifact on the bezel is either abnormally tiny (<40% of median height),
      // or separated by an enormous gap (> 0.70-0.92*medH) onto the outer chassis.
      if (result.length >= 2 && result[0].type === 'digit' && result[0].char === '1') {
        const firstBox = result[0].box;
        const nextEl = result[1];
        const gapToNext = nextEl.box.x - (firstBox.x + firstBox.width);
        const maxDistantGap = nextEl.type === 'digit' && nextEl.char === '1'
          ? Math.max(30, Math.floor(medH * 0.92))
          : Math.max(22, Math.floor(medH * 0.70));
        const isDistantEdge = gapToNext > maxDistantGap;

        // An edge sliver is abnormally tiny (less than 40% of median height)
        const isTinyNoiseSliver = firstBox.height < Math.max(12, Math.floor(medH * 0.40));

        if (isDistantEdge || isTinyNoiseSliver) {
          result.shift();
        }
      }

      // 2. Inspect last element if it's a trailing edge artifact
      if (result.length >= 2) {
        const lastIdx = result.length - 1;
        // If there's a decimal point, never prune the tenths place digit (dotIdx + 1)!
        const isTenthsDigit = dotIdx !== -1 && lastIdx === dotIdx + 1;
        if (!isTenthsDigit) {
          const lastEl = result[lastIdx];
          if (lastEl.type === 'digit' && (lastEl.char === '1' || lastEl.char === '2')) {
            const lastBox = lastEl.box;
            const isMisaligned =
              Math.abs(lastBox.height - medH) > maxHDiff ||
              Math.abs(lastBox.y - medTop) > maxTopDiff ||
              Math.abs(lastBox.y + lastBox.height - medBot) > maxBotDiff;

            const prevEl = result[lastIdx - 1];
            const gapToPrev = lastBox.x - (prevEl.box.x + prevEl.box.width);
            const isDistantTrailing = gapToPrev > Math.max(22, Math.floor(medH * 0.70));

            if (isMisaligned || isDistantTrailing) {
              result.pop();
            }
          }
        }
      }

      return result;
    }

    /**
     * Validates isolated decimal point candidates against adjacent digit baselines,
     * and recovers decimal points that bloomed/fused into the bottom-right "toe"
     * of the preceding (ones-place) digit.
     */
    function verifyAndRecoverDecimalPoint(
      cluster: ParsedElement[],
      binaryData: Uint8Array,
      canvasW: number,
      currentSlant: number = 0.08
    ): ParsedElement[] {
      const digits = cluster.filter((e) => e.type === 'digit');
      if (digits.length === 0) return cluster;

      const heights = digits.map((d) => d.box.height).sort((a, b) => a - b);
      const bottoms = digits.map((d) => d.box.y + d.box.height).sort((a, b) => a - b);
      const medH = heights[heights.length >> 1];
      const medBot = bottoms[bottoms.length >> 1];

      // Step 1: Validate any existing isolated 'dot' elements against the cluster's bottom baseline
      const validated: ParsedElement[] = [];
      let hasValidDot = false;

      for (let i = 0; i < cluster.length; i++) {
        const el = cluster[i];
        if (el.type === 'dot') {
          const dotCenterY = el.box.y + el.box.height * 0.5;
          const isBaselineAligned =
            dotCenterY >= medBot - medH * 0.34 &&
            dotCenterY <= medBot + medH * 0.12;

          // Dot must sit between two digits (not leading ".5" or trailing "18.")
          const hasPrevDigit = i > 0 && cluster[i - 1].type === 'digit';
          const hasNextDigit = i < cluster.length - 1 && cluster[i + 1].type === 'digit';

          if (isBaselineAligned && hasPrevDigit && hasNextDigit && !hasValidDot) {
            hasValidDot = true;
            validated.push(el);
          }
          // Otherwise discard noisy/floating dot!
        } else {
          validated.push(el);
        }
      }

      if (hasValidDot || digits.length < 2) {
        return validated;
      }

      // Step 2: Fused Decimal Recovery ("Right-Toe Protrusion" & Micro-Gap Scan)
      // On coffee scales, the decimal point always precedes the final (tenths) digit.
      const lastIdx = validated.length - 1;
      const prevIdx = lastIdx - 1;
      if (validated[lastIdx].type !== 'digit' || validated[prevIdx].type !== 'digit') {
        return validated;
      }

      const onesDigit = validated[prevIdx];
      const tenthsDigit = validated[lastIdx];
      const box = onesDigit.box;

      // Measure rightmost active X in upper 70% vs bottom 25% of onesDigit (slant-compensated)
      const splitY = box.y + Math.floor(box.height * 0.72);
      const yEnd = box.y + box.height;
      let maxUpperRightX = box.x;
      let maxLowerRightX = box.x;

      for (let y = box.y; y < yEnd; y++) {
        const relY = (y - box.y) / box.height;
        const slantShift = Math.round((0.5 - relY) * currentSlant * box.height);
        const rowOffset = y * canvasW;

        for (let x = box.x + box.width - 1; x >= box.x; x--) {
          if (binaryData[rowOffset + x] === 1) {
            const canonicalX = x + slantShift;
            if (y < splitY) {
              if (canonicalX > maxUpperRightX) maxUpperRightX = canonicalX;
            } else {
              if (canonicalX > maxLowerRightX) maxLowerRightX = canonicalX;
            }
            break;
          }
        }
      }

      const toeProtrusion = maxLowerRightX - maxUpperRightX;
      const minToeWidth = Math.max(3, Math.floor(medH * 0.13));

      if (toeProtrusion >= minToeWidth) {
        // A bloomed decimal point fused onto the bottom-right corner of onesDigit!
        // Trim onesDigit box width to exclude the fused dot and re-probe if it wasn't '1'
        const trimmedWidth = Math.max(6, box.width - toeProtrusion);
        const trimmedBox = { x: box.x, y: box.y, width: trimmedWidth, height: box.height };
        const reprobed = probeDigitSegments(binaryData, canvasW, trimmedBox, currentSlant);

        if (reprobed.matchChar !== '?') {
          validated[prevIdx] = {
            ...onesDigit,
            char: reprobed.matchChar,
            confidence: reprobed.confidence,
            box: trimmedBox,
            segments: reprobed.segments,
          };
        }

        const dotBox = {
          x: box.x + trimmedWidth,
          y: splitY,
          width: toeProtrusion,
          height: yEnd - splitY,
        };

        validated.splice(lastIdx, 0, {
          type: 'dot',
          char: '.',
          box: dotBox,
          confidence: 0.88,
        });
        return validated;
      }

      // Step 3: Sub-threshold Micro-Gap Check between onesDigit and tenthsDigit
      // Sometimes a 1-2px dim decimal dot was filtered out by `colCounts < colThreshold`
      const gapX1 = box.x + box.width + 1;
      const gapX2 = tenthsDigit.box.x - 1;
      if (gapX2 >= gapX1 && gapX2 - gapX1 <= Math.floor(medH * 0.45)) {
        const dotY1 = Math.floor(medBot - medH * 0.28);
        const dotY2 = Math.min(Math.floor(medBot + 2), box.y + box.height);
        let dotPixels = 0;
        let upperNoisePixels = 0;
        const upperY1 = box.y + Math.floor(box.height * 0.15);
        const upperY2 = box.y + Math.floor(box.height * 0.60);

        for (let y = dotY1; y < dotY2; y++) {
          const rOff = y * canvasW;
          for (let x = gapX1; x <= gapX2; x++) {
            if (binaryData[rOff + x] === 1) dotPixels++;
          }
        }

        for (let y = upperY1; y < upperY2; y++) {
          const rOff = y * canvasW;
          for (let x = gapX1; x <= gapX2; x++) {
            if (binaryData[rOff + x] === 1) upperNoisePixels++;
          }
        }

        if (dotPixels >= 2 && upperNoisePixels === 0) {
          validated.splice(lastIdx, 0, {
            type: 'dot',
            char: '.',
            box: { x: gapX1, y: dotY1, width: gapX2 - gapX1 + 1, height: dotY2 - dotY1 },
            confidence: 0.85,
          });
        }
      }

      return validated;
    }

    // Evaluate each cluster in the row band
    // The winning cluster in this row is the one that has a decimal point (weight)
    // or the primary numeric cluster with highest confidence
    interface ClusterEval {
      cluster: ParsedElement[];
      text: string;
      weight: number | null;
      hasDecimal: boolean;
      hasColon: boolean;
      confidence: number;
      score: number;
    }

    const evaluatedClusters: ClusterEval[] = [];

    for (const rawCl of clusters) {
      const edgeFiltered = filterEdgeArtifactsFromCluster(rawCl);
      const cl = verifyAndRecoverDecimalPoint(edgeFiltered, binary, width, slantTan);
      let clText = '';
      let clHasDecimal = false;
      let clHasColon = false;
      const digitsInCl: DigitDetection[] = [];

      for (const el of cl) {
        clText += el.char;
        if (el.type === 'dot') clHasDecimal = true;
        if (el.type === 'colon') clHasColon = true;
        if (el.type === 'digit') {
          digitsInCl.push({
            char: el.char,
            confidence: el.confidence,
            box: el.box,
            segments: el.segments || { a: false, b: false, c: false, d: false, e: false, f: false, g: false },
          });
        }
      }

      // Sanity Gate: A digital scale NEVER has more than one decimal point.
      // If multiple dots are detected (e.g. "126.0.4" or "136.0.1"), strip trailing noisy dots
      const dotCount = (clText.match(/\./g) || []).length;
      if (dotCount > 1) {
        const parts = clText.split('.');
        clText = `${parts[0]}.${parts[1].slice(0, 1)}`;
      }

      const cleanNum = clText.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleanNum);

      // Strict syntax validation for coffee scale displays:
      // A digital coffee scale ALWAYS displays at least one integer digit before the decimal dot (e.g. "0.0", "127.3").
      // Incomplete fragments starting with '.' (e.g. ".1", ".", "-.") are noise slivers and MUST be rejected!
      const hasValidSyntax = clHasDecimal
        ? /^-?\d+\.\d+$/.test(cleanNum)
        : /^-?\d+$/.test(cleanNum);

      const valid = hasValidSyntax && !isNaN(parsed) && parsed >= -20 && parsed <= 2000;
      const conf = digitsInCl.length > 0 ? digitsInCl.reduce((s, d) => s + d.confidence, 0) / digitsInCl.length : 0;

      // Check for Timer format vs Tare Zero Weight format
      // Digital coffee scale timers commonly format as "0:00", "00:00", or "00.15" (2 decimal places with 4+ chars)
      // A display showing "0.0", "00.0", "-0.0", or "0" is PURE TARE ZERO WEIGHT!
      const isTareZero =
        cleanNum === '0.0' ||
        cleanNum === '00.0' ||
        cleanNum === '000.0' ||
        cleanNum === '-0.0' ||
        cleanNum === '-00.0' ||
        cleanNum === '0' ||
        cleanNum === '00';

      const isTimerPattern =
        !isTareZero &&
        (clHasColon ||
         clText.includes(':') ||
         clText.startsWith('0:') ||
         clText.startsWith('00:') ||
         clText === '0:00' ||
         clText === '00:00' ||
         (/\b\d{2}\.\d{2}\b/.test(clText) && clText.length >= 5));

      let clScore = conf * 20;
      if (isTareZero) {
        clScore += 160; // Massive top-tier priority for tare zero readings ("0.0", "00.0")!
      } else {
        if (valid && clHasDecimal && !isTimerPattern) clScore += 75; // Big bonus for valid decimal coffee scale weight
        if (valid && !isTimerPattern) clScore += 35;
        if (valid && digitsInCl.length >= 2 && !isTimerPattern) clScore += 20; // Realistic multi-digit number (e.g. 127.3)
      }

      if (!hasValidSyntax && !isTareZero) {
        clScore -= 300; // Strong elimination penalty for malformed fragments like ".1"
      }

      if (isTimerPattern) {
        clScore -= 300; // Strong elimination penalty for timer format (0:00 / 00:00 / colon)
      }

      evaluatedClusters.push({
        cluster: cl,
        text: clText,
        weight: valid && !isTimerPattern ? parsed : null,
        hasDecimal: clHasDecimal,
        hasColon: clHasColon || isTimerPattern,
        confidence: conf,
        score: clScore,
      });
    }

    evaluatedClusters.sort((a, b) => b.score - a.score);
    const bestCluster = evaluatedClusters[0];
    const isSideBySide = clusters.length > 1 && (rowHasColon || evaluatedClusters.some(c => c.hasColon));
    const layoutType: 'single' | 'stacked' | 'side-by-side' = isSideBySide ? 'side-by-side' : (isStackedDual ? 'stacked' : 'single');

    let selectedDigits: DigitDetection[] = [];
    let parsedText = '';
    let parsedWeight: number | null = null;
    let hasDec = false;

    if (bestCluster) {
      parsedText = bestCluster.text;
      parsedWeight = bestCluster.weight;
      hasDec = bestCluster.hasDecimal;
      selectedDigits = bestCluster.cluster
        .filter(el => el.type === 'digit')
        .map(el => ({
          char: el.char,
          confidence: el.confidence,
          box: el.box,
          segments: el.segments || { a: false, b: false, c: false, d: false, e: false, f: false, g: false },
        }));
    }

    const cleanNumeric = parsedText.replace(/[^0-9.-]/g, '');
    const isStableZero = parsedWeight === 0.0 || cleanNumeric === '0.0' || cleanNumeric === '0';

    const avgConfidence =
      selectedDigits.length > 0
        ? selectedDigits.reduce((sum, d) => sum + d.confidence, 0) / selectedDigits.length
        : 0;

    const rowIsTareZero =
      cleanNumeric === '0.0' ||
      cleanNumeric === '00.0' ||
      cleanNumeric === '000.0' ||
      cleanNumeric === '-0.0' ||
      cleanNumeric === '-00.0' ||
      cleanNumeric === '0' ||
      cleanNumeric === '00';

    const rowIsTimer =
      !rowIsTareZero &&
      (rowHasColon ||
       parsedText.includes(':') ||
       parsedText.startsWith('0:') ||
       parsedText.startsWith('00:') ||
       parsedText === '0:00' ||
       parsedText === '00:00' ||
       (/\b\d{2}\.\d{2}\b/.test(parsedText) && parsedText.length >= 5));

    let score = avgConfidence * 20;
    if (rowIsTareZero) {
      score += 150; // Massive top-tier bonus for tare zero weight row ("0.0", "00.0")!
    } else {
      if (hasDec && !rowIsTimer) score += 70;
      if (parsedWeight !== null && !rowIsTimer) score += 35;
    }

    // Dual-Row Stacking Architecture:
    // On espresso scales (Muvna, Timemore, Acaia Lunar, MHW-3BOMBER), the WEIGHT is placed on Row 0 (TOP),
    // while the TIMER is placed on Row 1 (BOTTOM).
    if (candidateBands.length > 1) {
      if (rIdx === 0) {
        score += 150; // Strong top row priority for weight on stacked dual-row displays
      } else {
        score -= 250; // Bottom row heavily penalized (it is the timer!)
      }
    }

    if (rowIsTimer) {
      score -= 350; // Heavy elimination penalty for timer row
    }

    let minBoxX = width;
    let maxBoxX = 0;
    let minBoxY = height;
    let maxBoxY = 0;

    for (const d of selectedDigits) {
      if (d.box.x < minBoxX) minBoxX = d.box.x;
      if (d.box.x + d.box.width > maxBoxX) maxBoxX = d.box.x + d.box.width;
      if (d.box.y < minBoxY) minBoxY = d.box.y;
      if (d.box.y + d.box.height > maxBoxY) maxBoxY = d.box.y + d.box.height;
    }

    const boundingBox =
      maxBoxX > minBoxX && maxBoxY > minBoxY
        ? { x: minBoxX, y: minBoxY, width: maxBoxX - minBoxX, height: maxBoxY - minBoxY }
        : null;

    evaluatedRows.push({
      yStart: band.start,
      yEnd: band.end,
      weight: parsedWeight,
      rawText: parsedText,
      confidence: avgConfidence,
      digits: selectedDigits,
      isStableZero,
      hasDecimal: hasDec,
      hasColon: rowHasColon,
      boundingBox,
      layoutType,
      score,
    });
  }

  evaluatedRows.sort((a, b) => b.score - a.score);
  const best = evaluatedRows[0] || {
    weight: null,
    rawText: '',
    confidence: 0,
    digits: [],
    isStableZero: false,
    boundingBox: null,
    layoutType: 'single' as const,
  };

  const allCandidates: CandidateInfo[] = evaluatedRows.map((r) => ({
    weight: r.weight,
    rawText: r.rawText,
    confidence: r.confidence,
    boundingBox: r.boundingBox,
    hasDecimal: r.hasDecimal,
    hasColon: r.hasColon,
    score: r.score,
  }));

  return {
    weight: best.weight,
    rawText: best.rawText,
    confidence: best.confidence,
    digits: best.digits,
    thresholdUsed: threshold,
    isStableZero: best.isStableZero,
    boundingBox: best.boundingBox,
    detectedPolarity,
    layoutType: best.layoutType,
    allCandidates,
  };
}

/**
 * Main OCR recognition routine for a scale Region-of-Interest (ROI)
 * Supports 'auto' zero-tap auto-polarity detection with Bradley-Roth adaptive thresholding
 */
export function recognizeScaleDigits(
  imageData: ImageData,
  displayMode: 'auto' | 'led' | 'lcd' | boolean = 'auto'
): OCRResult {
  // Determine execution mode
  if (displayMode === 'lcd' || displayMode === true) {
    const { binary, width, height, threshold, detectedPolarity } = binarizeROI(imageData, true);
    const res = parseDigitsFromBinary(binary, width, height, threshold, detectedPolarity);
    res.autoPolarityUsed = 'lcd';
    return res;
  }

  if (displayMode === 'led' || displayMode === false) {
    const { binary, width, height, threshold, detectedPolarity } = binarizeROI(imageData, false);
    // Sanity gate: If user selected LED mode (dark scale with glowing digits)
    // but the scene is actually bright/white (e.g. white paper or bright book)
    // where detectedPolarity === 'lcd', do NOT hallucinate numbers!
    if (detectedPolarity === 'lcd') {
      return {
        weight: null,
        rawText: '',
        confidence: 0,
        digits: [],
        thresholdUsed: threshold,
        isStableZero: false,
        boundingBox: null,
        detectedPolarity: 'lcd',
        layoutType: 'single',
        allCandidates: [],
        autoPolarityUsed: 'led',
      };
    }
    const res = parseDigitsFromBinary(binary, width, height, threshold, detectedPolarity);
    res.autoPolarityUsed = 'led';
    return res;
  }

  // AUTO POLARITY MODE: Automatically recognizes whether scale is LED or LCD
  // 1. Try LED mode first (most common for espresso scales: Acaia, Timemore, MHW-3BOMBER)
  const ledBinarized = binarizeROI(imageData, false);
  const resLED = parseDigitsFromBinary(
    ledBinarized.binary,
    ledBinarized.width,
    ledBinarized.height,
    ledBinarized.threshold,
    ledBinarized.detectedPolarity
  );

  // If LED result has high confidence and valid weight, return immediately
  if (resLED.confidence >= 0.70 && resLED.weight !== null && ledBinarized.detectedPolarity === 'led') {
    resLED.autoPolarityUsed = 'led';
    return resLED;
  }

  // 2. Try LCD mode (classic kitchen scales: Soehnle, Taylor, Amazon basics)
  const lcdBinarized = binarizeROI(imageData, true);
  const resLCD = parseDigitsFromBinary(
    lcdBinarized.binary,
    lcdBinarized.width,
    lcdBinarized.height,
    lcdBinarized.threshold,
    lcdBinarized.detectedPolarity
  );

  if (resLCD.confidence > resLED.confidence && resLCD.weight !== null) {
    resLCD.autoPolarityUsed = 'lcd';
    return resLCD;
  }

  resLED.autoPolarityUsed = 'led';
  return resLED;
}

/**
 * Physics-Informed 1D Kinematic Kalman / Alpha-Beta Filter for Coffee Scales.
 * Features:
 * - Continuous state estimation of [weight (g), flowRate (g/s)] across variable dt
 * - Automatic 10x dropped-decimal recovery (e.g., "142" -> 14.2g when tracking ~14.0g)
 * - Asymmetric monotonic mass conservation under active brewing
 * - Zero-allocation parallel hypothesis tracker for step-change / self-healing recovery
 */
export class ScaleReadingFilter {
  private weight: number = 0.0;
  private flowRate: number = 0.0;
  private timeSinceValidSec: number = 0.0;
  private validBrewStepsCount: number = 0; // Tracks genuine incremental flow steps

  // Parallel hypothesis state (zero-allocation replacement for recentWindow[])
  private altWeight: number = 0.0;
  private altCount: number = 0;

  public sanitize(
    newReading: number | null,
    deltaTimeSeconds: number,
    isBrewing: boolean = false,
    ocrConfidence: number = 0.90,
    hasDecimal: boolean = true,
    maxFlowCap: number = 6.5
  ): { weight: number; flowRate: number; isOutlier: boolean } {
    const dt = Math.max(0.015, Math.min(1.0, deltaTimeSeconds));
    this.timeSinceValidSec += dt;

    if (newReading === null || newReading < -20.0 || newReading > 2000.0) {
      // Decay flow rate gently during frame dropouts
      this.flowRate *= Math.pow(0.85, dt * 10);
      return { weight: this.weight, flowRate: Math.max(0, this.flowRate), isOutlier: true };
    }

    // 1. Instant Tare Zero Lock (<= 0.3g when already near zero)
    if (newReading <= 0.3 && Math.abs(this.weight) <= 0.4) {
      this.weight = 0.0;
      this.flowRate = 0.0;
      this.altCount = 0;
      this.validBrewStepsCount = 0;
      this.timeSinceValidSec = 0.0;
      return { weight: 0.0, flowRate: 0.0, isOutlier: false };
    }

    // 2. Kinematic State Prediction across elapsed time since last valid reading
    const effDt = Math.min(1.5, this.timeSinceValidSec);
    const predictedWeight = isBrewing
      ? this.weight + Math.max(0, this.flowRate) * Math.min(0.35, effDt)
      : this.weight;

    // 3. 10x Dropped-Decimal Glitch Auto-Heal:
    // If OCR read an integer >= 10 (e.g. 142 instead of 14.2, or 362 instead of 36.2)
    // and newReading / 10 matches our kinematic prediction within 0.45g, heal the decimal!
    let measurement = newReading;
    const isIntegerReading = Math.abs(measurement - Math.round(measurement)) < 0.01;
    if (
      isIntegerReading &&
      !hasDecimal &&
      measurement >= 10.0 &&
      predictedWeight >= 1.0 &&
      Math.abs(measurement - predictedWeight) > 8.0 &&
      Math.abs(measurement * 0.1 - predictedWeight) <= 0.45
    ) {
      measurement = Math.round(measurement) * 0.1;
    }

    // 3b. Leading-Digit OCR Corruption Healer ('4' -> '1' turning 42.4g into 12.4g, or '7' -> '1'):
    // If tens digit dropped by ~30g (4x -> 1x) while weight trajectory was already at 38–52g:
    if (isBrewing && this.weight >= 35.0 && measurement >= 10.0 && measurement < 25.0) {
      const healedPlus30 = Math.round((measurement + 30.0) * 10) / 10;
      if (Math.abs(healedPlus30 - this.weight) <= 2.5) {
        measurement = healedPlus30;
      }
    }

    // Hard ceiling during active espresso brewing (prevents unhealed 10x spikes from 0.x)
    if (isBrewing && measurement > 150.0 && this.weight < 65.0) {
      return { weight: this.weight, flowRate: this.flowRate, isOutlier: true };
    }

    // 4. Physical Innovation Gate (Asymmetric Fluid Dynamics)
    // Max physical flow rate: ~6.5 g/s for espresso, ~15.0 g/s for pour-over / idle
    const maxPhysicalFlow = isBrewing ? maxFlowCap : 15.0;
    const maxForwardDelta = Math.max(isBrewing ? 0.65 : 1.2, effDt * maxPhysicalFlow);
    const maxReverseDelta = isBrewing && this.weight >= 2.5 ? -0.25 : -1.5;

    const innovation = measurement - predictedWeight;
    const rawDelta = measurement - this.weight;

    if (rawDelta >= maxReverseDelta && (innovation <= maxForwardDelta || rawDelta <= maxForwardDelta)) {
      // Measurement is physically consistent with continuous fluid extraction!
      if (isBrewing && rawDelta > 0.05) {
        this.validBrewStepsCount++;
      }

      // Adaptive Kalman gains weighted by OCR confidence
      const confScale = Math.max(0.5, Math.min(1.0, ocrConfidence));
      const alpha = isBrewing ? 0.72 * confScale : 0.85 * confScale;
      const beta = isBrewing ? 0.28 * confScale : 0.40 * confScale;

      // Snap directly to 0.1g resolution if innovation is small to avoid display lag
      const updatedWeight = Math.abs(innovation) <= 0.35
        ? measurement
        : predictedWeight + alpha * innovation;

      const measuredVel = rawDelta / effDt;
      this.flowRate = Math.max(
        0,
        Math.min(maxPhysicalFlow, this.flowRate + beta * (measuredVel - this.flowRate))
      );
      this.weight = Math.round(updatedWeight * 10) / 10;
      this.altCount = 0;
      this.timeSinceValidSec = 0.0;

      return { weight: this.weight, flowRate: this.flowRate, isOutlier: false };
    }

    // 5. Parallel Hypothesis Tracker (Handles step changes & self-healing consensus recovery)
    const altStepTolerance = Math.max(0.5, dt * maxPhysicalFlow);
    if (this.altCount > 0 && Math.abs(measurement - this.altWeight) <= altStepTolerance) {
      this.altCount++;
      this.altWeight = measurement;

      // Rule: NEVER allow downward "self-heal" if the current weight was built up gradually
      // over >= 8 genuine incremental flow steps (liquid cannot evaporate from the cup!),
      // UNLESS the barista explicitly tared the scale back to 0.0g (measurement <= 0.4g).
      const isManualMidShotTare = measurement <= 0.4;
      const canSelfHealDownward = !isBrewing || this.validBrewStepsCount < 8 || isManualMidShotTare;

      // Require 5 consecutive frames to self-heal downward during brewing; 2 frames for forward jumps
      const requiredConsensus = isBrewing && measurement < this.weight - 0.4 ? 5 : 2;
      if (this.altCount >= requiredConsensus && canSelfHealDownward) {
        const jumpVel = (measurement - this.weight) / Math.max(0.1, effDt);
        this.weight = measurement;
        this.flowRate = isBrewing ? Math.max(0, Math.min(maxPhysicalFlow, jumpVel)) : 0;
        this.altCount = 0;
        this.timeSinceValidSec = 0.0;
        if (isManualMidShotTare) {
          this.validBrewStepsCount = 0;
        }
        return { weight: this.weight, flowRate: this.flowRate, isOutlier: false };
      }
    } else {
      // Seed new alternative hypothesis
      this.altWeight = measurement;
      this.altCount = 1;
    }

    return { weight: this.weight, flowRate: this.flowRate, isOutlier: true };
  }

  public reset(initialWeight: number = 0) {
    this.weight = initialWeight;
    this.flowRate = 0.0;
    this.timeSinceValidSec = 0.0;
    this.validBrewStepsCount = 0;
    this.altWeight = 0.0;
    this.altCount = 0;
  }
}

