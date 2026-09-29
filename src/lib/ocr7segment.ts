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
  detectedPolarity?: 'led' | 'lcd';
  autoPolarityUsed?: 'led' | 'lcd';
  layoutType?: 'single' | 'stacked' | 'side-by-side';
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
 * Computes a 2D Integral Image (summed-area table) for O(1) constant-time local window filtering.
 */
export function computeIntegralImage(gray: Uint8Array, width: number, height: number): Int32Array {
  const S = new Int32Array((width + 1) * (height + 1));
  const sWidth = width + 1;

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
 * Converts ImageData to a high-contrast binary map with Bradley-Roth adaptive thresholding.
 * Suppresses specular spotlight glare, handles deep shadows, and automatically distinguishes LED from LCD displays.
 */
export function binarizeROI(
  imageData: ImageData,
  isDarkDigitsOnLight: boolean = false,
  useAdaptiveThreshold: boolean = true
): { binary: Uint8Array; width: number; height: number; threshold: number; detectedPolarity: 'led' | 'lcd' } {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  const gray = new Uint8Array(numPixels);

  let sumLuminance = 0;
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
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
      // Max-RGB boost ensures saturated Blue/Cyan LEDs reach full 255 intensity.
      const maxC = Math.max(r, g, b);
      gray[i] = Math.max(maxC, lum);
    }
  }

  const avgLuminance = sumLuminance / numPixels;
  const detectedPolarity: 'led' | 'lcd' = avgLuminance < 115 ? 'led' : 'lcd';
  const otsuThreshold = calculateOtsuThreshold(gray);
  const binary = new Uint8Array(numPixels);

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

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - windowRadius);
    const y2 = Math.min(height - 1, y + windowRadius);
    const rowOffset = y * width;

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - windowRadius);
      const x2 = Math.min(width - 1, x + windowRadius);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        S[(y2 + 1) * sWidth + (x2 + 1)] -
        S[y1 * sWidth + (x2 + 1)] -
        S[(y2 + 1) * sWidth + x1] +
        S[y1 * sWidth + x1];

      const localAvg = sum / count;
      const pixelVal = gray[rowOffset + x];

      if (isDarkDigitsOnLight) {
        // Classic LCD: active if locally darker than background
        // and below maximum ceiling to reject bright spotlight glare
        const isLocallyDark = pixelVal <= localAvg * 0.85;
        const isGloballyDark = pixelVal < otsuThreshold * 1.15;
        binary[rowOffset + x] = isLocallyDark && isGloballyDark ? 1 : 0;
      } else {
        // Illuminated LED: active if locally brighter than background
        // and above noise floor to reject specular glare halos
        const isLocallyBright = pixelVal >= localAvg * 1.16;
        const isAboveFloor = pixelVal >= Math.max(50, Math.floor(otsuThreshold * 0.65));
        binary[rowOffset + x] = isLocallyBright && isAboveFloor ? 1 : 0;
      }
    }
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
  overrideThreshold?: number
): boolean {
  // Italic slant compensation for typical 7-segment digital coffee displays (~6-8 degrees)
  const slantOffset = (0.5 - relY) * 0.08;
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
  // - outer horizontal bars (a,d) require 0.20
  // CRITICAL: Must satisfy BOTH minimum count AND minimum fill ratio so stray noise pixels never bypass threshold!
  const threshold = overrideThreshold ?? (orientation === 'v' ? 0.27 : orientation === 'g' ? 0.32 : 0.20);
  const minActive = Math.min(orientation === 'v' || orientation === 'g' ? 4 : 3, totalCount);
  return totalCount > 0 && activeCount >= minActive && (activeCount / totalCount >= threshold);
}

/**
 * Identifies the 7 segments of a digit bounding box with multi-variant pattern scoring
 */
