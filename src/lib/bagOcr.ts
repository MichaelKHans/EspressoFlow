import { extractDatesAndRoastFromBagText, type BagDateAndRoastExtraction } from './bagScanner';

/**
 * Preprocesses an image on an offscreen canvas to optimize Tesseract OCR:
 * Resizes to max 1200px and converts to high-contrast grayscale for dot-matrix / stamped text
 */
export function preprocessImageForOcr(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  cropArea?: { x: number; y: number; width: number; height: number },
  invert: boolean = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const sourceW = 'videoWidth' in imageElement ? (imageElement as HTMLVideoElement).videoWidth : imageElement.width;
  const sourceH = 'videoHeight' in imageElement ? (imageElement as HTMLVideoElement).videoHeight : imageElement.height;

  const sx = cropArea ? cropArea.x * sourceW : 0;
  const sy = cropArea ? cropArea.y * sourceH : 0;
  const sw = cropArea ? cropArea.width * sourceW : sourceW;
  const sh = cropArea ? cropArea.height * sourceH : sourceH;

  // Max dimension 1800px ensures small printed dot-matrix or ink stamps remain legible
  const maxDim = 1800;
  let targetW = Math.max(1, sw);
  let targetH = Math.max(1, sh);
  if (targetW > maxDim || targetH > maxDim) {
    if (targetW > targetH) {
      targetH = Math.round((targetH * maxDim) / targetW);
      targetW = maxDim;
    } else {
      targetW = Math.round((targetW * maxDim) / targetH);
      targetH = maxDim;
    }
  }

  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(imageElement as CanvasImageSource, sx, sy, sw, sh, 0, 0, targetW, targetH);

  // Apply high-contrast grayscale filter with optional inversion for dark bags with white text
  try {
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      let lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (invert) {
        lum = 255 - lum;
      }
      const contrasted = lum < 128 ? Math.max(0, lum * 0.75) : Math.min(255, lum * 1.25);
      d[i] = contrasted;
      d[i + 1] = contrasted;
      d[i + 2] = contrasted;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.debug('Canvas ImageData manipulation not allowed or failed', e);
  }

  return canvas;
}

/**
 * Runs OCR on a coffee bag image using native TextDetector or Tesseract.js in a background worker
 */
export async function scanCoffeeBagForDateAndRoast(
  imageInput: File | Blob | HTMLCanvasElement | HTMLVideoElement | HTMLImageElement
): Promise<BagDateAndRoastExtraction> {
  let sourceEl: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;

  if (imageInput instanceof HTMLCanvasElement || imageInput instanceof HTMLVideoElement || imageInput instanceof HTMLImageElement) {
    sourceEl = imageInput;
  } else {
    // File or Blob
    sourceEl = await loadImageFromFileOrBlob(imageInput);
  }

  const canvasStandard = preprocessImageForOcr(sourceEl, undefined, false);

  // 1. Try Native Browser TextDetector if available (e.g. Android Chrome Shape Detection API)
  if (typeof window !== 'undefined' && 'TextDetector' in window) {
    try {
      const TextDetectorClass = (window as unknown as { TextDetector: new () => { detect: (s: unknown) => Promise<Array<{ rawValue: string }>> } }).TextDetector;
      const detector = new TextDetectorClass();
      const detected = await detector.detect(canvasStandard);
      if (detected && detected.length > 0) {
        const rawText = detected.map((d: { rawValue: string }) => d.rawValue).join('\n');
        const parsed = extractDatesAndRoastFromBagText(rawText);
        if (parsed.roastDate || parsed.detectedRoastLevel) {
          return parsed;
        }
      }
    } catch (e) {
      console.debug('Native TextDetector failed, falling back to Tesseract.js', e);
    }
  }

  // 2. Tesseract.js OCR in Web Worker
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    
    // Pass 1: Standard high contrast
    const ret1 = await worker.recognize(canvasStandard);
    const text1 = ret1.data.text || '';
    const parsed1 = extractDatesAndRoastFromBagText(text1);

    if (parsed1.roastDate) {
      await worker.terminate();
      return parsed1;
    }

    // Pass 2: Inverted high-contrast (Crucial for black / dark bags with silver/white ink like Lavazza / Illy)
    const canvasInverted = preprocessImageForOcr(sourceEl, undefined, true);
    const ret2 = await worker.recognize(canvasInverted);
    const text2 = ret2.data.text || '';
    const parsed2 = extractDatesAndRoastFromBagText(text2);

    await worker.terminate();

    if (parsed2.roastDate) {
      return parsed2;
    }

    // If neither pass found a date, combine whatever text and roast level was seen
    const combinedRaw = `${text1}\n${text2}`;
    return extractDatesAndRoastFromBagText(combinedRaw);
  } catch (err) {
    console.warn('Tesseract OCR error:', err);
    return {
      roastDate: null,
      bestBeforeDate: null,
      isEstimatedFromBBD: false,
      detectedRoastLevel: null,
      confidence: 0,
      formatDescription: null,
      rawText: '',
    };
  }
}

function loadImageFromFileOrBlob(fileOrBlob: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}
