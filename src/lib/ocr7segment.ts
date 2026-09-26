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

export interface OCRResult {
  weight: number | null;
  rawText: string;
  confidence: number;
  digits: DigitDetection[];
  thresholdUsed: number;
  isStableZero: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
}

// 7-segment bit patterns for digits 0-9 and '-'
// Segments: [a, b, c, d, e, f, g]
// Multiple variants accommodate manufacturer font differences (e.g. 6 with/without top bar, 7 with segment f)
const PATTERN_VARIANTS: Record<string, number[][]> = {
  '0': [[1, 1, 1, 1, 1, 1, 0]],
  '1': [
    [0, 1, 1, 0, 0, 0, 0], // standard right side
    [0, 0, 0, 0, 1, 1, 0], // rare left side
  ],
  '2': [[1, 1, 0, 1, 1, 0, 1]],
  '3': [[1, 1, 1, 1, 0, 0, 1]],
  '4': [[0, 1, 1, 0, 0, 1, 1]],
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

/**
 * Calculates optimal binarization threshold using Otsu's method
 */
export function calculateOtsuThreshold(grayPixels: Uint8Array): number {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < grayPixels.length; i++) {
    histogram[grayPixels[i]]++;
  }

  const total = grayPixels.length;
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
 * Converts ImageData to a high-contrast binary map
 * @param isDarkDigitsOnLight: true for classic LCD (grey/black), false for LED (illuminated blue/white/red on black)
 */
export function binarizeROI(
  imageData: ImageData,
  isDarkDigitsOnLight: boolean = false
): { binary: Uint8Array; width: number; height: number; threshold: number } {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  const gray = new Uint8Array(numPixels);

  // Convert to grayscale
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Rec.601 standard luminance: Y = 0.299R + 0.587G + 0.114B
    const lum = (r * 77 + g * 150 + b * 29) >> 8;

    if (isDarkDigitsOnLight) {
      gray[i] = lum;
    } else {
      // LED Mode: Coffee scales use vibrant Blue, Cyan, White or Red LEDs.
      // Standard luminance squashes Blue (multiplier 0.114).
      // Max-RGB boost ensures saturated Blue/Cyan LEDs reach full 255 intensity.
      const maxC = Math.max(r, g, b);
      gray[i] = Math.max(maxC, lum);
    }
  }

  // Calculate threshold with floor protection for LED mode to eliminate background camera sensor noise
  const rawThreshold = calculateOtsuThreshold(gray);
  const threshold = isDarkDigitsOnLight
    ? Math.min(180, rawThreshold)
    : Math.max(60, rawThreshold);

  const binary = new Uint8Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    if (isDarkDigitsOnLight) {
      // Dark digits = active pixels (1)
      binary[i] = gray[i] < threshold ? 1 : 0;
    } else {
      // Light LED digits = active pixels (1)
      binary[i] = gray[i] > threshold ? 1 : 0;
    }
  }

  return { binary, width, height, threshold };
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
  orientation: 'h' | 'v' | 'c' = 'c'
): boolean {
  // Italic slant compensation for typical 7-segment digital coffee displays (~6-8 degrees)
  const slantOffset = (0.5 - relY) * 0.08;
  const effectiveRelX = Math.max(0.05, Math.min(0.95, relX + slantOffset));

  const centerX = Math.floor(box.x + box.width * effectiveRelX);
  const centerY = Math.floor(box.y + box.height * relY);

  const radiusX = orientation === 'h' ? Math.max(2, Math.floor(box.width * 0.16)) : Math.max(1, Math.floor(box.width * 0.08));
  const radiusY = orientation === 'v' ? Math.max(2, Math.floor(box.height * 0.14)) : Math.max(1, Math.floor(box.height * 0.08));

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

  // Active if at least 20% of sampled pixels in the segment zone are illuminated or active count is significant
  return totalCount > 0 && (activeCount / totalCount >= 0.20 || activeCount >= 3);
}

/**
 * Identifies the 7 segments of a digit bounding box with multi-variant pattern scoring
 */