function probeDigitSegments(
  binary: Uint8Array,
  canvasW: number,
  box: { x: number; y: number; width: number; height: number }
): { segments: SegmentProbeResult; matchChar: string; confidence: number } {
  // Relative probe positions cleanly centered within segments:
  // Top/bottom vertical centers at 0.30 and 0.70 to avoid bleed from horizontal bars (a at 0.07, g at 0.50, d at 0.93)
  const seg: SegmentProbeResult = {
    a: sampleSegment(binary, canvasW, box, 0.50, 0.07, 'h'), // Top horizontal
    b: sampleSegment(binary, canvasW, box, 0.88, 0.30, 'v'), // Top-Right vertical
    c: sampleSegment(binary, canvasW, box, 0.88, 0.70, 'v'), // Bottom-Right vertical
    d: sampleSegment(binary, canvasW, box, 0.50, 0.93, 'h'), // Bottom horizontal
    e: sampleSegment(binary, canvasW, box, 0.12, 0.70, 'v'), // Bottom-Left vertical
    f: sampleSegment(binary, canvasW, box, 0.12, 0.30, 'v'), // Top-Left vertical
    g: sampleSegment(binary, canvasW, box, 0.50, 0.50, 'g'), // Center horizontal (tight kernel)
  };

  // Special fast-path for digit '1':
  // In 7-segment digital displays, all digits (0, 2-9) require two vertical columns and an inner hollow space,
  // giving them an aspect ratio of width / height >= 0.50.
  // The digit '1' is the unique single-column character with a narrow aspect ratio (width / height < 0.42).
  if (box.width / box.height < 0.42 && box.height >= 12) {
    return {
      segments: { a: false, b: true, c: true, d: false, e: false, f: false, g: false },
      matchChar: '1',
      confidence: 1.0,
    };
  }

  // Probe inner hollow cavities to reject solid glares, reflections, and filled spots
  // In true 7-segment digital characters, loops have empty dark cavities between strokes
  const upperHole = sampleSegment(binary, canvasW, box, 0.50, 0.30, 'c');
  const lowerHole = sampleSegment(binary, canvasW, box, 0.50, 0.70, 'c');
  const centerHole = sampleSegment(binary, canvasW, box, 0.50, 0.50, 'c');

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
      // Disqualifications based on 7-segment topology & inner hollow cavities:
      if (digit === '1' && (seg.g || seg.a || seg.d)) continue;
      if (digit === '-' && (seg.b || seg.c || seg.e || seg.f || seg.a || seg.d)) continue;
      if (digit === '0' && (centerHole && seg.g)) continue; // '0' center must be hollow
      if (digit === '2' && (seg.c && seg.f)) continue; // '2' has NO segment c (bottom-right) or f (top-left)
      if (digit === '6' && seg.b) continue; // '6' has NO segment b (top-right)
      if (digit === '7' && (seg.d || seg.g)) continue;
      if (digit === '4' && (seg.a || seg.d || upperHole)) continue; // '4' upper cavity must be hollow
      if (digit === '3' && (seg.e || seg.f)) continue;
      if (digit === '8' && (upperHole && lowerHole)) continue; // Solid glare/blob filled in both loops is NOT an '8'!
      if (digit === '6' && lowerHole) continue; // '6' bottom loop must be hollow
      if (digit === '9' && upperHole) continue; // '9' top loop must be hollow

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

  // ── Confusable-pair disambiguation with stricter re-verification ──

  // 0 vs 8: Both share outer segments a,b,c,d,e,f.
  // The only difference is the horizontal center bar g.
  // On an espresso scale, 0 is far more common than 8 (e.g. 0.0g tare).
  // Re-verify segment g with strict threshold: if center bar is not solid, it is a '0'.
  if ((bestMatch === '8' || bestMatch === '0') && bestScore >= 0.70) {
    if (seg.a && seg.b && seg.c && seg.d && seg.e && seg.f) {
      const gStrict = sampleSegment(binary, canvasW, box, 0.50, 0.50, 'g', 0.38);
      return {
        segments: seg,
        matchChar: gStrict ? '8' : '0',
        confidence: Math.max(0.92, bestScore),
      };
    }
  }

  // 2 vs 0: Digit '2' has segments a,b,d,e,g (no c, no f).
  // Digit '0' has outer loop a,b,c,d,e,f (no g).
  // If matched as '2', but vertical segments c (bottom-right) and f (top-left) are active:
  if (bestMatch === '2' && bestScore >= 0.70) {
    const cStrict = sampleSegment(binary, canvasW, box, 0.88, 0.70, 'v', 0.28);
    const fStrict = sampleSegment(binary, canvasW, box, 0.12, 0.30, 'v', 0.28);
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
    const bStrict = sampleSegment(binary, canvasW, box, 0.88, 0.30, 'v', 0.36);
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
    const bStrict = sampleSegment(binary, canvasW, box, 0.88, 0.30, 'v', 0.32);
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
    const eStrict = sampleSegment(binary, canvasW, box, 0.12, 0.70, 'v', 0.36);
    const fStrict = sampleSegment(binary, canvasW, box, 0.12, 0.30, 'v', 0.36);
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
    const fStrict = sampleSegment(binary, canvasW, box, 0.12, 0.30, 'v', 0.36);
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
    const eStrict = sampleSegment(binary, canvasW, box, 0.12, 0.70, 'v', 0.36);
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
  // 1. Horizontal Row Projection: Find vertical row bands
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

  const candidateBands = rowBands.length > 0 ? rowBands : [{ start: 0, end: height }];
  const isStackedDual = candidateBands.length > 1;

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

    const elements: ParsedElement[] = [];
    let rowHasColon = false;

    for (const span of spans) {
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

      if (activePixels < 4) continue; // Noise artifact

      const spanW = span.end - span.start + 1;
      const spanH = spanMaxY - spanMinY + 1;

      // Decimal Point check (small blob in bottom third)
      const isNarrow = spanW <= Math.max(6, bandH * 0.35);
      const isShort = spanH <= Math.max(8, bandH * 0.38);
      const isBottom = spanMinY >= band.start + bandH * 0.48;

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
      if (spanW <= bandH * 0.45 && spanH <= bandH * 0.45 && span.start > width * 0.65) {
        // Skip isolated unit markers
        continue;
      }

      // Reject solid glares and specular reflections:
      // True 7-segment digits consist of thin strokes with hollow loops (fill density ~20-55%).
      // Solid glare spots, metal reflections, and light flares typically exceed 68% density.
      const boxArea = spanW * spanH;
      const fillDensity = activePixels / boxArea;
      if (fillDensity > 0.68 && spanW >= 8 && spanH >= 12) {
        continue;
      }

      // Reject non-character aspect ratios (too wide for a single 7-segment digit)
      if (spanW > spanH * 1.35 && spanH >= 12) {
        continue;
      }

      // 7-Segment Digit
      if (spanH >= bandH * 0.38) {
        const box = {
          x: span.start,
          y: spanMinY,
          width: spanW,
          height: spanH,
        };

        const result = probeDigitSegments(binary, width, box);
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
        const maxGap = Math.max(12, bandH * 0.55);

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

    for (const cl of clusters) {
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

      const cleanNum = clText.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleanNum);
      const valid = !isNaN(parsed) && parsed >= -20 && parsed <= 2000;
      const conf = digitsInCl.length > 0 ? digitsInCl.reduce((s, d) => s + d.confidence, 0) / digitsInCl.length : 0;

      let clScore = conf * 20;
      if (clHasDecimal) clScore += 70; // Big bonus for 0.1g coffee scale decimal
      if (valid) clScore += 30;
      if (clHasColon) clScore -= 80; // Timer penalty
      if (digitsInCl.length >= 2) clScore += 15; // Realistic multi-digit number

      evaluatedClusters.push({
        cluster: cl,
        text: clText,
        weight: valid ? parsed : null,
        hasDecimal: clHasDecimal,
        hasColon: clHasColon,
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

    let score = avgConfidence * 20;
    if (hasDec) score += 60;
    if (parsedWeight !== null) score += 30;
    if (rowHasColon && layoutType !== 'side-by-side') score -= 60; // Penalize timer-only row
    if (rIdx === 0 && candidateBands.length > 1) score += 10; // Top row bonus for stacked

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
 * Espresso Shot Outlier & Stability Filter with 3-Frame Temporal Consensus Buffer
 * Rejects steam artifacts, hand occlusions, and eliminates 1-frame micro-jitters
 */
export class ScaleReadingFilter {
  private lastValidWeight: number = 0;
  private consecutiveSameCount: number = 0;
  private recentWindow: number[] = [];

  public sanitize(
    newReading: number | null,
    deltaTimeSeconds: number
  ): { weight: number; isOutlier: boolean } {
    if (newReading === null) {
      return { weight: this.lastValidWeight, isOutlier: true };
    }

    // Always accept tare lock (0.0g - 0.2g when starting)
    if (this.lastValidWeight === 0 && newReading <= 0.2) {
      this.lastValidWeight = newReading;
      this.recentWindow = [newReading];
      return { weight: newReading, isOutlier: false };
    }

    // Maximum physically possible flow rate from an espresso extraction is ~6.0 g/s
    const maxDelta = Math.max(0.6, deltaTimeSeconds * 8.0);
    const delta = Math.abs(newReading - this.lastValidWeight);

    // Keep sliding 3-frame buffer
    this.recentWindow.push(newReading);
    if (this.recentWindow.length > 3) {
      this.recentWindow.shift();
    }

    if (delta > maxDelta && this.consecutiveSameCount < 2) {
      // Possible optical glitch or legitimate cup placement:
      // Verify whether at least 2 frames in window agree on the new reading
      if (this.recentWindow.length >= 2) {
        const lastTwoDiff = Math.abs(
          this.recentWindow[this.recentWindow.length - 1] - this.recentWindow[this.recentWindow.length - 2]
        );
        if (lastTwoDiff <= 0.2) {
          // Agreement confirmed on legitimate step change!
          this.lastValidWeight = newReading;
          this.consecutiveSameCount = 0;
          return { weight: newReading, isOutlier: false };
        }
      }
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
    this.recentWindow = [];
  }
}
