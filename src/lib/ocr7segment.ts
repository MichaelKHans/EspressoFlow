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
}

// 7-segment bit patterns for digits 0-9
// Segments: [a, b, c, d, e, f, g]
const SEGMENT_PATTERNS: Record<string, number[]> = {
  '0': [1, 1, 1, 1, 1, 1, 0],
  '1': [0, 1, 1, 0, 0, 0, 0],
  '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1],
  '4': [0, 1, 1, 0, 0, 1, 1],
  '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1],
  '7': [1, 1, 1, 0, 0, 0, 0],
  '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1],
  '-': [0, 0, 0, 0, 0, 0, 1],
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
 * @param isDarkDigitsOnLight: true for classic LCD (grey/black), false for LED (illuminated white/red on black)
 */
export function binarizeROI(
  imageData: ImageData,
  isDarkDigitsOnLight: boolean = false
): { binary: Uint8Array; width: number; height: number; threshold: number } {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  const gray = new Uint8Array(numPixels);

  // Convert to grayscale using standard luminance weights
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    // Y = 0.299R + 0.587G + 0.114B
    gray[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
  }

  const threshold = calculateOtsuThreshold(gray);
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
 */
function sampleSegment(
  binary: Uint8Array,
  canvasW: number,
  box: { x: number; y: number; width: number; height: number },
  relX: number,
  relY: number
): boolean {
  // Sample a small 3x3 patch around the relative coordinate to reduce noise
  const centerX = Math.floor(box.x + box.width * relX);
  const centerY = Math.floor(box.y + box.height * relY);

  let activeCount = 0;
  let totalCount = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
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

  return activeCount >= 3;
}

/**
 * Identifies the 7 segments of a digit bounding box
 */
function probeDigitSegments(
  binary: Uint8Array,
  canvasW: number,
  box: { x: number; y: number; width: number; height: number }
): { segments: SegmentProbeResult; matchChar: string; confidence: number } {
  // Relative probe positions
  const seg: SegmentProbeResult = {
    a: sampleSegment(binary, canvasW, box, 0.50, 0.14), // Top
    b: sampleSegment(binary, canvasW, box, 0.84, 0.28), // Top-Right
    c: sampleSegment(binary, canvasW, box, 0.84, 0.72), // Bottom-Right
    d: sampleSegment(binary, canvasW, box, 0.50, 0.86), // Bottom
    e: sampleSegment(binary, canvasW, box, 0.16, 0.72), // Bottom-Left
    f: sampleSegment(binary, canvasW, box, 0.16, 0.28), // Top-Left
    g: sampleSegment(binary, canvasW, box, 0.50, 0.50), // Center
  };

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

  for (const [digit, pattern] of Object.entries(SEGMENT_PATTERNS)) {
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

  return {
    segments: seg,
    matchChar: bestScore >= 0.7 ? bestMatch : '?',
    confidence: bestScore,
  };
}

/**
 * Main OCR recognition routine for a scale Region-of-Interest (ROI)
 */
export function recognizeScaleDigits(
  imageData: ImageData,
  isDarkDigits: boolean = false
): OCRResult {
  const { binary, width, height, threshold } = binarizeROI(imageData, isDarkDigits);

  // Compute horizontal column projection (find digit vertical columns)
  const colCounts = new Array(width).fill(0);
  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = 0; y < height; y++) {
      if (binary[y * width + x] === 1) count++;
    }
    colCounts[x] = count;
  }

  // Find continuous column spans
  const colThreshold = Math.max(3, height * 0.05);
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
        if (x - spanStart >= 6) {
          spans.push({ start: spanStart, end: x });
        }
      }
    }
  }
  if (inSpan && width - spanStart >= 6) {
    spans.push({ start: spanStart, end: width });
  }

  // Process detected spans into character boxes
  const digits: DigitDetection[] = [];
  let parsedText = '';

  for (const span of spans) {
    const spanWidth = span.end - span.start;

    // Check if this is a decimal point (very narrow and in bottom half)
    if (spanWidth < Math.floor(height * 0.18)) {
      // Verify pixels are in bottom 30%
      let isBottomBlob = true;
      for (let y = 0; y < Math.floor(height * 0.65); y++) {
        for (let x = span.start; x <= span.end; x++) {
          if (binary[y * width + x] === 1) isBottomBlob = false;
        }
      }
      if (isBottomBlob) {
        parsedText += '.';
        continue;
      }
    }

    const box = {
      x: span.start,
      y: Math.floor(height * 0.1),
      width: spanWidth,
      height: Math.floor(height * 0.8),
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
    }
  }

  // Parse numeric weight value
  const parsedWeight = parseFloat(parsedText);
  const isValidNumber = !isNaN(parsedWeight) && parsedWeight >= 0 && parsedWeight <= 2000;
  const weight = isValidNumber ? parsedWeight : null;

  // Step 0 Tare check: 0.0 or 0
  const isStableZero = weight === 0.0 || parsedText === '0.0' || parsedText === '0';

  const avgConfidence =
    digits.length > 0
      ? digits.reduce((sum, d) => sum + d.confidence, 0) / digits.length
      : 0;

  return {
    weight,
    rawText: parsedText,
    confidence: avgConfidence,
    digits,
    thresholdUsed: threshold,
    isStableZero,
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