function probeDigitSegments(
  binary: Uint8Array,
  canvasW: number,
  box: { x: number; y: number; width: number; height: number }
): { segments: SegmentProbeResult; matchChar: string; confidence: number } {
  // Relative probe positions
  const seg: SegmentProbeResult = {
    a: sampleSegment(binary, canvasW, box, 0.50, 0.07, 'h'), // Top horizontal
    b: sampleSegment(binary, canvasW, box, 0.88, 0.28, 'v'), // Top-Right vertical
    c: sampleSegment(binary, canvasW, box, 0.88, 0.72, 'v'), // Bottom-Right vertical
    d: sampleSegment(binary, canvasW, box, 0.50, 0.93, 'h'), // Bottom horizontal
    e: sampleSegment(binary, canvasW, box, 0.12, 0.72, 'v'), // Bottom-Left vertical
    f: sampleSegment(binary, canvasW, box, 0.12, 0.28, 'v'), // Top-Left vertical
    g: sampleSegment(binary, canvasW, box, 0.50, 0.50, 'h'), // Center horizontal
  };

  // Special fast-path for digit '1'
  // Digital scales render '1' with very narrow aspect ratio (width / height < 0.45)
  if (box.width / box.height < 0.45 && (seg.b || seg.c) && !seg.g && !seg.a && !seg.d) {
    return {
      segments: seg,
      matchChar: '1',
      confidence: 0.95,
    };
  }

  const sampleArray = [
    seg.a ? 1 : 0,
    seg.b ? 1 : 0,
    seg.c ? 1 : 0,
    seg.d ? 1 : 0,
    seg.e ? 1 : 0,
    seg.f ? 1 : 0,
    seg.g ? 1 : 0,
  ];

  let bestMatch = '?';
  let bestScore = -1;

  for (const [digit, variants] of Object.entries(PATTERN_VARIANTS)) {
    for (const pattern of variants) {
      // Disqualifications based on 7-segment topology:
      if (digit === '1' && (seg.g || seg.a || seg.d)) continue;
      if (digit === '-' && (seg.b || seg.c || seg.e || seg.f || seg.a || seg.d)) continue;
      if (digit === '0' && seg.g) continue;
      if (digit === '7' && (seg.d || seg.g)) continue;
      if (digit === '4' && (seg.a || seg.d)) continue;
      if (digit === '3' && (seg.e || seg.f)) continue;

      let matchCount = 0;
      for (let i = 0; i < 7; i++) {
        if (sampleArray[i] === pattern[i]) matchCount++;
      }
      const score = matchCount / 7;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = digit;
      }
    }
  }

  return {
    segments: seg,
    matchChar: bestScore >= 0.70 ? bestMatch : '?',
    confidence: bestScore,
  };
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
  score: number;
}

/**
 * Main OCR recognition routine for a scale Region-of-Interest (ROI)
 * Features dual-row awareness (Weight vs Timer separation) and tight digit bounds
 */
