import {
  extractDatesAndRoastFromBagText,
  type BagDateAndRoastExtraction,
  type BagExtractionContext,
} from './bagScanner';

import { preprocessImageForOcr } from './bagImageUtil';
export { preprocessImageForOcr };

/**
 * Runs OCR on a coffee bag image using native TextDetector or Tesseract.js in a background worker
 */
export async function scanCoffeeBagForDateAndRoast(
  imageInput: File | Blob | HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
  context?: BagExtractionContext
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
        const parsed = extractDatesAndRoastFromBagText(rawText, context);
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
    const parsed1 = extractDatesAndRoastFromBagText(text1, context);

    if (parsed1.roastDate) {
      await worker.terminate();
      return parsed1;
    }

    // Pass 2: Inverted high-contrast (Crucial for black / dark bags with silver/white ink like Lavazza / Illy)
    const canvasInverted = preprocessImageForOcr(sourceEl, undefined, true);
    const ret2 = await worker.recognize(canvasInverted);
    const text2 = ret2.data.text || '';
    const parsed2 = extractDatesAndRoastFromBagText(text2, context);

    await worker.terminate();

    if (parsed2.roastDate) {
      return parsed2;
    }

    // If neither pass found a date, combine whatever text and roast level was seen
    const combinedRaw = `${text1}\n${text2}`;
    return extractDatesAndRoastFromBagText(combinedRaw, context);
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
