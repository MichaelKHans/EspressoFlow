import { extractDatesAndRoastFromBagText, type BagDateAndRoastExtraction } from './bagScanner';

/**
 * Preprocesses an image on an offscreen canvas to optimize Tesseract OCR:
 * Resizes to max 1200px and converts to high-contrast grayscale for dot-matrix / stamped text
 */
export function preprocessImageForOcr(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  cropArea?: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const sourceW = 'videoWidth' in imageElement ? (imageElement as HTMLVideoElement).videoWidth : imageElement.width;
  const sourceH = 'videoHeight' in imageElement ? (imageElement as HTMLVideoElement).videoHeight : imageElement.height;

  const sx = cropArea ? cropArea.x * sourceW : 0;
  const sy = cropArea ? cropArea.y * sourceH : 0;
  const sw = cropArea ? cropArea.width * sourceW : sourceW;
  const sh = cropArea ? cropArea.height * sourceH : sourceH;

  const maxDim = 1200;
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
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(imageElement as CanvasImageSource, sx, sy, sw, sh, 0, 0, targetW, targetH);

  // Apply high-contrast grayscale filter for stamped dot-matrix / ink text
  try {
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const contrasted = lum < 128 ? Math.max(0, lum * 0.8) : Math.min(255, lum * 1.25);
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
  let canvas: HTMLCanvasElement;

  if (imageInput instanceof HTMLCanvasElement) {
    canvas = imageInput;
  } else if (imageInput instanceof HTMLVideoElement || imageInput instanceof HTMLImageElement) {
    canvas = preprocessImageForOcr(imageInput);
  } else {
    // File or Blob
    const img = await loadImageFromFileOrBlob(imageInput);
    canvas = preprocessImageForOcr(img);
  }

  // 1. Try Native Browser TextDetector if available (e.g. Android Chrome Shape Detection API)
  if (typeof window !== 'undefined' && 'TextDetector' in window) {
    try {
      const TextDetectorClass = (window as unknown as { TextDetector: new () => { detect: (s: unknown) => Promise<Array<{ rawValue: string }>> } }).TextDetector;
      const detector = new TextDetectorClass();
      const detected = await detector.detect(canvas);
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
    const ret = await worker.recognize(canvas);
    await worker.terminate();

    const rawText = ret.data.text || '';
    return extractDatesAndRoastFromBagText(rawText);
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