export function recognizeScaleDigits(
  imageData: ImageData,
  isDarkDigits: boolean = false
): OCRResult {
  const { binary, width, height, threshold } = binarizeROI(imageData, isDarkDigits);

  // 1. Horizontal Row Projection: Find vertical row bands
  // Digital scales with dual display (Weight top, Timer bottom) produce 2 distinct row bands.
  const rowCounts = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (binary[y * width + x] === 1) count++;
    }
    rowCounts[y] = count;
  }

  const rowThreshold = Math.max(3, width * 0.025);
  const rowBands: { start: number; end: number }[] = [];
  let inRow = false;
  let rowStart = 0;

  for (let y = 0; y < height; y++) {
    if (rowCounts[y] >= rowThreshold) {
      if (!inRow) {
        inRow = true;
        rowStart = y;
      }
    } else {
      if (inRow) {
        inRow = false;
        if (y - rowStart >= 10) {
          rowBands.push({ start: rowStart, end: y });
        }
      }
    }
  }
  if (inRow && height - rowStart >= 10) {
    rowBands.push({ start: rowStart, end: height });
  }

  // Fallback to full frame if no clear row bands emerged
  const candidateBands = rowBands.length > 0 ? rowBands : [{ start: 0, end: height }];

  // 2. Parse Each Row Candidate
  const evaluatedRows: RowCandidate[] = [];

  for (let rIdx = 0; rIdx < candidateBands.length; rIdx++) {
    const band = candidateBands[rIdx];
    const bandH = band.end - band.start;

    // Column projection within this specific row band
    const colCounts = new Array(width).fill(0);
    for (let x = 0; x < width; x++) {
      let count = 0;
      for (let y = band.start; y < band.end; y++) {
        if (binary[y * width + x] === 1) count++;
      }
      colCounts[x] = count;
    }

    const colThreshold = Math.max(2, bandH * 0.05);
    const spans: { start: number; end: number }[] = [];
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
          if (x - spanStart >= 2) {
            spans.push({ start: spanStart, end: x });
          }
        }
      }
    }
    if (inSpan && width - spanStart >= 2) {
      spans.push({ start: spanStart, end: width });
    }

    const digits: DigitDetection[] = [];
    let parsedText = '';
    let hasDecimal = false;
    let hasColon = false;
    let minBoxX = width;
    let maxBoxX = 0;
    let minBoxY = height;
    let maxBoxY = 0;

    for (const span of spans) {
      // Find tight vertical bounding box within this column span
      let spanMinY = band.end;
      let spanMaxY = band.start;
      let activePixels = 0;

      for (let y = band.start; y < band.end; y++) {
        for (let x = span.start; x <= span.end; x++) {
          if (binary[y * width + x] === 1) {
            if (y < spanMinY) spanMinY = y;
            if (y > spanMaxY) spanMaxY = y;
            activePixels++;
          }
        }
      }

      if (activePixels < 4) continue; // Skip noise artifact

      const spanW = span.end - span.start + 1;
      const spanH = spanMaxY - spanMinY + 1;

      // Check for Decimal Point (small blob in bottom third of row)
      const isNarrow = spanW <= Math.max(6, bandH * 0.35);
      const isShort = spanH <= Math.max(8, bandH * 0.38);
      const isBottom = spanMinY >= band.start + bandH * 0.48;

      if (isNarrow && isShort && isBottom) {
        parsedText += '.';
        hasDecimal = true;
        if (span.start < minBoxX) minBoxX = span.start;
        if (span.end > maxBoxX) maxBoxX = span.end;
        if (spanMinY < minBoxY) minBoxY = spanMinY;
        if (spanMaxY > maxBoxY) maxBoxY = spanMaxY;
        continue;
      }

      // Check for Timer Colon ':' (two dots or vertical separator in middle)
      if (isNarrow && spanH >= bandH * 0.5) {
        parsedText += ':';
        hasColon = true;
        continue;
      }

      // Check for Minus Sign '-' (horizontal bar in vertical middle)
      const isMinusAspect = spanW >= spanH * 1.2;
      const isCenterVertical = spanMinY >= band.start + bandH * 0.3 && spanMaxY <= band.start + bandH * 0.7;
      if (isMinusAspect && isShort && isCenterVertical) {
        parsedText += '-';
        if (span.start < minBoxX) minBoxX = span.start;
        if (span.end > maxBoxX) maxBoxX = span.end;
        if (spanMinY < minBoxY) minBoxY = spanMinY;
        if (spanMaxY > maxBoxY) maxBoxY = spanMaxY;
        continue;
      }

      // 7-Segment Digit
      if (spanH >= bandH * 0.40) {
        const box = {
          x: span.start,
          y: spanMinY,
          width: spanW,
          height: spanH,
        };

        const result = probeDigitSegments(binary, width, box);
        if (result.matchChar !== '?') {
          digits.push({
            char: result.matchChar,
            confidence: result.confidence,
            box,
            segments: result.segments,
          });
          parsedText += result.matchChar;

          if (box.x < minBoxX) minBoxX = box.x;
          if (box.x + box.width > maxBoxX) maxBoxX = box.x + box.width;
          if (box.y < minBoxY) minBoxY = box.y;
          if (box.y + box.height > maxBoxY) maxBoxY = box.y + box.height;
        }
      }
    }

    // Clean text and extract weight
    const cleanNumeric = parsedText.replace(/[^0-9.-]/g, '');
    const parsedWeight = parseFloat(cleanNumeric);
    const isValidNumber = !isNaN(parsedWeight) && parsedWeight >= -20 && parsedWeight <= 2000;
    const weight = isValidNumber ? parsedWeight : null;
    const isStableZero = weight === 0.0 || cleanNumeric === '0.0' || cleanNumeric === '0';

    const avgConfidence =
      digits.length > 0
        ? digits.reduce((sum, d) => sum + d.confidence, 0) / digits.length
        : 0;

    // Weight candidate ranking score:
    // Coffee scale weights have decimal points (0.1g resolution) and no colons
    let score = avgConfidence * 20;
    if (hasDecimal) score += 60; // Huge bonus: coffee scales measure 0.1g
    if (isValidNumber) score += 30;
    if (hasColon) score -= 60; // Penalty: this is a timer row like 0:00
    if (rIdx === 0 && candidateBands.length > 1) score += 10; // Top row preference for dual displays

    const boundingBox =
      maxBoxX > minBoxX && maxBoxY > minBoxY
        ? { x: minBoxX, y: minBoxY, width: maxBoxX - minBoxX, height: maxBoxY - minBoxY }
        : null;

    evaluatedRows.push({
      yStart: band.start,
      yEnd: band.end,
      weight,
      rawText: parsedText,
      confidence: avgConfidence,
      digits,
      isStableZero,
      hasDecimal,
      hasColon,
      boundingBox,
      score,
    });
  }

  // Sort rows to select the most probable coffee scale weight
  evaluatedRows.sort((a, b) => b.score - a.score);
  const best = evaluatedRows[0] || {
    weight: null,
    rawText: '',
    confidence: 0,
    digits: [],
    isStableZero: false,
    boundingBox: null,
  };

  return {
    weight: best.weight,
    rawText: best.rawText,
    confidence: best.confidence,
    digits: best.digits,
    thresholdUsed: threshold,
    isStableZero: best.isStableZero,
    boundingBox: best.boundingBox,
  };
}

