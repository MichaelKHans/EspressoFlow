/**
 * Preprocesses an image on an offscreen canvas to optimize optical text & date recognition:
 * Resizes and converts to high-contrast grayscale for dot-matrix, stamps and packaging fonts.
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