/**
 * Espresso Shot Outlier Filter: Rejects single-frame steam artifacts or hand occlusions
 */
export class ScaleReadingFilter {
  private lastValidWeight: number = 0;
  private consecutiveSameCount: number = 0;

  public sanitize(
    newReading: number | null,
    deltaTimeSeconds: number
  ): { weight: number; isOutlier: boolean } {
    if (newReading === null) {
      return { weight: this.lastValidWeight, isOutlier: true };
    }

    // Maximum physically possible flow rate from an espresso pump is ~6 g/s
    // Jumps greater than 1.5g in 0.1s are optical glitches (steam / glare)
    const maxDelta = Math.max(0.5, deltaTimeSeconds * 8.0);
    const delta = Math.abs(newReading - this.lastValidWeight);

    // Initial zero tare is always accepted
    if (this.lastValidWeight === 0 && newReading <= 0.2) {
      this.lastValidWeight = newReading;
      return { weight: newReading, isOutlier: false };
    }

    if (delta > maxDelta && this.consecutiveSameCount < 3) {
      // Possible outlier - increment verification counter
      this.consecutiveSameCount++;
      return { weight: this.lastValidWeight, isOutlier: true };
    }

    // Valid reading confirmed
    this.consecutiveSameCount = 0;
    this.lastValidWeight = newReading;
    return { weight: newReading, isOutlier: false };
  }

  public reset(initialWeight: number = 0) {
    this.lastValidWeight = initialWeight;
    this.consecutiveSameCount = 0;
  }
}
